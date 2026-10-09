package mail

import (
	"context"
	"strings"
	"testing"
)

func TestLogSenderReportsTheMessage(t *testing.T) {
	var lines []string
	sender := NewLogSender(func(format string, args ...any) {
		lines = append(lines, format)
	})

	err := sender.Send(context.Background(), Message{
		To:      "owner@example.com",
		Subject: "Verifikasi email Bolu",
		Text:    "https://app.example.com/verifikasi?token=abc",
	})
	if err != nil {
		t.Fatalf("send: %v", err)
	}
	if len(lines) != 1 {
		t.Fatalf("expected one log line, got %d", len(lines))
	}
	if !strings.Contains(lines[0], "mail (not sent, log sender)") {
		t.Fatalf("the log line must say the message was not sent: %q", lines[0])
	}
}

func TestSendValidatesTheMessage(t *testing.T) {
	sender := NewLogSender(nil)

	cases := map[string]Message{
		"no recipient": {Subject: "s", Text: "t"},
		"no subject":   {To: "a@example.com", Text: "t"},
		"blank":        {To: "  ", Subject: " ", Text: "t"},
	}

	for name, message := range cases {
		t.Run(name, func(t *testing.T) {
			if err := sender.Send(context.Background(), message); err == nil {
				t.Fatal("expected an error")
			}
		})
	}
}

func TestNewSMTPSenderRequiresHostAndFrom(t *testing.T) {
	if _, err := NewSMTPSender(SMTPConfig{From: "Bolu <no-reply@bolu.id>"}); err == nil {
		t.Fatal("a missing host must be rejected")
	}
	if _, err := NewSMTPSender(SMTPConfig{Host: "smtp.example.com"}); err == nil {
		t.Fatal("a missing from address must be rejected")
	}
}

func TestSMTPSenderDefaultsThePort(t *testing.T) {
	sender, err := NewSMTPSender(SMTPConfig{Host: "smtp.example.com", From: "Bolu <no-reply@bolu.id>"})
	if err != nil {
		t.Fatalf("new sender: %v", err)
	}
	if sender.cfg.Port != 587 {
		t.Fatalf("expected the submission port 587, got %d", sender.cfg.Port)
	}
}

func TestSMTPSenderValidatesBeforeDialing(t *testing.T) {
	sender, err := NewSMTPSender(SMTPConfig{Host: "127.0.0.1", Port: 1, From: "Bolu <no-reply@bolu.id>"})
	if err != nil {
		t.Fatalf("new sender: %v", err)
	}

	if err := sender.Send(context.Background(), Message{Subject: "s", Text: "t"}); err == nil {
		t.Fatal("a message without a recipient must be rejected before dialing")
	}
}

func TestBuildPayload(t *testing.T) {
	payload := string(buildPayload("Bolu <no-reply@bolu.id>", Message{
		To:      "owner@example.com",
		Subject: "Undangan bergabung ke Bolu",
		Text:    "Buka tautan ini.",
	}))

	for _, want := range []string{
		"From: Bolu <no-reply@bolu.id>\r\n",
		"To: owner@example.com\r\n",
		"Subject: Undangan bergabung ke Bolu\r\n",
		"Content-Type: text/plain; charset=UTF-8\r\n",
		"\r\nBuka tautan ini.",
	} {
		if !strings.Contains(payload, want) {
			t.Errorf("payload is missing %q:\n%s", want, payload)
		}
	}
}
