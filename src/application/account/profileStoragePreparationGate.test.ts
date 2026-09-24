import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const gate = readFileSync("src/application/account/ProfileStoragePreparationGate.tsx", "utf8");
const context = readFileSync("src/application/account/profileStoragePreparationContext.tsx", "utf8");
const preferences = readFileSync("src/preferences/AppPreferencesProvider.tsx", "utf8");

test("preparation gate opens registry metadata without activating or reading a profile", () => {
  assert.match(gate, /prepareProfileStorage\(\)/);
  assert.match(context, /createContext<PreparedProfileState \| null>/);
  assert.match(gate, /prepareProfileStorage\(\)\.then\(\(\) => inspectPreparedProfileState\(\)\)/);
  assert.match(gate, /<PreparedProfileStorageContext\.Provider value=\{state\.profile\}>\{children\}<\/PreparedProfileStorageContext\.Provider>/);
  assert.doesNotMatch(gate, /initializeKeyValueStorage|activatePreparedProfile|getActiveStorageProfile|getKeyValueStorage|bootstrapApplication|ContentPreparationGate/u);
});

test("preferences remain on defaults until storage activation emits the ready event", () => {
  assert.match(preferences, /useState<Settings>\(DEFAULT_APP_SETTINGS\)/);
  assert.match(preferences, /onKeyValueStorageReady\(load\)/);
  assert.doesNotMatch(preferences, /initializeKeyValueStorage|prepareProfileStorage|activatePreparedProfile/u);
});

test("preparation failure is explicit, retryable, and counts only reserved lost-key retries", () => {
  assert.match(gate, /encryptedStorageFailureCode\(error\)/);
  assert.match(gate, /storageFailureCode === "encrypted_storage_key_missing"/);
  assert.match(gate, /reserveManualRetry\(manualRetry\.current\)/);
  assert.match(gate, /settleManualRetry\(manualRetry\.current, false\)/);
  assert.match(gate, /<EmptyState actionLabel=\{t\("Try again"\)\} description=\{state\.reason\} onActionPress=\{retry\}/);
  assert.match(gate, /retryLimitReached=\{manualRetry\.current\.failedAttempts >= 5\}/);
});

test("key-loss recovery preserves delayed confirmed removal and requires preparation again afterward", () => {
  assert.match(gate, /presentationWaiter\.current = \{ attempt, resolve \}/);
  assert.match(gate, /if \(!await presented\) \{/);
  assert.match(gate, /await removeUnavailableEncryptedStorage\(\)/);
  assert.match(gate, /onContinue=\{retry\}/);
  assert.match(gate, /onRemove=\{\(\) => \{ void removeUnavailableData\(\); \}\}/);
  assert.match(gate, /onRemovingPresented=/);
});
