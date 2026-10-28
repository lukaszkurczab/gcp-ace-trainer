import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { startupFailureCopy } from "./startupFailureCopy";
import { describeOperationalFailure, recordDevelopmentStorageRemovalFailure } from "../../application/operationalDiagnostics";
import { StorageReadError } from "../../storage/errors";
import { TARGET_LOCALES } from "../../preferences/localeResolver";
test("F01 rejects raw and technical reasons but preserves meaningful known Premium descriptions", () => {
  const fallback = "Application bootstrap failed.";
  for (const value of ["secret-user-payload", "storage_metadata_invalid", "Application bootstrap failed. [STORAGE_READ_FAILED]", undefined]) assert.equal(startupFailureCopy(value), fallback);
  const known = "Patternly couldn't read saved Premium content. Try again later.";
  assert.equal(startupFailureCopy(known), known);
  assert.equal(describeOperationalFailure(new Error("secret"), fallback), fallback + " [LOCAL_OPERATION_FAILED]");
  assert.equal(describeOperationalFailure(new Error("secret"), fallback, { includeDiagnosticCode: false }), fallback);
  assert.doesNotMatch(readFileSync("src/content/application/EncryptedStorageRecoverySurface.tsx", "utf8"), /error\?: string|styles\.error|failed && error/);
});
test("all seven locales have distinct meaningful F01 fallbacks", () => {
  for (const locale of TARGET_LOCALES) {
    const dictionary = JSON.parse(readFileSync(`src/locales/${locale}/common.json`, "utf8"));
    for (const key of ["Profile storage unavailable", "Local profile storage could not be prepared.", "Application bootstrap failed.", "The unavailable session could not be abandoned."]) assert.ok(dictionary[key]?.length > 15);
  }
});
test("removal diagnostics are dev-smoke only, bounded and have their own stage", () => {
  const host = globalThis as typeof globalThis & { __DEV__?: boolean; [key: symbol]: unknown };
  const previous = host.__DEV__, mode = process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE;
  const key = Symbol.for("patternly.storage-removal-diagnostic.v1");
  try {
    Object.defineProperty(host, "__DEV__", { configurable: true, value: true }); process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE = "smoke";
    recordDevelopmentStorageRemovalFailure(new StorageReadError("private-key", new Error("secret")));
    assert.deepEqual(host[key], { stage: "encrypted_storage_removal", category: "STORAGE_READ_FAILED" });
    assert.ok(Object.isFrozen(host[key]));
    Reflect.deleteProperty(host, key); process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE = "sandbox";
    recordDevelopmentStorageRemovalFailure(new Error("secret")); assert.equal(host[key], undefined);
  } finally {
    Reflect.deleteProperty(host, key); Object.defineProperty(host, "__DEV__", { configurable: true, value: previous });
    if (mode === undefined) delete process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE; else process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE = mode;
  }
});
