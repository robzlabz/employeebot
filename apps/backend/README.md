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

Deployment and region decisions: `docs/adr/0001-temporal-dan-region.md`.
Test strategy and gates: `docs/testing.md`.
