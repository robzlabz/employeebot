package engine

import (
	"fmt"
	"go/parser"
	"go/token"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
)

// Scan walks root (the module directory) and returns every Go package with its
// direct imports. Files ending in _test.go are skipped: tests may import
// whatever they need to build fixtures.
func Scan(root string) ([]Package, error) {
	modulePrefix, err := ModulePath(root)
	if err != nil {
		return nil, err
	}

	byDir := map[string]*Package{}
	fileSet := token.NewFileSet()

	err = filepath.WalkDir(root, func(path string, entry fs.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if entry.IsDir() {
			switch entry.Name() {
			case ".git", "node_modules", "vendor", "testdata":
				return fs.SkipDir
			}
			return nil
		}
		if !strings.HasSuffix(entry.Name(), ".go") || strings.HasSuffix(entry.Name(), "_test.go") {
			return nil
		}

		relDir, err := filepath.Rel(root, filepath.Dir(path))
		if err != nil {
			return err
		}
		relDir = filepath.ToSlash(relDir)
		if relDir == "." {
			relDir = ""
		}

		importPath := modulePrefix
		if relDir != "" {
			importPath = modulePrefix + "/" + relDir
		}

		pkg, ok := byDir[importPath]
		if !ok {
			pkg = &Package{ImportPath: importPath, Rel: relDir}
			byDir[importPath] = pkg
		}

		parsed, err := parser.ParseFile(fileSet, path, nil, parser.ImportsOnly)
		if err != nil {
			return fmt.Errorf("parse %s: %w", path, err)
		}
		for _, spec := range parsed.Imports {
			importPathValue := strings.Trim(spec.Path.Value, `"`)
			pkg.Imports = append(pkg.Imports, Import{
				Path: importPathValue,
				File: filepath.ToSlash(path),
				Line: fileSet.Position(spec.Pos()).Line,
			})
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	packages := make([]Package, 0, len(byDir))
	for _, pkg := range byDir {
		packages = append(packages, *pkg)
	}
	return packages, nil
}

// ModulePath reads the module path from the go.mod file in root.
func ModulePath(root string) (string, error) {
	content, err := os.ReadFile(filepath.Join(root, "go.mod"))
	if err != nil {
		return "", fmt.Errorf("read go.mod: %w", err)
	}

	for _, line := range strings.Split(string(content), "\n") {
		line = strings.TrimSpace(line)
		if after, ok := strings.CutPrefix(line, "module "); ok {
			return strings.TrimSpace(after), nil
		}
	}

	return "", fmt.Errorf("go.mod in %s has no module directive", root)
}
