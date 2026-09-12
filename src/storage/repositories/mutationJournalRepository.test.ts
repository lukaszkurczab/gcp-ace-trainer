import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import { installMemoryStorage, attempt, journal, session } from "../../testing/journalTestSupport";
import {
  createMutationPlanFingerprint,
  hasValidMutationJournalIntegrity,
  isMutationJournalRecord,
} from "./mutationJournalRepository";

beforeEach(() => installMemoryStorage());

test("accepts a journal whose scope and writes use one exact resolved artifact", () => {
  const record = journal([
    { kind: "put_attempt", record: attempt() },
    { kind: "put_session", record: session() },
  ]);

  assert.equal(hasValidMutationJournalIntegrity(record), true);
  assert.equal(isMutationJournalRecord(record), true);
  assert.equal(createMutationPlanFingerprint({
    operation: record.operation,
    status: "journal_durable",
    createdAt: record.createdAt,
    sessionId: record.sessionId,
    trackId: record.trackId,
    artifactSha256: record.artifactSha256,
    commandIdentity: record.commandIdentity,
    expectedRevisions: record.expectedRevisions,
    writes: record.writes,
  }), record.planFingerprint);
});

test("uses the complete resolved reference when validating attempt and session relationships", () => {
  const base = journal([
    { kind: "put_attempt", record: attempt() },
    { kind: "put_session", record: session() },
  ]);
  const changedAttempt = {
    ...attempt(),
    item: { ...attempt().item, questionId: "different-question" },
    reviewEvidence: { ...attempt().reviewEvidence, sourceItem: { ...attempt().item, questionId: "different-question" } },
  };
  const candidate = {
    ...base,
    writes: [
      { kind: "put_attempt" as const, record: changedAttempt },
      { kind: "put_session" as const, record: session() },
    ],
  };
  const withFingerprint = {
    ...candidate,
    planFingerprint: createMutationPlanFingerprint({
      operation: candidate.operation,
      status: "journal_durable" as const,
      createdAt: candidate.createdAt,
      sessionId: candidate.sessionId,
      trackId: candidate.trackId,
      artifactSha256: candidate.artifactSha256,
      commandIdentity: candidate.commandIdentity,
      expectedRevisions: candidate.expectedRevisions,
      writes: candidate.writes,
    }),
  };

  assert.equal(hasValidMutationJournalIntegrity(withFingerprint), true);
  assert.equal(isMutationJournalRecord(withFingerprint), false);
});

test("requires an exact lowercase artifact SHA and rejects legacy top-level identity fields", () => {
  const record = journal([
    { kind: "put_attempt", record: attempt() },
    { kind: "put_session", record: session() },
  ]);
  const uppercase = {
    ...record,
    artifactSha256: record.artifactSha256!.toUpperCase(),
  };
  const { artifactSha256: _artifactSha256, ...withoutCanonicalIdentity } = record;
  const legacy = {
    ...withoutCanonicalIdentity,
    packagePin: { packageIdentity: "a".repeat(64), packageVersion: "v1", contentReleaseId: "release" },
  };

  assert.equal(hasValidMutationJournalIntegrity(uppercase), false);
  assert.equal(hasValidMutationJournalIntegrity(legacy), false);
});

test("permits a reset journal only with a null artifact scope", () => {
  const reset = journal([{ kind: "clear_learning_state" }], "reset_learning_state");
  assert.equal(isMutationJournalRecord(reset), true);
  const nonReset = { ...reset, operation: "submit_training_outcome" as const };
  assert.equal(hasValidMutationJournalIntegrity(nonReset), false);
});
