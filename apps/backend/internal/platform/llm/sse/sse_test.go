package sse

import (
	"errors"
	"io"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

// readAll drains a reader into a slice for comparison.
func readAll(t *testing.T, r io.Reader) []Event {
	t.Helper()

	reader := NewReader(r)
	var events []Event

	for {
		event, err := reader.Next()
		if errors.Is(err, io.EOF) {
			return events
		}
		require.NoError(t, err)
		events = append(events, event)
	}
}

func TestReaderParsesEvents(t *testing.T) {
	body := strings.Join([]string{
		": keep-alive comment",
		"event: message_start",
		`data: {"type":"message_start"}`,
		"",
		"data: first line",
		"data: second line",
		"",
		"data: [DONE]",
		"",
		"",
	}, "\n")

	events := readAll(t, strings.NewReader(body))

	require.Len(t, events, 3)
	require.Equal(t, "message_start", events[0].Name)
	require.Equal(t, `{"type":"message_start"}`, events[0].Data)

	// Multi-line data is joined with newlines, per the specification.
	require.Equal(t, "first line\nsecond line", events[1].Data)

	require.True(t, IsDone(events[2].Data))
}

// TestReaderSurvivesSplitChunks is the case that breaks a naive line scanner: a
// single event arriving in pieces, including mid-JSON.
func TestReaderSurvivesSplitChunks(t *testing.T) {
	payload := "data: {\"choices\":[{\"delta\":{\"content\":\"Hari ini ada 4 pesanan\"}}]}\n\ndata: [DONE]\n\n"

	for _, size := range []int{1, 3, 7, 16, 64, len(payload)} {
		t.Run("chunk "+itoa(size), func(t *testing.T) {
			events := readAll(t, NewReplay(SplitLines(payload, size)))

			require.Len(t, events, 2, "the reader must reassemble every event")
			require.JSONEq(t, `{"choices":[{"delta":{"content":"Hari ini ada 4 pesanan"}}]}`, events[0].Data)
			require.True(t, IsDone(events[1].Data))
		})
	}
}

// TestReaderHandlesAStreamWithoutItsTerminator covers the connection that drops
// after the content: the buffered event must still be delivered.
func TestReaderHandlesAStreamWithoutItsTerminator(t *testing.T) {
	body := "data: {\"choices\":[]}\n\ndata: {\"choices\":[{\"delta\":{}}]}"

	events := readAll(t, strings.NewReader(body))

	require.Len(t, events, 2, "the unterminated event must still be read")
	require.Equal(t, `{"choices":[{"delta":{}}]}`, events[1].Data)
}

func TestReaderIgnoresBlankLines(t *testing.T) {
	events := readAll(t, strings.NewReader("\n\n\ndata: x\n\n\n\n"))

	require.Len(t, events, 1)
	require.Equal(t, "x", events[0].Data)
}

func TestReaderReadsBareFieldAndEmptyValue(t *testing.T) {
	events := readAll(t, strings.NewReader("data\n\ndata:\n\ndata:  spaced\n\n"))

	require.Len(t, events, 3)
	require.Equal(t, "", events[0].Data)
	require.Equal(t, "", events[1].Data)
	// Exactly one leading space is framing, the rest is content.
	require.Equal(t, " spaced", events[2].Data)
}

func TestReaderIgnoresUnknownFields(t *testing.T) {
	events := readAll(t, strings.NewReader("id: 42\nretry: 3000\ndata: payload\n\n"))

	require.Len(t, events, 1)
	require.Equal(t, "42", events[0].ID)
	require.Equal(t, "payload", events[0].Data)
}

func TestReaderReportsReadErrors(t *testing.T) {
	reader := NewReader(&failingReader{})
	_, err := reader.Next()

	require.Error(t, err)
	require.NotErrorIs(t, err, io.EOF)
}

// failingReader simulates a connection that drops mid-event.
type failingReader struct{ reads int }

func (r *failingReader) Read(p []byte) (int, error) {
	r.reads++
	if r.reads == 1 {
		return copy(p, "data: partial"), nil
	}
	return 0, io.ErrUnexpectedEOF
}

// TestRecordedBodyIsReplayable keeps the fixture path honest: what a recording
// stores is exactly what the reader consumes.
func TestRecordedBodyIsReplayable(t *testing.T) {
	recording := Recording{Body: []byte("data: {\"ok\":true}\n\ndata: [DONE]\n\n")}

	events := readAll(t, recording.Reader())

	require.Len(t, events, 2)
	require.Equal(t, `{"ok":true}`, events[0].Data)
}

func itoa(value int) string {
	if value == 0 {
		return "0"
	}
	digits := ""
	for value > 0 {
		digits = string(rune('0'+value%10)) + digits
		value /= 10
	}
	return digits
}
