package dependency

import "github.com/robzlabz/employeebot/apps/backend/internal/module/health"

// Handlers aggregates the HTTP handlers wired into the router.
type Handlers struct {
	Health *health.Handler
}

// NewHandlers builds the handler set.
func NewHandlers(_ *Services) *Handlers {
	return &Handlers{
		Health: health.NewHandler(),
	}
}
