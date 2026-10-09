package config

import "time"

// Config is the root application configuration. Values come from the YAML file
// matching ENVIRONMENT and are then overridden by environment variables.
type Config struct {
	Application AppConfig
	Http        HttpConfig
	Database    DatabaseConfig
	Redis       RedisConfig
	Temporal    TemporalConfig
	JWT         JWTConfig
	Logging     LoggingConfig
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

// DatabaseConfig holds Postgres connection settings. URL is optional so a
// developer can run the API without a database; when it is empty the container
// wires no repositories and only dependency-free routes are served.
type DatabaseConfig struct {
	URL string `mapstructure:"URL" validate:"optional"`
	// Pool sizing is optional: an operator who only supplies DATABASE_URL gets
	// the pgx defaults instead of a validation error.
	MaxOpenConns    int32 `mapstructure:"MaxOpenConns" validate:"optional"`
	MaxIdleConns    int32 `mapstructure:"MaxIdleConns" validate:"optional"`
	ConnMaxLifetime int   `mapstructure:"ConnMaxLifetime" validate:"optional"` // seconds
}

// RedisConfig holds the Redis connection settings. Redis carries realtime
// pub/sub channels, per-integration rate limit buckets, and the live quota
// counter, so every process that needs it shares this configuration.
type RedisConfig struct {
	URL string `mapstructure:"URL" validate:"optional"`
}

// TemporalConfig holds the Temporal connection settings. HostPort is empty in
// the checked-in config files so no production endpoint is committed to the
// repository; staging and production supply it through the environment.
type TemporalConfig struct {
	HostPort             string `mapstructure:"HostPort" validate:"optional"`
	Namespace            string `mapstructure:"Namespace" validate:"optional"`
	TaskQueueAgent       string `mapstructure:"TaskQueueAgent" validate:"optional"`
	TaskQueueIntegration string `mapstructure:"TaskQueueIntegration" validate:"optional"`
	TLS                  bool   `mapstructure:"TLS"`
	APIKey               string `mapstructure:"APIKey" validate:"optional"`
}

// JWTConfig holds JWT signing settings.
type JWTConfig struct {
	Secret      string `mapstructure:"Secret"`
	ExpireHours int    `mapstructure:"ExpireHours" validate:"optional"`
}

// LoggingConfig holds structured logging settings.
type LoggingConfig struct {
	Level  string `mapstructure:"Level" validate:"optional"`  // debug|info|warn|error
	Format string `mapstructure:"Format" validate:"optional"` // json|console
}
