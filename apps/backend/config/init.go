package config

import (
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
	viper.AddConfigPath("./config/")
	viper.AddConfigPath(".")
	viper.AutomaticEnv()
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))

	if err := viper.ReadInConfig(); err != nil {
		// A missing config file is fine: environment variables can supply
		// every required value.
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, err
		}
	}

	var cfg Config
	if err := viper.Unmarshal(&cfg); err != nil {
		return nil, err
	}

	return &cfg, nil
}

// loadFromEnv applies the supported environment variable overrides.
func loadFromEnv(cfg *Config) {
	if v := os.Getenv("ENVIRONMENT"); v != "" {
		cfg.Application.Environment = v
	}
	if v := os.Getenv("HTTP_ADDRESS"); v != "" {
		cfg.Http.Address = v
	}
	if v := os.Getenv("DATABASE_URL"); v != "" {
		cfg.Database.URL = v
	}
	if v := os.Getenv("JWT_SECRET"); v != "" {
		cfg.JWT.Secret = v
	}
}
