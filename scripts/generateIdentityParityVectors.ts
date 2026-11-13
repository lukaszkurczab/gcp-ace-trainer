#!/usr/bin/env node
/**
 * Identity parity vectors (T1.0): the byte contract of the B0 native core.
 *
 * The TypeScript implementation is the oracle. This generator runs it in Node
 * and writes `integration/contracts/identity-parity/vectors.v1.json`.
 * Output is deterministic: a fixed PRNG, no clock, no environment-dependent
 * fields except the oracle runtime (Node / Unicode version), which is stable
 * on one machine.
 *
 *   node --import tsx scripts/generateIdentityParityVectors.ts            # write the file
 *   node --import tsx scripts/generateIdentityParityVectors.ts --check    # exit 1 if the file is stale
 *   node --import tsx scripts/generateIdentityParityVectors.ts --extract-real-sample
 *       # rebuild real-sample.v1.json from the seed 10/100 history plan
 *       # (blackbox/perf/seed/plan.mjs) using the app's own repositories, offline.
 *
 * Changing the produced vectors changes the contract and needs an owner decision
 * (see integration/contracts/identity-parity/README.md).
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { canonicalFingerprintPayload, canonicalJsonV1, canonicalSerialize } from "../src/domain/identity/canonicalSerialization";
import { parseJsonExact } from "../src/domain/identity/exactJson";
import { recordFingerprintPayload, type RecordFingerprintInput } from "../src/domain/identity/recordFingerprint";
import { sha256Utf8 } from "../src/domain/identity/sha256";
import { CANONICAL_RECORD_SCHEMA, parseCanonicalRecordEnvelope } from "../src/storage/repositories/canonicalRecordCodec";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CONTRACT_DIR = resolve(ROOT, "integration/contracts/identity-parity");
export const VECTORS_PATH = resolve(CONTRACT_DIR, "vectors.v1.json");
export const REAL_SAMPLE_PATH = resolve(CONTRACT_DIR, "real-sample.v1.json");
const RECORD_FINGERPRINT_VECTORS_PATH = resolve(ROOT, "integration/contracts/record-fingerprint/vectors.json");

// ---------------------------------------------------------------------------
// Vector model

type Expect =
  | { ok: true; output?: string; sha256?: string; utf8ByteLength?: number; utf8Hex?: string; payload?: string; fingerprint?: string; envelope?: EnvelopeOk }
  | { ok: false; error: { name: string; message: string; code: string } };
type EnvelopeOk = { schemaIdentity: string; revision: number; rawSha256: string; payloadJson: string; payloadSha256: string };
type Input = { json: string } | { js: string } | { string: string } | { repeat: { unit: string; count: number } } | { raw: string };
type Vector = { id: string; profile: Profile; class: string; source: string; nativeApplicable: boolean; note?: string; input: Input; expect: Expect };
type Profile = "canonicalSerialize" | "canonicalFingerprintPayload" | "recordFingerprintPayload" | "canonicalJsonV1" | "sha256Utf8" | "envelope";

/** Stable codes for TS messages that are prose. Codes that are already identifiers map to themselves. */
const ERROR_CODES: Record<string, string> = {
  "Canonical values cannot contain non-finite numbers.": "canonical_serialize_non_finite_number",
  "Canonical values cannot contain unsupported values.": "canonical_serialize_unsupported_value",
  CorruptStoredRecordError: "envelope_corrupt",
  UnsupportedStoredRecordError: "envelope_unsupported",
};

function errorOf(error: unknown): Expect {
  if (!(error instanceof Error)) throw new Error(`non-Error thrown: ${String(error)}`);
  const isStorage = error.name === "CorruptStoredRecordError" || error.name === "UnsupportedStoredRecordError";
  // Storage errors carry the storage key in their message; the code is the contract, not the prose.
  const message = isStorage ? error.name : error.message;
  const code = ERROR_CODES[message] ?? (/^[a-z_]+$/u.test(message) ? message : undefined);
  if (!code) throw new Error(`no stable code for error message: ${error.message}`);
  return { ok: false, error: { name: error.name, message, code } };
}

function attempt(fn: () => Expect): Expect {
  try { return fn(); } catch (error) { return errorOf(error); }
}

const utf8Length = (s: string): number => utf8BytesOf(s).length;
/** Same encoding as src/domain/identity/sha256.ts (unpaired surrogates encoded as 3-byte sequences, no U+FFFD). */
function utf8BytesOf(value: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < value.length; i += 1) {
    let cp = value.charCodeAt(i);
    if (cp >= 0xd800 && cp <= 0xdbff && i + 1 < value.length) {
      const next = value.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) { cp = 0x10000 + ((cp - 0xd800) << 10) + (next - 0xdc00); i += 1; }
    }
    if (cp <= 0x7f) bytes.push(cp);
    else if (cp <= 0x7ff) bytes.push(0xc0 | (cp >>> 6), 0x80 | (cp & 63));
    else if (cp <= 0xffff) bytes.push(0xe0 | (cp >>> 12), 0x80 | ((cp >>> 6) & 63), 0x80 | (cp & 63));
    else bytes.push(0xf0 | (cp >>> 18), 0x80 | ((cp >>> 12) & 63), 0x80 | ((cp >>> 6) & 63), 0x80 | (cp & 63));
  }
  return bytes;
}
const hex = (bytes: number[]): string => bytes.map((b) => b.toString(16).padStart(2, "0")).join("");

// ---------------------------------------------------------------------------
// JS-only inputs: values JSON text cannot express. The native API takes JSON
// text, so these are oracle regression vectors only (nativeApplicable: false).
// identityParity.test.ts rebuilds them from the same tags.

export function buildJsOnlyValue(tag: string): unknown {
  const sparse = new Array(2); sparse[1] = "value";
  const cycle: Record<string, unknown> = {}; cycle.self = cycle;
  const arrayWithProp = Object.assign(["a"], { extra: 1 });
  const arrayWithSymbol = Object.assign(["a"], { [Symbol("s")]: 1 });
  const shared = { leaf: 1 };
  switch (tag) {
    case "undefined": return undefined;
    case "nan": return Number.NaN;
    case "infinity": return Number.POSITIVE_INFINITY;
    case "-infinity": return Number.NEGATIVE_INFINITY;
    case "bigint": return 1n;
    case "symbol": return Symbol("x");
    case "function": return () => 1;
    case "date": return new Date(0);
    case "map": return new Map();
    case "null-prototype": return Object.assign(Object.create(null), { a: 1 });
    case "class-instance": return new (class Box { a = 1; })();
    case "sparse-array": return sparse;
    case "cycle": return cycle;
    case "array-extra-property": return arrayWithProp;
    case "array-symbol-property": return arrayWithSymbol;
    case "object-symbol-key": return { a: 1, [Symbol("k")]: 2 };
    case "nested-undefined-in-array": return [1, undefined, 3];
    case "nested-undefined-in-object": return { a: undefined };
    case "shared-reference-not-cycle": return { left: shared, right: shared };
    case "boxed-string": return new String("x");
    default: throw new Error(`unknown js-only tag ${tag}`);
  }
}
export const JS_ONLY_TAGS = Object.freeze(["undefined", "nan", "infinity", "-infinity", "bigint", "symbol", "function", "date", "map", "null-prototype", "class-instance", "sparse-array", "cycle", "array-extra-property", "array-symbol-property", "object-symbol-key", "nested-undefined-in-array", "nested-undefined-in-object", "shared-reference-not-cycle", "boxed-string"]);

// ---------------------------------------------------------------------------
// Profile evaluators (the oracle)

const BASE_RECORD = { recordId: "parity-record", recordType: "training_session_result", trackId: "coding-interview-dsa-problem-solving" } as const;

export function evaluate(profile: Profile, input: Input): Expect {
  const value = (): unknown => ("json" in input ? parseJsonExact(input.json) : "js" in input ? buildJsOnlyValue(input.js) : (() => { throw new Error("bad input"); })());
  switch (profile) {
    case "canonicalSerialize": return attempt(() => { const output = canonicalSerialize(value()); return { ok: true, output, sha256: sha256Utf8(output) }; });
    case "canonicalFingerprintPayload": return attempt(() => { const output = canonicalFingerprintPayload(value()); return { ok: true, output, sha256: sha256Utf8(output) }; });
    case "canonicalJsonV1": return attempt(() => { const output = canonicalJsonV1(value()); return { ok: true, output, utf8ByteLength: new TextEncoder().encode(output).byteLength }; });
    case "recordFingerprintPayload": return attempt(() => {
      // JSON input is the whole record; js-only input is placed under state.nested of a fixed record.
      const record = "json" in input ? parseJsonExact(input.json) as RecordFingerprintInput : { ...BASE_RECORD, state: { nested: buildJsOnlyValue((input as { js: string }).js) } };
      const payload = recordFingerprintPayload(record);
      return { ok: true, payload, fingerprint: sha256Utf8(payload) };
    });
    case "sha256Utf8": {
      const s = "string" in input ? input.string : "repeat" in input ? input.repeat.unit.repeat(input.repeat.count) : (() => { throw new Error("bad sha input"); })();
      const bytes = utf8BytesOf(s);
      return { ok: true, sha256: sha256Utf8(s), utf8ByteLength: bytes.length, ...(bytes.length <= 256 ? { utf8Hex: hex(bytes) } : {}) };
    }
    case "envelope": return attempt(() => {
      const raw = (input as { raw: string }).raw;
      const envelope = parseCanonicalRecordEnvelope(raw, "parity:key");
      if (envelope === null) throw new Error("unreachable: raw is always a string");
      const payloadJson = JSON.stringify(envelope.payload);
      return { ok: true, envelope: { schemaIdentity: envelope.schemaIdentity, revision: envelope.revision, rawSha256: sha256Utf8(raw), payloadJson, payloadSha256: sha256Utf8(payloadJson) } };
    });
  }
}

// ---------------------------------------------------------------------------
// Deterministic PRNG (mulberry32)

function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Synthetic corpora

const NUMBERS: readonly number[] = [
  0, -0, 1, -1, 2, 10, 100, 123456789, -987654321, 1.5, -2.25, 0.1, 0.2, 0.1 + 0.2, 1 / 3, 2 / 3, 4.35, 0.000001, 0.0000001, 1e-7, 5e-7, 1e-6, 123e-20,
  1e20, 1e21, 1e22, 1.5e21, 999999999999999999999, 123456789012345680000, 1e100, -1e-100, 1e308, 1.7976931348623157e308, -1.7976931348623157e308,
  Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER + 1, Number.MAX_SAFE_INTEGER + 3, Number.MIN_SAFE_INTEGER, 2 ** 31, 2 ** 32, 2 ** 53, 2 ** 63, 2 ** 64,
  Number.EPSILON, Number.MIN_VALUE, -Number.MIN_VALUE, 2.2250738585072014e-308, 2.225073858507201e-308, 4.9406564584124654e-324, 1e-323, 1.2345e-310,
  9.007199254740993e15, 0.5, 0.25, 0.125, 3.141592653589793, 2.718281828459045, 1.7976931348623157e-300, 5e-324 * 3, 1.0000000000000002, 0.9999999999999999,
  100000000000000000000, 10000000000000000000000, 0.0001, 0.00001, 1.1e-6, 9.999999999999999e20, 1e-5, 25e-8,
];

/** Random finite doubles from raw IEEE-754 bit patterns (shortest round-trip coverage). */
function randomDoubles(count: number, random: () => number): number[] {
  const out: number[] = [];
  const view = new DataView(new ArrayBuffer(8));
  while (out.length < count) {
    view.setUint32(0, Math.floor(random() * 0x1_0000_0000));
    view.setUint32(4, Math.floor(random() * 0x1_0000_0000));
    const n = view.getFloat64(0);
    if (Number.isFinite(n)) out.push(n);
  }
  return out;
}

const STRINGS: readonly [string, string][] = [
  ["empty", ""], ["ascii", "Patternly"], ["quote", "\""], ["backslash", "\\"], ["slash", "/"], ["quote-backslash-mix", "a\"b\\c/d"],
  ["nul", "\u0000"], ["controls-named", "\b\f\n\r\t"], ["controls-unnamed", "\u0001\u0007\u000b\u000e\u001b\u001f"], ["del", "\u007f"], ["c1-control", "\u0080\u009f"],
  ["ls-ps", "\u2028\u2029"], ["latin1", "zażółć gęślą jaźń"], ["cjk", "中文测试"], ["bmp-high", "\uffff\ufffe\ufeff\ufffd"], ["private-use", "\ue000\uf8ff"],
  ["emoji", "🧠"], ["emoji-zwj", "👩‍💻"], ["flag", "🇵🇱"], ["astral-max", "\u{10ffff}"], ["skin-tone", "👍🏽"],
  ["lone-high", "\ud800"], ["lone-low", "\udc00"], ["lone-high-end", "abc\udbff"], ["lone-low-start", "\udfffabc"], ["reversed-pair", "\udc00\ud800"],
  ["high-high-low", "\ud800\ud800\udc00"], ["high-low-low", "\ud800\udc00\udc00"], ["lone-in-text", "a\ud834b"],
  ["nfd-e-acute", "e\u0301"], ["nfc-e-acute", "\u00e9"], ["nfd-cafe", "Cafe\u0301"], ["angstrom-sign", "\u212b"], ["a-ring", "\u00c5"], ["ohm", "\u2126"],
  ["hangul-jamo", "\u1100\u1161\u11a8"], ["hangul-syllable", "\uac01"], ["multi-combining-order", "a\u0323\u0301"], ["multi-combining-reverse", "a\u0301\u0323"],
  ["singleton-kelvin", "\u212a"], ["compat-not-nfc", "\ufb01"], ["nfd-polish", "z\u0307o\u0301\u0142c\u0301"], ["combining-alone", "\u0301"],
  ["escaped-looking", "\\u0041"], ["html", "<script>&amp;</script>"], ["long-ascii", "x".repeat(300)], ["whitespace", " \u00a0\u2003\u3000"],
];

const KEY_SETS: readonly [string, string[]][] = [
  ["ascii-case", ["b", "a", "B", "A", "_", "0"]],
  ["integer-like", ["10", "2", "1", "-1", "01", "1.5", "4294967295", "4294967294"]],
  ["empty-and-space", ["", " ", "  ", "a"]],
  ["utf16-vs-utf8", ["\ue000", "\uffff", "😀", "\ud7ff", "z", "\u00ff"]],
  ["surrogate-keys", ["\ud800", "\udc00", "\ud800\udc00", "\udbff\udfff", "\uffff"]],
  ["nfc-reorder", ["e\u0301", "f", "\u00e9", "e"].filter((k) => k !== "\u00e9")],
  ["proto-and-builtins", ["__proto__", "constructor", "toString", "hasOwnProperty"]],
  ["control-keys", ["\u0000", "\n", "\u001f", "\u2028"]],
  ["prefixes", ["a", "aa", "aaa", "ab", "a\u0000"]],
  ["mixed-scripts", ["ż", "z", "Ż", "中", "й", "и\u0306"]],
];

/** Builds a random JSON value from tricky primitives; keys may collide after NFC on purpose. */
function randomValue(random: () => number, depth: number, pool: { strings: string[]; numbers: number[]; keys: string[] }): unknown {
  const pick = <T,>(items: readonly T[]): T => items[Math.floor(random() * items.length)]!;
  const r = random();
  if (depth <= 0 || r < 0.45) {
    const p = random();
    if (p < 0.1) return null;
    if (p < 0.2) return random() < 0.5;
    if (p < 0.55) return pick(pool.numbers);
    return pick(pool.strings);
  }
  if (r < 0.7) {
    const length = Math.floor(random() * 5);
    return Array.from({ length }, () => randomValue(random, depth - 1, pool));
  }
  const out: Record<string, unknown> = {};
  const count = Math.floor(random() * 6);
  for (let i = 0; i < count; i += 1) out[pick(pool.keys)] = randomValue(random, depth - 1, pool);
  return out;
}

// ---------------------------------------------------------------------------
// Building the vector list

class Builder {
  readonly vectors: Vector[] = [];
  private readonly ids = new Set<string>();
  add(profile: Profile, cls: string, name: string, input: Input, options: { source?: string; note?: string } = {}): void {
    const id = `${profile}/${cls}/${name}`;
    if (this.ids.has(id)) throw new Error(`duplicate vector id ${id}`);
    this.ids.add(id);
    const nativeApplicable = !("js" in input);
    this.vectors.push({ id, profile, class: cls, source: options.source ?? "synthetic", nativeApplicable, ...(options.note ? { note: options.note } : {}), input, expect: evaluate(profile, input) });
  }
  /** One JSON value through every value profile (canonicalSerialize, canonicalFingerprintPayload, canonicalJsonV1). */
  addValue(cls: string, name: string, json: string, options: { source?: string; note?: string; profiles?: Profile[] } = {}): void {
    for (const profile of options.profiles ?? (["canonicalSerialize", "canonicalFingerprintPayload", "canonicalJsonV1"] as Profile[])) this.add(profile, cls, name, { json }, options);
  }
  addRecord(cls: string, name: string, state: string, options: { source?: string; note?: string } = {}): void {
    const json = `{"recordId":${JSON.stringify(BASE_RECORD.recordId)},"recordType":${JSON.stringify(BASE_RECORD.recordType)},"trackId":${JSON.stringify(BASE_RECORD.trackId)},"state":${state}}`;
    this.add("recordFingerprintPayload", cls, name, { json }, options);
  }
}

function buildSynthetic(b: Builder): void {
  const random = prng(0x1d3a7171);

  // numbers ---------------------------------------------------------------
  NUMBERS.forEach((n, i) => {
    const json = JSON.stringify(n);
    b.addValue("numbers", `fixed-${String(i).padStart(3, "0")}`, json);
    b.addRecord("numbers", `fixed-${String(i).padStart(3, "0")}`, `{"n":${json}}`);
  });
  b.addValue("numbers", "negative-zero-literal", "-0");
  b.addRecord("numbers", "negative-zero-literal", "{\"zero\":-0}");
  randomDoubles(120, random).forEach((n, i) => b.addValue("numbers", `random-bits-${String(i).padStart(3, "0")}`, JSON.stringify(n), { profiles: i % 2 === 0 ? ["canonicalSerialize", "canonicalJsonV1"] : ["canonicalSerialize"] }));
  // JSON number spellings a native parser must accept and reprint like ECMAScript.
  const spellings: [string, string][] = [
    ["one-point-zero", "1.0"], ["exp-upper", "1E2"], ["exp-plus", "1e+2"], ["exp-minus", "100e-2"], ["neg-zero-float", "-0.0"], ["neg-zero-exp", "-0e10"],
    ["frac-exp", "0.1e1"], ["many-digits", "0.30000000000000004441"], ["over-precise", "1.00000000000000011102230246251565404236316680908203125"],
    ["long-integer", "123456789012345678901234567890"], ["tiny-underflow-to-zero", "1e-400"], ["subnormal-literal", "4.9e-324"], ["halfway-even", "9007199254740993"],
    ["exp-leading-zeros", "1e007"], ["huge-exp-1e21", "1000000000000000000000"], ["max-double-literal", "1.7976931348623157e308"],
  ];
  for (const [name, json] of spellings) { b.addValue("number-spelling", name, json); b.addRecord("number-spelling", name, `{"n":${json}}`); }
  // Overflow to Infinity is reachable from JSON text and must fail like TS.
  for (const [name, json] of [["overflow", "1e400"], ["neg-overflow", "-1e400"], ["overflow-nested", "{\"a\":[1,2e308]}"]] as const) {
    b.addValue("errors", name, json);
    b.addRecord("errors", name, `{"n":${json}}`);
  }

  // strings / escaping ------------------------------------------------------
  for (const [name, s] of STRINGS) {
    const json = JSON.stringify(s);
    b.addValue("strings", name, json);
    b.addValue("strings", `${name}-as-key`, `{${json}:${json}}`);
    b.addRecord("strings", name, `{"text":${json},${json}:1}`);
    b.add("sha256Utf8", "strings", name, { string: s });
  }
  // String spellings in JSON text (escapes the native parser must decode).
  const stringSpellings: [string, string][] = [
    ["escape-unicode-upper", "\"\\u00E9\\u00C5\""], ["escape-slash", "\"a\\/b\""], ["escaped-pair", "\"\\ud83e\\udde0\""], ["escaped-lone-high", "\"\\uD800\""],
    ["escaped-nul", "\"\\u0000\""], ["raw-ls-ps", "\"\u2028\u2029\""], ["raw-del", "\"\u007f\""], ["escape-all-named", "\"\\b\\f\\n\\r\\t\\\"\\\\\""],
  ];
  for (const [name, json] of stringSpellings) { b.addValue("string-spelling", name, json); b.addRecord("string-spelling", name, `{"text":${json}}`); }

  // key ordering ----------------------------------------------------------
  for (const [name, keys] of KEY_SETS) {
    const forward = `{${keys.map((k, i) => `${JSON.stringify(k)}:${i}`).join(",")}}`;
    const reverse = `{${[...keys].reverse().map((k) => `${JSON.stringify(k)}:${keys.indexOf(k)}`).join(",")}}`;
    b.addValue("key-order", `${name}-forward`, forward);
    b.addValue("key-order", `${name}-reverse`, reverse);
    b.addRecord("key-order", name, forward);
  }
  // NFC -------------------------------------------------------------------
  const nfcCases: [string, string][] = [
    ["collision-e-acute", "{\"\u00e9\":1,\"e\u0301\":2}"],
    ["collision-angstrom", "{\"\u212b\":1,\"\u00c5\":2,\"A\u030a\":3}"],
    ["collision-ohm", "{\"\u2126\":1,\"\u03a9\":2}"],
    ["collision-hangul", "{\"\uac01\":1,\"\u1100\u1161\u11a8\":2}"],
    ["collision-combining-order", "{\"a\u0323\u0301\":1,\"a\u0301\u0323\":2}"],
    ["collision-nested-in-array", "{\"list\":[{\"ok\":1},{\"\u00e9\":1,\"e\u0301\":2}]}"],
    ["collision-deep", "{\"a\":{\"b\":{\"c\":{\"\u212a\":1,\"K\":2}}}}"],
    ["no-collision-nfd-key-only", "{\"e\u0301\":1,\"f\":2}"],
    ["no-collision-nfd-value", "{\"k\":\"Cafe\u0301\"}"],
    ["no-collision-compat", "{\"\ufb01\":1,\"fi\":2}"],
    ["nfd-value-in-array", "[\"e\u0301\",\"\u00e9\"]"],
    ["nfc-key-sort-change", "{\"e\u0301x\":1,\"ex\":2,\"ez\":3,\"f\":4}"],
    ["lone-surrogate-key-nfc", "{\"\\ud800\":1,\"\\udc00\":2}"],
  ];
  for (const [name, json] of nfcCases) { b.addValue("nfc", name, json); b.addRecord("nfc", name, json.startsWith("[") ? `{"v":${json}}` : json); }

  // nesting / empty containers ----------------------------------------------
  const nesting: [string, string][] = [
    ["empty-object", "{}"], ["empty-array", "[]"], ["null", "null"], ["true", "true"], ["false", "false"], ["array-of-empties", "[{},[],null,\"\"]"],
    ["object-of-empties", "{\"a\":{},\"b\":[],\"c\":null,\"d\":\"\"}"], ["deep-array", `${"[".repeat(64)}1${"]".repeat(64)}`],
    ["deep-object", `${"{\"k\":".repeat(64)}0${"}".repeat(64)}`], ["mixed", "{\"z\":[1,{\"y\":[true,null,{\"x\":\"w\"}]}],\"a\":-0}"],
    ["array-order-kept", "[3,1,2,\"b\",\"a\"]"], ["whitespace-text", " {\n \"b\" : [ 1 , 2 ] ,\t\"a\" : { } } "],
    ["duplicate-literal-key-last-wins", "{\"a\":1,\"b\":2,\"a\":3}"], ["duplicate-literal-key-nested", "{\"o\":{\"x\":[1],\"x\":[2]}}"],
    ["proto-key-own-property", "{\"__proto__\":{\"polluted\":true},\"a\":1}"], ["wide-object", `{${Array.from({ length: 200 }, (_, i) => `"k${(i * 7919) % 200}":${i}`).join(",")}}`],
    ["long-array", `[${Array.from({ length: 300 }, (_, i) => i * 3).join(",")}]`],
  ];
  for (const [name, json] of nesting) { b.addValue("nesting", name, json); b.addRecord("nesting", name, json.startsWith("{") ? json : `{"v":${json}}`); }

  // record shape edge cases (recordFingerprintPayload picks exactly four fields) --
  const recordShapes: [string, string][] = [
    ["extra-fields-dropped", "{\"recordId\":\"r\",\"recordType\":\"t\",\"trackId\":\"k\",\"state\":{},\"fingerprint\":\"x\",\"version\":3}"],
    ["missing-state", "{\"recordId\":\"r\",\"recordType\":\"t\",\"trackId\":\"k\"}"],
    ["missing-track", "{\"recordId\":\"r\",\"recordType\":\"t\",\"state\":{}}"],
    ["state-array", "{\"recordId\":\"r\",\"recordType\":\"t\",\"trackId\":\"k\",\"state\":[1,2]}"],
    ["state-null", "{\"recordId\":\"r\",\"recordType\":\"t\",\"trackId\":\"k\",\"state\":null}"],
    ["numeric-record-id", "{\"recordId\":7,\"recordType\":\"t\",\"trackId\":\"k\",\"state\":{}}"],
    ["unicode-ids", "{\"recordId\":\"r\u00e9\",\"recordType\":\"t\",\"trackId\":\"k\ud83e\udde0\",\"state\":{\"\u00e9\":\"e\u0301\"}}"],
    ["lone-surrogate-in-state", "{\"recordId\":\"r\",\"recordType\":\"t\",\"trackId\":\"k\",\"state\":{\"text\":\"\\ud800\"}}"],
  ];
  for (const [name, json] of recordShapes) b.add("recordFingerprintPayload", "record-shape", name, { json });

  // random structures ---------------------------------------------------------
  const pool = {
    strings: STRINGS.map(([, s]) => s).filter((s) => s.length < 40),
    numbers: [...NUMBERS],
    keys: [...new Set(KEY_SETS.flatMap(([, keys]) => keys).concat(["id", "state", "value", "items", "\u00e9", "e\u0301"]))],
  };
  for (let i = 0; i < 160; i += 1) {
    const value = randomValue(random, 4, pool);
    const json = JSON.stringify(value);
    const name = `random-${String(i).padStart(3, "0")}`;
    b.addValue("random", name, json);
    b.addRecord("random", name, typeof value === "object" && value !== null && !Array.isArray(value) ? json : `{"v":${json}}`);
  }

  // sha256 lengths and padding boundaries ---------------------------------------
  for (const length of [0, 1, 3, 55, 56, 57, 63, 64, 65, 111, 119, 120, 127, 128, 129, 1000, 1023, 1024, 1025, 4096]) {
    b.add("sha256Utf8", "sha-length", `ascii-${length}`, { repeat: { unit: "a", count: length } });
  }
  for (const [unit, label] of [["\u00e9", "2byte"], ["\u4e2d", "3byte"], ["🧠", "4byte"], ["\ud800", "lone-high"], ["\udc00", "lone-low"]] as const) {
    for (const count of [1, 18, 19, 21, 22, 32, 300, 1024]) b.add("sha256Utf8", "sha-length", `${label}-x${count}`, { repeat: { unit, count } });
  }
  for (let i = 0; i < 40; i += 1) {
    let s = "";
    const length = Math.floor(random() * 80);
    for (let j = 0; j < length; j += 1) s += String.fromCharCode(Math.floor(random() * 0x10000));
    b.add("sha256Utf8", "sha-random-utf16", `units-${String(i).padStart(3, "0")}`, { string: s }, { note: "random UTF-16 code units, may contain unpaired surrogates" });
  }

  // envelopes ------------------------------------------------------------------
  const S = CANONICAL_RECORD_SCHEMA;
  const env = (revision: string, payload: string, schema = JSON.stringify(S)): string => `{"schemaIdentity":${schema},"revision":${revision},"payload":${payload}}`;
  const envelopes: [string, string][] = [
    ["minimal", env("1", "{}")], ["payload-null", env("1", "null")], ["payload-array", env("2", "[1,2,3]")], ["payload-string", env("3", "\"x\"")],
    ["payload-number", env("4", "1e21")], ["revision-max-safe", env("9007199254740991", "{}")], ["revision-float-integral", env("1.0", "{}")], ["revision-exp", env("1e1", "{}")],
    ["key-order-different", `{"payload":{"b":1,"a":2},"revision":5,"schemaIdentity":"${S}"}`],
    ["whitespace", ` {\n "schemaIdentity" : "${S}" ,\n "revision" : 1 ,\n "payload" : { } }\n`],
    ["integer-keys-reordered-by-parse", env("1", "{\"b\":1,\"10\":2,\"2\":3,\"a\":4}")],
    ["duplicate-payload-key-position", env("1", "{\"a\":1,\"b\":2,\"a\":3}")],
    ["duplicate-revision-key", `{"schemaIdentity":"${S}","revision":7,"revision":2,"payload":{}}`],
    ["unicode-payload", env("1", "{\"t\":\"Cafe\u0301 🧠 \\u00e9\",\"lone\":\"\\ud800\"}")],
    ["payload-1e21-and-neg-zero", env("1", "{\"n\":[1e21,-0,0.1,1E2]}")],
    ["payload-escapes", env("1", "{\"s\":\"\\u2028\\/\\b\\u001f\"}")],
    ["proto-key-in-payload", env("1", "{\"__proto__\":{\"x\":1}}")],
    ["nested-envelope-payload", env("1", env("2", "{}"))],
    // invalid
    ["empty-string", ""], ["not-json", "{"], ["bom-prefixed", `\ufeff${env("1", "{}")}`], ["json-null", "null"], ["json-array", "[]"], ["json-string", "\"x\""],
    ["revision-zero", env("0", "{}")], ["revision-negative", env("-1", "{}")], ["revision-fraction", env("1.5", "{}")], ["revision-string", env("\"1\"", "{}")],
    ["revision-unsafe", env("9007199254740992", "{}")], ["revision-null", env("null", "{}")], ["revision-overflow", env("1e400", "{}")],
    ["schema-wrong", env("1", "{}", "\"patternly:canonical:v2\"")], ["schema-uppercase", env("1", "{}", JSON.stringify(S.toUpperCase()))], ["schema-missing", "{\"revision\":1,\"payload\":{},\"x\":1}"],
    ["payload-missing", `{"schemaIdentity":"${S}","revision":1}`], ["extra-key", `{"schemaIdentity":"${S}","revision":1,"payload":{},"x":1}`],
    ["payload-missing-extra-key", `{"schemaIdentity":"${S}","revision":1,"payload2":{}}`], ["trailing-garbage", `${env("1", "{}")}x`], ["trailing-comma", `{"schemaIdentity":"${S}","revision":1,"payload":{},}`],
    ["single-quotes", `{'schemaIdentity':'${S}','revision':1,'payload':{}}`], ["nan-literal", env("NaN", "{}")], ["proto-instead-of-payload", `{"schemaIdentity":"${S}","revision":1,"__proto__":{"payload":1}}`],
    ["lone-surrogate-raw-escaped", env("1", "{\"x\":\"\\udfff\"}")], ["control-char-raw-in-string", env("1", "{\"x\":\"a\u0001b\"}")],
  ];
  for (const [name, raw] of envelopes) b.add("envelope", "envelope", name, { raw });

  // JS-only (oracle regression; the native API takes JSON text) -------------------
  for (const tag of JS_ONLY_TAGS) {
    for (const profile of ["canonicalSerialize", "canonicalFingerprintPayload", "canonicalJsonV1", "recordFingerprintPayload"] as const) {
      // Only the record profile detects cycles; the others overflow the engine stack, which is not a contract.
      if (tag === "cycle" && profile !== "recordFingerprintPayload") continue;
      b.add(profile, "js-only", tag, { js: tag });
    }
  }
}

// ---------------------------------------------------------------------------
// Fixtures from existing passing tests (T0.8 baseline: none of these files is in known-failures.json)

function buildTestFixtures(b: Builder): void {
  const src = (file: string) => `test-fixture:${file}`;
  // src/domain/identity/canonicalSerialization.test.ts
  const cs = src("src/domain/identity/canonicalSerialization.test.ts");
  b.addValue("test-fixture", "cs-key-sort-b-a", JSON.stringify({ b: 1, a: ["x", "y"] }), { source: cs });
  b.addValue("test-fixture", "cs-array-xy", JSON.stringify(["x", "y"]), { source: cs });
  b.addValue("test-fixture", "cs-array-yx", JSON.stringify(["y", "x"]), { source: cs });
  b.addValue("test-fixture", "cs-value-1", JSON.stringify({ value: 1 }), { source: cs });
  b.addValue("test-fixture", "cs-nfd-key-emoji", JSON.stringify({ "e\u0301": "🙂" }), { source: cs });
  b.addValue("test-fixture", "cs-nfc-key-emoji", JSON.stringify({ "é": "🙂" }), { source: cs });
  b.addValue("test-fixture", "cs-duplicate-nfc", "{\"e\u0301\":1,\"é\":2}", { source: cs });
  b.addValue("test-fixture", "cs-neg-zero", "{\"value\":-0}", { source: cs });
  b.addValue("test-fixture", "cs-selected-options", JSON.stringify({ selectedOptionIds: ["a", "b"] }), { source: cs, note: "canonicalFingerprintPayload sha256 = 5f770ccc… (literal in the test)" });
  // src/domain/identity/sha256.test.ts
  const sh = src("src/domain/identity/sha256.test.ts");
  for (const [name, s] of [["empty", ""], ["abc", "abc"], ["polish", "żąłć"], ["brain", "🧠"], ["nfd-e", "e\u0301"], ["nfc-e", "é"], ["nul", "\0"], ["mixed", "a\0🧠e\u0301żąłć"],
    ["lone-d800", "\uD800"], ["lone-dc00", "\uDC00"], ["lone-d800-A", "\uD800A"], ["dc00-d800", "\uDC00\uD800"], ["d800-pair", "\uD800\uD800\uDC00"], ["pair-dc00", "\uD800\uDC00\uDC00"], ["max-pair", "\uDBFF\uDFFF"],
    ["records-json", JSON.stringify({ phase: "verified_pending_clear", records: Array(64).fill("ż🧠") })]] as const) b.add("sha256Utf8", "test-fixture", `sha-${name}`, { string: s }, { source: sh });
  b.add("sha256Utf8", "test-fixture", "sha-patternly-x128", { repeat: { unit: "Patternly", count: 128 } }, { source: sh });
  for (const length of [4, 55, 56, 63, 64, 65, 119, 120, 127, 128, 4096]) b.add("sha256Utf8", "test-fixture", `sha-brain-pad-${length}`, { string: "🧠" + "a".repeat(length - 4) }, { source: sh });
  // The LCG Unicode samples from the same test (well-formed scalars only).
  let seed = 0x12345678;
  for (let sample = 0; sample < 128; sample += 8) {
    let value = "";
    for (let index = 0; index < sample; index += 1) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const scalar = seed % 0x110000;
      value += String.fromCodePoint(scalar >= 0xd800 && scalar <= 0xdfff ? 0xfffd : scalar);
    }
    b.add("sha256Utf8", "test-fixture", `sha-lcg-${sample}`, { string: value }, { source: sh, note: "LCG stream differs from the test's because only every 8th sample is taken" });
  }
  // src/infrastructure/identity/sha256.ts accelerator self-test vector
  b.add("sha256Utf8", "test-fixture", "sha-accelerator-probe", { string: "Patternly — zażółć 🧠 é" }, { source: "test-fixture:src/infrastructure/identity/sha256.ts" });
  // src/domain/identity/recordFingerprint.test.ts negative cases are the js-only tags + NFC collision (covered above).
  // integration/contracts/record-fingerprint/vectors.json (shared app/backend contract, read by recordFingerprint.test.ts)
  const contract = JSON.parse(readFileSync(RECORD_FINGERPRINT_VECTORS_PATH, "utf8")) as { cases: { name: string; record: unknown }[] };
  for (const c of contract.cases) {
    b.add("recordFingerprintPayload", "test-fixture", `record-contract-${c.name}`, { json: JSON.stringify(c.record) }, { source: "contract:integration/contracts/record-fingerprint/vectors.json" });
    b.add("canonicalSerialize", "test-fixture", `record-contract-${c.name}`, { json: JSON.stringify(c.record) }, { source: "contract:integration/contracts/record-fingerprint/vectors.json" });
  }
}

// ---------------------------------------------------------------------------
// Real sample (seed 10/100 records and raw MMKV envelopes), frozen in real-sample.v1.json

type RealSample = { schema: string; provenance: Record<string, unknown>; records: { seed: number; record: { recordId: string; recordType: string; trackId: string; state: unknown; fingerprint: string } }[]; envelopes: { seed: number; key: string; raw: string }[] };

function buildRealSample(b: Builder): number {
  if (!existsSync(REAL_SAMPLE_PATH)) return 0;
  const sample = JSON.parse(readFileSync(REAL_SAMPLE_PATH, "utf8")) as RealSample;
  for (const { seed, record } of sample.records) {
    const { fingerprint, ...rest } = record;
    const input = { json: JSON.stringify({ recordId: rest.recordId, recordType: rest.recordType, state: rest.state, trackId: rest.trackId }) };
    const name = `seed${seed}-${record.recordType}-${record.recordId}`;
    b.add("recordFingerprintPayload", "real", name, input, { source: `real:seed${seed}` });
    const last = b.vectors[b.vectors.length - 1]!;
    if (!last.expect.ok || last.expect.fingerprint !== fingerprint) throw new Error(`real record ${name}: stored fingerprint differs from the oracle`);
  }
  for (const { seed, key, raw } of sample.envelopes) b.add("envelope", "real", `seed${seed}-${key}`, { raw }, { source: `real:seed${seed}` });
  return sample.records.length + sample.envelopes.length;
}

async function extractRealSample(): Promise<void> {
  // Builds the seed history exactly like blackbox/perf/seed/generate-history.mjs --dry-run,
  // with a fixed clock (the seed's meta.json createdAt) so the sample is reproducible.
  const blackbox = resolve(ROOT, "../blackbox/perf/seed");
  const { buildHistoryPlan, reviewTargets } = await import(pathToFileURL(resolve(blackbox, "plan.mjs")).href) as { buildHistoryPlan: (o: object) => PlanSession[]; reviewTargets: (p: PlanSession[]) => { session: PlanSession; occurrence: PlanOccurrence }[] };
  type PlanOccurrence = { occurrenceId: string; optionId: string; correct: boolean; answeredAt: string; question: { questionId: string; nodeId: string; mentalUnitId: string; optionIds: string[] } };
  type PlanSession = { sessionId: string; startedAt: string; completedAt: string; activeForegroundMs: number; occurrences: PlanOccurrence[] };
  const { MemoryKeyValueStorage, installKeyValueStorageForTests, setActiveProfileLeaseForTests } = await import("../src/infrastructure/storage/mmkvClient");
  const accountData = await import("../src/storage/repositories/accountDataRepository");
  const guest = await import("../src/storage/repositories/guestInstallationRepository");
  const { productionLearningDataAdmissionContext, productionTrackAdmissionContext } = await import("../src/application/tracks/trackAdmissionContext");
  const { saveTrainingSession } = await import("../src/storage/repositories/trainingSessionRepository");
  const { addTrainingAttempt } = await import("../src/storage/repositories/trainingAttemptRepository");
  const { addReviewQueueItems } = await import("../src/storage/repositories/reviewQueueRepository");
  const { saveTrainingSessionResult } = await import("../src/storage/repositories/trainingSessionResultRepository");
  const { saveActiveTrackId } = await import("../src/storage/repositories/activeTrackRepository");
  const { installLearningStateResetBarrier } = await import("../src/application/learningMutations/index");
  const { createTrainingSession, createTrainingAttempt, createTrainingSessionResult, createFamilyEnvelope } = await import("../src/domain/index");
  const { loadCanonicalRuntimeCatalog } = await import("../src/content/canonical/runtimeCatalog");
  const { readCanonicalNamespaceEntries } = await import("../src/storage/repositories/canonicalRecordCodec");
  installLearningStateResetBarrier(async (reset: () => Promise<void>) => reset());

  const TRACK_ID = "coding-interview-dsa-problem-solving";
  const MODE_ID = "coding-interview-guided-practice";
  const track = (await loadCanonicalRuntimeCatalog()).getTrack(TRACK_ID);
  const identity = track.trainingIdentity ?? { contentVersion: track.contentVersion, artifactSha256: track.artifactSha256 };
  let pool: readonly any[];
  try { pool = track.getPool(MODE_ID); } catch { pool = []; }
  if (!pool?.length) pool = track.questions;
  const questions = pool.filter((q: any) => q.interaction?.type === "choice_single" && q.answer?.type === "choice_single")
    .map((q: any) => ({ questionId: q.questionId, nodeId: q.nodeId, mentalUnitId: q.mentalUnitId, optionIds: q.interaction.options.map((o: any) => o.optionId), correctOptionId: q.answer.optionId }));
  const ref = (questionId: string) => ({ trackId: TRACK_ID, questionId, contentVersion: identity.contentVersion, artifactSha256: identity.artifactSha256 });
  const evidence = (q: PlanOccurrence["question"]) => ({ sourceItem: ref(q.questionId), taxonomyOrSkillRefs: [{ axisId: "node", nodeId: q.nodeId, role: "primary" }, { axisId: "mental_unit", nodeId: q.mentalUnitId, role: "primary" }] });

  const out: RealSample = { schema: "patternly:identity-parity-real-sample:v1", provenance: {}, records: [], envelopes: [] };
  const provenance: Record<string, unknown> = {
    producer: "app repositories in MemoryKeyValueStorage, as blackbox/perf/seed/generate-history.mjs --dry-run",
    plan: "blackbox/perf/seed/plan.mjs buildHistoryPlan (mulberry32, seed 0x5eed + N)",
    contentVersion: identity.contentVersion, artifactSha256: identity.artifactSha256,
    sampling: "seed 10: every record and every canonical namespace envelope; seed 100: every 10th record (snapshot order), every index/singleton envelope and every 10th per-entry envelope (key order)",
  };
  for (const seed of [10, 100]) {
    const meta = JSON.parse(readFileSync(resolve(blackbox, `${seed}/meta.json`), "utf8")) as { createdAt: string; patternly: string; backend: string };
    provenance[`seed${seed}`] = meta;
    const plan = buildHistoryPlan({ sessions: seed, questions, now: Date.parse(meta.createdAt) });
    installKeyValueStorageForTests(new MemoryKeyValueStorage());
    setActiveProfileLeaseForTests({ id: `perf-seed-${seed}`, kind: "guest", accountId: null });
    await guest.provisionGuestInstallation({ async create() { return { installationId: "66666666-6666-4666-8666-6666666600fe", localDatasetId: "77777777-7777-4777-8777-7777777700fe" }; } });
    await guest.bindGuestInstallationToAccount("dry-run-account");
    await accountData.saveAccountSyncState({ ...await accountData.getAccountSyncState(productionLearningDataAdmissionContext), accountId: "dry-run-account", status: "synced" }, productionLearningDataAdmissionContext);
    await saveActiveTrackId(TRACK_ID);
    for (const s of plan) {
      await saveTrainingSession(createTrainingSession({
        id: s.sessionId, trackId: TRACK_ID, modeId: MODE_ID, configurationSnapshot: { kind: "practice" },
        requestedLength: s.occurrences.length, actualLength: s.occurrences.length, currentItemIndex: s.occurrences.length - 1,
        itemOrder: s.occurrences.map((o) => ({ occurrenceId: o.occurrenceId, item: ref(o.question.questionId) })),
        optionOrderByOccurrence: Object.fromEntries(s.occurrences.map((o) => [o.occurrenceId, [...o.question.optionIds]])),
        activeForegroundMs: s.activeForegroundMs, contentVersion: identity.contentVersion, artifactSha256: identity.artifactSha256,
        status: "completed", startedAt: s.startedAt, completedAt: s.completedAt,
      } as never), productionTrackAdmissionContext);
      for (const o of s.occurrences) {
        await addTrainingAttempt(createTrainingAttempt({
          id: `${s.sessionId}:${o.occurrenceId}`, sessionId: s.sessionId, trackId: TRACK_ID, modeId: MODE_ID, occurrenceId: o.occurrenceId,
          item: ref(o.question.questionId), response: { type: "choice_single", optionId: o.optionId },
          result: o.correct ? { kind: "correct", earnedPoints: 1, maxPoints: 1 } : { kind: "incorrect", earnedPoints: 0, maxPoints: 1 },
          reviewEvidence: evidence(o.question), answeredAt: o.answeredAt, committedAt: o.answeredAt,
        } as never), productionTrackAdmissionContext);
      }
      const correctCount = s.occurrences.filter((o) => o.correct).length;
      await saveTrainingSessionResult(createTrainingSessionResult({
        id: `${s.sessionId}:result`, sessionId: s.sessionId, trackId: TRACK_ID, totalOccurrences: s.occurrences.length,
        answeredOccurrenceIds: s.occurrences.map((o) => o.occurrenceId), unansweredOccurrenceIds: [], completedAt: s.completedAt,
        evidence: createFamilyEnvelope({ familyId: "coding_interview", details: { activeForegroundMs: s.activeForegroundMs, correctCount, partialCount: 0, incorrectCount: s.occurrences.length - correctCount, pointsEarned: correctCount, maxPoints: s.occurrences.length } } as never),
      } as never), productionTrackAdmissionContext);
    }
    const reviews = reviewTargets(plan).map(({ session, occurrence }) => ({
      id: `perf-seed-review-${occurrence.question.questionId}`, trackId: TRACK_ID,
      sourceAttemptId: `${session.sessionId}:${occurrence.occurrenceId}`, sourceSessionId: session.sessionId,
      sourceItem: ref(occurrence.question.questionId), taxonomyOrSkillRefs: evidence(occurrence.question).taxonomyOrSkillRefs,
      reasons: ["incorrect"], dueAt: session.completedAt, createdAt: session.completedAt, consecutiveAfterDueSuccesses: 0, persistent: true,
    }));
    if (reviews.length) await addReviewQueueItems(reviews as never, productionTrackAdmissionContext);
    const snapshot = await accountData.buildAccountDataSnapshot(productionLearningDataAdmissionContext);
    snapshot.records.forEach((record: any, index: number) => {
      if (seed === 10 || index % 10 === 0) out.records.push({ seed, record: { recordId: record.recordId, recordType: record.recordType, trackId: record.trackId, state: record.state, fingerprint: record.fingerprint } });
    });
    readCanonicalNamespaceEntries().forEach(({ key, rawValue }, index) => {
      // Per-entry keys end in an id segment after the record family (e.g. training-attempt:<id>).
      const perEntry = key.split(":").length > 4;
      if (seed === 10 || !perEntry || index % 10 === 0) out.envelopes.push({ seed, key, raw: rawValue });
    });
  }
  out.provenance = provenance;
  writeFileSync(REAL_SAMPLE_PATH, `${JSON.stringify(out, null, 1)}\n`);
  console.log(JSON.stringify({ realSample: REAL_SAMPLE_PATH, records: out.records.length, envelopes: out.envelopes.length }));
}

// ---------------------------------------------------------------------------

export function buildVectorsFile(): string {
  const b = new Builder();
  buildSynthetic(b);
  const synthetic = b.vectors.length;
  buildTestFixtures(b);
  const fixtures = b.vectors.length - synthetic;
  const real = buildRealSample(b);
  const byProfile: Record<string, number> = {};
  const byClass: Record<string, number> = {};
  for (const v of b.vectors) { byProfile[v.profile] = (byProfile[v.profile] ?? 0) + 1; byClass[v.class] = (byClass[v.class] ?? 0) + 1; }
  const file = {
    schema: "patternly:identity-parity-vectors:v1",
    contract: "integration/contracts/identity-parity/README.md",
    generator: "scripts/generateIdentityParityVectors.ts",
    oracle: {
      canonicalSerialize: "src/domain/identity/canonicalSerialization.ts canonicalSerialize",
      canonicalFingerprintPayload: "src/domain/identity/canonicalSerialization.ts canonicalFingerprintPayload (canonical-json-utf8-v1)",
      recordFingerprintPayload: "src/domain/identity/recordFingerprint.ts recordFingerprintPayload; fingerprint = domain sha256Utf8(payload)",
      canonicalJsonV1: "src/domain/identity/canonicalSerialization.ts canonicalJsonV1",
      sha256Utf8: "src/domain/identity/sha256.ts sha256Utf8",
      envelope: "src/storage/repositories/canonicalRecordCodec.ts parseCanonicalRecordEnvelope (patternly:canonical:v1)",
    },
    oracleRuntime: { node: process.versions.node, v8: process.versions.v8, unicode: process.versions.unicode, icu: process.versions.icu },
    counts: { total: b.vectors.length, synthetic, testFixtures: fixtures, real, nativeApplicable: b.vectors.filter((v) => v.nativeApplicable).length, byProfile, byClass },
    vectors: b.vectors,
  };
  // JSON.stringify escapes unpaired surrogates (\udXXX), so the file is valid UTF-8.
  return `${JSON.stringify(file, null, 1)}\n`;
}

async function main(): Promise<void> {
  if (process.argv.includes("--extract-real-sample")) { await extractRealSample(); return; }
  const text = buildVectorsFile();
  if (process.argv.includes("--check")) {
    const current = existsSync(VECTORS_PATH) ? readFileSync(VECTORS_PATH, "utf8") : "";
    if (current !== text) { console.error("identity parity vectors are stale: run node --import tsx scripts/generateIdentityParityVectors.ts"); process.exit(1); }
    console.log("identity parity vectors up to date");
    return;
  }
  writeFileSync(VECTORS_PATH, text);
  const counts = (JSON.parse(text) as { counts: unknown }).counts;
  console.log(JSON.stringify(counts));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error); process.exit(1); });
}
