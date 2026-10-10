package authn

import (
	"errors"
	"strings"
	"testing"
	"time"
)

func newSigner(t *testing.T, ttl time.Duration) *StateSigner {
	t.Helper()

	signer, err := NewStateSigner("state-secret", ttl)
	if err != nil {
		t.Fatalf("new signer: %v", err)
	}
	return signer
}

func TestNewStateSignerRequiresSecretAndTTL(t *testing.T) {
	if _, err := NewStateSigner("", time.Minute); err == nil {
		t.Fatal("an empty secret must be rejected: the state would not be authenticated")
	}
	if _, err := NewStateSigner("secret", 0); err == nil {
		t.Fatal("a non-positive ttl must be rejected")
	}
}

func TestStateSignAndVerify(t *testing.T) {
	signer := newSigner(t, 10*time.Minute)

	state, err := signer.Sign()
	if err != nil {
		t.Fatalf("sign: %v", err)
	}
	if parts := strings.Split(state, "."); len(parts) != 3 {
		t.Fatalf("state %q is not nonce.expiry.signature", state)
	}

	if err := signer.Verify(state); err != nil {
		t.Fatalf("verify: %v", err)
	}

	other, err := signer.Sign()
	if err != nil {
		t.Fatalf("sign second: %v", err)
	}
	if other == state {
		t.Fatal("two states are identical: the nonce is not random")
	}
}

// tamper flips the last character of a signed value.
//
// It replaces rather than appends: the previous form appended a "0", which left
// the value untouched whenever the signature already ended in one, so the test
// passed for the wrong reason roughly one run in sixty.
func tamper(value string) string {
	if value == "" {
		return "x"
	}

	last := value[len(value)-1]
	replacement := byte('A')
	if last == 'A' {
		replacement = 'B'
	}
	return value[:len(value)-1] + string(replacement)
}

func TestStateVerifyRejectsBadValues(t *testing.T) {
	signer := newSigner(t, 10*time.Minute)

	valid, err := signer.Sign()
	if err != nil {
		t.Fatalf("sign: %v", err)
	}

	foreign, err := NewStateSigner("another-secret", 10*time.Minute)
	if err != nil {
		t.Fatalf("new foreign signer: %v", err)
	}
	foreignState, err := foreign.Sign()
	if err != nil {
		t.Fatalf("sign foreign: %v", err)
	}

	expiredSigner := newSigner(t, time.Minute)
	expiredSigner.now = func() time.Time { return time.Now().Add(-2 * time.Minute) }
	expiredState, err := expiredSigner.Sign()
	if err != nil {
		t.Fatalf("sign expired: %v", err)
	}

	cases := map[string]string{
		"empty":        "",
		"garbage":      "garbage",
		"two parts":    "nonce.expiry",
		"tampered":     tamper(valid),
		"other secret": foreignState,
		"expired":      expiredState,
	}

	for name, state := range cases {
		t.Run(name, func(t *testing.T) {
			err := signer.Verify(state)
			if err == nil {
				t.Fatal("expected the state to be rejected")
			}
			if name == "expired" && !errors.Is(err, ErrInvalidState) {
				t.Fatalf("an expired state must report ErrInvalidState, got %v", err)
			}
		})
	}
}

func TestNilStateSignerIsSafe(t *testing.T) {
	var signer *StateSigner

	if _, err := signer.Sign(); err == nil {
		t.Fatal("a nil signer must refuse to sign")
	}
	if err := signer.Verify("x.y.z"); err == nil {
		t.Fatal("a nil signer must refuse to verify")
	}
}
