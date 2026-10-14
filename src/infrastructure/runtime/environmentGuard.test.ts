import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { createEnvironmentGuard, EnvironmentGuardError, ENVIRONMENT_FINGERPRINT_KEY, ENVIRONMENT_KEYCHAIN_SERVICE, type EnvironmentMarkerStore } from "./environmentGuard";

const a = "a".repeat(64), b = "b".repeat(64);
const marker = (fingerprint: string) => JSON.stringify({ version: 1, fingerprint });

test("A→B→A: B cannot enroll over A or enter data consumers; A's sentinel categories remain intact", async () => {
  const data = new Map(["learning", "settings", "auth", "vault", "registry", "packages", "purchases"].map((key) => [key, `A-${key}`]));
  const before = [...data];
  let raw: string | null = null, writes = 0, dataReads = 0, sends = 0;
  const store: EnvironmentMarkerStore = { get: async () => raw, set: async (value) => { writes++; raw = value; } };
  const guardA = createEnvironmentGuard(store, a);
  assert.equal(await guardA.inspect(), "unassigned");
  assert.equal(writes, 0);
  assert.equal(await guardA.assign(), "ready");
  const guardB = createEnvironmentGuard(store, b);
  if (await guardB.inspect() === "ready") { dataReads++; sends++; data.get("auth"); }
  assert.equal(await guardB.inspect(), "mismatch");
  assert.equal(await guardB.assign(), "mismatch");
  assert.equal(writes, 1);
  assert.equal(dataReads, 0); assert.equal(sends, 0);
  assert.equal(await createEnvironmentGuard(store, a).inspect(), "ready");
  assert.deepEqual([...data], before);
  assert.equal(raw, marker(a));
});

test("missing, corrupt, unavailable and uncertain marker writes never imply readiness", async () => {
  for (const raw of ["", "invalid", "null", '{"version":2}', JSON.stringify({ version: 1, fingerprint: a, extra: true })]) {
    let writes = 0;
    const guard = createEnvironmentGuard({ get: async () => raw, set: async () => { writes++; } }, a);
    await assert.rejects(guard.inspect, (e: unknown) => e instanceof EnvironmentGuardError && e.code === "environment_marker_corrupt");
    await assert.rejects(guard.assign);
    assert.equal(writes, 0);
  }
  await assert.rejects(createEnvironmentGuard({ get: async () => { throw Error("private-store-detail"); }, set: async () => {} }, a).inspect, /environment_marker_unavailable/);
  for (const outcome of ["no-op", "throw", "write-then-throw", "different-readback"] as const) {
    let raw: string | null = null;
    const guard = createEnvironmentGuard({ get: async () => raw, set: async (value) => {
      if (outcome === "write-then-throw") raw = value;
      if (outcome === "throw" || outcome === "write-then-throw") throw Error("private-detail");
      if (outcome === "different-readback") raw = marker(b);
    } }, a);
    await assert.rejects(guard.assign, /environment_marker_write_unconfirmed/);
    assert.equal(await guard.inspect(), outcome === "write-then-throw" ? "ready" : outcome === "different-readback" ? "mismatch" : "unassigned");
  }
});

test("repeated assignment shares one checked write and never rewrites an assigned marker", async () => {
  let raw: string | null = null, writes = 0;
  const guard = createEnvironmentGuard({ get: async () => raw, set: async (value) => { writes++; raw = value; } }, a);
  assert.deepEqual(await Promise.all([guard.assign(), guard.assign()]), ["ready", "ready"]);
  assert.equal(await guard.assign(), "ready");
  assert.equal(writes, 1);
});

test("native marker port uses one device-only service for both read and verified write; no delete API", async () => {
  const operations: unknown[][] = [];
  const source = readFileSync(new URL("./environmentGuard.ts", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  const require = (name: string) => name === "react-native" ? { Platform: { OS: "ios" } } : name === "expo-secure-store" ? {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 6,
    getItemAsync: async (...args: unknown[]) => { operations.push(["get", ...args]); return null; },
    setItemAsync: async (...args: unknown[]) => { operations.push(["set", ...args]); },
  } : assert.fail(name);
  vm.runInNewContext(compiled, { module, exports: module.exports, require });
  const api = module.exports as typeof import("./environmentGuard");
  const store = api.createNativeEnvironmentMarkerStore();
  await store.get(); await store.set(marker(a));
  assert.deepEqual(JSON.parse(JSON.stringify(operations)), [
    ["get", ENVIRONMENT_FINGERPRINT_KEY, { keychainService: ENVIRONMENT_KEYCHAIN_SERVICE, keychainAccessible: 6 }],
    ["set", ENVIRONMENT_FINGERPRINT_KEY, marker(a), { keychainService: ENVIRONMENT_KEYCHAIN_SERVICE, keychainAccessible: 6 }],
  ]);
  assert.equal("delete" in store, false);
});
