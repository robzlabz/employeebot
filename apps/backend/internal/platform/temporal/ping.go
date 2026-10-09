package temporal

import (
	"context"
	"fmt"
	"time"

	"go.temporal.io/sdk/workflow"
)

// WorkerPingWorkflow is the connectivity probe for a worker deployment: it runs
// one activity on the worker's own task queue and returns the namespace it ran
// against. Deployment verification (EPIC 14, #112) and the Temporal testsuite
// test both use it, so a worker can be proven reachable without running an
// agent task.
func WorkerPingWorkflow(ctx workflow.Context, name string) (string, error) {
	options := workflow.ActivityOptions{
		StartToCloseTimeout: 10 * time.Second,
	}
	ctx = workflow.WithActivityOptions(ctx, options)

	var result string
	if err := workflow.ExecuteActivity(ctx, WorkerPingActivity, name).Get(ctx, &result); err != nil {
		return "", err
	}
	return result, nil
}

// WorkerPingActivity answers the probe with the worker identity that ran it.
func WorkerPingActivity(_ context.Context, name string) (string, error) {
	if name == "" {
		name = "worker"
	}
	return fmt.Sprintf("%s pong", name), nil
}
