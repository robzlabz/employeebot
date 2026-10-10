-- Provider configuration of a workspace. Every query is scoped by workspace_id
-- as well as by the Row Level Security policy, so a wrong id in application
-- code still cannot reach another tenant's row.

-- name: ListProviders :many
-- The settings screen: every provider, the default first and then the fallback
-- order. Disabled ones are included, because the screen shows them greyed out.
SELECT * FROM llm_providers
WHERE workspace_id = $1
ORDER BY is_default DESC, priority, created_at;

-- name: GetProvider :one
SELECT * FROM llm_providers WHERE id = $1 AND workspace_id = $2;

-- name: CreateProvider :one
INSERT INTO llm_providers (
    workspace_id, name, adapter, base_url, model, api_key_encrypted,
    priority, max_tokens, context_tokens, is_default, enabled
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
RETURNING *;

-- name: UpdateProvider :one
-- The key has three states, and they are not the same thing:
--   NULL   → keep the stored key (the settings screen never receives the secret
--            back, so it cannot send it again; renaming must not wipe it);
--   ''     → clear the key (the operator removed it);
--   bytes  → replace it with this ciphertext.
UPDATE llm_providers
SET name = $3,
    adapter = $4,
    base_url = $5,
    model = $6,
    api_key_encrypted = CASE
        WHEN sqlc.arg('api_key_encrypted')::bytea IS NULL THEN api_key_encrypted
        ELSE NULLIF(sqlc.arg('api_key_encrypted')::bytea, ''::bytea)
    END,
    priority = $7,
    max_tokens = $8,
    context_tokens = $9,
    is_default = $10,
    enabled = $11,
    updated_at = now()
WHERE id = $1 AND workspace_id = $2
RETURNING *;

-- name: DeleteProvider :execrows
DELETE FROM llm_providers WHERE id = $1 AND workspace_id = $2;

-- name: ClearDefaultProviders :execrows
-- At most one default exists (partial unique index), so a new default is set by
-- clearing the others in the same transaction.
UPDATE llm_providers
SET is_default = false, updated_at = now()
WHERE workspace_id = $1 AND id <> $2 AND is_default;
