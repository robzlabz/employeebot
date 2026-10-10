package domain

import (
	"encoding/json"
	"strings"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/require"
)

// jsonBlock builds a block document from a Go value, which keeps a long or
// newline-heavy payload out of a string literal.
func jsonBlock(t *testing.T, value any) Block {
	t.Helper()

	raw, err := json.Marshal(value)
	require.NoError(t, err)
	return block(t, string(raw))
}

func block(t *testing.T, document string) Block {
	t.Helper()

	var header struct {
		Type string `json:"type"`
	}
	require.NoError(t, json.Unmarshal([]byte(document), &header))
	return Block{Type: header.Type, Body: json.RawMessage(document)}
}

// TestEveryBlockTypeHasASchema is the guard that keeps BlockTypes and the schema
// map from drifting: a new type without a schema would silently accept anything.
func TestEveryBlockTypeHasASchema(t *testing.T) {
	schemas, err := Schemas()
	require.NoError(t, err)
	require.Len(t, schemas, len(BlockTypes))

	for _, name := range BlockTypes {
		require.Contains(t, schemas, name)
	}
}

func TestValidBlocksAreAccepted(t *testing.T) {
	documents := map[string]string{
		BlockText: `{"type":"text","markdown":"Hari ini **4 pesanan** masuk.","title":"Rekap"}`,
		BlockTable: `{"type":"table","title":"Pesanan","columns":["Pelanggan","Total"],
			"rows":[["Toko Sari","Rp 1.124.000"],["Bagas","Rp 189.000"]],
			"align":["left","right"]}`,
		BlockDraft: `{"type":"draft","draft_id":"` + uuid.NewString() + `","action_kind":"gmail.send",
			"title":"INV-0043 untuk Toko Sari","summary":"Rp 1.124.000 · jatuh tempo 21 Okt",
			"status":"pending","fields":[["Pelanggan","Toko Sari"],["Total","Rp 1.124.000"]]}`,
		BlockChart: `{"type":"chart","title":"Penjualan mingguan","spec":{"kind":"bar",
			"categories":["Sen","Sel","Rab"],"series":[{"name":"Kaos","data":[10,12,7]}],
			"x_label":"Hari","y_label":"Pcs","unit":"pcs"}}`,
		BlockMermaid: `{"type":"mermaid","title":"Alur pesanan","diagram":"flowchart",
			"code":"flowchart TD\n  A[Pesanan] --> B[Invoice]"}`,
		BlockHTML: `{"type":"html","title":"Simulasi diskon","content_ref":"` +
			EncodeContentRef(ObjectKey(ContentRefPrefix, uuid.NewString(), uuid.NewString(), "index.html")) +
			`","byte_size":2048,"caption":"Konten interaktif dibuat Bolu"}`,
	}

	for name, document := range documents {
		t.Run(name, func(t *testing.T) {
			require.NoError(t, ValidateBlock(block(t, document)))
		})
	}
}

func TestInvalidBlocksAreRejected(t *testing.T) {
	documents := map[string]string{
		"unknown type":          `{"type":"hologram","markdown":"halo"}`,
		"missing body":          `{"type":"text"}`,
		"text without markdown": `{"type":"text","title":"Rekap"}`,
		"text with a number":    `{"type":"text","markdown":42}`,
		"table without columns": `{"type":"table","rows":[["a"]]}`,
		"table without rows":    `{"type":"table","columns":["a"]}`,
		"table row too wide":    `{"type":"table","columns":["a"],"rows":[["1","2"]]}`,
		"table row too narrow":  `{"type":"table","columns":["a","b"],"rows":[["1"]]}`,
		"draft without id":      `{"type":"draft","title":"x"}`,
		"draft with a bad id":   `{"type":"draft","draft_id":"bukan-uuid"}`,
		"draft with a bad status": `{"type":"draft","draft_id":"` + uuid.NewString() +
			`","status":"mungkin"}`,
		"chart without spec": `{"type":"chart","title":"x"}`,
		"chart with a bad kind": `{"type":"chart","spec":{"kind":"donat",
			"categories":["a"],"series":[{"name":"x","data":[1]}]}}`,
		"bar chart without categories": `{"type":"chart","spec":{"kind":"bar",
			"series":[{"name":"x","data":[1]}]}}`,
		"bar chart with a short series": `{"type":"chart","spec":{"kind":"bar",
			"categories":["a","b"],"series":[{"name":"x","data":[1]}]}}`,
		"pie chart without slices": `{"type":"chart","spec":{"kind":"pie",
			"categories":["a"],"series":[{"name":"x","data":[1]}]}}`,
		"scatter without points": `{"type":"chart","spec":{"kind":"scatter",
			"categories":["a"],"series":[{"name":"x","data":[1]}]}}`,
		"mermaid without code":     `{"type":"mermaid","title":"x"}`,
		"mermaid with empty code":  `{"type":"mermaid","code":""}`,
		"html without a reference": `{"type":"html","byte_size":100}`,
		"html without a size": `{"type":"html","content_ref":"` +
			EncodeContentRef(ObjectKey(ContentRefPrefix, uuid.NewString(), uuid.NewString(), "index.html")) + `"}`,
		"html over the limit": `{"type":"html","content_ref":"` +
			EncodeContentRef(ObjectKey(ContentRefPrefix, uuid.NewString(), uuid.NewString(), "index.html")) +
			`","byte_size":` + itoa(HTMLMaxBytes+1) + `}`,
		"html pointing at an attachment": `{"type":"html","content_ref":"` +
			EncodeContentRef(ObjectKey("attachments", uuid.NewString(), uuid.NewString(), "a.pdf")) +
			`","byte_size":100}`,
		"html with an unreadable reference": `{"type":"html","content_ref":"!!!","byte_size":100}`,
	}

	for name, document := range documents {
		t.Run(name, func(t *testing.T) {
			err := ValidateBlock(block(t, document))
			require.Error(t, err)
			require.True(t,
				strings.Contains(err.Error(), "invalid block") || strings.Contains(err.Error(), "too large"),
				"unexpected error: %v", err)
		})
	}
}

// TestSchemaErrorNamesThePath is what makes the repair loop usable: the agent
// must learn which field is wrong, not just that something is.
func TestSchemaErrorNamesThePath(t *testing.T) {
	err := ValidateBlock(block(t, `{"type":"chart","spec":{"kind":"bar","categories":["a"],"series":[{"name":"x","data":["bukan angka"]}]}}`))

	require.Error(t, err)
	require.Contains(t, err.Error(), "chart")
	require.Contains(t, err.Error(), "spec")
	require.Contains(t, err.Error(), "data")
}

// TestContentReferenceRoundTrip keeps the reference and its key in step.
func TestContentReferenceRoundTrip(t *testing.T) {
	key := ObjectKey(ContentRefPrefix, uuid.NewString(), uuid.NewString(), "index.html")

	reference := EncodeContentRef(key)
	require.NotContains(t, reference, "/", "the reference is one path segment")

	decoded, err := DecodeContentRef(reference)
	require.NoError(t, err)
	require.Equal(t, key, decoded)

	// A reference is not readable as anything but a content key.
	_, err = DecodeContentRef("not base64!")
	require.ErrorIs(t, err, ErrInvalidBlock)

	_, err = DecodeContentRef(EncodeContentRef("attachments/workspaces/a/objects/b/c.pdf"))
	require.ErrorIs(t, err, ErrInvalidBlock)
}

// TestSanitizeFilenameKeepsOneSegment is the path-traversal guard.
func TestSanitizeFilenameKeepsOneSegment(t *testing.T) {
	cases := map[string]string{
		"../../etc/passwd":  "-.-etc-passwd",
		"/absolute/path.md": "-absolute-path.md",
		"..":                "file",
		"":                  "file",
		"   ":               "file",
		"nama normal.pdf":   "nama normal.pdf",
	}
	for input, want := range cases {
		require.Equal(t, want, SanitizeFilename(input), input)
		require.NotContains(t, SanitizeFilename(input), "/")
	}

	long := SanitizeFilename(strings.Repeat("a", 200) + ".pdf")
	require.LessOrEqual(t, len(long), 120)
	require.True(t, strings.HasSuffix(long, ".pdf"), "the extension survives, because a browser needs it")
}

func TestChartAndMermaidSizeLimits(t *testing.T) {
	// A series longer than the categories is rejected by the cross-field rule
	// before any renderer sees it.
	err := ValidateBlock(block(t, `{"type":"chart","spec":{"kind":"line",
		"categories":["a"],"series":[{"name":"x","data":[1,2]}]}}`))
	require.ErrorIs(t, err, ErrInvalidBlock)
	require.Contains(t, err.Error(), "1 categories")

	long := strings.Repeat("flowchart TD\n", MermaidMaxBytes/len("flowchart TD\n")+2)
	err = ValidateBlock(jsonBlock(t, map[string]any{"type": "mermaid", "code": long}))
	require.ErrorIs(t, err, ErrBlockTooLarge)

	huge := strings.Repeat("a", TextMaxBytes+1)
	err = ValidateBlock(jsonBlock(t, map[string]any{"type": "text", "markdown": huge}))
	require.ErrorIs(t, err, ErrBlockTooLarge)
}

func TestBlockCountIsBounded(t *testing.T) {
	blocks := make([]Block, 0, BlocksPerMessage+1)
	for range BlocksPerMessage + 1 {
		blocks = append(blocks, block(t, `{"type":"text","markdown":"halo"}`))
	}

	err := ValidateBlocks(blocks)
	require.ErrorIs(t, err, ErrInvalidBlock)
	require.Contains(t, err.Error(), "at most")

	require.NoError(t, ValidateBlocks(blocks[:BlocksPerMessage]))
}

// TestBlockRoundTripThroughJSONB keeps the stored form and the rendered form the
// same document: what is written is exactly what a client receives.
func TestBlockRoundTripThroughJSONB(t *testing.T) {
	original := []Block{
		block(t, `{"type":"text","markdown":"**4 pesanan** masuk.","title":"Rekap"}`),
		block(t, `{"type":"table","columns":["Pelanggan","Total"],"rows":[["Toko Sari","Rp 1.124.000"]]}`),
		block(t, `{"type":"chart","spec":{"kind":"pie","slices":[{"name":"Kaos","value":10}]}}`),
	}

	raw, err := MarshalBlocks(original)
	require.NoError(t, err)
	require.NoError(t, ValidateBlocks(original))

	decoded, err := UnmarshalBlocks(raw)
	require.NoError(t, err)
	require.Len(t, decoded, 3)

	for i, restored := range decoded {
		require.Equal(t, original[i].Type, restored.Type)
		require.JSONEq(t, string(original[i].Body), string(restored.Body))
	}
}

// TestUnmarshalReadsTheTypeFromTheDocument: a row cannot claim a type its body
// does not have, because the type is read from the body.
func TestUnmarshalReadsTheTypeFromTheDocument(t *testing.T) {
	blocks, err := UnmarshalBlocks([]byte(`[{"type":"mermaid","code":"graph TD"}]`))
	require.NoError(t, err)
	require.Len(t, blocks, 1)
	require.Equal(t, BlockMermaid, blocks[0].Type)
}

func TestUnmarshalHandlesTheEmptyColumn(t *testing.T) {
	for _, raw := range [][]byte{nil, {}, []byte("[]")} {
		blocks, err := UnmarshalBlocks(raw)
		require.NoError(t, err)
		require.Empty(t, blocks)
	}
}

func TestMarshalRejectsAnEmptyBody(t *testing.T) {
	_, err := MarshalBlocks([]Block{{Type: BlockText}})
	require.ErrorIs(t, err, ErrInvalidBlock)
}
