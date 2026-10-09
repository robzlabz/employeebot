package domain

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"time"

	"github.com/google/uuid"
)

// The ports below are declared here, in the domain, and implemented by the
// platform packages. The service therefore depends on nothing but its own
// domain, and the container is the only place that knows which implementation
// is wired in.

// AccessClaims is what an access token asserts.
type AccessClaims struct {
	UserID    uuid.UUID
	SessionID uuid.UUID
}

// TokenIssuer signs and verifies access tokens.
type TokenIssuer interface {
	Issue(userID, sessionID uuid.UUID) (string, time.Time, error)
	Verify(token string) (AccessClaims, error)
}

// StateSigner signs and verifies the OAuth state value.
type StateSigner interface {
	Sign() (string, error)
	Verify(state string) error
}

// Mailer delivers a transactional email.
type Mailer interface {
	Send(ctx context.Context, to, subject, body string) error
}

// GoogleUser is the identity Google asserts for a signed-in user.
type GoogleUser struct {
	Subject       string
	Email         string
	EmailVerified bool
}

// GoogleProvider is the Google code-flow client.
type GoogleProvider interface {
	// AuthCodeURL builds the consent URL for a state value.
	AuthCodeURL(state string) string
	// Exchange trades the authorization code for the user's identity.
	Exchange(ctx context.Context, code string) (GoogleUser, error)
}

// ThrottleResult is the outcome of one throttled attempt.
type ThrottleResult struct {
	Allowed    bool
	RetryAfter time.Duration
}

// LoginThrottle limits repeated login attempts per key.
type LoginThrottle interface {
	Allow(ctx context.Context, key string, capacity int, refill float64) (ThrottleResult, error)
	Reset(ctx context.Context, key string) error
}

// Passwords hashes and verifies account passwords, and enforces the password
// policy. The argon2id implementation lives in the platform layer.
type Passwords interface {
	Hash(password string) (string, error)
	Verify(hash, password string) (bool, error)
	Validate(password string) error
}

// Tokens generates one-time tokens and the hash to store.
type Tokens interface {
	Generate() (raw string, hash string, err error)
}

// HashToken hashes a one-time token for storage. The token is high-entropy
// random, so SHA-256 is enough; only the hash is persisted.
func HashToken(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}
