import { initializeKeyValueStorage } from "../../infrastructure/storage/mmkvClient";
import { validateStorageMetadata } from "./storageMetadataRepository";

/** Opens the only canonical repository set after the one MMKV client exists. */
export async function openCanonicalRepositories(): Promise<void> {
  initializeKeyValueStorage();
  await validateStorageMetadata();
}
