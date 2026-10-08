import assert from "node:assert/strict";
import test from "node:test";
import { createContentReportSubmissionId } from "./contentReportSubmissionIdentity";
import { createIdentityNonce } from "./identityNonce";
import { setIdentityNonceGeneratorForTests } from "./identityNonceShared";

test("the shared identity owner returns a raw UUIDv4 and report IDs retain that format", () => {
  assert.match(createIdentityNonce(), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u);
  assert.match(createContentReportSubmissionId(), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u);
});

test("the shared identity owner fails closed when secure UUID generation fails or returns malformed data", () => {
  setIdentityNonceGeneratorForTests(() => { throw new Error("injected"); });
  try {
    assert.throws(() => createIdentityNonce(), /Identity nonce generation failed/u);
    setIdentityNonceGeneratorForTests(() => "not-a-uuid");
    assert.throws(() => createIdentityNonce(), /Identity nonce generation failed/u);
  } finally {
    setIdentityNonceGeneratorForTests(null);
  }
});
