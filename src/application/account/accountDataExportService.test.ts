import assert from "node:assert/strict";
import test from "node:test";

import {
  ACCOUNT_DATA_EXPORT_FILE_PREFIX,
  cleanupOrphanedAccountDataExports,
  isValidAccountDataExport,
  shareAccountDataExport,
  type AccountDataExportFileDependencies,
} from "./accountDataExportService";

const validExport = {
  schemaVersion: "account-data-export-v1",
  exportId: "export_12345678",
  exportedAt: "2026-09-06T12:00:00.000Z",
  scope: { portable: "user_data_and_activity", accountContext: "user_visible_account_context" },
  portable: { profile: { createdAt: "2026-01-01T00:00:00.000Z", identity: { provider: "firebase", email: null, emailVerified: true } }, progress: [], linkedContentReports: [] },
  accountContext: { trackAccess: [], entitlements: [], devices: [], syncMetadata: {}, exportHistory: [] },
  manifest: { included: [], omitted: [] },
} as const;

function harness(input: Readonly<{ shareFails?: boolean; available?: boolean }> = {}) {
  const events: string[] = [];
  let exists = false;
  const file = {
    name: `${ACCOUNT_DATA_EXPORT_FILE_PREFIX}${validExport.exportId}.json`,
    uri: `file:///cache/${ACCOUNT_DATA_EXPORT_FILE_PREFIX}${validExport.exportId}.json`,
    delete: () => { events.push("delete"); exists = false; },
    exists: () => exists,
    write: (contents: string) => { events.push(`write:${contents.includes(validExport.exportId)}`); exists = true; },
  };
  const dependencies: AccountDataExportFileDependencies = {
    createCacheFile: (name) => { events.push(`create:${name}`); return file; },
    listCacheFiles: () => [file],
    isSharingAvailable: async () => input.available ?? true,
    share: async () => { events.push("share"); if (input.shareFails) throw new Error("cancelled"); },
  };
  return { dependencies, events, file };
}

test("validates the account export envelope before any file is created", async () => {
  assert.equal(isValidAccountDataExport(validExport), true);
  const { dependencies, events } = harness();
  const result = await shareAccountDataExport({ ...validExport, exportId: "../email@example.com" }, dependencies);
  assert.deepEqual(result, { kind: "failure", failure: "invalidResponse" });
  assert.deepEqual(events, []);
});

test("rejects partial profiles and malformed section entries", () => {
  assert.equal(isValidAccountDataExport({ ...validExport, portable: { ...validExport.portable, profile: {} } }), false);
  assert.equal(isValidAccountDataExport({ ...validExport, accountContext: { ...validExport.accountContext, devices: [null] } }), false);
  assert.equal(isValidAccountDataExport({ ...validExport, manifest: { included: [3], omitted: [] } }), false);
});

test("writes to the cache-prefixed filename and deletes after sharing", async () => {
  const { dependencies, events } = harness();
  assert.deepEqual(await shareAccountDataExport(validExport, dependencies), { kind: "shared" });
  assert.deepEqual(events, [
    `create:${ACCOUNT_DATA_EXPORT_FILE_PREFIX}${validExport.exportId}.json`,
    "write:true",
    "share",
    "delete",
  ]);
});

test("deletes the temporary file when the share sheet rejects", async () => {
  const { dependencies, events } = harness({ shareFails: true });
  assert.deepEqual(await shareAccountDataExport(validExport, dependencies), { kind: "failure", failure: "sharingFailed" });
  assert.equal(events.at(-1), "delete");
});

test("does not create a file when system sharing is unavailable", async () => {
  const { dependencies, events } = harness({ available: false });
  assert.deepEqual(await shareAccountDataExport(validExport, dependencies), { kind: "failure", failure: "sharingUnavailable" });
  assert.deepEqual(events, []);
});

test("classifies cache file construction failures without rejecting", async () => {
  const { dependencies } = harness();
  const broken = { ...dependencies, createCacheFile: () => { throw new Error("cache unavailable"); } };
  assert.deepEqual(await shareAccountDataExport(validExport, broken), { kind: "failure", failure: "fileFailure" });
});

test("a changed account session is rejected before sharing and the file is deleted", async () => {
  const { dependencies, events } = harness();
  let checks = 0;
  const result = await shareAccountDataExport(validExport, dependencies, () => ++checks === 1);
  assert.deepEqual(result, { kind: "failure", failure: "sessionChanged" });
  assert.deepEqual(events.slice(-2), ["write:true", "delete"]);
  assert.equal(events.includes("share"), false);
});

test("reports a failed final cleanup and leaves bootstrap responsible for retry", async () => {
  const { dependencies } = harness();
  const broken = {
    ...dependencies,
    createCacheFile: (name: string) => {
      const file = dependencies.createCacheFile(name);
      return { ...file, delete: () => { throw new Error("busy"); } };
    },
  };
  assert.deepEqual(await shareAccountDataExport(validExport, broken), { kind: "failure", failure: "cleanupFailed" });
});

test("bootstrap cleanup only deletes files carrying the owned prefix", () => {
  const deleted: string[] = [];
  const entry = (name: string) => ({ name, uri: `file:///cache/${name}`, exists: () => true, write: () => undefined, delete: () => { deleted.push(name); } });
  cleanupOrphanedAccountDataExports({ listCacheFiles: () => [entry(`${ACCOUNT_DATA_EXPORT_FILE_PREFIX}one.json`), entry("unrelated.json")] });
  assert.deepEqual(deleted, [`${ACCOUNT_DATA_EXPORT_FILE_PREFIX}one.json`]);
});
