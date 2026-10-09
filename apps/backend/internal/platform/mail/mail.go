// Package mail sends transactional email: address verification, password
// reset, and workspace invitations. The SMTP sender is used in staging and
// production; local development and tests use the log sender, so the flow can
// be exercised without an SMTP server.
package mail

import (
	"context"
	"fmt"
	"strings"
)

// Message is one transactional email.
type Message struct {
	To      string
	Subject string
	Text    string
}

// Sender delivers a message.
type Sender interface {
	Send(ctx context.Context, message Message) error
}

// LogSender writes the message to the log instead of sending it. It is the
// default in local development, and the verification links it prints are what a
// developer clicks.
type LogSender struct {
	log func(format string, args ...any)
}

// NewLogSender builds a sender that reports through logf.
func NewLogSender(logf func(format string, args ...any)) *LogSender {
	if logf == nil {
		logf = func(string, ...any) {}
	}
	return &LogSender{log: logf}
}

// Send logs the recipient, subject and body.
func (s *LogSender) Send(_ context.Context, message Message) error {
	if err := validate(message); err != nil {
		return err
	}
	s.log("mail (not sent, log sender): to=%s subject=%q\n%s", message.To, message.Subject, message.Text)
	return nil
}

func validate(message Message) error {
	if strings.TrimSpace(message.To) == "" {
		return fmt.Errorf("mail: recipient is required")
	}
	if strings.TrimSpace(message.Subject) == "" {
		return fmt.Errorf("mail: subject is required")
	}
	return nil
}
