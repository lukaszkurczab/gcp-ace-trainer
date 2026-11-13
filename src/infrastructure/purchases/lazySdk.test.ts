import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);

// T1.6: the RevenueCat bridge and native module load on first SDK use, never on the startup subscription.
test("RevenueCat SDK loads lazily and attaches listeners subscribed before the first SDK call", async () => {
  const events: string[] = [];
  const listeners = new Map<string, (value: unknown) => void>();
  let configured = false;
  const native = {
    setLogHandler() { events.push("handler"); },
    async isConfigured() { events.push("isConfigured"); return configured; },
    setupPurchases() { events.push("configure"); configured = true; },
    async getAppUserID() { return "account-A"; },
  };
  const sdkModule = { exports: {} as Record<string, unknown> };
  vm.runInNewContext(readFileSync(require.resolve("react-native-purchases/dist/purchases.js"), "utf8"), {
    module: sdkModule, exports: sdkModule.exports, console: { debug() {}, info() {}, warn() {}, error() {}, log() {} },
    require: (name: string) => {
      if (name === "react-native") return { NativeModules: { RNPurchases: native }, Platform: { OS: "ios" }, NativeEventEmitter: class {
        addListener(eventName: string, callback: (value: unknown) => void) { listeners.set(eventName, callback); }
      } };
      if (name === "./utils/environment") return { shouldUseBrowserMode: () => false };
      if (name === "./browser/nativeModule") return {};
      return require(name);
    },
  });
  let sdkRequires = 0;
  const appModule = { exports: {} as typeof import("./index") };
  const compiled = ts.transpileModule(readFileSync(new URL("./index.ts", import.meta.url), "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(compiled, {
    module: appModule, exports: appModule.exports, console,
    require: (name: string) => { if (name === "react-native-purchases") { sdkRequires += 1; return sdkModule.exports; } return { legalVariables: {} }; },
  });
  const gateway = appModule.exports.createRevenueCatGateway();
  let early = 0, removed = 0;
  const unsubscribeEarly = gateway.subscribe!(() => { early += 1; });
  const unsubscribeRemoved = gateway.subscribe!(() => { removed += 1; });
  unsubscribeRemoved();
  assert.equal(sdkRequires, 0, "subscribing on the startup path must not load the SDK");
  assert.equal(appModule.exports.isRevenueCatSdkLoaded(), false);
  assert.deepEqual(events, []);

  await gateway.configure({ apiKey: "appl_fixture", appUserID: "account-A" });
  assert.equal(sdkRequires, 1);
  assert.deepEqual(events.slice(0, 3), ["handler", "isConfigured", "configure"]);
  listeners.get("Purchases-CustomerInfoUpdated")?.({ activeSubscriptions: [] });
  assert.equal(early, 1, "a listener subscribed before the SDK loaded is attached on load");
  assert.equal(removed, 0, "an unsubscribed pending listener is never attached");

  let late = 0;
  const unsubscribeLate = gateway.subscribe!(() => { late += 1; });
  listeners.get("Purchases-CustomerInfoUpdated")?.({ activeSubscriptions: [] });
  assert.equal(early, 2);
  assert.equal(late, 1);
  unsubscribeEarly();
  unsubscribeLate();
  listeners.get("Purchases-CustomerInfoUpdated")?.({ activeSubscriptions: [] });
  assert.equal(early, 2);
  assert.equal(late, 1);
  await gateway.isConfigured();
  assert.equal(sdkRequires, 1, "the SDK bridge is required once");
  assert.equal(events.filter((event) => event === "handler").length, 1);
});
