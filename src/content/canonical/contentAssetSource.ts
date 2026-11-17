/**
 * T2.4: canonical content lives outside the JS bundle. This is the Node/test source: it reads the same
 * generated files that the native build copies into the app (`contentAssetSource.native.ts`).
 *
 * `sha256` is the digest of the exact file bytes. The loader compares it with the content trust manifest
 * (T1.4) before parsing, so a changed or truncated asset never reaches the catalog.
 */
export type ContentAssetDirectory = "canonical-content" | "retained-content";
export type ContentAsset = Readonly<{ text: string; sha256: string }>;
export type ContentAssetSource = Readonly<{
  read(directory: ContentAssetDirectory, fileName: string): Promise<ContentAsset>;
  readSync(directory: ContentAssetDirectory, fileName: string): ContentAsset;
}>;

function readNode(directory: ContentAssetDirectory, fileName: string): ContentAsset {
  const { readFileSync } = require("node:fs") as typeof import("node:fs");
  const { createHash } = require("node:crypto") as typeof import("node:crypto");
  const path = require("node:path") as typeof import("node:path");
  const bytes = readFileSync(path.join(__dirname, "..", "generated", directory, fileName));
  return Object.freeze({ text: bytes.toString("utf8"), sha256: createHash("sha256").update(bytes).digest("hex") });
}

export const bundledContentAssetSource: ContentAssetSource = Object.freeze({
  async read(directory: ContentAssetDirectory, fileName: string) { return readNode(directory, fileName); },
  readSync: readNode,
});

/** Startup hint (which track to read before profile storage is open). Node keeps it in memory. */
let hint: string | null = null;
export function readStartupTrackHint(): string | null { return hint; }
export function writeStartupTrackHint(trackId: string): void { hint = trackId; }
