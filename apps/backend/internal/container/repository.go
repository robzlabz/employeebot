package container

import (
	"github.com/jackc/pgx/v5/pgxpool"

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
		// The workspace repository needs the scoped helpers, so it takes the
		// pool wrapper rather than the raw connection.
		repositories.Workspace = workspacerepo.New(pool)
	}
	return repositories
}
