-- Usage ledger access: the write that every provider call makes, and the daily
-- aggregation the dashboard and the quota screen read.

-- name: InsertUsageEntry :one
-- One row per provider call. This is the audit trail of what a workspace spent,
-- so it is inserted even when the call later failed to be useful.
INSERT INTO usage_ledger (
    workspace_id, agent_id, task_id, provider, model, purpose,
    input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, cost_micros
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
RETURNING id, created_at;

-- name: SumTokensSince :one
-- The durable quota fallback: the live counter lives in Redis, but a Redis
-- restart must not silently grant a fresh allowance.
SELECT COALESCE(sum(input_tokens + output_tokens), 0)::bigint AS tokens
FROM usage_ledger
WHERE workspace_id = $1 AND created_at >= $2;

-- name: ListDailyUsage :many
-- Per-day totals, most recent first. Days follow Asia/Jakarta, which is where
-- the customers are.
SELECT * FROM usage_daily
WHERE workspace_id = $1 AND day >= $2
ORDER BY day DESC, provider, model;
