/**
 * Deterministic random structures for the B0 parity fuzz (Plan T1.1). Shared by
 * the host test (`scripts/qa/nativeCoreParity.test.ts`) and the perf-build
 * diagnostic (`nativeCoreDiagnostics.ts`). Pure TS: no React Native imports.
 *
 * Values are JSON-expressible (finite numbers, plain objects, dense arrays), so
 * `JSON.stringify` is a lossless transport to the native core. Values the
 * transport cannot express are covered by the guard and the `js-only` vectors.
 */
export type FuzzProfile = "canonicalSerialize" | "canonicalFingerprintPayload" | "recordFingerprintPayload" | "canonicalJsonV1" | "sha256Utf8";
export type FuzzCase = Readonly<{ profile: FuzzProfile; value: unknown }>;

export function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const KEY_POOL = Object.freeze([
  "a", "b", "id", "recordId", "state", "z", "A", "_", "10", "2", "-1", "1.5", "__proto__", "constructor", "",
  "é", "é", "Å", "Å", "Å", "ﬁ", "Ａ", "", "￿", "😀", "\ud800", "\udc00", "\ud83d",
  "ключ", "鍵", "\u0000", " ", "a\"b", "a\\b", "가", "가",
]);
const STRING_ATOMS = Object.freeze([
  "a", "Z", " ", "0", "\"", "\\", "/", "\b", "\f", "\n", "\r", "\t", "\u0000", "\u001f", "\u007f", "\u0080", "é", "é",
  "́", " ", " ", "퟿", "", "﻿", "￿", "😀", "\ud800", "\udfff", "\ud83d", "\ude00",
  "ł", "ż", "中", "각", "Å", "̈́", "ཱི", "q̣̇", "क़",
]);

function pick<T>(random: () => number, values: readonly T[]): T {
  return values[Math.floor(random() * values.length)]!;
}

function randomString(random: () => number, maxAtoms = 6): string {
  const count = Math.floor(random() * (maxAtoms + 1));
  let out = "";
  for (let index = 0; index < count; index++) {
    out += random() < 0.5 ? String.fromCharCode(0x20 + Math.floor(random() * 95)) : pick(random, STRING_ATOMS);
  }
  return out;
}

const NUMBER_POOL = Object.freeze([
  0, -0, 1, -1, 0.1, 0.2, 0.30000000000000004, 1e21, 1e-7, 1e-6, 123e-20, 1e20, 999999999999999900000, 5e-324,
  2.2250738585072014e-308, Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, Number.MAX_VALUE, 1.7976931348623157e308, -1e-7, 1 / 3, 100, 1e15, 1e16,
]);

function randomNumber(random: () => number): number {
  const mode = Math.floor(random() * 5);
  if (mode === 0) return pick(random, NUMBER_POOL);
  if (mode === 1) return Math.floor(random() * 2_000_000) - 1_000_000;
  if (mode === 2) return (random() - 0.5) * 10 ** Math.floor(random() * 40 - 20);
  if (mode === 3) {
    // Arbitrary finite bit patterns.
    const view = new DataView(new ArrayBuffer(8));
    view.setUint32(0, Math.floor(random() * 0x1_0000_0000));
    view.setUint32(4, Math.floor(random() * 0x1_0000_0000));
    const value = view.getFloat64(0);
    return Number.isFinite(value) ? value : 0.5;
  }
  return Math.round(random() * 1e6) / 1e3;
}

function randomValue(random: () => number, depth: number): unknown {
  const roll = random();
  if (depth >= 4 || roll < 0.45) {
    const scalar = Math.floor(random() * 5);
    if (scalar === 0) return null;
    if (scalar === 1) return random() < 0.5;
    if (scalar === 2) return randomNumber(random);
    return randomString(random);
  }
  if (roll < 0.7) {
    const length = Math.floor(random() * 5);
    return Array.from({ length }, () => randomValue(random, depth + 1));
  }
  const object: Record<string, unknown> = {};
  const size = Math.floor(random() * 6);
  for (let index = 0; index < size; index++) {
    const key = random() < 0.7 ? pick(random, KEY_POOL) : randomString(random, 3);
    // Own data property even for "__proto__", exactly like JSON.parse creates it.
    Object.defineProperty(object, key, { value: randomValue(random, depth + 1), enumerable: true, configurable: true, writable: true });
  }
  return object;
}

export function generateFuzzCase(random: () => number): FuzzCase {
  const profiles: readonly FuzzProfile[] = ["canonicalSerialize", "canonicalFingerprintPayload", "recordFingerprintPayload", "canonicalJsonV1", "sha256Utf8"];
  const profile = pick(random, profiles);
  if (profile === "sha256Utf8") return { profile, value: randomString(random, 40) };
  if (profile === "recordFingerprintPayload") {
    const state = randomValue(random, 1);
    return {
      profile,
      value: {
        recordId: randomString(random, 3), recordType: "training_session_result", trackId: "coding-interview-dsa-problem-solving",
        state: typeof state === "object" && state !== null && !Array.isArray(state) ? state : { value: state },
      },
    };
  }
  return { profile, value: randomValue(random, 0) };
}

/** UTF-16 → WTF-8 bytes (lone surrogates as 3-byte sequences), the reference SHA byte contract. */
export function wtf8Bytes(value: string): Uint8Array {
  const bytes: number[] = [];
  for (let index = 0; index < value.length; index++) {
    let cp = value.charCodeAt(index);
    if (cp >= 0xd800 && cp <= 0xdbff && index + 1 < value.length) {
      const next = value.charCodeAt(index + 1);
      if (next >= 0xdc00 && next <= 0xdfff) { cp = 0x10000 + ((cp - 0xd800) << 10) + (next - 0xdc00); index++; }
    }
    if (cp <= 0x7f) bytes.push(cp);
    else if (cp <= 0x7ff) bytes.push(0xc0 | (cp >>> 6), 0x80 | (cp & 63));
    else if (cp <= 0xffff) bytes.push(0xe0 | (cp >>> 12), 0x80 | ((cp >>> 6) & 63), 0x80 | (cp & 63));
    else bytes.push(0xf0 | (cp >>> 18), 0x80 | ((cp >>> 12) & 63), 0x80 | ((cp >>> 6) & 63), 0x80 | (cp & 63));
  }
  return Uint8Array.from(bytes);
}
