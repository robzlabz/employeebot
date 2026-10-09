package authn

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// Claims is what an access token asserts: who the caller is and which session
// they are on, so a revoked session can be rejected without a database lookup
// on every request.
type Claims struct {
	UserID    uuid.UUID
	SessionID uuid.UUID
	ExpiresAt time.Time
	IssuedAt  time.Time
}

// Issuer signs and verifies access tokens with a shared secret (HS256).
type Issuer struct {
	secret []byte
	ttl    time.Duration
	now    func() time.Time
}

// NewIssuer builds an issuer. A missing secret is a configuration error: an
// empty signing key would make every token forgeable.
func NewIssuer(secret string, ttl time.Duration) (*Issuer, error) {
	if secret == "" {
		return nil, errors.New("authn: jwt secret is required")
	}
	if ttl <= 0 {
		return nil, errors.New("authn: access token ttl must be positive")
	}
	return &Issuer{secret: []byte(secret), ttl: ttl, now: time.Now}, nil
}

// TTL reports how long a newly issued token lives.
func (i *Issuer) TTL() time.Duration {
	if i == nil {
		return 0
	}
	return i.ttl
}

// Issue signs an access token for the user and their current session.
func (i *Issuer) Issue(userID, sessionID uuid.UUID) (string, time.Time, error) {
	if i == nil {
		return "", time.Time{}, errors.New("authn: issuer is not configured")
	}
	if userID == uuid.Nil {
		return "", time.Time{}, errors.New("authn: user id is required")
	}

	now := i.now()
	expiresAt := now.Add(i.ttl)

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.RegisteredClaims{
		Subject:   userID.String(),
		ID:        sessionID.String(),
		IssuedAt:  jwt.NewNumericDate(now),
		ExpiresAt: jwt.NewNumericDate(expiresAt),
	})

	signed, err := token.SignedString(i.secret)
	if err != nil {
		return "", time.Time{}, fmt.Errorf("authn: sign access token: %w", err)
	}
	return signed, expiresAt, nil
}

// Verify checks the signature and the expiry and returns the claims.
func (i *Issuer) Verify(token string) (Claims, error) {
	if i == nil {
		return Claims{}, errors.New("authn: issuer is not configured")
	}
	if token == "" {
		return Claims{}, errors.New("authn: access token is required")
	}

	parsed, err := jwt.ParseWithClaims(token, &jwt.RegisteredClaims{}, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("authn: unexpected signing method %v", t.Header["alg"])
		}
		return i.secret, nil
	}, jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}))
	if err != nil {
		return Claims{}, fmt.Errorf("authn: invalid access token: %w", err)
	}

	registered, ok := parsed.Claims.(*jwt.RegisteredClaims)
	if !ok {
		return Claims{}, errors.New("authn: invalid access token claims")
	}

	userID, err := uuid.Parse(registered.Subject)
	if err != nil {
		return Claims{}, errors.New("authn: access token subject is not a user id")
	}

	sessionID, err := uuid.Parse(registered.ID)
	if err != nil {
		return Claims{}, errors.New("authn: access token has no session id")
	}

	claims := Claims{UserID: userID, SessionID: sessionID}
	if registered.ExpiresAt != nil {
		claims.ExpiresAt = registered.ExpiresAt.Time
	}
	if registered.IssuedAt != nil {
		claims.IssuedAt = registered.IssuedAt.Time
	}

	return claims, nil
}
