import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./contentHasher.native.ts", import.meta.url), "utf8");

test("native byte hashing passes an owned TypedArray to expo-crypto", () => {
  assert.match(source, /const bytes = new Uint8Array\(value\.byteLength\);\s*bytes\.set\(value\);/u);
  assert.match(source, /Crypto\.digest\(Crypto\.CryptoDigestAlgorithm\.SHA256, bytes\)/u);
  assert.doesNotMatch(source, /value\.buffer\.slice/u);
});
