// Package router wires HTTP routes onto the Fiber app.
package router

import (
	"github.com/gofiber/fiber/v2"

	"github.com/robzlabz/employeebot/apps/backend/config"
	"github.com/robzlabz/employeebot/apps/backend/internal/dependency"
)

// SetupRoutes registers every route. Module routers are added here as they are
// implemented (see internal/module/auth for the first planned module).
func SetupRoutes(app *fiber.App, handlers *dependency.Handlers, cfg *config.Config) {
	registerHealthRoutes(app, handlers.Health, cfg.Http.ApiPrefix)
}
