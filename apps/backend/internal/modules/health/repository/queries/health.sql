-- name: Ping :one
-- Proves the database is reachable. Kept as the health module's only query so
-- the sqlc pipeline (generate + diff gate in CI) is exercised from day one.
SELECT 1::int AS ok;
