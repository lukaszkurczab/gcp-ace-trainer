/**
 * Generated from patternly-backend/openapi/patternly-v1.json.
 * Regenerate with the backend client-generation script; do not edit DTOs by hand.
 */

export type ProgressMutationDto = Readonly<{
  mutationId: string;
  kind: "node" | "item";
  trackId: string;
  targetId: string;
  expectedVersion: number | null;
  state: Readonly<Record<string, unknown>>;
}>;

export type SyncRequestDto = Readonly<{
  deviceId?: string | null;
  mutations: readonly ProgressMutationDto[];
}>;

export type ProgressRecordDto = Readonly<{
  kind: "node" | "item";
  trackId: string;
  targetId: string;
  version: number;
  state: Readonly<Record<string, unknown>>;
  lastMutationId: string;
  updatedAt: string;
}>;

export type MeResponseDto = Readonly<{ user: Readonly<{ id: string; createdAt: string; identity: Readonly<{ provider: string; subject: string; email: string | null; emailVerified: boolean }> }> }>;
export type EntitlementsResponseDto = Readonly<{ entitlements: readonly Readonly<{ entitlement: string; status: string; source: string; expiresAt: string | null; updatedAt: string }>[] }>;
export type ProgressResponseDto = Readonly<{ records: readonly ProgressRecordDto[] }>;
export type SyncResponseDto = Readonly<{ applied: readonly ProgressRecordDto[]; duplicates: readonly string[]; conflicts: readonly Readonly<{ mutationId: string; code: "version_conflict"; current: ProgressRecordDto | null }>[] }>;
export type TracksResponseDto = Readonly<{ tracks: readonly Readonly<{ trackId: string; source: string; status: string; updatedAt: string }>[] }>;
export type ContentVersionsResponseDto = Readonly<{ versions: readonly Readonly<{ trackId: string; version: string; checksumSha256: string; packageUri: string; publishedAt: string }>[] }>;
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
  getTracks: () => Promise<TracksResponseDto>;
  getContentVersions: () => Promise<ContentVersionsResponseDto>;
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

  async function requestJson<T>(path: string, method: "GET" | "POST", body?: unknown, requiresAuthentication = true): Promise<T> {
    const token = requiresAuthentication ? await input.getIdToken() : null;
    if (requiresAuthentication && !token) throw new PatternlyApiClientError("authentication_required");
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
        headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body === undefined ? {} : { "content-type": "application/json" }) },
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
    getHealth: () => requestJson<HealthResponseDto>("/health", "GET", undefined, false),
    getReady: () => requestJson<ReadyResponseDto>("/ready", "GET", undefined, false),
    getOpenApi: () => requestJson<OpenApiResponseDto>("/openapi.json", "GET", undefined, false),
    getMe: () => requestJson<MeResponseDto>("/v1/me", "GET"),
    getEntitlements: () => requestJson<EntitlementsResponseDto>("/v1/entitlements", "GET"),
    getProgress: () => requestJson<ProgressResponseDto>("/v1/progress", "GET"),
    syncProgress: (body: SyncRequestDto) => requestJson<SyncResponseDto>("/v1/progress/sync", "POST", body),
    getTracks: () => requestJson<TracksResponseDto>("/v1/tracks", "GET"),
    getContentVersions: () => requestJson<ContentVersionsResponseDto>("/v1/content/versions", "GET"),
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
