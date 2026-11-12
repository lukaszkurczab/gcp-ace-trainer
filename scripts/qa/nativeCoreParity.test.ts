import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { canonicalFingerprintPayload, canonicalJsonV1, canonicalSerialize } from "../../src/domain/identity/canonicalSerialization";
import { recordFingerprintPayload, type RecordFingerprintInput } from "../../src/domain/identity/recordFingerprint";
import { sha256Utf8 } from "../../src/domain/identity/sha256";
import { createRandom, generateFuzzCase, wtf8Bytes, type FuzzProfile } from "../../src/infrastructure/diagnostics/nativeCoreFuzz";

// Host parity of the B0 C++ core (Plan T1.1) with the TS oracle: compiles the
// core with the Apple adapters (CommonCrypto, CFStringNormalize) on macOS and
// replays the T1.0 vectors plus a deterministic fuzz. It does not exercise
// Nitro/JSI string transfer or Hermes; the perf-build diagnostic covers those.

type Frame = Readonly<{ op: "s" | "f" | "h" | "e" | "u"; profile: number; bytes: Uint8Array }>;
type Reply = Readonly<{ ok: true; value: string } | { ok: false; code: string }>;

const PROFILE_ID: Record<Exclude<FuzzProfile, "sha256Utf8">, number> = {
  canonicalSerialize: 0, canonicalFingerprintPayload: 1, recordFingerprintPayload: 2, canonicalJsonV1: 3,
};
const encoder = new TextEncoder();
const FUZZ_CASES = 10_000;

function compile(directory: string): string {
  const binary = join(directory, "patternly-core-host");
  const sources = ["native/patternly-core/test/hostCli.cpp", "native/patternly-core/cpp/PatternlyCore.cpp", "native/patternly-core/apple/PatternlyCoreApple.cpp"].map((path) => resolve(path));
  const result = spawnSync("xcrun", ["--sdk", "macosx", "clang++", "-std=c++20", "-O2", "-Wall", "-Wextra", "-Werror", "-framework", "CoreFoundation", ...sources, "-o", binary],
    { encoding: "utf8", timeout: 120_000, maxBuffer: 1024 * 1024 });
  assert.equal(result.status, 0, result.error?.message ?? result.stderr);
  return binary;
}

function run(binary: string, frames: readonly Frame[], args: readonly string[] = []): Reply[] {
  const chunks: Uint8Array[] = [];
  for (const frame of frames) {
    chunks.push(encoder.encode(`${frame.op} ${frame.profile} ${frame.bytes.length}\n`), frame.bytes);
  }
  const result = spawnSync(binary, args, { input: Buffer.concat(chunks), timeout: 120_000, maxBuffer: 512 * 1024 * 1024 });
  assert.equal(result.status, 0, String(result.stderr));
  const out = result.stdout as Buffer;
  const replies: Reply[] = [];
  let offset = 0;
  while (offset < out.length) {
    const newline = out.indexOf(0x0a, offset);
    const header = out.subarray(offset, newline).toString("latin1");
    offset = newline + 1;
    if (header.startsWith("O ")) {
      const length = Number(header.slice(2));
      replies.push({ ok: true, value: out.subarray(offset, offset + length).toString("utf8") });
      offset += length;
    } else {
      replies.push({ ok: false, code: header.slice(2) });
    }
  }
  assert.equal(replies.length, frames.length);
  return replies;
}

type Vector = Readonly<{
  id: string; profile: string; nativeApplicable: boolean;
  input: Readonly<{ json?: string; raw?: string; string?: string; repeat?: Readonly<{ unit: string; count: number }> }>;
  expect: Readonly<Record<string, unknown> & { ok: boolean; error?: Readonly<{ code: string }> }>;
}>;

test("native core reproduces every applicable T1.0 identity-parity vector", { skip: process.platform !== "darwin" }, () => {
  const file = JSON.parse(readFileSync(resolve("integration/contracts/identity-parity/vectors.v1.json"), "utf8")) as { vectors: Vector[] };
  const vectors = file.vectors.filter((vector) => vector.nativeApplicable);
  assert.ok(vectors.length >= 500);
  const directory = mkdtempSync(join(tmpdir(), "patternly-core-parity-"));
  try {
    const binary = compile(directory);
    const frames: Frame[] = [];
    const checks: ((reply: Reply) => void)[] = [];
    for (const vector of vectors) {
      const expect = vector.expect;
      const fail = (reply: Reply) => `${vector.id}: ${JSON.stringify(reply).slice(0, 400)}`;
      if (vector.profile === "sha256Utf8") {
        const value = vector.input.repeat ? vector.input.repeat.unit.repeat(vector.input.repeat.count) : vector.input.string!;
        frames.push({ op: "h", profile: 0, bytes: wtf8Bytes(value) });
        checks.push((reply) => assert.ok(reply.ok && reply.value === expect.sha256, fail(reply)));
      } else if (vector.profile === "envelope") {
        frames.push({ op: "e", profile: 0, bytes: wtf8Bytes(vector.input.raw!) });
        checks.push((reply) => assert.ok(expect.ok ? reply.ok : !reply.ok && reply.code === expect.error!.code, fail(reply)));
      } else {
        const profile = PROFILE_ID[vector.profile as keyof typeof PROFILE_ID];
        assert.notEqual(profile, undefined, vector.id);
        const bytes = wtf8Bytes(vector.input.json!);
        const output = vector.profile === "recordFingerprintPayload" ? expect.payload : expect.output;
        frames.push({ op: "s", profile, bytes });
        checks.push((reply) => assert.ok(expect.ok ? reply.ok && reply.value === output : !reply.ok && reply.code === expect.error!.code, fail(reply)));
        if (expect.ok && (expect.sha256 || expect.fingerprint)) {
          frames.push({ op: "f", profile, bytes });
          checks.push((reply) => assert.ok(reply.ok && reply.value === (expect.sha256 ?? expect.fingerprint), fail(reply)));
        }
      }
    }
    const replies = run(binary, frames);
    replies.forEach((reply, index) => checks[index]!(reply));
    // Portable SHA-256 (Android/default adapter) on the same SHA vectors.
    const shaIndexes = frames.flatMap((frame, index) => frame.op === "h" ? [index] : []);
    const portable = run(binary, shaIndexes.map((index) => frames[index]!), ["--portable"]);
    portable.forEach((reply, position) => checks[shaIndexes[position]!]!(reply));
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

function utf16le(value: string): Uint8Array {
  const bytes = new Uint8Array(value.length * 2);
  for (let index = 0; index < value.length; index++) { const unit = value.charCodeAt(index); bytes[index * 2] = unit & 255; bytes[index * 2 + 1] = unit >>> 8; }
  return bytes;
}

test("UTF-16 digest path (the in-app Nitro path) keeps pairs and unpaired surrogates across chunk boundaries", { skip: process.platform !== "darwin" }, () => {
  const directory = mkdtempSync(join(tmpdir(), "patternly-core-utf16-"));
  try {
    const binary = compile(directory);
    const tails = ["\ud83d\ude00", "\ud800", "\udc00", "\ud800\ud800\udc00", "\ud83dx", "ł中", ""];
    const values: string[] = [];
    // Around the 16384-unit internal chunk and around caller chunk sizes 1, 3, 7.
    for (const prefix of [0, 1, 2, 16382, 16383, 16384, 32767]) for (const tail of tails) values.push("a".repeat(prefix) + tail + tail + "z");
    const random = createRandom(9);
    for (let index = 0; index < 200; index++) values.push(generateFuzzCase(random).value === undefined ? "" : JSON.stringify(generateFuzzCase(random).value) + "\ud800");
    const frames: Frame[] = [];
    for (const value of values) for (const chunk of [0, 1, 3, 7, 16384]) frames.push({ op: "u", profile: chunk, bytes: utf16le(value) });
    const replies = run(binary, frames);
    replies.forEach((reply, index) => {
      const value = values[Math.floor(index / 5)]!;
      assert.ok(reply.ok && reply.value === sha256Utf8(value), `utf16 #${index}`);
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

function oracle(profile: FuzzProfile, value: unknown): Reply {
  try {
    switch (profile) {
      case "canonicalSerialize": return { ok: true, value: canonicalSerialize(value) };
      case "canonicalFingerprintPayload": return { ok: true, value: canonicalFingerprintPayload(value) };
      case "recordFingerprintPayload": return { ok: true, value: recordFingerprintPayload(value as RecordFingerprintInput) };
      case "canonicalJsonV1": return { ok: true, value: canonicalJsonV1(value) };
      case "sha256Utf8": return { ok: true, value: sha256Utf8(value as string) };
    }
  } catch (error) {
    return { ok: false, code: error instanceof Error ? error.message : String(error) };
  }
}

// CoreFoundation and ICU (Node) disagree on canonical ordering of some combining
// sequences (e.g. U+0F71 U+0F72 next to U+0323 U+0307). The app therefore enables
// native NFC only when it matches Hermes' own `normalize` on such probes
// (installNativeCore.ts). Here the strict run disables native NFC: inputs that
// need normalization must report `nfc_unavailable` (TS fallback), everything
// else must be byte-identical. The CoreFoundation run is reported, not asserted.
test(`native core matches the TS oracle on ${FUZZ_CASES} random structures`, { skip: process.platform !== "darwin" }, (context) => {
  const directory = mkdtempSync(join(tmpdir(), "patternly-core-fuzz-"));
  try {
    const binary = compile(directory);
    const random = createRandom(0x7111);
    const cases = Array.from({ length: FUZZ_CASES }, () => generateFuzzCase(random));
    const frames: Frame[] = cases.map(({ profile, value }) => profile === "sha256Utf8"
      ? { op: "h", profile: 0, bytes: wtf8Bytes(value as string) }
      : { op: "s", profile: PROFILE_ID[profile], bytes: wtf8Bytes(JSON.stringify(value)) });
    const expectations = cases.map(({ profile, value }) => oracle(profile, value));
    const withCoreFoundation = run(binary, frames);
    const cfDivergent = withCoreFoundation.filter((reply, index) => {
      const expected = expectations[index]!;
      return expected.ok ? !(reply.ok && reply.value === expected.value) : reply.ok;
    }).length;
    const replies = run(binary, frames, ["--no-nfc"]);
    let mismatches = 0;
    let fallbacks = 0;
    const examples: string[] = [];
    replies.forEach((reply, index) => {
      const { profile, value } = cases[index]!;
      const expected = expectations[index]!;
      if (!reply.ok && reply.code === "nfc_unavailable") { fallbacks++; return; }
      const same = expected.ok ? reply.ok && reply.value === expected.value : !reply.ok;
      if (!same) {
        mismatches++;
        if (examples.length < 5) examples.push(`${profile} ${JSON.stringify(value).slice(0, 200)} → oracle ${JSON.stringify(expected).slice(0, 200)} native ${JSON.stringify(reply).slice(0, 200)}`);
      }
    });
    context.diagnostic(`strict: ${mismatches} mismatches, ${fallbacks} NFC fallbacks; CoreFoundation NFC vs ICU oracle: ${cfDivergent} divergent`);
    assert.equal(mismatches, 0, examples.join("\n"));
    assert.ok(fallbacks < FUZZ_CASES / 4, `too many NFC fallbacks: ${fallbacks}`);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
