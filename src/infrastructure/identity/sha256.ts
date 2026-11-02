import { sha256Utf8 as referenceSha256 } from "../../domain/identity/sha256";

type Sha256Accelerator = (value: string) => unknown;
let accelerator: Sha256Accelerator | null = null;
const HEX_DIGEST = /^[a-f0-9]{64}$/u;
// iPhone 17 probes show native overhead dominates tiny IDs; accelerate record-sized inputs.
const NATIVE_MINIMUM_CHARACTERS = 1024;

/** Optional platform capability. The domain implementation remains the byte-contract authority. */
export function installSha256Accelerator(candidate: Sha256Accelerator | null): boolean {
  accelerator = null;
  if (!candidate) return false;
  try {
    const vectors = [
      ["", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"],
      ["Patternly — zażółć 🧠 é", "34010852be04b60be25b2a549277b9977c76fdf332e2f29a06d292b0c3e88d53"],
      ["a".repeat(NATIVE_MINIMUM_CHARACTERS), referenceSha256("a".repeat(NATIVE_MINIMUM_CHARACTERS))],
    ];
    if (vectors.some(([input, expected]) => candidate(input!) !== expected)) return false;
    accelerator = candidate;
    return true;
  } catch { return false; }
}

export function sha256Utf8(value: string): string {
  if (!accelerator || value.length < NATIVE_MINIMUM_CHARACTERS || hasUnpairedSurrogate(value)) return referenceSha256(value);
  try {
    const result = accelerator(value);
    if (typeof result === "string" && HEX_DIGEST.test(result)) return result;
  } catch { /* Recompute the exact digest with the reference implementation. */ }
  accelerator = null;
  return referenceSha256(value);
}

function hasUnpairedSurrogate(value: string): boolean {
  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(++index);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return true;
    } else if (code >= 0xdc00 && code <= 0xdfff) return true;
  }
  return false;
}
