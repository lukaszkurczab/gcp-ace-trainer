/**
 * T2.4: native source of canonical content. The files are not part of `main.jsbundle`; the build copies
 * `src/content/generated/{canonical-content,retained-content}/*.json` into the app (`plugins/withBundledContent.js`):
 * - iOS: `<App>.app/patternly-content/<directory>/<file>`;
 * - Android: APK assets `<directory>/<file>` (`asset://`).
 *
 * `sha256` is the SHA-256 of the text re-encoded as UTF-8, computed natively by Expo Crypto. For a UTF-8 file
 * that is exactly the file bytes; a file decoded any other way re-encodes differently and fails the manifest
 * check (fail closed). The loader compares the digest with the content trust manifest before it builds the track.
 *
 * T2.4 device check (seed 100, coding track, 10.8 MB): a `Uint8Array` copy of the file (`bytes()`) blocked the
 * JS thread for hundreds of ms, so only text is read. `readSync` (~40 ms read + ~15 ms hash) is the start path:
 * the async variant runs on Expo's single serial queue for async native functions and would hold back SecureStore
 * and the account start behind it. `read` is for later loads (track switch), off the JS thread.
 */
import { Platform } from "react-native";
import { requireNativeModule } from "expo-modules-core";
import { beginStartupSpan } from "../../infrastructure/diagnostics/startupTrace";
import type { ContentAsset, ContentAssetDirectory, ContentAssetSource } from "./contentAssetSource";

export type { ContentAsset, ContentAssetDirectory, ContentAssetSource } from "./contentAssetSource";

type FileSystemModule = typeof import("expo-file-system");
type DigestOptions = Readonly<{ encoding: "hex" }>;
type NativeCrypto = Readonly<{
  digestString(algorithm: "SHA-256", value: string, options: DigestOptions): string;
  digestStringAsync(algorithm: "SHA-256", value: string, options: DigestOptions): Promise<string>;
}>;

let fileSystem: FileSystemModule | null = null;
let crypto: NativeCrypto | null = null;
const fs = (): FileSystemModule => (fileSystem ??= require("expo-file-system") as FileSystemModule);
const nativeCrypto = (): NativeCrypto => (crypto ??= requireNativeModule<NativeCrypto>("ExpoCrypto"));

function contentFile(directory: ContentAssetDirectory, fileName: string) {
  const { File, Paths } = fs();
  return Platform.OS === "android"
    ? new File(Paths.bundle, directory, fileName)
    : new File(Paths.bundle, "patternly-content", directory, fileName);
}

const HEX: DigestOptions = Object.freeze({ encoding: "hex" });

export const bundledContentAssetSource: ContentAssetSource = Object.freeze({
  async read(directory: ContentAssetDirectory, fileName: string): Promise<ContentAsset> {
    const endRead = beginStartupSpan("catalog_asset_read");
    let text: string;
    try { text = await contentFile(directory, fileName).text(); }
    finally { endRead(); }
    const endHash = beginStartupSpan("catalog_asset_hash");
    try { return Object.freeze({ text, sha256: await nativeCrypto().digestStringAsync("SHA-256", text, HEX) }); }
    finally { endHash(); }
  },
  readSync(directory: ContentAssetDirectory, fileName: string): ContentAsset {
    const endRead = beginStartupSpan("catalog_asset_read");
    let text: string;
    try { text = contentFile(directory, fileName).textSync(); }
    finally { endRead(); }
    const endHash = beginStartupSpan("catalog_asset_hash");
    try { return Object.freeze({ text, sha256: nativeCrypto().digestString("SHA-256", text, HEX) }); }
    finally { endHash(); }
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
