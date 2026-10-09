package engine

import (
	"os"
	"path/filepath"
	"testing"
)

// TestScanReadsRealPackages proves the scanner resolves import paths against
// go.mod and skips test files, so the checker sees what the compiler sees.
func TestScanReadsRealPackages(t *testing.T) {
	root := t.TempDir()
	writeFile(t, root, "go.mod", "module example.com/bolu\n\ngo 1.24\n")
	writeFile(t, root, "internal/modules/health/domain/health.go",
		"package domain\n\nimport \"context\"\n\nvar _ context.Context\n")
	writeFile(t, root, "internal/modules/health/domain/health_test.go",
		"package domain\n\nimport \"github.com/gofiber/fiber/v2\"\n\nvar _ = fiber.New\n")
	writeFile(t, root, "internal/modules/health/service/service.go",
		"package service\n\nimport \"example.com/bolu/internal/modules/health/domain\"\n\nvar _ domain.Report\n")

	packages, err := Scan(root)
	if err != nil {
		t.Fatalf("scan: %v", err)
	}
	if len(packages) != 2 {
		t.Fatalf("expected 2 packages, got %d (%v)", len(packages), packages)
	}

	modulePrefix, err := ModulePath(root)
	if err != nil {
		t.Fatalf("module path: %v", err)
	}
	if modulePrefix != "example.com/bolu" {
		t.Fatalf("unexpected module path %q", modulePrefix)
	}

	if violations := Check(modulePrefix, packages); len(violations) != 0 {
		t.Fatalf("expected no violations, got %v", violations)
	}
}

func writeFile(t *testing.T, root, rel, content string) {
	t.Helper()

	path := filepath.Join(root, filepath.FromSlash(rel))
	if err := os.MkdirAll(filepath.Dir(path), 0o750); err != nil {
		t.Fatalf("mkdir %s: %v", rel, err)
	}
	if err := os.WriteFile(path, []byte(content), 0o600); err != nil {
		t.Fatalf("write %s: %v", rel, err)
	}
}
