package config

import (
	"errors"
	"os"
	"strings"

	"github.com/spf13/viper"
)

const (
	localEnv = "local"
	envKey   = "ENVIRONMENT"
)

// Load reads the YAML config for the current ENVIRONMENT (local uses
// config-local.yaml, anything else config.yaml) and applies environment
// variable overrides on top of it.
func Load() (*Config, error) {
	cfg, err := loadFromFile(os.Getenv(envKey))
	if err != nil {
		return nil, err
	}

	loadFromEnv(cfg)

	if err := cfg.Validate(); err != nil {
		return nil, err
	}

	return cfg, nil
}

func loadFromFile(env string) (*Config, error) {
	if env == localEnv {
		viper.SetConfigName("config-local")
	} else {
		viper.SetConfigName("config")
	}

	viper.SetConfigType("yaml")
	viper.AddConfigPath("./internal/platform/config/")
	viper.AddConfigPath("./config/")
	viper.AddConfigPath(".")
	viper.AutomaticEnv()
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))

	if err := viper.ReadInConfig(); err != nil {
		// A missing config file is fine: environment variables can supply
		// every required value. errors.As rather than a type assertion, so a
		// wrapped ConfigFileNotFoundError is still recognised.
		var notFound viper.ConfigFileNotFoundError
		if !errors.As(err, &notFound) {
			return nil, err
		}
	}

	var cfg Config
	if err := viper.Unmarshal(&cfg); err != nil {
		return nil, err
	}

	return &cfg, nil
}

// loadFromEnv applies the supported environment variable overrides. Only
// non-empty variables win, so a YAML default is never wiped by an unset env.
func loadFromEnv(cfg *Config) {
	overrides := map[string]*string{
		"ENVIRONMENT":                     &cfg.Application.Environment,
		"HTTP_ADDRESS":                    &cfg.Http.Address,
		"DATABASE_URL":                    &cfg.Database.URL,
		"REDIS_URL":                       &cfg.Redis.URL,
		"TEMPORAL_HOST_PORT":              &cfg.Temporal.HostPort,
		"TEMPORAL_NAMESPACE":              &cfg.Temporal.Namespace,
		"TEMPORAL_TASK_QUEUE_AGENT":       &cfg.Temporal.TaskQueueAgent,
		"TEMPORAL_TASK_QUEUE_INTEGRATION": &cfg.Temporal.TaskQueueIntegration,
		"TEMPORAL_API_KEY":                &cfg.Temporal.APIKey,
		"JWT_SECRET":                      &cfg.JWT.Secret,
		"LOG_LEVEL":                       &cfg.Logging.Level,
		"LOG_FORMAT":                      &cfg.Logging.Format,
		"FRONTEND_URL":                    &cfg.Application.FrontendURL,
		"GOOGLE_CLIENT_ID":                &cfg.Google.ClientID,
		"GOOGLE_CLIENT_SECRET":            &cfg.Google.ClientSecret,
		"GOOGLE_REDIRECT_URL":             &cfg.Google.RedirectURL,
		"MAIL_DRIVER":                     &cfg.Mail.Driver,
		"MAIL_FROM":                       &cfg.Mail.From,
		"MAIL_HOST":                       &cfg.Mail.Host,
		"MAIL_USERNAME":                   &cfg.Mail.Username,
		"MAIL_PASSWORD":                   &cfg.Mail.Password,
	}
	for key, target := range overrides {
		if v := os.Getenv(key); v != "" {
			*target = v
		}
	}
}
