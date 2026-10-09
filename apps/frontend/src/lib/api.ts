/**
 * API client for the Bolu backend.
 *
 * Two details matter here:
 * - every request sends credentials, because the refresh token lives in an
 *   httpOnly cookie that JavaScript must not read;
 * - the access token is kept in memory only. A reload calls /auth/refresh,
 *   which reads the cookie and returns a fresh access token.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export type ApiError = {
  ok: false;
  status: number;
  message: string;
  code?: string;
};

export type ApiSuccess<T> = {
  ok: true;
  status: number;
  data: T;
};

export type ApiResult<T> = ApiSuccess<T> | ApiError;

export type User = {
  id: string;
  email: string;
  email_verified: boolean;
  onboarded: boolean;
  has_password: boolean;
  has_google: boolean;
};

export type Session = {
  access_token: string;
  access_expires_at: string;
  refresh_expires_at: string;
  user: User;
};

export type Workspace = {
  id: string;
  name: string;
  business_field: string;
  timezone: string;
  language: string;
  role?: string;
  created_at: string;
};

export type Team = {
  id: string;
  name: string;
  kind: string;
};

export type Member = {
  user_id: string;
  email: string;
  role: string;
  email_verified: boolean;
  joined_at: string;
};

export type Invitation = {
  id: string;
  email: string;
  role: string;
  expires_at: string;
  invited_at: string;
  workspace_id?: string;
};

export type OnboardResult = {
  workspace: Workspace;
  teams: Team[];
  created: boolean;
};

/** The workspace the user picked, remembered across reloads. */
const WORKSPACE_KEY = "bolu.workspace_id";

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getActiveWorkspaceId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(WORKSPACE_KEY);
}

export function setActiveWorkspaceId(workspaceId: string): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(WORKSPACE_KEY, workspaceId);
}

export function clearActiveWorkspaceId(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(WORKSPACE_KEY);
}

type Envelope<T> = {
  success: boolean;
  message: string;
  data?: T;
  error?: { code?: string; details?: unknown };
};

type RequestOptions = {
  method?: string;
  body?: unknown;
  /** Sends the active workspace header, for tenant-scoped endpoints. */
  workspace?: string | null;
  /** Sends the in-memory access token as a bearer token. */
  authenticated?: boolean;
};

/** request performs one API call and normalises the envelope. */
async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiResult<T>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (options.authenticated !== false && accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  if (options.workspace) {
    headers["X-Workspace-Id"] = options.workspace;
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}/api${path}`, {
      method: options.method ?? "GET",
      headers,
      credentials: "include",
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: "no-store",
    });
  } catch {
    return {
      ok: false,
      status: 0,
      message: "Tidak bisa menghubungi server. Cek koneksimu lalu coba lagi.",
    };
  }

  const text = await response.text();
  let envelope: Envelope<T> | null = null;
  if (text) {
    try {
      envelope = JSON.parse(text) as Envelope<T>;
    } catch {
      envelope = null;
    }
  }

  if (!response.ok || !envelope?.success) {
    return {
      ok: false,
      status: response.status,
      message: envelope?.message ?? "Terjadi kesalahan. Coba lagi sebentar.",
      code: envelope?.error?.code,
    };
  }

  return { ok: true, status: response.status, data: envelope.data as T };
}

/** register creates a password account and emails a verification link. */
export function register(email: string, password: string): Promise<ApiResult<User>> {
  return request<User>("/auth/register", { method: "POST", body: { email, password }, authenticated: false });
}

/** verifyEmail consumes the one-time verification token. */
export function verifyEmail(token: string): Promise<ApiResult<User>> {
  return request<User>("/auth/verify-email", { method: "POST", body: { token }, authenticated: false });
}

/** resendVerification asks for a new verification link. */
export function resendVerification(email: string): Promise<ApiResult<null>> {
  return request<null>("/auth/resend-verification", { method: "POST", body: { email }, authenticated: false });
}

/** login signs in and stores the access token in memory. */
export async function login(email: string, password: string): Promise<ApiResult<Session>> {
  const result = await request<Session>("/auth/login", { method: "POST", body: { email, password }, authenticated: false });
  if (result.ok) {
    setAccessToken(result.data.access_token);
  }
  return result;
}

/** refreshSession exchanges the refresh cookie for a new access token. */
export async function refreshSession(): Promise<ApiResult<Session>> {
  const result = await request<Session>("/auth/refresh", { method: "POST", authenticated: false });
  if (result.ok) {
    setAccessToken(result.data.access_token);
  }
  return result;
}

/** logout revokes the session and clears the cookie. */
export async function logout(): Promise<ApiResult<null>> {
  const result = await request<null>("/auth/logout", { method: "POST" });
  setAccessToken(null);
  clearActiveWorkspaceId();
  return result;
}

/** forgotPassword emails a reset link. */
export function forgotPassword(email: string): Promise<ApiResult<null>> {
  return request<null>("/auth/password/forgot", { method: "POST", body: { email }, authenticated: false });
}

/** resetPassword consumes the reset token and stores the new password. */
export function resetPassword(token: string, password: string): Promise<ApiResult<null>> {
  return request<null>("/auth/password/reset", { method: "POST", body: { token, password }, authenticated: false });
}

/** currentUser returns the signed-in account. */
export function currentUser(): Promise<ApiResult<User>> {
  return request<User>("/auth/me");
}

/** googleStartURL is where the browser goes to sign in with Google. */
export function googleStartURL(): string {
  return `${API_URL}/api/auth/google/start`;
}

/** onboard creates the workspace and returns it with the two default teams. */
export function onboard(input: {
  name: string;
  business_field: string;
  timezone: string;
}): Promise<ApiResult<OnboardResult>> {
  return request<OnboardResult>("/workspaces/onboard", { method: "POST", body: input });
}

/** listWorkspaces returns every workspace the account belongs to. */
export function listWorkspaces(): Promise<ApiResult<Workspace[]>> {
  return request<Workspace[]>("/workspaces");
}

/** currentWorkspace returns the active workspace. */
export function currentWorkspace(workspaceId: string): Promise<ApiResult<Workspace>> {
  return request<Workspace>("/workspaces/current", { workspace: workspaceId });
}

/** updateWorkspace changes the workspace profile (owner only). */
export function updateWorkspace(
  workspaceId: string,
  input: { name: string; business_field: string; timezone: string },
): Promise<ApiResult<Workspace>> {
  return request<Workspace>("/workspaces/current", { method: "PATCH", body: input, workspace: workspaceId });
}

/** listTeams returns the teams of the active workspace. */
export function listTeams(workspaceId: string): Promise<ApiResult<Team[]>> {
  return request<Team[]>("/workspaces/current/teams", { workspace: workspaceId });
}

/** listMembers returns the members of the active workspace. */
export function listMembers(workspaceId: string): Promise<ApiResult<Member[]>> {
  return request<Member[]>("/workspaces/current/members", { workspace: workspaceId });
}

/** setMemberRole changes a member's role. */
export function setMemberRole(workspaceId: string, userId: string, role: string): Promise<ApiResult<Member>> {
  return request<Member>(`/workspaces/current/members/${userId}`, {
    method: "PATCH",
    body: { role },
    workspace: workspaceId,
  });
}

/** removeMember removes a member from the active workspace. */
export function removeMember(workspaceId: string, userId: string): Promise<ApiResult<null>> {
  return request<null>(`/workspaces/current/members/${userId}`, { method: "DELETE", workspace: workspaceId });
}

/** listInvitations returns the pending invitations of the active workspace. */
export function listInvitations(workspaceId: string): Promise<ApiResult<Invitation[]>> {
  return request<Invitation[]>("/workspaces/current/invitations", { workspace: workspaceId });
}

/** invite sends an invitation to join the active workspace. */
export function invite(workspaceId: string, email: string, role: string): Promise<ApiResult<Invitation>> {
  return request<Invitation>("/workspaces/current/invitations", {
    method: "POST",
    body: { email, role },
    workspace: workspaceId,
  });
}

/** revokeInvitation deletes a pending invitation. */
export function revokeInvitation(workspaceId: string, invitationId: string): Promise<ApiResult<null>> {
  return request<null>(`/workspaces/current/invitations/${invitationId}`, {
    method: "DELETE",
    workspace: workspaceId,
  });
}

/** acceptInvitation joins the signed-in account to the inviting workspace. */
export function acceptInvitation(token: string): Promise<ApiResult<Workspace>> {
  return request<Workspace>("/invitations/accept", { method: "POST", body: { token } });
}

export { API_URL };

// ---------------------------------------------------------------- agent registry

export type Agent = {
  id: string;
  team_id: string;
  team_name: string;
  team_kind: string;
  name: string;
  role: string;
  persona: string;
  tone: string;
  shape: string;
  color: string;
  /** The stored switch: active or resting. */
  status: string;
  /** Derived from tasks and drafts, never stored: working | waiting | idle | resting. */
  display_status: string;
  reason?: { kind: string; id: string; title?: string; status?: string; created_at: string };
  template_key?: string;
  tools: string[];
  default_model: Record<string, unknown>;
  created_at: string;
};

export type AgentTeam = {
  id: string;
  name: string;
  kind: string;
  agents: Agent[];
};

export type AgentTemplate = {
  key: string;
  name: string;
  role: string;
  persona: string;
  tone: string;
  shape: string;
  color: string;
  tools: string[];
  integrations: string[];
};

export type Tool = {
  name: string;
  integration_app: string;
  label: string;
  description: string;
};

export type Grant = {
  id: string;
  agent_id: string;
  integration_id: string;
  app: string;
  account_label: string;
  status: string;
  permission: string;
};

export type Integration = {
  id: string;
  app: string;
  account_label: string;
  status: string;
};

/** listAgentTeams returns Tim Bolu and Tim Hore with their agents. */
export function listAgentTeams(workspaceId: string): Promise<ApiResult<AgentTeam[]>> {
  return request<AgentTeam[]>("/teams", { workspace: workspaceId });
}

/** listTemplates returns the seeded Bolu profiles. */
export function listTemplates(): Promise<ApiResult<AgentTemplate[]>> {
  return request<AgentTemplate[]>("/agents/templates");
}

/** listIntegrations returns the workspace's connected applications. */
export function listIntegrations(workspaceId: string): Promise<ApiResult<Integration[]>> {
  return request<Integration[]>("/agents/integrations", { workspace: workspaceId });
}

/** createAgent adds a Bolu, from a template, from a copy, or from scratch. */
export function createAgent(
  workspaceId: string,
  input: { team_id: string; name?: string; template_key?: string; copy_from?: string; persona?: string; role?: string },
): Promise<ApiResult<Agent>> {
  return request<Agent>("/agents", { method: "POST", body: input, workspace: workspaceId });
}

/** updateAgent edits a Bolu profile. */
export function updateAgent(
  workspaceId: string,
  agentId: string,
  input: { name: string; role?: string; persona?: string; tone?: string; tools?: string[] },
): Promise<ApiResult<Agent>> {
  return request<Agent>(`/agents/${agentId}`, { method: "PATCH", body: input, workspace: workspaceId });
}

/** setAgentStatus flips the rest switch. */
export function setAgentStatus(workspaceId: string, agentId: string, status: string): Promise<ApiResult<Agent>> {
  return request<Agent>(`/agents/${agentId}/status`, { method: "PATCH", body: { status }, workspace: workspaceId });
}

/** deleteAgent removes a Bolu from the registry, keeping its history. */
export function deleteAgent(workspaceId: string, agentId: string): Promise<ApiResult<null>> {
  return request<null>(`/agents/${agentId}`, { method: "DELETE", workspace: workspaceId });
}

/** listAgentGrants returns the integrations one Bolu may use. */
export function listAgentGrants(workspaceId: string, agentId: string): Promise<ApiResult<Grant[]>> {
  return request<Grant[]>(`/agents/${agentId}/grants`, { workspace: workspaceId });
}

/** setAgentGrant gives a Bolu read or read-write access to an integration. */
export function setAgentGrant(
  workspaceId: string,
  agentId: string,
  integrationId: string,
  permission: string,
): Promise<ApiResult<Grant>> {
  return request<Grant>(`/agents/${agentId}/grants`, {
    method: "PUT",
    body: { integration_id: integrationId, permission },
    workspace: workspaceId,
  });
}

/** listAgentTools returns the tools a Bolu may actually call. */
export function listAgentTools(workspaceId: string, agentId: string): Promise<ApiResult<Tool[]>> {
  return request<Tool[]>(`/agents/${agentId}/tools`, { workspace: workspaceId });
}
