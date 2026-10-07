.PHONY: help up down logs build dev frontend backend migrate

COMPOSE := docker compose

help: ## Show available targets
	@echo "Employee Bot monorepo"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2}'

up: ## Start postgres + backend + frontend (detached, rebuilt)
	$(COMPOSE) up -d --build

down: ## Stop and remove the stack
	$(COMPOSE) down

logs: ## Follow logs from all services
	$(COMPOSE) logs -f

build: ## Build all images
	$(COMPOSE) build

dev: up logs ## Start the stack, then follow logs

frontend: ## Run the Next.js dev server on the host
	cd apps/frontend && npm run dev

backend: ## Run the Go HTTP server on the host
	cd apps/backend && go run . http

migrate: ## Apply database migrations
	@echo "TODO: run migrations (golang-migrate) against $$DATABASE_URL"
