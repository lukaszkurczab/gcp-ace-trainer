import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { canonicalFingerprintPayload, canonicalJsonV1, canonicalJsonV1ByteLength, canonicalSerialize } from "./canonicalSerialization";
import { parseJsonExact } from "./exactJson";
import { recordFingerprintPayload, accountDataRecordFingerprint, type RecordFingerprintInput } from "./recordFingerprint";
import { sha256Utf8 } from "./sha256";
import { sha256Utf8 as infrastructureSha256Utf8 } from "../../infrastructure/identity/sha256";
import { parseCanonicalRecordEnvelope } from "../../storage/repositories/canonicalRecordCodec";

/**
 * Regression test of the TS oracle against the B0 parity contract
 * (integration/contracts/identity-parity). A failure here means the TS
 * identity code changed bytes that are stored on devices and in the backend.
 */
type Vector = {
  id: string; profile: string; class: string; source: string; nativeApplicable: boolean;
  input: { json?: string; js?: string; string?: string; repeat?: { unit: string; count: number }; raw?: string };
  expect: { ok: true; output?: string; sha256?: string; utf8ByteLength?: number; utf8Hex?: string; payload?: string; fingerprint?: string; envelope?: { schemaIdentity: string; revision: number; rawSha256: string; payloadJson: string; payloadSha256: string } }
    | { ok: false; error: { name: string; message: string; code: string } };
};
const file = JSON.parse(readFileSync(new URL("../../../integration/contracts/identity-parity/vectors.v1.json", import.meta.url), "utf8")) as {
  schema: string; counts: { total: number; synthetic: number; real: number; byProfile: Record<string, number> }; vectors: Vector[];
};

const PROSE_CODES: Record<string, string> = {
  "Canonical values cannot contain non-finite numbers.": "canonical_serialize_non_finite_number",
  "Canonical values cannot contain unsupported values.": "canonical_serialize_unsupported_value",
};
const STORAGE_CODES: Record<string, string> = { CorruptStoredRecordError: "envelope_corrupt", UnsupportedStoredRecordError: "envelope_unsupported" };
const BASE_RECORD = { recordId: "parity-record", recordType: "training_session_result", trackId: "coding-interview-dsa-problem-solving" } as const;

/** Must stay in sync with buildJsOnlyValue in scripts/generateIdentityParityVectors.ts (unknown tags fail). */
function jsOnly(tag: string): unknown {
  const sparse = new Array(2); sparse[1] = "value";
  const cycle: Record<string, unknown> = {}; cycle.self = cycle;
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
    case "array-extra-property": return Object.assign(["a"], { extra: 1 });
    case "array-symbol-property": return Object.assign(["a"], { [Symbol("s")]: 1 });
    case "object-symbol-key": return { a: 1, [Symbol("k")]: 2 };
    case "nested-undefined-in-array": return [1, undefined, 3];
    case "nested-undefined-in-object": return { a: undefined };
    case "shared-reference-not-cycle": return { left: shared, right: shared };
    case "boxed-string": return new String("x");
    default: throw new Error(`unknown js-only tag ${tag}`);
  }
}

function value(vector: Vector): unknown {
  if (vector.input.json !== undefined) return parseJsonExact(vector.input.json);
  if (vector.input.js !== undefined) return jsOnly(vector.input.js);
  throw new Error(`${vector.id}: no value input`);
}

function shaInput(vector: Vector): string {
  return vector.input.string ?? vector.input.repeat!.unit.repeat(vector.input.repeat!.count);
}

function run(vector: Vector): Record<string, unknown> {
  switch (vector.profile) {
    case "canonicalSerialize": { const output = canonicalSerialize(value(vector)); return { output, sha256: sha256Utf8(output) }; }
    case "canonicalFingerprintPayload": { const output = canonicalFingerprintPayload(value(vector)); return { output, sha256: sha256Utf8(output) }; }
    case "canonicalJsonV1": { const v = value(vector); const output = canonicalJsonV1(v); return { output, utf8ByteLength: canonicalJsonV1ByteLength(v) }; }
    case "recordFingerprintPayload": {
      const record = vector.input.json !== undefined ? parseJsonExact(vector.input.json) as RecordFingerprintInput : { ...BASE_RECORD, state: { nested: jsOnly(vector.input.js!) } };
      const payload = recordFingerprintPayload(record);
      return { payload, fingerprint: accountDataRecordFingerprint(record) };
    }
    case "sha256Utf8": {
      const s = shaInput(vector);
      const digest = sha256Utf8(s);
      assert.equal(infrastructureSha256Utf8(s), digest, `${vector.id}: infrastructure SHA`);
      return { sha256: digest };
    }
    case "envelope": {
      const raw = vector.input.raw!;
      const envelope = parseCanonicalRecordEnvelope(raw, "parity:key")!;
      const payloadJson = JSON.stringify(envelope.payload);
      return { envelope: { schemaIdentity: envelope.schemaIdentity, revision: envelope.revision, rawSha256: sha256Utf8(raw), payloadJson, payloadSha256: sha256Utf8(payloadJson) } };
    }
    default: throw new Error(`${vector.id}: unknown profile ${vector.profile}`);
  }
}

test("identity parity file covers every profile with enough synthetic and real vectors", () => {
  assert.equal(file.schema, "patternly:identity-parity-vectors:v1");
  assert.equal(file.vectors.length, file.counts.total);
  assert.ok(file.counts.synthetic >= 500, "at least 500 synthetic vectors");
  assert.ok(file.counts.real > 0, "real sample present");
  const profiles = new Set(file.vectors.map((v) => v.profile));
  assert.deepEqual([...profiles].sort(), ["canonicalFingerprintPayload", "canonicalJsonV1", "canonicalSerialize", "envelope", "recordFingerprintPayload", "sha256Utf8"]);
  assert.equal(new Set(file.vectors.map((v) => v.id)).size, file.vectors.length, "unique ids");
  for (const v of file.vectors) assert.equal(v.nativeApplicable, v.input.js === undefined, `${v.id}: nativeApplicable`);
});

test("TS oracle reproduces every identity parity vector byte for byte", () => {
  let checked = 0;
  for (const vector of file.vectors) {
    let actual: Record<string, unknown> | undefined;
    let thrown: unknown;
    try { actual = run(vector); } catch (error) { thrown = error; }
    if (vector.expect.ok) {
      assert.equal(thrown, undefined, `${vector.id}: unexpected ${String(thrown)}`);
      for (const [key, expected] of Object.entries(vector.expect)) {
        if (key === "ok" || key === "utf8Hex" || (key === "utf8ByteLength" && vector.profile === "sha256Utf8")) continue;
        assert.deepEqual(actual![key], expected, `${vector.id}: ${key}`);
      }
    } else {
      assert.ok(thrown instanceof Error, `${vector.id}: expected ${vector.expect.error.code}`);
      assert.equal(thrown.name, vector.expect.error.name, `${vector.id}: error name`);
      const storageCode = STORAGE_CODES[thrown.name];
      if (storageCode) {
        assert.equal(vector.expect.error.message, thrown.name, vector.id);
        assert.equal(storageCode, vector.expect.error.code, `${vector.id}: error code`);
      } else {
        assert.equal(thrown.message, vector.expect.error.message, `${vector.id}: error message`);
        assert.equal(PROSE_CODES[thrown.message] ?? thrown.message, vector.expect.error.code, `${vector.id}: error code`);
      }
    }
    checked += 1;
  }
  assert.equal(checked, file.counts.total);
});

test("SHA vectors pin the exact UTF-8 bytes, including unpaired surrogates", () => {
  for (const vector of file.vectors.filter((v) => v.profile === "sha256Utf8")) {
    if (!vector.expect.ok || vector.expect.utf8Hex === undefined) continue;
    const bytes = Buffer.from(vector.expect.utf8Hex, "hex");
    assert.equal(bytes.length, vector.expect.utf8ByteLength, vector.id);
    // Independent digest of the pinned bytes guards the hex column itself.
    assert.equal(createHash("sha256").update(bytes).digest("hex"), vector.expect.sha256, vector.id);
    const s = shaInput(vector);
    if (s.isWellFormed()) assert.equal(bytes.toString("utf8"), s, `${vector.id}: well-formed text round-trips`);
  }
});
