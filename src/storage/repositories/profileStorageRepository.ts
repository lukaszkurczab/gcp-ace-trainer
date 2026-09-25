/**
 * Application-facing owner of profile storage lifecycle operations.
 * Raw MMKV access stays behind the infrastructure implementation.
 */
export {
  activatePreparedProfile,
  closeActiveProfileStorage,
  continueAsGuestInNewProfile,
  getActiveStorageProfile,
  getActiveStorageProfileOrNull,
  inspectPreparedProfileState,
  notifyProfileStorageReady,
  prepareProfileStorage,
  removeUnavailableEncryptedStorage,
  selectAccountProfileAndRestart,
  selectPreparedAccountProfile,
  selectPreparedGuestProfile,
  validatePreparedGuestAccess,
  type PreparedProfileState,
} from "../../infrastructure/storage/mmkvClient";
