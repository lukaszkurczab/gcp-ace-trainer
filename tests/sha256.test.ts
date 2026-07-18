import assert from "node:assert/strict";
import test from "node:test";
import { sha256Utf8 } from "../src/infrastructure/identity/sha256";

test("platform-neutral SHA-256 matches standard UTF-8 vectors", () => {
  assert.equal(sha256Utf8("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  assert.equal(sha256Utf8("żąłć"), "bb2089cd1a6c2f327d82f433a6c199ffb023efc38a3e10ea6a3b09d7ae7c1f9c");
});
