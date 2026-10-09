package temporal

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

func TestNewRequiresAHostPort(t *testing.T) {
	_, err := New(context.Background(), Config{})

	require.ErrorContains(t, err, "host port is required")
}

// TestNewFailsFastOnAnUnreachableEndpoint proves the health check: a worker must
// refuse to start instead of running without a workflow backend.
func TestNewFailsFastOnAnUnreachableEndpoint(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	start := time.Now()
	client, err := New(ctx, Config{HostPort: "127.0.0.1:1"})
	elapsed := time.Since(start)

	require.Error(t, err)
	require.Nil(t, client)
	require.Less(t, elapsed, 20*time.Second, "the startup check must not hang")
}

func TestTaskQueueDefaults(t *testing.T) {
	require.Equal(t, "bolu-agent", taskQueue("", "bolu-agent"))
	require.Equal(t, "configured", taskQueue("configured", "bolu-agent"))
}

// TestNilClientIsSafe keeps the optional-Temporal path panic free: the API runs
// without Temporal until a workflow is started.
func TestNilClientIsSafe(t *testing.T) {
	var client *Client

	require.Nil(t, client.Client())
	require.Empty(t, client.Namespace())
	require.Empty(t, client.TaskQueueAgent())
	require.Empty(t, client.TaskQueueIntegration())
	require.NotPanics(t, client.Close)
}
