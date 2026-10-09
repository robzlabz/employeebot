package container

import (
	"github.com/jackc/pgx/v5/pgxpool"

	agentrepo "github.com/robzlabz/employeebot/apps/backend/internal/modules/agent/repository"
	authrepo "github.com/robzlabz/employeebot/apps/backend/internal/modules/auth/repository"
	healthrepo "github.com/robzlabz/employeebot/apps/backend/internal/modules/health/repository"
	workspacerepo "github.com/robzlabz/employeebot/apps/backend/internal/modules/workspace/repository"
	"github.com/robzlabz/employeebot/apps/backend/internal/platform/database"
)

// Repositories aggregates the data access layer. Modules register their
// repositories here as they are implemented.
type Repositories struct {
	Health    *healthrepo.Repository
	Auth      *authrepo.Repository
	Workspace *workspacerepo.Repository
	Agent     *agentrepo.Repository
}

// newRepositories builds every repository. When there is no pool the
// repositories are nil, which the services report as "not configured" instead
// of as a failure: the API must stay usable while Postgres is down.
func newRepositories(pool *database.Pool) *Repositories {
	var pgxPool *pgxpool.Pool
	if pool != nil {
		pgxPool = pool.PgxPool()
	}

	repositories := &Repositories{}
	if pgxPool != nil {
		repositories.Health = healthrepo.New(pgxPool)
		repositories.Auth = authrepo.New(pgxPool)
	}
	if pool != nil {
		// The agent repository needs the scoped helpers, so it takes the pool
		// wrapper rather than the raw connection.
		repositories.Agent = agentrepo.New(pool)

		// The workspace repository is handed the agent repository as its
		// provisioner: onboarding copies the Bolu templates inside its own
		// transaction, and this is the only place that knows both modules.
		repositories.Workspace = workspacerepo.New(pool, repositories.Agent)
	}
	return repositories
}
