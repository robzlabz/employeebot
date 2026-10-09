// Package provision copies the Bolu templates into a new workspace. EPIC 3
// (#27) implements the copy; the seam exists from EPIC 2 so onboarding does not
// change shape when it lands.
package provision

import (
	"context"

	"github.com/google/uuid"
)

// WorkspaceProvisioner is the seam onboarding calls after the workspace and its
// default teams exist.
type WorkspaceProvisioner interface {
	// Provision copies the agent templates into the workspace's Tim Bolu team.
	// It must be idempotent: onboarding may be retried.
	Provision(ctx context.Context, workspaceID, teamID uuid.UUID) error
}

// Noop does nothing and reports success. It is wired until EPIC 3 lands, so the
// onboarding flow is complete and testable today.
type Noop struct{}

// Provision reports success without copying anything.
func (Noop) Provision(context.Context, uuid.UUID, uuid.UUID) error {
	return nil
}

// Func adapts a function to the interface.
type Func func(ctx context.Context, workspaceID, teamID uuid.UUID) error

// Provision calls f.
func (f Func) Provision(ctx context.Context, workspaceID, teamID uuid.UUID) error {
	return f(ctx, workspaceID, teamID)
}

var _ WorkspaceProvisioner = Noop{}
