/**
 * T2.4: native source of canonical content. The files are not part of `main.jsbundle`; the build copies
 * `src/content/generated/{canonical-content,retained-content}/*.json` into the app (`plugins/withBundledContent.js`):
 * - iOS: `<App>.app/patternly-content/<directory>/<file>`;
 * - Android: APK assets `<directory>/<file>` (`asset://`).
 *
 * `sha256` is the SHA-256 of the exact file bytes, computed natively (Expo Crypto `digest`, zero-copy over the
 * buffer `bytesSync()` returns; the `Data` → `Uint8Array` conversion is a single memcpy). The loader compares it
 * with the content trust manifest before it builds the track. The text that is parsed is decoded as strict UTF-8.
 *
 * T2.4 device check (seed 100, coding track, 10.8 MB): `File.text()`/`textSync()` decode with
 * `String(contentsOf:)` (no encoding), which yields a bridged string whose UTF-8 copy into JS costs ~170-230 ms
 * on the JS thread. The legacy module's `readAsStringAsync` decodes with `.utf8` (a native string, copied in
 * ~0 ms). It is an async native function and Expo runs all of them on one serial queue, together with
 * SecureStore, so it holds that queue only for the ~30 ms read. `readSync` (first synchronous use of an
 * inactive track) has no such API and pays the bridged copy.
 */
import { Platform } from "react-native";
import { requireNativeModule } from "expo-modules-core";
import { beginStartupSpan } from "../../infrastructure/diagnostics/startupTrace";
import type { ContentAsset, ContentAssetDirectory, ContentAssetSource } from "./contentAssetSource";

export type { ContentAsset, ContentAssetDirectory, ContentAssetSource } from "./contentAssetSource";

type FileSystemModule = typeof import("expo-file-system");
type NativeCrypto = Readonly<{ digest(algorithm: "SHA-256", output: Uint8Array, data: Uint8Array): void }>;
type LegacyFileSystem = Readonly<{ readAsStringAsync(uri: string, options: Readonly<{ encoding: "utf8" }>): Promise<string> }>;

let fileSystem: FileSystemModule | null = null;
let crypto: NativeCrypto | null = null;
let legacy: LegacyFileSystem | null = null;
const fs = (): FileSystemModule => (fileSystem ??= require("expo-file-system") as FileSystemModule);
const nativeCrypto = (): NativeCrypto => (crypto ??= requireNativeModule<NativeCrypto>("ExpoCrypto"));
const legacyFileSystem = (): LegacyFileSystem => (legacy ??= requireNativeModule<LegacyFileSystem>("ExponentFileSystem"));
const UTF8 = Object.freeze({ encoding: "utf8" as const });

function contentFile(directory: ContentAssetDirectory, fileName: string) {
  const { File, Paths } = fs();
  return Platform.OS === "android"
    ? new File(Paths.bundle, directory, fileName)
    : new File(Paths.bundle, "patternly-content", directory, fileName);
}

function sha256Hex(bytes: Uint8Array): string {
  const digest = new Uint8Array(32);
  nativeCrypto().digest("SHA-256", digest, bytes);
  let hex = "";
  for (const byte of digest) hex += (byte < 16 ? "0" : "") + byte.toString(16);
  return hex;
}

function hashFile(file: ReturnType<typeof contentFile>): string {
  const end = beginStartupSpan("catalog_asset_hash");
  try { return sha256Hex(file.bytesSync()); }
  finally { end(); }
}

export const bundledContentAssetSource: ContentAssetSource = Object.freeze({
  async read(directory: ContentAssetDirectory, fileName: string): Promise<ContentAsset> {
    const file = contentFile(directory, fileName);
    const endRead = beginStartupSpan("catalog_asset_read");
    let text: string;
    try { text = await legacyFileSystem().readAsStringAsync(file.uri, UTF8); }
    finally { endRead(); }
    return Object.freeze({ text, sha256: hashFile(file) });
  },
  readSync(directory: ContentAssetDirectory, fileName: string): ContentAsset {
    const file = contentFile(directory, fileName);
    const endRead = beginStartupSpan("catalog_asset_read");
    let text: string;
    try { text = file.textSync(); }
    finally { endRead(); }
    return Object.freeze({ text, sha256: hashFile(file) });
  },
});

/**
 * Startup hint: the last active track, so its asset can be read while profile storage is still opening.
 * Only a hint (a registered track id, no learning data): a missing or wrong value costs one later read.
 */
const HINT_FILE = "patternly-content-startup-track";
export function readStartupTrackHint(): string | null {
  try {
    const { File, Paths } = fs();
    const file = new File(Paths.document, HINT_FILE);
    if (!file.exists) return null;
    const value = file.textSync().trim();
    return value.length > 0 && value.length <= 128 ? value : null;
  } catch { return null; }
}
export function writeStartupTrackHint(trackId: string): void {
  try {
    const { File, Paths } = fs();
    const file = new File(Paths.document, HINT_FILE);
    if (file.exists && file.textSync() === trackId) return;
    file.write(trackId);
  } catch { /* The hint is an optimization only. */ }
}
