// Package ratelimit implements the Redis token bucket used for login attempts
// and, later, per-integration API budgets. The bucket is atomic (a Lua script),
// so parallel workers cannot each spend the last token.
package ratelimit

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
)

// bucketScript refills the bucket according to elapsed time and then tries to
// take one token. It returns {allowed, remaining_millis_until_next_token}.
//
// KEYS[1] bucket key
// ARGV[1] capacity
// ARGV[2] refill tokens per second
// ARGV[3] now in unix milliseconds
var bucketScript = redis.NewScript(`
local capacity = tonumber(ARGV[1])
local rate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

local state = redis.call('HMGET', KEYS[1], 'tokens', 'updated')
local tokens = tonumber(state[1])
local updated = tonumber(state[2])

if tokens == nil then
  tokens = capacity
  updated = now
end

local elapsed = math.max(0, now - updated) / 1000
tokens = math.min(capacity, tokens + elapsed * rate)

local allowed = 0
local retry_after = 0
if tokens >= 1 then
  tokens = tokens - 1
  allowed = 1
else
  retry_after = math.ceil((1 - tokens) / rate * 1000)
end

redis.call('HSET', KEYS[1], 'tokens', tokens, 'updated', now)
-- Buckets are idle most of the time; keep them only as long as a full refill
-- needs, with a floor so a slow bucket still survives a burst.
local ttl = math.ceil(capacity / rate * 1000) + 1000
redis.call('PEXPIRE', KEYS[1], ttl)

return {allowed, retry_after}
`)

// Limiter spends tokens from Redis buckets.
type Limiter struct {
	client *redis.Client
}

// New builds a limiter. A nil client is allowed: Allow then reports that
// limiting is not configured, and the caller decides whether that is fatal.
func New(client *redis.Client) *Limiter {
	return &Limiter{client: client}
}

// Result is the outcome of one attempt.
type Result struct {
	Allowed    bool
	RetryAfter time.Duration
}

// Allow takes one token from the bucket for key. capacity is the burst size and
// refill is the steady rate in tokens per second.
func (l *Limiter) Allow(ctx context.Context, key string, capacity int, refill float64) (Result, error) {
	if l == nil || l.client == nil {
		return Result{}, fmt.Errorf("ratelimit: redis is not configured")
	}
	if capacity <= 0 {
		return Result{}, fmt.Errorf("ratelimit: capacity must be positive")
	}
	if refill <= 0 {
		return Result{}, fmt.Errorf("ratelimit: refill rate must be positive")
	}

	raw, err := bucketScript.Run(ctx, l.client, []string{key},
		capacity, refill, time.Now().UnixMilli()).Slice()
	if err != nil {
		return Result{}, fmt.Errorf("ratelimit: run bucket: %w", err)
	}
	if len(raw) != 2 {
		return Result{}, fmt.Errorf("ratelimit: unexpected bucket result %v", raw)
	}

	allowed, err := toInt64(raw[0])
	if err != nil {
		return Result{}, err
	}
	retryMillis, err := toInt64(raw[1])
	if err != nil {
		return Result{}, err
	}

	return Result{
		Allowed:    allowed == 1,
		RetryAfter: time.Duration(retryMillis) * time.Millisecond,
	}, nil
}

// Reset clears a bucket, used after a successful login so a legitimate user is
// not punished for earlier typos.
func (l *Limiter) Reset(ctx context.Context, key string) error {
	if l == nil || l.client == nil {
		return fmt.Errorf("ratelimit: redis is not configured")
	}
	if err := l.client.Del(ctx, key).Err(); err != nil {
		return fmt.Errorf("ratelimit: reset bucket: %w", err)
	}
	return nil
}

func toInt64(value any) (int64, error) {
	switch typed := value.(type) {
	case int64:
		return typed, nil
	case string:
		parsed, err := strconv.ParseInt(typed, 10, 64)
		if err != nil {
			return 0, fmt.Errorf("ratelimit: parse %q: %w", typed, err)
		}
		return parsed, nil
	default:
		return 0, fmt.Errorf("ratelimit: unexpected value type %T", value)
	}
}
