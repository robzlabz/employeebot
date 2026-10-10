// Package crypto holds the secret helpers the application uses at rest. Today
// it encrypts provider API keys; the WhatsApp session in EPIC 9 (#68) reuses the
// same box rather than inventing a second scheme.
//
// The package is standard library only, so a module can depend on it through a
// narrow port without importing infrastructure.
package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"strings"
)

// KeySize is the AES-256 key length.
const KeySize = 32

// Errors reported by the box. They are deliberately distinct: a caller must be
// able to tell "nobody configured a key" from "the stored value does not
// decrypt", because the first is a deployment mistake and the second means the
// key was rotated without re-encrypting.
var (
	// ErrNoKey means no encryption key was configured.
	ErrNoKey = errors.New("crypto: no encryption key configured")
	// ErrInvalidKey means the configured key is not 32 bytes.
	ErrInvalidKey = errors.New("crypto: encryption key must be 32 bytes")
	// ErrInvalidCiphertext means the stored value is not a value this box wrote.
	ErrInvalidCiphertext = errors.New("crypto: ciphertext is invalid")
)

// Box encrypts secrets with AES-256-GCM. The nonce is random and prepended to
// the ciphertext, so the same plaintext encrypts differently every time.
type Box struct {
	aead cipher.AEAD
	// fingerprint identifies the key without revealing it, so a decrypt failure
	// can say which key was in use.
	fingerprint string
}

// New builds a box from a raw 32-byte key.
func New(key []byte) (*Box, error) {
	if len(key) != KeySize {
		return nil, fmt.Errorf("%w (got %d bytes)", ErrInvalidKey, len(key))
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, fmt.Errorf("crypto: build cipher: %w", err)
	}
	aead, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("crypto: build gcm: %w", err)
	}

	sum := sha256.Sum256(key)
	return &Box{aead: aead, fingerprint: hex.EncodeToString(sum[:4])}, nil
}

// NewFromString builds a box from a configured key. base64 (standard or URL
// safe, with or without padding) and hex are accepted, and a 32-character
// passphrase is taken as raw bytes, which is what a developer puts in .env.
func NewFromString(encoded string) (*Box, error) {
	key, err := ParseKey(encoded)
	if err != nil {
		return nil, err
	}
	return New(key)
}

// ParseKey decodes a configured key in any of the accepted forms.
func ParseKey(encoded string) ([]byte, error) {
	trimmed := strings.TrimSpace(encoded)
	if trimmed == "" {
		return nil, ErrNoKey
	}

	if decoded, err := base64.StdEncoding.DecodeString(trimmed); err == nil && len(decoded) == KeySize {
		return decoded, nil
	}
	if decoded, err := base64.RawStdEncoding.DecodeString(trimmed); err == nil && len(decoded) == KeySize {
		return decoded, nil
	}
	if decoded, err := base64.URLEncoding.DecodeString(trimmed); err == nil && len(decoded) == KeySize {
		return decoded, nil
	}
	if decoded, err := hex.DecodeString(trimmed); err == nil && len(decoded) == KeySize {
		return decoded, nil
	}
	// A raw 32-character secret, which is what `openssl rand -hex 16 | base64`
	// alternatives look like in a .env file.
	if len(trimmed) == KeySize {
		return []byte(trimmed), nil
	}

	return nil, fmt.Errorf("%w (configure %d bytes, base64 or hex)", ErrInvalidKey, KeySize)
}

// Fingerprint identifies the key for logs and diagnostics. It is a truncated
// hash, so it never reveals the key itself.
func (b *Box) Fingerprint() string {
	if b == nil {
		return ""
	}
	return b.fingerprint
}

// Encrypt seals a secret. The result is the nonce followed by the ciphertext.
func (b *Box) Encrypt(plaintext string) ([]byte, error) {
	if b == nil {
		return nil, ErrNoKey
	}

	nonce := make([]byte, b.aead.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, fmt.Errorf("crypto: read nonce: %w", err)
	}

	return b.aead.Seal(nonce, nonce, []byte(plaintext), nil), nil
}

// Decrypt opens a value this box wrote. A value written with a different key
// fails with ErrInvalidCiphertext instead of returning garbage.
func (b *Box) Decrypt(ciphertext []byte) (string, error) {
	if b == nil {
		return "", ErrNoKey
	}

	size := b.aead.NonceSize()
	if len(ciphertext) < size+b.aead.Overhead() {
		return "", ErrInvalidCiphertext
	}

	nonce, sealed := ciphertext[:size], ciphertext[size:]
	plaintext, err := b.aead.Open(nil, nonce, sealed, nil)
	if err != nil {
		return "", fmt.Errorf("%w (key %s): %w", ErrInvalidCiphertext, b.fingerprint, err)
	}

	return string(plaintext), nil
}
