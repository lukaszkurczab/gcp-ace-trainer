import assert from "node:assert/strict";
import test from "node:test";

import { createContentReportTransport, readContentReportTransport, registerContentReportRuntimeTransport, retryContentReport, submitContentReport } from "../../application/contentReports";
import { bootstrapApplication } from "../../application/bootstrap";
import { configurePatternlyAppCheckTokenProvider } from "../../infrastructure/clients/patternlyAppCheckToken";
import { installKeyValueStorageForTests, MemoryKeyValueStorage } from "../../infrastructure/storage/mmkvClient";
import { getContentReportOutbox, purgeExpiredContentReportOutboxEntries, updateContentReportOutboxStatus, upsertContentReportOutboxEntry } from "./contentReportOutboxRepository";
import { STORAGE_KEYS } from "../keys";
import { TEST_CONTENT_PACKAGE_PIN } from "../../testing/contentPackagePinFixture";

const baseInput = {
  trackId: "coding-interview-dsa-problem-solving" as const,
  contentVersion: "2026.08.25",
  itemId: "two-sum-001",
  reason: "unclear_explanation" as const,
  description: "The explanation does not identify why the invariant is safe.",
  context: {
    releasePackageId: TEST_CONTENT_PACKAGE_PIN.contentReleaseId,
    trackNode: "complexity_and_constraints",
    modeRoute: "practice_feedback_details" as const,
    locale: "en" as const,
    appBuild: "0.1.0",
    platform: "ios" as const,
    occurredAt: "2026-08-25T10:00:00.000Z",
  },
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((next) => { resolve = next; });
  return { promise, resolve };
}

test.beforeEach(() => {
  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  configurePatternlyAppCheckTokenProvider(null);
});

test("report form submission persists a queued local outbox entry when backend is unavailable", async () => {
  const result = await submitContentReport(baseInput);
  assert.equal(result.status, "queued");
  assert.equal(result.entry.input.clientSubmissionId.length, 36);
  assert.equal("response" in result.entry.input, false);
  assert.deepEqual(getContentReportOutbox(), [result.entry]);
});

test("report outbox normalizes an omitted note and rejects obvious private data before persistence", async () => {
  const empty = await submitContentReport({ ...baseInput, description: "   " });
  assert.equal(empty.entry.input.description, "No additional details provided.");
  assert.equal(getContentReportOutbox().length, 1);

  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  await assert.rejects(
    submitContentReport({ ...baseInput, description: "Contact me at learner@example.com" }),
    /content_report_description_private_data/,
  );
  assert.deepEqual(getContentReportOutbox(), []);
});

test("report outbox requires App Check, then accepts with the same idempotency key", async () => {
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  const transport = { create: async () => ({ duplicate: false }) };
  const failed = await submitContentReport({ ...baseInput, clientSubmissionId: "7f61e3f3-f23e-467c-b92a-9b8fd0514f25" }, transport);
  assert.equal(failed.status, "failed");
  assert.equal(failed.entry.lastErrorCode, "app_check_unavailable");
  configurePatternlyAppCheckTokenProvider(async () => "verified-app-check-token");
  let calls = 0;
  const accepting = { create: async (input: { clientSubmissionId: string }) => { calls += 1; assert.equal(input.clientSubmissionId, "7f61e3f3-f23e-467c-b92a-9b8fd0514f25"); return { duplicate: calls > 1 }; } };
  const accepted = await retryContentReport(failed.entry.input.clientSubmissionId, accepting);
  assert.equal(accepted.status, "accepted");
  assert.equal(calls, 1);
  assert.equal(accepted.entry.input.clientSubmissionId, failed.entry.input.clientSubmissionId);
  assert.deepEqual(getContentReportOutbox(), []);
  assert.equal(storage.contains(STORAGE_KEYS.CONTENT_REPORT_OUTBOX), false);
});

test("failed transport is retryable without creating a new report identity", async () => {
  configurePatternlyAppCheckTokenProvider(async () => "verified-app-check-token");
  let calls = 0;
  const transport = { create: async (input: { clientSubmissionId: string }) => { calls += 1; assert.equal(input.clientSubmissionId, "8f61e3f3-f23e-467c-b92a-9b8fd0514f25"); if (calls === 1) throw new Error("transport_failed"); return { duplicate: false }; } };
  const first = await submitContentReport({ ...baseInput, clientSubmissionId: "8f61e3f3-f23e-467c-b92a-9b8fd0514f25" }, transport);
  const second = await retryContentReport(first.entry.input.clientSubmissionId, transport);
  assert.equal(first.status, "failed");
  assert.equal(second.status, "accepted");
  assert.equal(second.entry.attemptCount, 2);
  assert.equal(calls, 2);
  assert.deepEqual(getContentReportOutbox(), []);
});

test("a lost response keeps the original report identity and accepts duplicate confirmation", async () => {
  configurePatternlyAppCheckTokenProvider(async () => "verified-app-check-token");
  const id = "9f61e3f3-f23e-467c-b92a-9b8fd0514f25";
  let calls = 0;
  const transport = { create: async (input: { clientSubmissionId: string }) => {
    calls += 1;
    assert.equal(input.clientSubmissionId, id);
    if (calls === 1) throw new Error("response_lost_after_accept");
    return { duplicate: true };
  } };
  const first = await submitContentReport({ ...baseInput, clientSubmissionId: id }, transport);
  const retried = await retryContentReport(id, transport);
  assert.equal(first.status, "failed");
  assert.equal(retried.status, "accepted");
  assert.equal(calls, 2);
  assert.deepEqual(getContentReportOutbox(), []);
});

test("cleanup failure never claims accepted and preserves the retrying record", async () => {
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  configurePatternlyAppCheckTokenProvider(async () => "verified-app-check-token");
  storage.setFailurePlan({ kind: "fail_on_key_remove", key: STORAGE_KEYS.CONTENT_REPORT_OUTBOX });
  const result = await submitContentReport({ ...baseInput, clientSubmissionId: "af61e3f3-f23e-467c-b92a-9b8fd0514f25" }, { create: async () => ({ duplicate: false }) });
  assert.equal(result.status, "retrying");
  assert.equal(result.reason, "local_cleanup_failed");
  assert.equal(getContentReportOutbox()[0]?.input.clientSubmissionId, result.entry.input.clientSubmissionId);
  assert.equal(getContentReportOutbox()[0]?.status, "retrying");
});

test("canonical bootstrap purges legacy accepted entries but preserves uncertain reports", async () => {
  const queued = await submitContentReport({ ...baseInput, clientSubmissionId: "bf61e3f3-f23e-467c-b92a-9b8fd0514f25" });
  const failed = { ...queued.entry, input: { ...queued.entry.input, clientSubmissionId: "cf61e3f3-f23e-467c-b92a-9b8fd0514f25" }, status: "failed" as const, lastErrorCode: "transport_failed" };
  upsertContentReportOutboxEntry({ ...queued.entry, status: "accepted" });
  upsertContentReportOutboxEntry(failed);
  const result = await bootstrapApplication(async () => undefined, async () => undefined, undefined, {
    repositories: { guestInstallationIdentity: { async create() { return { installationId: "11111111-1111-4111-8111-111111111111", localDatasetId: "22222222-2222-4222-8222-222222222222" }; } } },
  });
  assert.equal(result.kind, "ready");
  assert.deepEqual(getContentReportOutbox(), [failed]);
});

test("local outbox removes unconfirmed reports after 30 days and preserves newer retries", async () => {
  const old = await submitContentReport({ ...baseInput, clientSubmissionId: "3a61e3f3-f23e-467c-b92a-9b8fd0514f25" });
  const recent = await submitContentReport({ ...baseInput, clientSubmissionId: "4a61e3f3-f23e-467c-b92a-9b8fd0514f25" });
  upsertContentReportOutboxEntry({ ...old.entry, createdAt: "2026-08-01T00:00:00.000Z" });
  upsertContentReportOutboxEntry({ ...recent.entry, createdAt: "2026-08-20T00:00:00.000Z" });

  purgeExpiredContentReportOutboxEntries(new Date("2026-09-06T00:00:00.000Z"));

  assert.deepEqual(getContentReportOutbox().map((entry) => entry.input.clientSubmissionId), [recent.entry.input.clientSubmissionId]);
});

test("canonical runtime transport flushes once after readiness and is torn down without fallback", async () => {
  configurePatternlyAppCheckTokenProvider(async () => "verified-app-check-token");
  const queued = await submitContentReport({ ...baseInput, clientSubmissionId: "df61e3f3-f23e-467c-b92a-9b8fd0514f25" });
  let calls = 0;
  const client = { createContentReport: async (input: { clientSubmissionId: string }) => {
    calls += 1;
    assert.equal(input.clientSubmissionId, queued.entry.input.clientSubmissionId);
    return { duplicate: false };
  } };
  const registration = registerContentReportRuntimeTransport(createContentReportTransport(client));
  await registration.ready;
  assert.equal(calls, 1);
  assert.equal(readContentReportTransport().kind, "available");
  registration.unregister();
  assert.deepEqual(getContentReportOutbox(), []);
  assert.equal(readContentReportTransport().kind, "unavailable");
});

test("restart readiness replays queued, retrying, and failed records with their original identities", async () => {
  configurePatternlyAppCheckTokenProvider(async () => "verified-app-check-token");
  const ids = ["ef61e3f3-f23e-467c-b92a-9b8fd0514f25", "ff61e3f3-f23e-467c-b92a-9b8fd0514f25", "0a61e3f3-f23e-467c-b92a-9b8fd0514f25"];
  for (const id of ids) await submitContentReport({ ...baseInput, clientSubmissionId: id });
  updateContentReportOutboxStatus(ids[1]!, "retrying", { updatedAt: "2026-08-25T10:01:00.000Z", lastErrorCode: null });
  updateContentReportOutboxStatus(ids[2]!, "failed", { updatedAt: "2026-08-25T10:01:00.000Z", lastErrorCode: "transport_failed" });
  const submitted: string[] = [];
  const registration = registerContentReportRuntimeTransport(createContentReportTransport({ createContentReport: async (input) => {
    submitted.push(input.clientSubmissionId);
    return { duplicate: false };
  } }));
  await registration.ready;
  assert.deepEqual(submitted.sort(), [...ids].sort());
  assert.deepEqual(getContentReportOutbox(), []);
  registration.unregister();
});

test("readiness flush and a concurrent submit share one in-flight send and one cleanup", async () => {
  configurePatternlyAppCheckTokenProvider(async () => "verified-app-check-token");
  const id = "1a61e3f3-f23e-467c-b92a-9b8fd0514f25";
  await submitContentReport({ ...baseInput, clientSubmissionId: id });
  const started = deferred<void>();
  const response = deferred<Readonly<{ duplicate: boolean }>>();
  let calls = 0;
  const registration = registerContentReportRuntimeTransport(createContentReportTransport({ createContentReport: async () => {
    calls += 1;
    started.resolve();
    return response.promise;
  } }));
  await started.promise;
  const runtime = readContentReportTransport();
  assert.equal(runtime.kind, "available");
  const concurrent = submitContentReport({ ...baseInput, clientSubmissionId: id }, runtime.transport);
  assert.equal(calls, 1);
  response.resolve({ duplicate: false });
  const [, repeated] = await Promise.all([registration.ready, concurrent]);
  assert.equal(calls, 1);
  assert.equal(repeated.status, "accepted");
  assert.deepEqual(getContentReportOutbox(), []);
  registration.unregister();
});

test("teardown during an in-flight response leaves the entry retryable for duplicate reconciliation", async () => {
  configurePatternlyAppCheckTokenProvider(async () => "verified-app-check-token");
  const id = "2a61e3f3-f23e-467c-b92a-9b8fd0514f25";
  await submitContentReport({ ...baseInput, clientSubmissionId: id });
  const started = deferred<void>();
  const response = deferred<Readonly<{ duplicate: boolean }>>();
  const stale = registerContentReportRuntimeTransport(createContentReportTransport({ createContentReport: async () => {
    started.resolve();
    return response.promise;
  } }));
  await started.promise;
  stale.unregister();
  response.resolve({ duplicate: false });
  await stale.ready;
  assert.equal(getContentReportOutbox()[0]?.input.clientSubmissionId, id);
  assert.equal(getContentReportOutbox()[0]?.status, "retrying");
  const current = registerContentReportRuntimeTransport(createContentReportTransport({ createContentReport: async (input) => {
    assert.equal(input.clientSubmissionId, id);
    return { duplicate: true };
  } }));
  await current.ready;
  assert.deepEqual(getContentReportOutbox(), []);
  current.unregister();
});
