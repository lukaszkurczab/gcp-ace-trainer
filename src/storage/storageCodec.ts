export type LocalStorageOperation = "parse" | "read" | "write" | "remove";

export type LocalStorageIssue = {
  key: string;
  message: string;
  operation: LocalStorageOperation;
};

export type LocalJsonDecodeResult<T> =
  | { ok: true; value: T }
  | { issue: LocalStorageIssue; ok: false; value: T };

export function decodeLocalJson<T>(
  key: string,
  value: string | null,
  fallback: T,
): LocalJsonDecodeResult<T> {
  if (!value) {
    return { ok: true, value: fallback };
  }

  try {
    return { ok: true, value: JSON.parse(value) as T };
  } catch {
    return {
      issue: {
        key,
        message: "Stored local data is not valid JSON.",
        operation: "parse",
      },
      ok: false,
      value: fallback,
    };
  }
}

export function getStorageErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown local storage error.";
}
