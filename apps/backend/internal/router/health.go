package router

import (
	"github.com/gofiber/fiber/v2"

	"github.com/robzlabz/employeebot/apps/backend/internal/module/health"
)

// registerHealthRoutes exposes the liveness probe on both the root path and the
// configured API prefix.
func registerHealthRoutes(app *fiber.App, handler *health.Handler, apiPrefix string) {
	app.Get("/health", handler.Check)
	app.Group(apiPrefix).Get("/health", handler.Check)
}
