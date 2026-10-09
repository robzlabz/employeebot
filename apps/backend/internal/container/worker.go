package container

import (
	"context"
	"fmt"

	sdkworker "go.temporal.io/sdk/worker"
	"go.uber.org/zap"

	"github.com/robzlabz/employeebot/apps/backend/internal/platform/temporal"
)

// WorkerConfig describes one Temporal worker process. The container owns the
// bootstrap so the agent worker (EPIC 6, #52) and the integration worker
// (EPIC 8, #66) share the same connection, logging and shutdown behaviour.
type WorkerConfig struct {
	// Name is used in logs.
	Name string
	// TaskQueue picks the queue from the Temporal configuration.
	TaskQueue func(*temporal.Client) string
	// Register installs the workflows and activities of this worker. It runs
	// after the container is assembled, so it can reach the services.
	Register func(w sdkworker.Worker, c *Container)
	// NeedsDatabase makes a missing Postgres an explicit startup error instead
	// of a nil dereference on the first query.
	NeedsDatabase bool
}

// RunWorker starts the worker and blocks until ctx is cancelled. Every failure
// is returned instead of being logged and swallowed, so the process exits
// non-zero and the orchestrator restarts it.
func RunWorker(ctx context.Context, c *Container, cfg WorkerConfig) error {
	if c.Temporal == nil {
		return fmt.Errorf("%s: temporal is not configured (set TEMPORAL_HOST_PORT)", cfg.Name)
	}
	if cfg.NeedsDatabase && c.DB == nil {
		return fmt.Errorf("%s: database is not configured (set DATABASE_URL)", cfg.Name)
	}

	taskQueue := cfg.TaskQueue(c.Temporal)
	if taskQueue == "" {
		return fmt.Errorf("%s: task queue is empty", cfg.Name)
	}

	w := sdkworker.New(c.Temporal.Client(), taskQueue, sdkworker.Options{})
	if cfg.Register != nil {
		cfg.Register(w, c)
	}

	if err := w.Start(); err != nil {
		return fmt.Errorf("%s: start worker: %w", cfg.Name, err)
	}

	c.Logger.Info("worker started",
		zap.String("worker", cfg.Name),
		zap.String("task_queue", taskQueue),
		zap.String("namespace", c.Temporal.Namespace()),
	)

	<-ctx.Done()
	c.Logger.Info("worker stopping", zap.String("worker", cfg.Name))
	w.Stop()
	return nil
}
