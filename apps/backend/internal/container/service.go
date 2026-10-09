package container

import (
	healthdomain "github.com/robzlabz/employeebot/apps/backend/internal/modules/health/domain"
	healthservice "github.com/robzlabz/employeebot/apps/backend/internal/modules/health/service"
	"github.com/robzlabz/employeebot/apps/backend/internal/platform/redis"
)

// Services aggregates the business layer built on top of Repositories. Every
// field is typed as the module's domain interface, so the container is the only
// package that knows the concrete implementations.
type Services struct {
	Health healthdomain.Service
}

// newServices builds every service. Optional dependencies (Redis today) are
// passed as nil when they are not configured.
func newServices(repositories *Repositories, cache *redis.Client) *Services {
	// A nil *Repository wrapped in the domain interface is not nil, so the
	// interfaces are only assigned when the dependency really exists. Otherwise
	// the health service would call Ping on a nil repository and report the
	// database as down instead of not configured.
	var database healthdomain.Repository
	if repositories != nil && repositories.Health != nil {
		database = repositories.Health
	}

	var cacheChecker healthdomain.Checker
	if cache != nil {
		cacheChecker = cache
	}

	return &Services{
		Health: healthservice.New(database, cacheChecker),
	}
}
