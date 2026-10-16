import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { RECORD_FINGERPRINT_PROFILE, recordFingerprintPayload, accountDataRecordFingerprint as domainFingerprint, type RecordFingerprintInput } from "./recordFingerprint";
import { accountDataRecordFingerprint as applicationFingerprint } from "../../application/account/accountDataService";
import { SYNCABLE_RECORD_TYPES as domainRecordTypes } from "../account/accountDataRecordIdentity";
import { SYNCABLE_RECORD_TYPES as repositoryRecordTypes } from "../../storage/repositories/accountDataRepository";
import { canonicalSerialize } from "./canonicalSerialization";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { accountDataRecordFingerprint, type SyncableRecordType } from "../../storage/repositories/accountDataRepository";

const vectors = JSON.parse(readFileSync(new URL("../../../integration/contracts/record-fingerprint/vectors.json", import.meta.url), "utf8")) as {
  profile: string; cases: { name: string; record: RecordFingerprintInput & { recordType: SyncableRecordType }; payload: string; sha256: string }[];
};

test("shared record vectors preserve historical APP bytes and hashes", () => {
  assert.equal(vectors.profile, RECORD_FINGERPRINT_PROFILE);
  assert.equal(accountDataRecordFingerprint, domainFingerprint);
  assert.equal(applicationFingerprint, domainFingerprint);
  assert.equal(repositoryRecordTypes, domainRecordTypes);
  for (const vector of vectors.cases) {
    assert.equal(recordFingerprintPayload(vector.record), vector.payload, vector.name);
    assert.equal(canonicalSerialize(vector.record), vector.payload, `historical ${vector.name}`);
    assert.equal(sha256Utf8(vector.payload), vector.sha256, vector.name);
    assert.equal(accountDataRecordFingerprint(vector.record), vector.sha256, vector.name);
  }
  assert.notEqual(vectors.cases[1]!.sha256, vectors.cases[2]!.sha256);
});

test("record profile rejects ambiguous keys and non-JSON values without normalizing text", () => {
  const base = vectors.cases[0]!.record;
  const sparse = new Array(2); sparse[1] = "value";
  const cycle: Record<string, unknown> = {}; cycle.self = cycle;
  for (const value of [undefined, NaN, Infinity, 1n, Symbol("x"), () => 1, new Date(), sparse, cycle, { "é": 1, "e\u0301": 2 }]) {
    assert.throws(() => recordFingerprintPayload({ ...base, state: { nested: value } }), TypeError);
    assert.throws(() => domainFingerprint({ ...base, state: { nested: value } }), TypeError);
  }
  assert.equal(recordFingerprintPayload({ ...base, state: { zero: -0 } }), recordFingerprintPayload({ ...base, state: { zero: 0 } }));
});
