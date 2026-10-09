package integration

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/stretchr/testify/require"

	agentdomain "github.com/robzlabz/employeebot/apps/backend/internal/modules/agent/domain"
	agentrepo "github.com/robzlabz/employeebot/apps/backend/internal/modules/agent/repository"
	agentservice "github.com/robzlabz/employeebot/apps/backend/internal/modules/agent/service"
	authrepo "github.com/robzlabz/employeebot/apps/backend/internal/modules/auth/repository"
	workspacedomain "github.com/robzlabz/employeebot/apps/backend/internal/modules/workspace/domain"
	workspacerepo "github.com/robzlabz/employeebot/apps/backend/internal/modules/workspace/repository"
	"github.com/robzlabz/employeebot/apps/backend/internal/platform/database"
)

// agentFixture is one onboarded workspace with its copied Bolu.
type agentFixture struct {
	repo      *agentrepo.Repository
	service   agentdomain.Service
	pool      *database.Pool
	workspace workspacedomain.Workspace
	userID    uuid.UUID
	scope     agentdomain.Scope
}

func newAgentFixture(t *testing.T, dsn string) *agentFixture {
	t.Helper()

	pool := poolFor(t, dsn)
	agents := agentrepo.New(pool)
	workspaces := workspacerepo.New(pool, agents)

	user, err := authrepo.New(pool.PgxPool()).CreateUser(t.Context(), uuid.NewString()+"@example.com", "$argon2id$hash")
	require.NoError(t, err)

	result, err := workspaces.Onboard(t.Context(), user.ID, workspacedomain.OnboardRequest{
		Name:          "Toko Sinar",
		BusinessField: "Retail",
		Timezone:      "Asia/Jakarta",
	})
	require.NoError(t, err)

	scope := agentdomain.Scope{UserID: user.ID, WorkspaceID: result.Workspace.ID}

	return &agentFixture{
		repo:      agents,
		service:   agentservice.New(agentservice.Deps{Repository: agents}),
		pool:      pool,
		workspace: result.Workspace,
		userID:    user.ID,
		scope:     scope,
	}
}

// TestTemplatesAreSeeded is the E3.1 gate: a clean database has the six Bolu
// profiles.
func TestTemplatesAreSeeded(t *testing.T) {
	pool := poolFor(t, appDatabase(t))

	var templates int
	require.NoError(t, pool.PgxPool().QueryRow(t.Context(),
		"SELECT count(*) FROM agent_templates").Scan(&templates))
	require.Equal(t, 6, templates, "the six Bolu templates must be seeded")

	var tools int
	require.NoError(t, pool.PgxPool().QueryRow(t.Context(),
		"SELECT count(*) FROM tool_catalog").Scan(&tools))
	require.Positive(t, tools, "the tool catalogue must be seeded")

	// Every label in the catalogue is one of the three the policy engine knows.
	var unknown int
	require.NoError(t, pool.PgxPool().QueryRow(t.Context(),
		"SELECT count(*) FROM tool_catalog WHERE label NOT IN ('read','write_internal','write_external')").Scan(&unknown))
	require.Zero(t, unknown)

	// RLS is on for the tenant tables the registry owns.
	for _, table := range []string{"agents", "agent_grants"} {
		var enabled bool
		require.NoError(t, pool.PgxPool().QueryRow(t.Context(),
			"SELECT relrowsecurity FROM pg_class WHERE relname = $1", table).Scan(&enabled))
		require.True(t, enabled, "%s must have Row Level Security enabled", table)
	}
}

// TestOnboardingCopiesTheTemplates is the E3.2 gate: a new workspace always has
// exactly six Bolu, named after the templates.
func TestOnboardingCopiesTheTemplates(t *testing.T) {
	fixture := newAgentFixture(t, appDatabase(t))
	ctx := t.Context()

	agents, err := fixture.service.List(ctx, fixture.scope)
	require.NoError(t, err)
	require.Len(t, agents, 6, "a new workspace gets one Bolu per template")

	names := map[string]bool{}
	for _, agent := range agents {
		names[agent.Name] = true
		require.Equal(t, "Tim Bolu", agent.TeamName, "the copies land in Tim Bolu")
		require.Equal(t, "bolu", agent.TeamKind)
		require.Equal(t, agentdomain.StoredActive, agent.Status)
		require.NotEmpty(t, agent.TemplateKey)
	}
	for _, want := range []string{"Oren", "Biru", "Lila", "Ijo", "Pinky", "Kunyit"} {
		require.True(t, names[want], "%s must be present", want)
	}
}

// TestEditingOneWorkspaceDoesNotTouchAnother is the isolation half of the E3.2
// gate: templates are copied, not shared.
func TestEditingOneWorkspaceDoesNotTouchAnother(t *testing.T) {
	dsn := appDatabase(t)
	first := newAgentFixture(t, dsn)
	second := newAgentFixture(t, dsn)
	ctx := t.Context()

	firstAgents, err := first.service.List(ctx, first.scope)
	require.NoError(t, err)

	target := firstAgents[0]
	updated, err := first.service.Update(ctx, first.scope, target.ID, agentdomain.UpdateRequest{
		Name:    "Oren Punya Toko Sinar",
		Persona: "Persona khusus workspace pertama.",
	})
	require.NoError(t, err)
	require.Equal(t, "Oren Punya Toko Sinar", updated.Name)

	// The other workspace is untouched.
	secondAgents, err := second.service.List(ctx, second.scope)
	require.NoError(t, err)
	for _, agent := range secondAgents {
		require.NotEqual(t, "Oren Punya Toko Sinar", agent.Name, "another workspace must not see the rename")
		require.NotEqual(t, "Persona khusus workspace pertama.", agent.Persona)
	}

	// And the template itself is unchanged, so the next workspace still starts
	// from the original profile.
	template, err := first.repo.Template(ctx, target.TemplateKey)
	require.NoError(t, err)
	require.NotEqual(t, "Oren Punya Toko Sinar", template.Name)
	require.NotEqual(t, "Persona khusus workspace pertama.", template.Persona)
}

// TestRegistryIsTenantScoped proves the registry cannot be read across
// workspaces, even with a valid agent id.
func TestRegistryIsTenantScoped(t *testing.T) {
	dsn := appDatabase(t)
	first := newAgentFixture(t, dsn)
	second := newAgentFixture(t, dsn)
	ctx := t.Context()

	firstAgents, err := first.service.List(ctx, first.scope)
	require.NoError(t, err)
	require.Len(t, firstAgents, 6)

	// Reading the other workspace's Bolu through the first scope finds nothing.
	_, err = first.service.Get(ctx, first.scope, second.scope.WorkspaceID)
	require.ErrorIs(t, err, agentdomain.ErrAgentNotFound)

	secondAgents, err := second.service.List(ctx, second.scope)
	require.NoError(t, err)
	_, err = first.service.Get(ctx, first.scope, secondAgents[0].ID)
	require.ErrorIs(t, err, agentdomain.ErrAgentNotFound, "another workspace's Bolu must be invisible")
}

// TestCreateAndDeleteBolu is the E3.6 gate: adding a Bolu needs no new code, and
// deleting one keeps the history.
func TestCreateAndDeleteBolu(t *testing.T) {
	fixture := newAgentFixture(t, appDatabase(t))
	ctx := t.Context()

	teams, err := fixture.service.Teams(ctx, fixture.scope)
	require.NoError(t, err)
	require.Len(t, teams, 2)

	var horeTeam uuid.UUID
	for _, team := range teams {
		if team.Kind == "hore" {
			horeTeam = team.ID
		}
	}
	require.NotEqual(t, uuid.Nil, horeTeam)

	// A new Bolu in Tim Hore, created from scratch.
	created, err := fixture.service.Create(ctx, fixture.scope, agentdomain.CreateRequest{
		TeamID:  horeTeam,
		Name:    "Kak Helper",
		Role:    "Serba bisa",
		Persona: "Membantu pekerjaan kantor harian.",
	})
	require.NoError(t, err)
	require.Equal(t, "Kak Helper", created.Name)
	require.Equal(t, "Tim Hore", created.TeamName)
	require.Equal(t, agentdomain.DisplayIdle, created.Display)

	// And one copied from an existing Bolu.
	copied, err := fixture.service.Create(ctx, fixture.scope, agentdomain.CreateRequest{
		TeamID:   horeTeam,
		CopyFrom: created.ID,
	})
	require.NoError(t, err)
	require.Contains(t, copied.Name, "salinan")
	require.Equal(t, created.Persona, copied.Persona)

	// The registry grew without a deploy.
	agents, err := fixture.service.List(ctx, fixture.scope)
	require.NoError(t, err)
	require.Len(t, agents, 8)

	// Deleting is a soft delete: the list shrinks, the row stays.
	require.NoError(t, fixture.service.Delete(ctx, fixture.scope, copied.ID))

	agents, err = fixture.service.List(ctx, fixture.scope)
	require.NoError(t, err)
	require.Len(t, agents, 7)

	// The row is still there, which is what keeps the task history readable.
	// The read runs in the tenant scope because RLS hides the row otherwise.
	var softDeleted bool
	require.NoError(t, fixture.pool.InScopeRead(ctx, database.Scope{
		UserID:      fixture.scope.UserID,
		WorkspaceID: fixture.scope.WorkspaceID,
	}, func(tx pgx.Tx) error {
		return tx.QueryRow(ctx, "SELECT deleted_at IS NOT NULL FROM agents WHERE id = $1", copied.ID).Scan(&softDeleted)
	}))
	require.True(t, softDeleted, "deleting must mark the row, not remove it")
}

// TestRestingBoluTakesNoNewWork is the E3.4 gate.
func TestRestingBoluTakesNoNewWork(t *testing.T) {
	fixture := newAgentFixture(t, appDatabase(t))
	ctx := t.Context()

	agents, err := fixture.service.List(ctx, fixture.scope)
	require.NoError(t, err)
	target := agents[0]

	ok, err := fixture.service.AcceptsNewTasks(ctx, fixture.scope, target.ID)
	require.NoError(t, err)
	require.True(t, ok)

	resting, err := fixture.service.SetStatus(ctx, fixture.scope, target.ID, agentdomain.StoredResting)
	require.NoError(t, err)
	require.Equal(t, agentdomain.StoredResting, resting.Status)
	require.Equal(t, agentdomain.DisplayResting, resting.Display)

	ok, err = fixture.service.AcceptsNewTasks(ctx, fixture.scope, target.ID)
	require.NoError(t, err)
	require.False(t, ok, "a resting Bolu must not accept new tasks")
}

// TestGrantsDecideTheToolList is the E3.5 gate: no grant, no tools; a read grant
// keeps only the read-labelled tools.
func TestGrantsDecideTheToolList(t *testing.T) {
	fixture := newAgentFixture(t, appDatabase(t))
	ctx := t.Context()
	pool := fixture.pool

	agents, err := fixture.service.List(ctx, fixture.scope)
	require.NoError(t, err)

	var oren agentdomain.Agent
	for _, agent := range agents {
		if agent.Name == "Oren" {
			oren = agent
		}
	}
	require.NotEmpty(t, oren.TemplateKey)
	require.Contains(t, oren.Tools, "gmail.send", "the template asks for the send tool")

	// Without a connected integration there is nothing to grant, and the tool
	// list is empty.
	tools, err := fixture.service.AllowedTools(ctx, fixture.scope, oren.ID)
	require.NoError(t, err)
	require.Empty(t, tools, "without a grant no tool may reach the model")

	// Connect a Gmail integration and grant read-only access.
	integrationID := uuid.New()
	require.NoError(t, pool.InScope(ctx, database.Scope{
		UserID:      fixture.scope.UserID,
		WorkspaceID: fixture.scope.WorkspaceID,
	}, func(tx pgx.Tx) error {
		_, err := tx.Exec(ctx,
			"INSERT INTO integrations (id, workspace_id, app, account_label, status) VALUES ($1, $2, 'gmail', 'toko@example.com', 'connected')",
			integrationID, fixture.scope.WorkspaceID)
		return err
	}))

	grant, err := fixture.service.SetGrant(ctx, fixture.scope, oren.ID, integrationID, agentdomain.PermissionRead)
	require.NoError(t, err)
	require.Equal(t, agentdomain.PermissionRead, grant.Permission)

	tools, err = fixture.service.AllowedTools(ctx, fixture.scope, oren.ID)
	require.NoError(t, err)
	require.NotEmpty(t, tools)

	for _, tool := range tools {
		require.Equal(t, agentdomain.LabelRead, tool.Label,
			"a read-only grant must not expose %s", tool.Name)
	}
	names := map[string]bool{}
	for _, tool := range tools {
		names[tool.Name] = true
	}
	require.True(t, names["gmail.search"], "the read tool must be available")
	require.False(t, names["gmail.send"], "the write_external tool must be withheld")
	require.False(t, names["gmail.create_draft"], "a write tool must be withheld")

	// Upgrading to read-write exposes the write tools.
	_, err = fixture.service.SetGrant(ctx, fixture.scope, oren.ID, integrationID, agentdomain.PermissionReadWrite)
	require.NoError(t, err)

	tools, err = fixture.service.AllowedTools(ctx, fixture.scope, oren.ID)
	require.NoError(t, err)
	names = map[string]bool{}
	for _, tool := range tools {
		names[tool.Name] = true
	}
	require.True(t, names["gmail.send"])

	// Revoking takes them away again on the next read.
	require.NoError(t, fixture.service.DeleteGrant(ctx, fixture.scope, oren.ID, integrationID))

	tools, err = fixture.service.AllowedTools(ctx, fixture.scope, oren.ID)
	require.NoError(t, err)
	require.Empty(t, tools, "revoking the grant must remove the tools")
}

// TestAgentRepositoryWithoutAPool keeps the unconfigured state an error.
func TestAgentRepositoryWithoutAPool(t *testing.T) {
	ctx := context.Background()
	repo := agentrepo.New(nil)
	scope := agentdomain.Scope{UserID: uuid.New(), WorkspaceID: uuid.New()}

	_, err := repo.List(ctx, scope)
	require.ErrorContains(t, err, "not configured")

	_, err = repo.Get(ctx, scope, uuid.New())
	require.ErrorContains(t, err, "not configured")

	_, err = repo.Create(ctx, scope, agentdomain.NewAgent{Name: "X"})
	require.ErrorContains(t, err, "not configured")

	_, err = repo.Update(ctx, scope, uuid.New(), agentdomain.UpdateRequest{Name: "X"})
	require.ErrorContains(t, err, "not configured")

	_, err = repo.SetStatus(ctx, scope, uuid.New(), agentdomain.StoredActive)
	require.ErrorContains(t, err, "not configured")

	require.ErrorContains(t, repo.Delete(ctx, scope, uuid.New()), "not configured")

	_, err = repo.Activity(ctx, scope)
	require.ErrorContains(t, err, "not configured")

	_, err = repo.ActivityFor(ctx, scope, uuid.New())
	require.ErrorContains(t, err, "not configured")

	_, err = repo.ReasonFor(ctx, scope, uuid.New())
	require.ErrorContains(t, err, "not configured")

	_, err = repo.RunningTasks(ctx, scope, uuid.New())
	require.ErrorContains(t, err, "not configured")

	_, err = repo.CountLive(ctx, scope)
	require.ErrorContains(t, err, "not configured")

	_, err = repo.Teams(ctx, scope)
	require.ErrorContains(t, err, "not configured")

	_, err = repo.Templates(ctx)
	require.ErrorContains(t, err, "not configured")

	_, err = repo.Grants(ctx, scope, uuid.New())
	require.ErrorContains(t, err, "not configured")

	_, err = repo.SetGrant(ctx, scope, uuid.New(), uuid.New(), agentdomain.PermissionRead)
	require.ErrorContains(t, err, "not configured")

	require.ErrorContains(t, repo.DeleteGrant(ctx, scope, uuid.New(), uuid.New()), "not configured")

	_, err = repo.AllowedTools(ctx, scope, uuid.New())
	require.ErrorContains(t, err, "not configured")

	_, err = repo.ToolCatalog(ctx)
	require.ErrorContains(t, err, "not configured")

	_, err = repo.Integrations(ctx, scope)
	require.ErrorContains(t, err, "not configured")
}

// TestProvisionerNeedsSeededTemplates keeps a missing seed an explicit failure
// rather than a workspace with no Bolu.
func TestProvisionerNeedsSeededTemplates(t *testing.T) {
	pool := poolFor(t, appDatabase(t))
	ctx := t.Context()

	// Emptying the template table must make the copy fail loudly.
	_, err := pool.PgxPool().Exec(ctx, "DELETE FROM agent_templates")
	require.NoError(t, err)
	t.Cleanup(func() {
		_, _ = pool.PgxPool().Exec(context.Background(),
			"INSERT INTO agent_templates (key, name, role, persona) VALUES ('oren', 'Oren', 'Penjualan', 'x')")
	})

	user, err := authrepo.New(pool.PgxPool()).CreateUser(ctx, uuid.NewString()+"@example.com", "$argon2id$hash")
	require.NoError(t, err)

	workspaces := workspacerepo.New(pool, agentrepo.New(pool))
	_, err = workspaces.Onboard(ctx, user.ID, workspacedomain.OnboardRequest{Name: "Toko", Timezone: "Asia/Jakarta"})
	require.ErrorContains(t, err, "no templates are seeded")
}
