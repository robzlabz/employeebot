package ratelimit

import (
	"context"
	"testing"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/require"
)

// TestAllowRequiresConfiguration documents the fail-open contract: a process
// without Redis reports that limiting is unavailable, and the caller decides.
func TestAllowRequiresConfiguration(t *testing.T) {
	var limiter *Limiter

	result, err := limiter.Allow(context.Background(), "key", 1, 1)
	require.Error(t, err)
	require.False(t, result.Allowed)
	require.Error(t, limiter.Reset(context.Background(), "key"))
}

func TestAllowValidatesArguments(t *testing.T) {
	// A limiter without a client cannot spend a token at all.
	_, err := New(nil).Allow(context.Background(), "key", 1, 1)
	require.ErrorContains(t, err, "redis is not configured")

	// The argument checks run before the script does, so a bad call is reported
	// as a programming error rather than as a Redis failure. The client is a
	// non-nil zero value, which is enough to reach them.
	limiter := &Limiter{client: redis.NewClient(&redis.Options{Addr: "127.0.0.1:1"})}
	t.Cleanup(func() { _ = limiter.client.Close() })

	_, err = limiter.Allow(context.Background(), "key", 0, 1)
	require.ErrorContains(t, err, "capacity must be positive")

	_, err = limiter.Allow(context.Background(), "key", 1, 0)
	require.ErrorContains(t, err, "refill rate must be positive")
}

func TestToInt64(t *testing.T) {
	value, err := toInt64(int64(7))
	require.NoError(t, err)
	require.Equal(t, int64(7), value)

	value, err = toInt64("12")
	require.NoError(t, err)
	require.Equal(t, int64(12), value)

	_, err = toInt64("not a number")
	require.Error(t, err)

	_, err = toInt64(3.5)
	require.Error(t, err)
}

// TestBucketScriptIsRegistered guards that the Lua script exists and hashes to
// something stable. The behaviour of the script itself (refill, burst, retry
// delay) is asserted against a real Redis in test/integration.
func TestBucketScriptIsRegistered(t *testing.T) {
	require.NotNil(t, bucketScript)
	require.NotEmpty(t, bucketScript.Hash())
}

func TestResultCarriesRetryDelay(t *testing.T) {
	result := Result{Allowed: false, RetryAfter: 1500 * time.Millisecond}

	require.False(t, result.Allowed)
	require.Equal(t, 1500*time.Millisecond, result.RetryAfter)
}
