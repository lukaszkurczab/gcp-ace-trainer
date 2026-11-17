import { captureActiveProfileStorageLease, getKeyValueStorage, isActiveProfileStorageLeaseCurrent, isKeyValueWriteObservable, onKeyValueWrite, type ActiveProfileStorageLease } from "../../infrastructure/storage/mmkvClient";
import { STORAGE_KEYS } from "../keys";

/**
 * J1 (D5a): the store epoch of the active profile. It counts every write the
 * storage owner reports (`onKeyValueWrite`), except to keys that the
 * verification of a learning command never reads: the account sync state and
 * the mutation journal itself (the verifier checks the journal object it was
 * given). An unchanged epoch means no observed writer touched the store.
 *
 * The native foreground clock writes its timer key outside this counter, so a
 * caller that depends on the timer must read it again.
 */
const EPOCH_EXCLUDED_KEYS: ReadonlySet<string> = new Set([STORAGE_KEYS.ACCOUNT_SYNC, STORAGE_KEYS.ACTIVE_JOURNAL]);
const epochs = new WeakMap<object, number>();
onKeyValueWrite((storage, key) => {
  if (!EPOCH_EXCLUDED_KEYS.has(key)) epochs.set(storage, (epochs.get(storage) ?? 0) + 1);
});

export type LearningStoreEpoch = Readonly<{ storage: object; lease: ActiveProfileStorageLease | null; count: number }>;

/** Null when the store does not report its writes (no epoch can be trusted). */
export function captureLearningStoreEpoch(): LearningStoreEpoch | null {
  const storage = getKeyValueStorage();
  if (!isKeyValueWriteObservable(storage)) return null;
  return Object.freeze({ storage, lease: captureActiveProfileStorageLease(), count: epochs.get(storage) ?? 0 });
}

export function isLearningStoreEpochCurrent(epoch: LearningStoreEpoch | null): boolean {
  if (!epoch) return false;
  let storage: object;
  try { storage = getKeyValueStorage(); } catch { return false; }
  if (storage !== epoch.storage || (epochs.get(storage) ?? 0) !== epoch.count) return false;
  try { return epoch.lease ? isActiveProfileStorageLeaseCurrent(epoch.lease) : captureActiveProfileStorageLease() === null; }
  catch { return false; }
}
