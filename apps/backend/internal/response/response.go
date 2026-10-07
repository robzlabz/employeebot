// Package response builds the standard JSON envelope returned by every HTTP
// handler: {"success":bool,"message":string,"data":...,"error":{...}}.
package response

import "github.com/gofiber/fiber/v2"

// ErrorPayload describes a failed request.
type ErrorPayload struct {
	Code    string      `json:"code"`
	Details interface{} `json:"details,omitempty"`
}

// APIResponse is the envelope shared by all endpoints.
type APIResponse struct {
	Success bool          `json:"success"`
	Message string        `json:"message"`
	Data    interface{}   `json:"data,omitempty"`
	Meta    interface{}   `json:"meta,omitempty"`
	Error   *ErrorPayload `json:"error,omitempty"`
}

// Success writes a success envelope with an explicit status code.
func Success(c *fiber.Ctx, status int, message string, data interface{}) error {
	return SuccessWithMeta(c, status, message, data, nil)
}

// SuccessWithMeta writes a success envelope with pagination/aggregate metadata.
func SuccessWithMeta(c *fiber.Ctx, status int, message string, data, meta interface{}) error {
	return c.Status(status).JSON(APIResponse{
		Success: true,
		Message: message,
		Data:    data,
		Meta:    meta,
	})
}

// Error writes a failure envelope with an explicit status code.
func Error(c *fiber.Ctx, status int, message, code string, details interface{}) error {
	return c.Status(status).JSON(APIResponse{
		Success: false,
		Message: message,
		Error: &ErrorPayload{
			Code:    code,
			Details: details,
		},
	})
}

// OK writes a 200 success envelope.
func OK(c *fiber.Ctx, message string, data interface{}) error {
	return Success(c, fiber.StatusOK, message, data)
}

// OKWithMeta writes a 200 success envelope with metadata.
func OKWithMeta(c *fiber.Ctx, message string, data, meta interface{}) error {
	return SuccessWithMeta(c, fiber.StatusOK, message, data, meta)
}

// Created writes a 201 success envelope.
func Created(c *fiber.Ctx, message string, data interface{}) error {
	return Success(c, fiber.StatusCreated, message, data)
}
