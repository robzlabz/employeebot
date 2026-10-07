package middleware

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

// RequestLogger logs each request. CORS preflights are skipped to keep the log
// readable.
func RequestLogger() fiber.Handler {
	return logger.New(logger.Config{
		Next: func(c *fiber.Ctx) bool {
			return c.Method() == fiber.MethodOptions
		},
	})
}
