// Package migrations embeds the golang-migrate SQL files so both the binaries
// and the integration tests can apply the schema without reading the
// filesystem. The .sql files stay the single source of truth: sqlc reads the
// same directory (see sqlc.yaml).
package migrations

import "embed"

// FS holds every up/down migration pair.
//
//go:embed *.sql
var FS embed.FS
