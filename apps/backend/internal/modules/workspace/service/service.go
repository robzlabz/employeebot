// Package service implements the workspace use cases: onboarding, member
// management, and invitations. It depends on the domain contracts and the
// platform primitives only.
package service

import (
	"context"
	"fmt"
	"net/mail"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/robzlabz/employeebot/apps/backend/internal/modules/workspace/domain"
)

// Config holds the workspace settings.
type Config struct {
	// InvitationTTL is how long an invitation link stays valid.
	InvitationTTL time.Duration
	// FrontendURL is the base URL used to build the invitation link.
	FrontendURL string
	// DefaultTimezone is used when the onboarding form omits one.
	DefaultTimezone string
	// Clock is injectable so tests can control expiry.
	Clock func() time.Time
}

// Deps are the service dependencies. The provisioner is the seam EPIC 3 fills
// with the Bolu template copy.
type Deps struct {
	Repository domain.Repository
	// Mailer delivers invitation links. Optional.
	Mailer domain.Mailer
	// Tokens generates the random invitation token and its hash.
	Tokens domain.Tokens
	Config Config
}

type service struct {
	deps   domain.Repository
	mail   domain.Mailer
	tokens domain.Tokens
	cfg    Config
}

// New builds the workspace service.
func New(deps Deps) domain.Service {
	if deps.Config.Clock == nil {
		deps.Config.Clock = time.Now
	}
	if deps.Config.InvitationTTL <= 0 {
		deps.Config.InvitationTTL = 7 * 24 * time.Hour
	}
	if deps.Config.DefaultTimezone == "" {
		deps.Config.DefaultTimezone = "Asia/Jakarta"
	}
	return &service{
		deps:   deps.Repository,
		mail:   deps.Mailer,
		tokens: deps.Tokens,
		cfg:    deps.Config,
	}
}

// Onboard creates the workspace, makes the caller its owner, and creates the two
// default teams. Submitting twice returns the same workspace.
func (s *service) Onboard(ctx context.Context, userID uuid.UUID, req domain.OnboardRequest) (domain.OnboardResult, error) {
	if userID == uuid.Nil {
		return domain.OnboardResult{}, domain.ErrNotMember
	}

	name := strings.TrimSpace(req.Name)
	if name == "" {
		return domain.OnboardResult{}, fmt.Errorf("%w: business name is required", domain.ErrInvalidInput)
	}

	timezone := strings.TrimSpace(req.Timezone)
	if timezone == "" {
		timezone = s.cfg.DefaultTimezone
	}
	if _, err := time.LoadLocation(timezone); err != nil {
		return domain.OnboardResult{}, fmt.Errorf("%w: unknown timezone %q", domain.ErrInvalidInput, timezone)
	}

	result, err := s.deps.Onboard(ctx, userID, domain.OnboardRequest{
		Name:          name,
		BusinessField: strings.TrimSpace(req.BusinessField),
		Timezone:      timezone,
	})
	if err != nil {
		return domain.OnboardResult{}, err
	}

	// The Bolu templates are copied by the repository, inside the same
	// transaction that creates the workspace, so the result already carries the
	// agents a caller would expect to find.
	return result, nil
}

// Workspaces lists the workspaces the caller belongs to.
func (s *service) Workspaces(ctx context.Context, userID uuid.UUID) ([]domain.Workspace, error) {
	return s.deps.Workspaces(ctx, userID)
}

// Current reads the active workspace.
func (s *service) Current(ctx context.Context, scope domain.Scope) (domain.Workspace, error) {
	return s.deps.Workspace(ctx, scope)
}

// Update changes the workspace profile. Only an owner may do it.
func (s *service) Update(ctx context.Context, scope domain.Scope, actorRole string, req domain.UpdateRequest) (domain.Workspace, error) {
	if !domain.CanAdminister(actorRole) {
		return domain.Workspace{}, domain.ErrForbidden
	}

	name := strings.TrimSpace(req.Name)
	if name == "" {
		return domain.Workspace{}, fmt.Errorf("%w: business name is required", domain.ErrInvalidInput)
	}

	timezone := strings.TrimSpace(req.Timezone)
	if timezone == "" {
		timezone = s.cfg.DefaultTimezone
	}
	if _, err := time.LoadLocation(timezone); err != nil {
		return domain.Workspace{}, fmt.Errorf("%w: unknown timezone %q", domain.ErrInvalidInput, timezone)
	}

	return s.deps.UpdateWorkspace(ctx, scope, domain.UpdateRequest{
		Name:          name,
		BusinessField: strings.TrimSpace(req.BusinessField),
		Timezone:      timezone,
	})
}

// Teams lists the teams of the active workspace.
func (s *service) Teams(ctx context.Context, scope domain.Scope) ([]domain.Team, error) {
	return s.deps.Teams(ctx, scope)
}

// Members lists the members of the active workspace.
func (s *service) Members(ctx context.Context, scope domain.Scope) ([]domain.Member, error) {
	return s.deps.Members(ctx, scope)
}

// SetRole changes a member's role. Owners and admins may manage members, but
// only an owner may grant the owner role or change another owner.
func (s *service) SetRole(ctx context.Context, scope domain.Scope, actorRole string, userID uuid.UUID, role string) (domain.Member, error) {
	if !domain.CanManageMembers(actorRole) {
		return domain.Member{}, domain.ErrForbidden
	}
	if !domain.IsValidRole(role) {
		return domain.Member{}, domain.ErrInvalidRole
	}
	if role == domain.RoleOwner && !domain.CanAdminister(actorRole) {
		return domain.Member{}, domain.ErrForbidden
	}
	if err := s.guardOwnerTarget(ctx, scope, actorRole, userID); err != nil {
		return domain.Member{}, err
	}

	return s.deps.SetRole(ctx, scope, userID, role)
}

// RemoveMember deletes a membership. A member cannot remove anyone, an admin
// cannot remove an owner, and nobody can remove the last owner.
func (s *service) RemoveMember(ctx context.Context, scope domain.Scope, actorRole string, actorID, userID uuid.UUID) error {
	if !domain.CanManageMembers(actorRole) {
		return domain.ErrForbidden
	}
	if actorID == userID {
		return domain.ErrCannotRemoveYourself
	}
	if err := s.guardOwnerTarget(ctx, scope, actorRole, userID); err != nil {
		return err
	}

	return s.deps.RemoveMember(ctx, scope, userID)
}

// Invite sends an invitation. Only owners and admins may invite, and the role
// they may grant is capped by their own: an admin cannot create an owner.
func (s *service) Invite(ctx context.Context, scope domain.Scope, actorRole string, actorID uuid.UUID, email, role string) (domain.Invitation, error) {
	if !domain.CanManageMembers(actorRole) {
		return domain.Invitation{}, domain.ErrForbidden
	}
	if !domain.IsValidRole(role) {
		return domain.Invitation{}, domain.ErrInvalidRole
	}
	if role == domain.RoleOwner && !domain.CanAdminister(actorRole) {
		return domain.Invitation{}, domain.ErrForbidden
	}

	normalized, err := normalizeEmail(email)
	if err != nil {
		return domain.Invitation{}, err
	}

	raw, hash, err := s.tokens.Generate()
	if err != nil {
		return domain.Invitation{}, err
	}

	invitation, err := s.deps.CreateInvitation(ctx, scope, domain.NewInvitation{
		Email:     normalized,
		Role:      role,
		TokenHash: hash,
		InvitedBy: actorID,
		ExpiresAt: s.cfg.Clock().Add(s.cfg.InvitationTTL),
	})
	if err != nil {
		return domain.Invitation{}, err
	}

	if err := s.sendInvitation(ctx, normalized, raw, invitation); err != nil {
		return domain.Invitation{}, err
	}

	return invitation, nil
}

// Invitations lists the pending invitations of the active workspace.
func (s *service) Invitations(ctx context.Context, scope domain.Scope) ([]domain.Invitation, error) {
	return s.deps.Invitations(ctx, scope)
}

// RevokeInvitation deletes a pending invitation.
func (s *service) RevokeInvitation(ctx context.Context, scope domain.Scope, actorRole string, id uuid.UUID) error {
	if !domain.CanManageMembers(actorRole) {
		return domain.ErrForbidden
	}
	return s.deps.RevokeInvitation(ctx, scope, id)
}

// AcceptInvitation consumes an invitation for the signed-in account.
func (s *service) AcceptInvitation(ctx context.Context, token string, userID uuid.UUID, email string) (domain.Workspace, error) {
	if strings.TrimSpace(token) == "" {
		return domain.Workspace{}, domain.ErrInvitationInvalid
	}
	if userID == uuid.Nil {
		return domain.Workspace{}, domain.ErrInvitationInvalid
	}

	return s.deps.AcceptInvitation(ctx, domain.HashToken(token), userID, strings.ToLower(strings.TrimSpace(email)))
}

// Resolve returns the caller's role, which is what the tenant middleware uses.
func (s *service) Resolve(ctx context.Context, workspaceID, userID uuid.UUID) (string, error) {
	if workspaceID == uuid.Nil || userID == uuid.Nil {
		return "", domain.ErrNotMember
	}
	return s.deps.Membership(ctx, domain.Scope{WorkspaceID: workspaceID, UserID: userID}, userID)
}

// guardOwnerTarget stops an admin from touching an owner: only an owner may
// re-role or remove another owner.
func (s *service) guardOwnerTarget(ctx context.Context, scope domain.Scope, actorRole string, userID uuid.UUID) error {
	if domain.CanAdminister(actorRole) {
		return nil
	}

	members, err := s.deps.Members(ctx, scope)
	if err != nil {
		return err
	}
	for _, member := range members {
		if member.UserID == userID && member.Role == domain.RoleOwner {
			return domain.ErrForbidden
		}
	}
	return nil
}

func (s *service) sendInvitation(ctx context.Context, email, token string, invitation domain.Invitation) error {
	if s.mail == nil {
		return nil
	}

	link := fmt.Sprintf("%s/join?token=%s", strings.TrimRight(s.cfg.FrontendURL, "/"), token)
	body := fmt.Sprintf("Kamu diundang bergabung ke workspace Bolu sebagai %s.\n\nBuka tautan ini untuk menerima:\n\n%s\n\nTautan berlaku sampai %s.",
		invitation.Role, link, invitation.ExpiresAt.UTC().Format("2 January 2006 15:04 MST"))

	return s.mail.Send(ctx, email, "Undangan bergabung ke Bolu", body)
}

func normalizeEmail(email string) (string, error) {
	trimmed := strings.TrimSpace(email)
	if trimmed == "" {
		return "", fmt.Errorf("%w: email is required", domain.ErrInvalidInput)
	}
	if _, err := mail.ParseAddress(trimmed); err != nil {
		return "", fmt.Errorf("%w: email is not valid", domain.ErrInvalidInput)
	}
	return strings.ToLower(trimmed), nil
}

var _ domain.Service = (*service)(nil)
