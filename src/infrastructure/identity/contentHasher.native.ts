import * as Crypto from "expo-crypto";

export interface ContentHasher {
  sha256(value: string): Promise<string>;
  sha256Bytes(value: Uint8Array): Promise<string>;
}

export const contentHasher: ContentHasher = {
  sha256(value) {
    return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value, {
      encoding: Crypto.CryptoEncoding.HEX,
    });
  },
  async sha256Bytes(value) {
    const bytes = value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) as ArrayBuffer;
    const digest = new Uint8Array(await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, bytes));
    return [...digest].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  },
};
