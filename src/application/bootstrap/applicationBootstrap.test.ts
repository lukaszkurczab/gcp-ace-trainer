import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import { ApplicationBootstrapStage, bootstrapApplication } from "./applicationBootstrap";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import { createContentIdentityUnavailableActiveRecord, saveUnavailableActiveRecord } from "../../storage/repositories/contentIdentityUnavailableRepository";
import { CanonicalRepositoryBootstrapStep } from "../../storage/repositories/canonicalRepositories";

const TRACK_ID = "coding-interview-dsa-problem-solving";

beforeEach(() => installKeyValueStorageForTests(new MemoryKeyValueStorage()));

test("bootstrap surfaces unavailable active sessions before content preparation or resume", async () => {
  const sessionId = "unavailable-active-session";
  await saveUnavailableActiveRecord(createContentIdentityUnavailableActiveRecord({
    schemaVersion: 1,
    kind: "unavailable_active",
    sessionId,
    session: {
      id: sessionId,
      itemOrder: [{
        occurrenceId: `${sessionId}:0`,
        item: {
          kind: "unavailable_active",
          trackId: TRACK_ID,
          questionId: "question-1",
          contentVersion: "content-v0",
          reason: "unknown_artifact_hash",
          sessionId,
        },
      }],
      status: "active",
      trackId: TRACK_ID,
    },
    attempts: [],
    results: [],
  }));

  const events: string[] = [];
  const result = await bootstrapApplication(
    async () => { events.push("content"); },
    async () => { events.push("resume"); },
    async () => { events.push("recovery"); },
  );

  assert.deepEqual(result, { kind: "content_identity_unavailable", sessionIds: [sessionId] });
  assert.deepEqual(events, []);
});

test("bootstrap emits a bounded diagnostic for a content-stage failure", async () => {
  const diagnostics: unknown[] = [];
  const result = await bootstrapApplication(
    async () => { throw new Error("content payload=session-123"); },
    async () => undefined,
    undefined,
    { diagnosticObserver: (event) => { diagnostics.push(event); } },
  );

  assert.deepEqual(result, { kind: "blocking", reason: "Application bootstrap failed. [LOCAL_OPERATION_FAILED]" });
  assert.deepEqual(diagnostics, [{ stage: ApplicationBootstrapStage.VerifyingContent, operationalCode: "LOCAL_OPERATION_FAILED", errorKind: "error" }]);
  assert.doesNotMatch(JSON.stringify(diagnostics), /payload|session-123/u);
});

test("bootstrap reports the last canonical repository step for a repository failure", async () => {
  const diagnostics: unknown[] = [];
  const result = await bootstrapApplication(
    async () => undefined,
    async () => undefined,
    undefined,
    {
      diagnosticObserver: (event) => { diagnostics.push(event); },
      repositories: {
        guestInstallationIdentity: {
          async create() { throw new Error("identity payload=session-123"); },
        },
      },
    },
  );

  assert.deepEqual(result, { kind: "blocking", reason: "Application bootstrap failed. [LOCAL_OPERATION_FAILED]" });
  assert.deepEqual(diagnostics, [{
    stage: ApplicationBootstrapStage.OpeningStorage,
    operationalCode: "LOCAL_OPERATION_FAILED",
    repositoryStepCode: CanonicalRepositoryBootstrapStep.GuestInstallationProvisioning,
    errorKind: "error",
  }]);
});
