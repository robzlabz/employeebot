-- The per-Bolu model override.
--
-- It lives in agents.default_model, which the agent module owns, because that is
-- where the profile it belongs to is stored. The shape of the value is this
-- module's concern: the provider id, the model, and the sealed per-Bolu key. The
-- agent registry treats the column as an opaque JSONB document and never reads
-- into it, which is why the two modules do not disagree about its contents.

-- name: GetAgentModelOverride :one
SELECT default_model FROM agents
WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL;

-- name: SetAgentModelOverride :execrows
UPDATE agents
SET default_model = $3, updated_at = now()
WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL;
