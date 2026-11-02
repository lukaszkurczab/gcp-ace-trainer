import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { sha256Utf8, installSha256Accelerator } from "./sha256";
import { sha256Utf8 as reference } from "../../domain/identity/sha256";

afterEach(() => { installSha256Accelerator(null); });
const standard = (value: string) => createHash("sha256").update(value, "utf8").digest("hex");

test("platform-neutral SHA-256 matches standard UTF-8 vectors", () => {
  assert.equal(sha256Utf8("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  assert.equal(sha256Utf8("żąłć"), "bb2089cd1a6c2f327d82f433a6c199ffb023efc38a3e10ea6a3b09d7ae7c1f9c");
});

test("record-sized acceleration preserves standard, combining, astral and JSON payload bytes", () => {
  const calls: string[] = [];
  assert.equal(installSha256Accelerator(value => { calls.push(value); return standard(value); }), true);
  calls.length = 0;
  for (const value of ["a".repeat(1024), "ż🧠e\u0301é".repeat(256), JSON.stringify({ records: Array(512).fill("żółć\0") })]) assert.equal(sha256Utf8(value), reference(value));
  assert.equal(calls.length, 3);
  calls.length = 0;
  assert.equal(sha256Utf8("a".repeat(1023)), reference("a".repeat(1023)));
  assert.equal(sha256Utf8("session-id"), reference("session-id"));
  assert.equal(calls.length, 0, "small IDs avoid native call overhead");
});

test("isolated UTF-16 surrogates always keep the reference byte contract", () => {
  let calls = 0;
  assert.equal(installSha256Accelerator(value => { calls++; return standard(value); }), true);
  calls = 0;
  for (const suffix of ["\uD800", "\uDC00", "\uD800A", "\uDC00\uD800", "\uD800\uD800\uDC00", "\uD800\uDC00\uDC00"]) {
    const value = "a".repeat(1024) + suffix;
    assert.equal(sha256Utf8(value), reference(value));
  }
  assert.equal(calls, 0);
});

test("bad native self-tests, thrown calls and malformed digests recompute safely and disable acceleration", () => {
  assert.equal(installSha256Accelerator(() => "0".repeat(64)), false);
  assert.equal(sha256Utf8("a".repeat(2048)), reference("a".repeat(2048)));
  for (const failure of ["throw", "malformed"] as const) {
    let fail = false, calls = 0;
    assert.equal(installSha256Accelerator(value => {
      calls++; if (fail) { if (failure === "throw") throw Error("Native unavailable"); return "not-a-digest"; }
      return standard(value);
    }), true);
    fail = true; calls = 0;
    assert.equal(sha256Utf8("b".repeat(2048)), reference("b".repeat(2048)));
    assert.equal(sha256Utf8("c".repeat(2048)), reference("c".repeat(2048)));
    assert.equal(calls, 1, "failure disables further native calls without retaining raw values");
  }
});

test("iOS/Android initializer uses the optional native capability; web and missing APIs keep the reference", () => {
  const code = ts.transpileModule(readFileSync(new URL("./installNativeSha256.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  for (const platform of ["ios", "android", "web"]) for (const available of [true, false]) {
    installSha256Accelerator(null);
    let moduleRequests = 0, nativeCalls = 0;
    const crypto = { digestString: (algorithm: string, value: string, options: { encoding: string }) => {
      assert.equal(algorithm, "SHA-256"); assert.equal(options.encoding, "hex"); nativeCalls++; return standard(value);
    } };
    const module = { exports: {} };
    vm.runInNewContext(code, { module, exports: module.exports, require: (name: string) => {
      if (name === "react-native") return { Platform: { OS: platform } };
      if (name === "expo-modules-core") return { requireOptionalNativeModule: (moduleName: string) => { assert.equal(moduleName, "ExpoCrypto"); moduleRequests++; return available ? crypto : null; } };
      if (name === "./sha256") return { installSha256Accelerator };
      throw Error("Unexpected initializer dependency");
    } });
    nativeCalls = 0;
    assert.equal(sha256Utf8("x".repeat(4096)), reference("x".repeat(4096)));
    assert.equal(moduleRequests, platform === "web" ? 0 : 1);
    assert.equal(nativeCalls, platform !== "web" && available ? 1 : 0);
  }
});
