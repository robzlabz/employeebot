package response

import (
	"encoding/json"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/require"
)

// envelope is the contract the frontend reads; the tests assert on the wire
// shape, not on the Go struct.
type envelope struct {
	Success bool            `json:"success"`
	Message string          `json:"message"`
	Data    json.RawMessage `json:"data"`
	Meta    json.RawMessage `json:"meta"`
	Error   *struct {
		Code    string          `json:"code"`
		Details json.RawMessage `json:"details"`
	} `json:"error"`
}

func newApp(t *testing.T, handler fiber.Handler) *fiber.App {
	t.Helper()

	app := fiber.New(fiber.Config{DisableStartupMessage: true})
	app.Get("/", handler)
	return app
}

func decode(t *testing.T, app *fiber.App) (int, envelope) {
	t.Helper()

	resp, err := app.Test(httptest.NewRequest(fiber.MethodGet, "/", nil))
	require.NoError(t, err)

	var body envelope
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&body))

	return resp.StatusCode, body
}

func TestSuccessHelpers(t *testing.T) {
	tests := []struct {
		name       string
		handler    fiber.Handler
		wantStatus int
		wantData   string
		wantMeta   string
	}{
		{
			name:       "OK",
			handler:    func(c *fiber.Ctx) error { return OK(c, "ok", fiber.Map{"id": "1"}) },
			wantStatus: fiber.StatusOK,
			wantData:   `{"id":"1"}`,
		},
		{
			name:       "Created",
			handler:    func(c *fiber.Ctx) error { return Created(c, "created", fiber.Map{"id": "2"}) },
			wantStatus: fiber.StatusCreated,
			wantData:   `{"id":"2"}`,
		},
		{
			name: "OKWithMeta",
			handler: func(c *fiber.Ctx) error {
				return OKWithMeta(c, "page", []string{"a"}, fiber.Map{"total": 1})
			},
			wantStatus: fiber.StatusOK,
			wantData:   `["a"]`,
			wantMeta:   `{"total":1}`,
		},
		{
			name: "SuccessWithMeta",
			handler: func(c *fiber.Ctx) error {
				return SuccessWithMeta(c, fiber.StatusAccepted, "accepted", nil, fiber.Map{"page": 2})
			},
			wantStatus: fiber.StatusAccepted,
			wantMeta:   `{"page":2}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			status, body := decode(t, newApp(t, tt.handler))
			require.Equal(t, tt.wantStatus, status)

			require.True(t, body.Success)
			if tt.wantData != "" {
				require.JSONEq(t, tt.wantData, string(body.Data))
			} else {
				require.Empty(t, body.Data, "an empty data field must be omitted")
			}
			if tt.wantMeta != "" {
				require.JSONEq(t, tt.wantMeta, string(body.Meta))
			} else {
				require.Empty(t, body.Meta, "an empty meta field must be omitted")
			}
			require.Nil(t, body.Error)
		})
	}
}

func TestErrorHelpers(t *testing.T) {
	tests := []struct {
		name       string
		handler    fiber.Handler
		wantStatus int
		wantCode   string
	}{
		{
			name: "Error",
			handler: func(c *fiber.Ctx) error {
				return Error(c, fiber.StatusBadRequest, "invalid", "invalid_request", fiber.Map{"field": "email"})
			},
			wantStatus: fiber.StatusBadRequest,
			wantCode:   "invalid_request",
		},
		{
			name:       "Unavailable",
			handler:    func(c *fiber.Ctx) error { return Unavailable(c, "not ready", "not_ready") },
			wantStatus: fiber.StatusServiceUnavailable,
			wantCode:   "not_ready",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			status, body := decode(t, newApp(t, tt.handler))

			require.Equal(t, tt.wantStatus, status)
			require.False(t, body.Success)
			require.NotNil(t, body.Error)
			require.Equal(t, tt.wantCode, body.Error.Code)
			require.NotEmpty(t, body.Message)
		})
	}
}
