import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import { createLearningPlanSlotId } from "../../domain";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import { STORAGE_KEYS } from "../keys";
import { writeCanonicalJson } from "./canonicalRecordCodec";
import { isCanonicalNotificationSettingsJournal, saveDeviceReminderJournal, clearDeviceReminderJournal, getDeviceReminderSettings, readReminderPreferencesForExport } from "./notificationSettingsRepository";
import { CorruptStoredRecordError, UnsupportedStoredRecordError } from "../errors";
import {
  DEVICE_REMINDER_JOURNAL_VERSION,
  DEVICE_REMINDER_SETTINGS_VERSION,
  getDeviceReminderJournal,
  getDeviceReminderSettingsSnapshot,
  isCanonicalDeviceReminderSettings,
  saveDeviceReminderSettings,
  type DeviceReminderSettings,
  type NotificationPlanIdentity,
} from "./notificationSettingsRepository";

const TRACK_ID = "coding-interview-dsa-problem-solving" as const;
const ARTIFACT_SHA256 = "a".repeat(64);

function identity(overrides: Partial<NotificationPlanIdentity> = {}): NotificationPlanIdentity {
  return {
    trackId: TRACK_ID,
    goalRevision: 3,
    planId: "plan:one",
    planRevision: 4,
    storageRevision: 7,
    commandId: "learning-plan:command:one",
    timezone: "Europe/Warsaw",
    contentVersion: "content-v4",
    artifactSha256: ARTIFACT_SHA256,
    ...overrides,
  };
}

function settings(overrides: Partial<DeviceReminderSettings> = {}): DeviceReminderSettings {
  return {
    schemaVersion: DEVICE_REMINDER_SETTINGS_VERSION,
    enabled: true,
    identity: identity(),
    schedules: [{ slotId: createLearningPlanSlotId("slot:mon"), day: "mon", localTime: "18:00", notificationId: "native-mon" }],
    legacyNotificationIds: [],
    pending: null,
    ...overrides,
  };
}

beforeEach(() => installKeyValueStorageForTests(new MemoryKeyValueStorage()));

test("true absence stays null and does not create reminder records", () => {
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);

  assert.equal(getDeviceReminderSettingsSnapshot(), null);
  assert.equal(getDeviceReminderJournal(), null);
  assert.deepEqual(readReminderPreferencesForExport(), { revision: null, preferences: null, hasPendingJournal: false });
  assert.equal(storage.operations.some((entry) => entry.kind === "write" || entry.kind === "remove"), false);
});

test("stores and reads the complete plan identity, slot identity, and envelope revision", () => {
  const saved = saveDeviceReminderSettings(settings(), null);
  const read = getDeviceReminderSettingsSnapshot();

  assert.equal(saved.revision, 1);
  assert.equal(read?.revision, 1);
  assert.deepEqual(read?.settings.identity, identity());
  assert.deepEqual(read?.settings.schedules, settings().schedules);
  assert.equal(Object.isFrozen(read?.settings), true);
  assert.equal(Object.isFrozen(read?.settings.identity), true);
  assert.equal(Object.isFrozen(read?.settings.schedules), true);
});

test("current settings updates retain canonical revisions and reject stale compare-and-set", () => {
  const first = saveDeviceReminderSettings(settings(), null);
  const nextSettings = settings({ schedules: [{ slotId: createLearningPlanSlotId("slot:tue"), day: "tue", localTime: "19:00", notificationId: "native-tue" }] });
  const second = saveDeviceReminderSettings(nextSettings, first.revision);

  assert.equal(first.revision, 1);
  assert.equal(second.revision, 2);
  assert.throws(() => saveDeviceReminderSettings(settings(), first.revision), UnsupportedStoredRecordError);
  assert.deepEqual(getDeviceReminderSettingsSnapshot(), second);
});
test("old settings are unsupported and remain byte-for-byte untouched by reads, export, and attempted save", () => {
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  writeCanonicalJson(STORAGE_KEYS.NOTIFICATION_SETTINGS, {
    practiceReminder: { mode: "by-day", commonTime: null, schedules: [{ day: "mon", time: { hour: 18, minute: 0 }, notificationId: "old-mon" }], trackId: TRACK_ID, transactionId: "old-transaction" },
  });
  const before = storage.snapshot();
  storage.resetCounters();

  assert.throws(() => getDeviceReminderSettingsSnapshot(), UnsupportedStoredRecordError);
  assert.throws(() => getDeviceReminderSettings(), UnsupportedStoredRecordError);
  assert.throws(() => readReminderPreferencesForExport(), UnsupportedStoredRecordError);
  assert.throws(() => saveDeviceReminderSettings(settings()), UnsupportedStoredRecordError);
  assert.deepEqual(storage.snapshot(), before);
  assert.equal(storage.operations.some((entry) => entry.kind === "write" || entry.kind === "remove"), false);
});

test("old journals are unsupported and remain byte-for-byte untouched by reads, export, save, and clear", () => {
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  writeCanonicalJson(STORAGE_KEYS.NOTIFICATION_SETTINGS_JOURNAL, {
    version: 2,
    created: [{ day: "mon", time: { hour: 8, minute: 0 }, notificationId: "old-created" }],
    desired: null,
    remainingOldIds: ["old-remaining"],
    transactionId: "old-journal",
  });
  const before = storage.snapshot();
  storage.resetCounters();

  assert.throws(() => getDeviceReminderJournal(), UnsupportedStoredRecordError);
  assert.throws(() => readReminderPreferencesForExport(), UnsupportedStoredRecordError);
  assert.throws(() => saveDeviceReminderJournal({
    schemaVersion: DEVICE_REMINDER_JOURNAL_VERSION,
    transactionId: "new-journal", commandId: "new-command", expectedIdentity: null,
    enabled: false, slots: [], created: [], remainingOldIds: [],
  }), UnsupportedStoredRecordError);
  assert.throws(() => clearDeviceReminderJournal(), UnsupportedStoredRecordError);
  assert.deepEqual(storage.snapshot(), before);
  assert.equal(storage.operations.some((entry) => entry.kind === "write" || entry.kind === "remove"), false);
});

test("malformed settings and journal bytes are corrupt and are never repaired implicitly", () => {
  for (const key of [STORAGE_KEYS.NOTIFICATION_SETTINGS, STORAGE_KEYS.NOTIFICATION_SETTINGS_JOURNAL]) {
    const storage = new MemoryKeyValueStorage();
    installKeyValueStorageForTests(storage);
    storage.setString(key, "{broken");
    const before = storage.snapshot();
    storage.resetCounters();
    assert.throws(() => key === STORAGE_KEYS.NOTIFICATION_SETTINGS ? getDeviceReminderSettingsSnapshot() : getDeviceReminderJournal(), CorruptStoredRecordError);
    assert.deepEqual(storage.snapshot(), before);
    assert.equal(storage.operations.some((entry) => entry.kind === "write" || entry.kind === "remove"), false);
  }
});

test("the canonical journal guard accepts only the current typed journal shape", () => {
  const legacy = {
    created: [{ day: "sat", notificationId: "legacy-notification" }],
    desired: null,
    remainingOldIds: ["old-notification"],
    transactionId: "legacy-reminder-transaction",
  };
  assert.equal(isCanonicalNotificationSettingsJournal(legacy), false);
  assert.equal(isCanonicalNotificationSettingsJournal({ ...legacy, remainingOldIds: [""] }), false);
  assert.equal(isCanonicalNotificationSettingsJournal({ ...legacy, unexpected: true }), false);
});

test("rejects duplicate days or slot IDs in a canonical settings record", () => {
  const duplicateDay = settings({
    schedules: [
      { slotId: createLearningPlanSlotId("slot:one"), day: "mon", localTime: "18:00", notificationId: "native-one" },
      { slotId: createLearningPlanSlotId("slot:two"), day: "mon", localTime: "19:00", notificationId: "native-two" },
    ],
  });
  const duplicateSlotId = settings({
    schedules: [
      { slotId: createLearningPlanSlotId("slot:one"), day: "mon", localTime: "18:00", notificationId: "native-one" },
      { slotId: createLearningPlanSlotId("slot:one"), day: "tue", localTime: "19:00", notificationId: "native-two" },
    ],
  });

  assert.equal(isCanonicalDeviceReminderSettings(duplicateDay), false);
  assert.equal(isCanonicalDeviceReminderSettings(duplicateSlotId), false);
  assert.throws(() => saveDeviceReminderSettings(duplicateDay), /INVALID_DEVICE_REMINDER_SETTINGS/);
  assert.throws(() => saveDeviceReminderSettings(duplicateSlotId), /INVALID_DEVICE_REMINDER_SETTINGS/);
});

test("rejects identity without commandId, contentVersion, or a valid artifact SHA", () => {
  for (const invalid of [
    { commandId: "" },
    { contentVersion: "" },
    { artifactSha256: "" },
    { artifactSha256: "A".repeat(64) },
    { artifactSha256: "a".repeat(63) },
  ] as const) {
    const candidate = settings({ identity: identity(invalid) });
    assert.equal(isCanonicalDeviceReminderSettings(candidate), false);
  }
});
