package container

import (
	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"

	"github.com/robzlabz/employeebot/apps/backend/internal/modules/health/handler"
)

// Handlers aggregates the HTTP handlers wired into the router.
type Handlers struct {
	Health *handler.Handler
}

// newHandlers builds every handler from the service set. Handlers receive the
// logger through the constructor, never from a package variable.
func newHandlers(services *Services, log *zap.Logger) *Handlers {
	return &Handlers{
		Health: handler.New(services.Health, log),
	}
}

// registerRoutes mounts every module router. Modules are added here as their
// handlers land; this is the only place that knows the URL layout.
func registerRoutes(app *fiber.App, handlers *Handlers, apiPrefix string) {
	handler.Routes(app, handlers.Health, apiPrefix)
}
