import type { PublishedRootManifest, PublishedRootTrack, PublishedTrackManifest } from "../contracts";
import { ContentConfigurationError, ContentHttpError, ContentTimeoutError, ContentValidationError } from "../errors";
import type { ContentSource, RawContentBank } from "./contentSource";

const TIMEOUT_MS = 10_000;
function baseUrl(): string {
  const value = process.env.EXPO_PUBLIC_PATTERNLY_CONTENT_BASE_URL;
  if (!value) throw new ContentConfigurationError();
  return value.endsWith("/") ? value : `${value}/`;
}
function resolve(base: string, path: string): string { return new URL(path, base).toString(); }

export class HttpContentSource implements ContentSource {
  private readonly manifestUrls = new Map<string, string>();
  constructor(private readonly configuredBaseUrl?: string, private readonly requestTimeoutMs = TIMEOUT_MS) {}
  private get base(): string { return this.configuredBaseUrl ? (this.configuredBaseUrl.endsWith("/") ? this.configuredBaseUrl : `${this.configuredBaseUrl}/`) : baseUrl(); }
  private async fetch(url: string): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.requestTimeoutMs);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new ContentHttpError(response.status, url);
      return response;
    } catch (error) {
      if (error instanceof ContentHttpError) throw error;
      if (error instanceof Error && error.name === "AbortError") throw new ContentTimeoutError(url);
      throw new ContentHttpError(0, url);
    } finally { clearTimeout(timeout); }
  }
  private async json<T>(url: string): Promise<T> {
    const text = await (await this.fetch(url)).text();
    try { return JSON.parse(text) as T; } catch { throw new ContentValidationError(`Content response is not valid JSON: ${url}`); }
  }
  getRootManifest(): Promise<PublishedRootManifest> { return this.json(resolve(this.base, "manifest.json")); }
  async getTrackManifest(entry: PublishedRootTrack): Promise<PublishedTrackManifest> { const url = resolve(this.base, entry.manifestPath); const manifest = await this.json<PublishedTrackManifest>(url); this.manifestUrls.set(manifest.trackId, url); return manifest; }
  async getTrackBank(manifest: PublishedTrackManifest): Promise<RawContentBank> {
    const manifestUrl = this.manifestUrls.get(manifest.trackId);
    if (!manifestUrl) throw new ContentValidationError("Track manifest was not fetched by this content source.");
    const response = await this.fetch(new URL(manifest.bankPath, manifestUrl).toString());
    const bytes = await response.arrayBuffer();
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    try { return { bytes, text, json: JSON.parse(text) }; } catch { throw new ContentValidationError("Content bank is not valid JSON."); }
  }
}
