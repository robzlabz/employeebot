package authn

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

func newIssuer(t *testing.T, secret string, ttl time.Duration) *Issuer {
	t.Helper()

	issuer, err := NewIssuer(secret, ttl)
	if err != nil {
		t.Fatalf("new issuer: %v", err)
	}
	return issuer
}

func TestNewIssuerRequiresSecretAndTTL(t *testing.T) {
	if _, err := NewIssuer("", time.Minute); err == nil {
		t.Fatal("an empty secret must be rejected: every token would be forgeable")
	}
	if _, err := NewIssuer("secret", 0); err == nil {
		t.Fatal("a non-positive ttl must be rejected")
	}
}

func TestIssueAndVerify(t *testing.T) {
	issuer := newIssuer(t, "test-secret", 15*time.Minute)
	userID, sessionID := uuid.New(), uuid.New()

	token, expiresAt, err := issuer.Issue(userID, sessionID)
	if err != nil {
		t.Fatalf("issue: %v", err)
	}
	if token == "" {
		t.Fatal("issue returned an empty token")
	}
	if !expiresAt.After(time.Now()) {
		t.Fatalf("expiry %s is not in the future", expiresAt)
	}

	claims, err := issuer.Verify(token)
	if err != nil {
		t.Fatalf("verify: %v", err)
	}
	if claims.UserID != userID {
		t.Fatalf("user id: expected %s, got %s", userID, claims.UserID)
	}
	if claims.SessionID != sessionID {
		t.Fatalf("session id: expected %s, got %s", sessionID, claims.SessionID)
	}
}

func TestIssueRequiresUserID(t *testing.T) {
	issuer := newIssuer(t, "test-secret", time.Minute)

	if _, _, err := issuer.Issue(uuid.Nil, uuid.New()); err == nil {
		t.Fatal("a zero user id must be rejected")
	}
}

func TestVerifyRejectsBadTokens(t *testing.T) {
	issuer := newIssuer(t, "test-secret", time.Minute)
	userID, sessionID := uuid.New(), uuid.New()

	valid, _, err := issuer.Issue(userID, sessionID)
	if err != nil {
		t.Fatalf("issue: %v", err)
	}

	otherIssuer := newIssuer(t, "another-secret", time.Minute)
	foreign, _, err := otherIssuer.Issue(userID, sessionID)
	if err != nil {
		t.Fatalf("issue with another secret: %v", err)
	}

	expired := newIssuer(t, "test-secret", time.Minute)
	expired.now = func() time.Time { return time.Now().Add(-2 * time.Minute) }
	expiredToken, _, err := expired.Issue(userID, sessionID)
	if err != nil {
		t.Fatalf("issue expired: %v", err)
	}

	// A token signed with "none" must never be accepted.
	unsigned, err := jwt.NewWithClaims(jwt.SigningMethodNone, jwt.RegisteredClaims{
		Subject: userID.String(),
		ID:      sessionID.String(),
	}).SignedString(jwt.UnsafeAllowNoneSignatureType)
	if err != nil {
		t.Fatalf("build unsigned token: %v", err)
	}

	cases := map[string]string{
		"empty":               "",
		"garbage":             "not-a-token",
		"wrong secret":        foreign,
		"expired":             expiredToken,
		"unsigned (alg=none)": unsigned,
		"tampered":            valid[:len(valid)-2] + "xx",
	}

	for name, token := range cases {
		t.Run(name, func(t *testing.T) {
			if _, err := issuer.Verify(token); err == nil {
				t.Fatal("expected the token to be rejected")
			}
		})
	}
}

// TestVerifyRejectsTokenWithoutSessionID keeps a token that was not issued by
// this issuer's Issue (so it carries no session) from being accepted.
func TestVerifyRejectsTokenWithoutSessionID(t *testing.T) {
	issuer := newIssuer(t, "test-secret", time.Minute)

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.RegisteredClaims{
		Subject:   uuid.NewString(),
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Minute)),
	})
	signed, err := token.SignedString([]byte("test-secret"))
	if err != nil {
		t.Fatalf("sign: %v", err)
	}

	if _, err := issuer.Verify(signed); err == nil {
		t.Fatal("a token without a session id must be rejected")
	}
}

func TestTTL(t *testing.T) {
	issuer := newIssuer(t, "test-secret", 42*time.Minute)

	if got := issuer.TTL(); got != 42*time.Minute {
		t.Fatalf("expected 42m, got %s", got)
	}

	var nilIssuer *Issuer
	if got := nilIssuer.TTL(); got != 0 {
		t.Fatalf("a nil issuer must report a zero ttl, got %s", got)
	}
	if _, _, err := nilIssuer.Issue(uuid.New(), uuid.New()); err == nil {
		t.Fatal("a nil issuer must refuse to issue")
	}
	if _, err := nilIssuer.Verify("token"); err == nil {
		t.Fatal("a nil issuer must refuse to verify")
	}
}

func TestIssuerRejectsTokenSignedWithDifferentAlgorithm(t *testing.T) {
	issuer := newIssuer(t, "test-secret", time.Minute)

	// HS512 is a valid HMAC algorithm but not the one this issuer accepts.
	token := jwt.NewWithClaims(jwt.SigningMethodHS512, jwt.RegisteredClaims{
		Subject:   uuid.NewString(),
		ID:        uuid.NewString(),
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Minute)),
	})
	signed, err := token.SignedString([]byte("test-secret"))
	if err != nil {
		t.Fatalf("sign: %v", err)
	}

	if _, err := issuer.Verify(signed); err == nil {
		t.Fatal("a token signed with another algorithm must be rejected")
	}
}
