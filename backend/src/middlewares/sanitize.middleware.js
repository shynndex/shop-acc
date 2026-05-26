/**
 * Sanitize Middleware
 *
 * Protects against MongoDB operator injection (`$ne`, `$gt`, `$where`, etc.)
 * and trims whitespace from all string values in the request body.
 *
 * Also applies a max depth limit to prevent deep-nested DoS attacks.
 */

const MAX_DEPTH = 6;
const BLOCKED_KEYS = /^\$/; // Keys starting with $

/**
 * Recursively sanitize an object/array/value.
 * - Strips keys that start with `$` (MongoDB operators)
 * - Trims string values
 * - Limits recursion depth
 * - Preserves Buffer objects (important for webhook raw body)
 */
function sanitizeValue(value, depth = 0) {
  if (depth > MAX_DEPTH) {
    // Deep nesting — could be a DoS attempt, return safe empty
    return undefined;
  }

  if (typeof value === "string") {
    return value.trim();
  }

  // 🛡️ Preserve Buffer/Date etc. — don't iterate their byte indices
  if (Buffer.isBuffer(value)) return value;

  // Only sanitize plain objects and arrays
  if (value === null || value === undefined) return value;

  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeValue(item, depth + 1))
      .filter((item) => item !== undefined);
  }

  // Only process plain objects ({ ... }) — skip Date, custom classes, etc.
  if (value.constructor !== Object) {
    return value;
  }

  const sanitized = {};
  for (const [key, val] of Object.entries(value)) {
    // Block keys starting with $ (MongoDB operator injection)
    if (BLOCKED_KEYS.test(key)) {
      console.warn(`[Sanitize] Blocked key "${key}"`);
      continue;
    }
    const sanitizedVal = sanitizeValue(val, depth + 1);
    if (sanitizedVal !== undefined) {
      sanitized[key] = sanitizedVal;
    }
  }
  return sanitized;
}

/**
 * Middleware to sanitize req.body, req.query, and req.params
 */
export function sanitizeInput(req, res, next) {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeValue(req.body);
  }
  if (req.query && typeof req.query === "object") {
    req.query = sanitizeValue(req.query);
  }
  if (req.params && typeof req.params === "object") {
    req.params = sanitizeValue(req.params);
  }
  next();
}
