import * as Crypto from "expo-crypto";
import { gunzipSync } from "fflate";

import type { ContentPackageRuntime } from "../../content/contracts";
import { bytesToHex, decodePackageBase64, decodePackageUtf8 } from "./contentPackageRuntime.shared";

async function sha256Bytes(value: Uint8Array): Promise<string> {
  // Copy into an ArrayBuffer-backed view because Expo Crypto's BufferSource
  // contract intentionally excludes SharedArrayBuffer-backed views.
  const digest = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, new Uint8Array(value));
  return bytesToHex(new Uint8Array(digest));
}

/** React Native composition for immutable content-package verification. */
export const contentPackageRuntime: ContentPackageRuntime = Object.freeze({
  sha256Utf8(value) {
    return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value, {
      encoding: Crypto.CryptoEncoding.HEX,
    });
  },
  sha256Bytes,
  decodeBase64: decodePackageBase64,
  async gunzip(value) {
    return gunzipSync(value);
  },
  decodeUtf8: decodePackageUtf8,
});
