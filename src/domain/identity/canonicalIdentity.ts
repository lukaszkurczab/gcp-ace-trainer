/** Family-neutral safe identity rule shared by persisted and content identities. */
export function isCanonicalSafeIdentity(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && !hasCanonicalEdgeWhitespace(value) && value !== "." && value !== ".." && !/[\\/\u0000]/u.test(value);
}

export function hasCanonicalEdgeWhitespace(value: string): boolean {
  return EDGE_WHITESPACE.test(value);
}

const WHITESPACE = "\\u0009-\\u000D\\u001C-\\u001F\\u0020\\u0085\\u00A0\\u1680\\u2000-\\u200A\\u2028\\u2029\\u202F\\u205F\\u3000\\uFEFF";
const EDGE_WHITESPACE = new RegExp(`^[${WHITESPACE}]|[${WHITESPACE}]$`, "u");
