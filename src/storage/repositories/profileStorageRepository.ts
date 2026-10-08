/**
 * Application-facing owner of profile storage lifecycle operations.
 * Raw MMKV access stays behind the infrastructure implementation.
 */
export {
  activatePreparedProfile,
  beginAccountIdentityProofBarrier,
  captureActiveProfileStorageLease,
  capturePreparedProfileStorageLease,
  closeActiveProfileStorage,
  continueAsGuestInNewProfile,
  getActiveStorageProfile,
  getActiveStorageProfileOrNull,
  invalidateActiveAccountIdentityBinding,
  inspectPreparedProfileState,
  invalidatePreparedAccountIdentityBinding,
  inspectPreparedQ13StorageInventory,
  inspectPreparedQ13StorageReadiness,
  notifyProfileStorageReady,
  isActiveProfileStorageLeaseCurrent,
  isPreparedProfileStorageLeaseCurrent,
  readActiveAccountIdentityBinding,
  readPreparedAccountIdentityBinding,
  prepareProfileStorage,
  removeUnavailableEncryptedStorage,
  resolveAccountIdentityProofBarrier,
  selectAccountProfileAndRestart,
  selectPreparedAccountProfile,
  selectPreparedGuestProfile,
  validatePreparedGuestAccess,
  writeActiveAccountIdentityBinding,
  type ActiveProfileStorageLease,
  type PreparedProfileStorageLease,
  type AccountIdentityProofBarrier,
  type PreparedProfileState,
  type Q13StorageInventorySnapshot,
  type Q13StorageReadiness,
} from "../../infrastructure/storage/mmkvClient";
export type { AccountIdentityBinding, AccountIdentityBindingRead } from "../../infrastructure/storage/profileStorageRouter";
