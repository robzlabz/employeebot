package mail

import (
	"context"
	"fmt"
	"net"
	"net/smtp"
	"strconv"
	"strings"
)

// SMTPConfig holds the SMTP connection settings.
type SMTPConfig struct {
	Host     string
	Port     int
	Username string
	Password string
	From     string
}

// SMTPSender delivers messages through an SMTP server.
type SMTPSender struct {
	cfg SMTPConfig
}

// NewSMTPSender builds an SMTP sender. Host and From are required: a sender
// that silently drops mail is worse than a startup failure.
func NewSMTPSender(cfg SMTPConfig) (*SMTPSender, error) {
	if strings.TrimSpace(cfg.Host) == "" {
		return nil, fmt.Errorf("mail: smtp host is required")
	}
	if strings.TrimSpace(cfg.From) == "" {
		return nil, fmt.Errorf("mail: smtp from address is required")
	}
	if cfg.Port == 0 {
		cfg.Port = 587
	}
	return &SMTPSender{cfg: cfg}, nil
}

// Send delivers the message with STARTTLS on the standard submission port.
func (s *SMTPSender) Send(_ context.Context, message Message) error {
	if err := validate(message); err != nil {
		return err
	}

	address := net.JoinHostPort(s.cfg.Host, strconv.Itoa(s.cfg.Port))

	var auth smtp.Auth
	if s.cfg.Username != "" {
		auth = smtp.PlainAuth("", s.cfg.Username, s.cfg.Password, s.cfg.Host)
	}

	payload := buildPayload(s.cfg.From, message)
	if err := smtp.SendMail(address, auth, s.cfg.From, []string{message.To}, payload); err != nil {
		return fmt.Errorf("mail: send to %s: %w", message.To, err)
	}
	return nil
}

// buildPayload writes a minimal RFC 5322 message with UTF-8 headers.
func buildPayload(from string, message Message) []byte {
	var builder strings.Builder
	builder.WriteString("From: " + from + "\r\n")
	builder.WriteString("To: " + message.To + "\r\n")
	builder.WriteString("Subject: " + message.Subject + "\r\n")
	builder.WriteString("MIME-Version: 1.0\r\n")
	builder.WriteString("Content-Type: text/plain; charset=UTF-8\r\n")
	builder.WriteString("\r\n")
	builder.WriteString(message.Text)
	return []byte(builder.String())
}
