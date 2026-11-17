/**
 * T2.4: native source of canonical content. The files are not part of `main.jsbundle`; the build copies
 * `src/content/generated/{canonical-content,retained-content}/*.json` into the app (`plugins/withBundledContent.js`):
 * - iOS: `<App>.app/patternly-content/<directory>/<file>`;
 * - Android: APK assets `<directory>/<file>` (`asset://`).
 *
 * `sha256` is computed natively over the exact file bytes (Expo Crypto `digest`, zero-copy over the buffer).
 * The loader compares it with the content trust manifest before it parses the text.
 */
import { Platform } from "react-native";
import { requireNativeModule } from "expo-modules-core";
import type { ContentAsset, ContentAssetDirectory, ContentAssetSource } from "./contentAssetSource";

export type { ContentAsset, ContentAssetDirectory, ContentAssetSource } from "./contentAssetSource";

type FileSystemModule = typeof import("expo-file-system");
type NativeCrypto = Readonly<{ digest(algorithm: string, output: Uint8Array, data: Uint8Array): void }>;

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

function sha256Hex(bytes: Uint8Array): string {
  const digest = new Uint8Array(32);
  nativeCrypto().digest("SHA-256", digest, bytes);
  let hex = "";
  for (const byte of digest) hex += (byte < 16 ? "0" : "") + byte.toString(16);
  return hex;
}

export const bundledContentAssetSource: ContentAssetSource = Object.freeze({
  async read(directory: ContentAssetDirectory, fileName: string): Promise<ContentAsset> {
    const file = contentFile(directory, fileName);
    // Both reads leave the JS thread; the bytes are hashed before the text is ever parsed.
    const [bytes, text] = await Promise.all([file.bytes(), file.text()]);
    return Object.freeze({ text, sha256: sha256Hex(bytes) });
  },
  readSync(directory: ContentAssetDirectory, fileName: string): ContentAsset {
    const file = contentFile(directory, fileName);
    return Object.freeze({ sha256: sha256Hex(file.bytesSync()), text: file.textSync() });
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
