package container

import (
	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"

	agenthandler "github.com/robzlabz/employeebot/apps/backend/internal/modules/agent/handler"
	authhandler "github.com/robzlabz/employeebot/apps/backend/internal/modules/auth/handler"
	healthhandler "github.com/robzlabz/employeebot/apps/backend/internal/modules/health/handler"
	"github.com/robzlabz/employeebot/apps/backend/internal/modules/workspace/domain"
	workspacehandler "github.com/robzlabz/employeebot/apps/backend/internal/modules/workspace/handler"
	"github.com/robzlabz/employeebot/apps/backend/internal/platform/config"
	"github.com/robzlabz/employeebot/apps/backend/internal/platform/response"
)

// Handlers aggregates the HTTP handlers wired into the router. A nil handler
// means its module is not configured in this deployment; the routes for it are
// then registered as 503 instead of being skipped silently.
type Handlers struct {
	Health    *healthhandler.Handler
	Auth      *authhandler.Handler
	Workspace *workspacehandler.Handler
	Agent     *agenthandler.Handler
}

// newHandlers builds every handler from the service set. Handlers receive the
// logger through the constructor, never from a package variable.
func newHandlers(services *Services, log *zap.Logger, cfg *config.Config) *Handlers {
	handlers := &Handlers{
		Health: healthhandler.New(services.Health, log),
	}

	if services.Auth != nil {
		handlers.Auth = authhandler.New(services.Auth, log, authhandler.Config{
			FrontendURL: cfg.Application.FrontendURL,
			Cookie: authhandler.CookieConfig{
				Path:     cookiePath(cfg.Http.ApiPrefix),
				Domain:   cfg.Auth.CookieDomain,
				Secure:   cfg.Auth.CookieSecure,
				SameSite: "Lax",
			},
		})
	}
	if services.Workspace != nil {
		handlers.Workspace = workspacehandler.New(services.Workspace, log)
	}
	if services.Agent != nil {
		handlers.Agent = agenthandler.New(services.Agent, log)
	}

	return handlers
}

// registerRoutes mounts every module router. This is the only place that knows
// the URL layout, and the only place that decides which middleware guards which
// group:
//
//	/api                     public: health and the auth entry points
//	/api        + requireUser       : account endpoints, workspace list, invites
//	/api        + requireTenant     : everything scoped to the active workspace
func (c *Container) registerRoutes() {
	api := c.app.Group(c.Config.Http.ApiPrefix)

	healthhandler.Routes(c.app, c.Handlers.Health, c.Config.Http.ApiPrefix)

	if c.Handlers.Auth == nil {
		// Without a database the auth routes still exist, but they report that
		// the feature is unavailable instead of returning a confusing 404. The
		// registry fallbacks below are registered for the same reason, so this
		// branch falls through instead of returning.
		api.All("/auth/*", unavailable("authentication is not configured", "auth_not_configured"))
		c.registerUnavailableModules(api)
		return
	}
	authhandler.Routes(api, c.Handlers.Auth)

	// Authenticated, no active workspace required.
	user := api.Group("", c.requireUser())
	authhandler.ProtectedRoutes(user, c.Handlers.Auth)

	if c.Handlers.Workspace == nil {
		user.All("/workspaces*", unavailable("workspaces are not configured", "workspace_not_configured"))
		return
	}
	workspacehandler.UserRoutes(user, c.Handlers.Workspace)

	// Verified accounts only: onboarding and accepting an invitation create or
	// join tenancy, so the address must be confirmed first.
	verified := api.Group("", c.requireUser(), c.requireVerified())
	workspacehandler.VerifiedRoutes(verified, c.Handlers.Workspace)

	// Active workspace required.
	tenant := api.Group("", c.requireUser(), c.requireTenant())
	workspacehandler.TenantRoutes(tenant, c.Handlers.Workspace)

	// Member management needs a managing role on top of the tenant.
	managers := api.Group("", c.requireUser(), c.requireTenant(), requireRole(domain.RoleOwner, domain.RoleAdmin))
	workspacehandler.ManagerRoutes(managers, c.Handlers.Workspace)

	// Workspace settings are owner-only.
	owners := api.Group("", c.requireUser(), c.requireTenant(), requireRole(domain.RoleOwner))
	workspacehandler.OwnerRoutes(owners, c.Handlers.Workspace)

	if c.Handlers.Agent == nil {
		registerAgentFallback(tenant)
		return
	}

	// The registry: everyone in the workspace may read it.
	agenthandler.Routes(tenant, c.Handlers.Agent)

	// Changing the registry needs a managing role.
	registry := api.Group("", c.requireUser(), c.requireTenant(), requireRole(domain.RoleOwner, domain.RoleAdmin))
	agenthandler.ManagerRoutes(registry, c.Handlers.Agent)
}

// registerUnavailableModules registers the fallbacks for the modules that are
// not configured in this deployment, so every documented route exists and
// answers 503 rather than 404.
func (c *Container) registerUnavailableModules(api fiber.Router) {
	if c.Handlers.Workspace == nil {
		api.All("/workspaces*", unavailable("workspaces are not configured", "workspace_not_configured"))
		api.All("/invitations*", unavailable("workspaces are not configured", "workspace_not_configured"))
	}
	if c.Handlers.Agent == nil {
		registerAgentFallback(api)
	}
}

// registerAgentFallback answers 503 for the registry routes.
func registerAgentFallback(router fiber.Router) {
	message := "the agent registry is not configured"
	router.All("/agents*", unavailable(message, "agent_not_configured"))
	router.All("/teams*", unavailable(message, "agent_not_configured"))
}

// cookiePath scopes the refresh cookie to the auth endpoints, so it is not sent
// with every API call.
func cookiePath(apiPrefix string) string {
	if apiPrefix == "" {
		return "/auth"
	}
	return apiPrefix + "/auth"
}

// unavailable answers 503 for a route whose module is not configured.
func unavailable(message, code string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return response.Unavailable(c, message, code)
	}
}
