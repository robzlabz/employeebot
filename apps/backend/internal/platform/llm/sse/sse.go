// Package sse parses Server-Sent Events the way an LLM provider emits them.
//
// The standard library has no SSE reader, and a naive line scanner breaks on
// the two things that actually happen in production: a JSON payload split across
// two reads, and a stream that ends without its terminating event. This reader
// handles both, and both providers share it so their streaming behaviour cannot
// drift.
package sse

import (
	"bufio"
	"bytes"
	"errors"
	"io"
	"strings"
)

// Event is one Server-Sent Event.
type Event struct {
	// Name is the `event:` field, empty when the provider only uses `data:`.
	Name string
	// Data is the concatenated `data:` payload. Multi-line data is joined with
	// newlines, as the SSE specification requires.
	Data string
	// ID is the optional `id:` field.
	ID string
}

// Comments to ignore: providers send keep-alives as comments.
const commentPrefix = ":"

// Reader turns a byte stream into events.
type Reader struct {
	scanner *bufio.Scanner
}

// NewReader reads events from r. The buffer is large enough for the biggest
// single event a provider sends (a full tool-call argument block).
func NewReader(r io.Reader) *Reader {
	scanner := bufio.NewScanner(r)
	scanner.Buffer(make([]byte, 0, 64*1024), 4*1024*1024)
	return &Reader{scanner: scanner}
}

// Next returns the next event. It reports io.EOF when the stream ends, whether
// or not the provider sent its [DONE] marker.
func (r *Reader) Next() (Event, error) {
	var event Event
	var data []string

	for r.scanner.Scan() {
		line := r.scanner.Text()

		// A blank line terminates the event.
		if strings.TrimSpace(line) == "" {
			if event.Name == "" && len(data) == 0 {
				// Consecutive blank lines are allowed; keep reading.
				continue
			}
			event.Data = strings.Join(data, "\n")
			return event, nil
		}

		if strings.HasPrefix(line, commentPrefix) {
			continue
		}

		field, value, found := strings.Cut(line, ":")
		if !found {
			// A bare field name with no colon is valid and means an empty value.
			field, value = line, ""
		}
		// A single space after the colon is part of the framing, not the value.
		value = strings.TrimPrefix(value, " ")

		switch field {
		case "event":
			event.Name = value
		case "data":
			data = append(data, value)
		case "id":
			event.ID = value
		case "retry":
			// Not used: the providers we talk to do not ask for a retry delay.
		}
	}

	if err := r.scanner.Err(); err != nil {
		return Event{}, err
	}

	// The stream ended. Anything buffered is the last event, which is what
	// happens when a provider closes the connection without a trailing blank
	// line.
	if event.Name != "" || len(data) > 0 {
		event.Data = strings.Join(data, "\n")
		return event, nil
	}

	return Event{}, io.EOF
}

// ErrDone is what a caller uses to stop when it sees a provider's sentinel.
var ErrDone = errors.New("sse: stream finished")

// IsDone reports whether a data payload is a provider's end marker. Both
// providers use `[DONE]`; Anthropic uses a named event instead, which the
// adapter checks separately.
func IsDone(data string) bool {
	return strings.TrimSpace(data) == "[DONE]"
}

// SplitLines is a test helper: it feeds a payload in fixed-size chunks so a
// parser can be exercised against a payload split mid-JSON.
func SplitLines(payload string, chunk int) []string {
	if chunk <= 0 {
		return []string{payload}
	}

	var chunks []string
	for start := 0; start < len(payload); start += chunk {
		end := start + chunk
		if end > len(payload) {
			end = len(payload)
		}
		chunks = append(chunks, payload[start:end])
	}
	return chunks
}

// replayReader feeds pre-recorded chunks, so a test can reproduce a stream that
// arrives in awkward pieces.
type replayReader struct {
	chunks []string
	index  int
}

// NewReplay builds a reader over the given chunks.
func NewReplay(chunks []string) io.Reader {
	return &replayReader{chunks: chunks}
}

func (r *replayReader) Read(p []byte) (int, error) {
	if r.index >= len(r.chunks) {
		return 0, io.EOF
	}
	chunk := r.chunks[r.index]
	r.index++

	// Honour the caller's buffer size, so a chunk larger than p arrives in
	// several reads, which is the case that used to break line scanning.
	if len(chunk) > len(p) {
		n := copy(p, chunk)
		r.chunks[r.index-1] = chunk[n:]
		r.index--
		return n, nil
	}

	return copy(p, chunk), nil
}

// Recording is a provider-agnostic way to keep the bytes an adapter streamed,
// so a test can replay them without the network.
type Recording struct {
	// Body is the raw stream.
	Body []byte
}

// Reader returns a reader over the recorded body.
func (r Recording) Reader() io.Reader {
	return bytes.NewReader(r.Body)
}
