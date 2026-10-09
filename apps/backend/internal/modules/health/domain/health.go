// Package domain defines the health module contracts. It imports nothing but
// the standard library, so the module can be tested without a database or an
// HTTP server.
package domain

import "context"

// Component states.
const (
	StatusOK            = "ok"
	StatusUnavailable   = "unavailable"
	StatusNotConfigured = "not_configured"
)

// Component is the health state of one dependency.
type Component struct {
	Name   string `json:"name"`
	Status string `json:"status"`
	Error  string `json:"error,omitempty"`
}

// Report is the answer of a probe.
type Report struct {
	Status     string      `json:"status"`
	Components []Component `json:"components,omitempty"`
}

// Repository reports whether the database is reachable. Implemented by the
// Postgres repository.
type Repository interface {
	Ping(ctx context.Context) error
}

// Checker is the minimal contract of any optional dependency (Redis). It is
// declared here so the service never imports an infrastructure package.
type Checker interface {
	Ping(ctx context.Context) error
}

// Service answers liveness and readiness probes.
type Service interface {
	// Liveness never touches a dependency: it answers "is this process alive".
	Liveness() Report
	// Readiness checks every configured dependency.
	Readiness(ctx context.Context) Report
}
