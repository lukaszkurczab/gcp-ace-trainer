import {
  RecoveryOperationVaultError,
  type RecoveryConsumeVaultRecord,
  type RecoveryIssueVaultRecord,
  type RecoveryOperationStatus,
  type RecoveryOperationVault,
  type RecoveryOperationVaultRecord,
} from "../../infrastructure/security/recoveryOperationVault";
import type {
  PatternlyApiClient,
  RecoveryCodeIssueResultDto,
  RecoveryConsumeResultDto,
  RecoveryOperationAcknowledgementDto,
} from "../../infrastructure/clients/PatternlyApiClientAdapter";

const RECOVERY_CODE_PATTERN = /^[A-Z2-9]{4}(?:-[A-Z2-9]{4}){3}$/u;
const OPERATION_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

/** An observed Firebase identity can exist before its authorization generation is trustworthy. */
export type RecoveryOperationIdentity = Readonly<{ firebaseUid: string; authorizationGeneration: number | null }>;
export type RecoveryOperationIssueIdentity = Readonly<{ firebaseUid: string; authorizationGeneration: number }>;
export type RecoveryOperationFailure = "offline" | "unauthorized" | "conflict" | "rate_limited" | "unavailable" | "invalid_response";

export type RecoveryOperationSnapshot =
  | Readonly<{ kind: "loading"; blocksProfilePreparation: true }>
  | Readonly<{ kind: "unavailable"; reason: "vault_unavailable" | "vault_corrupt" | "operation_unavailable"; blocksProfilePreparation: true }>
  | Readonly<{ kind: "idle"; blocksProfilePreparation: false }>
  | Readonly<{
      kind: "issue";
      operationId: string;
      status: RecoveryOperationStatus;
      firebaseUid: string;
      authorizationGeneration: number;
      generationId: string | null;
      codes: readonly string[] | null;
      savedIntent: boolean;
      replacementPending: boolean;
      /** Ephemeral lineage from the already-validated encrypted record; never persisted separately. */
      previousIssueOperationId?: string;
      deferredFor: Readonly<{ firebaseUid: string; authorizationGeneration: number }> | null;
      accountResolution: "missing_generation" | "different_uid" | "different_generation" | null;
      needsAccountResolution: boolean;
      failure: RecoveryOperationFailure | null;
      blocksProfilePreparation: boolean;
    }>
  | Readonly<{
      kind: "consume";
      operationId: string;
      status: RecoveryOperationStatus;
      expectedFirebaseUid: string | null;
      expectedAuthorizationGeneration: number | null;
      needsAccountResolution: boolean;
      signInInFlight: boolean;
      failure: RecoveryOperationFailure | null;
      blocksProfilePreparation: true;
    }>
  | Readonly<{ kind: "terminal"; operationId: string; status: "acknowledged" | "superseded" | "expired_or_invalid"; previousIssueOperationId?: string; blocksProfilePreparation: false }>;

export type RecoveryIssueResponse = RecoveryCodeIssueResultDto;
export type RecoveryConsumeResponse = RecoveryConsumeResultDto;
export type RecoveryOperationAcknowledgement = RecoveryOperationAcknowledgementDto;

export type RecoveryOperationApi = Pick<PatternlyApiClient,
  | "issueRecoveryCodes"
  | "getRecoveryCodeIssueStatus"
  | "acknowledgeRecoveryCodesSaved"
  | "consumeRecoveryCode"
  | "getRecoveryCodeConsumeStatus"
  | "acknowledgeRecoveryCodeConsumption"
>;

export type RecoveryOperationAuth = Readonly<{
  getSnapshot: () => Readonly<{ uid: string }> | null;
  getAuthorizationGeneration: () => Promise<number | null>;
  signInWithRecoveryToken: (customToken: string) => Promise<Readonly<{ uid: string }>>;
}>;

export type RecoveryOperationCoordinatorDependencies = Readonly<{
  api: RecoveryOperationApi;
  auth: RecoveryOperationAuth;
  newOperationId: () => string;
  vault: RecoveryOperationVault;
}>;

export type RecoveryOperationCoordinator = Readonly<{
  getSnapshot: () => RecoveryOperationSnapshot;
  subscribe: (listener: (snapshot: RecoveryOperationSnapshot) => void) => () => void;
  load: () => Promise<RecoveryOperationSnapshot>;
  suspendPendingIdentity: () => RecoveryOperationSnapshot;
  deferIssueToIdentity: (operationId: string, identity: RecoveryOperationIdentity) => Promise<RecoveryOperationSnapshot>;
  startIssue: (identity: RecoveryOperationIssueIdentity, options?: Readonly<{ replaceUnavailable?: boolean }>) => Promise<RecoveryOperationSnapshot>;
  confirmRecoveryCodesSaved: () => Promise<RecoveryOperationSnapshot>;
  startConsume: (code: string) => Promise<RecoveryOperationSnapshot>;
  reconcilePending: (currentIdentity: RecoveryOperationIdentity | null) => Promise<RecoveryOperationSnapshot>;
  resumePendingRecovery: () => Promise<RecoveryOperationSnapshot>;
  retryRecoveryOperation: () => Promise<RecoveryOperationSnapshot>;
}>;

class RecoveryOperationProtocolError extends Error {
  public constructor() { super("recovery_operation_response_invalid"); this.name = "RecoveryOperationProtocolError"; }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, required: readonly string[], optional: readonly string[] = []): boolean {
  const allowed = new Set([...required, ...optional]);
  const keys = Object.keys(value);
  return required.every((key) => Object.hasOwn(value, key)) && keys.every((key) => allowed.has(key));
}

function isOperationId(value: unknown): value is string {
  return typeof value === "string" && OPERATION_ID_PATTERN.test(value);
}

function isGeneration(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 1;
}

function isStatus(value: unknown): value is RecoveryOperationStatus {
  return value === "in_progress" || value === "result_available" || value === "acknowledged" || value === "delivery_unconfirmed" || value === "superseded" || value === "expired_or_invalid" || value === "provider_retryable";
}

function validIssueResponse(value: unknown, operationId: string): value is RecoveryIssueResponse {
  if (!isRecord(value) || value.operationId !== operationId || !isStatus(value.status)) return false;
  if (value.status === "result_available") {
    return hasExactKeys(value, ["operationId", "status", "generationId", "authorizationGeneration", "codes"])
      && typeof value.generationId === "string"
      && value.generationId.length > 0
      && isGeneration(value.authorizationGeneration)
      && Array.isArray(value.codes)
      && value.codes.length === 10
      && value.codes.every((code) => typeof code === "string" && RECOVERY_CODE_PATTERN.test(code))
      && new Set(value.codes).size === value.codes.length;
  }
  return hasExactKeys(value, ["operationId", "status"], ["authorizationGeneration"])
    && (value.authorizationGeneration === undefined || isGeneration(value.authorizationGeneration));
}

function validConsumeResponse(value: unknown, operationId: string): value is RecoveryConsumeResponse {
  if (!isRecord(value) || value.operationId !== operationId || !isStatus(value.status)) return false;
  if (value.status === "result_available") {
    return hasExactKeys(value, ["operationId", "status", "firebaseUid", "authorizationGeneration", "customToken"])
      && typeof value.firebaseUid === "string"
      && value.firebaseUid.length > 0
      && value.firebaseUid.length <= 128
      && value.firebaseUid.trim() === value.firebaseUid
      && isGeneration(value.authorizationGeneration)
      && typeof value.customToken === "string"
      && value.customToken.length > 0;
  }
  return hasExactKeys(value, ["operationId", "status"], ["authorizationGeneration"])
    && (value.authorizationGeneration === undefined || isGeneration(value.authorizationGeneration));
}

function validAcknowledgement(value: unknown, operationId: string, generation: number): value is RecoveryOperationAcknowledgement {
  return isRecord(value)
    && hasExactKeys(value, ["operationId", "status", "authorizationGeneration"])
    && value.operationId === operationId
    && value.status === "acknowledged"
    && value.authorizationGeneration === generation;
}

function safeFailure(error: unknown): RecoveryOperationFailure {
  const value = isRecord(error) ? error : {};
  const code = typeof value.serverCode === "string" ? value.serverCode : typeof value.code === "string" ? value.code : "";
  const status = typeof value.status === "number" ? value.status : undefined;
  if (["network_unavailable", "network_request_failed", "offline"].includes(code) || status === 0) return "offline";
  if (status === 401 || ["authorization_generation_required", "authorization_generation_invalid", "operator_token_invalid"].includes(code)) return "unauthorized";
  if (status === 409 || code.endsWith("_conflict") || code.endsWith("_in_progress")) return "conflict";
  if (status === 429 || code.includes("rate_limit")) return "rate_limited";
  if (error instanceof RecoveryOperationVaultError) return "unavailable";
  if (error instanceof RecoveryOperationProtocolError) return "invalid_response";
  return "unavailable";
}

function isMissingIssueOperation(error: unknown): boolean {
  return isRecord(error) && error.status === 404 && error.serverCode === "recovery_operation_unavailable";
}

function immutableCodes(codes: readonly string[] | null): readonly string[] | null {
  return codes === null ? null : Object.freeze([...codes]);
}

export function createRecoveryOperationCoordinator(dependencies: RecoveryOperationCoordinatorDependencies): RecoveryOperationCoordinator {
  let snapshot: RecoveryOperationSnapshot = Object.freeze({ kind: "loading", blocksProfilePreparation: true });
  let record: RecoveryOperationVaultRecord | null = null;
  let loaded = false;
  let lane: Promise<unknown> = Promise.resolve();
  const listeners = new Set<(value: RecoveryOperationSnapshot) => void>();

  const publish = (next: RecoveryOperationSnapshot): RecoveryOperationSnapshot => {
    snapshot = Object.freeze(next);
    for (const listener of listeners) {
      try { listener(snapshot); } catch { /* Subscribers cannot interrupt secure operation ordering. */ }
    }
    return snapshot;
  };

  const enqueue = <T>(operation: () => Promise<T>): Promise<T> => {
    const current = lane.then(operation, operation);
    lane = current.then(() => undefined, () => undefined);
    return current;
  };

  const unavailable = (reason: "vault_unavailable" | "vault_corrupt" | "operation_unavailable"): RecoveryOperationSnapshot => publish({ kind: "unavailable", reason, blocksProfilePreparation: true });

  const issueSnapshot = (value: RecoveryIssueVaultRecord, needsAccountResolution: boolean, failure: RecoveryOperationFailure | null = null, accountResolution: Extract<RecoveryOperationSnapshot, { kind: "issue" }>["accountResolution"] = null, previousIssueOperationId?: string): RecoveryOperationSnapshot => publish({
    kind: "issue",
    operationId: value.operationId,
    status: value.status,
    firebaseUid: value.firebaseUid,
    authorizationGeneration: value.authorizationGeneration,
    generationId: needsAccountResolution || value.savedIntent || value.deferredFor ? null : value.generationId,
    codes: needsAccountResolution || value.savedIntent || value.deferredFor ? null : immutableCodes(value.codes),
    savedIntent: value.savedIntent,
    replacementPending: value.previousIssue !== undefined,
    ...(previousIssueOperationId ?? value.previousIssue?.operationId ? { previousIssueOperationId: previousIssueOperationId ?? value.previousIssue?.operationId } : {}),
    deferredFor: value.deferredFor ?? null,
    accountResolution,
    needsAccountResolution,
    failure,
    // Startup must not prepare an account profile while a durable issue can still
    // require ACK. Matching identity only controls whether the codes are visible.
    blocksProfilePreparation: value.deferredFor ? needsAccountResolution : true,
  });

  const issueSnapshotForPinnedIdentity = async (value: RecoveryIssueVaultRecord, failure: RecoveryOperationFailure | null = null): Promise<RecoveryOperationSnapshot> => {
    const identity = { firebaseUid: value.firebaseUid, authorizationGeneration: value.authorizationGeneration };
    return (await hasIdentity(identity)) ? issueSnapshot(value, false, failure) : issueSnapshot(value, true, "conflict");
  };

  const consumeSnapshot = (value: RecoveryConsumeVaultRecord, needsAccountResolution: boolean, failure: RecoveryOperationFailure | null = null, signInInFlight = false): RecoveryOperationSnapshot => publish({
    kind: "consume",
    operationId: value.operationId,
    status: value.status,
    expectedFirebaseUid: value.expectedFirebaseUid,
    expectedAuthorizationGeneration: value.expectedAuthorizationGeneration,
    needsAccountResolution,
    signInInFlight,
    failure,
    blocksProfilePreparation: true,
  });

  const terminal = async (operationId: string, status: "acknowledged" | "superseded" | "expired_or_invalid", previousIssueOperationId?: string): Promise<RecoveryOperationSnapshot> => {
    await dependencies.vault.clear();
    record = null;
    loaded = true;
    return publish({ kind: "terminal", operationId, status, ...(previousIssueOperationId ? { previousIssueOperationId } : {}), blocksProfilePreparation: false });
  };

  const loadInternal = async (): Promise<RecoveryOperationSnapshot> => {
    if (loaded) return snapshot;
    try {
      record = await dependencies.vault.load();
      loaded = true;
    } catch (error) {
      loaded = false;
      return unavailable(error instanceof RecoveryOperationVaultError && error.code === "recovery_operation_vault_corrupt" ? "vault_corrupt" : "vault_unavailable");
    }
    if (!record) return publish({ kind: "idle", blocksProfilePreparation: false });
    if (record.kind === "issue") return issueSnapshot(record, true);
    return consumeSnapshot(record, true);
  };

  const hasIdentity = async (identity: RecoveryOperationIdentity): Promise<boolean> => {
    if (!identity.firebaseUid || !isGeneration(identity.authorizationGeneration) || dependencies.auth.getSnapshot()?.uid !== identity.firebaseUid) return false;
    try {
      const generation = await dependencies.auth.getAuthorizationGeneration();
      return dependencies.auth.getSnapshot()?.uid === identity.firebaseUid && generation === identity.authorizationGeneration;
    } catch { return false; }
  };

  const persistIssueResponse = async (current: RecoveryIssueVaultRecord, responseValue: unknown): Promise<RecoveryOperationSnapshot> => {
    if (!validIssueResponse(responseValue, current.operationId)) throw new RecoveryOperationProtocolError();
    const response = responseValue;
    if (response.authorizationGeneration !== undefined && response.authorizationGeneration !== current.authorizationGeneration) throw new RecoveryOperationProtocolError();
    if (response.status === "acknowledged" || response.status === "superseded" || response.status === "expired_or_invalid") {
      if (current.previousIssue) {
        if (response.status === "acknowledged" || response.status === "superseded") {
          if (!(await hasIdentity({ firebaseUid: current.firebaseUid, authorizationGeneration: current.authorizationGeneration }))) return issueSnapshot(current, true, "conflict");
          return terminal(current.operationId, response.status, current.previousIssue?.operationId);
        }
        const preserved = Object.freeze({ ...current, status: response.status });
        await dependencies.vault.save(preserved);
        record = preserved;
        if (!(await hasIdentity({ firebaseUid: preserved.firebaseUid, authorizationGeneration: preserved.authorizationGeneration }))) return issueSnapshot(preserved, true, "conflict");
        return issueSnapshot(preserved, false, "unavailable");
      }
      return terminal(current.operationId, response.status);
    }
    const next: RecoveryIssueVaultRecord = Object.freeze({
      ...current,
      status: response.status,
      generationId: response.status === "result_available" ? response.generationId : current.generationId,
      codes: response.status === "result_available" ? Object.freeze([...response.codes]) : current.codes,
      savedIntent: current.savedIntent,
    });
    let durableNext = next;
    if (current.previousIssue && (response.status === "result_available" || response.status === "delivery_unconfirmed")) {
      const { previousIssue: _previousIssue, ...withoutPreviousIssue } = next;
      durableNext = Object.freeze(withoutPreviousIssue);
    }
    await dependencies.vault.save(durableNext);
    record = durableNext;
    if (!(await hasIdentity({ firebaseUid: durableNext.firebaseUid, authorizationGeneration: durableNext.authorizationGeneration }))) {
      return issueSnapshot(durableNext, true, "conflict", null, current.previousIssue?.operationId);
    }
    issueSnapshot(durableNext, false, null, null, current.previousIssue?.operationId);
    if (durableNext.savedIntent && durableNext.status === "result_available") return acknowledgeIssue(durableNext);
    return snapshot;
  };

  const reconcileIssue = async (current: RecoveryIssueVaultRecord, identity: RecoveryOperationIdentity): Promise<RecoveryOperationSnapshot> => {
    if (current.deferredFor) {
      if (identity.firebaseUid === current.deferredFor.firebaseUid && identity.authorizationGeneration === current.deferredFor.authorizationGeneration && await hasIdentity(current.deferredFor)) {
        return issueSnapshot(current, false);
      }
      const resolution = identity.firebaseUid !== current.deferredFor.firebaseUid
        ? "different_uid"
        : identity.authorizationGeneration === null ? "missing_generation" : "different_generation";
      return issueSnapshot(current, true, "conflict", resolution);
    }
    if (identity.authorizationGeneration === null || !(await hasIdentity({ firebaseUid: identity.firebaseUid, authorizationGeneration: identity.authorizationGeneration })) || identity.firebaseUid !== current.firebaseUid || identity.authorizationGeneration !== current.authorizationGeneration) {
      const resolution = identity.firebaseUid !== current.firebaseUid
        ? "different_uid"
        : identity.authorizationGeneration === null ? "missing_generation" : identity.authorizationGeneration !== current.authorizationGeneration ? "different_generation" : null;
      return issueSnapshot(current, true, "conflict", resolution);
    }
    issueSnapshot(current, false);
    try {
      const response = await dependencies.api.getRecoveryCodeIssueStatus(current.operationId);
      return await persistIssueResponse(current, response);
    } catch (error) {
      if (current.previousIssue && isMissingIssueOperation(error)) return issueSnapshotForPinnedIdentity(current, "unavailable");
      return issueSnapshotForPinnedIdentity(current, safeFailure(error));
    }
  };

  const persistReplacementIssue = async (previous: RecoveryIssueVaultRecord, operationId: string): Promise<RecoveryIssueVaultRecord> => {
    const replacement: RecoveryIssueVaultRecord = Object.freeze({
      version: 1,
      kind: "issue",
      operationId,
      firebaseUid: previous.firebaseUid,
      authorizationGeneration: previous.authorizationGeneration,
      status: "in_progress",
      generationId: null,
      codes: null,
      savedIntent: false,
      previousIssue: previous,
    });
    await dependencies.vault.save(replacement);
    record = replacement;
    if (!(await hasIdentity({ firebaseUid: replacement.firebaseUid, authorizationGeneration: replacement.authorizationGeneration }))) issueSnapshot(replacement, true, "conflict");
    else issueSnapshot(replacement, false);
    return replacement;
  };

  const postReplacement = async (current: RecoveryIssueVaultRecord): Promise<RecoveryOperationSnapshot> => {
    if (!(await hasIdentity({ firebaseUid: current.firebaseUid, authorizationGeneration: current.authorizationGeneration }))) return issueSnapshot(current, true, "conflict");
    try {
      const response = await dependencies.api.issueRecoveryCodes(current.operationId);
      return await persistIssueResponse(current, response);
    } catch (error) {
      return issueSnapshotForPinnedIdentity(current, safeFailure(error));
    }
  };

  const retryReplacementAfterStatus = async (current: RecoveryIssueVaultRecord, identity: RecoveryOperationIssueIdentity, allowPost: boolean, allowNextAfterConfirmedExpiry = false): Promise<RecoveryOperationSnapshot> => {
    if (!(await hasIdentity(identity))) return issueSnapshot(current, true, "conflict");
    let statusSnapshot: RecoveryOperationSnapshot;
    try {
      const status = await dependencies.api.getRecoveryCodeIssueStatus(current.operationId);
      statusSnapshot = await persistIssueResponse(current, status);
    } catch (error) {
      if (isMissingIssueOperation(error)) return issueSnapshotForPinnedIdentity(current, "unavailable");
      return issueSnapshotForPinnedIdentity(current, safeFailure(error));
    }
    if (!allowPost || !record || record.kind !== "issue" || !record.previousIssue || record.operationId !== current.operationId) return statusSnapshot;
    if (allowNextAfterConfirmedExpiry && current.status === "expired_or_invalid" && record.status === "expired_or_invalid") {
      const previous = record.previousIssue;
      const nextOperationId = dependencies.newOperationId();
      if (!isOperationId(nextOperationId) || nextOperationId === previous.operationId || nextOperationId === record.operationId) return issueSnapshot(record, false, "unavailable");
      try {
        const replacement = await persistReplacementIssue(previous, nextOperationId);
        return postReplacement(replacement);
      } catch (error) { return issueSnapshotForPinnedIdentity(record, safeFailure(error)); }
    }
    if (record.status !== "provider_retryable") return statusSnapshot;
    if (!(await hasIdentity(identity))) return issueSnapshot(record, true, "conflict");
    return postReplacement(record);
  };

  const confirmAndStartReplacement = async (current: RecoveryIssueVaultRecord, identity: RecoveryOperationIssueIdentity): Promise<RecoveryOperationSnapshot> => {
    if (!(await hasIdentity(identity))) return issueSnapshot(current, true, "conflict");
    let status: unknown;
    try { status = await dependencies.api.getRecoveryCodeIssueStatus(current.operationId); }
    catch (error) {
      if (isMissingIssueOperation(error)) return issueSnapshotForPinnedIdentity(current, "unavailable");
      return issueSnapshotForPinnedIdentity(current, safeFailure(error));
    }
    if (!(await hasIdentity(identity))) return issueSnapshot(current, true, "conflict");
    if (!validIssueResponse(status, current.operationId)
      || (status.authorizationGeneration !== undefined && status.authorizationGeneration !== current.authorizationGeneration)) {
      return issueSnapshot(current, false, "invalid_response");
    }
    if (status.status === "result_available") return persistIssueResponse(current, status);
    if (status.status !== "delivery_unconfirmed") {
      // The old operation is left intact until the server confirms the specific
      // state that permits a conscious replacement.
      return issueSnapshot(current, false, "conflict");
    }
    let confirmed = current;
    if (current.status !== "delivery_unconfirmed") {
      const next = Object.freeze({ ...current, status: "delivery_unconfirmed" as const });
      try { await dependencies.vault.save(next); }
      catch (error) { return issueSnapshotForPinnedIdentity(current, safeFailure(error)); }
      confirmed = next;
      record = next;
    }
    const operationId = dependencies.newOperationId();
    if (!isOperationId(operationId) || operationId === confirmed.operationId) return issueSnapshot(confirmed, false, "unavailable");
    let replacement: RecoveryIssueVaultRecord;
    try { replacement = await persistReplacementIssue(confirmed, operationId); }
      catch (error) { return issueSnapshotForPinnedIdentity(confirmed, safeFailure(error)); }
    return postReplacement(replacement);
  };

  const acknowledgeIssue = async (current: RecoveryIssueVaultRecord): Promise<RecoveryOperationSnapshot> => {
    if (!(await hasIdentity({ firebaseUid: current.firebaseUid, authorizationGeneration: current.authorizationGeneration }))) return issueSnapshot(current, true, "conflict");
    try {
      const acknowledgement = await dependencies.api.acknowledgeRecoveryCodesSaved(current.operationId);
      if (!validAcknowledgement(acknowledgement, current.operationId, current.authorizationGeneration)) throw new RecoveryOperationProtocolError();
      if (!(await hasIdentity({ firebaseUid: current.firebaseUid, authorizationGeneration: current.authorizationGeneration }))) return issueSnapshot(current, true, "conflict");
      return await terminal(current.operationId, "acknowledged");
    } catch (error) {
      const failure = safeFailure(error);
      try {
        const status = await dependencies.api.getRecoveryCodeIssueStatus(current.operationId);
        return await persistIssueResponse(current, status);
      } catch {
        return issueSnapshotForPinnedIdentity(current, failure);
      }
    }
  };

  const persistConsumeProgress = async (current: RecoveryConsumeVaultRecord, responseValue: unknown): Promise<RecoveryConsumeVaultRecord | null> => {
    if (!validConsumeResponse(responseValue, current.operationId)) throw new RecoveryOperationProtocolError();
    const response = responseValue;
    if (response.status === "result_available") {
      const next = Object.freeze({
        ...current,
        status: "result_available" as const,
        expectedFirebaseUid: response.firebaseUid,
        expectedAuthorizationGeneration: response.authorizationGeneration,
      });
      await dependencies.vault.save(next);
      record = next;
      return next;
    }
    if (response.status === "acknowledged" || response.status === "superseded" || response.status === "expired_or_invalid") {
      await terminal(current.operationId, response.status);
      return null;
    }
    const next = Object.freeze({ ...current, status: response.status });
    await dependencies.vault.save(next);
    record = next;
    return next;
  };

  const ackConsume = async (current: RecoveryConsumeVaultRecord, identity: RecoveryOperationIssueIdentity): Promise<RecoveryOperationSnapshot> => {
    if (current.expectedFirebaseUid !== identity.firebaseUid || current.expectedAuthorizationGeneration !== identity.authorizationGeneration || !(await hasIdentity(identity))) {
      return consumeSnapshot(current, true, "conflict");
    }
    try {
      const acknowledgement = await dependencies.api.acknowledgeRecoveryCodeConsumption(current.operationId);
      if (!validAcknowledgement(acknowledgement, current.operationId, identity.authorizationGeneration)) throw new RecoveryOperationProtocolError();
      return await terminal(current.operationId, "acknowledged");
    } catch (error) {
      const failure = safeFailure(error);
      try {
        const status = await dependencies.api.getRecoveryCodeConsumeStatus(current.operationId, current.code);
        const next = await persistConsumeProgress(current, status);
        if (!next) return snapshot;
        if (next.status === "acknowledged") return snapshot;
        return consumeSnapshot(next, next.expectedFirebaseUid !== identity.firebaseUid || next.expectedAuthorizationGeneration !== identity.authorizationGeneration, failure);
      } catch {
        return consumeSnapshot(current, false, failure);
      }
    }
  };

  const runConsumeResult = async (current: RecoveryConsumeVaultRecord, responseValue: unknown, allowSignIn: boolean): Promise<RecoveryOperationSnapshot> => {
    const next = await persistConsumeProgress(current, responseValue);
    if (!next) return snapshot;
    const response = responseValue as RecoveryConsumeResponse;
    if (response.status !== "result_available") return consumeSnapshot(next, true);

    const expected: RecoveryOperationIssueIdentity = Object.freeze({ firebaseUid: response.firebaseUid, authorizationGeneration: response.authorizationGeneration });
    const live = dependencies.auth.getSnapshot();
    if (live) {
      const matches = await hasIdentity(expected);
      if (!matches) return consumeSnapshot(next, true, "conflict");
      return ackConsume(next, expected);
    }
    if (!allowSignIn) return consumeSnapshot(next, true);

    consumeSnapshot(next, false, null, true);
    try {
      const user = await dependencies.auth.signInWithRecoveryToken(response.customToken);
      if (user.uid !== expected.firebaseUid || dependencies.auth.getSnapshot()?.uid !== expected.firebaseUid) return consumeSnapshot(next, true, "conflict");
      const actualGeneration = await dependencies.auth.getAuthorizationGeneration();
      if (actualGeneration !== expected.authorizationGeneration || dependencies.auth.getSnapshot()?.uid !== expected.firebaseUid) return consumeSnapshot(next, true, "conflict");
      return ackConsume(next, expected);
    } catch (error) {
      return consumeSnapshot(next, dependencies.auth.getSnapshot()?.uid !== expected.firebaseUid, safeFailure(error));
    }
  };

  const readConsumeStatus = async (current: RecoveryConsumeVaultRecord, allowSignIn: boolean): Promise<RecoveryOperationSnapshot> => {
    try {
      const response = await dependencies.api.getRecoveryCodeConsumeStatus(current.operationId, current.code);
      return await runConsumeResult(current, response, allowSignIn);
    } catch (error) {
      return consumeSnapshot(current, true, safeFailure(error));
    }
  };

  const startConsumeRequest = async (current: RecoveryConsumeVaultRecord): Promise<RecoveryOperationSnapshot> => {
    if (dependencies.auth.getSnapshot() !== null) return consumeSnapshot(current, true, "conflict");
    try {
      const response = await dependencies.api.consumeRecoveryCode(current.operationId, current.code);
      return await runConsumeResult(current, response, true);
    } catch (error) {
      const failure = safeFailure(error);
      try {
        const status = await dependencies.api.getRecoveryCodeConsumeStatus(current.operationId, current.code);
        return await runConsumeResult(current, status, true);
      } catch {
        return consumeSnapshot(current, true, failure);
      }
    }
  };

  const currentIdentity = async (): Promise<RecoveryOperationIdentity | null> => {
    const current = dependencies.auth.getSnapshot();
    if (!current) return null;
    try {
      const authorizationGeneration = await dependencies.auth.getAuthorizationGeneration();
      return dependencies.auth.getSnapshot()?.uid === current.uid
        ? Object.freeze({ firebaseUid: current.uid, authorizationGeneration: isGeneration(authorizationGeneration) ? authorizationGeneration : null })
        : Object.freeze({ firebaseUid: current.uid, authorizationGeneration: null });
    } catch { return Object.freeze({ firebaseUid: current.uid, authorizationGeneration: null }); }
  };

  return Object.freeze({
    getSnapshot: () => snapshot,
    subscribe: (listener: (value: RecoveryOperationSnapshot) => void) => {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    load: () => enqueue(loadInternal),
    suspendPendingIdentity: () => {
      if (!record) return snapshot;
      if (record.kind === "issue") return issueSnapshot(record, true, "conflict");
      return consumeSnapshot(record, true, "conflict");
    },
    deferIssueToIdentity: (operationId, identity) => enqueue(async () => {
      await loadInternal();
      if (!record || record.kind !== "issue" || record.operationId !== operationId) return snapshot;
      if (!isGeneration(identity.authorizationGeneration) || !(await hasIdentity(identity))) return issueSnapshot(record, true, "conflict", "missing_generation");
      const provenMismatch = identity.firebaseUid !== record.firebaseUid || identity.authorizationGeneration !== record.authorizationGeneration;
      if (!provenMismatch) return issueSnapshot(record, true, "conflict");
      if (record.deferredFor?.firebaseUid === identity.firebaseUid && record.deferredFor.authorizationGeneration === identity.authorizationGeneration) return issueSnapshot(record, false);
      const deferred = Object.freeze({ ...record, deferredFor: Object.freeze({ firebaseUid: identity.firebaseUid, authorizationGeneration: identity.authorizationGeneration }) });
      try { await dependencies.vault.save(deferred); }
      catch { return issueSnapshot(record, true, "unavailable"); }
      record = deferred;
      if (!(await hasIdentity(identity))) {
        const live = await currentIdentity();
        const resolution = live?.firebaseUid !== identity.firebaseUid ? "different_uid" : "different_generation";
        return issueSnapshot(deferred, true, "conflict", resolution);
      }
      return issueSnapshot(deferred, false);
    }),
    startIssue: (identity: RecoveryOperationIssueIdentity, options = {}) => enqueue(async () => {
      await loadInternal();
      if (snapshot.kind === "unavailable") return snapshot;
      if (record) {
        if (record.kind === "issue" && record.deferredFor) {
          const isDeferredIdentity = identity.firebaseUid === record.deferredFor.firebaseUid && identity.authorizationGeneration === record.deferredFor.authorizationGeneration && await hasIdentity(identity);
          return issueSnapshot(record, !isDeferredIdentity, "conflict");
        }
        if (record.kind !== "issue" || record.firebaseUid !== identity.firebaseUid || record.authorizationGeneration !== identity.authorizationGeneration) {
          return record.kind === "issue" ? issueSnapshot(record, true, "conflict") : consumeSnapshot(record, true, "conflict");
        }
        if (!(await hasIdentity(identity))) return issueSnapshot(record, true, "conflict");
        if (record.previousIssue) return retryReplacementAfterStatus(record, identity, options.replaceUnavailable === true, options.replaceUnavailable === true);
        if (record.status === "delivery_unconfirmed" && options.replaceUnavailable === true) return confirmAndStartReplacement(record, identity);
        if (record.codes) return record.savedIntent ? acknowledgeIssue(record) : issueSnapshot(record, false);
        if (record.status === "provider_retryable") {
          try {
            const response = await dependencies.api.issueRecoveryCodes(record.operationId);
            return await persistIssueResponse(record, response);
          } catch (error) { return issueSnapshotForPinnedIdentity(record, safeFailure(error)); }
        }
        return reconcileIssue(record, identity);
      }
      if (!(await hasIdentity(identity))) return unavailable("operation_unavailable");
      const operationId = dependencies.newOperationId();
      if (!isOperationId(operationId)) return unavailable("operation_unavailable");
      const created: RecoveryIssueVaultRecord = Object.freeze({
        version: 1,
        kind: "issue",
        operationId,
        firebaseUid: identity.firebaseUid,
        authorizationGeneration: identity.authorizationGeneration,
        status: "in_progress",
        generationId: null,
        codes: null,
        savedIntent: false,
      });
      try { await dependencies.vault.save(created); }
      catch (error) { return unavailable(error instanceof RecoveryOperationVaultError && error.code === "recovery_operation_vault_corrupt" ? "vault_corrupt" : "vault_unavailable"); }
      record = created;
      if (!(await hasIdentity(identity))) return issueSnapshot(created, true, "conflict");
      issueSnapshot(created, false);
      try {
        const response = await dependencies.api.issueRecoveryCodes(operationId);
        return await persistIssueResponse(created, response);
      } catch (error) {
        return issueSnapshotForPinnedIdentity(created, safeFailure(error));
      }
    }),
    confirmRecoveryCodesSaved: () => enqueue(async () => {
      await loadInternal();
      if (!record || record.kind !== "issue" || !record.codes || snapshot.kind !== "issue" || snapshot.needsAccountResolution) return snapshot;
      if (record.deferredFor) return issueSnapshot(record, snapshot.blocksProfilePreparation, "conflict");
      if (!record.savedIntent) {
        const savedIntent = Object.freeze({ ...record, savedIntent: true });
        try { await dependencies.vault.save(savedIntent); }
        catch (error) { return issueSnapshotForPinnedIdentity(record, safeFailure(error)); }
        record = savedIntent;
      }
      return acknowledgeIssue(record);
    }),
    startConsume: (code) => enqueue(async () => {
      await loadInternal();
      if (snapshot.kind === "unavailable") return snapshot;
      const normalized = code.trim().toUpperCase();
      if (!RECOVERY_CODE_PATTERN.test(normalized)) return unavailable("operation_unavailable");
      if (record) {
        if (record.kind !== "consume" || record.code !== normalized) return record.kind === "issue" ? issueSnapshot(record, true, "conflict") : consumeSnapshot(record, true, "conflict");
        if (dependencies.auth.getSnapshot() !== null) return consumeSnapshot(record, true, "conflict");
        return readConsumeStatus(record, true);
      }
      if (dependencies.auth.getSnapshot() !== null) return unavailable("operation_unavailable");
      const operationId = dependencies.newOperationId();
      if (!isOperationId(operationId)) return unavailable("operation_unavailable");
      const created: RecoveryConsumeVaultRecord = Object.freeze({ version: 1, kind: "consume", operationId, code: normalized, status: "in_progress", expectedFirebaseUid: null, expectedAuthorizationGeneration: null });
      try { await dependencies.vault.save(created); }
      catch (error) { return unavailable(error instanceof RecoveryOperationVaultError && error.code === "recovery_operation_vault_corrupt" ? "vault_corrupt" : "vault_unavailable"); }
      record = created;
      consumeSnapshot(created, false);
      return startConsumeRequest(created);
    }),
    reconcilePending: (identity) => enqueue(async () => {
      await loadInternal();
      if (!record) return snapshot;
      if (record.kind === "issue") {
        if (!identity) return issueSnapshot(record, !(record.deferredFor && dependencies.auth.getSnapshot() === null));
        return reconcileIssue(record, identity);
      }
      if (record.expectedFirebaseUid !== null) {
        if (!identity || identity.firebaseUid !== record.expectedFirebaseUid || identity.authorizationGeneration !== record.expectedAuthorizationGeneration) return consumeSnapshot(record, true, identity ? "conflict" : null);
        if (identity.authorizationGeneration === null || !(await hasIdentity({ firebaseUid: identity.firebaseUid, authorizationGeneration: identity.authorizationGeneration }))) return consumeSnapshot(record, true, "conflict");
        return ackConsume(record, { firebaseUid: identity.firebaseUid, authorizationGeneration: identity.authorizationGeneration });
      }
      if (!identity) return readConsumeStatus(record, false);
      return consumeSnapshot(record, true, "conflict");
    }),
    resumePendingRecovery: () => enqueue(async () => {
      await loadInternal();
      if (!record) return snapshot;
      if (record.kind === "issue") {
        if (!record.deferredFor) return issueSnapshot(record, true, "conflict");
        const identity = await currentIdentity();
        if (!identity || identity.firebaseUid !== record.firebaseUid || identity.authorizationGeneration !== record.authorizationGeneration || !(await hasIdentity({ firebaseUid: record.firebaseUid, authorizationGeneration: record.authorizationGeneration }))) return issueSnapshot(record, true, "conflict", identity?.authorizationGeneration === null ? "missing_generation" : "different_uid");
        const { deferredFor: _deferredFor, ...resumed } = record;
        try { await dependencies.vault.save(resumed); }
        catch { return issueSnapshot(record, true, "unavailable"); }
        record = resumed;
        return issueSnapshot(resumed, false);
      }
      const identity = await currentIdentity();
      if (identity) {
        if (identity.authorizationGeneration !== null && record.expectedFirebaseUid === identity.firebaseUid && record.expectedAuthorizationGeneration === identity.authorizationGeneration) return ackConsume(record, { firebaseUid: identity.firebaseUid, authorizationGeneration: identity.authorizationGeneration });
        return consumeSnapshot(record, true, "conflict");
      }
      const status = await readConsumeStatus(record, true);
      if (status.kind === "consume" && status.status === "provider_retryable" && record.kind === "consume") {
        try {
          const response = await dependencies.api.consumeRecoveryCode(record.operationId, record.code);
          return await runConsumeResult(record, response, true);
        } catch (error) { return consumeSnapshot(record, true, safeFailure(error)); }
      }
      return status;
    }),
    retryRecoveryOperation: () => enqueue(async () => {
      await loadInternal();
      if (!record) return snapshot;
      if (record.kind === "consume") return snapshot.kind === "consume" && snapshot.needsAccountResolution ? resumeConsumeInternal(record) : readConsumeStatus(record, false);
      if (record.deferredFor) {
        const identity = await currentIdentity();
        if (!identity && dependencies.auth.getSnapshot() === null) return issueSnapshot(record, false);
        const matchesDeferred = identity?.firebaseUid === record.deferredFor.firebaseUid && identity.authorizationGeneration === record.deferredFor.authorizationGeneration && await hasIdentity(record.deferredFor);
        return issueSnapshot(record, !matchesDeferred, "conflict");
      }
      const identity: RecoveryOperationIssueIdentity = Object.freeze({ firebaseUid: record.firebaseUid, authorizationGeneration: record.authorizationGeneration });
      if (!(await hasIdentity(identity))) return issueSnapshot(record, true, "conflict");
      if (record.previousIssue) return retryReplacementAfterStatus(record, identity, false);
      try {
        const status = await dependencies.api.getRecoveryCodeIssueStatus(record.operationId);
        const nextSnapshot = await persistIssueResponse(record, status);
        if (nextSnapshot.kind === "issue" && nextSnapshot.status === "provider_retryable") {
          if (!(await hasIdentity(identity))) return issueSnapshot(record, true, "conflict");
          const retry = await dependencies.api.issueRecoveryCodes(record.operationId);
          return await persistIssueResponse(record, retry);
        }
        return nextSnapshot;
      } catch (error) {
        if (record.previousIssue && isMissingIssueOperation(error)) return issueSnapshotForPinnedIdentity(record, "unavailable");
        return issueSnapshotForPinnedIdentity(record, safeFailure(error));
      }
    }),
  });

  async function resumeConsumeInternal(current: RecoveryConsumeVaultRecord): Promise<RecoveryOperationSnapshot> {
    const identity = await currentIdentity();
    if (identity) {
      if (identity.authorizationGeneration !== null && current.expectedFirebaseUid === identity.firebaseUid && current.expectedAuthorizationGeneration === identity.authorizationGeneration) return ackConsume(current, { firebaseUid: identity.firebaseUid, authorizationGeneration: identity.authorizationGeneration });
      return consumeSnapshot(current, true, "conflict");
    }
    const status = await readConsumeStatus(current, true);
    if (status.kind === "consume" && status.status === "provider_retryable") {
      try {
        const response = await dependencies.api.consumeRecoveryCode(current.operationId, current.code);
        return await runConsumeResult(current, response, true);
      } catch (error) { return consumeSnapshot(current, true, safeFailure(error)); }
    }
    return status;
  }
}
