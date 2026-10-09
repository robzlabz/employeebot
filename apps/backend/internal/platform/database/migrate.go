package database

import (
	"context"
	"errors"
	"fmt"

	"github.com/golang-migrate/migrate/v4"
	migratepgx "github.com/golang-migrate/migrate/v4/database/postgres"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/stdlib" // init() registers the database/sql driver golang-migrate uses

	"github.com/robzlabz/employeebot/apps/backend/migrations"
)

// ErrNoChange is returned when the database is already at the target version.
var ErrNoChange = migrate.ErrNoChange

// MigrateUp applies every pending migration against the configured database.
func MigrateUp(ctx context.Context, url string) error {
	m, closeFn, err := newMigrator(url)
	if err != nil {
		return err
	}
	defer closeFn()

	if err := m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return fmt.Errorf("migrate up: %w", err)
	}
	return nil
}

// MigrateDown rolls every migration back. It exists so CI can prove both
// directions work (see .github/workflows/ci.yml).
func MigrateDown(ctx context.Context, url string) error {
	m, closeFn, err := newMigrator(url)
	if err != nil {
		return err
	}
	defer closeFn()

	if err := m.Down(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return fmt.Errorf("migrate down: %w", err)
	}
	return nil
}

// MigrateVersion reports the applied version, or 0 when the schema is empty.
func MigrateVersion(ctx context.Context, url string) (uint, bool, error) {
	m, closeFn, err := newMigrator(url)
	if err != nil {
		return 0, false, err
	}
	defer closeFn()

	version, dirty, err := m.Version()
	if errors.Is(err, migrate.ErrNilVersion) {
		return 0, false, nil
	}
	if err != nil {
		return 0, false, fmt.Errorf("migrate version: %w", err)
	}
	return version, dirty, nil
}

func newMigrator(url string) (*migrate.Migrate, func(), error) {
	source, err := iofs.New(migrations.FS, ".")
	if err != nil {
		return nil, nil, fmt.Errorf("open embedded migrations: %w", err)
	}

	connConfig, err := pgx.ParseConfig(url)
	if err != nil {
		return nil, nil, fmt.Errorf("parse database url: %w", err)
	}

	db := stdlib.OpenDB(*connConfig)
	driver, err := migratepgx.WithInstance(db, &migratepgx.Config{})
	if err != nil {
		_ = db.Close()
		return nil, nil, fmt.Errorf("create migrate driver: %w", err)
	}

	m, err := migrate.NewWithInstance("iofs", source, "postgres", driver)
	if err != nil {
		_ = db.Close()
		return nil, nil, fmt.Errorf("create migrator: %w", err)
	}

	return m, func() { _ = db.Close() }, nil
}

// WorkspaceID is the tenant identifier carried through request contexts.
type WorkspaceID = uuid.UUID

// WithWorkspace runs fn inside a transaction whose connection carries the
// tenant setting. Row Level Security then filters every statement, so a query
// that forgets `WHERE workspace_id = ...` still cannot read another tenant.
func (p *Pool) WithWorkspace(ctx context.Context, workspaceID WorkspaceID, fn func(tx pgx.Tx) error) error {
	if workspaceID == uuid.Nil {
		return fmt.Errorf("workspace id is required")
	}
	if p == nil || p.pool == nil {
		return fmt.Errorf("database pool is not configured")
	}

	tx, err := p.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin transaction: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	if _, err := tx.Exec(ctx, "SELECT set_config('app.workspace_id', $1, true)", workspaceID.String()); err != nil {
		return fmt.Errorf("set tenant context: %w", err)
	}

	if err := fn(tx); err != nil {
		return err
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit transaction: %w", err)
	}
	return nil
}

// WithWorkspaceRead runs fn inside a read-only tenant transaction. The read
// path is separate so a read can never accidentally write.
func (p *Pool) WithWorkspaceRead(ctx context.Context, workspaceID WorkspaceID, fn func(tx pgx.Tx) error) error {
	if workspaceID == uuid.Nil {
		return fmt.Errorf("workspace id is required")
	}
	if p == nil || p.pool == nil {
		return fmt.Errorf("database pool is not configured")
	}

	tx, err := p.pool.BeginTx(ctx, pgx.TxOptions{AccessMode: pgx.ReadOnly})
	if err != nil {
		return fmt.Errorf("begin read transaction: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	if _, err := tx.Exec(ctx, "SELECT set_config('app.workspace_id', $1, true)", workspaceID.String()); err != nil {
		return fmt.Errorf("set tenant context: %w", err)
	}

	if err := fn(tx); err != nil {
		return err
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit read transaction: %w", err)
	}
	return nil
}
