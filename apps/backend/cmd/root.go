package cmd

import (
	"os"

	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use:   "employeebot-backend",
	Short: "Employee Bot backend HTTP service",
	Long:  "Employee Bot backend - Fiber + sqlx service following the modular layered layout.",
}

func init() {
	rootCmd.AddCommand(newHTTPCmd())
}

// Execute runs the root command.
func Execute() {
	rootCmd.SetArgs(os.Args[1:])
	if err := rootCmd.Execute(); err != nil {
		os.Exit(1)
	}
}
