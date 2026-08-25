import assert from "node:assert/strict";
import test from "node:test";

import { retryContentReport, submitContentReport } from "../src/application/contentReports";
import { configurePatternlyAppCheckTokenProvider } from "../src/infrastructure/clients/patternlyAppCheckToken";
import { installKeyValueStorageForTests, MemoryKeyValueStorage } from "../src/infrastructure/storage/mmkvClient";
import { getContentReportOutbox } from "../src/storage/repositories/contentReportOutboxRepository";
import { TEST_CONTENT_PACKAGE_PIN } from "./contentPackagePinFixture";

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

test("report outbox requires App Check, then accepts with the same idempotency key", async () => {
  const transport = { create: async () => ({ duplicate: false }) };
  const failed = await submitContentReport({ ...baseInput, clientSubmissionId: "7f61e3f3-f23e-467c-b92a-9b8fd0514f25" }, transport);
  assert.equal(failed.status, "failed");
  assert.equal(failed.entry.lastErrorCode, "app_check_unavailable");
  configurePatternlyAppCheckTokenProvider(async () => "verified-app-check-token");
  let calls = 0;
  const accepting = { create: async (input: { clientSubmissionId: string }) => { calls += 1; assert.equal(input.clientSubmissionId, "7f61e3f3-f23e-467c-b92a-9b8fd0514f25"); return { duplicate: calls > 1 }; } };
  const accepted = await retryContentReport(failed.entry.input.clientSubmissionId, accepting);
  const repeated = await retryContentReport(failed.entry.input.clientSubmissionId, accepting);
  assert.equal(accepted.status, "accepted");
  assert.equal(repeated.status, "accepted");
  assert.equal(calls, 1);
  assert.equal(repeated.entry.input.clientSubmissionId, failed.entry.input.clientSubmissionId);
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
});
