package integration

import (
	"context"
	"testing"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/require"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/wait"

	"github.com/robzlabz/employeebot/apps/backend/internal/platform/ratelimit"
)

// redisURL starts a Redis container and returns its URL.
func redisURL(t *testing.T) string {
	t.Helper()

	testcontainers.SkipIfProviderIsNotHealthy(t)

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	t.Cleanup(cancel)

	container, err := testcontainers.GenericContainer(ctx, testcontainers.GenericContainerRequest{
		ContainerRequest: testcontainers.ContainerRequest{
			Image:        "redis:7-alpine",
			ExposedPorts: []string{"6379/tcp"},
			WaitingFor:   wait.ForLog("Ready to accept connections").WithStartupTimeout(2 * time.Minute),
		},
		Started: true,
	})
	require.NoError(t, err, "start redis container")

	t.Cleanup(func() {
		cleanupCtx, cleanupCancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cleanupCancel()
		require.NoError(t, container.Terminate(cleanupCtx))
	})

	host, err := container.Host(ctx)
	require.NoError(t, err)
	port, err := container.MappedPort(ctx, "6379")
	require.NoError(t, err)

	return "redis://" + host + ":" + port.Port() + "/0"
}

func newLimiter(t *testing.T) *ratelimit.Limiter {
	t.Helper()

	options, err := redis.ParseURL(redisURL(t))
	require.NoError(t, err)

	client := redis.NewClient(options)
	t.Cleanup(func() { _ = client.Close() })

	return ratelimit.New(client)
}

// TestLimiterBurstIsBounded is the contract the login throttle depends on: a
// burst is capped, and the excess is refused with a retry delay.
func TestLimiterBurstIsBounded(t *testing.T) {
	ctx := t.Context()
	limiter := newLimiter(t)

	// A slow refill so the burst is what is measured, not the refill.
	const capacity = 3
	const refill = 0.01

	allowed := 0
	var lastRetry time.Duration
	for range capacity + 2 {
		result, err := limiter.Allow(ctx, "test:burst", capacity, refill)
		require.NoError(t, err)

		if result.Allowed {
			allowed++
			continue
		}
		lastRetry = result.RetryAfter
	}

	require.Equal(t, capacity, allowed, "exactly the capacity must be allowed")
	require.Positive(t, lastRetry, "a refused attempt must say when to retry")
}

// TestLimiterRefillsOverTime proves the bucket recovers, so a legitimate user is
// only slowed down, never locked out.
func TestLimiterRefillsOverTime(t *testing.T) {
	ctx := t.Context()
	limiter := newLimiter(t)

	// Capacity 1 with a fast refill: after the refill window a new token exists.
	result, err := limiter.Allow(ctx, "test:refill", 1, 20)
	require.NoError(t, err)
	require.True(t, result.Allowed)

	result, err = limiter.Allow(ctx, "test:refill", 1, 20)
	require.NoError(t, err)
	require.False(t, result.Allowed, "the burst is spent")

	time.Sleep(120 * time.Millisecond)

	result, err = limiter.Allow(ctx, "test:refill", 1, 20)
	require.NoError(t, err)
	require.True(t, result.Allowed, "the bucket must refill")
}

// TestLimiterKeysAreIndependent keeps one account's failed attempts from
// throttling another.
func TestLimiterKeysAreIndependent(t *testing.T) {
	ctx := t.Context()
	limiter := newLimiter(t)

	for range 3 {
		_, err := limiter.Allow(ctx, "test:email:a@example.com", 1, 0.01)
		require.NoError(t, err)
	}

	result, err := limiter.Allow(ctx, "test:email:a@example.com", 1, 0.01)
	require.NoError(t, err)
	require.False(t, result.Allowed)

	result, err = limiter.Allow(ctx, "test:email:b@example.com", 1, 0.01)
	require.NoError(t, err)
	require.True(t, result.Allowed, "another key must have its own bucket")
}

// TestLimiterReset clears a bucket, which is what a successful sign-in does.
func TestLimiterReset(t *testing.T) {
	ctx := t.Context()
	limiter := newLimiter(t)

	result, err := limiter.Allow(ctx, "test:reset", 1, 0.01)
	require.NoError(t, err)
	require.True(t, result.Allowed)

	result, err = limiter.Allow(ctx, "test:reset", 1, 0.01)
	require.NoError(t, err)
	require.False(t, result.Allowed)

	require.NoError(t, limiter.Reset(ctx, "test:reset"))

	result, err = limiter.Allow(ctx, "test:reset", 1, 0.01)
	require.NoError(t, err)
	require.True(t, result.Allowed, "a reset bucket must be full again")
}

// TestLimiterIsAtomic proves the bucket survives concurrent callers: with a
// capacity of N, exactly N attempts may pass even when they race.
func TestLimiterIsAtomic(t *testing.T) {
	ctx := t.Context()
	limiter := newLimiter(t)

	const capacity = 5
	const callers = 40

	results := make(chan bool, callers)
	for range callers {
		go func() {
			result, err := limiter.Allow(ctx, "test:race", capacity, 0.01)
			results <- err == nil && result.Allowed
		}()
	}

	allowed := 0
	for range callers {
		if <-results {
			allowed++
		}
	}

	require.Equal(t, capacity, allowed, "concurrent callers must not each take the last token")
}
