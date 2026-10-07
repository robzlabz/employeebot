# auth module (stub)

Planned home of owner authentication — issue #1 (auth) and #2 (multi-company
onboarding).

Layout to grow into, mirroring the rest of the backend:

```
auth/
  domain/      # entities, repository + use case interfaces (usecase.go exists)
  repository/  # sqlx implementations
  service/     # business logic implementing domain.UseCase
  handler/     # Fiber handlers
  router/      # RegisterRoutes(r fiber.Router, handler *handler.Handler, jwtSecret string)
```

Nothing is implemented yet: `domain/usecase.go` only declares the signup/login
contract. Wire the module in `internal/dependency` and
`internal/router/main_router.go` when it lands.
