package cmd

import (
	"fmt"
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"
	"github.com/spf13/cobra"

	"github.com/robzlabz/employeebot/apps/backend/config"
	"github.com/robzlabz/employeebot/apps/backend/internal/dependency"
	"github.com/robzlabz/employeebot/apps/backend/internal/middleware"
	"github.com/robzlabz/employeebot/apps/backend/internal/router"
)

func newHTTPCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "http",
		Short: "Run the backend HTTP server",
		Run: func(command *cobra.Command, _ []string) {
			// Precedence: --env flag, then ENVIRONMENT, then local so that
			// `go run . http` works out of the box on a dev machine.
			env, _ := command.Flags().GetString("env")
			if env == "" {
				env = os.Getenv("ENVIRONMENT")
			}
			if env == "" {
				env = "local"
			}
			os.Setenv("ENVIRONMENT", env)

			if err := godotenv.Load(); err != nil {
				log.Println("No .env file found, using environment variables")
			}

			cfg, err := config.Load()
			if err != nil {
				log.Fatalf("failed to load config: %v", err)
			}
			fmt.Printf("Config loaded (environment=%s)\n", cfg.Application.Environment)

			// The database is optional: on an empty or unreachable DATABASE_URL
			// we log a warning and keep serving so the health endpoints work
			// without Postgres (local dev, CI).
			driver, err := dependency.NewDriver(dependency.DBConfig{
				URL:             cfg.Database.URL,
				MaxOpenConns:    cfg.Database.MaxOpenConns,
				MaxIdleConns:    cfg.Database.MaxIdleConns,
				ConnMaxLifetime: cfg.Database.ConnMaxLifetime,
			})
			if err != nil {
				log.Printf("warning: database unavailable, continuing without it: %v", err)
				driver = &dependency.Driver{}
			} else {
				log.Println("Database connected")
			}
			defer driver.Close()

			repositories := dependency.NewRepositories(driver.DB)
			services := dependency.NewServices(repositories)
			handlers := dependency.NewHandlers(services)

			app := fiber.New(fiber.Config{
				ReadTimeout:  cfg.Http.ReadTimeout,
				WriteTimeout: cfg.Http.WriteTimeout,
			})

			app.Use(middleware.RequestLogger())
			app.Use(cors.New(cors.Config{
				AllowOrigins: "*",
				AllowMethods: "GET,POST,HEAD,PUT,DELETE,PATCH,OPTIONS",
				AllowHeaders: "*",
			}))

			router.SetupRoutes(app, handlers, cfg)

			address := cfg.Http.Address
			if address == "" {
				address = ":8080"
			}
			log.Printf("Server starting on %s", address)
			log.Fatal(app.Listen(address))
		},
	}

	cmd.Flags().StringP("env", "e", "", "environment: local, staging, production (defaults to ENVIRONMENT, else local)")
	return cmd
}
