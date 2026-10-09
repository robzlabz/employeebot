package google

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"
)

// stubProvider stands in for Google. The endpoints are configuration, which is
// exactly why the client can be tested without touching the network.
type stubProvider struct {
	server     *httptest.Server
	tokenBody  string
	tokenCode  int
	userInfo   UserInfo
	userStatus int
}

func newStub(t *testing.T, info UserInfo, status int) *stubProvider {
	t.Helper()

	stub := &stubProvider{
		tokenBody:  `{"access_token":"stub-access-token","token_type":"Bearer","expires_in":3600}`,
		tokenCode:  http.StatusOK,
		userInfo:   info,
		userStatus: status,
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/token", func(w http.ResponseWriter, r *http.Request) {
		if err := r.ParseForm(); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		if r.Form.Get("code") == "" {
			w.WriteHeader(http.StatusBadRequest)
			_, _ = w.Write([]byte(`{"error":"invalid_request"}`))
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(stub.tokenCode)
		_, _ = w.Write([]byte(stub.tokenBody))
	})
	mux.HandleFunc("/userinfo", func(w http.ResponseWriter, r *http.Request) {
		if !strings.HasPrefix(r.Header.Get("Authorization"), "Bearer ") {
			http.Error(w, "missing bearer token", http.StatusUnauthorized)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(stub.userStatus)
		_ = json.NewEncoder(w).Encode(stub.userInfo)
	})

	stub.server = httptest.NewServer(mux)
	t.Cleanup(stub.server.Close)

	return stub
}

func (s *stubProvider) client(t *testing.T) *Client {
	t.Helper()

	client, err := New(Config{
		ClientID:     "client-id",
		ClientSecret: "client-secret",
		RedirectURL:  "https://api.example.com/api/auth/google/callback",
		AuthURL:      "https://accounts.example.com/consent",
		TokenURL:     s.server.URL + "/token",
		UserInfoURL:  s.server.URL + "/userinfo",
		HTTPClient:   &http.Client{Timeout: 5 * time.Second},
	})
	if err != nil {
		t.Fatalf("new client: %v", err)
	}
	return client
}

func TestNewRequiresClientRegistration(t *testing.T) {
	cases := map[string]Config{
		"no client id":     {ClientSecret: "s", RedirectURL: "r"},
		"no client secret": {ClientID: "i", RedirectURL: "r"},
		"no redirect url":  {ClientID: "i", ClientSecret: "s"},
	}

	for name, cfg := range cases {
		t.Run(name, func(t *testing.T) {
			if _, err := New(cfg); err == nil {
				t.Fatal("expected an error")
			}
		})
	}
}

func TestAuthCodeURL(t *testing.T) {
	stub := newStub(t, UserInfo{}, http.StatusOK)
	client := stub.client(t)

	raw := client.AuthCodeURL("the-state")

	parsed, err := url.Parse(raw)
	if err != nil {
		t.Fatalf("consent url is not a url: %v", err)
	}
	if parsed.Host != "accounts.example.com" {
		t.Fatalf("unexpected host %q", parsed.Host)
	}

	query := parsed.Query()
	expected := map[string]string{
		"client_id":     "client-id",
		"redirect_uri":  "https://api.example.com/api/auth/google/callback",
		"response_type": "code",
		"scope":         "openid email",
		"state":         "the-state",
	}
	for key, want := range expected {
		if got := query.Get(key); got != want {
			t.Errorf("query %s: expected %q, got %q", key, want, got)
		}
	}
}

func TestExchangeReturnsVerifiedIdentity(t *testing.T) {
	stub := newStub(t, UserInfo{Subject: "google-subject-1", Email: "owner@example.com", EmailVerified: true}, http.StatusOK)
	client := stub.client(t)

	info, err := client.Exchange(context.Background(), "authorization-code")
	if err != nil {
		t.Fatalf("exchange: %v", err)
	}

	if info.Subject != "google-subject-1" {
		t.Errorf("subject: got %q", info.Subject)
	}
	if info.Email != "owner@example.com" {
		t.Errorf("email: got %q", info.Email)
	}
	if !info.EmailVerified {
		t.Error("expected a verified email")
	}
}

// TestExchangeRejectsUnverifiedEmail is the guard from the task: an address the
// provider did not verify must not be used to create or link an account.
func TestExchangeRejectsUnverifiedEmail(t *testing.T) {
	stub := newStub(t, UserInfo{Subject: "s", Email: "owner@example.com", EmailVerified: false}, http.StatusOK)
	client := stub.client(t)

	_, err := client.Exchange(context.Background(), "authorization-code")
	if err == nil {
		t.Fatal("expected an unverified email to be rejected")
	}
	if !strings.Contains(err.Error(), "not verified") {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestExchangeErrors(t *testing.T) {
	t.Run("empty code", func(t *testing.T) {
		stub := newStub(t, UserInfo{}, http.StatusOK)
		if _, err := stub.client(t).Exchange(context.Background(), "  "); err == nil {
			t.Fatal("expected an error for an empty code")
		}
	})

	t.Run("token endpoint fails", func(t *testing.T) {
		stub := newStub(t, UserInfo{}, http.StatusOK)
		stub.tokenBody = `{"error":"invalid_grant","error_description":"code expired"}`
		stub.tokenCode = http.StatusBadRequest

		_, err := stub.client(t).Exchange(context.Background(), "code")
		if err == nil {
			t.Fatal("expected an error")
		}
		if !strings.Contains(err.Error(), "invalid_grant") {
			t.Fatalf("the provider error must be reported: %v", err)
		}
	})

	t.Run("token endpoint returns no token", func(t *testing.T) {
		stub := newStub(t, UserInfo{}, http.StatusOK)
		stub.tokenBody = `{"token_type":"Bearer"}`

		if _, err := stub.client(t).Exchange(context.Background(), "code"); err == nil {
			t.Fatal("expected an error when no access token is returned")
		}
	})

	t.Run("userinfo fails", func(t *testing.T) {
		stub := newStub(t, UserInfo{}, http.StatusForbidden)
		if _, err := stub.client(t).Exchange(context.Background(), "code"); err == nil {
			t.Fatal("expected an error")
		}
	})

	t.Run("userinfo is missing fields", func(t *testing.T) {
		stub := newStub(t, UserInfo{EmailVerified: true}, http.StatusOK)
		if _, err := stub.client(t).Exchange(context.Background(), "code"); err == nil {
			t.Fatal("expected an error when sub/email are missing")
		}
	})

	t.Run("unreachable provider", func(t *testing.T) {
		client, err := New(Config{
			ClientID:     "i",
			ClientSecret: "s",
			RedirectURL:  "r",
			TokenURL:     "http://127.0.0.1:1/token",
			UserInfoURL:  "http://127.0.0.1:1/userinfo",
			HTTPClient:   &http.Client{Timeout: time.Second},
		})
		if err != nil {
			t.Fatalf("new client: %v", err)
		}

		if _, err := client.Exchange(context.Background(), "code"); err == nil {
			t.Fatal("expected an error for an unreachable provider")
		}
	})
}

// TestExchangeTruncatesLongErrorBodies keeps a provider that answers with a huge
// body from filling the logs.
func TestExchangeTruncatesLongErrorBodies(t *testing.T) {
	stub := newStub(t, UserInfo{}, http.StatusOK)
	stub.tokenCode = http.StatusInternalServerError
	stub.tokenBody = strings.Repeat("x", 5000)

	_, err := stub.client(t).Exchange(context.Background(), "code")
	if err == nil {
		t.Fatal("expected an error")
	}
	if len(err.Error()) > 1000 {
		t.Fatalf("the error message was not truncated: %d bytes", len(err.Error()))
	}
}
