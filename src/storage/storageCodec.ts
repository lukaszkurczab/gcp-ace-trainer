import { CorruptStoredRecordError, StorageDeleteError, StorageReadError, StorageWriteError, UnsupportedStoredRecordError } from "./errors";
import { getKeyValueStorage } from "../infrastructure/storage/mmkvClient";

export type StorageValueGuard<T> = (value: unknown) => value is T;
export function readStoredJson<T>(key: string, guard: StorageValueGuard<T>): T | null {
  let raw: string | undefined;
  try { raw = getKeyValueStorage().getString(key); } catch (error) { throw new StorageReadError(key, error); }
  if (raw === undefined) return null;
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new CorruptStoredRecordError(key); }
  if (!guard(value)) throw new UnsupportedStoredRecordError(key);
  return value;
}
export function writeStoredJson<T>(key: string, value: T): void {
  try { getKeyValueStorage().setString(key, JSON.stringify(value)); } catch (error) { throw new StorageWriteError(key, error); }
}
export function removeStoredValue(key: string): void { try { getKeyValueStorage().remove(key); } catch (error) { throw new StorageDeleteError(key, error); } }
