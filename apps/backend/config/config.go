package config

import "time"

// Config is the root application configuration. Values come from the YAML file
// matching ENVIRONMENT and are then overridden by environment variables.
type Config struct {
	Application AppConfig
	Http        HttpConfig
	Database    DatabaseConfig
	JWT         JWTConfig
}

// AppConfig holds application-level settings.
type AppConfig struct {
	Environment string `mapstructure:"Environment"`
}

// HttpConfig holds HTTP server settings.
type HttpConfig struct {
	Address      string        `mapstructure:"Address"`
	ReadTimeout  time.Duration `mapstructure:"ReadTimeout"`
	WriteTimeout time.Duration `mapstructure:"WriteTimeout"`
	ApiPrefix    string        `mapstructure:"ApiPrefix"`
}

// DatabaseConfig holds Postgres connection settings. URL is optional so the
// server can boot and serve health checks without a database.
type DatabaseConfig struct {
	URL             string `mapstructure:"URL" validate:"optional"`
	MaxOpenConns    int    `mapstructure:"MaxOpenConns" validate:"optional"`
	MaxIdleConns    int    `mapstructure:"MaxIdleConns" validate:"optional"`
	ConnMaxLifetime int    `mapstructure:"ConnMaxLifetime" validate:"optional"`
}

// JWTConfig holds JWT signing settings.
type JWTConfig struct {
	Secret      string `mapstructure:"Secret"`
	ExpireHours int    `mapstructure:"ExpireHours" validate:"optional"`
}
