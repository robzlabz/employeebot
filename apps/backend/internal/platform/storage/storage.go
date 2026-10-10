// Package storage holds the object storage the application writes files to.
//
// Attachments, scan results, and exports go here rather than into Postgres, so a
// large file never passes through the database and a row stays cheap to read.
// Two drivers exist: an S3-compatible one for anything deployed, and a local
// directory for development and tests, which is what lets the attachment path be
// exercised without a container.
package storage

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

// Errors reported by every driver.
var (
	// ErrNotConfigured means no storage driver was configured.
	ErrNotConfigured = errors.New("storage: not configured")
	// ErrObjectNotFound means the key does not exist.
	ErrObjectNotFound = errors.New("storage: object not found")
	// ErrKeyEscapesRoot means a key would resolve outside the storage root.
	ErrKeyEscapesRoot = errors.New("storage: key escapes the storage root")
)

// Object is one stored file.
type Object struct {
	Key         string
	ContentType string
	ByteSize    int64
	// ChecksumSHA256 is the hex digest of the content, which is what lets a
	// caller verify what it stored.
	ChecksumSHA256 string
}

// Store writes and reads objects by key.
type Store interface {
	// Put stores content under key and returns what it stored.
	Put(ctx context.Context, key, contentType string, content []byte) (Object, error)
	// Get returns the content of one key.
	Get(ctx context.Context, key string) ([]byte, error)
	// Delete removes one key. Removing something absent is not an error, so a
	// retry after a partial failure converges.
	Delete(ctx context.Context, key string) error
	// Driver names the implementation, for logs and the readiness probe.
	Driver() string
}

// Digest is the hex SHA-256 of content.
func Digest(content []byte) string {
	sum := sha256.Sum256(content)
	return hex.EncodeToString(sum[:])
}

// ------------------------------------------------------------- local driver

// LocalStore keeps objects as files under a root directory. It is what
// development and the tests use: no container, no credentials, and the files are
// inspectable.
type LocalStore struct {
	root string
}

// NewLocal builds a local store, creating the root when it does not exist.
func NewLocal(root string) (*LocalStore, error) {
	if strings.TrimSpace(root) == "" {
		return nil, fmt.Errorf("%w: root directory is required", ErrNotConfigured)
	}
	if err := os.MkdirAll(root, 0o755); err != nil {
		return nil, fmt.Errorf("storage: create root %s: %w", root, err)
	}

	absolute, err := filepath.Abs(root)
	if err != nil {
		return nil, fmt.Errorf("storage: resolve root %s: %w", root, err)
	}
	return &LocalStore{root: absolute}, nil
}

// Driver implements Store.
func (l *LocalStore) Driver() string { return "local" }

// Put implements Store.
func (l *LocalStore) Put(_ context.Context, key, contentType string, content []byte) (Object, error) {
	path, err := l.path(key)
	if err != nil {
		return Object{}, err
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return Object{}, fmt.Errorf("storage: create directory: %w", err)
	}
	if err := os.WriteFile(path, content, 0o644); err != nil {
		return Object{}, fmt.Errorf("storage: write %s: %w", key, err)
	}

	return Object{Key: key, ContentType: contentType, ByteSize: int64(len(content)), ChecksumSHA256: Digest(content)}, nil
}

// Get implements Store.
func (l *LocalStore) Get(_ context.Context, key string) ([]byte, error) {
	path, err := l.path(key)
	if err != nil {
		return nil, err
	}

	content, err := os.ReadFile(path)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return nil, fmt.Errorf("%w: %s", ErrObjectNotFound, key)
		}
		return nil, fmt.Errorf("storage: read %s: %w", key, err)
	}
	return content, nil
}

// Delete implements Store.
func (l *LocalStore) Delete(_ context.Context, key string) error {
	path, err := l.path(key)
	if err != nil {
		return err
	}
	if err := os.Remove(path); err != nil && !errors.Is(err, os.ErrNotExist) {
		return fmt.Errorf("storage: delete %s: %w", key, err)
	}
	return nil
}

// path resolves a key under the root and refuses anything that would land
// outside it, which is the check that makes a crafted key harmless.
func (l *LocalStore) path(key string) (string, error) {
	cleaned := strings.TrimPrefix(strings.TrimSpace(key), "/")
	if cleaned == "" {
		return "", fmt.Errorf("%w: empty key", ErrKeyEscapesRoot)
	}

	resolved := filepath.Join(l.root, filepath.FromSlash(cleaned))
	if resolved != l.root && !strings.HasPrefix(resolved, l.root+string(os.PathSeparator)) {
		return "", fmt.Errorf("%w: %s", ErrKeyEscapesRoot, key)
	}
	return resolved, nil
}

// ---------------------------------------------------------------- helpers

// ReadAll reads a reader with a cap, which is how an upload is bounded before it
// is buffered.
func ReadAll(reader io.Reader, limit int64) ([]byte, error) {
	if limit <= 0 {
		return nil, fmt.Errorf("storage: limit must be positive")
	}

	buffer := &bytes.Buffer{}
	written, err := io.Copy(buffer, io.LimitReader(reader, limit+1))
	if err != nil {
		return nil, fmt.Errorf("storage: read upload: %w", err)
	}
	if written > limit {
		return nil, fmt.Errorf("storage: upload exceeds %d bytes", limit)
	}
	return buffer.Bytes(), nil
}
