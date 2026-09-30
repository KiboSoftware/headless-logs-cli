const NAME_REGEX = /^[A-Za-z_][A-Za-z0-9_]*$/;
const MAX_NAME_LENGTH = 128;
const MAX_VALUE_LENGTH = 4096;

/**
 * Validate an environment variable or secret name.
 * Matches server-side rules: ^[A-Za-z_][A-Za-z0-9_]*$ and max 128 characters.
 * @param {string} name
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateName(name) {
  if (!name || !NAME_REGEX.test(name)) {
    return { valid: false, error: `Invalid variable name "${name}". Names must match [A-Za-z_][A-Za-z0-9_]*` };
  }
  if (name.length > MAX_NAME_LENGTH) {
    return { valid: false, error: `Variable name must not exceed ${MAX_NAME_LENGTH} characters (got ${name.length})` };
  }
  return { valid: true };
}

/**
 * Validate a variable/secret value length.
 * @param {string} value
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateValue(value) {
  if (value && value.length > MAX_VALUE_LENGTH) {
    return { valid: false, error: `Value exceeds maximum length of ${MAX_VALUE_LENGTH} characters (got ${value.length})` };
  }
  return { valid: true };
}
