import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import { createLearningPlanSlotId } from "../../domain";
import { TEST_CONTENT_PACKAGE_PIN } from "../../testing/contentPackagePinFixture";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import { STORAGE_KEYS } from "../keys";
import { readCanonicalEnvelope, writeCanonicalJson } from "./canonicalRecordCodec";
import { UnsupportedStoredRecordError } from "../errors";
import {
  DEVICE_REMINDER_JOURNAL_VERSION,
  DEVICE_REMINDER_SETTINGS_VERSION,
  getDeviceReminderJournal,
  getDeviceReminderSettingsSnapshot,
  isCanonicalDeviceReminderSettings,
  saveDeviceReminderSettings,
  type DeviceReminderJournal,
  type DeviceReminderSettings,
  type NotificationPlanIdentity,
} from "./notificationSettingsRepository";

const TRACK_ID = "coding-interview-dsa-problem-solving" as const;

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
    contentPackagePin: TEST_CONTENT_PACKAGE_PIN,
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
test("legacy settings migrate to enabled-only state while retaining every native notification id", () => {
  writeCanonicalJson(STORAGE_KEYS.NOTIFICATION_SETTINGS, {
    practiceReminder: {
      mode: "by-day",
      commonTime: null,
      schedules: [
        { day: "sat", time: { hour: 20, minute: 15 }, notificationId: "old-sat" },
        { day: "mon", time: { hour: 18, minute: 0 }, notificationId: "old-mon" },
      ],
      trackId: TRACK_ID,
      transactionId: "old-transaction",
    },
  });

  const migrated = getDeviceReminderSettingsSnapshot();
  assert.equal(migrated?.settings.enabled, true);
  assert.deepEqual(migrated?.settings.schedules, []);
  assert.deepEqual(migrated?.settings.identity, null);
  assert.deepEqual(migrated?.settings.legacyNotificationIds, ["old-sat", "old-mon"]);

  const persisted = readCanonicalEnvelope(STORAGE_KEYS.NOTIFICATION_SETTINGS, (value): value is DeviceReminderSettings => isCanonicalDeviceReminderSettings(value));
  assert.equal(persisted?.payload.schemaVersion, DEVICE_REMINDER_SETTINGS_VERSION);
  assert.deepEqual(persisted?.payload.legacyNotificationIds, ["old-sat", "old-mon"]);
});

test("legacy daily settings retain the one native id during migration", () => {
  writeCanonicalJson(STORAGE_KEYS.NOTIFICATION_SETTINGS, {
    dailyReminder: { hour: 9, minute: 15, notificationId: "old-daily" },
  });

  const migrated = getDeviceReminderSettingsSnapshot();
  assert.deepEqual(migrated?.settings.legacyNotificationIds, ["old-daily"]);
  assert.equal(migrated?.settings.enabled, true);
});

test("legacy journals become cancellation-only journals and cannot restore their old desired slots", () => {
  writeCanonicalJson(STORAGE_KEYS.NOTIFICATION_SETTINGS_JOURNAL, {
    version: 2,
    created: [{ day: "mon", time: { hour: 8, minute: 0 }, notificationId: "old-created" }],
    desired: {
      mode: "same-time",
      commonTime: { hour: 8, minute: 0 },
      days: [{ day: "mon", time: { hour: 8, minute: 0 } }, { day: "wed", time: { hour: 8, minute: 0 } }],
      trackId: TRACK_ID,
    },
    remainingOldIds: ["old-remaining"],
    transactionId: "old-journal",
  });

  const migrated = getDeviceReminderJournal();
  assert.equal(migrated?.schemaVersion, DEVICE_REMINDER_JOURNAL_VERSION);
  assert.equal(migrated?.expectedIdentity, null);
  assert.equal(migrated?.enabled, false);
  assert.deepEqual(migrated?.slots, []);
  assert.deepEqual(migrated?.created, []);
  assert.deepEqual(migrated?.remainingOldIds, ["old-created", "old-remaining"]);

  const persisted = readCanonicalEnvelope(STORAGE_KEYS.NOTIFICATION_SETTINGS_JOURNAL, (value): value is DeviceReminderJournal => Boolean(value && typeof value === "object" && (value as { schemaVersion?: unknown }).schemaVersion === DEVICE_REMINDER_JOURNAL_VERSION));
  assert.equal(persisted?.payload.commandId, "legacy:old-journal");
  assert.deepEqual(persisted?.payload.slots, []);
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

test("rejects identity without commandId, contentVersion, or a complete package pin", () => {
  for (const invalid of [
    { commandId: "" },
    { contentVersion: "" },
    { contentPackagePin: { ...TEST_CONTENT_PACKAGE_PIN, contentReleaseId: "" } },
    { contentPackagePin: { ...TEST_CONTENT_PACKAGE_PIN, packageVersion: "" } },
  ] as const) {
    const candidate = settings({ identity: identity(invalid) });
    assert.equal(isCanonicalDeviceReminderSettings(candidate), false);
  }
});
