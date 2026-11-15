import { installProgressSnapshotStore } from "../../infrastructure/clients/PatternlyApiClientAdapter";
import { getKeyValueStorage } from "../../infrastructure/storage/mmkvClient";

/** T3.3a: the persisted progress sweep lives in the active profile store. */
export function installProgressSnapshotPersistence(): void {
  installProgressSnapshotStore(() => getKeyValueStorage());
}
