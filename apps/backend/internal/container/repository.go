package container

import (
	"github.com/jackc/pgx/v5/pgxpool"

	healthrepo "github.com/robzlabz/employeebot/apps/backend/internal/modules/health/repository"
	"github.com/robzlabz/employeebot/apps/backend/internal/platform/database"
)

// Repositories aggregates the data access layer. Modules register their
// repositories here as they are implemented.
type Repositories struct {
	Health *healthrepo.Repository
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
	}
	return repositories
}
