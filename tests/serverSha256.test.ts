import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { Sha256Accumulator, type Sha256State } from "../server/src/sha256.js";

const nodeDigest = (bytes: Uint8Array): string => createHash("sha256").update(bytes).digest("hex");
const bytes = (length: number): Uint8Array => Uint8Array.from(
  { length },
  (_, index) => (index * 131 + length * 17) & 0xff,
);

test("matches node:crypto for UTF-8, binary, padding boundaries and multiple blocks", () => {
  for (const text of ["", "Patternly", "zażółć gęślą jaźń", "🙂".repeat(80)]) {
    const encoded = new TextEncoder().encode(text);
    assert.equal(Sha256Accumulator.create().update(encoded).digestHex(), nodeDigest(encoded), text);
  }
  for (const length of [0, 1, 2, 3, 54, 55, 56, 57, 62, 63, 64, 65, 127, 128, 129, 1_024, 4_097]) {
    const input = bytes(length);
    assert.equal(Sha256Accumulator.create().update(input).digestHex(), nodeDigest(input), String(length));
  }
});

test("is split-independent and survives serialized restore at every boundary", () => {
  const input = bytes(257);
  const expected = nodeDigest(input);
  for (let split = 0; split <= input.length; split += 1) {
    const accumulator = Sha256Accumulator.create().update(input.subarray(0, split));
    const serialized = JSON.parse(JSON.stringify(accumulator.exportState())) as unknown;
    const restored = Sha256Accumulator.restore(serialized).update(input.subarray(split));
    assert.equal(restored.digestHex(), expected, String(split));
  }

  const paged = Sha256Accumulator.create();
  let offset = 0;
  for (const size of [1, 54, 1, 7, 64, 3, 63, 64]) {
    paged.update(input.subarray(offset, offset + size));
    offset += size;
  }
  paged.update(input.subarray(offset));
  assert.equal(paged.digestHex(), expected);
});

test("exports the exact state and digest remains non-mutating, repeatable and appendable", () => {
  const accumulator = Sha256Accumulator.create().update(bytes(70));
  const state = accumulator.exportState();
  assert.deepEqual(Object.keys(state).sort(), ["algorithm", "tailHex", "totalBytes", "version", "words"]);
  assert.equal(state.version, 1);
  assert.equal(state.algorithm, "sha256");
  assert.equal(state.words.length, 8);
  assert.ok(state.words.every((word) => Number.isInteger(word) && word >= 0 && word <= 0xffff_ffff));
  assert.equal(state.totalBytes, "70");
  assert.equal(state.tailHex.length, 12);

  const before = structuredClone(state);
  const first = accumulator.digestHex();
  const second = accumulator.digestHex();
  assert.equal(first, second);
  assert.deepEqual(accumulator.exportState(), before);

  const suffix = bytes(91);
  accumulator.update(suffix);
  const combined = new Uint8Array(161);
  combined.set(bytes(70));
  combined.set(suffix, 70);
  assert.equal(accumulator.digestHex(), nodeDigest(combined));

  const exactBlock = Sha256Accumulator.create().update(bytes(64)).exportState();
  assert.equal(exactBlock.totalBytes, "64");
  assert.equal(exactBlock.tailHex, "");
  assert.equal(Sha256Accumulator.restore(exactBlock).update(bytes(1)).digestHex(), nodeDigest(Uint8Array.from([...bytes(64), ...bytes(1)])));
});

test("strictly rejects malformed, extra, unsafe and non-aligned serialized states", () => {
  const valid = Sha256Accumulator.create().update(bytes(65)).exportState();
  const invalid: readonly unknown[] = [
    null,
    [],
    { ...valid, extra: true },
    { ...valid, version: 2 },
    { ...valid, algorithm: "sha-256" },
    { ...valid, words: valid.words.slice(0, 7) },
    { ...valid, words: [...valid.words, 0] },
    { ...valid, words: [-1, ...valid.words.slice(1)] },
    { ...valid, words: [0x1_0000_0000, ...valid.words.slice(1)] },
    { ...valid, words: [0.5, ...valid.words.slice(1)] },
    { ...valid, totalBytes: "" },
    { ...valid, totalBytes: "00" },
    { ...valid, totalBytes: "01" },
    { ...valid, totalBytes: "-1" },
    { ...valid, totalBytes: "2305843009213693952", tailHex: "" },
    { ...valid, totalBytes: "65", tailHex: "" },
    { ...valid, totalBytes: "64", tailHex: "00" },
    { ...valid, totalBytes: "0", tailHex: "00" },
    { ...valid, tailHex: "0" },
    { ...valid, tailHex: "AA" },
    { ...valid, tailHex: "gg" },
    { ...valid, tailHex: "00".repeat(64), totalBytes: "64" },
  ];
  for (const [index, state] of invalid.entries()) {
    assert.throws(() => Sha256Accumulator.restore(state), /invalid_sha256_state/u, String(index));
  }

  const arrayWithExtraKey = [...valid.words] as number[] & { extra?: boolean };
  arrayWithExtraKey.extra = true;
  assert.throws(() => Sha256Accumulator.restore({ ...valid, words: arrayWithExtraKey }), /invalid_sha256_state/u);
  assert.throws(
    () => Sha256Accumulator.create().update("not bytes" as unknown as Uint8Array),
    /invalid_sha256_input/u,
  );
});

test("enforces the total-byte ceiling before mutation", () => {
  const state: Sha256State = {
    version: 1,
    algorithm: "sha256",
    words: Sha256Accumulator.create().exportState().words,
    totalBytes: ((1n << 61n) - 64n).toString(10),
    tailHex: "",
  };
  const accumulator = Sha256Accumulator.restore(state).update(bytes(63));
  const before = accumulator.exportState();
  assert.equal(before.totalBytes, ((1n << 61n) - 1n).toString(10));
  assert.throws(() => accumulator.update(bytes(1)), /sha256_input_too_large/u);
  assert.deepEqual(accumulator.exportState(), before);
});
