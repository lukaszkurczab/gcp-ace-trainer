import AsyncStorage from "@react-native-async-storage/async-storage";

import { STORAGE_KEYS, type StorageKeyName } from "../keys";
import {
  decodeLocalJson,
  getStorageErrorMessage,
  type LocalStorageIssue,
} from "../storageCodec";

export type StorageRepositoryResult<T> =
  | { ok: true; value: T; issues?: LocalStorageIssue[] }
  | { ok: false; value: T; issues: LocalStorageIssue[] };

export type StorageValueGuard<T> = (value: unknown) => value is T;

export function successRepositoryResult<T>(
  value: T,
  issues: LocalStorageIssue[] = [],
): StorageRepositoryResult<T> {
  return issues.length > 0 ? { ok: true, value, issues } : { ok: true, value };
}

export function failedRepositoryResult<T>(
  value: T,
  issues: LocalStorageIssue[],
): StorageRepositoryResult<T> {
  return { ok: false, value, issues };
}

export async function readRepositoryJson<T>(
  keyName: StorageKeyName,
  fallback: T,
  isValidValue: StorageValueGuard<T>,
): Promise<StorageRepositoryResult<T>> {
  const key = STORAGE_KEYS[keyName];

  try {
    const rawValue = await AsyncStorage.getItem(key);

    if (rawValue === null) {
      return successRepositoryResult(fallback);
    }

    const decoded = decodeLocalJson<unknown>(key, rawValue, fallback);

    if (!decoded.ok) {
      return failedRepositoryResult(fallback, [decoded.issue]);
    }

    if (!isValidValue(decoded.value)) {
      return failedRepositoryResult(fallback, [
        {
          key,
          message: "Stored local data has an invalid shape.",
          operation: "parse",
        },
      ]);
    }

    return successRepositoryResult(decoded.value);
  } catch (error) {
    return failedRepositoryResult(fallback, [
      {
        key,
        message: getStorageErrorMessage(error),
        operation: "read",
      },
    ]);
  }
}

export async function writeRepositoryJson<T>(
  keyName: StorageKeyName,
  value: T,
): Promise<StorageRepositoryResult<T>> {
  const key = STORAGE_KEYS[keyName];

  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return successRepositoryResult(value);
  } catch (error) {
    return failedRepositoryResult(value, [
      {
        key,
        message: getStorageErrorMessage(error),
        operation: "write",
      },
    ]);
  }
}

export async function removeRepositoryJson(
  keyName: StorageKeyName,
): Promise<StorageRepositoryResult<void>> {
  const key = STORAGE_KEYS[keyName];

  try {
    await AsyncStorage.removeItem(key);
    return successRepositoryResult(undefined);
  } catch (error) {
    return failedRepositoryResult(undefined, [
      {
        key,
        message: getStorageErrorMessage(error),
        operation: "remove",
      },
    ]);
  }
}

export function mergeRepositoryIssues(
  ...results: readonly StorageRepositoryResult<unknown>[]
): LocalStorageIssue[] {
  return results.flatMap((result) => result.issues ?? []);
}
