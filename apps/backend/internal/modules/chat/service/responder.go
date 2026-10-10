package service

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/google/uuid"

	chatdomain "github.com/robzlabz/employeebot/apps/backend/internal/modules/chat/domain"
	llmdomain "github.com/robzlabz/employeebot/apps/backend/internal/modules/llm/domain"
)

// The block tools. An agent does not write a block as free text: it calls one of
// these, and the arguments are validated against the block schema before
// anything is stored. A chart specification is therefore never half-valid, and a
// renderer never has to defend itself against a shape the backend let through.
const (
	ToolRenderChart   = "render_chart"
	ToolRenderMermaid = "render_mermaid"
	ToolRenderHTML    = "render_html"
)

// ResponderDeps are the dependencies of the model-backed responder.
type ResponderDeps struct {
	Gateway llmdomain.Gateway
	Storage chatdomain.ObjectStore
}

// ModelResponder answers a message with the configured model, executing the
// block tools itself.
//
// The three block tools are pure functions — validate, then build a block — so
// they run here rather than in the task runtime: a chart does not need a durable
// workflow, and keeping them local is what lets the repair loop be bounded and
// tested without Temporal. EPIC 6 replaces this responder with the durable agent
// loop, and the chat module does not change when it does.
type ModelResponder struct {
	deps ResponderDeps
}

// NewModelResponder builds the responder.
func NewModelResponder(deps ResponderDeps) *ModelResponder {
	return &ModelResponder{deps: deps}
}

// Reply implements chatdomain.Responder.
func (r *ModelResponder) Reply(ctx context.Context, scope chatdomain.Scope, req chatdomain.ReplyRequest) (<-chan chatdomain.StreamChunk, error) {
	chunks := make(chan chatdomain.StreamChunk, 32)
	go func() {
		defer close(chunks)
		r.run(ctx, scope, req, chunks)
	}()
	return chunks, nil
}

// run produces one answer: a streamed first round, then a bounded repair loop
// for any block the validator refused.
func (r *ModelResponder) run(ctx context.Context, scope chatdomain.Scope, req chatdomain.ReplyRequest, chunks chan<- chatdomain.StreamChunk) {
	messages := conversationMessages(req.History)
	system := systemPrompt(req)

	budget := req.RepairBudget
	if budget <= 0 {
		budget = chatdomain.DefaultRepairBudget
	}

	for attempt := 0; ; attempt++ {
		streamed, err := r.deps.Gateway.Stream(ctx, llmScope(scope, req.Agent.ID), llmdomain.ChatRequest{
			System:   system,
			Messages: messages,
			Tools:    blockTools(),
			// The model decides: some answers are prose, some need a chart.
			ToolChoice: llmdomain.ToolChoiceAuto,
			Metadata: llmdomain.RequestMetadata{
				WorkspaceID: scope.WorkspaceID,
				AgentID:     req.Agent.ID,
				Purpose:     llmdomain.PurposeAgent,
			},
		})
		if err != nil {
			sendChunk(ctx, chunks, chatdomain.StreamChunk{Kind: chatdomain.ChunkError, Err: err.Error()})
			return
		}

		var (
			text      strings.Builder
			calls     []llmdomain.ToolCall
			failed    bool
			streamErr error
		)

		for event := range streamed {
			switch event.Type {
			case llmdomain.EventText:
				text.WriteString(event.Text)
				if attempt == 0 {
					// Only the first round streams: a repair round repeats the
					// answer, and showing it twice would read as a stutter.
					if !sendChunk(ctx, chunks, chatdomain.StreamChunk{Kind: chatdomain.ChunkText, Text: event.Text}) {
						return
					}
				}
			case llmdomain.EventToolCall:
				if event.ToolCall != nil {
					calls = append(calls, *event.ToolCall)
				}
			case llmdomain.EventError:
				streamErr = event.Err
			}
		}

		if streamErr != nil {
			// A provider failure after some text is a partial answer, not an
			// empty one: the caller decides how to mark it, and the text is
			// already on its way to the client.
			sendChunk(ctx, chunks, chatdomain.StreamChunk{Kind: chatdomain.ChunkError, Err: streamErr.Error()})
			return
		}

		// The text of this round becomes a block once, in order, before the
		// blocks the tools produced.
		if attempt > 0 && strings.TrimSpace(text.String()) != "" {
			if !sendChunk(ctx, chunks, chatdomain.StreamChunk{Kind: chatdomain.ChunkText, Text: text.String()}) {
				return
			}
		}

		results := make([]llmdomain.ToolResult, 0, len(calls))
		for _, call := range calls {
			block, err := r.execute(ctx, scope, call)
			if err != nil {
				failed = true
				results = append(results, llmdomain.ToolResult{
					CallID:  call.ID,
					Content: err.Error(),
					IsError: true,
				})
				continue
			}

			// The chunk carries the block document itself, not the wrapper: what
			// a client stores and renders is exactly what the validator checked.
			if !sendChunk(ctx, chunks, chatdomain.StreamChunk{Kind: chatdomain.ChunkBlock, Block: block.Body}) {
				return
			}
			results = append(results, llmdomain.ToolResult{
				CallID:  call.ID,
				Content: `{"stored":true}`,
			})
		}

		if !failed || attempt >= budget {
			if failed && attempt >= budget {
				sendChunk(ctx, chunks, chatdomain.StreamChunk{
					Kind: chatdomain.ChunkNotice,
					Text: "blok yang diminta masih belum valid setelah beberapa percobaan; aku kirim jawabannya apa adanya",
				})
			}
			sendChunk(ctx, chunks, chatdomain.StreamChunk{Kind: chatdomain.ChunkDone})
			return
		}

		// The failures are handed back with the validator's own message, which
		// is what lets the model correct the field rather than guess again.
		sendChunk(ctx, chunks, chatdomain.StreamChunk{
			Kind: chatdomain.ChunkNotice,
			Text: fmt.Sprintf("memperbaiki %s (%d dari %d)", strings.Join(reasonsOf(calls), ", "), attempt+1, budget),
		})

		messages = append(messages,
			llmdomain.Message{Role: llmdomain.RoleAssistant, Text: text.String(), ToolCalls: calls},
			llmdomain.Message{Role: llmdomain.RoleTool, ToolResults: results},
		)
	}
}

// execute runs one block tool and returns the block it produced.
func (r *ModelResponder) execute(ctx context.Context, scope chatdomain.Scope, call llmdomain.ToolCall) (chatdomain.Block, error) {
	var arguments map[string]any
	if err := json.Unmarshal(call.Arguments, &arguments); err != nil {
		return chatdomain.Block{}, fmt.Errorf("argumen bukan JSON yang sah: %w", err)
	}

	switch call.Name {
	case ToolRenderChart:
		return buildBlock(chatdomain.BlockChart, map[string]any{
			"type":  chatdomain.BlockChart,
			"title": stringField(arguments, "title"),
			"spec":  arguments["spec"],
		})

	case ToolRenderMermaid:
		return buildBlock(chatdomain.BlockMermaid, map[string]any{
			"type":    chatdomain.BlockMermaid,
			"title":   stringField(arguments, "title"),
			"code":    stringField(arguments, "code"),
			"diagram": stringField(arguments, "diagram"),
		})

	case ToolRenderHTML:
		return r.storeHTML(ctx, scope, arguments)

	default:
		return chatdomain.Block{}, fmt.Errorf("alat %q tidak dikenal", call.Name)
	}
}

// storeHTML validates an HTML document, stores it, and returns the block that
// references it.
//
// The document is stored rather than inlined because it is served from a
// separate origin: the block carries a reference, and the content origin serves
// the bytes with the strict policy that makes the sandbox meaningful.
func (r *ModelResponder) storeHTML(ctx context.Context, scope chatdomain.Scope, arguments map[string]any) (chatdomain.Block, error) {
	html := stringField(arguments, "html")
	if strings.TrimSpace(html) == "" {
		return chatdomain.Block{}, fmt.Errorf("html tidak boleh kosong")
	}
	if len(html) > chatdomain.HTMLMaxBytes {
		return chatdomain.Block{}, fmt.Errorf("html %d byte, batasnya %d byte", len(html), chatdomain.HTMLMaxBytes)
	}
	if r.deps.Storage == nil {
		return chatdomain.Block{}, fmt.Errorf("penyimpanan konten tidak dikonfigurasi, jadi html tidak bisa disimpan")
	}

	reference := uuid.New()
	key := chatdomain.ObjectKey(
		chatdomain.ContentRefPrefix, scope.WorkspaceID.String(), reference.String(), "index.html")

	object, err := r.deps.Storage.Put(ctx, key, "text/html; charset=utf-8", []byte(html))
	if err != nil {
		return chatdomain.Block{}, fmt.Errorf("gagal menyimpan html: %w", err)
	}

	return buildBlock(chatdomain.BlockHTML, map[string]any{
		"type":        chatdomain.BlockHTML,
		"title":       stringField(arguments, "title"),
		"caption":     stringField(arguments, "caption"),
		"content_ref": chatdomain.EncodeContentRef(object.Key),
		"byte_size":   object.ByteSize,
	})
}

// buildBlock marshals a block document and validates it, so nothing invalid is
// ever returned to the caller.
func buildBlock(blockType string, document map[string]any) (chatdomain.Block, error) {
	// An empty optional field is dropped rather than sent as "": a title of ""
	// and no title are the same thing to a renderer, and the schema rejects a
	// missing required field either way.
	for key, value := range document {
		if text, ok := value.(string); ok && strings.TrimSpace(text) == "" && key != "type" && key != "code" {
			delete(document, key)
		}
	}

	raw, err := json.Marshal(document)
	if err != nil {
		return chatdomain.Block{}, fmt.Errorf("blok %s tidak bisa di-encode: %w", blockType, err)
	}

	block := chatdomain.Block{Type: blockType, Body: raw}
	if err := chatdomain.ValidateBlock(block); err != nil {
		// The validator's message is what the agent gets back, so it names the
		// offending field rather than saying "invalid".
		return chatdomain.Block{}, err
	}
	return block, nil
}

// blockTools describes the three tools to the model.
func blockTools() []llmdomain.Tool {
	return []llmdomain.Tool{
		{
			Name: ToolRenderChart,
			Description: "Tampilkan grafik dari data angka. Pakai ini untuk tren, perbandingan, dan komposisi; " +
				"jangan tulis tabel angka panjang kalau sebuah grafik lebih jelas.",
			Schema: json.RawMessage(`{
				"type": "object",
				"required": ["spec"],
				"properties": {
					"title": {"type": "string", "description": "Judul grafik"},
					"spec": {
						"type": "object",
						"required": ["kind"],
						"properties": {
							"kind": {"enum": ["bar", "line", "area", "pie", "scatter"]},
							"title": {"type": "string"},
							"x_label": {"type": "string"},
							"y_label": {"type": "string"},
							"unit": {"type": "string", "description": "Satuan, mis. pcs atau rupiah"},
							"categories": {"type": "array", "items": {"type": "string"}},
							"series": {
								"type": "array",
								"items": {
									"type": "object",
									"required": ["name", "data"],
									"properties": {
										"name": {"type": "string"},
										"data": {"type": "array", "items": {"type": "number"}}
									}
								}
							},
							"slices": {
								"type": "array",
								"items": {
									"type": "object",
									"required": ["name", "value"],
									"properties": {"name": {"type": "string"}, "value": {"type": "number"}}
								}
							},
							"points": {
								"type": "array",
								"items": {
									"type": "object",
									"required": ["x", "y"],
									"properties": {"x": {}, "y": {"type": "number"}}
								}
							},
							"stacked": {"type": "boolean"}
						}
					}
				}
			}`),
			Label: "read",
		},
		{
			Name: ToolRenderMermaid,
			Description: "Tampilkan diagram Mermaid untuk struktur dan alur: ERD, flowchart, sequence, gantt, " +
				"state, mindmap, atau class. Tulis kode Mermaid yang sah, bukan deskripsinya.",
			Schema: json.RawMessage(`{
				"type": "object",
				"required": ["code"],
				"properties": {
					"title": {"type": "string"},
					"code": {"type": "string", "description": "Kode Mermaid lengkap, mis. \"flowchart TD\\n  A --> B\""},
					"diagram": {"enum": ["erd", "flowchart", "sequence", "gantt", "state", "mindmap", "class", "pie", "other"]}
				}
			}`),
			Label: "read",
		},
		{
			Name: ToolRenderHTML,
			Description: "Tampilkan dokumen HTML interaktif di dalam sandbox. Pakai hanya bila penjelasan memang " +
				"butuh interaksi atau animasi: HTML jauh lebih mahal daripada grafik atau diagram.",
			Schema: json.RawMessage(`{
				"type": "object",
				"required": ["html"],
				"properties": {
					"title": {"type": "string"},
					"caption": {"type": "string"},
					"html": {"type": "string", "description": "Dokumen HTML utuh, boleh dengan skrip. Tidak bisa memanggil jaringan."}
				}
			}`),
			Label: "read",
		},
	}
}

// systemPrompt assembles the instruction the Bolu answers under.
func systemPrompt(req chatdomain.ReplyRequest) string {
	agent := req.Agent

	parts := []string{
		fmt.Sprintf("Kamu %s, Bolu %s di aplikasi Bolu.", agent.Name, agent.Role),
	}
	if agent.Persona != "" {
		parts = append(parts, agent.Persona)
	}
	if agent.Tone != "" {
		parts = append(parts, "Gaya bahasa: "+agent.Tone+".")
	}
	parts = append(parts,
		"Jawab dalam bahasa Indonesia, ringkas dan konkret.",
		"Balasanmu disimpan sebagai blok: teks Markdown, dan blok grafik, diagram, atau HTML lewat alat yang tersedia.",
		"Data angka lebih jelas sebagai grafik; struktur dan alur lebih jelas sebagai diagram; pakai HTML hanya bila perlu interaksi.",
		"Kalau tidak yakin, jawab dengan teks saja.",
	)

	if req.Conversation.Kind == chatdomain.KindGroup {
		names := make([]string, 0, len(req.Conversation.Participants))
		for _, participant := range req.Conversation.Participants {
			if participant.IsAgent() {
				names = append(names, participant.DisplayName)
			}
		}
		parts = append(parts, fmt.Sprintf(
			"Ini obrolan grup bersama %s. Kamu dipilih untuk menjawab pesan terakhir; jawab sebagai dirimu sendiri saja.",
			strings.Join(names, ", ")))
	}

	return strings.Join(parts, "\n")
}

// conversationMessages maps stored messages onto the model's message format.
//
// A block the model cannot read is summarised rather than dropped: the model
// needs to know it already produced a chart, or it would produce it again.
func conversationMessages(history []chatdomain.Message) []llmdomain.Message {
	messages := make([]llmdomain.Message, 0, len(history))

	for _, message := range history {
		role := llmdomain.RoleAssistant
		if !message.FromAgent() {
			role = llmdomain.RoleUser
		}

		text := renderBlocksForModel(message.Blocks)
		if strings.TrimSpace(text) == "" {
			continue
		}
		messages = append(messages, llmdomain.Message{Role: role, Text: text})
	}

	return messages
}

// renderBlocksForModel turns a stored body into the text the model reads.
func renderBlocksForModel(blocks []chatdomain.Block) string {
	parts := make([]string, 0, len(blocks))

	for _, block := range blocks {
		switch block.Type {
		case chatdomain.BlockText:
			var text struct {
				Markdown string `json:"markdown"`
			}
			if err := json.Unmarshal(block.Body, &text); err == nil {
				parts = append(parts, text.Markdown)
			}

		case chatdomain.BlockChart:
			var chart struct {
				Title string `json:"title"`
				Spec  struct {
					Kind  string `json:"kind"`
					Title string `json:"title"`
				} `json:"spec"`
			}
			if err := json.Unmarshal(block.Body, &chart); err == nil {
				parts = append(parts, fmt.Sprintf("[grafik %s: %s]", chart.Spec.Kind, firstNonEmpty(chart.Title, chart.Spec.Title)))
			}

		case chatdomain.BlockMermaid:
			var diagram struct {
				Title   string `json:"title"`
				Diagram string `json:"diagram"`
			}
			if err := json.Unmarshal(block.Body, &diagram); err == nil {
				parts = append(parts, fmt.Sprintf("[diagram %s: %s]", diagram.Diagram, diagram.Title))
			}

		case chatdomain.BlockHTML:
			var document struct {
				Title string `json:"title"`
			}
			if err := json.Unmarshal(block.Body, &document); err == nil {
				parts = append(parts, fmt.Sprintf("[konten interaktif: %s]", document.Title))
			}

		case chatdomain.BlockTable:
			var table struct {
				Columns []string   `json:"columns"`
				Rows    [][]string `json:"rows"`
			}
			if err := json.Unmarshal(block.Body, &table); err == nil {
				parts = append(parts, fmt.Sprintf("[tabel %d kolom, %d baris: %s]",
					len(table.Columns), len(table.Rows), strings.Join(table.Columns, " | ")))
			}

		case chatdomain.BlockDraft:
			var draft struct {
				Title string `json:"title"`
			}
			if err := json.Unmarshal(block.Body, &draft); err == nil {
				parts = append(parts, fmt.Sprintf("[draf menunggu persetujuan: %s]", draft.Title))
			}
		}
	}

	return strings.Join(parts, "\n\n")
}

func stringField(arguments map[string]any, key string) string {
	value, ok := arguments[key]
	if !ok {
		return ""
	}
	text, ok := value.(string)
	if !ok {
		return ""
	}
	return strings.TrimSpace(text)
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return value
		}
	}
	return ""
}

func reasonsOf(calls []llmdomain.ToolCall) []string {
	names := make([]string, 0, len(calls))
	for _, call := range calls {
		names = append(names, call.Name)
	}
	if len(names) == 0 {
		return []string{"blok"}
	}
	return names
}

// sendChunk hands one chunk to the caller, giving up when the caller's context
// ends so an abandoned stream cannot leak the goroutine.
func sendChunk(ctx context.Context, chunks chan<- chatdomain.StreamChunk, chunk chatdomain.StreamChunk) bool {
	select {
	case chunks <- chunk:
		return true
	case <-ctx.Done():
		return false
	}
}

// compile-time check: the responder satisfies the port.
var _ chatdomain.Responder = (*ModelResponder)(nil)
