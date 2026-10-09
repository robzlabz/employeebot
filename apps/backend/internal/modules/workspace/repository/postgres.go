// Package repository implements the workspace data access with pgx and the
// sqlc-generated queries. Every method runs inside the caller's scope, so Row
// Level Security filters the statements even if a query forgets a filter.
package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"

	"github.com/robzlabz/employeebot/apps/backend/internal/modules/workspace/domain"
	"github.com/robzlabz/employeebot/apps/backend/internal/modules/workspace/repository/sqlcgen"
	"github.com/robzlabz/employeebot/apps/backend/internal/platform/database"
)

const uniqueViolation = "23505"

// Default teams created with every workspace.
const (
	teamBolu = "Tim Bolu"
	teamHore = "Tim Hore"
)

// TemplateProvisioner copies the Bolu templates into a new workspace, inside the
// onboarding transaction. It is declared here rather than in the domain because
// its signature carries a transaction handle, which is an infrastructure type;
// the container hands over the agent module's repository.
type TemplateProvisioner interface {
	Provision(ctx context.Context, tx pgx.Tx, workspaceID, teamID uuid.UUID) error
}

// Repository is the Postgres-backed implementation of domain.Repository.
type Repository struct {
	pool *database.Pool
	// provisioner copies the Bolu templates inside the onboarding transaction.
	// It is the agent module's repository, handed over by the container so this
	// module never imports it.
	provisioner TemplateProvisioner
}

// New builds the repository. A nil provisioner leaves a new workspace without
// its Bolu, which is what a deployment without the agent module looks like.
func New(pool *database.Pool, provisioner TemplateProvisioner) *Repository {
	return &Repository{pool: pool, provisioner: provisioner}
}

// Onboard creates the workspace, its owner membership and the two default teams
// in one transaction. It is idempotent: a caller who already owns a workspace
// gets that workspace back instead of a second one.
func (r *Repository) Onboard(ctx context.Context, userID uuid.UUID, req domain.OnboardRequest) (domain.OnboardResult, error) {
	if r == nil || r.pool == nil {
		return domain.OnboardResult{}, fmt.Errorf("workspace: database is not configured")
	}

	scope := database.Scope{UserID: userID}
	var result domain.OnboardResult

	err := r.pool.InScope(ctx, scope, func(tx pgx.Tx) error {
		queries := sqlcgen.New(tx)

		existing, err := queries.GetOwnedWorkspaceForUser(ctx, &userID)
		switch {
		case err == nil:
			// Already onboarded: return the workspace and its teams unchanged.
			if err := database.SetWorkspace(ctx, tx, existing.ID); err != nil {
				return err
			}
			teams, err := queries.ListTeams(ctx, existing.ID)
			if err != nil {
				return fmt.Errorf("workspace: list teams: %w", err)
			}
			result = domain.OnboardResult{
				Workspace: toWorkspace(existing, domain.RoleOwner),
				Teams:     toTeams(teams),
				Created:   false,
			}
			return nil
		case errors.Is(err, pgx.ErrNoRows):
			// No workspace yet: fall through and create one.
		default:
			return fmt.Errorf("workspace: look up owned workspace: %w", err)
		}

		created, err := queries.CreateWorkspace(ctx, sqlcgen.CreateWorkspaceParams{
			Name:          req.Name,
			BusinessField: req.BusinessField,
			Timezone:      req.Timezone,
			OwnerUserID:   &userID,
		})
		if err != nil {
			return fmt.Errorf("workspace: create workspace: %w", err)
		}

		// The rows that follow belong to the new workspace, so the tenant
		// context is activated before they are written.
		if err := database.SetWorkspace(ctx, tx, created.ID); err != nil {
			return err
		}

		if _, err := queries.CreateMember(ctx, sqlcgen.CreateMemberParams{
			WorkspaceID: created.ID,
			UserID:      userID,
			Role:        domain.RoleOwner,
		}); err != nil {
			return fmt.Errorf("workspace: create owner membership: %w", err)
		}

		teams := make([]sqlcgen.Team, 0, 2)
		var boluTeamID uuid.UUID
		for _, team := range []struct {
			name string
			kind string
		}{
			{teamBolu, "bolu"},
			{teamHore, "hore"},
		} {
			createdTeam, err := queries.CreateTeam(ctx, sqlcgen.CreateTeamParams{
				WorkspaceID: created.ID,
				Name:        team.name,
				Kind:        team.kind,
			})
			if err != nil {
				return fmt.Errorf("workspace: create team %s: %w", team.name, err)
			}
			if team.kind == "bolu" {
				boluTeamID = createdTeam.ID
			}
			teams = append(teams, createdTeam)
		}

		// The Bolu templates are copied inside this transaction, so a workspace
		// never exists without its team.
		if r.provisioner != nil {
			if err := r.provisioner.Provision(ctx, tx, created.ID, boluTeamID); err != nil {
				return err
			}
		}

		result = domain.OnboardResult{
			Workspace: toWorkspace(created, domain.RoleOwner),
			Teams:     toTeams(teams),
			Created:   true,
		}
		return nil
	})
	if err != nil {
		return domain.OnboardResult{}, err
	}

	return result, nil
}

// Workspaces lists the workspaces the user belongs to, with their role.
func (r *Repository) Workspaces(ctx context.Context, userID uuid.UUID) ([]domain.Workspace, error) {
	if r == nil || r.pool == nil {
		return nil, fmt.Errorf("workspace: database is not configured")
	}

	var workspaces []domain.Workspace
	err := r.pool.InScopeRead(ctx, database.Scope{UserID: userID}, func(tx pgx.Tx) error {
		rows, err := sqlcgen.New(tx).ListWorkspacesForUser(ctx, userID)
		if err != nil {
			return fmt.Errorf("workspace: list workspaces: %w", err)
		}
		workspaces = make([]domain.Workspace, 0, len(rows))
		for _, row := range rows {
			workspaces = append(workspaces, domain.Workspace{
				ID:            row.ID,
				Name:          row.Name,
				BusinessField: row.BusinessField,
				Timezone:      row.Timezone,
				Language:      row.Language,
				Role:          row.Role,
				CreatedAt:     row.CreatedAt,
			})
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	return workspaces, nil
}

// Workspace reads one workspace inside the caller's scope.
func (r *Repository) Workspace(ctx context.Context, scope domain.Scope) (domain.Workspace, error) {
	var workspace domain.Workspace

	err := r.read(ctx, scope, func(queries *sqlcgen.Queries) error {
		row, err := queries.GetWorkspace(ctx, scope.WorkspaceID)
		if err != nil {
			return mapNotFound(err, "get workspace")
		}
		workspace = toWorkspace(row, "")
		return nil
	})
	if err != nil {
		return domain.Workspace{}, err
	}

	return workspace, nil
}

// UpdateWorkspace changes the workspace profile.
func (r *Repository) UpdateWorkspace(ctx context.Context, scope domain.Scope, req domain.UpdateRequest) (domain.Workspace, error) {
	var workspace domain.Workspace

	err := r.write(ctx, scope, func(queries *sqlcgen.Queries) error {
		row, err := queries.UpdateWorkspace(ctx, sqlcgen.UpdateWorkspaceParams{
			ID:            scope.WorkspaceID,
			Name:          req.Name,
			BusinessField: req.BusinessField,
			Timezone:      req.Timezone,
		})
		if err != nil {
			return mapNotFound(err, "update workspace")
		}
		workspace = toWorkspace(row, "")
		return nil
	})
	if err != nil {
		return domain.Workspace{}, err
	}

	return workspace, nil
}

// Teams lists the teams of the active workspace.
func (r *Repository) Teams(ctx context.Context, scope domain.Scope) ([]domain.Team, error) {
	var teams []domain.Team

	err := r.read(ctx, scope, func(queries *sqlcgen.Queries) error {
		rows, err := queries.ListTeams(ctx, scope.WorkspaceID)
		if err != nil {
			return fmt.Errorf("workspace: list teams: %w", err)
		}
		teams = toTeams(rows)
		return nil
	})
	if err != nil {
		return nil, err
	}

	return teams, nil
}

// Membership returns the caller's role in the workspace, or ErrNotMember.
func (r *Repository) Membership(ctx context.Context, scope domain.Scope, userID uuid.UUID) (string, error) {
	var role string

	err := r.read(ctx, scope, func(queries *sqlcgen.Queries) error {
		member, err := queries.GetMembership(ctx, sqlcgen.GetMembershipParams{
			WorkspaceID: scope.WorkspaceID,
			UserID:      userID,
		})
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return domain.ErrNotMember
			}
			return fmt.Errorf("workspace: get membership: %w", err)
		}
		role = member.Role
		return nil
	})
	if err != nil {
		return "", err
	}

	return role, nil
}

// Members lists the members of the active workspace.
func (r *Repository) Members(ctx context.Context, scope domain.Scope) ([]domain.Member, error) {
	var members []domain.Member

	err := r.read(ctx, scope, func(queries *sqlcgen.Queries) error {
		rows, err := queries.ListMembers(ctx, scope.WorkspaceID)
		if err != nil {
			return fmt.Errorf("workspace: list members: %w", err)
		}
		members = make([]domain.Member, 0, len(rows))
		for _, row := range rows {
			members = append(members, domain.Member{
				UserID:        row.UserID,
				Email:         row.Email,
				Role:          row.Role,
				EmailVerified: row.EmailVerifiedAt != nil,
				CreatedAt:     row.CreatedAt,
			})
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	return members, nil
}

// SetRole changes a member's role, refusing to demote the last owner.
func (r *Repository) SetRole(ctx context.Context, scope domain.Scope, userID uuid.UUID, role string) (domain.Member, error) {
	var member domain.Member

	err := r.write(ctx, scope, func(queries *sqlcgen.Queries) error {
		current, err := queries.GetMembership(ctx, sqlcgen.GetMembershipParams{
			WorkspaceID: scope.WorkspaceID,
			UserID:      userID,
		})
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return domain.ErrMemberNotFound
			}
			return fmt.Errorf("workspace: get membership: %w", err)
		}

		if current.Role == domain.RoleOwner && role != domain.RoleOwner {
			owners, err := queries.CountOwners(ctx, scope.WorkspaceID)
			if err != nil {
				return fmt.Errorf("workspace: count owners: %w", err)
			}
			if owners <= 1 {
				return domain.ErrLastOwner
			}
		}

		if _, err := queries.UpdateMemberRole(ctx, sqlcgen.UpdateMemberRoleParams{
			WorkspaceID: scope.WorkspaceID,
			UserID:      userID,
			Role:        role,
		}); err != nil {
			return mapNotFound(err, "update member role")
		}

		detail, err := queries.GetMemberDetail(ctx, sqlcgen.GetMemberDetailParams{
			WorkspaceID: scope.WorkspaceID,
			UserID:      userID,
		})
		if err != nil {
			return mapNotFound(err, "load member detail")
		}

		member = domain.Member{
			UserID:        detail.UserID,
			Email:         detail.Email,
			Role:          detail.Role,
			EmailVerified: detail.EmailVerifiedAt != nil,
			CreatedAt:     detail.CreatedAt,
		}
		return nil
	})
	if err != nil {
		return domain.Member{}, err
	}

	return member, nil
}

// RemoveMember deletes a membership, refusing to remove the last owner.
func (r *Repository) RemoveMember(ctx context.Context, scope domain.Scope, userID uuid.UUID) error {
	return r.write(ctx, scope, func(queries *sqlcgen.Queries) error {
		current, err := queries.GetMembership(ctx, sqlcgen.GetMembershipParams{
			WorkspaceID: scope.WorkspaceID,
			UserID:      userID,
		})
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return domain.ErrMemberNotFound
			}
			return fmt.Errorf("workspace: get membership: %w", err)
		}

		if current.Role == domain.RoleOwner {
			owners, err := queries.CountOwners(ctx, scope.WorkspaceID)
			if err != nil {
				return fmt.Errorf("workspace: count owners: %w", err)
			}
			if owners <= 1 {
				return domain.ErrLastOwner
			}
		}

		removed, err := queries.DeleteMember(ctx, sqlcgen.DeleteMemberParams{
			WorkspaceID: scope.WorkspaceID,
			UserID:      userID,
		})
		if err != nil {
			return fmt.Errorf("workspace: remove member: %w", err)
		}
		if removed == 0 {
			return domain.ErrMemberNotFound
		}
		return nil
	})
}

// CreateInvitation stores a pending invitation.
func (r *Repository) CreateInvitation(ctx context.Context, scope domain.Scope, invitation domain.NewInvitation) (domain.Invitation, error) {
	var created domain.Invitation

	err := r.write(ctx, scope, func(queries *sqlcgen.Queries) error {
		row, err := queries.CreateInvitation(ctx, sqlcgen.CreateInvitationParams{
			WorkspaceID: scope.WorkspaceID,
			Email:       invitation.Email,
			Role:        invitation.Role,
			TokenHash:   invitation.TokenHash,
			InvitedBy:   &invitation.InvitedBy,
			ExpiresAt:   invitation.ExpiresAt,
		})
		if err != nil {
			var pgErr *pgconn.PgError
			if errors.As(err, &pgErr) && pgErr.Code == uniqueViolation {
				return domain.ErrInvitationAlreadySent
			}
			return fmt.Errorf("workspace: create invitation: %w", err)
		}
		created = toInvitation(row, "")
		return nil
	})
	if err != nil {
		return domain.Invitation{}, err
	}

	return created, nil
}

// Invitations lists the pending invitations of the active workspace.
func (r *Repository) Invitations(ctx context.Context, scope domain.Scope) ([]domain.Invitation, error) {
	var invitations []domain.Invitation

	err := r.read(ctx, scope, func(queries *sqlcgen.Queries) error {
		rows, err := queries.ListInvitations(ctx, scope.WorkspaceID)
		if err != nil {
			return fmt.Errorf("workspace: list invitations: %w", err)
		}
		invitations = make([]domain.Invitation, 0, len(rows))
		for _, row := range rows {
			invitations = append(invitations, toInvitation(row, ""))
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	return invitations, nil
}

// RevokeInvitation deletes a pending invitation.
func (r *Repository) RevokeInvitation(ctx context.Context, scope domain.Scope, id uuid.UUID) error {
	return r.write(ctx, scope, func(queries *sqlcgen.Queries) error {
		removed, err := queries.DeleteInvitation(ctx, sqlcgen.DeleteInvitationParams{
			WorkspaceID: scope.WorkspaceID,
			ID:          id,
		})
		if err != nil {
			return fmt.Errorf("workspace: revoke invitation: %w", err)
		}
		if removed == 0 {
			return domain.ErrInvitationInvalid
		}
		return nil
	})
}

// AcceptInvitation consumes the invitation and creates the membership in one
// transaction.
func (r *Repository) AcceptInvitation(ctx context.Context, tokenHash string, userID uuid.UUID, email string) (domain.Workspace, error) {
	if r == nil || r.pool == nil {
		return domain.Workspace{}, fmt.Errorf("workspace: database is not configured")
	}

	var workspace domain.Workspace

	err := r.pool.InScope(ctx, database.Scope{UserID: userID}, func(tx pgx.Tx) error {
		queries := sqlcgen.New(tx)

		invitation, err := queries.GetInvitationByTokenHash(ctx, tokenHash)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return domain.ErrInvitationInvalid
			}
			return fmt.Errorf("workspace: get invitation: %w", err)
		}

		if invitation.AcceptedAt != nil || invitation.ExpiresAt.Before(time.Now()) {
			return domain.ErrInvitationInvalid
		}
		if !strings.EqualFold(invitation.Email, email) {
			return domain.ErrInvitationEmailMatch
		}

		if err := database.SetWorkspace(ctx, tx, invitation.WorkspaceID); err != nil {
			return err
		}

		// Already a member: accepting again is not an error, the invitation is
		// simply consumed.
		if _, err := queries.GetMembership(ctx, sqlcgen.GetMembershipParams{
			WorkspaceID: invitation.WorkspaceID,
			UserID:      userID,
		}); err == nil {
			if _, err := queries.AcceptInvitation(ctx, sqlcgen.AcceptInvitationParams{
				ID:         invitation.ID,
				AcceptedBy: &userID,
			}); err != nil {
				return fmt.Errorf("workspace: accept invitation: %w", err)
			}
			row, err := queries.GetWorkspace(ctx, invitation.WorkspaceID)
			if err != nil {
				return mapNotFound(err, "get workspace")
			}
			workspace = toWorkspace(row, invitation.Role)
			return nil
		} else if !errors.Is(err, pgx.ErrNoRows) {
			return fmt.Errorf("workspace: get membership: %w", err)
		}

		if _, err := queries.CreateMember(ctx, sqlcgen.CreateMemberParams{
			WorkspaceID: invitation.WorkspaceID,
			UserID:      userID,
			Role:        invitation.Role,
		}); err != nil {
			return fmt.Errorf("workspace: create member: %w", err)
		}

		if _, err := queries.AcceptInvitation(ctx, sqlcgen.AcceptInvitationParams{
			ID:         invitation.ID,
			AcceptedBy: &userID,
		}); err != nil {
			return mapNotFound(err, "accept invitation")
		}

		row, err := queries.GetWorkspace(ctx, invitation.WorkspaceID)
		if err != nil {
			return mapNotFound(err, "get workspace")
		}
		workspace = toWorkspace(row, invitation.Role)
		return nil
	})
	if err != nil {
		return domain.Workspace{}, err
	}

	return workspace, nil
}

// read runs fn in a read-only transaction scoped to the caller.
func (r *Repository) read(ctx context.Context, scope domain.Scope, fn func(*sqlcgen.Queries) error) error {
	if r == nil || r.pool == nil {
		return fmt.Errorf("workspace: database is not configured")
	}
	return r.pool.InScopeRead(ctx, toDatabaseScope(scope), func(tx pgx.Tx) error {
		return fn(sqlcgen.New(tx))
	})
}

// write runs fn in a transaction scoped to the caller.
func (r *Repository) write(ctx context.Context, scope domain.Scope, fn func(*sqlcgen.Queries) error) error {
	if r == nil || r.pool == nil {
		return fmt.Errorf("workspace: database is not configured")
	}
	return r.pool.InScope(ctx, toDatabaseScope(scope), func(tx pgx.Tx) error {
		return fn(sqlcgen.New(tx))
	})
}

// toDatabaseScope translates the domain scope into the one the scoped helpers
// expect, so the service never imports the database package.
func toDatabaseScope(scope domain.Scope) database.Scope {
	return database.Scope{UserID: scope.UserID, WorkspaceID: scope.WorkspaceID}
}

func toWorkspace(row sqlcgen.Workspace, role string) domain.Workspace {
	return domain.Workspace{
		ID:            row.ID,
		Name:          row.Name,
		BusinessField: row.BusinessField,
		Timezone:      row.Timezone,
		Language:      row.Language,
		Role:          role,
		CreatedAt:     row.CreatedAt,
	}
}

func toTeams(rows []sqlcgen.Team) []domain.Team {
	teams := make([]domain.Team, 0, len(rows))
	for _, row := range rows {
		teams = append(teams, domain.Team{ID: row.ID, Name: row.Name, Kind: row.Kind})
	}
	return teams
}

func toInvitation(row sqlcgen.Invitation, workspaceName string) domain.Invitation {
	return domain.Invitation{
		ID:            row.ID,
		WorkspaceID:   row.WorkspaceID,
		WorkspaceName: workspaceName,
		Email:         row.Email,
		Role:          row.Role,
		ExpiresAt:     row.ExpiresAt,
		CreatedAt:     row.CreatedAt,
	}
}

func mapNotFound(err error, operation string) error {
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.ErrWorkspaceNotFound
	}
	return fmt.Errorf("workspace: %s: %w", operation, err)
}

var _ domain.Repository = (*Repository)(nil)
