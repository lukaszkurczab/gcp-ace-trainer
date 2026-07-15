import * as Crypto from "expo-crypto";

export interface ContentHasher {
  sha256(value: string): Promise<string>;
}

export const contentHasher: ContentHasher = {
  sha256(value) {
    return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value, {
      encoding: Crypto.CryptoEncoding.HEX,
    });
  },
};
