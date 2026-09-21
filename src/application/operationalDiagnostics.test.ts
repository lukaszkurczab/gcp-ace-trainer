import assert from "node:assert/strict";
import test from "node:test";

import {
  ApplicationBootstrapStage,
  BOOTSTRAP_DIAGNOSTIC_SYMBOL,
  BootstrapInvariantError,
  type BootstrapDiagnosticEvent,
  clearDevelopmentBootstrapDiagnostic,
  describeOperationalFailure,
  observeBootstrapFailure,
  operationalDiagnosticCode,
  readDevelopmentBootstrapDiagnostic,
  recordDevelopmentBootstrapDiagnostic,
} from "./operationalDiagnostics";
import { CanonicalRepositoryBootstrapStep } from "../storage/repositories/canonicalRepositories";
import { ContentIdentityMigrationBootstrapStep } from "../storage/repositories/contentIdentityMigrationBootstrap";
import { ContentIdentityV2Error } from "../storage/contracts/contentIdentityV2";
import { ContentIdentityMigrationError, type ContentIdentityMigrationErrorCode } from "../storage/repositories/contentIdentityMigration";
import { CONTENT_IDENTITY_V2_PLANNER_OWNER_CODES, ContentIdentityV2PlannerError, type ContentIdentityV2PlannerErrorCode } from "../storage/repositories/contentIdentityV2Planner";
import { CONTENT_IDENTITY_LEGACY_TRAINING_SESSION_GUARD_CODES, type LegacyTrainingSessionGuardCode } from "../storage/repositories/contentIdentityInventory";
import { StorageMetadataError, type StorageMetadataErrorCode } from "../storage/repositories/storageMetadataRepository";
import { StorageWriteError } from "../storage/errors";

type ContentIdentityV2ErrorCode = ContentIdentityV2Error["code"];

const developmentFlag = globalThis as typeof globalThis & { __DEV__?: boolean };
const originalDevelopment = developmentFlag.__DEV__;
const diagnosticHost = globalThis as typeof globalThis & { [key: symbol]: unknown };

type TrainingSessionShape = {
  role: "index" | "active_pointer" | "record" | "other";
  topIdentity: "artifact_sha" | "package_pin" | "both" | "neither";
  itemIdentity: "resolved" | "legacy" | "mixed" | "empty" | "other";
  provenance: "both" | "taxonomy_only" | "fingerprint_only" | "neither";
  status: "active" | "completed" | "abandoned" | "other";
};

const TRAINING_SESSION_SHAPE: TrainingSessionShape = Object.freeze({
  role: "other",
  topIdentity: "neither",
  itemIdentity: "other",
  provenance: "neither",
  status: "other",
});

function annotateTrainingSessionShape(error: ContentIdentityV2PlannerError, shape: TrainingSessionShape = TRAINING_SESSION_SHAPE, guardCode?: LegacyTrainingSessionGuardCode): void {
  Object.defineProperty(error, "ownerCode", { configurable: false, enumerable: false, value: "trainingSessionRepository", writable: false });
  if (guardCode !== undefined) Object.defineProperty(error, "legacyTrainingSessionGuardCode", { configurable: false, enumerable: false, value: guardCode, writable: false });
  Object.defineProperty(error, "trainingSessionRoleCode", { configurable: false, enumerable: false, value: shape.role, writable: false });
  Object.defineProperty(error, "trainingSessionTopIdentityCode", { configurable: false, enumerable: false, value: shape.topIdentity, writable: false });
  Object.defineProperty(error, "trainingSessionItemIdentityCode", { configurable: false, enumerable: false, value: shape.itemIdentity, writable: false });
  Object.defineProperty(error, "trainingSessionProvenanceCode", { configurable: false, enumerable: false, value: shape.provenance, writable: false });
  Object.defineProperty(error, "trainingSessionStatusCode", { configurable: false, enumerable: false, value: shape.status, writable: false });
}

function boundedShapeFromEvent(event: BootstrapDiagnosticEvent): Readonly<Record<string, unknown>> {
  return {
    role: event.contentIdentityMigrationTrainingSessionRoleCode,
    topIdentity: event.contentIdentityMigrationTrainingSessionTopIdentityCode,
    itemIdentity: event.contentIdentityMigrationTrainingSessionItemIdentityCode,
    provenance: event.contentIdentityMigrationTrainingSessionProvenanceCode,
    status: event.contentIdentityMigrationTrainingSessionStatusCode,
  };
}

function observeAnnotatedPlannerFailure(error: ContentIdentityV2PlannerError, repositoryStepCode = CanonicalRepositoryBootstrapStep.ContentIdentityMigration): BootstrapDiagnosticEvent {
  const events: BootstrapDiagnosticEvent[] = [];
  observeBootstrapFailure(
    (event) => { events.push(event); },
    ApplicationBootstrapStage.OpeningStorage,
    error,
    repositoryStepCode,
    ContentIdentityMigrationBootstrapStep.MigrationApply,
  );
  assert.equal(events.length, 1);
  return events[0]!;
}

test.afterEach(() => {
  developmentFlag.__DEV__ = originalDevelopment;
  if (originalDevelopment === true) clearDevelopmentBootstrapDiagnostic();
  else Reflect.deleteProperty(diagnosticHost, BOOTSTRAP_DIAGNOSTIC_SYMBOL);
});

test("operational diagnostics retain a bounded category without exposing an injected learner payload", () => {
  const payload = "answer=secret-option draft=session-123 item=question-456";
  const error = new StorageWriteError(payload, new Error(payload));
  assert.equal(operationalDiagnosticCode(error), "STORAGE_WRITE_FAILED");
  const message = describeOperationalFailure(error, "Learning data could not be saved locally.");
  assert.equal(message, "Learning data could not be saved locally. [STORAGE_WRITE_FAILED]");
  assert.doesNotMatch(message, /secret-option|session-123|question-456|answer=|draft=/);
});

test("typed content-identity failures classify every source code without exposing raw details", () => {
  const plannerCodes: readonly ContentIdentityV2PlannerErrorCode[] = [
    "unregistered_key",
    "malformed_envelope",
    "owner_guard_failed",
    "unmapped_package_identity",
    "relationship_invalid",
    "invalid_artifact_set",
    "invalid_source",
  ];
  const migrationCodes: readonly ContentIdentityMigrationErrorCode[] = [
    "activation_required",
    "invalid_plan",
    "invalid_verifier",
    "unsupported_protocol",
    "stale_source",
    "source_snapshot_invalid",
    "protocol_state_invalid",
    "backup_incomplete",
    "blocked_recovery",
    "target_verification_failed",
    "manual_recovery_required",
    "storage_read_failed",
    "storage_write_failed",
    "storage_remove_failed",
    "cleanup_error",
  ];
  const v2Codes: readonly ContentIdentityV2ErrorCode[] = [
    "invalid_v2_record",
    "invalid_v2_resolution",
    "invalid_preservation",
    "forbidden_legacy_identity",
  ];
  const metadataCodes: readonly StorageMetadataErrorCode[] = [
    "storage_metadata_invalid",
    "storage_migration_pending",
    "unsupported_newer_storage_schema",
  ];
  const cases: Array<readonly [unknown, string]> = [
    ...plannerCodes.map((code) => [new ContentIdentityV2PlannerError(code), `planner:${code}`] as const),
    ...migrationCodes.map((code) => [new ContentIdentityMigrationError(code, new Error("migration raw=question-456")), `migration:${code}`] as const),
    ...v2Codes.map((code) => [new ContentIdentityV2Error(code, "v2 raw=payload-789"), `v2:${code}`] as const),
    ...metadataCodes.map((code) => [new StorageMetadataError(code), `metadata:${code}`] as const),
  ];

  for (const [error, expectedCode] of cases) {
    const events: BootstrapDiagnosticEvent[] = [];
    observeBootstrapFailure(
      (event) => { events.push(event); },
      ApplicationBootstrapStage.OpeningStorage,
      error,
      CanonicalRepositoryBootstrapStep.ContentIdentityMigration,
      ContentIdentityMigrationBootstrapStep.MigrationApply,
    );

    assert.deepEqual(events, [{
      stage: ApplicationBootstrapStage.OpeningStorage,
      operationalCode: "LOCAL_OPERATION_FAILED",
      repositoryStepCode: CanonicalRepositoryBootstrapStep.ContentIdentityMigration,
      contentIdentityMigrationStepCode: ContentIdentityMigrationBootstrapStep.MigrationApply,
      contentIdentityMigrationFailureCode: expectedCode,
      errorKind: "error",
    }]);
    assert.equal(Object.isFrozen(events[0]), true);
    assert.doesNotMatch(JSON.stringify(events), /raw|session-123|question-456|payload-789/);
  }
});

test("generic errors do not receive a typed migration failure code", () => {
  const events: unknown[] = [];

  observeBootstrapFailure(
    (event) => { events.push(event); },
    ApplicationBootstrapStage.OpeningStorage,
    new Error("generic raw=session-123"),
    CanonicalRepositoryBootstrapStep.ContentIdentityMigration,
    ContentIdentityMigrationBootstrapStep.MigrationApply,
  );

  assert.deepEqual(events, [{
    stage: ApplicationBootstrapStage.OpeningStorage,
    operationalCode: "LOCAL_OPERATION_FAILED",
    repositoryStepCode: CanonicalRepositoryBootstrapStep.ContentIdentityMigration,
    contentIdentityMigrationStepCode: ContentIdentityMigrationBootstrapStep.MigrationApply,
    errorKind: "error",
  }]);
  assert.doesNotMatch(JSON.stringify(events), /generic|raw|session-123/);
});

test("planner owner diagnostics accept every registry owner only on the migration boundary", () => {
  for (const ownerCode of CONTENT_IDENTITY_V2_PLANNER_OWNER_CODES) {
    const error = new ContentIdentityV2PlannerError("owner_guard_failed");
    error.message = "raw owner=session-123 payload=secret";
    Object.defineProperty(error, "ownerCode", { configurable: false, enumerable: false, value: ownerCode, writable: false });
    const events: BootstrapDiagnosticEvent[] = [];

    observeBootstrapFailure(
      (event) => { events.push(event); },
      ApplicationBootstrapStage.OpeningStorage,
      error,
      CanonicalRepositoryBootstrapStep.ContentIdentityMigration,
    );

    assert.deepEqual(events, [{
      stage: ApplicationBootstrapStage.OpeningStorage,
      operationalCode: "LOCAL_OPERATION_FAILED",
      repositoryStepCode: CanonicalRepositoryBootstrapStep.ContentIdentityMigration,
      contentIdentityMigrationFailureCode: "planner:owner_guard_failed",
      contentIdentityMigrationPlannerOwnerCode: ownerCode,
      errorKind: "error",
    }]);
    assert.equal(Object.isFrozen(events[0]), true);
    assert.doesNotMatch(JSON.stringify(events), /raw|session-123|secret|payload/);

    const wrongBoundary: BootstrapDiagnosticEvent[] = [];
    observeBootstrapFailure(
      (event) => { wrongBoundary.push(event); },
      ApplicationBootstrapStage.OpeningStorage,
      error,
      CanonicalRepositoryBootstrapStep.GuestAccessRead,
    );
    assert.equal("contentIdentityMigrationPlannerOwnerCode" in wrongBoundary[0]!, false);
    assert.equal("contentIdentityMigrationFailureCode" in wrongBoundary[0]!, false);
  }
});

test("typed training-session shape diagnostics accept every bounded value independently", () => {
  const roleCases = ["index", "active_pointer", "record", "other"] as const;
  for (const role of roleCases) {
    const error = new ContentIdentityV2PlannerError("owner_guard_failed");
    annotateTrainingSessionShape(error, { ...TRAINING_SESSION_SHAPE, role });
    const event = observeAnnotatedPlannerFailure(error);
    assert.equal(event.contentIdentityMigrationTrainingSessionRoleCode, role);
    assert.equal(Object.isFrozen(event), true);
  }

  const topIdentityCases = ["artifact_sha", "package_pin", "both", "neither"] as const;
  for (const topIdentity of topIdentityCases) {
    const error = new ContentIdentityV2PlannerError("owner_guard_failed");
    annotateTrainingSessionShape(error, { ...TRAINING_SESSION_SHAPE, topIdentity });
    const event = observeAnnotatedPlannerFailure(error);
    assert.equal(event.contentIdentityMigrationTrainingSessionTopIdentityCode, topIdentity);
  }

  const itemIdentityCases = ["resolved", "legacy", "mixed", "empty", "other"] as const;
  for (const itemIdentity of itemIdentityCases) {
    const error = new ContentIdentityV2PlannerError("owner_guard_failed");
    annotateTrainingSessionShape(error, { ...TRAINING_SESSION_SHAPE, itemIdentity });
    const event = observeAnnotatedPlannerFailure(error);
    assert.equal(event.contentIdentityMigrationTrainingSessionItemIdentityCode, itemIdentity);
  }

  const provenanceCases = ["both", "taxonomy_only", "fingerprint_only", "neither"] as const;
  for (const provenance of provenanceCases) {
    const error = new ContentIdentityV2PlannerError("owner_guard_failed");
    annotateTrainingSessionShape(error, { ...TRAINING_SESSION_SHAPE, provenance });
    const event = observeAnnotatedPlannerFailure(error);
    assert.equal(event.contentIdentityMigrationTrainingSessionProvenanceCode, provenance);
  }

  const statusCases = ["active", "completed", "abandoned", "other"] as const;
  for (const status of statusCases) {
    const error = new ContentIdentityV2PlannerError("owner_guard_failed");
    annotateTrainingSessionShape(error, { ...TRAINING_SESSION_SHAPE, status });
    const event = observeAnnotatedPlannerFailure(error);
    assert.equal(event.contentIdentityMigrationTrainingSessionStatusCode, status);
  }
});

test("typed training-session shape events are frozen, bounded, and redact planner details", () => {
  const error = new ContentIdentityV2PlannerError("owner_guard_failed");
  error.message = "raw message=session-123 item=question-456 payload=secret";
  annotateTrainingSessionShape(error, {
    role: "record",
    topIdentity: "package_pin",
    itemIdentity: "legacy",
    provenance: "taxonomy_only",
    status: "active",
  });
  const event = observeAnnotatedPlannerFailure(error);
  assert.deepEqual(boundedShapeFromEvent(event), {
    role: "record",
    topIdentity: "package_pin",
    itemIdentity: "legacy",
    provenance: "taxonomy_only",
    status: "active",
  });
  assert.equal(event.contentIdentityMigrationFailureCode, "planner:owner_guard_failed");
  assert.equal(event.contentIdentityMigrationPlannerOwnerCode, "trainingSessionRepository");
  assert.equal(Object.isFrozen(event), true);
  assert.doesNotMatch(JSON.stringify(event), /raw|message|session-123|question-456|secret|payload|stack|ownerCode/);
  assert.doesNotMatch(JSON.stringify(error), /trainingSession|session-123|question-456|packagePin|artifactSha256/);
});

test("legacy training-session guard events accept every closed code and stay bounded", () => {
  for (const guardCode of CONTENT_IDENTITY_LEGACY_TRAINING_SESSION_GUARD_CODES) {
    const error = new ContentIdentityV2PlannerError("owner_guard_failed");
    error.message = "raw legacy payload=session-123 question=question-456";
    annotateTrainingSessionShape(error, TRAINING_SESSION_SHAPE, guardCode);
    const event = observeAnnotatedPlannerFailure(error);
    assert.equal(event.contentIdentityMigrationLegacyTrainingSessionGuardCode, guardCode);
    assert.equal(Object.isFrozen(event), true);
    assert.doesNotMatch(JSON.stringify(event), /raw|legacy|session-123|question-456|message|stack|payload/);
    const descriptor = Object.getOwnPropertyDescriptor(error, "legacyTrainingSessionGuardCode");
    assert.equal(descriptor?.enumerable, false);
    assert.equal(descriptor?.writable, false);
    assert.equal(descriptor?.configurable, false);
  }
});

test("legacy training-session guard events require the relevant owner, code, and migration boundary", () => {
  const wrongOwner = new ContentIdentityV2PlannerError("owner_guard_failed");
  Object.defineProperty(wrongOwner, "ownerCode", { configurable: false, enumerable: false, value: "settingsRepository", writable: false });
  Object.defineProperty(wrongOwner, "legacyTrainingSessionGuardCode", { configurable: false, enumerable: false, value: "id", writable: false });
  const wrongOwnerEvent = observeAnnotatedPlannerFailure(wrongOwner);
  assert.equal("contentIdentityMigrationLegacyTrainingSessionGuardCode" in wrongOwnerEvent, false);

  const wrongPlannerCode = new ContentIdentityV2PlannerError("unmapped_package_identity");
  annotateTrainingSessionShape(wrongPlannerCode, TRAINING_SESSION_SHAPE, "id");
  const wrongPlannerCodeEvent = observeAnnotatedPlannerFailure(wrongPlannerCode);
  assert.equal("contentIdentityMigrationLegacyTrainingSessionGuardCode" in wrongPlannerCodeEvent, false);

  const globalFailure = new ContentIdentityV2PlannerError("unregistered_key");
  annotateTrainingSessionShape(globalFailure, TRAINING_SESSION_SHAPE, "id");
  const globalEvent = observeAnnotatedPlannerFailure(globalFailure);
  assert.equal("contentIdentityMigrationPlannerOwnerCode" in globalEvent, false);
  assert.equal("contentIdentityMigrationLegacyTrainingSessionGuardCode" in globalEvent, false);

  const genericEvents: BootstrapDiagnosticEvent[] = [];
  observeBootstrapFailure((event) => { genericEvents.push(event); }, ApplicationBootstrapStage.OpeningStorage, new Error("generic raw=session-123"), CanonicalRepositoryBootstrapStep.ContentIdentityMigration);
  assert.equal("contentIdentityMigrationLegacyTrainingSessionGuardCode" in genericEvents[0]!, false);

  const wrongBoundary = new ContentIdentityV2PlannerError("owner_guard_failed");
  annotateTrainingSessionShape(wrongBoundary, TRAINING_SESSION_SHAPE, "id");
  const wrongBoundaryEvent = observeAnnotatedPlannerFailure(wrongBoundary, CanonicalRepositoryBootstrapStep.GuestAccessRead);
  assert.equal("contentIdentityMigrationLegacyTrainingSessionGuardCode" in wrongBoundaryEvent, false);

  const invalidCode = new ContentIdentityV2PlannerError("owner_guard_failed");
  annotateTrainingSessionShape(invalidCode);
  Object.defineProperty(invalidCode, "legacyTrainingSessionGuardCode", { configurable: false, enumerable: false, value: "not-allowlisted", writable: false });
  const invalidCodeEvent = observeAnnotatedPlannerFailure(invalidCode);
  assert.equal("contentIdentityMigrationLegacyTrainingSessionGuardCode" in invalidCodeEvent, false);
});

test("training-session shape diagnostics are gated by owner, planner code, boundary, and complete shape", () => {
  const wrongOwner = new ContentIdentityV2PlannerError("owner_guard_failed");
  Object.defineProperty(wrongOwner, "ownerCode", { configurable: false, enumerable: false, value: "settingsRepository", writable: false });
  Object.defineProperty(wrongOwner, "trainingSessionRoleCode", { configurable: false, enumerable: false, value: "record", writable: false });
  const wrongOwnerEvent = observeAnnotatedPlannerFailure(wrongOwner);
  assert.equal("contentIdentityMigrationTrainingSessionRoleCode" in wrongOwnerEvent, false);

  const wrongPlannerCode = new ContentIdentityV2PlannerError("unmapped_package_identity");
  annotateTrainingSessionShape(wrongPlannerCode);
  const wrongPlannerCodeEvent = observeAnnotatedPlannerFailure(wrongPlannerCode);
  assert.equal(wrongPlannerCodeEvent.contentIdentityMigrationPlannerOwnerCode, "trainingSessionRepository");
  assert.equal("contentIdentityMigrationTrainingSessionRoleCode" in wrongPlannerCodeEvent, false);

  const globalFailure = new ContentIdentityV2PlannerError("unregistered_key");
  annotateTrainingSessionShape(globalFailure);
  const globalEvent = observeAnnotatedPlannerFailure(globalFailure);
  assert.equal("contentIdentityMigrationPlannerOwnerCode" in globalEvent, false);
  assert.equal("contentIdentityMigrationTrainingSessionRoleCode" in globalEvent, false);

  const genericEvents: BootstrapDiagnosticEvent[] = [];
  observeBootstrapFailure((event) => { genericEvents.push(event); }, ApplicationBootstrapStage.OpeningStorage, new Error("generic raw=session-123"), CanonicalRepositoryBootstrapStep.ContentIdentityMigration);
  assert.equal("contentIdentityMigrationTrainingSessionRoleCode" in genericEvents[0]!, false);

  const wrongBoundary = new ContentIdentityV2PlannerError("owner_guard_failed");
  annotateTrainingSessionShape(wrongBoundary);
  const wrongBoundaryEvent = observeAnnotatedPlannerFailure(wrongBoundary, CanonicalRepositoryBootstrapStep.GuestAccessRead);
  assert.equal("contentIdentityMigrationTrainingSessionRoleCode" in wrongBoundaryEvent, false);

  const partialShape = new ContentIdentityV2PlannerError("owner_guard_failed");
  Object.defineProperty(partialShape, "ownerCode", { configurable: false, enumerable: false, value: "trainingSessionRepository", writable: false });
  Object.defineProperty(partialShape, "trainingSessionRoleCode", { configurable: false, enumerable: false, value: "record", writable: false });
  const partialEvent = observeAnnotatedPlannerFailure(partialShape);
  assert.equal("contentIdentityMigrationTrainingSessionRoleCode" in partialEvent, false);
});

test("planner owner field rejects arbitrary, global, and frozen error state", () => {
  const cases: readonly [unknown, boolean][] = [
    [Object.assign(new ContentIdentityV2PlannerError("owner_guard_failed"), { ownerCode: "not-a-registry-owner" }), false],
    [Object.assign(new ContentIdentityV2PlannerError("unregistered_key"), { ownerCode: "settingsRepository" }), false],
    [Object.assign(new ContentIdentityV2PlannerError("relationship_invalid"), { ownerCode: "settingsRepository" }), false],
    [Object.freeze(new ContentIdentityV2PlannerError("owner_guard_failed")), false],
  ];

  for (const [error, hasOwner] of cases) {
    const events: BootstrapDiagnosticEvent[] = [];
    observeBootstrapFailure(
      (event) => { events.push(event); },
      ApplicationBootstrapStage.OpeningStorage,
      error,
      CanonicalRepositoryBootstrapStep.ContentIdentityMigration,
    );
    assert.equal("contentIdentityMigrationPlannerOwnerCode" in events[0]!, hasOwner);
    assert.equal(Object.isFrozen(events[0]), true);
    assert.doesNotMatch(JSON.stringify(events), /not-a-registry-owner|ownerCode/);
  }
});

test("typed migration failures are omitted for a non-migration repository step", () => {
  const events: unknown[] = [];

  observeBootstrapFailure(
    (event) => { events.push(event); },
    ApplicationBootstrapStage.OpeningStorage,
    new ContentIdentityMigrationError("cleanup_error", "migration raw=session-123"),
    CanonicalRepositoryBootstrapStep.GuestInstallationProvisioning,
    ContentIdentityMigrationBootstrapStep.PostMigrationCleanup,
  );

  assert.deepEqual(events, [{
    stage: ApplicationBootstrapStage.OpeningStorage,
    operationalCode: "LOCAL_OPERATION_FAILED",
    repositoryStepCode: CanonicalRepositoryBootstrapStep.GuestInstallationProvisioning,
    errorKind: "error",
  }]);
});

test("bootstrap diagnostics expose one bounded stage/code projection and redact invariant details", () => {
  const events: unknown[] = [];
  const error = new BootstrapInvariantError("active_session_draft_missing", "missing draft for session=session-123 payload=secret");

  observeBootstrapFailure((event) => { events.push(event); }, ApplicationBootstrapStage.ValidatingActiveSession, error);

  assert.deepEqual(events, [{
    stage: "validating-active-session",
    operationalCode: "LOCAL_OPERATION_FAILED",
    invariantCode: "active_session_draft_missing",
    errorKind: "error",
  }]);
  assert.doesNotMatch(JSON.stringify(events), /missing draft|session-123|secret|payload/);
});

test("a throwing bootstrap diagnostic observer cannot affect the learner-visible result", () => {
  assert.doesNotThrow(() => {
    observeBootstrapFailure(() => { throw new Error("observer payload=session-123"); }, ApplicationBootstrapStage.VerifyingContent, new Error("raw payload=session-123"));
  });
});

test("development bootstrap diagnostics round-trip through the global symbol and clear atomically", () => {
  developmentFlag.__DEV__ = true;
  clearDevelopmentBootstrapDiagnostic();
  const event: BootstrapDiagnosticEvent = Object.freeze({
    stage: ApplicationBootstrapStage.ValidatingActiveSession,
    operationalCode: "LOCAL_OPERATION_FAILED",
    invariantCode: "active_session_draft_missing",
    repositoryStepCode: CanonicalRepositoryBootstrapStep.ContentIdentityMigration,
    contentIdentityMigrationStepCode: ContentIdentityMigrationBootstrapStep.MigrationPlan,
    contentIdentityMigrationFailureCode: "planner:owner_guard_failed",
    contentIdentityMigrationPlannerOwnerCode: "settingsRepository",
    errorKind: "error",
  });

  recordDevelopmentBootstrapDiagnostic(event);

  const bridged = diagnosticHost[BOOTSTRAP_DIAGNOSTIC_SYMBOL];
  assert.deepEqual(readDevelopmentBootstrapDiagnostic(), bridged);
  assert.deepEqual(bridged, event);
  assert.equal(Object.isFrozen(bridged), true);
  const descriptor = Object.getOwnPropertyDescriptor(diagnosticHost, BOOTSTRAP_DIAGNOSTIC_SYMBOL);
  assert.equal(descriptor?.enumerable, false);
  assert.equal(descriptor?.configurable, true);
  assert.equal(descriptor?.writable, false);

  clearDevelopmentBootstrapDiagnostic();
  assert.equal(Object.prototype.hasOwnProperty.call(diagnosticHost, BOOTSTRAP_DIAGNOSTIC_SYMBOL), false);
  assert.equal(readDevelopmentBootstrapDiagnostic(), null);
});

test("development bridge round-trips the complete training-session shape by value", () => {
  developmentFlag.__DEV__ = true;
  clearDevelopmentBootstrapDiagnostic();
  const event: BootstrapDiagnosticEvent = Object.freeze({
    stage: ApplicationBootstrapStage.OpeningStorage,
    operationalCode: "LOCAL_OPERATION_FAILED",
    repositoryStepCode: CanonicalRepositoryBootstrapStep.ContentIdentityMigration,
    contentIdentityMigrationStepCode: ContentIdentityMigrationBootstrapStep.MigrationApply,
    contentIdentityMigrationFailureCode: "planner:owner_guard_failed",
    contentIdentityMigrationPlannerOwnerCode: "trainingSessionRepository",
    contentIdentityMigrationLegacyTrainingSessionGuardCode: "conditional_reinsert_slots",
    contentIdentityMigrationTrainingSessionRoleCode: "other",
    contentIdentityMigrationTrainingSessionTopIdentityCode: "neither",
    contentIdentityMigrationTrainingSessionItemIdentityCode: "other",
    contentIdentityMigrationTrainingSessionProvenanceCode: "neither",
    contentIdentityMigrationTrainingSessionStatusCode: "other",
    errorKind: "error",
  });

  recordDevelopmentBootstrapDiagnostic(event);

  const bridged = diagnosticHost[BOOTSTRAP_DIAGNOSTIC_SYMBOL];
  assert.deepEqual(readDevelopmentBootstrapDiagnostic(), event);
  assert.deepEqual(bridged, event);
  assert.equal(Object.isFrozen(bridged), true);
  assert.doesNotMatch(JSON.stringify(bridged), /message|stack|session|question|payload|ownerCode/);
  clearDevelopmentBootstrapDiagnostic();
  assert.equal(readDevelopmentBootstrapDiagnostic(), null);
});

test("production bootstrap diagnostics do not create or write the global bridge", () => {
  developmentFlag.__DEV__ = false;
  Reflect.deleteProperty(diagnosticHost, BOOTSTRAP_DIAGNOSTIC_SYMBOL);

  recordDevelopmentBootstrapDiagnostic(Object.freeze({
    stage: ApplicationBootstrapStage.VerifyingContent,
    operationalCode: "LOCAL_OPERATION_FAILED",
    repositoryStepCode: CanonicalRepositoryBootstrapStep.ContentIdentityMigration,
    contentIdentityMigrationStepCode: ContentIdentityMigrationBootstrapStep.MigrationApply,
    contentIdentityMigrationFailureCode: "planner:owner_guard_failed",
    contentIdentityMigrationPlannerOwnerCode: "trainingSessionRepository",
    contentIdentityMigrationLegacyTrainingSessionGuardCode: "conditional_reinsert_slots",
    contentIdentityMigrationTrainingSessionRoleCode: "other",
    contentIdentityMigrationTrainingSessionTopIdentityCode: "neither",
    contentIdentityMigrationTrainingSessionItemIdentityCode: "other",
    contentIdentityMigrationTrainingSessionProvenanceCode: "neither",
    contentIdentityMigrationTrainingSessionStatusCode: "other",
    errorKind: "error",
  }));

  assert.equal(Object.prototype.hasOwnProperty.call(diagnosticHost, BOOTSTRAP_DIAGNOSTIC_SYMBOL), false);
  assert.equal(readDevelopmentBootstrapDiagnostic(), null);
});

test("development bridge rejects a typed migration failure on a non-migration repository step", () => {
  developmentFlag.__DEV__ = true;
  clearDevelopmentBootstrapDiagnostic();
  Object.defineProperty(diagnosticHost, BOOTSTRAP_DIAGNOSTIC_SYMBOL, {
    configurable: true,
    enumerable: false,
    value: Object.freeze({
      stage: ApplicationBootstrapStage.OpeningStorage,
      operationalCode: "LOCAL_OPERATION_FAILED",
      repositoryStepCode: CanonicalRepositoryBootstrapStep.GuestAccessRead,
      contentIdentityMigrationFailureCode: "migration:cleanup_error",
      errorKind: "error",
    }),
    writable: false,
  });

  assert.equal(readDevelopmentBootstrapDiagnostic(), null);
});

test("development bridge rejects a planner owner without an owner-specific typed failure", () => {
  developmentFlag.__DEV__ = true;
  clearDevelopmentBootstrapDiagnostic();
  Object.defineProperty(diagnosticHost, BOOTSTRAP_DIAGNOSTIC_SYMBOL, {
    configurable: true,
    enumerable: false,
    value: Object.freeze({
      stage: ApplicationBootstrapStage.OpeningStorage,
      operationalCode: "LOCAL_OPERATION_FAILED",
      repositoryStepCode: CanonicalRepositoryBootstrapStep.ContentIdentityMigration,
      contentIdentityMigrationFailureCode: "planner:relationship_invalid",
      contentIdentityMigrationPlannerOwnerCode: "settingsRepository",
      errorKind: "error",
    }),
    writable: false,
  });

  assert.equal(readDevelopmentBootstrapDiagnostic(), null);
});

test("async observer rejection is isolated from the bounded diagnostic boundary", async () => {
  developmentFlag.__DEV__ = false;
  observeBootstrapFailure(async () => { throw new Error("observer payload=session-789"); }, ApplicationBootstrapStage.VerifyingContent, new Error("raw payload=session-789"));
  await new Promise<void>((resolve) => setImmediate(resolve));
});
