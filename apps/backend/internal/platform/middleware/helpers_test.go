package middleware

import (
	"io"
	"testing"
)

// bodyString reads a response body for assertions.
func bodyString(t *testing.T, reader io.Reader) string {
	t.Helper()

	content, err := io.ReadAll(reader)
	if err != nil {
		t.Fatalf("read body: %v", err)
	}
	return string(content)
}
