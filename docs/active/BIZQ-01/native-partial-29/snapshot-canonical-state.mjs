#!/usr/bin/env node
// Read-only, private snapshot of an already-published app profile.
// This helper never loads a Metro module, invokes bootstrap/migration, or writes app state.
import { createHash, randomUUID } from "node:crypto";
import { openSync, writeFileSync, closeSync } from "node:fs";
import { resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import WebSocket from "ws";

const MARKER_PREFIX = "[bizq29-private-snapshot]";
const WORKSPACE_ROOT = resolve(fileURLToPath(new URL("../../../../..", import.meta.url)));
const PRIVATE_ROOTS = ["/private/tmp", process.env.TMPDIR].filter(Boolean).map((value) => resolve(value));

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const name = argv[index];
    if (name === "--out") args.out = argv[++index];
    else if (name === "--port") args.port = argv[++index];
    else throw new Error("usage: snapshot-canonical-state.mjs --out /private/tmp/<new-file.json> [--port 8081]");
  }
  if (!args.out) throw new Error("private_output_path_required");
  return { ...args, port: Number(args.port ?? 8081) };
}

function assertPrivateOutput(out) {
  const target = resolve(out);
  if (target === WORKSPACE_ROOT || target.startsWith(`${WORKSPACE_ROOT}${sep}`)) throw new Error("output_must_be_outside_repository");
  if (!PRIVATE_ROOTS.some((root) => target.startsWith(`${root}${sep}`))) throw new Error("output_must_be_under_private_tmp");
  return target;
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function expressionSource(marker) {
  return `(() => {
    const marker = ${JSON.stringify(marker)};
    const fail = (stage) => console.log(marker, JSON.stringify({ ok: false, stage }));
    try {
      const metroRequire = globalThis.__r;
      if (typeof metroRequire !== "function" || typeof metroRequire.getModules !== "function") return fail("metro_registry_unavailable");
      const modules = [...metroRequire.getModules().values()];
      const initialized = (suffix, stage) => {
        const matches = modules.filter((entry) => entry.verboseName === suffix || entry.verboseName?.endsWith("/" + suffix));
        if (matches.length !== 1) throw new Error(stage + "_module_match");
        const entry = matches[0];
        if (entry.isInitialized !== true) throw new Error(stage + "_module_not_initialized");
        return entry.publicModule.exports;
      };
      const mmkv = initialized("src/infrastructure/storage/mmkvClient.ts", "storage");
      const notificationPlatform = initialized("src/infrastructure/notifications/expoNotificationPlatform.ts", "notification_platform");
      const Notifications = initialized("node_modules/expo-notifications/build/index.js", "notifications");
      if (typeof mmkv.getKeyValueStorage !== "function") throw new Error("storage_reader_missing");
      if (typeof notificationPlatform.expoNotificationPlatform?.getPermission !== "function") throw new Error("notification_permission_reader_missing");
      const storage = mmkv.getKeyValueStorage();
      if (!storage || typeof storage.getAllKeys !== "function" || typeof storage.getString !== "function") throw new Error("published_storage_unavailable");
      const profile = typeof mmkv.getActiveStorageProfileOrNull === "function" ? mmkv.getActiveStorageProfileOrNull() : null;
      const transition = typeof mmkv.isProfileTransitionActive === "function" ? mmkv.isProfileTransitionActive() : null;
      const keys = [...storage.getAllKeys()].filter((key) => typeof key === "string").sort();
      const prefix = "patternly:canonical:v1:";
      const classify = (key) => {
        if (!key.startsWith(prefix)) return "outside_canonical_namespace";
        const name = key.slice(prefix.length);
        if (name === "active-track") return "active-track";
        if (name === "active-training-session" || name === "active-training-session-draft" || name === "active-foreground-timer" || name === "journal:active") return "learning-lifecycle";
        if (name === "training-session-index" || name.startsWith("training-session:") || name.startsWith("training-session-result:") || name === "training-attempt-index" || name.startsWith("training-attempt:") || name === "review-index" || name.startsWith("review-entry:")) return "learning-progress";
        if (name.startsWith("goal:") || name.startsWith("learning-plan:") || name === "goal-onboarding-preferences") return "goals-and-plans";
        if (name === "settings") return "user-settings";
        if (name === "notification-settings" || name === "notification-settings-journal") return "reminder-settings";
        if (name === "archival-history-index" || name.startsWith("archival-history:") || name === "unavailable-active-index" || name.startsWith("unavailable-active:") || name === "unavailable-review-index" || name.startsWith("unavailable-review:")) return "learning-identity-history";
        if (name === "account-sync" || name === "account-sign-out" || name === "account-deletion") return "account-lifecycle-redacted";
        if (name === "guest-installation" || name === "guest-access" || name === "metadata") return "profile-metadata-unread";
        if (name === "content-report-outbox") return "content-report-outbox-unread";
        return "unclassified-canonical-key-unread";
      };
      const privateCategories = new Set(["active-track", "learning-lifecycle", "learning-progress", "goals-and-plans", "user-settings", "reminder-settings", "learning-identity-history"]);
      const accountKeys = new Set([prefix + "account-sync", prefix + "account-sign-out", prefix + "account-deletion"]);
      const records = [];
      for (const key of keys) {
        const category = classify(key);
        if (!privateCategories.has(category) && !accountKeys.has(key)) continue;
        const raw = storage.getString(key);
        if (raw === undefined) {
          records.push({ key, category, present: false });
          continue;
        }
        let parsed = null;
        let parseStatus = "valid_json";
        try { parsed = JSON.parse(raw); } catch { parseStatus = "invalid_json"; }
        const envelope = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
        const validEnvelope = envelope && envelope.schemaIdentity === "patternly:canonical:v1" && Number.isSafeInteger(envelope.revision) && envelope.revision >= 1 && Object.prototype.hasOwnProperty.call(envelope, "payload");
        if (accountKeys.has(key)) {
          const payload = validEnvelope && envelope.payload && typeof envelope.payload === "object" ? envelope.payload : null;
          records.push({ key, category, present: true, sha256: null, revision: validEnvelope ? envelope.revision : null, schemaIdentity: validEnvelope ? envelope.schemaIdentity : null,
            parseStatus: validEnvelope ? "valid_envelope_redacted" : parseStatus,
            payloadFields: payload ? Object.keys(payload).sort() : [],
            status: typeof payload?.status === "string" ? payload.status : null,
            lastFailureCode: typeof payload?.lastFailureCode === "string" ? payload.lastFailureCode : null,
            pendingMutationCount: Number.isSafeInteger(payload?.pendingMutationCount) ? payload.pendingMutationCount : null,
            acknowledged: typeof payload?.acknowledged === "boolean" ? payload.acknowledged : null,
          });
          continue;
        }
        records.push({ key, category, present: true, raw, revision: validEnvelope ? envelope.revision : null, schemaIdentity: validEnvelope ? envelope.schemaIdentity : null, parseStatus });
      }
      const permissionRead = notificationPlatform.expoNotificationPlatform.getPermission();
      const schedulesRead = typeof Notifications.getAllScheduledNotificationsAsync === "function" ? Notifications.getAllScheduledNotificationsAsync() : Promise.reject(new Error("notification_reader_missing"));
      Promise.all([permissionRead, schedulesRead]).then(([permission, scheduled]) => {
        if (!Array.isArray(scheduled)) return fail("scheduled_notification_shape_invalid");
        if (!["granted", "undetermined", "denied"].includes(permission)) return fail("permission_state_invalid");
        const schedules = scheduled;
        const statusFor = (key) => records.find((record) => record.key === key)?.status ?? null;
        const presentFor = (key) => records.find((record) => record.key === key)?.present === true;
        const isPresent = (key) => records.some((record) => record.key === key && record.present);
        const snapshot = {
          schema: "bizq01-native29-private-snapshot-v1",
          capturedAt: new Date().toISOString(),
          deviceTarget: "iPhone 17",
          profile: { kind: typeof profile?.kind === "string" ? profile.kind : null, transitionActive: typeof transition === "boolean" ? transition : null },
          keyInventory: keys.map((key) => ({ key, category: classify(key) })),
          records,
          fences: {
            activeTrainingSessionPresent: presentFor(prefix + "active-training-session"),
            activeDraftPresent: presentFor(prefix + "active-training-session-draft"),
            activeMutationJournalPresent: presentFor(prefix + "journal:active"),
            accountSyncUnsettled: isPresent(prefix + "account-sync") && statusFor(prefix + "account-sync") !== "synced",
            accountSignOutStatePresent: isPresent(prefix + "account-sign-out"),
            accountDeletionStatePresent: isPresent(prefix + "account-deletion"),
          },
          notifications: { permission, totalScheduled: schedules.length,
            appScheduledCount: schedules.filter((request) => request?.content?.data?.source === "practice-reminder").length },
        };
        console.log(marker, JSON.stringify({ ok: true, snapshot }));
      }).catch(() => fail("readonly_platform_query_failed"));
    } catch (error) {
      const message = typeof error?.message === "string" ? error.message : "snapshot_failed";
      fail(message.replace(/[^a-z0-9_-]/giu, "_").slice(0, 80));
    }
  })()`;
}

const { out, port } = parseArgs(process.argv.slice(2));
const outputPath = assertPrivateOutput(out);
const marker = `${MARKER_PREFIX}:${randomUUID()}`;
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("invalid_metro_port");
const pages = await (await fetch(`http://[::1]:${port}/json/list`)).json();
const page = pages.find((entry) => entry.appId === "com.lkurczab.patternly" && entry.deviceName === "iPhone 17");
if (!page?.webSocketDebuggerUrl) throw new Error("target_iphone17_debugger_unavailable");

const socket = new WebSocket(page.webSocketDebuggerUrl, { origin: `http://127.0.0.1:${port}` });
let done = false;
let commandId = 0;
const timeout = setTimeout(() => finish(new Error("inspector_timeout")), 60000);
function finish(error, snapshot) {
  if (done) return;
  done = true;
  clearTimeout(timeout);
  socket.close();
  if (error) {
    console.error(JSON.stringify({ status: "failed", category: error.message || "snapshot_failed" }));
    process.exitCode = 1;
    return;
  }
  for (const record of snapshot.records) if (typeof record.raw === "string") record.sha256 = sha256(record.raw);
  const content = `${JSON.stringify(snapshot, null, 2)}\n`;
  let descriptor;
  try {
    descriptor = openSync(outputPath, "wx", 0o600);
    writeFileSync(descriptor, content, { encoding: "utf8" });
    closeSync(descriptor);
  } catch {
    if (descriptor !== undefined) try { closeSync(descriptor); } catch {}
    console.error(JSON.stringify({ status: "failed", category: "private_output_write_failed" }));
    process.exitCode = 1;
    return;
  }
  const counts = snapshot.keyInventory.reduce((result, entry) => { result[entry.category] = (result[entry.category] ?? 0) + 1; return result; }, {});
  const recordsHash = sha256(snapshot.records.map((record) => `${record.key}\0${record.raw ?? JSON.stringify({ revision: record.revision, status: record.status, payloadFields: record.payloadFields })}`).join("\n"));
  console.log(JSON.stringify({ status: "captured_private_snapshot", output: "private_path_written", keyCount: snapshot.keyInventory.length, categoryCounts: counts, capturedRecordCount: snapshot.records.length, recordsSha256: recordsHash, notifications: snapshot.notifications }));
}

socket.on("open", () => socket.send(JSON.stringify({ id: ++commandId, method: "Runtime.enable" })));
socket.on("message", (data) => {
  let event;
  try { event = JSON.parse(data.toString()); } catch { return; }
  if (event.id === 1) {
    if (event.error) finish(new Error("inspector_enable_failed"));
    else socket.send(JSON.stringify({ id: ++commandId, method: "Runtime.evaluate", params: { expression: expressionSource(marker), awaitPromise: false, returnByValue: true } }));
    return;
  }
  if (event.method !== "Runtime.consoleAPICalled") return;
  const args = event.params?.args;
  if (args?.[0]?.value !== marker || typeof args[1]?.value !== "string") return;
  let message;
  try { message = JSON.parse(args[1].value); } catch { finish(new Error("snapshot_message_invalid")); return; }
  if (!message.ok) { finish(new Error(message.stage || "snapshot_failed")); return; }
  finish(null, message.snapshot);
});
socket.on("error", () => finish(new Error("inspector_connection_failed")));
