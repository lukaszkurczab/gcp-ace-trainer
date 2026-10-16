import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { sha256Utf8 } from "./sha256";
import { sha256Utf8 as infrastructureSha256Utf8 } from "../../infrastructure/identity/sha256";

test("domain SHA and active infrastructure imports share one unchanged UTF-8 implementation", () => {
  assert.equal(infrastructureSha256Utf8, sha256Utf8);
  for (const value of ["", "abc", "żąłć", "🧠", "e\u0301", "é", "Patternly".repeat(128)]) {
    assert.equal(sha256Utf8(value), createHash("sha256").update(value, "utf8").digest("hex"));
  }
});
