package dependency

// Services aggregates the business layer built on top of Repositories.
type Services struct {
	Repositories *Repositories
}

// NewServices builds the service set.
func NewServices(repositories *Repositories) *Services {
	return &Services{Repositories: repositories}
}
