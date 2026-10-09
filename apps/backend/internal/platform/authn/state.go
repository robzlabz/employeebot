package authn

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"
)

// StateSigner signs and verifies the OAuth `state` value. The state is
// stateless: a random nonce plus an expiry, authenticated with HMAC, so no
// storage is needed between the consent redirect and the callback.
type StateSigner struct {
	secret []byte
	ttl    time.Duration
	now    func() time.Time
}

// ErrInvalidState means the state is missing, tampered with, or expired.
var ErrInvalidState = errors.New("authn: oauth state is invalid or expired")

// NewStateSigner builds a signer. The secret is required: an unsigned state
// provides no CSRF protection at all.
func NewStateSigner(secret string, ttl time.Duration) (*StateSigner, error) {
	if secret == "" {
		return nil, errors.New("authn: state signing secret is required")
	}
	if ttl <= 0 {
		return nil, errors.New("authn: state ttl must be positive")
	}
	return &StateSigner{secret: []byte(secret), ttl: ttl, now: time.Now}, nil
}

// Sign returns a fresh state value: "<nonce>.<expiry>.<signature>".
func (s *StateSigner) Sign() (string, error) {
	if s == nil {
		return "", errors.New("authn: state signer is not configured")
	}

	nonce := make([]byte, 16)
	if _, err := rand.Read(nonce); err != nil {
		return "", fmt.Errorf("authn: generate state nonce: %w", err)
	}

	expiry := s.now().Add(s.ttl).Unix()
	payload := base64.RawURLEncoding.EncodeToString(nonce) + "." + strconv.FormatInt(expiry, 10)

	return payload + "." + s.signature(payload), nil
}

// Verify checks the signature and the expiry of a state value.
func (s *StateSigner) Verify(state string) error {
	if s == nil {
		return errors.New("authn: state signer is not configured")
	}
	if state == "" {
		return ErrInvalidState
	}

	parts := strings.Split(state, ".")
	if len(parts) != 3 {
		return ErrInvalidState
	}

	payload := parts[0] + "." + parts[1]
	if !hmac.Equal([]byte(s.signature(payload)), []byte(parts[2])) {
		return ErrInvalidState
	}

	expiry, err := strconv.ParseInt(parts[1], 10, 64)
	if err != nil {
		return ErrInvalidState
	}
	if s.now().After(time.Unix(expiry, 0)) {
		return fmt.Errorf("%w: expired", ErrInvalidState)
	}

	return nil
}

func (s *StateSigner) signature(payload string) string {
	mac := hmac.New(sha256.New, s.secret)
	mac.Write([]byte(payload))
	return hex.EncodeToString(mac.Sum(nil))
}
