import {
  PUBLISHED_ALGORITHMS_BANK_REQUIRED_KEYS,
  PUBLISHED_ALGORITHMS_ITEM_OPTIONAL_KEYS,
  PUBLISHED_ALGORITHMS_ITEM_REQUIRED_KEYS,
} from "../../../src/content/validation/validatePublishedContent";
import { ALGORITHM_MODES } from "../../../src/tracks/algorithms/domain/algorithmModes";

/** Test-only projection of the app's canonical published Algorithms contract. */
export const APPLICATION_ALGORITHMS_CONTRACT_DESCRIPTOR = Object.freeze({
  artifactSchema: "published-bank-v1",
  bankContract: "PublishedAlgorithmsBank",
  bankRequiredKeys: Object.freeze([...PUBLISHED_ALGORITHMS_BANK_REQUIRED_KEYS].sort()),
  canonicalModeIds: Object.freeze(ALGORITHM_MODES.map((mode) => mode.id).sort()),
  itemOptionalKeys: Object.freeze([...PUBLISHED_ALGORITHMS_ITEM_OPTIONAL_KEYS].sort()),
  itemRequiredKeys: Object.freeze([...PUBLISHED_ALGORITHMS_ITEM_REQUIRED_KEYS].sort()),
});
