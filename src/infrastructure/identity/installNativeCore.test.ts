import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import { canonicalFingerprintPayload, canonicalJsonV1, canonicalSerialize, isCanonicalSerializationAccelerated, referenceCanonicalJsonV1, referenceCanonicalSerialize, CANONICAL_SERIALIZER_VERSION } from "../../domain/identity/canonicalSerialization";
import { accountDataRecordFingerprint, isRecordFingerprintAccelerated, recordFingerprintPayload, referenceRecordFingerprintPayload, type RecordFingerprintInput } from "../../domain/identity/recordFingerprint";
import { isSha256Utf8Accelerated, referenceSha256Utf8, sha256Utf8 } from "../../domain/identity/sha256";
import { sha256Utf8 as infrastructureSha256Utf8 } from "./sha256";
import { createRandom, generateFuzzCase } from "../diagnostics/nativeCoreFuzz";
import { guardedJson, installNativeCore, resetNativeCoreForTests, type NativeCore } from "./installNativeCore";

// The real core is C++ (scripts/qa/nativeCoreParity.test.ts covers its bytes).
// Here a JS stand-in with exact reference semantics checks the wiring: probes,
// guard fallbacks, kill-switch, NFC gate and auto-disable.

afterEach(() => { resetNativeCoreForTests(); });

type Calls = { sha: number; serialize: number; nfcDisabled: boolean };

function fakeCore(calls: Calls, overrides: Partial<NativeCore> = {}): NativeCore {
  const serialize = (profile: number, json: string): string | undefined => {
    calls.serialize++;
    const value = JSON.parse(json) as unknown;
    try {
      if (profile === 0) return referenceCanonicalSerialize(value);
      if (profile === 1) return referenceCanonicalSerialize({ serializerVersion: CANONICAL_SERIALIZER_VERSION, value });
      if (profile === 2) return referenceRecordFingerprintPayload(value as RecordFingerprintInput);
      if (calls.nfcDisabled && json !== json.normalize("NFC")) return undefined;
      return referenceCanonicalJsonV1(value);
    } catch { return undefined; }
  };
  return {
    sha256: (value) => { calls.sha++; return referenceSha256Utf8(value); },
    serialize,
    fingerprint: (profile, json) => { const payload = serialize(profile, json); return payload === undefined ? undefined : referenceSha256Utf8(payload); },
    validateEnvelope: () => "ok",
    lastError: () => "",
    setNfcEnabled: (enabled) => { calls.nfcDisabled = !enabled; },
    ...overrides,
  };
}

test("a correct core accelerates every hook and every result stays byte-identical", () => {
  const calls: Calls = { sha: 0, serialize: 0, nfcDisabled: false };
  const status = installNativeCore(() => fakeCore(calls));
  assert.deepEqual({ ...status, installMs: 0 }, { installed: true, reason: "ok", sha256: true, serialization: true, recordFingerprint: true, nfc: true, installMs: 0 });
  assert.ok(isSha256Utf8Accelerated() && isCanonicalSerializationAccelerated() && isRecordFingerprintAccelerated());
  calls.sha = 0; calls.serialize = 0;
  const random = createRandom(42);
  for (let index = 0; index < 400; index++) {
    const { profile, value } = generateFuzzCase(random);
    const reference = (): string => {
      if (profile === "canonicalSerialize") return referenceCanonicalSerialize(value);
      if (profile === "canonicalFingerprintPayload") return referenceCanonicalSerialize({ serializerVersion: CANONICAL_SERIALIZER_VERSION, value });
      if (profile === "recordFingerprintPayload") return referenceRecordFingerprintPayload(value as RecordFingerprintInput);
      if (profile === "canonicalJsonV1") return referenceCanonicalJsonV1(value);
      return referenceSha256Utf8(value as string);
    };
    const actual = (): string => {
      if (profile === "canonicalSerialize") return canonicalSerialize(value);
      if (profile === "canonicalFingerprintPayload") return canonicalFingerprintPayload(value);
      if (profile === "recordFingerprintPayload") return recordFingerprintPayload(value as RecordFingerprintInput);
      if (profile === "canonicalJsonV1") return canonicalJsonV1(value);
      return sha256Utf8(value as string);
    };
    let expected: string | Error;
    try { expected = reference(); } catch (error) { expected = error as Error; }
    if (expected instanceof Error) assert.throws(actual, { message: expected.message });
    else assert.equal(actual(), expected);
  }
  assert.ok(calls.sha > 0 && calls.serialize > 0);
  const record = { recordId: "r", recordType: "training_attempt", trackId: "x", state: { b: 1, a: "ł" } } as const;
  assert.equal(accountDataRecordFingerprint(record), referenceSha256Utf8(referenceRecordFingerprintPayload(record)));
  calls.sha = 0;
  assert.equal(infrastructureSha256Utf8("abc\ud800"), referenceSha256Utf8("abc\ud800"));
  assert.equal(calls.sha, 1, "infrastructure SHA uses the core for every input, unpaired surrogates included");
});

test("values JSON cannot carry exactly bypass the core and keep the reference result or exception", () => {
  const calls: Calls = { sha: 0, serialize: 0, nfcDisabled: false };
  installNativeCore(() => fakeCore(calls));
  const sparse: unknown[] = new Array(2); sparse[1] = 1;
  const cycle: Record<string, unknown> = {}; cycle.self = cycle;
  const nullProto = Object.assign(Object.create(null) as object, { a: 1 });
  const withToJson = { toJSON: () => "x" };
  const unsupported: unknown[] = [{ a: undefined }, [1, undefined], { a: Number.NaN }, { a: Infinity }, sparse, { d: new Date(0) }, new Map(), nullProto, withToJson, { f: () => 1 }, { b: 1n }];
  for (const value of unsupported) {
    assert.equal(guardedJson(value, false), undefined);
    calls.serialize = 0;
    // Same result or same exception as the reference (a sparse array serializes as "[,1]" there).
    let expected: string | Error;
    try { expected = referenceCanonicalSerialize(value); } catch (error) { expected = error as Error; }
    if (expected instanceof Error) assert.throws(() => canonicalSerialize(value), { message: expected.message });
    else assert.equal(canonicalSerialize(value), expected);
    assert.equal(calls.serialize, 0);
  }
  assert.equal(guardedJson(cycle, false), undefined);
  const recordWithSymbol = { recordId: "r", recordType: "t", trackId: "x", state: { a: 1, [Symbol("s")]: 2 } };
  assert.equal(guardedJson(recordWithSymbol, true), undefined);
  assert.throws(() => recordFingerprintPayload(recordWithSymbol), { message: "record_fingerprint_unsupported_value" });
  const arrayExtra = Object.assign(["a"], { extra: 1 });
  assert.throws(() => recordFingerprintPayload({ recordId: "r", recordType: "t", trackId: "x", state: { arrayExtra } }), { message: "record_fingerprint_unsupported_value" });
  assert.equal(canonicalSerialize({ arrayExtra }), referenceCanonicalSerialize({ arrayExtra }));
});

test("an unavailable core and wrong answers keep the full TS path", () => {
  const calls: Calls = { sha: 0, serialize: 0, nfcDisabled: false };
  assert.equal(installNativeCore(() => null).reason, "unavailable");
  resetNativeCoreForTests();
  assert.equal(installNativeCore(() => { throw new Error("no native"); }).reason, "unavailable");
  resetNativeCoreForTests();
  const status = installNativeCore(() => fakeCore(calls, {
    sha256: (value) => referenceSha256Utf8(value.replace("\ud800", "�")),  // lossy UTF-8 transport
    serialize: (profile, json) => profile === 3 ? json : undefined,
  }));
  assert.deepEqual([status.sha256, status.serialization, status.reason], [false, false, "partial"]);
  assert.equal(isSha256Utf8Accelerated(), false);
});

test("native NFC that disagrees with the JS normalizer is switched off", () => {
  const calls: Calls = { sha: 0, serialize: 0, nfcDisabled: false };
  const base = fakeCore(calls);
  const status = installNativeCore(() => ({
    ...base,
    serialize: (profile, json) => profile === 3 && !calls.nfcDisabled && json.includes("ཱ") ? JSON.stringify("different") : base.serialize(profile, json),
  }));
  assert.equal(status.nfc, false);
  assert.equal(calls.nfcDisabled, true);
  assert.equal(status.serialization, true);
  assert.equal(canonicalJsonV1({ k: "ཱི̣̇" }), referenceCanonicalJsonV1({ k: "ཱི̣̇" }));
});

test("a core failing after installation is removed and the reference answers", () => {
  let broken = false;
  const calls: Calls = { sha: 0, serialize: 0, nfcDisabled: false };
  const base = fakeCore(calls);
  installNativeCore(() => ({
    ...base,
    sha256: (value) => { if (broken) throw new Error("native"); return base.sha256(value); },
    serialize: (profile, json) => { if (broken) throw new Error("native"); return base.serialize(profile, json); },
  }));
  broken = true;
  assert.equal(sha256Utf8("x"), referenceSha256Utf8("x"));
  assert.equal(isSha256Utf8Accelerated(), false);
  assert.equal(canonicalSerialize({ a: 1 }), "{\"a\":1}");
  assert.equal(isCanonicalSerializationAccelerated(), false);
});
