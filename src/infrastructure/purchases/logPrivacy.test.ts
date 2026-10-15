import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);

test("pinned SDK forwards sensitive callbacks only to the app category handler, installed before all setup branches", async () => {
  const events: string[] = [], output: unknown[][] = [];
  const listeners = new Map<string, (value: unknown) => void>();
  const sensitive = "transaction=SYNTHETIC-T customer=SYNTHETIC-C raw-error=SYNTHETIC-E credential=SYNTHETIC-K";
  let configured = false, account = "account-A";
  const emit = (logLevel: string) => listeners.get("Purchases-LogHandlerEvent")?.({ logLevel, message: sensitive });
  const native = {
    setLogHandler() { events.push("handler"); },
    async isConfigured() { events.push("isConfigured"); emit("WARN"); return configured; },
    setupPurchases() { events.push("configure"); emit("INFO"); configured = true; },
    async getAppUserID() { events.push("getAppUserID"); return account; },
    async logIn(id: string) { events.push("logIn"); emit("ERROR"); account = id; },
  };
  const safeConsole = Object.fromEntries(["debug", "info", "warn", "error", "log"].map((key) => [key, (...args: unknown[]) => output.push(args)]));
  const sdkModule = { exports: {} as Record<string, unknown> };
  // Execute the actual pinned JS bridge, mocking only the native boundary. No SDK network/store effects.
  vm.runInNewContext(readFileSync(require.resolve("react-native-purchases/dist/purchases.js"), "utf8"), {
    module: sdkModule, exports: sdkModule.exports, console: safeConsole,
    require: (name: string) => {
      if (name === "react-native") return { NativeModules: { RNPurchases: native }, Platform: { OS: "ios" }, NativeEventEmitter: class {
        addListener(name: string, callback: (value: unknown) => void) { listeners.set(name, callback); }
      } };
      if (name === "./utils/environment") return { shouldUseBrowserMode: () => false };
      if (name === "./browser/nativeModule") return {};
      return require(name);
    },
  });
  const appModule = { exports: {} as typeof import("./index") };
  const compiled = ts.transpileModule(readFileSync(new URL("./index.ts", import.meta.url), "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(compiled, {
    module: appModule, exports: appModule.exports, console: safeConsole,
    require: (name: string) => name === "react-native-purchases" ? sdkModule.exports : { legalVariables: {} },
  });
  assert.equal(appModule.exports.readRevenueCatLogCategory(), null);
  const gateway = appModule.exports.createRevenueCatGateway();
  assert.equal(appModule.exports.createRevenueCatGateway(), gateway);
  await gateway.configure({ apiKey: "appl_fixture", appUserID: "account-A" });
  await gateway.configure({ apiKey: "appl_fixture", appUserID: "account-A" });
  await gateway.configure({ apiKey: "appl_fixture", appUserID: "account-B" });
  assert.equal(events[0], "handler");
  assert.equal(events.filter((event) => event === "handler").length, 1);
  assert.equal(events.filter((event) => event === "configure").length, 1);
  assert.equal(events.filter((event) => event === "getAppUserID").length, 2);
  assert.equal(events.filter((event) => event === "logIn").length, 1);
  for (const [level, category] of [["DEBUG", "debug"], ["INFO", "info"], ["WARN", "warning"], ["ERROR", "error"], [sensitive, "unknown"]]) {
    emit(level!);
    assert.equal(appModule.exports.readRevenueCatLogCategory(), category);
  }
  assert.deepEqual(output, [], "no raw SDK text reaches any console sink at any level");
  assert.equal(JSON.stringify(appModule.exports.readRevenueCatLogCategory()).includes("SYNTHETIC"), false);
});
