// Command agent-worker runs the Temporal worker that executes agent tasks:
// the LLM loop, tool calls, approvals and handoffs.
//
// EPIC 6 (#52) registers AgentTaskWorkflow and its activities here; until then
// the worker registers the connectivity probe so a deployment can be verified
// end to end.
package main

import (
	"context"
	"flag"
	"fmt"
	"os"
	"os/signal"
	"syscall"

	sdkworker "go.temporal.io/sdk/worker"

	"github.com/robzlabz/employeebot/apps/backend/internal/container"
	"github.com/robzlabz/employeebot/apps/backend/internal/platform/config"
	"github.com/robzlabz/employeebot/apps/backend/internal/platform/temporal"
)

func main() {
	if err := run(); err != nil {
		fmt.Fprintf(os.Stderr, "agent-worker: %v\n", err)
		os.Exit(1)
	}
}

func run() error {
	env := flag.String("env", "", "environment: local, staging, production (defaults to $ENVIRONMENT, else local)")
	flag.Parse()
	if *env != "" {
		if err := os.Setenv("ENVIRONMENT", *env); err != nil {
			return fmt.Errorf("set environment: %w", err)
		}
	}

	if err := config.LoadDotEnv(); err != nil {
		return fmt.Errorf("load .env: %w", err)
	}

	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("load config: %w", err)
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	c, err := container.New(ctx, cfg, container.WithoutHTTP())
	if err != nil {
		return err
	}
	defer c.Close()

	return container.RunWorker(ctx, c, container.WorkerConfig{
		Name:          "agent-worker",
		NeedsDatabase: true,
		TaskQueue:     func(t *temporal.Client) string { return t.TaskQueueAgent() },
		Register: func(w sdkworker.Worker, _ *container.Container) {
			w.RegisterWorkflow(temporal.WorkerPingWorkflow)
			w.RegisterActivity(temporal.WorkerPingActivity)
		},
	})
}
