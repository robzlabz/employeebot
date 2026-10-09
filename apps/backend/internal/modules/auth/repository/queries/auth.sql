-- name: CreateUser :one
-- Password accounts. The caller stores the argon2id hash, never the password.
INSERT INTO users (email, password_hash)
VALUES ($1, $2)
RETURNING *;

-- name: CreateGoogleUser :one
-- Google accounts start with an empty password hash and are already verified:
-- the provider asserted the address.
INSERT INTO users (email, google_subject, email_verified_at)
VALUES ($1, $2, now())
RETURNING *;

-- name: GetUserByEmail :one
SELECT * FROM users WHERE lower(email) = lower($1);

-- name: GetUserByID :one
SELECT * FROM users WHERE id = $1;

-- name: GetUserByGoogleSubject :one
SELECT * FROM users WHERE google_subject = $1;

-- name: LinkGoogleSubject :one
-- Links a Google identity to an existing account with the same email, so a user
-- who signed up with a password is not duplicated.
UPDATE users
SET google_subject = $2,
    email_verified_at = COALESCE(email_verified_at, now()),
    updated_at = now()
WHERE id = $1
RETURNING *;

-- name: MarkEmailVerified :one
UPDATE users
SET email_verified_at = COALESCE(email_verified_at, now()),
    updated_at = now()
WHERE id = $1
RETURNING *;

-- name: UpdatePasswordHash :one
UPDATE users
SET password_hash = $2, updated_at = now()
WHERE id = $1
RETURNING *;

-- name: MarkOnboarded :one
UPDATE users
SET onboarded_at = COALESCE(onboarded_at, now()), updated_at = now()
WHERE id = $1
RETURNING *;

-- name: CreateSession :one
INSERT INTO sessions (user_id, refresh_token_hash, user_agent, ip, expires_at, rotated_from)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetSessionByTokenHash :one
SELECT * FROM sessions WHERE refresh_token_hash = $1;

-- name: RevokeSession :execrows
UPDATE sessions
SET revoked_at = now()
WHERE id = $1 AND revoked_at IS NULL;

-- name: RevokeSessionByTokenHash :execrows
UPDATE sessions
SET revoked_at = now()
WHERE refresh_token_hash = $1 AND revoked_at IS NULL;

-- name: RevokeSessionsForUser :execrows
-- Used after a password reset: every existing session must be re-established.
UPDATE sessions
SET revoked_at = now()
WHERE user_id = $1 AND revoked_at IS NULL;

-- name: DeleteExpiredSessions :execrows
DELETE FROM sessions WHERE expires_at < now();

-- name: CreateEmailVerificationToken :one
INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
VALUES ($1, $2, $3)
RETURNING *;

-- name: ConsumeEmailVerificationToken :one
-- Single use is enforced by the UPDATE: the second call matches no row.
UPDATE email_verification_tokens
SET used_at = now()
WHERE token_hash = $1
  AND used_at IS NULL
  AND expires_at > now()
RETURNING *;

-- name: InvalidateEmailVerificationTokens :execrows
UPDATE email_verification_tokens
SET used_at = now()
WHERE user_id = $1 AND used_at IS NULL;

-- name: CreatePasswordResetToken :one
INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
VALUES ($1, $2, $3)
RETURNING *;

-- name: ConsumePasswordResetToken :one
UPDATE password_reset_tokens
SET used_at = now()
WHERE token_hash = $1
  AND used_at IS NULL
  AND expires_at > now()
RETURNING *;

-- name: InvalidatePasswordResetTokens :execrows
UPDATE password_reset_tokens
SET used_at = now()
WHERE user_id = $1 AND used_at IS NULL;

-- name: GetSessionByID :one
-- The access token carries the session id; this is how a request proves its
-- session is still alive (not revoked, not expired).
SELECT * FROM sessions WHERE id = $1;
