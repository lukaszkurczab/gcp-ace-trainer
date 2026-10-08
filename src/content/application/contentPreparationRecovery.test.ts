import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("src/content/application/ContentPreparationGate.tsx", "utf8");
const preparationGate = readFileSync("src/application/account/ProfileStoragePreparationGate.tsx", "utf8");
const surface = readFileSync("src/content/application/EncryptedStorageRecoverySurface.tsx", "utf8");
const exactMissingActorFence = readFileSync("src/application/exactMissingActorFence.ts", "utf8");
const accountProvider = readFileSync("src/application/account/AccountSessionProvider.tsx", "utf8");
const homeScreen = readFileSync("src/features/home/HomeScreen.tsx", "utf8");
const homeTab = readFileSync("src/features/home/tabs/HomeTab.tsx", "utf8");
const simulationScreen = readFileSync("src/features/simulation/DesignInterviewSimulationScreens.tsx", "utf8");

test("lost-key recovery uses the typed failure code and the canonical hold-to-remove operation", () => {
  assert.match(preparationGate, /storageFailureCode === "encrypted_storage_key_missing"/);
  assert.match(preparationGate, /removeUnavailableEncryptedStorage\(\)/);
  assert.match(preparationGate, /removalInFlight\.current/);
  assert.match(surface, /<HoldToConfirmButton/);
  assert.match(surface, /hint=\{t\("Hold for at least 3 seconds, then release\. Releasing early cancels\."\)\}/);
  assert.doesNotMatch(surface, /<Text[^>]*>[^<]*\{t\("Hold for at least 3 seconds/u);
  assert.match(surface, /variant="destructive"/);
  assert.match(surface, /PatternlyMark decorative size=\{36\}/);
  assert.match(surface, /accessibilityLabel=\{t\(failed \? "Hold to retry removal" : "Remove unavailable data"\)\}/);
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

test("recovery surface centers recovery states and gives success its own concise layout", () => {
  assert.match(surface, /status === "removing"/);
  assert.match(surface, /Animated\.timing\(removingOpacity/);
  assert.match(surface, /const onPresentationComplete = onRemovingPresentedRef\.current;\s*animation\.start\(\(\{ finished \}\) => \{ onPresentationComplete\(finished\); \}\)/);
  assert.match(surface, /status === "success"/);
  assert.match(surface, /\{success \? \([\s\S]*?styles\.successContent[\s\S]*?\) : \([\s\S]*?styles\.recoveryContent/);
  const successStart = surface.indexOf("{success ? (");
  const successBranch = surface.slice(successStart, surface.indexOf(") : (", successStart));
  assert.match(successBranch, /encryptedStorageContinue/);
  assert.doesNotMatch(successBranch, /styles\.hero|encryptedStorageRetry|styles\.divider|Patternly can now open safely\./);
  assert.match(surface, /Removing unavailable data permanently deletes unsent sessions and Guest progress stored only on this device\./);
  assert.match(surface, /Removing unavailable data permanently deletes unsent sessions and Guest progress stored only on this device\.[\s\S]*?encryptedStorageRetry/);
  assert.match(surface, /accessibilityLabel=\{t\(failed \? "Hold to retry removal" : "Remove unavailable data"\)\}/);
  assert.match(surface, /variant="destructive"/);
  assert.match(surface, /justifyContent: "center"/);
  assert.match(surface, /recoveryContent: \{ alignSelf: "stretch", flex: 1, gap: spacing\.xl, justifyContent: "center", minWidth: 0 \}/);
  assert.match(surface, /title: \{ \.\.\.typography\.heading, alignSelf: "stretch", color: palette\.textPrimary, minWidth: 0, textAlign: "center" \}/);
  assert.match(surface, /brandText: \{ \.\.\.typography\.heading, color: palette\.textPrimary, flexShrink: 1, minWidth: 0 \}/);
  assert.match(surface, /You can retry removal or return to the recovery options/);
  assert.match(surface, /canRetry && !failed \? <Button disabled=\{removing\}/);
  assert.match(surface, /failed \|\| removing \? <Text accessibilityRole="header"/);
  assert.match(surface, /failed \? "Unavailable data removal could not be completed" : "Removing unavailable data"/);
  assert.doesNotMatch(surface, /<Text accessibilityRole="header"[^>]*>\{t\(failed \? "Unavailable data removal could not be completed" : removing \? "Removing unavailable data" : "Remove unavailable data"\)\}/);
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

test("exact-missing abandonment fences both local Guest and authenticated account ownership", () => {
  assert.match(source, /captureExactMissingActorAnchor\(\{[\s\S]*?profile: getActiveStorageProfileOrNull\(\)[\s\S]*?storage: getKeyValueStorage\(\)/u);
  assert.match(source, /captureExactMissingActorFenceAtConfirmation\(\{[\s\S]*?captureCurrentAuthenticatedActorFence: accountRef\.current\.captureCurrentAuthenticatedActorFence/u);
  assert.doesNotMatch(source, /inspectQ13ActorFence|exactMissingActorFence\.current/u);
  assert.match(accountProvider, /captureCurrentAuthenticatedActorFence,/u);
  assert.match(source, /readGuestInstallation: getGuestInstallation/u);
  assert.match(source, /hasGuestAccess,/u);
  assert.match(exactMissingActorFence, /\["guest", "legacy_guest"\]/u);
  assert.match(exactMissingActorFence, /currentInstallation|current\.localDatasetId/u);
  assert.match(exactMissingActorFence, /const actorAndScopeAreCurrent = \(\) => input\.currentActorKind\(\) === "guest"[\s\S]*?hasGuestAccess\(\)/u);
  assert.match(exactMissingActorFence, /const current = await readInstallation\(\);\s*return actorAndScopeAreCurrent\(\) && current\?/u);
  assert.match(exactMissingActorFence, /input\.currentActorKind\(\) === "authenticated"[\s\S]*?isCurrentAccountActor\(\)/u);
  assert.doesNotMatch(source, /validatePreparedGuestAccess/u);
});

test("Premium resume denials keep the verified app shell available without bootstrap diagnostics", () => {
  assert.match(source, /error instanceof TrainingApplicationFailure[\s\S]*?error\.code === "premium_entitlement_denied" \|\| error\.code === "premium_entitlement_unavailable"[\s\S]*?kind: "premium_resume_unavailable"/);
  assert.match(source, /captureHomeResumeActorFence\(\)/);
  assert.match(source, /resumeActorFence\?\.isCurrent\(\)/);
  assert.match(source, /state\.actorFence\.isCurrent\(\)/);
  assert.match(accountProvider, /captureHomeResumeActorFence = useCallback[\s\S]*?captureCurrentAuthenticatedActorFence\(\)[\s\S]*?isCurrentLocalOfflineActor\(current\)/);
  assert.match(source, /kind: "home_ready_resume_unavailable"/);
  assert.match(source, /clearAfterSuccessfulResume/);
  assert.match(source, /clearIfSessionChanged/);
  assert.doesNotMatch(source, /DevelopmentBootstrapDiagnostic|PatternlyBootstrap(Read|Resume)|resumeSubstage|console\.warn/);
});

test("the Premium resume notice stays bound to the exact active session and clears only after canonical resume", () => {
  assert.match(homeScreen, /unavailableResumeSession = homeResumeContext\?\.unavailable\?\.sessionId === data\.activeSession\?\.id \? data\.activeSession : null/);
  assert.match(homeScreen, /resumeUnavailableReason = homeResumeContext\?\.unavailable && homeResumeContext\.unavailable\.sessionId === homeActiveSession\?\.id[\s\S]*?homeResumeContext\.unavailable\.reason/);
  assert.match(homeScreen, /resumeUnavailableReason=\{resumeUnavailableReason\}/);
  assert.match(homeScreen, /const session = await resumeActiveTrainingSession\(\);[\s\S]*?homeResumeContext\?\.clearAfterSuccessfulResume\(session\.id\);[\s\S]*?navigation\.navigate/);
  const simulationRetry = homeScreen.slice(homeScreen.indexOf('if (action.modeId === "design-interview-simulation")'), homeScreen.indexOf("const admission = await account.authorizePremiumSessionStart()"));
  assert.match(simulationRetry, /homeResumeContext\?\.unavailable\?\.sessionId === action\.sessionId[\s\S]*?await resumeActiveTrainingSession\(\)[\s\S]*?buildDesignInterviewSimulationResumeRoute\(session\)/);
  assert.doesNotMatch(simulationRetry, /clearAfterSuccessfulResume/);
  assert.match(homeTab, /resumeUnavailableReason === "premium_entitlement_denied" \? "Premium access required" : "Premium access unavailable"/);
  assert.match(homeTab, /decisionLabel = hasActiveSession[\s\S]*?"Resume session"/);
  assert.match(simulationScreen, /openDesignInterviewSimulation\([\s\S]*?\.then\(\(next\) => \{[\s\S]*?route\.params\.expectedSessionId === next\.session\.id[\s\S]*?clearAfterSuccessfulResume\(next\.session\.id\)/);
  assert.doesNotMatch(homeScreen, /clearAfterSuccessfulResume\([^\n]*\);\s*navigation\.navigate\(route\.name/);
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
