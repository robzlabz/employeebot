// Package health owns the liveness endpoints exposed at /health and
// /api/health. The check must stay independent of the database so the service
// reports healthy while Postgres is unavailable.
package health

import "github.com/gofiber/fiber/v2"

// Handler serves health probes.
type Handler struct{}

// NewHandler builds the health handler.
func NewHandler() *Handler {
	return &Handler{}
}

// Check reports service liveness.
func (h *Handler) Check(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"status": "ok"})
}
