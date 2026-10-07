package dependency

import (
	"fmt"
	"time"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

// Driver owns the Postgres connection pool.
type Driver struct {
	DB *sqlx.DB
}

// DBConfig holds the database connection settings.
type DBConfig struct {
	URL             string
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifetime int // seconds
}

// NewDriver opens and verifies a Postgres connection pool.
func NewDriver(cfg DBConfig) (*Driver, error) {
	if cfg.URL == "" {
		return nil, fmt.Errorf("database url is required")
	}

	db, err := sqlx.Connect("postgres", cfg.URL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	if cfg.MaxOpenConns > 0 {
		db.SetMaxOpenConns(cfg.MaxOpenConns)
	}
	if cfg.MaxIdleConns > 0 {
		db.SetMaxIdleConns(cfg.MaxIdleConns)
	}
	if cfg.ConnMaxLifetime > 0 {
		db.SetConnMaxLifetime(time.Duration(cfg.ConnMaxLifetime) * time.Second)
	}

	return &Driver{DB: db}, nil
}

// Close releases the connection pool. Safe to call on a nil pool.
func (d *Driver) Close() error {
	if d == nil || d.DB == nil {
		return nil
	}
	return d.DB.Close()
}
