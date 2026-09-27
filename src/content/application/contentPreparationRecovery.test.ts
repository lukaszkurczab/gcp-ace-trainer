import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("src/content/application/ContentPreparationGate.tsx", "utf8");
const preparationGate = readFileSync("src/application/account/ProfileStoragePreparationGate.tsx", "utf8");
const surface = readFileSync("src/content/application/EncryptedStorageRecoverySurface.tsx", "utf8");

test("lost-key recovery uses the typed failure code and the canonical hold-to-remove operation", () => {
  assert.match(preparationGate, /storageFailureCode === "encrypted_storage_key_missing"/);
  assert.match(preparationGate, /removeUnavailableEncryptedStorage\(\)/);
  assert.match(preparationGate, /removalInFlight\.current/);
  assert.match(surface, /<HoldToConfirmButton/);
  assert.match(surface, /hint=\{t\("Hold for at least 3 seconds, then release\. Releasing early cancels\."\)\}/);
  assert.doesNotMatch(surface, /<Text[^>]*>[^<]*\{t\("Hold for at least 3 seconds/u);
  assert.match(surface, /variant="secondary"/);
  assert.match(surface, /PatternlyMark decorative size=\{36\}/);
  assert.match(surface, /justifyContent: "flex-start"/);
  assert.doesNotMatch(source, /setConfirmUnavailableDataRemoval/);
  assert.doesNotMatch(source, /clearPatternlyLocalHistory/);
});

test("lost-key recovery keeps removal, success, error, and bootstrap transitions explicit", () => {
  const removal = preparationGate.slice(preparationGate.indexOf("const removeUnavailableData"), preparationGate.indexOf("const lostKey"));
  assert.match(removal, /setRecoveryStatus\("removing"\)/);
  assert.match(removal, /if \(!await presented\) \{\s*if \(mounted\.current && removalAttempt\.current === attempt\) setRecoveryStatus\("base"\)/);
  assert.match(removal, /if \(!mounted\.current \|\| removalAttempt\.current !== attempt\) return;\s*await removeUnavailableEncryptedStorage\(\);\s*if \(!mounted\.current \|\| removalAttempt\.current !== attempt\) return;/);
  assert.match(removal, /await removeUnavailableEncryptedStorage\(\)/);
  assert.match(removal, /setRecoveryStatus\("success"\)/);
  assert.match(removal, /setRecoveryStatus\("error"\)/);
  assert.doesNotMatch(removal, /retry\(\)/);
  assert.match(preparationGate, /onContinue=\{retry\}/);
  assert.match(preparationGate, /onRetryBootstrap=\{retryLostKeyPreparation\}/);
  assert.match(preparationGate, /canRetry=\{auditPresentation !== "retry-limit" && canStartManualRetry\(manualRetry\.current\)\}/);
  assert.match(preparationGate, /retryLimitReached=\{auditPresentation === "retry-limit" \|\| manualRetry\.current\.failedAttempts >= 5\}/);
  assert.match(preparationGate, /onReturn=\{\(\) => \{ setRemovalError\(undefined\); setRecoveryStatus\("base"\); \}\}/);
  assert.doesNotMatch(source, /encrypted_storage_key_missing|EncryptedStorageRecoverySurface/u);
});

test("manual lost-key retries are process-local and automatic bootstrap does not spend the limit", () => {
  assert.match(preparationGate, /const manualRetry = useRef\(createManualRetryLimit\(\)\)/);
  assert.match(preparationGate, /settleManualRetry\(manualRetry\.current, false\)/);
  assert.match(preparationGate, /const retryLostKeyPreparation = \(\) => \{\s*if \(!reserveManualRetry\(manualRetry\.current\)\) return;/);
  assert.match(surface, /You’ve reached the retry limit/);
  assert.doesNotMatch(surface, /Hold for at least 3 seconds, then release[^<]*<\/Text>/u);
});

test("recovery surface preserves one stable, localized, accessible layout for every state", () => {
  assert.match(surface, /status === "removing"/);
  assert.match(surface, /Animated\.timing\(removingOpacity/);
  assert.match(surface, /const onPresentationComplete = onRemovingPresentedRef\.current;\s*animation\.start\(\(\{ finished \}\) => \{ onPresentationComplete\(finished\); \}\)/);
  assert.match(surface, /status === "success"/);
  assert.match(surface, /status === "error"/);
  assert.match(surface, /accessibilityLiveRegion=\{failed \? "assertive" : "polite"\}/);
  assert.match(surface, /accessibilityRole=\{failed \? "alert" : undefined\}/);
  assert.match(surface, /name="alert-triangle"/);
  assert.match(surface, /recoveryDeviceLocale\(Settings\.get\("AppleLanguages"\), Settings\.get\("AppleLocale"\)\)/);
  assert.match(surface, /i18n\.getFixedT\(locale, "common"\)/);
  assert.match(preparationGate, /operationalDiagnosticCode\(error\)/);
  assert.doesNotMatch(surface, /Nothing else changed/);
  assert.doesNotMatch(source, /Unavailable local data could not be removed/);
  assert.match(surface, /accessibilityRole="header"/);
  assert.match(surface, /disabled=\{removing\}/);
  assert.match(surface, /loading=\{removing\}/);
  assert.match(surface, /maxFontSizeMultiplier=\{2\}/);
  assert.doesNotMatch(surface, /EmptyState|SettingsBottomSheet|Modal/);
});

test("unavailable active content is a typed gate with explicit abandon and retry paths", () => {
  assert.match(source, /kind: "content_identity_unavailable"/);
  assert.match(source, /abandonUnavailableActiveTrainingSession\(sessionId\)/);
  assert.match(source, /runtimeSelectors\.content\.unavailableActive\(\)/);
  assert.match(source, /runtimeSelectors\.content\.unavailableActiveConfirm\(\)/);
  assert.match(source, /runtimeSelectors\.content\.unavailableActiveRetry\(\)/);
  assert.match(source, /An active session uses content that is no longer available/);
  assert.match(source, /setBootstrapRevision\(\(revision\) => revision \+ 1\)/);
  assert.doesNotMatch(source, /contentIdentityUnavailableRepository/);
});

test("bootstrap diagnostics are wired only through the development branch as one structural observer", () => {
  assert.match(source, /__DEV__\s*\?\s*\{\s*diagnosticObserver:\s*recordDevelopmentBootstrapDiagnostic\s*\}\s*:\s*undefined/);
  assert.equal((source.match(/diagnosticObserver:\s*recordDevelopmentBootstrapDiagnostic/g) ?? []).length, 1);
  assert.equal((source.match(/clearDevelopmentBootstrapDiagnostic\(\)/g) ?? []).length, 2);
  assert.match(source, /if \(__DEV__\) clearDevelopmentBootstrapDiagnostic\(\);[\s\S]*?return bootstrapApplication/);
  assert.match(source, /if \(result\.kind === "ready"\) \{\s*if \(__DEV__\) clearDevelopmentBootstrapDiagnostic\(\);[\s\S]*?complete\(\{ kind: "ready" \}\)/);
  assert.doesNotMatch(source, /console\.(?:log|debug|info|warn|error)\s*\(/);
});

test("the recovery presentation fixture is development-smoke only and never calls storage operations", () => {
  const auditEffect = preparationGate.slice(
    preparationGate.indexOf("if (!__DEV__ || !isPatternlySmokeRuntime()) return;"),
    preparationGate.indexOf("}, []);", preparationGate.indexOf("if (!__DEV__ || !isPatternlySmokeRuntime()) return;")),
  );
  assert.match(auditEffect, /parseStorageRecoveryAuditCommand/);
  assert.match(auditEffect, /storageFailureCode: "encrypted_storage_key_missing"/);
  assert.doesNotMatch(auditEffect, /prepareProfileStorage|inspectPreparedProfileState|removeUnavailableEncryptedStorage|createNativeLocalLogoutControl/);
  assert.match(preparationGate, /canRetry=\{auditPresentation !== "retry-limit" && canStartManualRetry\(manualRetry\.current\)\}/);
  assert.match(preparationGate, /auditPresentation === "retry-limit" \|\| manualRetry\.current\.failedAttempts >= 5/);
});
