// Package handler exposes the health module over HTTP. It talks to the domain
// service interface only.
package handler

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"

	"github.com/robzlabz/employeebot/apps/backend/internal/modules/health/domain"
	"github.com/robzlabz/employeebot/apps/backend/internal/platform/response"
)

// Handler serves the probes.
type Handler struct {
	service domain.Service
	log     *zap.Logger
}

// New builds the handler.
func New(service domain.Service, log *zap.Logger) *Handler {
	return &Handler{service: service, log: log}
}

// Live answers "is the process alive". It never touches a dependency, so a
// database outage does not restart the container.
func (h *Handler) Live(c *fiber.Ctx) error {
	return response.OK(c, "alive", h.service.Liveness())
}

// Ready answers "can this process serve traffic". Every configured dependency
// is checked; a failure returns 503 with the per-component detail.
func (h *Handler) Ready(c *fiber.Ctx) error {
	report := h.service.Readiness(c.UserContext())
	if report.Status != domain.StatusOK {
		h.log.Warn("readiness check failed", zap.String("report", reportSummary(report)))
		return response.Error(c, fiber.StatusServiceUnavailable, "not ready", "not_ready", report)
	}
	return response.OK(c, "ready", report)
}

func reportSummary(report domain.Report) string {
	parts := make([]string, 0, len(report.Components))
	for _, component := range report.Components {
		parts = append(parts, component.Name+"="+component.Status)
	}
	return strings.Join(parts, " ")
}

// Routes registers the probes on both the root path and the configured API
// prefix, so container health checks and the frontend can use the same host.
func Routes(app *fiber.App, h *Handler, apiPrefix string) {
	app.Get("/health", h.Live)
	app.Get("/ready", h.Ready)

	group := app.Group(apiPrefix)
	group.Get("/health", h.Live)
	group.Get("/ready", h.Ready)
}
