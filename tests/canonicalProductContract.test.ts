import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { canStartCanonicalSimulationMutation, CanonicalProductContractValidationError, CanonicalUserFacingTaskReadinessError, getCanonicalRequirementTestCoverage, isDeclaredCanonicalSessionTransition, loadCanonicalProductContract, parseCanonicalProductContract, resolveCanonicalUserFacingTaskDesignReference } from "../scripts/validateCanonicalProductContract";

const validContract = readFileSync("docs/canonical-product-contract.yaml", "utf8");
const transactionalEmailProcessorYaml = `    transactionalEmailProcessor:
      provider: resend
      plan: free
      environmentScope: ownerOnlySandbox
      purpose: publicDeletionPossessionLinkDeliveryOnly
      retainedData: transactionalEmailDeliveryDataIncludingMessageContentMetadataAndApiLogs
      processorCopyFields: [recipientNormalizedEmail, publicDeletionPossessionToken]
      processorCopyLocations: [messageContent, deliveryRecords, apiRecords]
      maximumRetentionDays: 30
      storageRegion: UnitedStates
      liveAccountDataAuthority: prohibited
      backupClassification: prohibited
`;

test("parses the canonical product contract", () => {
  const contract = loadCanonicalProductContract();
  assert.equal(contract.version, 1);
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
    "docs/16-leetcode-like-learning-system.md",
    "docs/17-training-runtime-and-interaction-spec.md",
    "docs/designs/README.md",
    "docs/designs/product-direction-options/DESIGN.md",
  ];
  const removedMatrixConstructs = [
    /\|\s*Mode\s*\|\s*Default length\s*\|/,
    /Supported requested lengths/,
    /Algorithms supports exactly these modes:/,
    /Certification supports exactly these modes:/,
    /Algorithms has exactly these user-facing modes:/,
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
      ["ALGORITHMS-MODE-MATRIX-001", ["canonical-algorithms-mode-matrix"]],
      ["ALGORITHMS-CUSTOM-PRACTICE-001", ["canonical-custom-practice-contract"]],
      ["ALGORITHMS-INDEPENDENT-PRACTICE-001", ["canonical-independent-practice-contract"]],
      ["ALGORITHMS-PROGRESS-EVIDENCE-001", ["algorithms-progress-evidence-contract"]],
      ["TRACK-PRESENTATION-001", ["track-presentation-contract"]],
      ["RESEARCH-BUILD-SETTINGS-001", ["research-build-settings-contract"]],
      ["APP-IDENTITY-001", ["patternly-build-identity-contract"]],
      ["USER-TESTING-CORE-JOURNEY-001", ["user-testing-core-journey-contract"]],
      ["ALGORITHMS-CUSTOM-IMMEDIATE-FEEDBACK-001", ["custom-practice-immediate-feedback-flow"]],
      ["ALGORITHMS-CUSTOM-DEFERRED-FEEDBACK-001", ["custom-practice-deferred-feedback-withholding"]],
      ["ALGORITHMS-CUSTOM-DEFERRED-SUMMARY-001", ["custom-practice-deferred-summary-relaunch"]],
      ["ALGORITHMS-CUSTOM-REINSERT-OWNERSHIP-001", ["custom-practice-reinsert-ownership", "custom-practice-reinsert-override-rejection"]],
      ["ALGORITHMS-REINSERT-POLICY-001", ["canonical-algorithms-reinsert-policy"]],
      ["CERTIFICATION-MODE-MATRIX-001", ["canonical-certification-mode-matrix"]],
      ["CERTIFICATION-DIAGNOSTIC-BASELINE-001", ["certification-diagnostic-baseline"]],
      ["CERTIFICATION-FOCUS-PRACTICE-001", ["certification-focus-practice"]],
      ["CERTIFICATION-SCENARIO-PRACTICE-001", ["certification-scenario-practice"]],
      ["CERTIFICATION-WEAK-AREA-REVIEW-001", ["certification-weak-area-review"]],
      ["CERTIFICATION-MIXED-PRACTICE-001", ["certification-mixed-practice"]],
      ["CERTIFICATION-QUICK-REVIEW-001", ["certification-quick-review"]],
      ["USER-COMMAND-MODEL-001", ["canonical-session-command-model"]],
      ["USER-COMMAND-RESUME-001", ["canonical-session-command-model"]],
      ["SIMULATION-SAVE-AND-CONTINUE-001", ["algorithms-save-and-continue-command"]],
      ["SIMULATION-SAVE-AND-CONTINUE-VERIFICATION-001", ["algorithms-save-and-continue-verification"]],
      ["SIMULATION-SAVE-AND-CONTINUE-RECOVERY-001", ["algorithms-save-and-continue-recovery"]],
      ["SIMULATION-SAVE-AND-CONTINUE-CTA-001", ["simulation-save-and-continue-cta"]],
      ["SIMULATION-FINAL-OCCURRENCE-001", ["simulation-final-occurrence"]],
      ["SIMULATION-SAVE-AND-JUMP-001", ["algorithms-save-and-jump-command"]],
      ["SIMULATION-RELAUNCH-001", ["algorithms-simulation-relaunch"]],
      ["SIMULATION-SAVE-AND-CONTINUE-IDEMPOTENCY-001", ["algorithms-save-and-continue-idempotency"]],
      ["SIMULATION-FULL-LIFECYCLE-001", ["algorithms-simulation-full-lifecycle"]],
      ["SIMULATION-TIMER-UI-REFRESH-001", ["algorithms-simulation-timer-ui-refresh"]],
      ["SIMULATION-TIMER-CHECKPOINT-INTERVAL-001", ["algorithms-simulation-timer-checkpoint-interval"]],
      ["SIMULATION-TIMER-BACKGROUND-CHECKPOINT-001", ["algorithms-simulation-timer-background-checkpoint"]],
      ["SIMULATION-TIMER-FINALIZATION-CHECKPOINT-001", ["algorithms-simulation-timer-finalization-checkpoint"]],
      ["SIMULATION-TIMER-MUTATION-SERIALIZATION-001", ["algorithms-simulation-timer-mutation-serialization"]],
      ["SIMULATION-TIMER-FORCE-CLOSE-BOUNDARY-001", ["algorithms-simulation-timer-force-close-boundary"]],
      ["SIMULATION-ACTIVE-SCREEN-FIDELITY-001", ["simulation-active-screen-fidelity"]],
      ["SIMULATION-NAVIGATOR-FIDELITY-001", ["simulation-navigator-fidelity"]],
      ["SIMULATION-OPERATION-STATE-ACTIONS-001", ["simulation-operation-state-rendering", "simulation-operation-state-resume-editing"]],
      ["SIMULATION-ACCESSIBILITY-001", ["simulation-accessibility"]],
      ["SESSION-STATE-MACHINE-001", ["canonical-session-state-machine"]],
      ["SIMULATION-CONCURRENCY-001", ["canonical-simulation-concurrency"]],
      ["SIMULATION-TIMER-CADENCE-001", ["canonical-simulation-timer-cadence"]],
      ["NARRATIVE-DOCS-CANONICALIZATION-001", ["canonical-narrative-docs"]],
      ["DESIGN-REFERENCE-REGISTRY-001", ["canonical-design-reference-readiness"]],
    ],
  );
  assert.throws(
    () => parseCanonicalProductContract(validContract.replace("id: canonical-algorithms-mode-matrix", "id: canonical-contract-authority")),
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

test("defines the required verified account entry and credential boundaries", () => {
  const { publicLaunchEntry, credentials, lifecycle, networkAndPrivacy } = loadCanonicalProductContract().accountData;
  assert.deepEqual(publicLaunchEntry, {
    accountRequired: true,
    identityMethod: "verifiedEmailAndPassword",
    canonicalIdentifier: "normalizedEmail",
    firstAuthenticatedBootstrapRequiresNetwork: true,
    offlineEntryRequiresSuccessfulAuthenticatedSync: true,
    learningRequiresVerifiedIdentity: true,
    offlineLearningAfterVerifiedBootstrap: "allowedForBoundAccount",
    anonymousLearningPath: "prohibited",
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
  assert.deepEqual(lifecycle.verificationLink, { transport: "verifiedHttpsUniversalLink", tokenKind: "verificationPossessionToken", singleUse: true, expiresAfterMinutes: 30 });
  assert.deepEqual(lifecycle.recoveryLink, { transport: "verifiedHttpsUniversalLink", tokenKind: "recoveryPossessionToken", singleUse: true, expiresAfterMinutes: 30 });
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
    transactionalEmailProcessor: {
      provider: "resend",
      plan: "free",
      environmentScope: "ownerOnlySandbox",
      purpose: "publicDeletionPossessionLinkDeliveryOnly",
      retainedData: "transactionalEmailDeliveryDataIncludingMessageContentMetadataAndApiLogs",
      processorCopyFields: ["recipientNormalizedEmail", "publicDeletionPossessionToken"],
      processorCopyLocations: ["messageContent", "deliveryRecords", "apiRecords"],
      maximumRetentionDays: 30,
      storageRegion: "UnitedStates",
      liveAccountDataAuthority: "prohibited",
      backupClassification: "prohibited",
    },
    patternlyControlledLogExclusions: ["password", "accessToken", "refreshToken", "verificationToken", "recoveryToken", "publicDeletionPossessionToken", "normalizedEmail", "learnerResponse", "promptText", "explanationText", "draftPayload", "attemptPayload", "reviewPayload", "progressPayload", "journalPayload", "exportPayload", "deletionIntentPayload"],
    honestLimitations: ["mechanismsNotImplemented", "publicHostingUnavailableUntilMarketPromotion", "signedBuildNotVerified", "legalAndStoreDisclosuresNotPublished"],
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
      { id: "activeSessionReference", owner: "account", remoteSync: "revisioned" },
      { id: "trainingSession", owner: "account", remoteSync: "revisioned" },
      { id: "trainingSessionResult", owner: "account", remoteSync: "immutableById" },
      { id: "trainingAttempt", owner: "account", remoteSync: "immutableById" },
      { id: "reviewQueueEntry", owner: "account", remoteSync: "revisioned" },
      { id: "simulationDraft", owner: "account", remoteSync: "revisioned" },
      { id: "foregroundTimer", owner: "account", remoteSync: "revisioned" },
      { id: "mutationJournal", owner: "deviceOperational", remoteSync: "materializedWritesOnly" },
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
    { id: "activeSessionOnOneSide", result: "preserveThatSessionAndRejectSecondActiveSession" },
    { id: "divergentActiveSessions", result: "requireExplicitSessionChoiceAndConfirmedAbandonmentOfOtherDraft" },
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
    activeSessionConflictResult: "explicitSessionChoiceRequired",
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
      encryptedBackupMaximumDays: 30,
      backupRestoreIntoLiveService: "prohibited",
      minimalDeletionProofDays: 30,
      deletionProofFields: ["requestId", "irreversibleAccountIdHash", "requestedAt", "completedAt", "resultCode"],
    },
  });
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
    { id: "dataAdoption", states: ["preview", "uploading", "restoring", "activeSessionChoice", "integrityConflict", "adoptionConflict", "offline", "remoteFailure", "completed"] },
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
    statement: "The save-and-continue user action for a non-final Algorithms Interview Simulation occurrence is represented by one application command that accepts the active occurrence and a complete response.",
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
    statement: "Every non-final Algorithms Interview Simulation response CTA is labelled Save and continue, is disabled until complete, and invokes only the save-and-continue application command.",
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

test("locks FIFO serialization for every simulation mutation of one active session", () => {
  const contract = loadCanonicalProductContract();
  assert.deepEqual(contract.simulationConcurrency, {
    scope: "oneActiveSession", queueDiscipline: "fifo", maxInFlight: 1, revalidateActiveSessionAtExecution: true,
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

test("requires a registered APPROVED design reference before a user-facing task is ready", () => {
  const approvedContract = loadCanonicalProductContract();
  const approvedReference = resolveCanonicalUserFacingTaskDesignReference(approvedContract, {
    status: "ready",
    designReferenceId: "algorithms-active-simulation-screen",
  });

  assert.deepEqual(approvedReference, {
    id: "algorithms-active-simulation-screen",
    screenStateTarget: "algorithms-interview-simulation-active-question",
    patternPath: "docs/designs/algorithms_active_simulation/active-simulation-reference.png",
    version: 1,
    approvalStatus: "APPROVED",
    owner: "product-owner",
  });
  assert.deepEqual(approvedContract.designReferences.uiOwnership, [{
    sourcePathPrefix: "src/features/algorithms/session/",
    designReferenceId: "focus-lab-core-shell-001",
  }, {
    sourcePathPrefix: "src/features/simulation/",
    designReferenceId: "algorithms-active-simulation-screen",
  }, {
    sourcePathPrefix: "src/features/simulation/navigator/",
    designReferenceId: "algorithms-simulation-question-navigator",
  }, {
    sourcePathPrefix: "src/features/simulation/operation/",
    designReferenceId: "algorithms-simulation-operational-states",
  }, {
    sourcePathPrefix: "src/features/exam/",
    designReferenceId: "certification-exam-active-screen",
  }, {
    sourcePathPrefix: "src/features/practice/",
    designReferenceId: "shared-practice-flow-001",
  }, {
    sourcePathPrefix: "src/components/",
    designReferenceId: "focus-lab-core-shell-001",
  }, {
    sourcePathPrefix: "src/features/home/",
    designReferenceId: "focus-lab-core-shell-001",
  }, {
    sourcePathPrefix: "src/features/navigation/",
    designReferenceId: "focus-lab-core-shell-001",
  }, {
    sourcePathPrefix: "src/features/review/",
    designReferenceId: "shared-practice-flow-001",
  }, {
    sourcePathPrefix: "src/content/application/ContentPreparationGate.tsx",
    designReferenceId: "focus-lab-core-shell-001",
  }, {
    sourcePathPrefix: "src/navigation/",
    designReferenceId: "focus-lab-core-shell-001",
  }, {
    sourcePathPrefix: "src/preferences/",
    designReferenceId: "focus-lab-core-shell-001",
  }]);
  assert.deepEqual(resolveCanonicalUserFacingTaskDesignReference(approvedContract, {
    status: "ready",
    designReferenceId: "algorithms-simulation-question-navigator",
  }), {
    id: "algorithms-simulation-question-navigator",
    screenStateTarget: "algorithms-interview-simulation-question-navigator",
    patternPath: "docs/designs/algorithms_simulation_navigator/simulation-navigator-reference.png",
    version: 1,
    approvalStatus: "APPROVED",
    owner: "product-owner",
  });
  assert.deepEqual(resolveCanonicalUserFacingTaskDesignReference(approvedContract, {
    status: "ready",
    designReferenceId: "algorithms-simulation-operational-states",
  }), {
    id: "algorithms-simulation-operational-states",
    screenStateTarget: "algorithms-interview-simulation-operational-states",
    patternPath: "docs/designs/algorithms_simulation_operational_states/simulation-operational-states-reference.png",
    version: 1,
    approvalStatus: "APPROVED",
    owner: "product-owner",
  });
  assert.deepEqual(resolveCanonicalUserFacingTaskDesignReference(approvedContract, {
    status: "ready",
    designReferenceId: "certification-exam-active-screen",
  }), {
    id: "certification-exam-active-screen",
    screenStateTarget: "certification-exam-active-question",
    patternPath: "docs/designs/algorithms_active_simulation/active-simulation-reference.png",
    version: 1,
    approvalStatus: "APPROVED",
    owner: "product-owner",
  });
  assert.deepEqual(resolveCanonicalUserFacingTaskDesignReference(approvedContract, {
    status: "ready",
    designReferenceId: "certification-exam-question-navigator",
  }), {
    id: "certification-exam-question-navigator",
    screenStateTarget: "certification-exam-question-navigator",
    patternPath: "docs/designs/algorithms_simulation_navigator/simulation-navigator-reference.png",
    version: 1,
    approvalStatus: "APPROVED",
    owner: "product-owner",
  });
  assert.deepEqual(resolveCanonicalUserFacingTaskDesignReference(approvedContract, {
    status: "ready",
    designReferenceId: "certification-exam-operational-states",
  }), {
    id: "certification-exam-operational-states",
    screenStateTarget: "certification-exam-operational-states",
    patternPath: "docs/designs/algorithms_simulation_operational_states/simulation-operational-states-reference.png",
    version: 1,
    approvalStatus: "APPROVED",
    owner: "product-owner",
  });
  assert.deepEqual(resolveCanonicalUserFacingTaskDesignReference(approvedContract, {
    status: "ready",
    designReferenceId: "shared-practice-flow-001",
  }), {
    id: "shared-practice-flow-001",
    screenStateTarget: "non-simulation-practice-setup-runner-summary",
    patternPath: "docs/designs/algorithms_custom_practice/custom-practice-flow-reference.png",
    version: 1,
    approvalStatus: "APPROVED",
    owner: "product-owner",
  });
  assert.deepEqual(resolveCanonicalUserFacingTaskDesignReference(approvedContract, {
    status: "ready",
    designReferenceId: "focus-lab-core-shell-001",
  }), {
    id: "focus-lab-core-shell-001",
    screenStateTarget: "quiet-layered-core-journey-and-shared-shell",
    patternPath: "docs/designs/product-direction-options/DESIGN.md",
    version: 1,
    approvalStatus: "APPROVED",
    owner: "product-owner",
  });
  assert.deepEqual(resolveCanonicalUserFacingTaskDesignReference(approvedContract, {
    status: "ready",
    designReferenceId: "account-lifecycle-001",
  }), {
    id: "account-lifecycle-001",
    screenStateTarget: "account-lifecycle-complete-surface-state-matrix",
    patternPath: "docs/designs/account_lifecycle/DESIGN.md",
    version: 1,
    approvalStatus: "APPROVED",
    owner: "product-owner",
  });
  assert.equal(resolveCanonicalUserFacingTaskDesignReference(approvedContract, { status: "not-ready" }), undefined);
  assert.throws(
    () => resolveCanonicalUserFacingTaskDesignReference(approvedContract, { status: "ready" }),
    (error: unknown) => error instanceof CanonicalUserFacingTaskReadinessError && /must name a design reference/.test(error.message),
  );
  assert.throws(
    () => resolveCanonicalUserFacingTaskDesignReference(approvedContract, { status: "ready", designReferenceId: "unknown-reference" }),
    (error: unknown) => error instanceof CanonicalUserFacingTaskReadinessError && /unknown design reference/.test(error.message),
  );

  const pendingContract = parseCanonicalProductContract(validContract.replace("approvalStatus: APPROVED", "approvalStatus: PENDING"));
  assert.throws(
    () => resolveCanonicalUserFacingTaskDesignReference(pendingContract, { status: "ready", designReferenceId: "algorithms-active-simulation-screen" }),
    (error: unknown) => error instanceof CanonicalUserFacingTaskReadinessError && /requires an APPROVED design reference/.test(error.message),
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

test("defines exactly the complete canonical Algorithms mode matrix", () => {
  const contract = loadCanonicalProductContract();

  assert.deepEqual(contract.algorithms.modes, [
    {
      id: "algorithms-learn-approach", label: "Learn Approach", lengths: { default: 10, supported: [10] }, scope: "oneMentalUnit", shortening: "allowed",
      feedback: { default: "afterEachAnswer", supported: ["afterEachAnswer"] }, timer: { kind: "elapsedForeground" }, reinsert: false,
    },
    {
      id: "algorithms-guided-practice", label: "Guided Practice", lengths: { default: 20, supported: [10, 20, 40] }, scope: "oneMentalUnit", shortening: "allowed",
      feedback: { default: "afterEachAnswer", supported: ["afterEachAnswer"] }, timer: { kind: "elapsedForeground" }, reinsert: true,
    },
    {
      id: "algorithms-custom-practice", label: "Custom Practice", lengths: { default: 20, supported: [10, 20, 40] }, scope: "guidedPracticeBlueprintForSelectedMentalUnit", shortening: "allowed",
      feedback: { default: "afterEachAnswer", supported: ["afterEachAnswer", "atSessionEnd"] }, timer: { kind: "elapsedForeground" }, reinsert: true,
    },
    {
      id: "algorithms-recognize-patterns", label: "Recognize Patterns", lengths: { default: 20, supported: [10, 20, 40] }, scope: "declaredRecognitionSet", shortening: "allowed",
      feedback: { default: "afterEachAnswer", supported: ["afterEachAnswer"] }, timer: { kind: "elapsedForeground" }, reinsert: false,
    },
    {
      id: "algorithms-contrast-practice", label: "Contrast Practice", lengths: { default: 20, supported: [10, 20, 40] }, scope: "declaredContrastSet", shortening: "allowed",
      feedback: { default: "afterEachAnswer", supported: ["afterEachAnswer"] }, timer: { kind: "elapsedForeground" }, reinsert: false,
    },
    {
      id: "algorithms-weak-area-review", label: "Weak Area Review", lengths: { default: 10, supported: [10, 20] }, scope: "eligibleDueReviewOrCompletedSessionMisses", shortening: "allowed",
      feedback: { default: "afterEachAnswer", supported: ["afterEachAnswer"] }, timer: { kind: "elapsedForeground" }, reinsert: true,
    },
    {
      id: "algorithms-independent-practice", label: "Independent Practice", lengths: { default: 10, supported: [10, 20] }, scope: "declaredInterleavedScope", shortening: "blueprintControlled",
      feedback: { default: "afterEachAnswer", supported: ["afterEachAnswer"] }, timer: { kind: "elapsedForeground" }, reinsert: false,
    },
    {
      id: "algorithms-interview-simulation", label: "Interview Simulation", lengths: { default: 40, supported: [40] }, scope: "fixedSimulationBlueprint", shortening: "prohibited",
      feedback: { default: "atSessionEnd", supported: ["atSessionEnd"] }, timer: { kind: "countdownForeground", durationMs: 2_700_000 }, reinsert: false,
    },
  ]);
});

test("locks the Custom Practice contract required by ALGORITHMS-CUSTOM-PRACTICE-001", () => {
  const contract = loadCanonicalProductContract();
  const customPractice = contract.algorithms.modes.find((mode) => mode.id === "algorithms-custom-practice");

  assert.deepEqual(
    contract.requirements.find((requirement) => requirement.id === "ALGORITHMS-CUSTOM-PRACTICE-001"),
    {
      id: "ALGORITHMS-CUSTOM-PRACTICE-001",
      statement: "Custom Practice accepts only 10, 20, or 40 items and explicit afterEachAnswer or atSessionEnd feedback, uses the Guided Practice blueprint for an explicitly selected mental unit, and shares the one-active-session lifecycle with profile-owned reinsert.",
    },
  );
  assert.deepEqual(customPractice, {
    id: "algorithms-custom-practice", label: "Custom Practice", lengths: { default: 20, supported: [10, 20, 40] }, scope: "guidedPracticeBlueprintForSelectedMentalUnit", shortening: "allowed",
    feedback: { default: "afterEachAnswer", supported: ["afterEachAnswer", "atSessionEnd"] }, timer: { kind: "elapsedForeground" }, reinsert: true,
  });
  assert.deepEqual(contract.algorithms.customPractice, {
    modeId: "algorithms-custom-practice",
    contentBlueprintModeId: "algorithms-guided-practice",
    mentalUnitSelection: "explicit",
    reinsertOwnership: "profile",
    lifecycle: "sharedOneActiveSession",
  });
});

test("locks the versioned Algorithms reinsert placement policy", () => {
  const contract = loadCanonicalProductContract();

  assert.deepEqual(contract.requirements.find((requirement) => requirement.id === "ALGORITHMS-REINSERT-POLICY-001"), {
    id: "ALGORITHMS-REINSERT-POLICY-001",
    statement: "Algorithms reinsert permits one eligible incorrect or partial source attempt after at least three intervening durable submissions, preferring a compatible reviewed variant then an exact-source fallback, and skips when no valid slot exists.",
  });
  assert.deepEqual(contract.algorithms.reinsertPolicy, {
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
      statement: "Certification exposes exactly seven declared modes, each owned by the certification family and cloud-certification track with explicit contract, implementation, and verification status.",
    },
  );
  assert.deepEqual(contract.certification.modes, [
    { id: "certification-diagnostic-baseline", label: "Diagnostic Baseline", owner: { familyId: "certification", trackId: "cloud-certification" }, status: { contract: "declared", implementation: "available", verification: "verified" }, configuration: { setupControls: [], sessionLength: 40, selectionScope: "fixedDiagnosticBlueprint", feedbackTiming: "afterEachDurableSubmit", timer: "elapsedForeground", shortening: "prohibited", reinsert: false, reviewBehavior: "domainBreakdown", summaryMetrics: ["score", "correct", "partial", "incorrect", "domainBreakdown", "elapsedForeground"], permittedActions: ["submit", "next", "leaveResumable", "abandon"] } },
    { id: "certification-focus-practice", label: "Focus Practice", owner: { familyId: "certification", trackId: "cloud-certification" }, status: { contract: "declared", implementation: "available", verification: "verified" }, configuration: { setupControls: ["topic", "sessionLength"], sessionLengths: [10, 20, 40], selectionScope: "explicitCloudDomain", feedbackTiming: "afterEachDurableSubmit", timer: "elapsedForeground", shortening: "allowedWithinSelectedTopic", reinsert: false, reviewBehavior: "domainBreakdown", summaryMetrics: ["score", "correct", "partial", "incorrect", "domainBreakdown", "elapsedForeground"], permittedActions: ["submit", "next", "leaveResumable", "abandon"] } },
    { id: "certification-scenario-practice", label: "Scenario Practice", owner: { familyId: "certification", trackId: "cloud-certification" }, status: { contract: "declared", implementation: "available", verification: "verified" }, configuration: { setupControls: ["competency", "sessionLength"], sessionLengths: [10, 20, 40], selectionScope: "explicitApprovedScenarioCompetency", feedbackTiming: "afterEachDurableSubmit", timer: "elapsedForeground", shortening: "allowedWithinSelectedCompetency", reinsert: false, reviewBehavior: "domainBreakdown", summaryMetrics: ["score", "correct", "partial", "incorrect", "domainBreakdown", "elapsedForeground"], permittedActions: ["submit", "next", "leaveResumable", "abandon"] } },
    { id: "certification-weak-area-review", label: "Weak Area Review", owner: { familyId: "certification", trackId: "cloud-certification" }, status: { contract: "declared", implementation: "available", verification: "verified" }, configuration: { setupControls: ["sessionLength"], sessionLengths: [10, 20], selectionScope: "eligibleDueReviewEvidence", feedbackTiming: "afterEachDurableSubmit", timer: "elapsedForeground", shortening: "allowedWithinEligibleReviewEvidence", reinsert: false, reviewBehavior: "resolveAfterTwoConsecutiveDueReviewSuccesses", summaryMetrics: ["score", "correct", "partial", "incorrect", "domainBreakdown", "elapsedForeground"], permittedActions: ["submit", "next", "leaveResumable", "abandon"] } },
    { id: "certification-mixed-practice", label: "Mixed Practice", owner: { familyId: "certification", trackId: "cloud-certification" }, status: { contract: "declared", implementation: "available", verification: "verified" }, configuration: { setupControls: ["sessionLength"], sessionLengths: [10, 20, 40], selectionScope: "explicitUniqueInterleavedBlueprint", feedbackTiming: "afterEachDurableSubmit", timer: "elapsedForeground", shortening: "allowedWithinInterleavedBlueprint", reinsert: false, reviewBehavior: "domainBreakdown", summaryMetrics: ["score", "correct", "partial", "incorrect", "domainBreakdown", "elapsedForeground"], permittedActions: ["submit", "next", "leaveResumable", "abandon"] } },
    { id: "certification-quick-review", label: "Quick Review", owner: { familyId: "certification", trackId: "cloud-certification" }, status: { contract: "declared", implementation: "available", verification: "verified" }, configuration: { setupControls: [], sessionLength: 10, selectionScope: "earliestTenEligibleDueReviewEvidence", feedbackTiming: "afterEachDurableSubmit", timer: "elapsedForeground", shortening: "allowedWithinEligibleReviewEvidence", reinsert: false, reviewBehavior: "resolveAfterTwoConsecutiveDueReviewSuccesses", summaryMetrics: ["score", "correct", "partial", "incorrect", "domainBreakdown", "elapsedForeground"], permittedActions: ["submit", "next", "leaveResumable", "abandon"] } },
    { id: "certification-exam-simulation", label: "Exam Simulation", owner: { familyId: "certification", trackId: "cloud-certification" }, status: { contract: "declared", implementation: "available", verification: "verified" } },
  ]);
});

test("rejects canonical product contracts with unknown fields, missing version, empty requirements, or duplicate requirement identifiers", () => {
  const cases: readonly [string, string, RegExp][] = [
    ["unknown field", `${validContract}unexpected: value\n`, /must NOT have additional properties/],
    ["missing version", validContract.replace("version: 1\n", ""), /must have required property 'version'/],
    ["empty requirements", validContract.replace(/requirements:\n(?:  - .*\n    .*\n)+/, "requirements: []\n"), /must NOT have fewer than 1 items/],
    ["duplicate identifier", validContract.replace("    statement: Product behavior is normative only when defined by this contract.\n", "    statement: Product behavior is normative only when defined by this contract.\n  - id: CONTRACT-AUTHORITY-001\n    statement: A second requirement with the same identifier.\n"), /Duplicate canonical product contract requirement identifier/],
    ["missing account data contract", validContract.replace(/accountData:[\s\S]*?\nuserCommands:/, "userCommands:"), /must have required property 'accountData'/],
    ["unknown account data field", validContract.replace("accountData:\n  version: 1\n", "accountData:\n  version: 1\n  extra: value\n"), /must NOT have additional properties/],
    ["changed account identity method", validContract.replace("identityMethod: verifiedEmailAndPassword", "identityMethod: anonymous"), /must be equal to constant/],
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
    ["missing transactional email processor boundary", validContract.replace(transactionalEmailProcessorYaml, ""), /must have required property 'transactionalEmailProcessor'/],
    ["transactional email processor retention above 30 days", validContract.replace("maximumRetentionDays: 30", "maximumRetentionDays: 31"), /must be <= 30|must be equal to constant/],
    ["transactional email processor outside the approved US boundary", validContract.replace("storageRegion: UnitedStates", "storageRegion: EuropeanUnion"), /must be equal to constant/],
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
    ["missing session state machine", validContract.replace(/sessionStateMachine:[\s\S]*?\nalgorithms:/, "algorithms:"), /must have required property 'sessionStateMachine'/],
    ["unknown session state machine field", validContract.replace("    initialState: unanswered\n", "    initialState: unanswered\n    extra: value\n"), /must NOT have additional properties/],
    ["unknown practice state", validContract.replace("states: [unanswered,", "states: [unknown_state,"), /must be equal to one of the allowed values/],
    ["missing durable practice state", validContract.replace(", abandoned]\n    transitions:", "]\n    transitions:"), /must NOT have fewer than 18 items/],
    ["undeclared practice transition", validContract.replace("- { from: unanswered, trigger: abandon, to: abandoning }", "- { from: unanswered, trigger: abandon, to: completed }"), /Canonical Practice session state machine must declare exactly its allowed triggered transitions/],
    ["undeclared simulation transition", validContract.replace("- { from: editable, trigger: finish, to: frozen }", "- { from: editable, trigger: finish, to: completed }"), /Canonical Simulation session state machine must declare exactly its allowed triggered transitions/],
    ["navigation retry without durability condition", validContract.replace("condition: durable_state_not_durable, to: navigating", "to: navigating"), /Canonical Simulation session state machine must declare exactly its allowed triggered transitions/],
    ["missing simulation concurrency contract", validContract.replace(/simulationConcurrency:[\s\S]*?\nalgorithms:/, "algorithms:"), /must have required property 'simulationConcurrency'/],
    ["unknown simulation concurrency field", validContract.replace("  maxInFlight: 1\n", "  maxInFlight: 1\n  extra: value\n"), /must NOT have additional properties/],
    ["changed simulation queue discipline", validContract.replace("  queueDiscipline: fifo\n", "  queueDiscipline: lifo\n"), /must be equal to constant/],
    ["missing serialized simulation mutation", validContract.replace("mutationKinds: [save, navigation, timer-checkpoint, foreground-transition, finalization, abandonment]", "mutationKinds: [save, navigation, timer-checkpoint, foreground-transition, finalization]"), /must NOT have fewer than 6 items/],
    ["duplicate serialized simulation mutation", validContract.replace("mutationKinds: [save, navigation, timer-checkpoint, foreground-transition, finalization, abandonment]", "mutationKinds: [save, save, timer-checkpoint, foreground-transition, finalization, abandonment]"), /must NOT have duplicate items/],
    ["unknown serialized simulation mutation", validContract.replace("mutationKinds: [save, navigation, timer-checkpoint, foreground-transition, finalization, abandonment]", "mutationKinds: [save, navigation, timer-checkpoint, foreground-transition, finalization, unknown]"), /must be equal to one of the allowed values/],
    ["reordered serialized simulation mutations", validContract.replace("mutationKinds: [save, navigation, timer-checkpoint, foreground-transition, finalization, abandonment]", "mutationKinds: [navigation, save, timer-checkpoint, foreground-transition, finalization, abandonment]"), /Canonical Simulation concurrency contract must declare exactly its serialized mutation kinds in canonical order/],
    ["missing simulation timer cadence", validContract.replace(/simulationTimerCadence:[\s\S]*?\nalgorithms:/, "algorithms:"), /must have required property 'simulationTimerCadence'/],
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
    ["missing design reference registry", validContract.replace(/designReferences:[\s\S]*?\nalgorithms:/, "algorithms:"), /must have required property 'designReferences'/],
    ["unknown design reference field", validContract.replace("designReferences:\n", "designReferences:\n  extra: value\n"), /must NOT have additional properties/],
    ["missing design reference UI ownership", validContract.replace(/  uiOwnership:\n(?:    .*\n){2}/, ""), /must have required property 'uiOwnership'/],
    ["missing design reference approval status", validContract.replace("      approvalStatus: APPROVED\n", ""), /must have required property 'approvalStatus'/],
    ["missing design reference pattern", validContract.replace("docs/designs/algorithms_active_simulation/active-simulation-reference.png", "docs/designs/algorithms_active_simulation/missing.png"), /pattern path does not resolve to a file/],
    ["design reference pattern escapes design registry", validContract.replace("docs/designs/algorithms_active_simulation/active-simulation-reference.png", "docs/designs/../release-candidate-closure.md"), /must resolve within docs\/designs/],
    ["duplicate design reference identifier", validContract.replace("      owner: product-owner\n  uiOwnership:", "      owner: product-owner\n    - id: algorithms-active-simulation-screen\n      screenStateTarget: algorithms-interview-simulation-active-question\n      patternPath: docs/designs/algorithms_active_simulation/active-simulation-reference.png\n      version: 1\n      approvalStatus: APPROVED\n      owner: product-owner\n  uiOwnership:"), /Duplicate canonical design reference identifier/],
    ["design reference UI ownership with an unknown reference", validContract.replace("designReferenceId: algorithms-active-simulation-screen", "designReferenceId: unknown-reference"), /Canonical design reference UI ownership names an unknown reference: unknown-reference/],
    ["design reference UI ownership without a directory boundary", validContract.replace("sourcePathPrefix: src/features/simulation/", "sourcePathPrefix: src/features"), /must match pattern/],
    ["design reference UI ownership without a trailing directory boundary", validContract.replace("sourcePathPrefix: src/features/simulation/", "sourcePathPrefix: src/features/foo"), /must match pattern/],
    ["design reference exact UI ownership with a non-TSX file", validContract.replace("sourcePathPrefix: src/content/application/ContentPreparationGate.tsx", "sourcePathPrefix: src/content/application/ContentPreparationGate.ts"), /must match a schema in anyOf/],
    ["design reference exact UI ownership with an arbitrary suffix", validContract.replace("sourcePathPrefix: src/content/application/ContentPreparationGate.tsx", "sourcePathPrefix: src/content/application/ContentPreparationGate.tsx.bak"), /must match a schema in anyOf/],
    ["design reference exact UI ownership outside a permitted root", validContract.replace("sourcePathPrefix: src/content/application/ContentPreparationGate.tsx", "sourcePathPrefix: App.tsx"), /must match a schema in anyOf/],
    ["duplicate Algorithms mode identifier", validContract.replace("    - id: algorithms-guided-practice", "    - id: algorithms-learn-approach"), /Duplicate canonical product contract Algorithms mode identifier/],
    ["mismatched Algorithms mode label", validContract.replace("label: Learn Approach", "label: Interview Simulation"), /Algorithms mode label does not match its identifier/],
    ["missing Algorithms mode field", validContract.replace("      reinsert: false\n", ""), /must have required property 'reinsert'/],
    ["duplicate supported length", validContract.replace("supported: [10]", "supported: [10, 10]"), /must NOT have duplicate items/],
    ["duplicate supported feedback", validContract.replace("supported: [afterEachAnswer]", "supported: [afterEachAnswer, afterEachAnswer]"), /must NOT have duplicate items/],
    ["unsupported default length", validContract.replace("      label: Guided Practice\n      lengths:\n        default: 20\n        supported: [10, 20, 40]", "      label: Guided Practice\n      lengths:\n        default: 20\n        supported: [10]"), /Algorithms mode default length must be supported/],
    ["unsupported default feedback", validContract.replace("        default: atSessionEnd\n        supported: [atSessionEnd]", "        default: atSessionEnd\n        supported: [afterEachAnswer]"), /Algorithms mode default feedback must be supported/],
    ["missing Custom Practice contract", validContract.replace("  customPractice:\n    modeId: algorithms-custom-practice\n    contentBlueprintModeId: algorithms-guided-practice\n    mentalUnitSelection: explicit\n    reinsertOwnership: profile\n    lifecycle: sharedOneActiveSession\n", ""), /must have required property 'customPractice'/],
    ["unknown Custom Practice contract field", validContract.replace("    lifecycle: sharedOneActiveSession\n", "    lifecycle: sharedOneActiveSession\n    extra: value\n"), /must NOT have additional properties/],
    ["changed Custom Practice mental-unit selection", validContract.replace("mentalUnitSelection: explicit", "mentalUnitSelection: inferred"), /must be equal to constant/],
    ["changed Custom Practice feedback options", validContract.replace("supported: [afterEachAnswer, atSessionEnd]", "supported: [afterEachAnswer]"), /Custom Practice mode must preserve its declared lengths, feedback, Guided Practice mental-unit blueprint, and reinsert profile/],
    ["missing Certification contract", validContract.replace(/certification:\n(?:  .*\n|    .*\n|      .*\n|        .*\n)+$/, ""), /must have required property 'certification'/],
    ["duplicate Certification mode identifier", validContract.replace("    - id: certification-focus-practice\n      label: Focus Practice", "    - id: certification-diagnostic-baseline\n      label: Focus Practice"), /Duplicate canonical product contract Certification mode identifier/],
    ["mismatched Certification mode label", validContract.replace("label: Diagnostic Baseline", "label: Exam Simulation"), /Certification mode label does not match its identifier/],
    ["missing Certification mode owner", validContract.replace("      owner:\n        familyId: certification\n        trackId: cloud-certification\n", ""), /must have required property 'owner'/],
    ["changed Certification Diagnostic Baseline implementation status", validContract.replace("        implementation: available", "        implementation: unavailable"), /Certification Diagnostic Baseline must preserve/],
  ];

  for (const [label, source, message] of cases) {
    assert.throws(() => parseCanonicalProductContract(source), (error: unknown) => error instanceof CanonicalProductContractValidationError && message.test(error.message), label);
  }
});
