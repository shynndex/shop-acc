import { AppError } from "./errorHandler.js";

/**
 * Validation middleware factory.
 *
 * Usage:
 *   router.post("/sign-up", validate(signUpSchema), signUp);
 *   router.post("/purchase", validate(purchaseAccountSchema, "body"), purchaseAccount);
 *   router.get("/:id", validate(objectIdSchema, "params.id"), getById);
 *
 * @param {import("zod").ZodSchema} schema - Zod schema to validate against
 * @param {"body"|"query"|"params"} source - Where to extract data (default: "body")
 * @returns {Function} Express middleware
 */
export function validate(schema, source = "body") {
  return (req, res, next) => {
    const dataToValidate = getNestedValue(req, source);

    const result = schema.safeParse(dataToValidate);

    if (!result.success) {
      const firstError = result.error.errors[0];
      const message = firstError?.message || "Dữ liệu không hợp lệ";

      throw new AppError(message, 400, {
        field: firstError?.path?.join(".") || source,
        details: result.error.errors,
      });
    }

    // Replace with sanitized & defaulted data
    setNestedValue(req, source, result.data);

    next();
  };
}

/**
 * Validate only specific params field (e.g., "params.id")
 */
function getNestedValue(obj, path) {
  if (!path.includes(".")) return obj[path];
  const keys = path.split(".");
  let current = obj;
  for (const key of keys) {
    if (current == null) return undefined;
    current = current[key];
  }
  return current;
}

function setNestedValue(obj, path, value) {
  if (!path.includes(".")) {
    obj[path] = value;
    return;
  }
  const keys = path.split(".");
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (current[keys[i]] == null) current[keys[i]] = {};
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
}
