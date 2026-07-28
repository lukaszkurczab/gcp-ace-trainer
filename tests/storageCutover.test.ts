import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test, { beforeEach } from "node:test";

import { bootstrapApplication } from "../src/application/bootstrap";
import { createTrainingSession } from "../src/domain";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../src/infrastructure/storage/mmkvClient";
import { STORAGE_KEYS } from "../src/storage/keys";
import { getActiveTrainingSessionDraftRevision, saveTrainingSessionDraft, saveTrainingSession, validateStorageMetadata } from "../src/storage/repositories";
import { removeCanonicalValue, writeCanonicalJson } from "../src/storage/repositories/canonicalRecordCodec";

const files = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? files(join(directory, entry.name)) : [join(directory, entry.name)]);
const simulation = () => createTrainingSession({
  id: "bootstrap-session", trackId: "algorithms", modeId: "interview-simulation",
  configurationSnapshot: { answerChanges: "untilFinalSubmission", feedbackMode: "atSessionEnd", kind: "interviewSimulation", submission: "manualOrForegroundTimeout" },
  requestedLength: 1, actualLength: 1, currentItemIndex: 0,
  itemOrder: [{ occurrenceId: "bootstrap-session:0", item: { trackId: "algorithms", itemId: "item", contentVersion: "content-v1" } }],
  optionOrderByOccurrence: {}, activeForegroundMs: 0, contentVersion: "content-v1", status: "active", startedAt: "2026-07-16T00:00:00.000Z",
});

beforeEach(() => installKeyValueStorageForTests(new MemoryKeyValueStorage()));

test("canonical storage uses envelopes and rejects an unsupported schema identity", async () => {
  await validateStorageMetadata();
  writeCanonicalJson(STORAGE_KEYS.METADATA, { namespace: "wrong", schemaVersion: 999 });
  await assert.rejects(validateStorageMetadata(), /Unsupported canonical storage schema/);
});

test("draft replacement verifies its expected revision", async () => {
  const session = simulation();
  await saveTrainingSession(session);
  const draft = { schemaVersion: 1 as const, familyId: "algorithms", draftVersion: 1 as const, revision: 1, sessionId: session.id, trackId: session.trackId, responsesByOccurrenceId: {}, flaggedOccurrenceIds: [], updatedAt: session.startedAt } as const;
  await saveTrainingSessionDraft(draft, null);
  const revision = await getActiveTrainingSessionDraftRevision();
  assert.equal(revision, 1);
  await saveTrainingSessionDraft({ ...draft, updatedAt: "2026-07-16T00:01:00.000Z" }, revision);
  await assert.rejects(saveTrainingSessionDraft({ ...draft, updatedAt: "2026-07-16T00:02:00.000Z" }, revision), /expected revision is stale/);
});

test("bootstrap blocks an inconsistent active-session reference and a missing required draft", async () => {
  const session = simulation();
  await saveTrainingSession(session);
  removeCanonicalValue(STORAGE_KEYS.ACTIVE_TRAINING_SESSION);
  const inconsistent = await bootstrapApplication(async () => undefined, async () => undefined);
  assert.deepEqual(inconsistent.kind, "blocking");

  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  await saveTrainingSession(session);
  const missingDraft = await bootstrapApplication(async () => undefined, async () => undefined);
  assert.deepEqual(missingDraft.kind, "blocking");
});

test("bootstrap runs resolution only after recovery/content validation and exposes profile/content mismatch as blocking", async () => {
  const events: string[] = [];
  const ready = await bootstrapApplication(async () => { events.push("content"); }, async () => { events.push("resolve"); });
  assert.deepEqual(ready, { kind: "ready", activeSessionId: null });
  assert.deepEqual(events, ["content"]);
  const blocked = await bootstrapApplication(async () => undefined, async () => { throw new Error("content/profile mismatch"); });
  assert.deepEqual(blocked.kind, "ready");
  const session = simulation();
  await saveTrainingSession(session);
  await saveTrainingSessionDraft({ schemaVersion: 1, familyId: "algorithms", draftVersion: 1, revision: 1, sessionId: session.id, trackId: session.trackId, responsesByOccurrenceId: {}, flaggedOccurrenceIds: [], updatedAt: session.startedAt }, null);
  const mismatch = await bootstrapApplication(async () => undefined, async () => { throw new Error("content/profile mismatch"); });
  assert.deepEqual(mismatch, { kind: "blocking", reason: "Application bootstrap failed. [LOCAL_OPERATION_FAILED]" });
});

test("one MMKV import is infrastructure-owned and only repositories access it", () => {
  const source = files("src").filter((path) => /\.(ts|tsx)$/.test(path));
  const imports = source.filter((path) => /react-native-mmkv/.test(readFileSync(path, "utf8")));
  assert.deepEqual(imports, [join("src", "infrastructure", "storage", "mmkvClient.ts")]);
  for (const path of source) {
    if (path.endsWith("src/infrastructure/storage/mmkvClient.ts")) continue;
    if (/infrastructure\/storage\/mmkvClient/.test(readFileSync(path, "utf8"))) assert.match(path, /src\/storage\/repositories\//);
  }
});

test("cutover removes old storage and remote content paths", () => {
  const source = files("src").map((path) => readFileSync(path, "utf8")).join("\n");
  assert.doesNotMatch(source, /AsyncStorage|patternly:v1:|storageCodec|ContentCacheRepository|HttpContentSource|loadTrackContent|certificationExamRepository/);
});
