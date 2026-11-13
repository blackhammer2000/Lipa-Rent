const isProduction = process.env.NODE_ENV === "production";

/**
 * Sanitizes an error message for the client.
 * In production, returns a generic message to avoid leaking stack traces,
 * DB details, or other sensitive information. In development, returns the
 * original message for debugging.
 */
const sanitizeError = (err) => {
  if (isProduction) {
    return "Internal server error";
  }
  return err?.message || "Internal server error";
};

/**
 * Determines the HTTP status code for an error.
 * Falls back to 500 for unknown errors.
 */
const getErrorStatus = (err) => {
  if (!err) return 500;
  if (err.statusCode) return err.statusCode;
  if (err.status) return err.status;
  // Common Mongoose/DB error patterns
  if (err.name === "ValidationError") return 400;
  if (err.name === "CastError") return 400;
  if (err.code === 11000) return 409; // duplicate key
  return 500;
};

/**
 * Global error-handling middleware.
 * Logs the full error stack server-side (never sent to client) and returns
 * a generic error response in production to prevent information leakage.
 */
const errorHandler = (err, req, res, next) => {
  // Log full error details server-side only
  console.error(`[${new Date().toISOString()}] Error:`, {
    message: err?.message,
    stack: err?.stack,
    path: req?.path,
    method: req?.method,
    ip: req?.ip,
  });

  const status = getErrorStatus(err);
  const message = sanitizeError(err);

  res.status(status).json({ error: message });
};

/**
 * 404 handler for unmatched routes.
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({ error: "Route not found" });
};

module.exports = { errorHandler, notFoundHandler, sanitizeError };
