package temporal

import (
	"testing"

	"github.com/stretchr/testify/require"
	"go.temporal.io/sdk/testsuite"
)

// TestWorkerPingWorkflow is the reference workflow test for the Temporal
// harness: EPIC 6 (#52) adds the agent workflow tests next to it.
func TestWorkerPingWorkflow(t *testing.T) {
	suite := &testsuite.WorkflowTestSuite{}
	env := suite.NewTestWorkflowEnvironment()

	env.RegisterWorkflow(WorkerPingWorkflow)
	env.RegisterActivity(WorkerPingActivity)

	env.ExecuteWorkflow(WorkerPingWorkflow, "agent-worker")

	require.True(t, env.IsWorkflowCompleted())
	require.NoError(t, env.GetWorkflowError())

	var result string
	require.NoError(t, env.GetWorkflowResult(&result))
	require.Equal(t, "agent-worker pong", result)
}

func TestWorkerPingActivityDefaultsTheName(t *testing.T) {
	result, err := WorkerPingActivity(t.Context(), "")

	require.NoError(t, err)
	require.Equal(t, "worker pong", result)
}
