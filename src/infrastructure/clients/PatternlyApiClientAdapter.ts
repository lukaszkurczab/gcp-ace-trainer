/**
 * Synchronized with patternly-backend/openapi/patternly-v1.json.
 * Backend CI verifies that every versioned API path is represented here.
 */

export type ProgressMutationDto = Readonly<{
  mutationId: string;
  kind: "node" | "item";
  recordType: "active_track" | "training_session_summary" | "training_session_result" | "training_attempt" | "review_queue_entry";
  trackId: string;
  targetId: string;
  expectedVersion: number | null;
  fingerprint: string;
  state: Readonly<Record<string, unknown>>;
}>;

export type SyncRequestDto = Readonly<{
  expectedAccountRevision: number;
  deviceId?: string | null;
  mutations: readonly ProgressMutationDto[];
}>;

export type ProgressRecordDto = Readonly<{
  kind: "node" | "item";
  recordType: ProgressMutationDto["recordType"];
  trackId: string;
  targetId: string;
  version: number;
  fingerprint: string;
  state: Readonly<Record<string, unknown>>;
  lastMutationId: string;
  updatedAt: string;
}>;

export type MeResponseDto = Readonly<{ user: Readonly<{ id: string; createdAt: string; identity: Readonly<{ provider: string; subject: string; email: string | null; emailVerified: boolean }> }> }>;
export type RecoveryCodesResponseDto = Readonly<{ generationId: string; codes: readonly string[] }>;
export type AccountDeletionResponseDto = Readonly<{ status: "deleted"; operationId: string; proofId: string }>;
export type PublicDeletionRequestResponseDto = Readonly<{ status: "accepted" }>;
export type PublicDeletionProofResponseDto = Readonly<{ status: "deleted"; operationId: string; proofId: string }>;
export type DeletionOperationStatusDto = Readonly<{ status: "pending" | "remote_deleted" | "complete"; operationId: string; proofId: string | null }>;
export type EntitlementsResponseDto = Readonly<{ entitlements: readonly Readonly<{ entitlement: string; status: string; source: string; expiresAt: string | null; updatedAt: string }>[] }>;
export type ProgressResponseDto = Readonly<{ accountRevision: number; records: readonly ProgressRecordDto[] }>;
export type SyncResponseDto = Readonly<{ accountRevision: number; applied: readonly ProgressRecordDto[]; duplicates: readonly string[]; conflicts: readonly Readonly<{ mutationId: string; code: "version_conflict"; current: ProgressRecordDto | null }>[]; accountRevisionConflict?: Readonly<{ code: "account_revision_conflict"; currentAccountRevision: number }> }>;
export type GuestMergeRecordDto = Readonly<{ fingerprint: string; recordId: string; recordType: ProgressMutationDto["recordType"]; state: Readonly<Record<string, unknown>>; trackId: string; version: number }>;
export type GuestMergeSnapshotDto = Readonly<{ guestSnapshotVersion: number; guestUserId: string; records: readonly GuestMergeRecordDto[]; activeSession: boolean; pendingJournal: boolean }>;
export type GuestMergePreviewDto = Readonly<{ accountSnapshotVersion: number; accountUserId: string; conflicts: readonly Readonly<{ accountVersion: number; conflictId: string; guestVersion: number; recordId: string; recordType: GuestMergeRecordDto["recordType"] }>[]; fingerprint: string; guestSnapshotVersion: number; guestUserId: string; operationId: string; protocolVersion: 1 }>;
export type AdoptionPlanDto = Readonly<{ caseId: "emptyLocalEmptyRemote" | "populatedLocalEmptyRemote" | "emptyLocalPopulatedRemote" | "populatedLocalPopulatedRemote" | "divergentRecord" | "blocked"; localRecordCount: number; remoteRecordCount: number; uploadRecordIds: readonly string[]; restoreRecordIds: readonly string[]; deduplicatedRecordIds: readonly string[]; conflictRecordIds: readonly string[]; blockingReason: "active_session" | "journal_recovery" | null }>;
export type AdoptionPreviewResponseDto = Readonly<{ preview: GuestMergePreviewDto; plan: AdoptionPlanDto; remoteRecords: readonly GuestMergeRecordDto[] }>;
export type AdoptionConfirmationDto = Readonly<{ operationId: string; previewFingerprint: string; protocolVersion: 1; resolutions: readonly Readonly<{ conflictId: string; resolution: "keep_guest" | "keep_account" | "manual_required" }>[] }>;
export type AdoptionExecutionResponseDto = Readonly<{ accountRevision: number; operationId: string; mutationIds: readonly string[]; records: readonly GuestMergeRecordDto[] }>;
export type TracksResponseDto = Readonly<{ tracks: readonly Readonly<{ trackId: string; source: string; status: string; updatedAt: string }>[] }>;
export type ContentVersionsResponseDto = Readonly<{ versions: readonly Readonly<{ trackId: string; version: string; checksumSha256: string; packageUri: string; publishedAt: string }>[] }>;
export type ContentReportReasonDto = "incorrect_answer" | "unclear_explanation" | "outdated_content" | "technical_issue" | "other";
export type ContentReportContextDto = Readonly<{ releasePackageId: string; trackNode: string | null; modeRoute: "practice_feedback_details" | "answer_review"; locale: "en" | "pl"; appBuild: string; platform: "ios" | "android"; occurredAt: string }>;
export type ContentReportStatusDto = "open" | "in_review" | "resolved" | "closed";
export type CreateContentReportDto = Readonly<{ clientSubmissionId: string; trackId: string; contentVersion: string; itemId: string; reason: ContentReportReasonDto; description: string; context: ContentReportContextDto; linkAccount?: boolean; contactEmail?: string }>;
export type ContentReportDto = Readonly<{ id: string; clientSubmissionId: string; trackId: string; contentVersion: string; itemId: string; reason: ContentReportReasonDto; description: string; context: ContentReportContextDto; linkage: "unlinked" | "account" | "contact" | "account_and_contact"; status: ContentReportStatusDto; createdAt: string; updatedAt: string }>;
export type CreateContentReportResponseDto = Readonly<{ report: ContentReportDto; duplicate: boolean }>;
export type AdminContentReportsResponseDto = Readonly<{ reports: readonly ContentReportDto[] }>;
export type TransitionContentReportResponseDto = Readonly<{ report: ContentReportDto; duplicate: boolean }>;
export type HealthResponseDto = Readonly<{ status: "ok"; service: "patternly-backend" }>;
export type ReadyResponseDto = Readonly<{ status: "ready" | "not_ready"; checks: Readonly<{ database: boolean; authentication: boolean }> }>;
export type OpenApiResponseDto = Readonly<{ openapi: string; paths: Readonly<Record<string, unknown>> }>;

export type PatternlyApiClientErrorCode = "client_unconfigured" | "authentication_required" | "transport_failed" | "invalid_response" | "server_error" | "request_timeout";

export class PatternlyApiClientError extends Error {
  public constructor(readonly code: PatternlyApiClientErrorCode, readonly status?: number, readonly serverCode?: string) {
    super(code);
    this.name = "PatternlyApiClientError";
  }
}

type FetchImplementation = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
export type PatternlyApiClient = Readonly<{
  availability: "available";
  getHealth: () => Promise<HealthResponseDto>;
  getReady: () => Promise<ReadyResponseDto>;
  getOpenApi: () => Promise<OpenApiResponseDto>;
  getMe: () => Promise<MeResponseDto>;
  getEntitlements: () => Promise<EntitlementsResponseDto>;
  getProgress: () => Promise<ProgressResponseDto>;
  syncProgress: (input: SyncRequestDto) => Promise<SyncResponseDto>;
  previewAccountAdoption: (input: GuestMergeSnapshotDto) => Promise<AdoptionPreviewResponseDto>;
  confirmAccountAdoption: (input: Readonly<{ deviceId: string; snapshot: GuestMergeSnapshotDto; confirmation: AdoptionConfirmationDto }>) => Promise<AdoptionExecutionResponseDto>;
  issueRecoveryCodes: () => Promise<RecoveryCodesResponseDto>;
  consumeRecoveryCode: (code: string) => Promise<Readonly<{ customToken: string }>>;
  revokeSessions: (operationId: string) => Promise<Readonly<{ status: "revoked"; operationId: string }>>;
  deleteAccount: (operationId: string) => Promise<AccountDeletionResponseDto>;
  requestPublicDeletion: (email: string) => Promise<PublicDeletionRequestResponseDto>;
  confirmPublicDeletion: (requestId: string, token: string) => Promise<AccountDeletionResponseDto>;
  getDeletionProof: (proofId: string) => Promise<PublicDeletionProofResponseDto>;
  getDeletionOperationStatus: (operationId: string, accountUidHash: string) => Promise<DeletionOperationStatusDto>;
  getTracks: () => Promise<TracksResponseDto>;
  getContentVersions: () => Promise<ContentVersionsResponseDto>;
  createContentReport: (input: CreateContentReportDto, appCheckToken: string) => Promise<CreateContentReportResponseDto>;
  getAdminContentReports: () => Promise<AdminContentReportsResponseDto>;
  transitionAdminContentReport: (clientSubmissionId: string, status: ContentReportStatusDto) => Promise<TransitionContentReportResponseDto>;
}>;

export function createPatternlyApiClient(input: Readonly<{
  apiOrigin: string;
  allowLocalHttpForSimulator?: boolean;
  getIdToken: () => Promise<string | null>;
  fetchImplementation?: FetchImplementation;
  timeoutMs?: number;
}>): PatternlyApiClient {
  const origin = new URL(input.apiOrigin);
  const localSimulatorOrigin = input.allowLocalHttpForSimulator === true
    && origin.protocol === "http:"
    && origin.hostname === "127.0.0.1"
    && origin.pathname === "/"
    && origin.search === ""
    && origin.hash === "";
  if (origin.protocol !== "https:" && !localSimulatorOrigin) throw new PatternlyApiClientError("client_unconfigured");
  const fetchImplementation = input.fetchImplementation ?? fetch;
  const timeoutMs = input.timeoutMs ?? 10_000;

  type AuthenticationMode = "none" | "optional" | "required";
  async function requestJson<T>(path: string, method: "GET" | "POST" | "PATCH", body?: unknown, authentication: AuthenticationMode = "required", extraHeaders: Readonly<Record<string, string>> = {}): Promise<T> {
    const token = authentication === "none" ? null : await input.getIdToken();
    if (authentication === "required" && !token) throw new PatternlyApiClientError("authentication_required");
    const url = new URL(path, origin);
    const publicPath = path === "/health" || path === "/ready" || path === "/openapi.json";
    if (url.origin !== origin.origin || (!path.startsWith("/v1/") && !publicPath)) throw new PatternlyApiClientError("client_unconfigured");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let response: Response;
    try {
      response = await fetchImplementation(url, {
        method,
        signal: controller.signal,
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        headers: { ...extraHeaders, ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body === undefined ? {} : { "content-type": "application/json" }) },
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") throw new PatternlyApiClientError("request_timeout");
      throw new PatternlyApiClientError("transport_failed");
    } finally {
      clearTimeout(timeout);
    }
    let payload: unknown;
    try { payload = await response.json(); } catch { throw new PatternlyApiClientError("invalid_response", response.status); }
    if (!response.ok) {
      const serverCode = isRecord(payload) && isRecord(payload.error) && typeof payload.error.code === "string"
        ? payload.error.code
        : isRecord(payload) && Array.isArray(payload.conflicts) && isRecord(payload.conflicts[0]) && typeof payload.conflicts[0].code === "string"
          ? payload.conflicts[0].code
          : undefined;
      throw new PatternlyApiClientError("server_error", response.status, serverCode);
    }
    return payload as T;
  }

  return Object.freeze({
    availability: "available" as const,
    getHealth: () => requestJson<HealthResponseDto>("/health", "GET", undefined, "none"),
    getReady: () => requestJson<ReadyResponseDto>("/ready", "GET", undefined, "none"),
    getOpenApi: () => requestJson<OpenApiResponseDto>("/openapi.json", "GET", undefined, "none"),
    getMe: () => requestJson<MeResponseDto>("/v1/me", "GET"),
    getEntitlements: () => requestJson<EntitlementsResponseDto>("/v1/entitlements", "GET"),
    getProgress: () => requestJson<ProgressResponseDto>("/v1/progress", "GET"),
    syncProgress: (body: SyncRequestDto) => requestJson<SyncResponseDto>("/v1/progress/sync", "POST", body),
    previewAccountAdoption: (body: GuestMergeSnapshotDto) => requestJson<AdoptionPreviewResponseDto>("/v1/account-data/adoption/preview", "POST", body),
    confirmAccountAdoption: (body) => requestJson<AdoptionExecutionResponseDto>("/v1/account-data/adoption/confirm", "POST", body),
    issueRecoveryCodes: () => requestJson<RecoveryCodesResponseDto>("/v1/account/recovery-codes", "POST", {}),
    consumeRecoveryCode: (code) => requestJson<Readonly<{ customToken: string }>>("/v1/public/recovery-codes/consume", "POST", { code }, "none"),
    revokeSessions: (operationId) => requestJson<Readonly<{ status: "revoked"; operationId: string }>>("/v1/account/session/revoke", "POST", { operationId }),
    deleteAccount: (operationId) => requestJson<AccountDeletionResponseDto>("/v1/account/deletion", "POST", { operationId }),
    requestPublicDeletion: (email) => requestJson<PublicDeletionRequestResponseDto>("/v1/public/deletion-requests", "POST", { email }, "none"),
    confirmPublicDeletion: (requestId, token) => requestJson<AccountDeletionResponseDto>(`/v1/public/deletion-requests/${requestId}/confirm`, "POST", { token }, "none"),
    getDeletionProof: (proofId) => requestJson<PublicDeletionProofResponseDto>(`/v1/public/deletion-proofs/${proofId}`, "GET", undefined, "none"),
    getDeletionOperationStatus: (operationId, accountUidHash) => requestJson<DeletionOperationStatusDto>("/v1/public/deletion-operations/status", "POST", { operationId, accountUidHash }, "none"),
    getTracks: () => requestJson<TracksResponseDto>("/v1/tracks", "GET"),
    getContentVersions: () => requestJson<ContentVersionsResponseDto>("/v1/content/versions", "GET"),
    createContentReport: (body, appCheckToken) => requestJson<CreateContentReportResponseDto>("/v1/content/reports", "POST", body, "optional", { "x-firebase-appcheck": appCheckToken }),
    getAdminContentReports: () => requestJson<AdminContentReportsResponseDto>("/v1/admin/content-reports", "GET"),
    transitionAdminContentReport: (clientSubmissionId, status) => requestJson<TransitionContentReportResponseDto>(`/v1/admin/content-reports/${clientSubmissionId}`, "PATCH", { status }),
  });
}

export function createFirebaseEmulatorIdTokenProvider(input: Readonly<{
  authEmulatorOrigin: string;
  email: string;
  password: string;
}>): () => Promise<string | null> {
  let cachedToken: string | null = null;
  return async () => {
    if (cachedToken) return cachedToken;
    const origin = new URL(input.authEmulatorOrigin);
    if (origin.protocol !== "http:" || origin.hostname !== "127.0.0.1") throw new PatternlyApiClientError("client_unconfigured");
    let response: Response;
    try {
      response = await fetch(`${origin.origin}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=patternly-ios-simulator`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: input.email, password: input.password, returnSecureToken: true }),
      });
    } catch {
      throw new PatternlyApiClientError("transport_failed");
    }
    if (!response.ok) throw new PatternlyApiClientError("authentication_required", response.status);
    let payload: unknown;
    try { payload = await response.json(); } catch { throw new PatternlyApiClientError("invalid_response", response.status); }
    if (!isRecord(payload) || typeof payload.idToken !== "string") throw new PatternlyApiClientError("authentication_required", response.status);
    cachedToken = payload.idToken;
    return cachedToken;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
