import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { sha256Utf8 } from "./sha256";
import { sha256Utf8 as infrastructureSha256Utf8 } from "../../infrastructure/identity/sha256";

test("domain SHA and active infrastructure imports share one unchanged UTF-8 implementation", () => {
  assert.equal(infrastructureSha256Utf8, sha256Utf8);
  for (const value of ["", "abc", "żąłć", "🧠", "e\u0301", "é", "Patternly".repeat(128)]) {
    assert.equal(sha256Utf8(value), createHash("sha256").update(value, "utf8").digest("hex"));
  }
});

test("SHA preserves UTF-8 bytes across padding boundaries and deterministic Unicode inputs", () => {
  const values = ["\0", "a\0🧠e\u0301żąłć", JSON.stringify({ phase: "verified_pending_clear", records: Array(64).fill("ż🧠") })];
  for (const length of [0, 1, 55, 56, 63, 64, 65, 119, 120, 127, 128, 4096]) {
    values.push("a".repeat(length));
    if (length >= 4) values.push("🧠" + "a".repeat(length - 4));
  }
  let seed = 0x12345678;
  for (let sample = 0; sample < 128; sample += 1) {
    let value = "";
    for (let index = 0; index < sample; index += 1) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const scalar = seed % 0x110000;
      value += String.fromCodePoint(scalar >= 0xd800 && scalar <= 0xdfff ? 0xfffd : scalar);
    }
    values.push(value);
  }
  for (const value of values) {
    assert.equal(sha256Utf8(value), createHash("sha256").update(value, "utf8").digest("hex"));
  }
});

test("SHA retains current raw UTF-8 encoding of unpaired surrogates", () => {
  // This contract encodes isolated surrogate code units directly, without U+FFFD substitution.
  const vectors: [string, number[]][] = [
    ["\uD800", [0xed, 0xa0, 0x80]],
    ["\uDC00", [0xed, 0xb0, 0x80]],
    ["\uD800A", [0xed, 0xa0, 0x80, 0x41]],
    ["\uDC00\uD800", [0xed, 0xb0, 0x80, 0xed, 0xa0, 0x80]],
    ["\uD800\uD800\uDC00", [0xed, 0xa0, 0x80, 0xf0, 0x90, 0x80, 0x80]],
    ["\uD800\uDC00\uDC00", [0xf0, 0x90, 0x80, 0x80, 0xed, 0xb0, 0x80]],
    ["\uDBFF\uDFFF", [0xf4, 0x8f, 0xbf, 0xbf]],
  ];
  for (const [value, bytes] of vectors) {
    assert.equal(sha256Utf8(value), createHash("sha256").update(Buffer.from(bytes)).digest("hex"));
  }
});
