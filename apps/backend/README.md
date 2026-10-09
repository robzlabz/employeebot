# Backend

Go modular monolith: one codebase, one Postgres, three deployable processes.

## Layout

```
cmd/
  api/                  # HTTP + WebSocket (Fiber)
  agent-worker/         # Temporal worker: the agent loop, tools, approvals
  integration-worker/   # Temporal worker: OAuth, provider APIs, webhooks
internal/
  container/            # the only place that calls constructors
  modules/<name>/       # domain · repository · service · handler
  platform/             # config, database, redis, temporal, logger, middleware,
                        # response, llm adapters
migrations/             # golang-migrate .up.sql / .down.sql, embedded in the binary
test/integration/       # cross-module tests with testcontainers-go
tools/                  # archcheck (dependency rules), migrate (schema runner)
```

Rules (checked by `make archcheck` in CI):

- `domain` imports only the standard library.
- `service` depends on domain interfaces, never on a transport or a driver.
- `handler` calls the service interface, never a repository.
- A module may only import another module's `domain`.
- `platform` holds infrastructure, never business logic.
- `container` is the single assembly point; `cmd/*` goes through it.

## Commands

```bash
make up              # full stack: postgres+pgvector, redis, temporal, api, workers
make backend         # API on the host
make test            # go test ./... (integration tests need Docker)
make cover           # tests + the 80% coverage gate
make lint            # golangci-lint
make archcheck       # dependency rules
make sqlc            # regenerate the query code
make mocks           # regenerate the domain mocks
make migrate-up      # apply migrations to $DATABASE_URL
```

## Modules

| Module | Endpoints | Notes |
| --- | --- | --- |
| `health` | `GET /health`, `GET /ready` | Liveness never touches a dependency; readiness reports each one |
| `auth` | `/api/auth/*` | Register, verify, login, refresh, logout, password reset, Google |
| `workspace` | `/api/workspaces/*`, `/api/invitations/accept` | Onboarding, members, roles, invitations |
| `agent` | `/api/agents/*`, `/api/teams` | The Bolu registry: profiles, derived status, tools, grants |

### Authentication

- Passwords are hashed with **argon2id** (64 MiB, 3 iterations, 2 lanes).
- The **access token** is a short-lived JWT (HS256) returned in the body; the
  client keeps it in memory. It carries the session id, so signing out or
  resetting a password invalidates it immediately.
- The **refresh token** lives in an `httpOnly` cookie scoped to `/api/auth`, is
  stored only as a SHA-256 hash, and is **rotated** on every refresh.
- Verification, reset, and invitation links are one-time tokens, also stored as
  hashes, with `used_at` enforcing single use.
- Repeated sign-in attempts are throttled with a Redis token bucket per address
  and per IP. A Redis outage degrades to no throttling rather than locking
  everyone out.

### Tenancy

Three middlewares guard the routes, in this order:

1. `requireUser` — verifies the access token and its session.
2. `requireVerified` — rejects an account whose email is not confirmed. It
   guards the routes that create or join tenancy.
3. `requireTenant` — reads the active workspace from `X-Workspace-Id` (or
   `?workspace_id=`), confirms the caller's membership, and stores the scope the
   handlers query with. A non-member gets **403**.

Every tenant query runs through `database.InScope`, which sets `app.user_id` and
`app.workspace_id` for the transaction. Row Level Security then filters every
statement, so a query that forgets `WHERE workspace_id = ...` still cannot read
another workspace. `workspaces` carries `owner_user_id` so a workspace can be
read back inside the transaction that creates it.

### Agent registry

- A workspace always starts with the six seeded Bolu, copied **inside the
  onboarding transaction** by the agent repository acting as the workspace
  module's `TemplateProvisioner`. A workspace can therefore never exist without
  its team.
- The display status is derived from tasks and drafts, never stored; only the
  rest switch is a column.
- A tool only reaches the model when its integration was granted to that Bolu,
  and a `read` grant keeps only the read-labelled tools.

## Configuration

Configuration is read from `internal/platform/config/config.yaml` (or
`config-local.yaml` when `ENVIRONMENT=local`) and then overridden by environment
variables. Secrets never live in the YAML files: `DATABASE_URL`, `REDIS_URL`,
`TEMPORAL_HOST_PORT`, `TEMPORAL_API_KEY`, and `JWT_SECRET` all come from the
environment. See `.env.example` at the repository root.

The API and the workers start without Postgres, Redis, or Temporal so a
developer can run one process at a time. `/health` reports liveness and never
touches a dependency; `/ready` reports each dependency and answers 503 when a
configured one is down.

Environment variables worth knowing: `JWT_SECRET` (signs access tokens **and**
the OAuth state), `FRONTEND_URL` (the base of the emailed links and the Google
callback target), `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`/`GOOGLE_REDIRECT_URL`
(Google sign-in stays disabled while they are empty), and `MAIL_DRIVER` (`log`
prints the links, `smtp` sends them).

Deployment and region decisions: `docs/adr/0001-temporal-dan-region.md`.
Test strategy and gates: `docs/testing.md`.
API contract: `docs/api.md`.

The web app routes are English: `/signup`, `/login`, `/verify`,
`/forgot-password`, `/join`, `/onboarding`, `/settings/team`.
