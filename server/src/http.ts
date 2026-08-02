import type { IncomingMessage, RequestListener, ServerResponse } from "node:http";

import {
  type AccountDataService,
  computeSyncOperationFingerprint,
  type AccountSnapshotPage,
  type AccountSnapshotPageInput,
  type SyncMutation,
  type SyncOperationSemanticInput,
} from "./accountService.js";
import {
  authenticateAccountRequest,
  type FirebaseIdTokenVerifier,
} from "./authentication.js";

export const MAX_SYNC_HTTP_BODY_BYTES = 4 * 1024 * 1024;
export const MAX_SNAPSHOT_HTTP_BODY_BYTES = 4 * 1024;
export const MAX_SNAPSHOT_HTTP_RESPONSE_BYTES = 2 * 1024 * 1024;
export const MAX_ADOPTION_HTTP_BODY_BYTES = 4 * 1024;
export const MAX_ADOPTION_UPLOAD_HTTP_BODY_BYTES = 2 * 1024 * 1024;
export const MAX_ADOPTION_PREVIEW_HTTP_RESPONSE_BYTES = 2 * 1024 * 1024;

const SYNC_PATH = "/v1/account/sync";
const SNAPSHOT_PAGE_PATH = "/v1/account/snapshot/page";
const ADOPTION_START_PATH = "/v1/account/adoption/start";
const ADOPTION_UPLOAD_PAGE_PATH = "/v1/account/adoption/upload/page";
const ADOPTION_ADVANCE_PATH = "/v1/account/adoption/advance";
const ADOPTION_PREVIEW_PAGE_PATH = "/v1/account/adoption/preview/page";
const ADOPTION_CONFIRM_PATH = "/v1/account/adoption/confirm";
const ADOPTION_CANCEL_PATH = "/v1/account/adoption/cancel";
const HASH_PATTERN = /^[a-f0-9]{64}$/u;
const JSON_MEDIA_TYPE = /^application\/json(?:\s*;\s*charset=utf-8)?$/iu;
const UTF8_BOM = Buffer.from([0xef, 0xbb, 0xbf]);

const ADOPTION_PATHS = [
  ADOPTION_START_PATH,
  ADOPTION_UPLOAD_PAGE_PATH,
  ADOPTION_ADVANCE_PATH,
  ADOPTION_PREVIEW_PAGE_PATH,
  ADOPTION_CONFIRM_PATH,
  ADOPTION_CANCEL_PATH,
] as const;

type AdoptionPath = (typeof ADOPTION_PATHS)[number];

type PublicErrorCode =
  | "account_data_retryable"
  | "adoption_conflict"
  | "adoption_in_progress"
  | "adoption_not_ready"
  | "adoption_page_conflict"
  | "adoption_step_changed"
  | "active_session_conflict"
  | "authentication_required"
  | "authorization_required"
  | "id_token_expired"
  | "id_token_revoked"
  | "identity_unverified"
  | "immutable_integrity_conflict"
  | "internal_error"
  | "invalid_id_token"
  | "invalid_request"
  | "method_not_allowed"
  | "not_found"
  | "record_revision_conflict"
  | "request_too_large"
  | "snapshot_changed"
  | "stale_account_revision"
  | "unsupported_content_encoding"
  | "unsupported_media_type";

type ErrorResponse = Readonly<{
  code: PublicErrorCode;
  status: number;
}>;

export type AccountHttpService = Pick<AccountDataService,
  | "applySync"
  | "readSnapshotPage"
  | "startAdoption"
  | "uploadAdoptionPage"
  | "advanceAdoption"
  | "readAdoptionPreviewPage"
  | "confirmAdoptionOperation"
  | "cancelAdoption"
>;

export type AccountHttpDependencies = Readonly<{
  expectedProjectId: string;
  nowSeconds: () => number;
  service: AccountHttpService;
  verifier: FirebaseIdTokenVerifier;
}>;

class RequestBoundaryError extends Error {
  constructor(readonly response: ErrorResponse) {
    super(response.code);
  }
}

const publicError = (status: number, code: PublicErrorCode): ErrorResponse => ({ code, status });

const sendJson = (response: ServerResponse, status: number, value: unknown, extraHeaders: Readonly<Record<string, string>> = {}): void => {
  const body = JSON.stringify(value);
  response.writeHead(status, {
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(body),
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    ...extraHeaders,
  });
  response.end(body);
};

const sendError = (response: ServerResponse, error: ErrorResponse, extraHeaders: Readonly<Record<string, string>> = {}): void => {
  sendJson(response, error.status, { error: { code: error.code } }, extraHeaders);
};

const errorMessage = (error: unknown): string => error instanceof Error ? error.message : "";
const hasErrorCode = (error: unknown): error is Readonly<{ code?: unknown }> =>
  typeof error === "object" && error !== null && "code" in error;

const authenticationError = (error: unknown): ErrorResponse => {
  if (hasErrorCode(error)) {
    switch (error.code) {
      case "auth/id-token-expired":
        return publicError(401, "id_token_expired");
      case "auth/id-token-revoked":
        return publicError(401, "id_token_revoked");
      case "auth/argument-error":
      case "auth/invalid-id-token":
        return publicError(401, "invalid_id_token");
      default:
        return publicError(500, "internal_error");
    }
  }
  const message = errorMessage(error);
  if (message === "missing_authorization" || message === "malformed_authorization") {
    return publicError(401, "authentication_required");
  }
  if (message === "expired_id_token") return publicError(401, "id_token_expired");
  if (
    message === "wrong_firebase_project"
    || message === "wrong_firebase_issuer"
    || message === "invalid_token_subject"
  ) {
    return publicError(401, "invalid_id_token");
  }
  if (message === "unverified_identity") return publicError(403, "identity_unverified");
  if (message === "uid_mismatch" || message === "recent_authentication_required") {
    return publicError(403, "authorization_required");
  }
  return publicError(500, "internal_error");
};

const syncServiceError = (error: unknown): ErrorResponse => {
  if (hasErrorCode(error)) return publicError(500, "internal_error");
  switch (errorMessage(error)) {
    case "sync_operation_too_large":
      return publicError(413, "request_too_large");
    case "stale_account_revision":
      return publicError(409, "stale_account_revision");
    case "record_revision_conflict":
      return publicError(409, "record_revision_conflict");
    case "immutable_integrity_conflict":
      return publicError(409, "immutable_integrity_conflict");
    case "multiple_active_session_references":
      return publicError(409, "active_session_conflict");
    case "account_snapshot_changed_retryable":
      return publicError(503, "account_data_retryable");
    default:
      return publicError(500, "internal_error");
  }
};

const snapshotServiceError = (error: unknown): ErrorResponse => {
  if (hasErrorCode(error)) return publicError(500, "internal_error");
  switch (errorMessage(error)) {
    case "snapshot_changed":
      return publicError(409, "snapshot_changed");
    case "account_snapshot_changed_retryable":
      return publicError(503, "account_data_retryable");
    default:
      return publicError(500, "internal_error");
  }
};

const adoptionServiceError = (error: unknown): ErrorResponse => {
  if (hasErrorCode(error)) return publicError(500, "internal_error");
  switch (errorMessage(error)) {
    case "invalid_adoption_start":
    case "invalid_adoption_page":
    case "invalid_adoption_page_fingerprint":
    case "invalid_adoption_preview_page":
    case "invalid_adoption_confirmation":
    case "invalid_adoption_cancel":
    case "invalid_adoption_advance":
    case "invalid_account_dataset":
    case "invalid_account_record":
    case "invalid_record_payload":
    case "record_fingerprint_mismatch":
      return publicError(400, "invalid_request");
    case "account_record_too_large":
    case "adoption_page_too_large":
      return publicError(413, "request_too_large");
    case "snapshot_changed":
    case "active_generation_changed":
      return publicError(409, "snapshot_changed");
    case "adoption_in_progress":
      return publicError(409, "adoption_in_progress");
    case "adoption_page_conflict":
    case "adoption_dataset_fingerprint_mismatch":
      return publicError(409, "adoption_page_conflict");
    case "adoption_step_changed":
      return publicError(409, "adoption_step_changed");
    case "adoption_not_ready":
      return publicError(409, "adoption_not_ready");
    case "adoption_conflict":
      return publicError(409, "adoption_conflict");
    case "active_session_conflict":
    case "multiple_active_session_references":
      return publicError(409, "active_session_conflict");
    case "account_data_retryable":
    case "account_snapshot_changed_retryable":
      return publicError(503, "account_data_retryable");
    default:
      return publicError(500, "internal_error");
  }
};

const requireSingleHeader = (value: string | readonly string[] | undefined): string | undefined => {
  if (value === undefined || typeof value === "string") return value;
  throw new RequestBoundaryError(publicError(400, "invalid_request"));
};

const validateEntityHeaders = (request: IncomingMessage, maximumBytes: number): void => {
  const contentType = request.headers["content-type"];
  if (typeof contentType !== "string" || !JSON_MEDIA_TYPE.test(contentType)) {
    throw new RequestBoundaryError(publicError(415, "unsupported_media_type"));
  }
  const contentEncoding = request.headers["content-encoding"];
  if (contentEncoding !== undefined && (
    typeof contentEncoding !== "string"
    || contentEncoding.toLowerCase() !== "identity"
  )) {
    throw new RequestBoundaryError(publicError(415, "unsupported_content_encoding"));
  }
  const contentLength = requireSingleHeader(request.headers["content-length"]);
  if (contentLength !== undefined) {
    if (!/^\d+$/u.test(contentLength)) throw new RequestBoundaryError(publicError(400, "invalid_request"));
    if (BigInt(contentLength) > BigInt(maximumBytes)) {
      throw new RequestBoundaryError(publicError(413, "request_too_large"));
    }
  }
};

const readRawBody = (request: IncomingMessage, maximumBytes: number): Promise<Buffer> => new Promise((resolve, reject) => {
  const chunks: Buffer[] = [];
  let bytes = 0;
  let settled = false;
  const rejectOnce = (error: Error): void => {
    if (settled) return;
    settled = true;
    reject(error);
  };
  request.on("data", (chunk: Buffer | string) => {
    if (settled) return;
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytes += buffer.length;
    if (bytes > maximumBytes) {
      rejectOnce(new RequestBoundaryError(publicError(413, "request_too_large")));
      return;
    }
    chunks.push(buffer);
  });
  request.once("end", () => {
    if (settled) return;
    settled = true;
    resolve(Buffer.concat(chunks, bytes));
  });
  request.once("aborted", () => rejectOnce(new Error("request_aborted")));
  request.once("error", rejectOnce);
});

const decodeJson = (body: Buffer): unknown => {
  if (body.length === 0) throw new RequestBoundaryError(publicError(400, "invalid_request"));
  if (body.subarray(0, UTF8_BOM.length).equals(UTF8_BOM)) {
    throw new RequestBoundaryError(publicError(400, "invalid_request"));
  }
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(body);
  } catch {
    throw new RequestBoundaryError(publicError(400, "invalid_request"));
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new RequestBoundaryError(publicError(400, "invalid_request"));
  }
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const prevalidateSyncInput = (body: unknown): Readonly<{
  expectedAccountRevision: number;
  mutations: readonly SyncMutation[];
  operationFingerprint: string;
}> => {
  if (
    !isObject(body)
    || Object.keys(body).sort().join(":") !== "expectedAccountRevision:mutations:operationFingerprint"
  ) {
    throw new RequestBoundaryError(publicError(400, "invalid_request"));
  }
  const semantic = {
    expectedAccountRevision: body.expectedAccountRevision,
    mutations: body.mutations,
  } as unknown as SyncOperationSemanticInput;
  let computedFingerprint: string;
  try {
    computedFingerprint = computeSyncOperationFingerprint(semantic);
  } catch (error) {
    if (errorMessage(error) === "account_record_too_large") {
      throw new RequestBoundaryError(publicError(413, "request_too_large"));
    }
    throw new RequestBoundaryError(publicError(400, "invalid_request"));
  }
  if (body.operationFingerprint !== computedFingerprint) {
    throw new RequestBoundaryError(publicError(400, "invalid_request"));
  }
  return { ...semantic, operationFingerprint: computedFingerprint };
};

const prevalidateSnapshotPageInput = (body: unknown): AccountSnapshotPageInput => {
  if (
    !isObject(body)
    || Object.keys(body).sort().join(":") !== "cursor:expectedAccountRevision:expectedDatasetFingerprint"
  ) {
    throw new RequestBoundaryError(publicError(400, "invalid_request"));
  }
  const initial = body.cursor === null
    && body.expectedAccountRevision === null
    && body.expectedDatasetFingerprint === null;
  const bound = (body.cursor === null || (typeof body.cursor === "string" && HASH_PATTERN.test(body.cursor)))
    && Number.isInteger(body.expectedAccountRevision)
    && (body.expectedAccountRevision as number) >= 0
    && typeof body.expectedDatasetFingerprint === "string"
    && HASH_PATTERN.test(body.expectedDatasetFingerprint);
  if (!initial && !bound) throw new RequestBoundaryError(publicError(400, "invalid_request"));
  return body as AccountSnapshotPageInput;
};

type StartAdoptionHttpInput = Parameters<AccountHttpService["startAdoption"]>[1];
type UploadAdoptionPageHttpInput = Parameters<AccountHttpService["uploadAdoptionPage"]>[1];
type AdvanceAdoptionHttpInput = Parameters<AccountHttpService["advanceAdoption"]>[1];
type AdoptionPreviewPageHttpInput = Parameters<AccountHttpService["readAdoptionPreviewPage"]>[1];
type ConfirmAdoptionHttpInput = Parameters<AccountHttpService["confirmAdoptionOperation"]>[1];
type CancelAdoptionHttpInput = Parameters<AccountHttpService["cancelAdoption"]>[1];

const hasExactKeys = (value: Record<string, unknown>, expected: readonly string[]): boolean => {
  const actual = Object.keys(value);
  return actual.length === expected.length
    && expected.every((key) => Object.prototype.hasOwnProperty.call(value, key));
};

const prevalidateStartAdoptionInput = (body: unknown): StartAdoptionHttpInput => {
  if (!isObject(body) || !hasExactKeys(body, [
    "adoptionId", "expectedAccountRevision", "expectedDatasetFingerprint", "localDatasetFingerprint",
    "localRecordCount", "restartCancelled", "restartDiscarded",
  ]) || typeof body.adoptionId !== "string"
    || typeof body.expectedAccountRevision !== "number"
    || typeof body.expectedDatasetFingerprint !== "string" || typeof body.localDatasetFingerprint !== "string"
    || typeof body.localRecordCount !== "number"
    || typeof body.restartCancelled !== "boolean" || typeof body.restartDiscarded !== "boolean") {
    throw new RequestBoundaryError(publicError(400, "invalid_request"));
  }
  return body as StartAdoptionHttpInput;
};

const prevalidateUploadAdoptionPageInput = (body: unknown): UploadAdoptionPageHttpInput => {
  if (!isObject(body) || !hasExactKeys(body, ["adoptionId", "pageFingerprint", "records", "startRecordIndex"])
    || typeof body.adoptionId !== "string" || typeof body.pageFingerprint !== "string"
    || !Array.isArray(body.records) || typeof body.startRecordIndex !== "number") {
    throw new RequestBoundaryError(publicError(400, "invalid_request"));
  }
  return body as unknown as UploadAdoptionPageHttpInput;
};

const prevalidateAdvanceAdoptionInput = (body: unknown): AdvanceAdoptionHttpInput => {
  if (!isObject(body) || !hasExactKeys(body, ["adoptionId", "expectedStepToken"])
    || typeof body.adoptionId !== "string" || typeof body.expectedStepToken !== "string") {
    throw new RequestBoundaryError(publicError(400, "invalid_request"));
  }
  return body as AdvanceAdoptionHttpInput;
};

const prevalidateAdoptionPreviewPageInput = (body: unknown): AdoptionPreviewPageHttpInput => {
  if (!isObject(body) || !hasExactKeys(body, ["adoptionId", "afterSequenceId"])
    || typeof body.adoptionId !== "string"
    || (body.afterSequenceId !== null && typeof body.afterSequenceId !== "string")) {
    throw new RequestBoundaryError(publicError(400, "invalid_request"));
  }
  return body as AdoptionPreviewPageHttpInput;
};

const prevalidateConfirmAdoptionInput = (body: unknown): ConfirmAdoptionHttpInput => {
  if (!isObject(body) || !hasExactKeys(body, ["adoptionId", "confirmation"])
    || typeof body.adoptionId !== "string" || !isObject(body.confirmation)) {
    throw new RequestBoundaryError(publicError(400, "invalid_request"));
  }
  return body as unknown as ConfirmAdoptionHttpInput;
};

const prevalidateCancelAdoptionInput = (body: unknown): CancelAdoptionHttpInput => {
  if (!isObject(body) || !hasExactKeys(body, ["adoptionId"]) || typeof body.adoptionId !== "string") {
    throw new RequestBoundaryError(publicError(400, "invalid_request"));
  }
  return body as CancelAdoptionHttpInput;
};

const authorizationHeader = (request: IncomingMessage): string | undefined => {
  const value = request.headers.authorization;
  return typeof value === "string" ? value : undefined;
};

const handleSyncRequest = async (
  request: IncomingMessage,
  response: ServerResponse,
  dependencies: AccountHttpDependencies,
): Promise<void> => {
  let uid: string;
  try {
    ({ uid } = await authenticateAccountRequest({
      headers: { authorization: authorizationHeader(request) },
    }, {
      expectedProjectId: dependencies.expectedProjectId,
      nowSeconds: dependencies.nowSeconds,
      verifier: dependencies.verifier,
    }));
  } catch (error) {
    sendError(response, authenticationError(error));
    return;
  }

  let input: ReturnType<typeof prevalidateSyncInput>;
  try {
    validateEntityHeaders(request, MAX_SYNC_HTTP_BODY_BYTES);
    input = prevalidateSyncInput(decodeJson(await readRawBody(request, MAX_SYNC_HTTP_BODY_BYTES)));
  } catch (error) {
    sendError(
      response,
      error instanceof RequestBoundaryError ? error.response : publicError(500, "internal_error"),
    );
    return;
  }

  try {
    await dependencies.service.applySync(uid, input);
  } catch (error) {
    sendError(response, syncServiceError(error));
    return;
  }

  sendJson(response, 200, {
    committedAccountRevision: input.expectedAccountRevision + 1,
    operationFingerprint: input.operationFingerprint,
    result: "synchronized",
  });
};

const snapshotResponseBody = (page: AccountSnapshotPage): Buffer => {
  const maximumRecords = Math.min(20, page.entries.length);
  if (maximumRecords === 0) {
    return Buffer.from(JSON.stringify({
      accountRevision: page.accountRevision,
      datasetFingerprint: page.datasetFingerprint,
      recordCount: page.recordCount,
      records: [],
      nextCursor: null,
    }));
  }
  for (let count = maximumRecords; count > 0; count -= 1) {
    const selected = page.entries.slice(0, count);
    const body = Buffer.from(JSON.stringify({
      accountRevision: page.accountRevision,
      datasetFingerprint: page.datasetFingerprint,
      recordCount: page.recordCount,
      records: selected.map((entry) => entry.record),
      nextCursor: count < page.entries.length ? selected.at(-1)!.cursor : null,
    }));
    if (body.length <= MAX_SNAPSHOT_HTTP_RESPONSE_BYTES) return body;
  }
  throw new Error("account_snapshot_response_too_large");
};

const sendJsonBody = (response: ServerResponse, status: number, body: Buffer): void => {
  response.writeHead(status, {
    "Cache-Control": "no-store",
    "Content-Length": body.length,
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(body);
};

const adoptionPreviewResponseBody = (value: unknown): Buffer => {
  const body = Buffer.from(JSON.stringify(value));
  if (body.length > MAX_ADOPTION_PREVIEW_HTTP_RESPONSE_BYTES) {
    throw new Error("adoption_preview_response_too_large");
  }
  return body;
};

const handleSnapshotPageRequest = async (
  request: IncomingMessage,
  response: ServerResponse,
  dependencies: AccountHttpDependencies,
): Promise<void> => {
  let uid: string;
  try {
    ({ uid } = await authenticateAccountRequest({
      headers: { authorization: authorizationHeader(request) },
    }, {
      expectedProjectId: dependencies.expectedProjectId,
      nowSeconds: dependencies.nowSeconds,
      verifier: dependencies.verifier,
    }));
  } catch (error) {
    sendError(response, authenticationError(error));
    return;
  }

  let input: AccountSnapshotPageInput;
  try {
    validateEntityHeaders(request, MAX_SNAPSHOT_HTTP_BODY_BYTES);
    input = prevalidateSnapshotPageInput(decodeJson(await readRawBody(request, MAX_SNAPSHOT_HTTP_BODY_BYTES)));
  } catch (error) {
    sendError(
      response,
      error instanceof RequestBoundaryError ? error.response : publicError(500, "internal_error"),
    );
    return;
  }

  try {
    const page = await dependencies.service.readSnapshotPage(uid, input);
    sendJsonBody(response, 200, snapshotResponseBody(page));
  } catch (error) {
    sendError(response, snapshotServiceError(error));
  }
};

const handleAdoptionRequest = async (
  path: AdoptionPath,
  request: IncomingMessage,
  response: ServerResponse,
  dependencies: AccountHttpDependencies,
): Promise<void> => {
  let uid: string;
  try {
    ({ uid } = await authenticateAccountRequest({
      headers: { authorization: authorizationHeader(request) },
    }, {
      expectedProjectId: dependencies.expectedProjectId,
      nowSeconds: dependencies.nowSeconds,
      verifier: dependencies.verifier,
    }));
  } catch (error) {
    sendError(response, authenticationError(error));
    return;
  }

  let body: unknown;
  try {
    const maximumBytes = path === ADOPTION_UPLOAD_PAGE_PATH
      ? MAX_ADOPTION_UPLOAD_HTTP_BODY_BYTES
      : MAX_ADOPTION_HTTP_BODY_BYTES;
    validateEntityHeaders(request, maximumBytes);
    body = decodeJson(await readRawBody(request, maximumBytes));
  } catch (error) {
    sendError(
      response,
      error instanceof RequestBoundaryError ? error.response : publicError(500, "internal_error"),
    );
    return;
  }

  try {
    switch (path) {
      case ADOPTION_START_PATH:
        sendJson(response, 200, await dependencies.service.startAdoption(uid, prevalidateStartAdoptionInput(body)));
        return;
      case ADOPTION_UPLOAD_PAGE_PATH:
        sendJson(response, 200, await dependencies.service.uploadAdoptionPage(uid, prevalidateUploadAdoptionPageInput(body)));
        return;
      case ADOPTION_ADVANCE_PATH:
        sendJson(response, 200, await dependencies.service.advanceAdoption(uid, prevalidateAdvanceAdoptionInput(body)));
        return;
      case ADOPTION_PREVIEW_PAGE_PATH: {
        const page = await dependencies.service.readAdoptionPreviewPage(uid, prevalidateAdoptionPreviewPageInput(body));
        sendJsonBody(response, 200, adoptionPreviewResponseBody(page));
        return;
      }
      case ADOPTION_CONFIRM_PATH:
        sendJson(response, 200, await dependencies.service.confirmAdoptionOperation(uid, prevalidateConfirmAdoptionInput(body)));
        return;
      case ADOPTION_CANCEL_PATH:
        sendJson(response, 200, await dependencies.service.cancelAdoption(uid, prevalidateCancelAdoptionInput(body)));
        return;
    }
  } catch (error) {
    sendError(
      response,
      error instanceof RequestBoundaryError ? error.response : adoptionServiceError(error),
    );
  }
};

const isAdoptionPath = (value: string | undefined): value is AdoptionPath =>
  typeof value === "string" && (ADOPTION_PATHS as readonly string[]).includes(value);

export const createAccountHttpHandler = (dependencies: AccountHttpDependencies): RequestListener =>
  (request, response) => {
    if (request.url !== SYNC_PATH && request.url !== SNAPSHOT_PAGE_PATH && !isAdoptionPath(request.url)) {
      sendError(response, publicError(404, "not_found"));
      return;
    }
    if (request.method !== "POST") {
      sendError(response, publicError(405, "method_not_allowed"), { Allow: "POST" });
      return;
    }
    const operation = request.url === SYNC_PATH
      ? handleSyncRequest(request, response, dependencies)
      : request.url === SNAPSHOT_PAGE_PATH
        ? handleSnapshotPageRequest(request, response, dependencies)
        : handleAdoptionRequest(request.url, request, response, dependencies);
    void operation.catch(() => {
      if (!response.headersSent) sendError(response, publicError(500, "internal_error"));
      else response.destroy();
    });
  };
