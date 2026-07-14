export type StorageIssue = { key: string; message: string; operation: "read" | "write" | "remove" | "parse" };
export type StorageRepositoryResult<T> = { ok: true; value: T; issues?: readonly StorageIssue[] };
