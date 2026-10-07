import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyQ13ResumeOutcome,
  createQ13Receipt,
  isQ13Nonce,
  Q13_EXACT_RESOLVER_MISS,
  Q13_OOD_TRACK_ID,
  Q13_OOD_V23,
  Q13_OOD_V24,
  readQ13OodIdentity,
  observeQ13Resume,
} from "./attestation-policy";

const nonce = "a".repeat(64);
const oldPin = Object.freeze({ trackId: Q13_OOD_TRACK_ID, ...Q13_OOD_V23 });
const v23Failure = Object.assign(new Error("Canonical training operation failed."), {
  code: "resume_unavailable",
  cause: new Error(Q13_EXACT_RESOLVER_MISS),
});
const preservation = Object.freeze({ schema: "bizq01-q13-preservation-v1" }) as never;

test("nonce and receipt are constrained to the allowlisted public identity and stages", () => {
  assert.equal(isQ13Nonce(nonce), true);
  assert.equal(isQ13Nonce("A".repeat(64)), false);
  assert.equal(isQ13Nonce("204e4e6b-0915-45b3-b5a2-947d4a0043f1"), false);
  assert.deepEqual(createQ13Receipt(nonce, Q13_OOD_V24, "identity_mismatch", preservation), {
    schemaVersion: "bizq01-q13-runtime-receipt-v2",
    nonce,
    contentVersion: Q13_OOD_V24.contentVersion,
    artifactSha256: Q13_OOD_V24.artifactSha256,
    stage: "identity_mismatch",
    preservation,
  });
  assert.deepEqual(Object.keys(createQ13Receipt(nonce, Q13_OOD_V24, "js_bundle_entry")!).sort(), [
    "artifactSha256", "contentVersion", "nonce", "schemaVersion", "stage",
  ]);
  assert.equal(createQ13Receipt(nonce, Q13_OOD_V24, "identity_mismatch"), null);
  assert.equal(createQ13Receipt(nonce, Q13_OOD_V24, "secret_dump" as never), null);
  assert.equal(createQ13Receipt("bad", Q13_OOD_V24, "js_bundle_entry"), null);
});

test("generated OOD lock identity is the only identity exposed to the receipt", () => {
  const identity = readQ13OodIdentity({
    schemaVersion: "patternly-content-lock-v1",
    tracks: [
      { trackId: "other", contentVersion: "other-version", sha256: "b".repeat(64) },
      { trackId: Q13_OOD_TRACK_ID, contentVersion: Q13_OOD_V24.contentVersion, sha256: Q13_OOD_V24.artifactSha256 },
    ],
  });
  assert.deepEqual(identity, Q13_OOD_V24);
  assert.equal(readQ13OodIdentity({ tracks: [{ trackId: Q13_OOD_TRACK_ID, contentVersion: "", sha256: "bad" }] }), null);
});

test("only the exact old OOD pin and exact resolver miss classify as mismatch", () => {
  const failureClass = (error: unknown) => error instanceof Error
    && (error as Error & { code?: string; cause?: unknown }).code === "resume_unavailable"
    && (error as Error & { cause?: unknown }).cause instanceof Error
    && ((error as Error & { cause: Error }).cause).message === Q13_EXACT_RESOLVER_MISS;
  assert.equal(classifyQ13ResumeOutcome(oldPin, Q13_OOD_V24, { kind: "failure", error: v23Failure }, failureClass), "identity_mismatch");
  assert.equal(classifyQ13ResumeOutcome(oldPin, Q13_OOD_V23, { kind: "success" }, failureClass), "exact_resume_success");
  assert.equal(classifyQ13ResumeOutcome(oldPin, Q13_OOD_V24, { kind: "success" }, failureClass), null);
  assert.equal(classifyQ13ResumeOutcome({ ...oldPin, artifactSha256: "c".repeat(64) }, Q13_OOD_V24, { kind: "failure", error: v23Failure }, failureClass), null);
  assert.equal(classifyQ13ResumeOutcome(oldPin, { ...Q13_OOD_V24, artifactSha256: "c".repeat(64) }, { kind: "failure", error: v23Failure }, failureClass), null);
  assert.equal(classifyQ13ResumeOutcome(oldPin, Q13_OOD_V24, { kind: "failure", error: new Error(Q13_EXACT_RESOLVER_MISS) }, failureClass), null);
  assert.equal(classifyQ13ResumeOutcome(oldPin, Q13_OOD_V24, { kind: "failure", error: Object.assign(new Error("other"), { code: "resume_unavailable", cause: new Error("other") }) }, failureClass), null);
});

test("resume observation preserves the original value or error even when receipt writing fails", async () => {
  const returned = Object.freeze({ same: "object" });
  const success = await observeQ13Resume({
    operation: async () => returned,
    onSuccess: () => { throw new Error("cache unavailable"); },
    onFailure: () => assert.fail("success must not invoke failure observer"),
  });
  assert.equal(success, returned);

  const thrown = new Error("original resolver error");
  await assert.rejects(
    observeQ13Resume({
      operation: async () => { throw thrown; },
      onSuccess: () => assert.fail("failure must not invoke success observer"),
      onFailure: () => { throw new Error("cache unavailable"); },
    }),
    (error) => error === thrown,
  );
});
