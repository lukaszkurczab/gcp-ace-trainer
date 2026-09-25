import assert from "node:assert/strict";
import test from "node:test";

import { parseStorageRecoveryAuditCommand } from "./storageRecoveryAuditCommand";

const baseUrl = "com.lkurczab.patternly://audit/show-encrypted-storage-recovery";

test("storage recovery audit command exposes only the two presentation fixtures in development smoke", () => {
  const environment = { development: true, smoke: true };
  assert.equal(parseStorageRecoveryAuditCommand(baseUrl, environment), "base");
  assert.equal(parseStorageRecoveryAuditCommand(`${baseUrl}?presentation=base`, environment), "base");
  assert.equal(parseStorageRecoveryAuditCommand(`${baseUrl}?presentation=retry-limit`, environment), "retry-limit");
});

test("storage recovery audit command is unavailable outside development smoke", () => {
  assert.equal(parseStorageRecoveryAuditCommand(baseUrl, { development: false, smoke: true }), undefined);
  assert.equal(parseStorageRecoveryAuditCommand(baseUrl, { development: true, smoke: false }), undefined);
  assert.equal(parseStorageRecoveryAuditCommand(baseUrl, { development: false, smoke: false }), undefined);
});

test("storage recovery audit command rejects unrelated or expanded commands", () => {
  const environment = { development: true, smoke: true };
  assert.equal(parseStorageRecoveryAuditCommand(null, environment), undefined);
  assert.equal(parseStorageRecoveryAuditCommand("https://example.com/audit/show-encrypted-storage-recovery", environment), undefined);
  assert.equal(parseStorageRecoveryAuditCommand("com.lkurczab.patternly://audit/show-encrypted-storage-recovery?presentation=success", environment), undefined);
  assert.equal(parseStorageRecoveryAuditCommand("com.lkurczab.patternly://audit/show-encrypted-storage-recovery?presentation=base&mutate=true", environment), undefined);
});
