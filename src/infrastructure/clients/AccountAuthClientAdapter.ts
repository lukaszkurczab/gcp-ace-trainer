import type { ConfiguredPublicEnvironment, PublicEnvironment } from "./publicEnvironment";

export type AccountRecordType = "activeTrack" | "trainingSession" | "trainingSessionResult" | "trainingAttempt" | "reviewQueueEntry";

export type AccountRecord = Readonly<{
  fingerprint: string;
  id: string;
  payload: Readonly<Record<string, unknown>>;
  revision?: number;
  type: AccountRecordType;
}>;

export type AccountSyncMutation = Readonly<{
  expectedRecordRevision: number | null;
  kind: "delete" | "put";
  record: AccountRecord;
}>;

export type AccountSyncInput = Readonly<{
  expectedAccountRevision: number;
  mutations: readonly AccountSyncMutation[];
  operationFingerprint: string;
}>;

export type AccountSnapshotPageInput = Readonly<{
  cursor: string | null;
  expectedAccountRevision: number | null;
  expectedDatasetFingerprint: string | null;
}>;

export type AccountSnapshotPage = Readonly<{
  accountRevision: number;
  datasetFingerprint: string;
  nextCursor: string | null;
  recordCount: number;
  records: readonly AccountRecord[];
}>;

export type AccountDeletionRequest = Readonly<{
  requestedAt: string;
  requestId: string;
}>;

export type AccountAuthTokenProvider = Readonly<{
  getAppCheckToken: () => Promise<string | null>;
  getIdToken: () => Promise<string | null>;
}>;

export type AccountClientErrorCode =
  | "account_app_check_required"
  | "account_authentication_required"
  | "account_client_unconfigured"
  | "account_invalid_response"
  | "account_request_failed"
  | "account_server_error"
  | "account_transport_failed";

export class AccountClientError extends Error {
  constructor(readonly code: AccountClientErrorCode) {
    super(code);
    this.name = "AccountClientError";
  }
}

export type AccountAuthClientAdapter = Readonly<{
  availability: "available";
  deleteAccount: (input: AccountDeletionRequest) => Promise<Readonly<{ completedAt: string; requestId: string; result: "account_deleted" }>>;
  readSnapshotPage: (input: AccountSnapshotPageInput) => Promise<AccountSnapshotPage>;
  sync: (input: AccountSyncInput) => Promise<Readonly<{ committedAccountRevision: number; operationFingerprint: string; result: "synchronized" }>>;
}>;

type FetchImplementation = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export function createAccountAuthClientAdapter(input: Readonly<{
  credentials: AccountAuthTokenProvider;
  environment: PublicEnvironment;
  fetchImplementation?: FetchImplementation;
}>): AccountAuthClientAdapter {
  if (input.environment.kind !== "configured") throw new AccountClientError("account_client_unconfigured");
  const environment = input.environment.value;
  const fetchImplementation = input.fetchImplementation ?? fetch;

  const requestJson = async <T>(path: string, body: unknown): Promise<T> => {
    const headers = await authorizationHeaders(input.credentials);
    const url = endpoint(environment, path);
    let response: Response;
    try {
      response = await fetchImplementation(url, {
        body: JSON.stringify(body),
        headers: { ...headers, "content-type": "application/json" },
        method: "POST",
      });
    } catch {
      throw new AccountClientError("account_transport_failed");
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new AccountClientError("account_invalid_response");
    }
    if (!response.ok) {
      const serverCode = isRecord(payload) && isRecord(payload.error) && typeof payload.error.code === "string"
        ? payload.error.code
        : null;
      throw new AccountClientError(serverCode ? "account_server_error" : "account_request_failed");
    }
    return payload as T;
  };

  return Object.freeze({
    availability: "available" as const,
    async deleteAccount(request: AccountDeletionRequest) {
      const result = await requestJson<unknown>("/v1/account/deletion", request);
      if (!isRecord(result) || result.result !== "account_deleted" || typeof result.requestId !== "string" || typeof result.completedAt !== "string") {
        throw new AccountClientError("account_invalid_response");
      }
      return Object.freeze({ completedAt: result.completedAt, requestId: result.requestId, result: "account_deleted" as const });
    },
    async readSnapshotPage(page: AccountSnapshotPageInput) {
      const result = await requestJson<unknown>("/v1/account/snapshot/page", page);
      if (!isRecord(result) || !Number.isSafeInteger(result.accountRevision) || typeof result.datasetFingerprint !== "string"
        || !Number.isSafeInteger(result.recordCount) || !Array.isArray(result.records)
        || (result.nextCursor !== null && typeof result.nextCursor !== "string")) {
        throw new AccountClientError("account_invalid_response");
      }
      return result as AccountSnapshotPage;
    },
    async sync(syncInput: AccountSyncInput) {
      const result = await requestJson<unknown>("/v1/account/sync", syncInput);
      if (!isRecord(result) || result.result !== "synchronized" || !Number.isSafeInteger(result.committedAccountRevision) || typeof result.operationFingerprint !== "string") {
        throw new AccountClientError("account_invalid_response");
      }
      const committedAccountRevision = result.committedAccountRevision as number;
      return Object.freeze({ committedAccountRevision, operationFingerprint: result.operationFingerprint, result: "synchronized" as const });
    },
  });
}

async function authorizationHeaders(credentials: AccountAuthTokenProvider): Promise<Readonly<Record<string, string>>> {
  const idToken = await credentials.getIdToken();
  if (!idToken) throw new AccountClientError("account_authentication_required");
  const appCheckToken = await credentials.getAppCheckToken();
  if (!appCheckToken) throw new AccountClientError("account_app_check_required");
  return Object.freeze({ authorization: `Bearer ${idToken}`, "x-firebase-appcheck": appCheckToken });
}

function endpoint(environment: ConfiguredPublicEnvironment, path: string): string {
  const url = new URL(path, environment.apiOrigin);
  if (url.origin !== new URL(environment.apiOrigin).origin || !path.startsWith("/v1/account/")) {
    throw new AccountClientError("account_client_unconfigured");
  }
  return url.toString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
