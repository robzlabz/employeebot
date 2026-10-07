package dependency

import "github.com/jmoiron/sqlx"

// Repositories aggregates the data access layer. Modules register their
// repositories here as they are implemented.
type Repositories struct {
	DB *sqlx.DB
}

// NewRepositories builds the repository set. db may be nil when the service
// runs without a database connection.
func NewRepositories(db *sqlx.DB) *Repositories {
	return &Repositories{DB: db}
}
