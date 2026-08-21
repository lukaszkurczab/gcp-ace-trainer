import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { canStartCanonicalSimulationMutation, CanonicalProductContractValidationError, CanonicalUserFacingTaskReadinessError, getCanonicalRequirementTestCoverage, isDeclaredCanonicalSessionTransition, loadCanonicalProductContract, parseCanonicalProductContract, resolveCanonicalUserFacingTaskDesignReference } from "../scripts/validateCanonicalProductContract";

const validContract = readFileSync("docs/canonical-product-contract.yaml", "utf8");
test("parses the canonical product contract", () => {
  const contract = loadCanonicalProductContract();
  assert.equal(contract.version, 2);
  assert.equal(contract.authority.normativeSource, "canonical-product-contract");
  assert.equal(contract.authority.narrativeDocuments, "non-normative");
});

test("keeps mode matrices and fixed configuration values out of narrative docs", () => {
  const narrativeDocs = [
    "docs/03-navigation-and-flows.md",
    "docs/00-overview.md",
    "docs/04-data-model.md",
    "docs/05-design-system.md",
    "docs/06-branding-and-style-direction.md",
    "docs/08-storage-and-offline.md",
    "docs/11-implementation-guidelines.md",
    "docs/12-testing-strategy.md",
    "docs/15-certification-track-learning-system.md",
    "docs/16-coding-interview-learning-system.md",
    "docs/17-training-runtime-and-interaction-spec.md",
    "docs/designs/README.md",
    "docs/designs/product-direction-options/DESIGN.md",
  ];
  const removedMatrixConstructs = [
    /\|\s*Mode\s*\|\s*Default length\s*\|/,
    /Supported requested lengths/,
    /Coding Interview supports exactly these modes:/,
    /Certification supports exactly these modes:/,
    /Coding Interview has exactly these user-facing modes:/,
    /Reinsert is enabled only (?:for|in):/,
    /at least three other (?:durable )?submitted items/,
    /three-item gap/,
    /maximum-one (?:rule|reinsert)/,
    /prefer a reviewed variant of the same mechanism/,
    /exact source item is used only when no compatible reviewed variant exists/,
    /45-minute (?:foreground|active-foreground) countdown/,
    /exactly 40 (?:unique )?(?:items|occurrences)/,
    /max\(0, 45 minutes - canonicalActiveForegroundMs\)/,
  ];

  for (const path of narrativeDocs) {
    const source = readFileSync(path, "utf8");
    for (const construct of removedMatrixConstructs) {
      assert.doesNotMatch(source, construct, `${path} must not maintain ${construct}`);
    }
  }
});

test("maps every canonical requirement to real tests and rejects incomplete or invalid mappings", () => {
  const contract = loadCanonicalProductContract();
  assert.deepEqual(
    getCanonicalRequirementTestCoverage(contract).map(({ requirementId, tests }) => [requirementId, tests.map((test) => test.id)]),
    [
      ["CONTRACT-AUTHORITY-001", ["canonical-contract-authority"]],
      ["ACCOUNT-ENTRY-IDENTITY-001", ["canonical-account-entry-identity"]],
      ["ACCOUNT-LIFECYCLE-001", ["canonical-account-lifecycle"]],
      ["ACCOUNT-DATA-AUTHORITY-001", ["canonical-account-data-authority"]],
      ["ACCOUNT-DATA-ADOPTION-001", ["canonical-account-adoption-sync-conflicts"]],
      ["ACCOUNT-SYNC-CONFLICT-001", ["canonical-account-adoption-sync-conflicts"]],
      ["ACCOUNT-OFFLINE-SESSION-001", ["canonical-account-lifecycle"]],
      ["ACCOUNT-SIGNOUT-DELETION-001", ["canonical-account-signout-deletion"]],
      ["ACCOUNT-SECURITY-PRIVACY-001", ["canonical-account-entry-identity"]],
      ["ACCOUNT-PREMARKET-HOSTING-001", ["canonical-account-entry-identity", "canonical-account-premarket-hosting"]],
      ["ACCOUNT-SURFACE-MAP-001", ["canonical-account-surface-map"]],
      ["CODING-INTERVIEW-MODE-MATRIX-001", ["canonical-coding-interview-mode-matrix"]],
      ["CODING-INTERVIEW-CUSTOM-PRACTICE-001", ["canonical-custom-practice-contract"]],
      ["PRACTICE-SETUP-RECOVERY-COPY-001", ["practice-setup-recovery-copy"]],
      ["PRACTICE-SETUP-PRESENTATION-001", ["practice-setup-recovery-copy"]],
      ["HOME-PRESENTATION-001", ["home-presentation"]],
      ["CERTIFICATION-RESULT-TRUTHFUL-001", ["certification-result-truthful-summary"]],
      ["CODING-INTERVIEW-INDEPENDENT-PRACTICE-001", ["canonical-independent-practice-contract"]],
      ["CODING-INTERVIEW-PROGRESS-EVIDENCE-001", ["coding-interview-progress-evidence-contract"]],
      ["TRACK-PRESENTATION-001", ["track-presentation-contract"]],
      ["RESEARCH-BUILD-SETTINGS-001", ["research-build-settings-contract"]],
      ["APP-IDENTITY-001", ["patternly-build-identity-contract"]],
      ["USER-TESTING-CORE-JOURNEY-001", ["user-testing-core-journey-contract"]],
      ["CODING-INTERVIEW-CUSTOM-IMMEDIATE-FEEDBACK-001", ["custom-practice-immediate-feedback-flow"]],
      ["CODING-INTERVIEW-CUSTOM-DEFERRED-FEEDBACK-001", ["custom-practice-deferred-feedback-withholding"]],
      ["CODING-INTERVIEW-CUSTOM-DEFERRED-SUMMARY-001", ["custom-practice-deferred-summary-relaunch"]],
      ["CODING-INTERVIEW-CUSTOM-REINSERT-OWNERSHIP-001", ["custom-practice-reinsert-ownership", "custom-practice-reinsert-override-rejection"]],
      ["CODING-INTERVIEW-REINSERT-POLICY-001", ["canonical-coding-interview-reinsert-policy"]],
      ["CERTIFICATION-MODE-MATRIX-001", ["canonical-certification-mode-matrix"]],
      ["CERTIFICATION-DIAGNOSTIC-BASELINE-001", ["certification-diagnostic-baseline"]],
      ["CERTIFICATION-FOCUS-PRACTICE-001", ["certification-focus-practice"]],
      ["CERTIFICATION-SCENARIO-PRACTICE-001", ["certification-scenario-practice"]],
      ["CERTIFICATION-WEAK-AREA-REVIEW-001", ["certification-weak-area-review"]],
      ["CERTIFICATION-MIXED-PRACTICE-001", ["certification-mixed-practice"]],
      ["CERTIFICATION-QUICK-REVIEW-001", ["certification-quick-review"]],
      ["USER-COMMAND-MODEL-001", ["canonical-session-command-model"]],
      ["USER-COMMAND-RESUME-001", ["canonical-session-command-model"]],
      ["SIMULATION-SAVE-AND-CONTINUE-001", ["coding-interview-save-and-continue-command"]],
      ["SIMULATION-SAVE-AND-CONTINUE-VERIFICATION-001", ["coding-interview-save-and-continue-verification"]],
      ["SIMULATION-SAVE-AND-CONTINUE-RECOVERY-001", ["coding-interview-save-and-continue-recovery"]],
      ["SIMULATION-SAVE-AND-CONTINUE-CTA-001", ["simulation-save-and-continue-cta"]],
      ["SIMULATION-FINAL-OCCURRENCE-001", ["simulation-final-occurrence"]],
      ["SIMULATION-SAVE-AND-JUMP-001", ["coding-interview-save-and-jump-command"]],
      ["SIMULATION-RELAUNCH-001", ["coding-interview-simulation-relaunch"]],
      ["SIMULATION-SAVE-AND-CONTINUE-IDEMPOTENCY-001", ["coding-interview-save-and-continue-idempotency"]],
      ["SIMULATION-FULL-LIFECYCLE-001", ["coding-interview-simulation-full-lifecycle"]],
      ["SIMULATION-TIMER-UI-REFRESH-001", ["coding-interview-simulation-timer-ui-refresh"]],
      ["SIMULATION-TIMER-CHECKPOINT-INTERVAL-001", ["coding-interview-simulation-timer-checkpoint-interval"]],
      ["SIMULATION-TIMER-BACKGROUND-CHECKPOINT-001", ["coding-interview-simulation-timer-background-checkpoint"]],
      ["SIMULATION-TIMER-FINALIZATION-CHECKPOINT-001", ["coding-interview-simulation-timer-finalization-checkpoint"]],
      ["SIMULATION-TIMER-MUTATION-SERIALIZATION-001", ["coding-interview-simulation-timer-mutation-serialization"]],
      ["SIMULATION-TIMER-FORCE-CLOSE-BOUNDARY-001", ["coding-interview-simulation-timer-force-close-boundary"]],
      ["SIMULATION-ACTIVE-SCREEN-FIDELITY-001", ["simulation-active-screen-fidelity"]],
      ["SIMULATION-NAVIGATOR-FIDELITY-001", ["simulation-navigator-fidelity"]],
      ["SIMULATION-OPERATION-STATE-ACTIONS-001", ["simulation-operation-state-rendering", "simulation-operation-state-resume-editing"]],
      ["SIMULATION-ACCESSIBILITY-001", ["simulation-accessibility"]],
      ["SESSION-STATE-MACHINE-001", ["canonical-session-state-machine"]],
      ["SIMULATION-CONCURRENCY-001", ["canonical-simulation-concurrency"]],
      ["SIMULATION-TIMER-CADENCE-001", ["canonical-simulation-timer-cadence"]],
      ["NARRATIVE-DOCS-CANONICALIZATION-001", ["canonical-narrative-docs"]],
      ["DESIGN-REFERENCE-REGISTRY-001", ["canonical-design-reference-readiness"]],
      ["COMMERCIAL-ENTITLEMENT-001", ["canonical-commercial-guest-identity"]],
      ["GUEST-FREE-001", ["canonical-commercial-guest-identity"]],
      ["GUEST-INSTALLATION-001", ["guest-installation-repository"]],
      ["IDENTITY-SECURITY-001", ["canonical-commercial-guest-identity"]],
      ["ENVIRONMENT-PUBLIC-LINKS-001", ["canonical-commercial-guest-identity"]],
      ["APPROVED-CLIENT-ENVIRONMENT-001", ["approved-client-environment-boundary"]],
      ["DEVICE-SESSION-SYNC-001", ["canonical-session-sync-surfaces-products"]],
      ["PRODUCT-SURFACES-GOALS-001", ["canonical-session-sync-surfaces-products"]],
      ["LEARNING-PRODUCTS-001", ["canonical-session-sync-surfaces-products"]],
      ["LAUNCH-TRACK-SCOPE-001", ["track-registry-admission"]],
      ["TRACK-REGISTRY-ADMISSION-001", ["track-registry-admission"]],
      ["TRACK-BRIEF-SOURCE-IDENTITY-001", ["track-registry-admission"]],
      ["FREE-NODE-EXPERIENCE-PROFILE-001", ["free-node-package-admission"]],
      ["FREE-NODE-PACKAGE-ADMISSION-001", ["free-node-package-admission"]],
      ["TRACK-IDENTITY-CUTOVER-001", ["track-identity-cutover"]],
      ["CONTENT-PACKAGES-001", ["canonical-packages-operations-platform"]],
      ["CONTENT-PACKAGE-RESOLVER-001", ["content-packages-verifier-resolver"]],
      ["FREE-PACKAGE-RUNTIME-CUTOVER-001", ["free-package-runtime-cutover"]],
      ["CONTENT-PACKAGE-RUNTIME-CATALOG-001", ["content-package-runtime-catalog"]],
      ["CONTENT-PACKAGE-FAMILY-DISPATCH-001", ["free-package-runtime-cutover"]],
      ["CONTENT-PACKAGE-NATIVE-RUNTIME-001", ["content-package-native-runtime"]],
      ["ANALYTICS-REPORTS-001", ["canonical-packages-operations-platform"]],
      ["BACKUP-RESTORE-001", ["canonical-packages-operations-platform"]],
      ["PLATFORM-RELEASE-001", ["canonical-packages-operations-platform"]],
      ["BRAND-DESIGN-AUTHORITY-001", ["canonical-brand-design-authority"]],
    ],
  );
  assert.throws(
    () => parseCanonicalProductContract(validContract.replace("id: canonical-coding-interview-mode-matrix", "id: canonical-contract-authority")),
    /Duplicate canonical requirement test identifier: canonical-contract-authority/,
  );
  assert.throws(
    () => parseCanonicalProductContract(validContract.replace("requirementIds: [CONTRACT-AUTHORITY-001]", "requirementIds: [UNKNOWN-REQUIREMENT-001]")),
    /Canonical requirement test references an unknown requirement: canonical-contract-authority -> UNKNOWN-REQUIREMENT-001/,
  );
  assert.throws(
    () => parseCanonicalProductContract(validContract.replace("requirementIds: [CONTRACT-AUTHORITY-001]", "requirementIds: [USER-COMMAND-MODEL-001]")),
    /Canonical requirement has no mapped test: CONTRACT-AUTHORITY-001/,
  );
});

test("defines guest-first account entry and credential boundaries", () => {
  const { publicLaunchEntry, credentials, lifecycle, networkAndPrivacy } = loadCanonicalProductContract().accountData;
  assert.deepEqual(publicLaunchEntry, {
    firstLearningValueRequiresAccount: false,
    guestIdentity: "localInstallation",
    accountRequiredFor: ["premiumPurchase", "synchronization", "restore", "crossDeviceContinuity"],
    identityMethods: ["emailPassword", "signInWithApple", "signInWithGoogle", "recoveryCodes"],
    canonicalIdentifier: "stableOpaquePatternlyAccountId",
    firebaseAnonymousAuthentication: "prohibited",
  });
  assert.deepEqual(credentials, {
    passwordTransmission: "tlsOnlyForRegisterSignInResetAndReauthentication",
    passwordPersistenceInApp: "prohibited",
    passwordPersistenceRemote: "oneWayVerifierOnly",
    accessTokenPersistence: "memoryOnly",
    accessTokenTransport: "receiveInTlsResponseBodySendInAuthorizationBearerHeaderOnly",
    refreshTokenPersistence: "osProtectedCredentialStorage",
    refreshTokenTransport: "receiveInTlsResponseBodySendOnlyToTokenEndpointTlsRequestBody",
    possessionTokenPersistenceInPatternlyStores: "prohibited",
    tokenLoggingInPatternlyControlledLogs: "prohibited",
  });
  assert.deepEqual(lifecycle.verificationLink, { transport: "verifiedHttpsUniversalLink", tokenKind: "verificationActionCode", singleUse: "providerControlled", expiry: "providerControlled" });
  assert.deepEqual(lifecycle.recoveryLink, { transport: "verifiedHttpsUniversalLink", tokenKind: "recoveryActionCode", singleUse: "providerControlled", expiry: "providerControlled" });
  assert.deepEqual(lifecycle.publicDeletionLink, { transport: "verifiedHttpsUniversalLink", tokenKind: "publicDeletionPossessionToken", singleUse: true, expiresAfterMinutes: 30 });
  assert.deepEqual(networkAndPrivacy, {
    transmittedFields: {
      identity: ["normalizedEmail", "passwordOnlyAtCredentialCommand", "verificationToken", "recoveryToken", "publicDeletionPossessionToken"],
      credentialTransport: ["accessTokenOnlyInAuthorizationBearerHeader", "refreshTokenOnlyInTokenEndpointTlsRequestBody"],
      account: ["accountId", "verificationState", "sessionId", "accountRevision"],
      learning: ["recordType", "recordId", "recordRevision", "contentReferences", "canonicalLearningPayload", "operationFingerprint"],
      operations: ["requestId", "boundedErrorCode", "clientTimestamp"],
    },
    transport: "authenticatedTls",
    emailDelivery: "transactionalOnlyWithRateLimitAndNonEnumeratingRecoveryResponse",
    patternlyControlledLogExclusions: ["password", "accessToken", "refreshToken", "verificationToken", "recoveryToken", "publicDeletionPossessionToken", "normalizedEmail", "learnerResponse", "promptText", "explanationText", "draftPayload", "attemptPayload", "reviewPayload", "progressPayload", "journalPayload", "exportPayload", "deletionIntentPayload"],
  });
});

test("defines every account lifecycle transition and explicit failure outcome", () => {
  const { lifecycle, offlineAndExpiry } = loadCanonicalProductContract().accountData;
  assert.equal(lifecycle.initialState, "signedOut");
  assert.equal(lifecycle.resendVerificationResult, "invalidatesPriorVerificationTokenAndSendsReplacement");
  assert.equal(lifecycle.changePendingEmailResult, "replacesNormalizedEmailInvalidatesPriorVerificationTokenAndSendsReplacement");
  assert.deepEqual(lifecycle.operations, [
    { id: "register", surfaceId: "register", from: ["signedOut"], inProgress: "registering", success: "verificationPending", failureTransitions: [{ failures: ["invalidInput", "duplicateIdentity", "rateLimited", "offline", "remoteFailure"], to: "signedOut" }] },
    { id: "verifyIdentity", surfaceId: "verifyIdentity", from: ["verificationPending"], inProgress: "verifying", success: "authenticatedSyncing", failureTransitions: [{ failures: ["invalidLink", "expiredLink", "usedLink", "rateLimited", "offline", "remoteFailure"], to: "verificationPending" }] },
    { id: "resendVerification", surfaceId: "verifyIdentity", from: ["verificationPending"], inProgress: "verificationPending", success: "verificationPending", failureTransitions: [{ failures: ["rateLimited", "offline", "remoteFailure"], to: "verificationPending" }] },
    { id: "changePendingEmail", surfaceId: "verifyIdentity", from: ["verificationPending"], inProgress: "verificationPending", success: "verificationPending", failureTransitions: [{ failures: ["invalidInput", "duplicateIdentity", "rateLimited", "offline", "remoteFailure"], to: "verificationPending" }] },
    { id: "signIn", surfaceId: "signIn", from: ["signedOut"], inProgress: "signingIn", success: "authenticatedSyncing", failureTransitions: [{ failures: ["invalidCredential", "unverifiedIdentity", "rateLimited", "offline", "remoteFailure"], to: "signedOut" }] },
    { id: "requestRecovery", surfaceId: "forgotPassword", from: ["signedOut"], inProgress: "recoveryPending", success: "recoveryPending", failureTransitions: [{ failures: ["invalidInput", "rateLimited", "offline", "remoteFailure"], to: "signedOut" }] },
    { id: "resetPassword", surfaceId: "resetPassword", from: ["recoveryPending"], inProgress: "resettingPassword", success: "signedOut", failureTransitions: [{ failures: ["invalidInput", "invalidLink", "expiredLink", "usedLink", "rateLimited", "offline", "remoteFailure"], to: "recoveryPending" }] },
    { id: "completeInitialSync", surfaceId: "dataAdoption", from: ["authenticatedSyncing"], inProgress: "authenticatedSyncing", success: "authenticatedReady", failureTransitions: [{ failures: ["adoptionConflict", "remoteFailure"], to: "authenticatedSyncing" }, { failures: ["offline"], to: "authenticatedSyncing" }] },
    { id: "enterOffline", surfaceId: "syncStatus", from: ["authenticatedReady"], inProgress: "offlineAuthenticated", success: "offlineAuthenticated", failureTransitions: [] },
    { id: "restoreNetwork", surfaceId: "syncStatus", from: ["offlineAuthenticated"], inProgress: "authenticatedSyncing", success: "authenticatedSyncing", failureTransitions: [{ failures: ["offline", "remoteFailure"], to: "offlineAuthenticated" }] },
    { id: "expireSession", surfaceId: "sessionExpiredReauthentication", from: ["authenticatedSyncing", "authenticatedReady"], inProgress: "sessionExpired", success: "reauthenticationRequired", failureTransitions: [] },
    { id: "reauthenticate", surfaceId: "sessionExpiredReauthentication", from: ["sessionExpired", "reauthenticationRequired"], inProgress: "reauthenticationRequired", success: "authenticatedSyncing", failureTransitions: [{ failures: ["invalidCredential", "revokedSession", "rateLimited", "offline", "remoteFailure"], to: "reauthenticationRequired" }] },
    { id: "signOut", surfaceId: "signOut", from: ["authenticatedSyncing", "authenticatedReady", "offlineAuthenticated", "reauthenticationRequired"], inProgress: "signingOut", success: "signedOut", failureTransitions: [{ failures: ["journalRecoveryFailure", "pendingSyncRequiresNetwork", "exportRequired", "localDeletionFailure"], to: "exactSourceState" }] },
    { id: "deleteAccount", surfaceId: "deleteAccount", from: ["authenticatedReady", "deletionFailed"], inProgress: "deletionPending", success: "deleted", failureTransitions: [{ failures: ["journalRecoveryFailure"], to: "exactSourceState" }, { failures: ["reauthenticationRequired"], to: "reauthenticationRequired" }, { failures: ["rateLimited", "offline", "remoteFailure", "deletionVerificationFailure"], to: "deletionFailed" }] },
    { id: "completeRemoteDeletionCleanup", surfaceId: "syncStatus", from: ["authenticatedSyncing", "reauthenticationRequired", "deletionFailed"], inProgress: "deletionPending", success: "deleted", failureTransitions: [{ failures: ["journalRecoveryFailure", "localDeletionFailure"], to: "deletionFailed" }] },
  ]);
  assert.deepEqual(offlineAndExpiry, {
    offlineEntryRequires: "previouslyVerifiedBoundAccountValidatedLocalDatasetAndSuccessfulAuthenticatedSync",
    learningAvailability: "localPracticeReviewProgressAndResumeRemainAvailable",
    mutationResult: "commitLocallyThenExposeOfflinePending",
    unavailableOffline: ["register", "verifyIdentity", "signIn", "requestRecovery", "resetPassword", "reauthenticate", "firstBootstrap", "remoteRestore", "accountDeletion", "publicDeletionVerification"],
    serverDeclaredRevocationResult: "reauthenticationRequiredAndSyncBlocked",
    expiredAccessTokenWhileOffline: "continueBoundLocalLearningButBlockSyncAndSecurityActionsUntilReauthentication",
  });
});

test("assigns every account and device record to one authority and sync policy", () => {
  assert.deepEqual(loadCanonicalProductContract().accountData.dataAuthority, {
    localDurabilityAuthority: "canonicalLocalRepositorySet",
    remoteConvergenceAuthority: "singleRevisionedAccountDataset",
    synchronizationBoundary: "accountDataRepositoryService",
    localCommitBeforeRemoteAcknowledgement: "required",
    parallelLearningRepository: "prohibited",
    indexPolicy: "indexesFollowOwningRecordClassAndAreNeverIndependentAuthority",
    recordClasses: [
      { id: "storageMetadata", owner: "device", remoteSync: "never" },
      { id: "accountBinding", owner: "accountAndDevice", remoteSync: "identityReferenceOnly" },
      { id: "syncMetadataAndOutbox", owner: "accountAndDevice", remoteSync: "operationEnvelopeOnly" },
      { id: "applicationSettings", owner: "device", remoteSync: "never" },
      { id: "notificationSettings", owner: "device", remoteSync: "never" },
      { id: "activeTrack", owner: "account", remoteSync: "revisioned" },
      { id: "activeSessionReference", owner: "device", remoteSync: "never" },
      { id: "trainingSession", owner: "device", remoteSync: "terminalFactsOnly" },
      { id: "trainingSessionResult", owner: "account", remoteSync: "immutableById" },
      { id: "trainingAttempt", owner: "account", remoteSync: "immutableById" },
      { id: "reviewQueueEntry", owner: "account", remoteSync: "revisioned" },
      { id: "simulationDraft", owner: "device", remoteSync: "never" },
      { id: "foregroundTimer", owner: "device", remoteSync: "never" },
      { id: "mutationJournal", owner: "deviceOperational", remoteSync: "never" },
      { id: "accountDeletionIntent", owner: "deviceOperational", remoteSync: "never" },
    ],
    derivedProjections: [
      { id: "familyNeutralEvidence", sources: ["trainingAttempt", "trainingSessionResult", "reviewQueueEntry"], writable: "prohibited", remoteSync: "never" },
      { id: "familyProgress", sources: ["trainingAttempt", "trainingSessionResult", "reviewQueueEntry"], writable: "prohibited", remoteSync: "never" },
    ],
  });
});

test("keeps progress and evidence as derived projections of canonical learning records", () => {
  const storageKeys = readFileSync("src/storage/keys.ts", "utf8");
  const learningReadModels = readFileSync("src/application/learningReadModels.ts", "utf8");
  assert.doesNotMatch(storageKeys, /familyNeutralEvidence|familyProgress/);
  assert.match(learningReadModels, /buildCloudCertificationProgressViewModel/);
  assert.match(learningReadModels, /getTrainingAttempts\(\), getReviewQueueItems\(\)/);
});

test("defines deterministic adoption, sync, and conflict results without silent loss", () => {
  const { adoption, sync } = loadCanonicalProductContract().accountData;
  assert.equal(adoption.requiresPreviewAndConfirmation, true);
  assert.deepEqual(adoption.cases, [
    { id: "emptyLocalEmptyRemote", result: "createBoundEmptyDataset" },
    { id: "populatedLocalEmptyRemote", result: "previewThenUploadExactLocalDataset" },
    { id: "emptyLocalPopulatedRemote", result: "previewThenRestoreExactRemoteDataset" },
    { id: "populatedLocalPopulatedRemote", result: "previewThenReconcileByRecordPolicy" },
    { id: "activeGuestSession", result: "requireFinishOrExplicitAbandonmentBeforeAdoption" },
    { id: "divergentRecord", result: "applyRecordPolicyOrBlockWithoutMutation" },
  ]);
  assert.deepEqual(adoption.recordPolicies, {
    immutableDifferentIds: "unionAfterPreviewConfirmation",
    immutableSameIdSameFingerprint: "idempotentDeduplication",
    immutableSameIdDifferentFingerprint: "blockingIntegrityConflict",
    revisionedOneSideChanged: "changedSideAfterExpectedRevisionCheck",
    revisionedBothChanged: "deterministicSemanticReplayOrBlockingConflict",
    deviceOwned: "retainCurrentDeviceOnly",
  });
  assert.equal(adoption.cancelledOrFailedResult, "retainBothLastVerifiedDatasetsUnchanged");
  assert.deepEqual(sync, {
    visibleStates: ["initialSyncRequired", "syncing", "synced", "offlinePending", "conflict", "failed", "deletionPending"],
    visibleEvidence: ["lastSuccessfulSyncAt", "pendingMutationCount", "blockingConflictCode", "lastFailureCode"],
    outboxOrder: "fifoByVerifiedLocalCommit",
    remoteWritePrecondition: "expectedAccountRevision",
    staleRevisionResult: "fetchRemoteThenDeterministicReplayOrBlockingConflict",
    immutableCollisionResult: "blockingIntegrityConflict",
    activeSessionConflictResult: "notApplicableDeviceOwnedSessionsNeverSync",
    remoteFailureResult: "retainVerifiedLocalCommitAndPendingOutbox",
    retry: "explicitOrAutomaticOnNetworkReturnWithoutDuplicateOperation",
  });
});

test("defines sign-out, retention, verified deletion, and public deletion request semantics", () => {
  assert.deepEqual(loadCanonicalProductContract().accountData.signOutAndDeletion, {
    pendingMutationJournal: {
      appliesBefore: ["export", "signOut", "accountDeletion"],
      requiredSequence: ["recoverDurablePlan", "materializeWrites", "verifyWrites", "clearJournal"],
      successBoundary: "journalAbsentAfterVerifiedClear",
      blockingResult: "journalRecoveryFailure",
      blockingSurfaces: [
        { operation: "export", surfaceId: "accountProfile" },
        { operation: "signOut", surfaceId: "signOut" },
        { operation: "accountDeletion", surfaceId: "deleteAccount" },
      ],
      failureResult: "blockRequestedOperationRetainBindingAndVerifiedData",
      accountSwitchResult: "blockNewBindingUntilJournalResolvedUnderCurrentBinding",
    },
    export: {
      format: "versionedCanonicalJson",
      scope: "accountOwnedLocalRecordsAndSyncProjection",
      excludes: ["password", "accessToken", "refreshToken", "verificationToken", "recoveryToken", "publicDeletionPossessionToken", "syncTransportEnvelope", "deletionProof"],
      integrity: "sha256CanonicalBytes",
      successBoundary: "verifiedFileHandoff",
      availableOffline: true,
    },
    signOut: {
      pendingOutbox: "synchronizeOrCompleteVerifiedExportThenExplicitlyDiscard",
      localResult: "deleteAccountOwnedRecordsAccountBindingTokensAndOutbox",
      preservedLocalRecords: ["storageMetadata", "applicationSettings", "notificationSettings"],
      failureResult: "remainBoundAndExposeFailure",
    },
    localLearningReset: "separateFromAccountDeletionAndRemoteDataset",
    accountDeletion: {
      prerequisites: ["network", "recentReauthentication", "explicitScopeConfirmation"],
      remoteScope: ["identity", "credentials", "sessions", "accountProfile", "learningRecords", "syncOperations"],
      acceptedResult: "persistDurableIntentThenRevokeAllSessionsVerifyRemoteDeletionAndDeleteAccountOwnedLocalRecords",
      failureResult: "deletionFailedWithRetryAndNoSuccessClaim",
      publicRequest: "verifiedEmailPossessionWithoutAccountEnumeration",
      durableIntent: {
        recordClass: "accountDeletionIntent",
        authority: "deletionCleanupCheckpointOnlyNeverLearningAuthority",
        writeBoundaries: ["localRequestBeforeFirstRemoteDestructiveStep", "authenticatedRemoteAccountDeletedBeforeLocalCleanup"],
        fields: ["operationId", "irreversibleAccountIdHash", "recordedAt", "trigger", "stage"],
        triggers: ["localRequest", "authenticatedRemoteAccountDeleted"],
        stages: ["prepared", "sessionsRevoked", "remoteDeletionVerified", "localCleanupPending"],
        restart: "resumeIdempotentlyFromLastVerifiedStage",
        remoteIdentityMissingAfterRestart: "continueIdempotentLocalCleanupAndVerifyLocalAbsence",
        clearBoundary: "remoteDeletionAndLocalCleanupVerified",
      },
      remoteAccountDeletedOnReconnect: {
        appliesTo: "previouslyBoundDevice",
        offlineResult: "retainBoundLocalDataUntilAuthenticatedReconnect",
        evidence: "authenticatedRemoteAccountDeletedResultBoundToStoredAccount",
        operation: "completeRemoteDeletionCleanup",
        localResult: "idempotentlyDeleteCredentialsBindingOutboxAndAccountOwnedLocalRecords",
        terminalResult: "remoteAccountDeleted",
        reauthenticationResult: "prohibited",
        failureResult: "deletionFailedRetainIntentForLocalCleanupRetry",
      },
    },
    retention: {
      liveServiceDataAfterVerifiedDeletionDays: 0,
      encryptedBackupMaximumDays: 7,
      backupRestoreIntoLiveService: "controlledDisasterRecoveryWithDeletionTombstoneReconciliation",
      minimalDeletionProofDays: 30,
      deletionProofFields: ["requestId", "irreversibleAccountIdHash", "requestedAt", "completedAt", "resultCode"],
    },
  });
});

test("defines commercial guest and identity target semantics", () => {
  const contract = loadCanonicalProductContract();
  assert.deepEqual(contract.commercialEntitlement.premiumProducts, ["monthly", "annual"]);
  assert.equal(contract.commercialEntitlement.entitlement, "oneAccountBoundPremiumForAllPremiumContentInAllTracks");
  assert.equal(contract.commercialEntitlement.trackSlots, "prohibited");
  assert.equal(contract.commercialEntitlement.offlineVerificationGraceDays, 7);
  assert.equal(contract.guestAndFree.firstLearningValueRequiresAccount, false);
  assert.equal(contract.guestAndFree.installationRecord, "opaqueInstallationIdAndLocalDatasetIdGuestBoundBeforeRecovery");
  assert.equal(contract.guestAndFree.firebaseAnonymousAuthentication, "prohibited");
  assert.equal(contract.guestAndFree.freeNodeExperienceProfile, "trackOwnedVersionedClosedSubsetOfCompleteValidModes");
  assert.deepEqual(contract.identityAndAccountSecurity.methods, ["emailPassword", "signInWithApple", "signInWithGoogle", "recoveryCodes"]);
  assert.equal(contract.identityAndAccountSecurity.recoveryCodeCount, 8);
  assert.deepEqual(contract.environmentAndPublicLinks.requiredValues, ["apiOrigin", "publicWebOrigin", "authActionOrigin", "authRedirectDomain", "privacyUrl", "termsUrl", "supportUrl", "publicDeletionUrl", "iosAssociatedDomain", "androidAppLinkHost", "transactionalSenderDomain"]);
  assert.deepEqual(contract.environmentAndPublicLinks.supportedEnvironments, ["sandbox", "production"]);
  assert.equal(contract.environmentAndPublicLinks.localConfiguration, "unconfiguredFailsClosed");
  assert.deepEqual(contract.environmentAndPublicLinks.ordinaryFirebaseActionCodes, { expiry: "providerControlled", singleUse: "providerControlled" });
  assert.deepEqual(contract.environmentAndPublicLinks.publicDeletionPossessionToken, { expiryMinutes: 30, singleUse: true });
});

test("defines device session sync surface goal and learning-product semantics", () => {
  const contract = loadCanonicalProductContract();
  assert.equal(contract.learningOwnershipAndSync.crossDeviceActiveSessionResume, "prohibited");
  assert.deepEqual(contract.learningOwnershipAndSync.deviceOnlyRecords, ["activeSessionPointer", "activeSession", "draft", "currentPosition", "foregroundTimer", "mutationJournal"]);
  assert.deepEqual(contract.productSurfacesAndGoals.primaryTabs, ["Today", "Practice", "Progress", "Settings"]);
  assert.equal(contract.productSurfacesAndGoals.activity, "nestedUnderProgress");
  assert.deepEqual((contract.learningProducts.families as { ids: readonly string[] }).ids, ["certification", "coding_interview", "design_interview"]);
  assert.equal((contract.learningProducts.families as { userVisible: boolean }).userVisible, false);
  assert.deepEqual(contract.learningProducts.launchTrackScope, contract.learningProducts.targetTracks);
  assert.equal((contract.learningProducts.targetTracks as readonly string[]).length, 8);
});

test("defines package analytics report backup and platform semantics", () => {
  const contract = loadCanonicalProductContract();
  assert.equal(contract.contentPackages.premiumUnit, "immutableCompressedWholeNodePackage");
  assert.equal(contract.contentPackages.perQuestionFirestoreFetching, "prohibited");
  assert.equal(contract.contentPackages.freeNodePackageAdmission, "immutableFactualProfileAndClosureEvidenceOnly");
  assert.equal(contract.analyticsAndReports.consentGate, "failClosed");
  assert.deepEqual((contract.analyticsAndReports.contentReports as { prohibitedAutomaticAttachments: readonly string[] }).prohibitedAutomaticAttachments, ["learnerResponse", "fullPrompt", "fullFeedback", "email", "accountId"]);
  assert.equal(contract.backupAndRestore.deletedAccountResurrection, "prohibited");
  assert.equal(contract.platformRelease.ipadSupportClaim, "prohibited");
  assert.equal(contract.platformRelease.physicalDeviceEvidence, "optionalNonBlocking");
});

test("defines one brand owner approval and repository handoff semantics", () => {
  const design = loadCanonicalProductContract().designAuthority;
  assert.equal(design.brand, "onePatternlyBrand");
  assert.equal(design.actualVisualApprovalAuthority, "productOwnerOnly");
  assert.deepEqual(design.handoffStates, ["FIGMA_DRAFT", "FIGMA_REVIEW", "FIGMA_APPROVED", "IMPLEMENTED", "VISUALLY_VERIFIED", "HANDED_OFF", "CODE_CANONICAL"]);
  assert.equal(design.figmaProductionDependency, "prohibited");
  assert.equal(design.storybookProductionDependency, "prohibited");
});

test("maps every required account and data state to a downstream implementation surface", () => {
  assert.deepEqual(loadCanonicalProductContract().accountData.surfaces, [
    { id: "accountEntry", states: ["required", "offlineUnavailable"] },
    { id: "register", states: ["editing", "invalidInput", "duplicateIdentity", "rateLimited", "offline", "remoteFailure"] },
    { id: "verifyIdentity", states: ["pending", "resendPending", "resendAccepted", "changePendingEmail", "changePendingEmailAccepted", "invalidInput", "duplicateIdentity", "invalidLink", "expiredLink", "usedLink", "rateLimited", "offline", "remoteFailure"] },
    { id: "signIn", states: ["editing", "invalidCredential", "unverifiedIdentity", "rateLimited", "offline", "remoteFailure"] },
    { id: "forgotPassword", states: ["editing", "acceptedNonEnumerating", "invalidInput", "rateLimited", "offline", "remoteFailure"] },
    { id: "resetPassword", states: ["editing", "invalidInput", "invalidLink", "expiredLink", "usedLink", "rateLimited", "offline", "remoteFailure", "success"] },
    { id: "sessionExpiredReauthentication", states: ["required", "invalidCredential", "revokedSession", "rateLimited", "offline", "remoteFailure"] },
    { id: "accountProfile", states: ["ready", "offline", "remoteFailure", "journalRecoveryFailure"] },
    { id: "dataAdoption", states: ["preview", "uploading", "restoring", "integrityConflict", "adoptionConflict", "offline", "remoteFailure", "completed"] },
    { id: "syncStatus", states: ["initialSyncRequired", "syncing", "synced", "offlinePending", "conflict", "failed", "deletionPending", "offline", "remoteFailure", "journalRecoveryFailure", "localDeletionFailure", "remoteAccountDeleted"] },
    { id: "signOut", states: ["confirm", "journalRecoveryFailure", "pendingSyncRequiresNetwork", "exportRequired", "deletingLocal", "localDeletionFailure", "completed"] },
    { id: "deleteAccount", states: ["scopeConfirmation", "journalRecoveryFailure", "reauthenticationRequired", "deleting", "rateLimited", "offline", "remoteFailure", "deletionVerificationFailure", "completed"] },
    { id: "publicDeleteRequest", states: ["request", "acceptedNonEnumerating", "verifyPossession", "invalidLink", "expiredLink", "usedLink", "rateLimited", "offline", "remoteFailure", "completed"] },
  ]);
});

test("defines canonical user commands and maps every session CTA to its one application command", () => {
  const contract = loadCanonicalProductContract();

  assert.deepEqual(contract.requirements.find((requirement) => requirement.id === "USER-COMMAND-MODEL-001"), {
    id: "USER-COMMAND-MODEL-001",
    statement: "Every canonical session CTA maps to exactly one declared application command; a non-final simulation CTA maps only to the atomic save-and-continue application command.",
  });
  assert.deepEqual(contract.requirements.find((requirement) => requirement.id === "USER-COMMAND-RESUME-001"), {
    id: "USER-COMMAND-RESUME-001",
    statement: "Resume is distinct from recover because a user-facing Resume CTA restores an active session, while recover replays a pending durable mutation.",
  });
  assert.deepEqual(contract.requirements.find((requirement) => requirement.id === "SIMULATION-SAVE-AND-CONTINUE-001"), {
    id: "SIMULATION-SAVE-AND-CONTINUE-001",
    statement: "The save-and-continue user action for a non-final Coding Interview simulation occurrence is represented by one application command that accepts the active occurrence and a complete response.",
  });
  assert.deepEqual(contract.requirements.find((requirement) => requirement.id === "SIMULATION-SAVE-AND-CONTINUE-VERIFICATION-001"), {
    id: "SIMULATION-SAVE-AND-CONTINUE-VERIFICATION-001",
    statement: "Save-and-continue verifies the durable draft revision and persisted response before it advances exactly one occurrence and publishes the verified next simulation projection.",
  });
  assert.deepEqual(contract.requirements.find((requirement) => requirement.id === "SIMULATION-SAVE-AND-CONTINUE-RECOVERY-001"), {
    id: "SIMULATION-SAVE-AND-CONTINUE-RECOVERY-001",
    statement: "If save-and-continue persists a response but does not verify its advance, it exposes explicit recovery that advances only from the durable response without creating another draft revision.",
  });
  assert.deepEqual(contract.requirements.find((requirement) => requirement.id === "SIMULATION-SAVE-AND-CONTINUE-CTA-001"), {
    id: "SIMULATION-SAVE-AND-CONTINUE-CTA-001",
    statement: "Every non-final Coding Interview simulation response CTA is labelled Save and continue, is disabled until complete, and invokes only the save-and-continue application command.",
  });
  assert.deepEqual(contract.userCommands, {
    commands: [
      { id: "submit" }, { id: "next" }, { id: "save" }, { id: "save-and-continue" }, { id: "resume-editing" },
      { id: "navigator-jump" }, { id: "finish" }, { id: "leave-resumable" }, { id: "abandon" }, { id: "recover" }, { id: "resume" },
    ],
    sessionCtaMappings: [
      { ctaId: "practice-submit", commandId: "submit" },
      { ctaId: "practice-next", commandId: "next" },
      { ctaId: "practice-finish", commandId: "finish" },
      { ctaId: "practice-leave-resumable", commandId: "leave-resumable" },
      { ctaId: "practice-abandon", commandId: "abandon" },
      { ctaId: "practice-recover", commandId: "recover" },
      { ctaId: "simulation-save", commandId: "save" },
      { ctaId: "simulation-keep-editing", commandId: "resume-editing" },
      { ctaId: "simulation-save-and-continue", commandId: "save-and-continue" },
      { ctaId: "simulation-navigator-jump", commandId: "navigator-jump" },
      { ctaId: "simulation-finish", commandId: "finish" },
      { ctaId: "simulation-leave-resumable", commandId: "leave-resumable" },
      { ctaId: "simulation-abandon", commandId: "abandon" },
      { ctaId: "simulation-recover", commandId: "recover" },
      { ctaId: "session-resume", commandId: "resume" },
    ],
  });
});

test("locks FIFO serialization for every simulation mutation of one active session per device", () => {
  const contract = loadCanonicalProductContract();
  assert.deepEqual(contract.simulationConcurrency, {
    scope: "oneActiveSessionPerDevice", queueDiscipline: "fifo", maxInFlight: 1, revalidateActiveSessionAtExecution: true,
    mutationKinds: ["save", "navigation", "timer-checkpoint", "foreground-transition", "finalization", "abandonment"],
  });
  assert.deepEqual(contract.requirements.find((requirement) => requirement.id === "SIMULATION-CONCURRENCY-001"), {
    id: "SIMULATION-CONCURRENCY-001",
    statement: "A simulation has one active session mutation lane: save, navigation, timer checkpoint, foreground transition, finalization, and abandonment are FIFO-serialized with at most one in flight, and revalidate the active session immediately before execution.",
  });
  assert.throws(() => parseCanonicalProductContract(validContract.replace("mutationKinds: [save, navigation, timer-checkpoint, foreground-transition, finalization, abandonment]", "mutationKinds: [save, save, timer-checkpoint, foreground-transition, finalization, abandonment]")), CanonicalProductContractValidationError);

  const table = [
    ...contract.simulationConcurrency.mutationKinds.map((kind) => ({ label: `${kind} starts when the lane is empty`, input: { kind, inFlightKinds: [] }, expected: true })),
    ...contract.simulationConcurrency.mutationKinds.flatMap((kind) => contract.simulationConcurrency.mutationKinds.map((inFlightKind) => ({
      label: `${kind} cannot run concurrently with ${inFlightKind}`,
      input: { kind, inFlightKinds: [inFlightKind] },
      expected: false,
    }))),
    { label: "unknown mutations cannot enter the lane", input: { kind: "unknown", inFlightKinds: [] }, expected: false },
    { label: "a known mutation cannot enter behind an unknown in-flight mutation", input: { kind: "save", inFlightKinds: ["unknown"] }, expected: false },
  ] as const;
  for (const { label, input, expected } of table) {
    assert.equal(canStartCanonicalSimulationMutation(contract, input), expected, label);
  }
});

test("defines the versioned simulation timer cadence without per-refresh durable writes", () => {
  const contract = loadCanonicalProductContract();
  assert.deepEqual(contract.requirements.find((requirement) => requirement.id === "SIMULATION-TIMER-CADENCE-001"), {
    id: "SIMULATION-TIMER-CADENCE-001",
    statement: "Simulation timer projections refresh every second without a durable write; durable checkpoints occur every 15 seconds with at most one second of drift and at every declared lifecycle checkpoint.",
  });
  assert.deepEqual(contract.simulationTimerCadence, {
    version: 1,
    uiRefreshIntervalMs: 1_000,
    uiRefreshWritesDurably: false,
    durableCheckpointIntervalMs: 15_000,
    maxDurableCheckpointDriftMs: 1_000,
    lifecycleCheckpoints: ["foreground-enter", "foreground-leave", "draft-save", "finalization", "expiry"],
  });
});

test("locks the Product Owner-approved Free-package interaction reference and its narrow UI ownership", () => {
  const contract = loadCanonicalProductContract();
  assert.deepEqual(contract.designReferences, {
    version: 2,
    references: [
      {
        id: "pkg-04a-free-package-interactions",
        screenStateTarget: "free-package-practice-and-unavailable-states",
        patternPath: "docs/designs/pkg-04a-free-package-interactions/DESIGN.md",
        version: 1,
        approvalStatus: "APPROVED",
        owner: "product-owner",
      },
      {
        id: "figma-02a-home-coding-ready",
        screenStateTarget: "coding-home-ready",
        patternPath: "docs/designs/figma-home-coding-ready/DESIGN.md",
        version: 1,
        approvalStatus: "APPROVED",
        owner: "product-owner",
      },
    ],
    uiOwnership: [
      { sourcePathPrefix: "src/content/application/ContentPreparationGate.tsx", designReferenceId: "pkg-04a-free-package-interactions" },
      { sourcePathPrefix: "src/features/practice/", designReferenceId: "pkg-04a-free-package-interactions" },
      { sourcePathPrefix: "src/features/review/AnswerReviewScreen.tsx", designReferenceId: "pkg-04a-free-package-interactions" },
      { sourcePathPrefix: "src/features/exam/ExamReviewScreen.tsx", designReferenceId: "pkg-04a-free-package-interactions" },
      { sourcePathPrefix: "src/features/exam/ResultScreen.tsx", designReferenceId: "pkg-04a-free-package-interactions" },
      { sourcePathPrefix: "src/features/home/HomeScreen.tsx", designReferenceId: "figma-02a-home-coding-ready" },
      { sourcePathPrefix: "src/features/home/tabs/HomeTab.tsx", designReferenceId: "figma-02a-home-coding-ready" },
    ],
  });
  assert.equal(resolveCanonicalUserFacingTaskDesignReference(contract, { status: "not-ready" }), undefined);
  const approvedReference = resolveCanonicalUserFacingTaskDesignReference(contract, {
    status: "ready",
    designReferenceId: "pkg-04a-free-package-interactions",
  });
  assert.equal(approvedReference?.id, "pkg-04a-free-package-interactions");
  assert.throws(
    () => resolveCanonicalUserFacingTaskDesignReference(contract, { status: "ready", designReferenceId: "historical-reference" }),
    (error: unknown) => error instanceof CanonicalUserFacingTaskReadinessError && /unknown design reference/.test(error.message),
  );
});

test("locks the approved Simulation operational-state CTA policy", () => {
  const contract = loadCanonicalProductContract();
  assert.deepEqual(contract.simulationOperationStateCtas, {
    version: 1,
    policies: [
      { id: "saving-response", operationStates: ["saving"], allowedCtaIds: [] },
      { id: "save-failed", operationStates: ["save_failed", "stale_revision"], allowedCtaIds: ["simulation-save", "simulation-keep-editing", "simulation-leave-resumable"] },
      { id: "response-saved-navigation-failed", operationStates: ["navigation_failed", "save_and_continue_advance_recovery"], allowedCtaIds: ["simulation-navigator-jump", "simulation-recover", "simulation-leave-resumable"] },
      { id: "finalizing", operationStates: ["frozen", "finalization_journal_pending", "materializing", "verifying", "verified_pending_clear"], allowedCtaIds: [] },
      { id: "finalization-recovery-required", operationStates: ["finalization_journal_failed", "materialization_failed", "verification_failed", "recovery_required"], allowedCtaIds: ["simulation-finish", "simulation-recover"] },
    ],
  });
  assert.throws(
    () => parseCanonicalProductContract(validContract.replace("id: saving-response", "id: save-failed")),
    /approved presentation states in canonical order/,
  );
});

test("defines the closed durable session state machines and accepts only declared triggered transitions", () => {
  const contract = loadCanonicalProductContract();
  const lifecycleSource = readFileSync("src/application/trainingLifecycle/TrainingLifecycleUseCases.ts", "utf8");

  assert.deepEqual(contract.requirements.find((requirement) => requirement.id === "SESSION-STATE-MACHINE-001"), {
    id: "SESSION-STATE-MACHINE-001",
    statement: "Practice and simulation expose only their declared durable operation states and triggered transitions; recovery returns only the state declared for the recovered durable mutation.",
  });
  assert.deepEqual(contract.sessionStateMachine.practice.states, [
    "unanswered", "submitting_before_journal", "submit_journal_failed", "commit_pending", "commit_materialization_failed", "commit_verification_failed", "verified_pending_clear", "recovery_required", "feedback", "advancing", "advance_failed", "completing", "completion_failed", "completed", "abandoning", "abandonment_failed_before_journal", "abandonment_recovery_required", "abandoned",
  ]);
  assert.equal(contract.sessionStateMachine.practice.transitions.length, 29);
  assert.deepEqual(contract.sessionStateMachine.practice.transitions.filter((transition) => transition.from === "feedback" && transition.trigger === "finish" || transition.from === "completing" || transition.from === "completion_failed"), [
    { from: "feedback", trigger: "finish", to: "completing" },
    { from: "completing", trigger: "completion_verified", to: "completed" },
    { from: "completing", trigger: "completion_failed", to: "completion_failed" },
    { from: "completion_failed", trigger: "finish", condition: "durable_state_not_durable", to: "completing" },
    { from: "completion_failed", trigger: "recover", condition: "journal_status_durable", to: "completing" },
    { from: "completion_failed", trigger: "recover", condition: "journal_status_materialized", to: "completing" },
    { from: "completion_failed", trigger: "recover", condition: "journal_status_verified_pending_clear", to: "completing" },
  ]);
  assert.deepEqual(contract.sessionStateMachine.simulation.states, [
    "editable", "saving", "save_failed", "stale_revision", "navigating", "navigation_failed", "save_and_continue_advance_recovery", "frozen", "finalization_journal_pending", "finalization_journal_failed", "materializing", "materialization_failed", "verifying", "verification_failed", "verified_pending_clear", "recovery_required", "timer_recovery_failed", "missing_draft", "version_mismatch", "corrupt_state", "abandoning", "abandonment_failed_before_journal", "abandonment_recovery_required", "abandoned", "completed",
  ]);

  const machines = [
    { family: "practice" as const, machine: contract.sessionStateMachine.practice },
    { family: "simulation" as const, machine: contract.sessionStateMachine.simulation },
  ];
  for (const { family, machine } of machines) {
    const declared = new Set(machine.transitions.map((transition) => `${transition.from}:${transition.trigger}:${transition.condition ?? "none"}:${transition.to}`));
    const triggers = [...new Set(machine.transitions.map((transition) => transition.trigger))];
    for (const from of machine.states) for (const trigger of triggers) for (const condition of [undefined, "durable_state_not_durable", "journal_status_durable", "journal_status_materialized", "journal_status_verified_pending_clear", "recovered_active_session"] as const) for (const to of machine.states) {
      const input = { family, from, trigger, condition, to } as Parameters<typeof isDeclaredCanonicalSessionTransition>[1];
      assert.equal(isDeclaredCanonicalSessionTransition(contract, input), declared.has(`${from}:${trigger}:${condition ?? "none"}:${to}`), `${family} ${from} --${trigger}/${condition ?? "none"}--> ${to}`);
    }
    for (const transition of machine.transitions) {
      assert.equal(isDeclaredCanonicalSessionTransition(contract, { family, ...transition } as Parameters<typeof isDeclaredCanonicalSessionTransition>[1]), true);
    }
  }
  assert.equal(isDeclaredCanonicalSessionTransition(contract, { family: "practice", from: "unanswered", trigger: "unknown" as never, to: "feedback" }), false);
  assert.equal(isDeclaredCanonicalSessionTransition(contract, { family: "simulation", from: "editable", trigger: "unknown" as never, to: "completed" }), false);

  assert.match(lifecycleSource, /pending\?\.operation === "submit_training_outcome" \? practice\("feedback"\) : practice\("unanswered"\)/);
  assert.match(lifecycleSource, /simulation\("navigation_failed", operationError\("simulation_navigation", error instanceof MutationCommitFailure \? error\.durableState : "not_durable", error instanceof MutationCommitFailure && error\.durableState !== "not_durable" \? "recover" : "retry_same_command"\)\)/);
  assert.match(lifecycleSource, /const state = pending\s+\? simulationSession \? simulationPendingFor\(pending\.status\)/);
  assert.match(lifecycleSource, /if \(status === "journal_durable"\) return simulation\("materializing"\);\s+if \(status === "materialized"\) return simulation\("verifying"\);\s+return simulation\("verified_pending_clear"/);
  assert.match(lifecycleSource, /if \(!verified\) \{\s+this\.operationStates\.clear\(active\.id\);\s+return;\s+}\s+const simulationSession = verified\.configurationSnapshot\.submission === "manualOrForegroundTimeout";\s+this\.operationStates\.publish\(verified\.id, simulationSession \? simulation\("editable"\)/);
  assert.equal(contract.sessionStateMachine.simulation.transitions.some((transition) => transition.from === "navigation_failed" && transition.trigger === "recover"), false);
  assert.equal(contract.sessionStateMachine.simulation.transitions.some((transition) => transition.from === "abandonment_recovery_required" && transition.trigger === "recover"), false);
  assert.match(lifecycleSource, /practice\("completing"\)/);
  assert.match(lifecycleSource, /practice\("completion_failed"/);
  assert.match(lifecycleSource, /practice\("completed"\)/);
  assert.doesNotMatch(lifecycleSource, /this\.operationStates\.set\(session\.id, simulation\("(?:materializing|verifying)"\)/);
});

test("defines exactly the complete canonical Coding Interview mode matrix", () => {
  const contract = loadCanonicalProductContract();

  assert.deepEqual(contract.codingInterview.modes, [
    {
      id: "coding-interview-learn-approach", label: "Learn Approach", lengths: { default: 10, supported: [10] }, scope: "oneMentalUnit", shortening: "allowed",
      feedback: { default: "afterEachAnswer", supported: ["afterEachAnswer"] }, timer: { kind: "elapsedForeground" }, reinsert: false,
    },
    {
      id: "coding-interview-guided-practice", label: "Guided Practice", lengths: { default: 20, supported: [10, 20, 40] }, scope: "oneMentalUnit", shortening: "allowed",
      feedback: { default: "afterEachAnswer", supported: ["afterEachAnswer"] }, timer: { kind: "elapsedForeground" }, reinsert: true,
    },
    {
      id: "coding-interview-custom-practice", label: "Custom Practice", lengths: { default: 20, supported: [10, 20, 40] }, scope: "guidedPracticeBlueprintForSelectedMentalUnit", shortening: "allowed",
      feedback: { default: "afterEachAnswer", supported: ["afterEachAnswer", "atSessionEnd"] }, timer: { kind: "elapsedForeground" }, reinsert: true,
    },
    {
      id: "coding-interview-recognize-patterns", label: "Recognize Patterns", lengths: { default: 20, supported: [10, 20, 40] }, scope: "declaredRecognitionSet", shortening: "allowed",
      feedback: { default: "afterEachAnswer", supported: ["afterEachAnswer"] }, timer: { kind: "elapsedForeground" }, reinsert: false,
    },
    {
      id: "coding-interview-contrast-practice", label: "Contrast Practice", lengths: { default: 20, supported: [10, 20, 40] }, scope: "declaredContrastSet", shortening: "allowed",
      feedback: { default: "afterEachAnswer", supported: ["afterEachAnswer"] }, timer: { kind: "elapsedForeground" }, reinsert: false,
    },
    {
      id: "coding-interview-weak-area-review", label: "Weak Area Review", lengths: { default: 10, supported: [10, 20] }, scope: "eligibleDueReviewOrCompletedSessionMisses", shortening: "allowed",
      feedback: { default: "afterEachAnswer", supported: ["afterEachAnswer"] }, timer: { kind: "elapsedForeground" }, reinsert: true,
    },
    {
      id: "coding-interview-independent-practice", label: "Independent Practice", lengths: { default: 10, supported: [10, 20] }, scope: "declaredInterleavedScope", shortening: "blueprintControlled",
      feedback: { default: "afterEachAnswer", supported: ["afterEachAnswer"] }, timer: { kind: "elapsedForeground" }, reinsert: false,
    },
    {
      id: "coding-interview-simulation", label: "Interview Simulation", lengths: { default: 40, supported: [40] }, scope: "fixedSimulationBlueprint", shortening: "prohibited",
      feedback: { default: "atSessionEnd", supported: ["atSessionEnd"] }, timer: { kind: "countdownForeground", durationMs: 2_700_000 }, reinsert: false,
    },
  ]);
});

test("locks the Custom Practice contract required by CODING-INTERVIEW-CUSTOM-PRACTICE-001", () => {
  const contract = loadCanonicalProductContract();
  const customPractice = contract.codingInterview.modes.find((mode) => mode.id === "coding-interview-custom-practice");

  assert.deepEqual(
    contract.requirements.find((requirement) => requirement.id === "CODING-INTERVIEW-CUSTOM-PRACTICE-001"),
    {
      id: "CODING-INTERVIEW-CUSTOM-PRACTICE-001",
      statement: "Custom Practice accepts only 10, 20, or 40 items and explicit afterEachAnswer or atSessionEnd feedback, uses the Guided Practice blueprint for an explicitly selected mental unit, and shares the one-active-session lifecycle with profile-owned reinsert.",
    },
  );
  assert.deepEqual(customPractice, {
    id: "coding-interview-custom-practice", label: "Custom Practice", lengths: { default: 20, supported: [10, 20, 40] }, scope: "guidedPracticeBlueprintForSelectedMentalUnit", shortening: "allowed",
    feedback: { default: "afterEachAnswer", supported: ["afterEachAnswer", "atSessionEnd"] }, timer: { kind: "elapsedForeground" }, reinsert: true,
  });
  assert.deepEqual(contract.codingInterview.customPractice, {
    modeId: "coding-interview-custom-practice",
    contentBlueprintModeId: "coding-interview-guided-practice",
    mentalUnitSelection: "explicit",
    reinsertOwnership: "profile",
    lifecycle: "sharedOneActiveSession",
  });
});

test("locks the versioned Coding Interview reinsert placement policy", () => {
  const contract = loadCanonicalProductContract();

  assert.deepEqual(contract.requirements.find((requirement) => requirement.id === "CODING-INTERVIEW-REINSERT-POLICY-001"), {
    id: "CODING-INTERVIEW-REINSERT-POLICY-001",
    statement: "Coding Interview reinsert permits one eligible incorrect or partial source attempt after at least three intervening durable submissions, preferring a compatible reviewed variant then an exact-source fallback, and skips when no valid slot exists.",
  });
  assert.deepEqual(contract.codingInterview.reinsertPolicy, {
    version: 1,
    eligibleResultKinds: ["incorrect", "partial"],
    maxReinsertsPerSource: 1,
    minInterveningDurableSubmissions: 3,
    variantSelectionOrder: ["compatibleReviewedVariant", "exactSourceFallback"],
    missingValidSlot: "skip",
  });
  assert.throws(
    () => parseCanonicalProductContract(validContract.replace("minInterveningDurableSubmissions: 3", "minInterveningDurableSubmissions: 2")),
    /must be equal to constant/,
  );
  assert.throws(
    () => parseCanonicalProductContract(validContract.replace("variantSelectionOrder: [compatibleReviewedVariant, exactSourceFallback]", "variantSelectionOrder: [exactSourceFallback, compatibleReviewedVariant]")),
    /must be equal to constant/,
  );
});

test("defines exactly the complete declared Certification mode matrix", () => {
  const contract = loadCanonicalProductContract();

  assert.deepEqual(
    contract.requirements.find((requirement) => requirement.id === "CERTIFICATION-MODE-MATRIX-001"),
    {
      id: "CERTIFICATION-MODE-MATRIX-001",
      statement: "Certification exposes exactly seven declared modes, each owned by the certification family and the representative GCP ACE track with an explicit normative learning configuration; implementation and verification status live outside this contract.",
    },
  );
  assert.deepEqual(contract.certification.modes, [
    { id: "certification-diagnostic-baseline", label: "Diagnostic Baseline", owner: { familyId: "certification", trackId: "google-cloud-associate-cloud-engineer" }, configuration: { setupControls: [], sessionLength: 40, selectionScope: "fixedDiagnosticBlueprint", feedbackTiming: "afterEachDurableSubmit", timer: "elapsedForeground", shortening: "prohibited", reinsert: false, reviewBehavior: "domainBreakdown", summaryMetrics: ["score", "correct", "partial", "incorrect", "domainBreakdown", "elapsedForeground"], permittedActions: ["submit", "next", "leaveResumable", "abandon"] } },
    { id: "certification-focus-practice", label: "Focus Practice", owner: { familyId: "certification", trackId: "google-cloud-associate-cloud-engineer" }, configuration: { setupControls: ["topic", "sessionLength"], sessionLengths: [10, 20, 40], selectionScope: "explicitCloudDomain", feedbackTiming: "afterEachDurableSubmit", timer: "elapsedForeground", shortening: "allowedWithinSelectedTopic", reinsert: false, reviewBehavior: "domainBreakdown", summaryMetrics: ["score", "correct", "partial", "incorrect", "domainBreakdown", "elapsedForeground"], permittedActions: ["submit", "next", "leaveResumable", "abandon"] } },
    { id: "certification-scenario-practice", label: "Scenario Practice", owner: { familyId: "certification", trackId: "google-cloud-associate-cloud-engineer" }, configuration: { setupControls: ["competency", "sessionLength"], sessionLengths: [10, 20, 40], selectionScope: "explicitApprovedScenarioCompetency", feedbackTiming: "afterEachDurableSubmit", timer: "elapsedForeground", shortening: "allowedWithinSelectedCompetency", reinsert: false, reviewBehavior: "domainBreakdown", summaryMetrics: ["score", "correct", "partial", "incorrect", "domainBreakdown", "elapsedForeground"], permittedActions: ["submit", "next", "leaveResumable", "abandon"] } },
    { id: "certification-weak-area-review", label: "Weak Area Review", owner: { familyId: "certification", trackId: "google-cloud-associate-cloud-engineer" }, configuration: { setupControls: ["sessionLength"], sessionLengths: [10, 20], selectionScope: "eligibleDueReviewEvidence", feedbackTiming: "afterEachDurableSubmit", timer: "elapsedForeground", shortening: "allowedWithinEligibleReviewEvidence", reinsert: false, reviewBehavior: "resolveAfterTwoConsecutiveDueReviewSuccesses", summaryMetrics: ["score", "correct", "partial", "incorrect", "domainBreakdown", "elapsedForeground"], permittedActions: ["submit", "next", "leaveResumable", "abandon"] } },
    { id: "certification-mixed-practice", label: "Mixed Practice", owner: { familyId: "certification", trackId: "google-cloud-associate-cloud-engineer" }, configuration: { setupControls: ["sessionLength"], sessionLengths: [10, 20, 40], selectionScope: "explicitUniqueInterleavedBlueprint", feedbackTiming: "afterEachDurableSubmit", timer: "elapsedForeground", shortening: "allowedWithinInterleavedBlueprint", reinsert: false, reviewBehavior: "domainBreakdown", summaryMetrics: ["score", "correct", "partial", "incorrect", "domainBreakdown", "elapsedForeground"], permittedActions: ["submit", "next", "leaveResumable", "abandon"] } },
    { id: "certification-quick-review", label: "Quick Review", owner: { familyId: "certification", trackId: "google-cloud-associate-cloud-engineer" }, configuration: { setupControls: [], sessionLength: 10, selectionScope: "earliestTenEligibleDueReviewEvidence", feedbackTiming: "afterEachDurableSubmit", timer: "elapsedForeground", shortening: "allowedWithinEligibleReviewEvidence", reinsert: false, reviewBehavior: "resolveAfterTwoConsecutiveDueReviewSuccesses", summaryMetrics: ["score", "correct", "partial", "incorrect", "domainBreakdown", "elapsedForeground"], permittedActions: ["submit", "next", "leaveResumable", "abandon"] } },
    { id: "certification-exam-simulation", label: "Exam Simulation", owner: { familyId: "certification", trackId: "google-cloud-associate-cloud-engineer" } },
  ]);
});

test("rejects every superseded Directive 2 product model", () => {
  const cases: readonly [string, string, RegExp][] = [
    ["account required before learning", validContract.replace("guestAndFree:\n  guestIdentity: localInstallation\n  installationRecord: opaqueInstallationIdAndLocalDatasetIdGuestBoundBeforeRecovery\n  firebaseAnonymousAuthentication: prohibited\n  firstLearningValueRequiresAccount: false", "guestAndFree:\n  guestIdentity: localInstallation\n  installationRecord: opaqueInstallationIdAndLocalDatasetIdGuestBoundBeforeRecovery\n  firebaseAnonymousAuthentication: prohibited\n  firstLearningValueRequiresAccount: true"), /guest contract/],
    ["guest data silently discarded", validContract.replace("silentMergeOrDiscard: prohibited", "silentMergeOrDiscard: allowed"), /guest contract/],
    ["guest purchase", validContract.replace("guestPurchase: prohibited", "guestPurchase: allowed"), /commercial contract/],
    ["guest Premium package download", validContract.replace("premiumPackageDownload, uninstallRecovery", "uninstallRecovery"), /guest contract/],
    ["local RevenueCat authority", validContract.replace("paidDownloadAuthority: patternlyBackendEntitlementOnly", "paidDownloadAuthority: localRevenueCatSdk"), /commercial contract/],
    ["track slots", validContract.replace("trackSlots: prohibited", "trackSlots: threeActiveTracks"), /commercial contract/],
    ["tiered entitlement", validContract.replace("tiers: prohibited", "tiers: activeTrackCount"), /commercial contract/],
    ["account-wide active session", validContract.replace("activeSessionLimit: onePerDeviceAcrossTracks", "activeSessionLimit: onePerAccount"), /synchronization contract/],
    ["remote active draft timer and position", validContract.replace("deviceOnlyRemoteSync: never", "deviceOnlyRemoteSync: revisioned"), /synchronization contract/],
    ["cross-device active resume", validContract.replace("crossDeviceActiveSessionResume: prohibited", "crossDeviceActiveSessionResume: allowed"), /synchronization contract/],
    ["Free session pulls Premium", validContract.replace("freeSessionContent: freeNodeOnlyWithoutPremiumFiller", "freeSessionContent: mayFillFromPremium"), /guest contract/],
    ["Free review pulls Premium", validContract.replace("freeReviewContent: eligibleFreeNodeEvidenceOnly", "freeReviewContent: allTrackEvidence"), /guest contract/],
    ["Free profile becomes a second mode system", validContract.replace("freeNodeExperienceProfile: trackOwnedVersionedClosedSubsetOfCompleteValidModes", "freeNodeExperienceProfile: freeOnlyModesAndRunner"), /must be equal to constant|guest contract/],
    ["Free package admission inferred from a brief", validContract.replace("freeNodePackageAdmission: immutableFactualProfileAndClosureEvidenceOnly", "freeNodePackageAdmission: briefOnly"), /must be equal to constant|package contract/],
    ["per-question Firestore fetching", validContract.replace("perQuestionFirestoreFetching: prohibited", "perQuestionFirestoreFetching: allowed"), /package contract/],
    ["mutable published package", validContract.replace("publishedMutation: prohibited", "publishedMutation: allowed"), /package contract/],
    ["silent package substitution", validContract.replace("silentVersionSubstitution: prohibited", "silentVersionSubstitution: allowed"), /package contract/],
    ["visible family category", validContract.replace("userVisible: false", "userVisible: true"), /learning products/],
    ["placeholder production tracks", validContract.replace("emptyPlaceholderOrComingSoonTracks: prohibited", "emptyPlaceholderOrComingSoonTracks: allowed"), /learning products/],
    ["ordinary action-code fixed expiry", validContract.replace("expiry: providerControlled\n    singleUse: providerControlled", "expiry: 30Minutes\n    singleUse: true"), /public-link contract/],
    ["missing public environment inputs", validContract.replace("requiredValues: [apiOrigin, publicWebOrigin, authActionOrigin, authRedirectDomain, privacyUrl, termsUrl, supportUrl, publicDeletionUrl, iosAssociatedDomain, androidAppLinkHost, transactionalSenderDomain]", "requiredValues: []"), /must be equal to constant|public-link contract/],
    ["implicit local public environment", validContract.replace("localConfiguration: unconfiguredFailsClosed", "localConfiguration: implicitDefault"), /must be equal to constant|public-link contract/],
    ["automatic provider link without existing proof", validContract.replace("providerLinking: proofThroughExistingUsableMethod", "providerLinking: automaticByEmail"), /identity contract/],
    ["cross-platform Premium disabled", validContract.replace("crossPlatformPremium: required", "crossPlatformPremium: prohibited"), /commercial contract/],
    ["one-option Language route", validContract.replace("languageRoute: absentUntilRealSecondLanguage", "languageRoute: EnglishOnlySetting"), /surface contract/],
    ["Activity fifth primary tab", validContract.replace("primaryTabs: [Today, Practice, Progress, Settings]", "primaryTabs: [Today, Practice, Progress, Activity, Settings]"), /surface contract/],
    ["manual choice loses to recommendation", validContract.replace("manualSessionChoicePrecedence: wins", "manualSessionChoicePrecedence: recommendationWins"), /surface contract/],
    ["sync trigger set silently reduced", validContract.replace("syncTriggers: [coldStart, networkReturn, staleForegroundReturn, terminalSessionEnd, goalChange, currentTrackChange, entitlementUpdate, explicitRetry]", "syncTriggers: [coldStart, networkReturn]"), /synchronization contract/],
    ["Figma production dependency", validContract.replace("figmaProductionDependency: prohibited", "figmaProductionDependency: required"), /design authority/],
    ["Storybook production dependency", validContract.replace("storybookProductionDependency: prohibited", "storybookProductionDependency: required"), /design authority/],
    ["Codex self approval", validContract.replace("actualVisualApprovalAuthority: productOwnerOnly", "actualVisualApprovalAuthority: codex"), /design authority/],
    ["design exploration skips three directions", validContract.replace("exploration: threeDirectionsToTwoFinalistsToOneSystem", "exploration: twoDirectionsToOneSystem"), /design authority/],
    ["analytics without consent", validContract.replace("consentGate: failClosed", "consentGate: enabledByDefault"), /analytics and report/],
    ["Crashlytics removed from launch target", validContract.replace("crashProvider: firebaseCrashlytics", "crashProvider: none"), /must be equal to constant|analytics and report/],
    ["Terms treated as analytics consent", validContract.replace("termsAsAnalyticsConsent: prohibited", "termsAsAnalyticsConsent: allowed"), /must be equal to constant|analytics and report/],
    ["content report attaches private fields", validContract.replace("prohibitedAutomaticAttachments: [learnerResponse, fullPrompt, fullFeedback, email, accountId]", "prohibitedAutomaticAttachments: []"), /analytics and report/],
    ["package manifest drops object generation", validContract.replace(", immutableObjectIdentityGeneration, minimumAppVersion", ", minimumAppVersion"), /package contract/],
    ["restore resurrects deleted account", validContract.replace("deletedAccountResurrection: prohibited", "deletedAccountResurrection: allowed"), /backup contract/],
    ["long-term exports required at launch", validContract.replace("scheduledLongTermExportAtLaunch: prohibited", "scheduledLongTermExportAtLaunch: required"), /must be equal to constant|backup contract/],
    ["restore runbook made optional", validContract.replace("restoreRunbook: required", "restoreRunbook: optional"), /backup contract/],
    ["iPad support claim", validContract.replace("ipadSupportClaim: prohibited", "ipadSupportClaim: supported"), /platform contract/],
    ["landscape release orientation", validContract.replace("orientation: portrait", "orientation: landscape"), /must be equal to constant|platform contract/],
    ["tablet release evidence", validContract.replace("evidenceDevices: phonesOnly", "evidenceDevices: phonesAndTablets"), /platform contract/],
  ];
  for (const [label, source, message] of cases) {
    assert.throws(() => parseCanonicalProductContract(source), (error: unknown) => error instanceof CanonicalProductContractValidationError && message.test(error.message), label);
  }
});

test("rejects canonical product contracts with unknown fields, missing version, empty requirements, or duplicate requirement identifiers", () => {
  const cases: readonly [string, string, RegExp][] = [
    ["unknown field", `${validContract}unexpected: value\n`, /must NOT have additional properties/],
    ["missing version", validContract.replace("version: 2\n", ""), /must have required property 'version'/],
    ["empty requirements", validContract.replace(/requirements:\n(?:  - .*\n    .*\n)+/, "requirements: []\n"), /must NOT have fewer than 1 items/],
    ["duplicate identifier", validContract.replace("    statement: Product behavior is normative only when defined by this contract.\n", "    statement: Product behavior is normative only when defined by this contract.\n  - id: CONTRACT-AUTHORITY-001\n    statement: A second requirement with the same identifier.\n"), /Duplicate canonical product contract requirement identifier/],
    ["missing account data contract", validContract.replace(/accountData:[\s\S]*?\nuserCommands:/, "userCommands:"), /must have required property 'accountData'/],
    ["unknown account data field", validContract.replace("accountData:\n  version: 1\n", "accountData:\n  version: 1\n  extra: value\n"), /must NOT have additional properties/],
    ["changed account identity method", validContract.replace("identity: oneFirebaseUidAndOnePatternlyAccount", "identity: oneAccountPerEmail"), /identity contract/],
    ["duplicate account lifecycle operation", validContract.replace("      - id: verifyIdentity\n", "      - id: register\n"), /Canonical account lifecycle must declare exactly its operations in canonical order/],
    ["pre-bootstrap initial sync enters offline", validContract.replace("          - { failures: [offline], to: authenticatedSyncing }", "          - { failures: [offline], to: offlineAuthenticated }"), /Canonical account lifecycle must prohibit offline entry before successful initial sync/],
    ["initial sync success enters offline", validContract.replace("      - id: completeInitialSync\n        surfaceId: dataAdoption\n        from: [authenticatedSyncing]\n        inProgress: authenticatedSyncing\n        success: authenticatedReady\n", "      - id: completeInitialSync\n        surfaceId: dataAdoption\n        from: [authenticatedSyncing]\n        inProgress: authenticatedSyncing\n        success: offlineAuthenticated\n"), /Canonical account lifecycle must prohibit offline entry before successful initial sync/],
    ["identity verification success enters offline", validContract.replace("      - id: verifyIdentity\n        surfaceId: verifyIdentity\n        from: [verificationPending]\n        inProgress: verifying\n        success: authenticatedSyncing\n", "      - id: verifyIdentity\n        surfaceId: verifyIdentity\n        from: [verificationPending]\n        inProgress: verifying\n        success: offlineAuthenticated\n"), /Canonical account lifecycle must prohibit offline entry before successful initial sync/],
    ["lifecycle operation maps to the wrong surface", validContract.replace("      - id: signIn\n        surfaceId: signIn\n", "      - id: signIn\n        surfaceId: sessionExpiredReauthentication\n"), /Canonical account lifecycle operation maps to the wrong surface: signIn/],
    ["account link validity above 30 minutes", validContract.replace("expiresAfterMinutes: 30", "expiresAfterMinutes: 31"), /must be equal to constant|must be <= 30/],
    ["wrong public deletion possession token", validContract.replace("tokenKind: publicDeletionPossessionToken", "tokenKind: recoveryPossessionToken"), /must be equal to constant/],
    ["old unscoped possession-token persistence field", validContract.replace("possessionTokenPersistenceInPatternlyStores", "possessionTokenPersistence"), /must have required property 'possessionTokenPersistenceInPatternlyStores'|must NOT have additional properties/],
    ["old unscoped token-logging field", validContract.replace("tokenLoggingInPatternlyControlledLogs", "tokenLogging"), /must have required property 'tokenLoggingInPatternlyControlledLogs'|must NOT have additional properties/],
    ["old unscoped log-exclusions field", validContract.replace("patternlyControlledLogExclusions", "logExclusions"), /must have required property 'patternlyControlledLogExclusions'|must NOT have additional properties/],
    ["reordered account record classes", validContract.replace("      - { id: storageMetadata, owner: device, remoteSync: never }\n      - { id: accountBinding, owner: accountAndDevice, remoteSync: identityReferenceOnly }", "      - { id: accountBinding, owner: accountAndDevice, remoteSync: identityReferenceOnly }\n      - { id: storageMetadata, owner: device, remoteSync: never }"), /Canonical account data authority must declare exactly its record classes in canonical order/],
    ["duplicate account derived projection", validContract.replace("      - { id: familyProgress, sources:", "      - { id: familyNeutralEvidence, sources:"), /Canonical account data authority must declare exactly its derived projections in canonical order/],
    ["reordered account surfaces", validContract.replace("    - { id: accountEntry, states: [required, offlineUnavailable] }\n    - { id: register,", "    - { id: register, states: [required, offlineUnavailable] }\n    - { id: accountEntry,"), /Canonical account surface map must declare exactly its surfaces in canonical order/],
    ["lifecycle failure missing from its surface", validContract.replace("duplicateIdentity, rateLimited, offline, remoteFailure] }\n    - { id: verifyIdentity", "duplicateIdentity, rateLimited, offline] }\n    - { id: verifyIdentity"), /Canonical account lifecycle failure is missing from its surface: register/],
    ["missing user commands", validContract.replace(/userCommands:[\s\S]*?\nsessionStateMachine:/, "sessionStateMachine:"), /must have required property 'userCommands'/],
    ["unknown user command field", validContract.replace("    - id: submit\n", "    - id: submit\n      extra: value\n"), /must NOT have additional properties/],
    ["duplicate user command identifier", validContract.replace("    - id: next\n", "    - id: submit\n"), /Duplicate canonical product contract user command identifier/],
    ["duplicate session CTA identifier", validContract.replace("    - ctaId: practice-next\n", "    - ctaId: practice-submit\n"), /Duplicate canonical product contract session CTA identifier/],
    ["session CTA with undeclared command", validContract.replace("    - ctaId: practice-recover\n      commandId: recover\n", "    - ctaId: practice-recover\n      commandId: submit-recovery\n"), /Canonical session CTA must reference a declared user command: practice-recover/],
    ["missing canonical session CTA", validContract.replace("    - ctaId: simulation-recover\n      commandId: recover\n", ""), /Canonical session CTA is missing exactly one command mapping: simulation-recover/],
    ["session CTA mapped to the wrong command", validContract.replace("    - ctaId: session-resume\n      commandId: resume\n", "    - ctaId: session-resume\n      commandId: recover\n"), /Canonical session CTA command mapping does not match its intent: session-resume/],
    ["missing session state machine", validContract.replace(/sessionStateMachine:[\s\S]*?\ncodingInterview:/, "codingInterview:"), /must have required property 'sessionStateMachine'/],
    ["unknown session state machine field", validContract.replace("    initialState: unanswered\n", "    initialState: unanswered\n    extra: value\n"), /must NOT have additional properties/],
    ["unknown practice state", validContract.replace("states: [unanswered,", "states: [unknown_state,"), /must be equal to one of the allowed values/],
    ["missing durable practice state", validContract.replace(", abandoned]\n    transitions:", "]\n    transitions:"), /must NOT have fewer than 18 items/],
    ["undeclared practice transition", validContract.replace("- { from: unanswered, trigger: abandon, to: abandoning }", "- { from: unanswered, trigger: abandon, to: completed }"), /Canonical Practice session state machine must declare exactly its allowed triggered transitions/],
    ["undeclared simulation transition", validContract.replace("- { from: editable, trigger: finish, to: frozen }", "- { from: editable, trigger: finish, to: completed }"), /Canonical Simulation session state machine must declare exactly its allowed triggered transitions/],
    ["navigation retry without durability condition", validContract.replace("condition: durable_state_not_durable, to: navigating", "to: navigating"), /Canonical Simulation session state machine must declare exactly its allowed triggered transitions/],
    ["missing simulation concurrency contract", validContract.replace(/simulationConcurrency:[\s\S]*?\ncodingInterview:/, "codingInterview:"), /must have required property 'simulationConcurrency'/],
    ["unknown simulation concurrency field", validContract.replace("  maxInFlight: 1\n", "  maxInFlight: 1\n  extra: value\n"), /must NOT have additional properties/],
    ["changed simulation queue discipline", validContract.replace("  queueDiscipline: fifo\n", "  queueDiscipline: lifo\n"), /must be equal to constant/],
    ["missing serialized simulation mutation", validContract.replace("mutationKinds: [save, navigation, timer-checkpoint, foreground-transition, finalization, abandonment]", "mutationKinds: [save, navigation, timer-checkpoint, foreground-transition, finalization]"), /must NOT have fewer than 6 items/],
    ["duplicate serialized simulation mutation", validContract.replace("mutationKinds: [save, navigation, timer-checkpoint, foreground-transition, finalization, abandonment]", "mutationKinds: [save, save, timer-checkpoint, foreground-transition, finalization, abandonment]"), /must NOT have duplicate items/],
    ["unknown serialized simulation mutation", validContract.replace("mutationKinds: [save, navigation, timer-checkpoint, foreground-transition, finalization, abandonment]", "mutationKinds: [save, navigation, timer-checkpoint, foreground-transition, finalization, unknown]"), /must be equal to one of the allowed values/],
    ["reordered serialized simulation mutations", validContract.replace("mutationKinds: [save, navigation, timer-checkpoint, foreground-transition, finalization, abandonment]", "mutationKinds: [navigation, save, timer-checkpoint, foreground-transition, finalization, abandonment]"), /Canonical Simulation concurrency contract must declare exactly its serialized mutation kinds in canonical order/],
    ["missing simulation timer cadence", validContract.replace(/simulationTimerCadence:[\s\S]*?\ncodingInterview:/, "codingInterview:"), /must have required property 'simulationTimerCadence'/],
    ["unknown simulation timer cadence field", validContract.replace("  uiRefreshIntervalMs: 1000\n", "  uiRefreshIntervalMs: 1000\n  extra: value\n"), /must NOT have additional properties/],
    ["missing timer cadence version", validContract.replace("  version: 1\n  uiRefreshIntervalMs: 1000\n", "  uiRefreshIntervalMs: 1000\n"), /must have required property 'version'/],
    ["changed timer cadence version", validContract.replace("  version: 1\n  uiRefreshIntervalMs: 1000\n", "  version: 2\n  uiRefreshIntervalMs: 1000\n"), /must be equal to constant/],
    ["UI refresh writes durably", validContract.replace("  uiRefreshWritesDurably: false\n", "  uiRefreshWritesDurably: true\n"), /must be equal to constant/],
    ["changed UI refresh interval", validContract.replace("  uiRefreshIntervalMs: 1000\n", "  uiRefreshIntervalMs: 2000\n"), /must be equal to constant/],
    ["changed durable checkpoint interval", validContract.replace("  durableCheckpointIntervalMs: 15000\n", "  durableCheckpointIntervalMs: 1000\n"), /must be equal to constant/],
    ["missing durable checkpoint drift", validContract.replace("  maxDurableCheckpointDriftMs: 1000\n", ""), /must have required property 'maxDurableCheckpointDriftMs'/],
    ["changed durable checkpoint drift", validContract.replace("  maxDurableCheckpointDriftMs: 1000\n", "  maxDurableCheckpointDriftMs: 2000\n"), /must be equal to constant/],
    ["missing lifecycle checkpoint", validContract.replace("[foreground-enter, foreground-leave, draft-save, finalization, expiry]", "[foreground-enter, foreground-leave, draft-save, finalization]"), /must NOT have fewer than 5 items/],
    ["reordered lifecycle checkpoints", validContract.replace("[foreground-enter, foreground-leave, draft-save, finalization, expiry]", "[foreground-leave, foreground-enter, draft-save, finalization, expiry]"), /Canonical Simulation timer cadence must declare exactly its lifecycle checkpoints in canonical order/],
    ["missing design reference registry", validContract.replace(/designReferences:[\s\S]*?\ncodingInterview:/, "codingInterview:"), /must have required property 'designReferences'/],
    ["unknown design reference field", validContract.replace("designReferences:\n", "designReferences:\n  extra: value\n"), /must NOT have additional properties/],
    ["missing design reference UI ownership", validContract.replace(/  uiOwnership:[\s\S]*?\nsimulationOperationStateCtas:/, "simulationOperationStateCtas:"), /must have required property 'uiOwnership'/],
    ["changed design reference registry version", validContract.replace("designReferences:\n  version: 2", "designReferences:\n  version: 1"), /must be equal to constant/],
    ["duplicate Coding Interview mode identifier", validContract.replace("    - id: coding-interview-guided-practice", "    - id: coding-interview-learn-approach"), /Duplicate canonical product contract Coding Interview mode identifier/],
    ["mismatched Coding Interview mode label", validContract.replace("label: Learn Approach", "label: Interview Simulation"), /Coding Interview mode label does not match its identifier/],
    ["missing Coding Interview mode field", validContract.replace("      reinsert: false\n", ""), /must have required property 'reinsert'/],
    ["duplicate supported length", validContract.replace("supported: [10]", "supported: [10, 10]"), /must NOT have duplicate items/],
    ["duplicate supported feedback", validContract.replace("supported: [afterEachAnswer]", "supported: [afterEachAnswer, afterEachAnswer]"), /must NOT have duplicate items/],
    ["unsupported default length", validContract.replace("      label: Guided Practice\n      lengths:\n        default: 20\n        supported: [10, 20, 40]", "      label: Guided Practice\n      lengths:\n        default: 20\n        supported: [10]"), /Coding Interview mode default length must be supported/],
    ["unsupported default feedback", validContract.replace("        default: atSessionEnd\n        supported: [atSessionEnd]", "        default: atSessionEnd\n        supported: [afterEachAnswer]"), /Coding Interview mode default feedback must be supported/],
    ["missing Custom Practice contract", validContract.replace("  customPractice:\n    modeId: coding-interview-custom-practice\n    contentBlueprintModeId: coding-interview-guided-practice\n    mentalUnitSelection: explicit\n    reinsertOwnership: profile\n    lifecycle: sharedOneActiveSession\n", ""), /must have required property 'customPractice'/],
    ["unknown Custom Practice contract field", validContract.replace("    lifecycle: sharedOneActiveSession\n", "    lifecycle: sharedOneActiveSession\n    extra: value\n"), /must NOT have additional properties/],
    ["changed Custom Practice mental-unit selection", validContract.replace("mentalUnitSelection: explicit", "mentalUnitSelection: inferred"), /must be equal to constant/],
    ["changed Custom Practice feedback options", validContract.replace("supported: [afterEachAnswer, atSessionEnd]", "supported: [afterEachAnswer]"), /Custom Practice mode must preserve its declared lengths, feedback, Guided Practice mental-unit blueprint, and reinsert profile/],
    ["missing Certification contract", validContract.replace(/certification:\n(?:  .*\n|    .*\n|      .*\n|        .*\n)+$/, ""), /must have required property 'certification'/],
    ["duplicate Certification mode identifier", validContract.replace("    - id: certification-focus-practice\n      label: Focus Practice", "    - id: certification-diagnostic-baseline\n      label: Focus Practice"), /Duplicate canonical product contract Certification mode identifier/],
    ["mismatched Certification mode label", validContract.replace("label: Diagnostic Baseline", "label: Exam Simulation"), /Certification mode label does not match its identifier/],
    ["missing Certification mode owner", validContract.replace("      owner:\n        familyId: certification\n        trackId: google-cloud-associate-cloud-engineer\n", ""), /must have required property 'owner'/],
  ];

  for (const [label, source, message] of cases) {
    assert.throws(() => parseCanonicalProductContract(source), (error: unknown) => error instanceof CanonicalProductContractValidationError && message.test(error.message), label);
  }
});
