package database

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// TemplateProvisioner copies the Bolu templates into a new workspace.
//
// It is declared here, next to the transaction helpers, because the copy has to
// happen inside the onboarding transaction: a workspace must never exist
// without its agents. The module that owns agent data implements this, and the
// container hands it to the module that owns onboarding, so neither module
// imports the other's repository.
type TemplateProvisioner interface {
	// Provision creates one agent per template. It runs in the caller's
	// transaction and must be safe to call twice.
	Provision(ctx context.Context, tx pgx.Tx, workspaceID, teamID uuid.UUID) error
}

// NoopProvisioner is used when the agent module is not wired, so onboarding
// still works in a deployment without it.
type NoopProvisioner struct{}

// Provision does nothing.
func (NoopProvisioner) Provision(context.Context, pgx.Tx, uuid.UUID, uuid.UUID) error {
	return nil
}
