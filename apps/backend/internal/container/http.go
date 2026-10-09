package container

import (
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"go.uber.org/zap"

	"github.com/robzlabz/employeebot/apps/backend/internal/platform/middleware"
	"github.com/robzlabz/employeebot/apps/backend/internal/platform/response"
)

// requestContextMiddleware attaches request_id, workspace_id and trace_id to
// every request and to the request-scoped logger.
func requestContextMiddleware(log *zap.Logger) fiber.Handler {
	return middleware.RequestContext(log)
}

// corsMiddleware allows the frontend (dev on :3000, docker on :3000) to call
// the API from the browser.
func corsMiddleware() fiber.Handler {
	return cors.New(cors.Config{
		AllowOrigins:  "*",
		AllowMethods:  "GET,POST,HEAD,PUT,DELETE,PATCH,OPTIONS",
		AllowHeaders:  "*",
		ExposeHeaders: "X-Request-Id,X-Trace-Id",
	})
}

// errorHandler turns an unhandled error into the standard JSON envelope and
// logs it with the request context. Fiber's default handler would answer with
// a plain-text body, which the frontend cannot parse.
func errorHandler(log *zap.Logger) fiber.ErrorHandler {
	return func(c *fiber.Ctx, err error) error {
		code := fiber.StatusInternalServerError
		message := "internal server error"
		errorCode := "internal_error"

		var fiberErr *fiber.Error
		if errors.As(err, &fiberErr) {
			code = fiberErr.Code
			message = fiberErr.Message
			errorCode = "http_error"
		}

		middleware.Logger(c).Error("unhandled error",
			zap.Int("status", code),
			zap.String("path", c.Path()),
			zap.Error(err),
		)

		return response.Error(c, code, message, errorCode, nil)
	}
}
