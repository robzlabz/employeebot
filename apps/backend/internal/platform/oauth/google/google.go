// Package google implements the OpenID Connect code flow against Google:
// building the consent URL, exchanging the code, and reading the verified
// email. The endpoints are configuration so tests can point them at a stub.
package google

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// Default endpoints.
const (
	DefaultAuthURL     = "https://accounts.google.com/o/oauth2/v2/auth"
	DefaultTokenURL    = "https://oauth2.googleapis.com/token"
	DefaultUserInfoURL = "https://openidconnect.googleapis.com/v1/userinfo"
)

// Scope requests the identity and the verified email address only.
const Scope = "openid email"

// Config holds the client registration and the endpoints.
type Config struct {
	ClientID     string
	ClientSecret string
	RedirectURL  string
	AuthURL      string
	TokenURL     string
	UserInfoURL  string
	HTTPClient   *http.Client
}

// Client performs the code flow.
type Client struct {
	cfg    Config
	client *http.Client
}

// UserInfo is the part of the userinfo response this product needs.
type UserInfo struct {
	Subject       string `json:"sub"`
	Email         string `json:"email"`
	EmailVerified bool   `json:"email_verified"`
}

// ErrEmailNotVerified means the provider did not assert the address, so the
// account must not be linked.
var ErrEmailNotVerified = errors.New("google: email is not verified by the provider")

// New builds a client. The client id and secret are required: without them the
// consent URL would be rejected by Google at the worst possible moment.
func New(cfg Config) (*Client, error) {
	if strings.TrimSpace(cfg.ClientID) == "" {
		return nil, errors.New("google: client id is required")
	}
	if strings.TrimSpace(cfg.ClientSecret) == "" {
		return nil, errors.New("google: client secret is required")
	}
	if strings.TrimSpace(cfg.RedirectURL) == "" {
		return nil, errors.New("google: redirect url is required")
	}
	if cfg.AuthURL == "" {
		cfg.AuthURL = DefaultAuthURL
	}
	if cfg.TokenURL == "" {
		cfg.TokenURL = DefaultTokenURL
	}
	if cfg.UserInfoURL == "" {
		cfg.UserInfoURL = DefaultUserInfoURL
	}
	if cfg.HTTPClient == nil {
		cfg.HTTPClient = &http.Client{Timeout: 10 * time.Second}
	}

	return &Client{cfg: cfg, client: cfg.HTTPClient}, nil
}

// AuthCodeURL builds the consent URL. state is the anti-CSRF value the caller
// stores in a short-lived cookie and compares on the callback.
func (c *Client) AuthCodeURL(state string) string {
	params := url.Values{
		"client_id":     {c.cfg.ClientID},
		"redirect_uri":  {c.cfg.RedirectURL},
		"response_type": {"code"},
		"scope":         {Scope},
		"state":         {state},
		"access_type":   {"online"},
		"prompt":        {"select_account"},
	}
	return c.cfg.AuthURL + "?" + params.Encode()
}

// Exchange trades the authorization code for an access token and reads the
// verified email from the userinfo endpoint.
func (c *Client) Exchange(ctx context.Context, code string) (UserInfo, error) {
	if strings.TrimSpace(code) == "" {
		return UserInfo{}, errors.New("google: authorization code is required")
	}

	accessToken, err := c.exchangeCode(ctx, code)
	if err != nil {
		return UserInfo{}, err
	}

	info, err := c.fetchUserInfo(ctx, accessToken)
	if err != nil {
		return UserInfo{}, err
	}
	if !info.EmailVerified {
		return UserInfo{}, ErrEmailNotVerified
	}
	if info.Subject == "" || info.Email == "" {
		return UserInfo{}, errors.New("google: userinfo response is missing sub or email")
	}

	return info, nil
}

func (c *Client) exchangeCode(ctx context.Context, code string) (string, error) {
	form := url.Values{
		"code":          {code},
		"client_id":     {c.cfg.ClientID},
		"client_secret": {c.cfg.ClientSecret},
		"redirect_uri":  {c.cfg.RedirectURL},
		"grant_type":    {"authorization_code"},
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.cfg.TokenURL, strings.NewReader(form.Encode()))
	if err != nil {
		return "", fmt.Errorf("google: build token request: %w", err)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")

	var payload struct {
		AccessToken string `json:"access_token"`
		Error       string `json:"error"`
		Description string `json:"error_description"`
	}
	if err := c.do(req, &payload); err != nil {
		return "", err
	}
	if payload.Error != "" {
		return "", fmt.Errorf("google: token endpoint rejected the code: %s %s", payload.Error, payload.Description)
	}
	if payload.AccessToken == "" {
		return "", errors.New("google: token endpoint returned no access token")
	}

	return payload.AccessToken, nil
}

func (c *Client) fetchUserInfo(ctx context.Context, accessToken string) (UserInfo, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.cfg.UserInfoURL, nil)
	if err != nil {
		return UserInfo{}, fmt.Errorf("google: build userinfo request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Accept", "application/json")

	var info UserInfo
	if err := c.do(req, &info); err != nil {
		return UserInfo{}, err
	}
	return info, nil
}

func (c *Client) do(req *http.Request, target any) error {
	resp, err := c.client.Do(req)
	if err != nil {
		return fmt.Errorf("google: call %s: %w", req.URL.Host, err)
	}
	defer func() { _ = resp.Body.Close() }()

	// The provider response is small; cap it so a misbehaving endpoint cannot
	// exhaust memory.
	body, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return fmt.Errorf("google: read response: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode > 299 {
		return fmt.Errorf("google: %s returned %d: %s", req.URL.Path, resp.StatusCode, truncate(string(body), 200))
	}

	if err := json.Unmarshal(body, target); err != nil {
		return fmt.Errorf("google: decode response: %w", err)
	}
	return nil
}

func truncate(value string, limit int) string {
	if len(value) <= limit {
		return value
	}
	return value[:limit] + "..."
}
