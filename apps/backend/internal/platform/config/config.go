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
	Auth        AuthConfig
	Google      GoogleConfig
	Mail        MailConfig
	Plan        PlanConfig
	Logging     LoggingConfig
}

// AppConfig holds application-level settings.
type AppConfig struct {
	Environment string `mapstructure:"Environment"`
	// FrontendURL is the base URL of the web app. It is where verification,
	// reset, and invitation links point, and where the Google callback sends
	// the browser back to.
	FrontendURL string `mapstructure:"FrontendURL" validate:"optional"`
	// CORSOrigins lists the browser origins allowed to call the API. An empty
	// list allows any origin, which is only acceptable in local development.
	CORSOrigins []string `mapstructure:"CORSOrigins" validate:"optional"`
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

// AuthConfig holds the authentication lifetimes, cookie settings, and the login
// throttle. Lifetimes are expressed in the unit named by the field, which keeps
// the YAML readable.
type AuthConfig struct {
	// AccessTokenMinutes is the lifetime of an access token.
	AccessTokenMinutes int `mapstructure:"AccessTokenMinutes" validate:"optional"`
	// RefreshHours is the lifetime of a refresh session.
	RefreshHours int `mapstructure:"RefreshHours" validate:"optional"`
	// VerificationHours is the lifetime of an email verification link.
	VerificationHours int `mapstructure:"VerificationHours" validate:"optional"`
	// ResetMinutes is the lifetime of a password reset link.
	ResetMinutes int `mapstructure:"ResetMinutes" validate:"optional"`
	// StateMinutes is the lifetime of the signed OAuth state.
	StateMinutes int `mapstructure:"StateMinutes" validate:"optional"`
	// CookieDomain is optional; empty means the host that served the request.
	CookieDomain string `mapstructure:"CookieDomain" validate:"optional"`
	// CookieSecure must be true outside local development: the refresh cookie
	// must not travel over plain HTTP.
	CookieSecure bool `mapstructure:"CookieSecure"`
	// LoginThrottleCapacity is the burst size of the login bucket, and
	// LoginThrottleRefill the steady rate in attempts per second.
	LoginThrottleCapacity int     `mapstructure:"LoginThrottleCapacity" validate:"optional"`
	LoginThrottleRefill   float64 `mapstructure:"LoginThrottleRefill" validate:"optional"`
}

// GoogleConfig holds the Google OAuth client registration. An empty ClientID
// disables Google sign-in and the endpoints report it as not configured.
type GoogleConfig struct {
	ClientID     string `mapstructure:"ClientID" validate:"optional"`
	ClientSecret string `mapstructure:"ClientSecret" validate:"optional"`
	RedirectURL  string `mapstructure:"RedirectURL" validate:"optional"`
}

// MailConfig selects how transactional email is delivered. Driver is "log"
// (development) or "smtp" (staging and production).
type MailConfig struct {
	Driver   string `mapstructure:"Driver" validate:"optional"`
	From     string `mapstructure:"From" validate:"optional"`
	Host     string `mapstructure:"Host" validate:"optional"`
	Port     int    `mapstructure:"Port" validate:"optional"`
	Username string `mapstructure:"Username" validate:"optional"`
	Password string `mapstructure:"Password" validate:"optional"`
}

// PlanConfig holds the plan defaults the product has not decided yet. The
// subscription itself arrives in EPIC 12 (#97); until then these values bound
// what a workspace may create.
type PlanConfig struct {
	// MaxAgentsPerWorkspace caps the Bolu registry. Zero means unlimited.
	MaxAgentsPerWorkspace int `mapstructure:"MaxAgentsPerWorkspace" validate:"optional"`
}

// LoggingConfig holds structured logging settings.
type LoggingConfig struct {
	Level  string `mapstructure:"Level" validate:"optional"`  // debug|info|warn|error
	Format string `mapstructure:"Format" validate:"optional"` // json|console
}
