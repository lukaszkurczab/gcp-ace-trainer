import { getKeyValueStorage } from "../../src/infrastructure/storage/mmkvClient";
import { ownerPreservationOracle } from "../../src/application/testing/ownerPreservationOracle";

globalThis.__ownerPreservationBundleProbe = { getKeyValueStorage, ownerPreservationOracle };
