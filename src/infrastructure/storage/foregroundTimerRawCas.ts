/** Existing Android synchronous JS owner and explicit memory-test adapter.
 * This models an atomic JS operation only; iOS uses the native serial owner. */
export function applySynchronousForegroundTimerRaw(
  storage: Readonly<{ getString(key: string): string | undefined; setString(key: string, value: string): void; remove(key: string): void }>,
  key: string, before: string | undefined, after: string | undefined,
): void {
  const current = storage.getString(key);
  if (current === after) return;
  if (current !== before) throw new Error("foreground_clock_conflict");
  if (after === undefined) storage.remove(key); else storage.setString(key, after);
  if (storage.getString(key) !== after) throw new Error("foreground_clock_write_unknown");
}
