# API contract — identity and tenancy (EPIC 2)

Base URL: `{API_URL}/api`. Every response uses the envelope
`{"success":bool,"message":string,"data":…,"error":{…}}`.

## Authentication

| Endpoint | Auth | Body | Success | Errors |
| --- | --- | --- | --- | --- |
| `POST /auth/register` | — | `{email, password}` | `201` account | `400` invalid input / weak password, `409` email taken |
| `POST /auth/verify-email` | — | `{token}` | `200` account | `400` token invalid, expired, or used |
| `POST /auth/resend-verification` | — | `{email}` | `200` always | — |
| `POST /auth/login` | — | `{email, password}` | `200` session | `401` bad credentials, `429` too many attempts |
| `POST /auth/refresh` | cookie | `{token}` optional | `200` session | `400` token invalid or revoked |
| `POST /auth/logout` | cookie | — | `200` always | — |
| `POST /auth/password/forgot` | — | `{email}` | `200` always | — |
| `POST /auth/password/reset` | — | `{token, password}` | `200` | `400` token invalid / weak password |
| `GET /auth/google/start` | — | — | `302` to Google | `503` not configured |
| `GET /auth/google/callback` | — | `?code&state` | `302` to `{FRONTEND_URL}/masuk\|onboarding` | redirects with `?google_error=1` |
| `GET /auth/me` | bearer | — | `200` account | `401` |

**Session payload**

```json
{
  "access_token": "…",
  "access_expires_at": "2026-10-09T12:15:00Z",
  "refresh_expires_at": "2026-11-08T12:00:00Z",
  "user": {
    "id": "…", "email": "owner@example.com",
    "email_verified": true, "onboarded": true,
    "has_password": true, "has_google": false
  }
}
```

The refresh token is **not** in the body: it is set as an `httpOnly` cookie named
`bolu_refresh`, scoped to `/api/auth`, `SameSite=Lax`, `Secure` outside local
development.

Two endpoints answer identically whether or not the address exists
(`resend-verification`, `password/forgot`), so they cannot be used to discover
accounts.

## Tenancy

`X-Workspace-Id` (or `?workspace_id=`) selects the active workspace. The value
must be a UUID, and the caller must be a member, otherwise the answer is `403`.

| Endpoint | Auth | Role | Notes |
| --- | --- | --- | --- |
| `GET /workspaces` | bearer | any | Every workspace the account belongs to, with its role |
| `POST /workspaces/onboard` | bearer + verified | any | Creates workspace + owner + Tim Bolu + Tim Hore; **idempotent** |
| `POST /invitations/accept` | bearer + verified | any | Joins the invited workspace; the signed-in email must match |
| `GET /workspaces/current` | bearer + tenant | any | The active workspace |
| `PATCH /workspaces/current` | bearer + tenant | owner | Name, business field, timezone |
| `GET /workspaces/current/teams` | bearer + tenant | any | Tim Bolu and Tim Hore |
| `GET /workspaces/current/members` | bearer + tenant | any | Members with roles |
| `PATCH /workspaces/current/members/:userID` | bearer + tenant | owner, admin | Change a role |
| `DELETE /workspaces/current/members/:userID` | bearer + tenant | owner, admin | Remove a member |
| `GET /workspaces/current/invitations` | bearer + tenant | any | Pending invitations |
| `POST /workspaces/current/invitations` | bearer + tenant | owner, admin | `{email, role}` |
| `DELETE /workspaces/current/invitations/:invitationID` | bearer + tenant | owner, admin | Revoke |

## Role matrix

| Action | member | admin | owner |
| --- | --- | --- | --- |
| Read workspace, teams, members, invitations | ✅ | ✅ | ✅ |
| Invite a member (role `member`/`admin`) | ❌ | ✅ | ✅ |
| Invite an owner | ❌ | ❌ | ✅ |
| Change a role / remove a member | ❌ | ✅ (not an owner) | ✅ |
| Grant or revoke the owner role | ❌ | ❌ | ✅ |
| Change workspace settings | ❌ | ❌ | ✅ |
| Remove the last owner | ❌ | ❌ | ❌ |
| Remove yourself | ❌ | ❌ | ❌ |

## Error codes

| Code | Status | Meaning |
| --- | --- | --- |
| `invalid_request` | 400 | Malformed body |
| `invalid_input` | 400 | A field is wrong (blank name, unknown timezone, bad address) |
| `weak_password` | 400 | Password policy not met |
| `invalid_token` | 400 | Token unknown, expired, or already used |
| `invalid_invitation` | 400 | Invitation unknown, expired, or already accepted |
| `unauthenticated` | 401 | Missing, malformed, expired, or revoked access token |
| `invalid_credentials` | 401 | Wrong email or password |
| `forbidden` | 403 | Role does not allow the action |
| `not_a_member` | 403 | Caller is not a member of the named workspace |
| `email_not_verified` | 403 | The account must verify its email first |
| `invitation_email_mismatch` | 403 | Sign in with the invited address |
| `user_not_found` | 404 | No such account |
| `workspace_not_found` | 404 | No such workspace |
| `member_not_found` | 404 | No such member |
| `email_taken` | 409 | Address already registered |
| `last_owner` | 409 | A workspace must keep at least one owner |
| `cannot_remove_yourself` | 409 | Use leave instead |
| `invitation_pending` | 409 | An invitation for this address is already pending |
| `too_many_attempts` | 429 | Login throttle |
| `auth_not_configured` / `workspace_not_configured` | 503 | Module not wired (no database) |
| `google_not_configured` | 503 | Google client not configured |
