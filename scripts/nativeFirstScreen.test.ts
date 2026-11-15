import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const firstScreen = require("../plugins/withNativeFirstScreen.js") as {
  readFirstScreenFlag: (environment: Record<string, string | undefined>) => boolean;
  readRnStartMode: (environment: Record<string, string | undefined>) => string | null;
  injectNativeFirstScreen: (source: string) => string;
};
const deferred = require("../plugins/withDeferredNativeStartup.js") as { transformAppDelegate: (source: string) => string };
const privacy = require("../plugins/withPrivacyBoundary.js") as { injectIosBackupPolicy: (source: string) => string };

// Same Expo SDK 57 Swift template as scripts/deferredNativeStartup.test.ts.
const GENERATED = `internal import Expo
import FirebaseCore
import React
import ReactAppDependencyProvider

@main
class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
// @generated begin @react-native-firebase/app-check - expo prebuild (DO NOT MODIFY) sync-cf2eb2cc4ab0c44de03d7c0dddc7165fa89d986f
RNFBAppCheckModule.sharedInstance()
    FirebaseApp.configure()
// @generated end @react-native-firebase/app-check
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  // Linking API
  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return super.application(app, open: url, options: options) || RCTLinkingManager.application(app, open: url, options: options)
  }
}
`;

function assertInOrder(source: string, ...needles: string[]): void {
  let previous = -1;
  for (const needle of needles) {
    const at = source.indexOf(needle);
    assert.ok(at >= 0, `missing ${needle}`);
    assert.ok(at > previous, `${needle} is out of order`);
    previous = at;
  }
}

const all = [
  ["first screen last", (source: string) => firstScreen.injectNativeFirstScreen(deferred.transformAppDelegate(privacy.injectIosBackupPolicy(source)))],
  ["first screen first", (source: string) => privacy.injectIosBackupPolicy(deferred.transformAppDelegate(firstScreen.injectNativeFirstScreen(source)))],
  ["first screen between", (source: string) => privacy.injectIosBackupPolicy(firstScreen.injectNativeFirstScreen(deferred.transformAppDelegate(source)))],
] as const;

test("React Native and the deferred Firebase start move into the closure handed to the first screen, in any plugin order", () => {
  const outputs = all.map(([, run]) => run(GENERATED));
  for (const [index, next] of outputs.entries()) {
    const label = all[index]![0];
    assertInOrder(next, "import ReactAppDependencyProvider\nimport PatternlyFirstScreen\n", "// @patternly-native-first-screen-begin",
      "let patternlyStartReactNative = { [self] in", "factory.startReactNative(", "// @patternly-deferred-native-startup-begin",
      "RNFBAppCheckModule.sharedInstance()", "FirebaseApp.configure()", "// @patternly-deferred-native-startup-end",
      "PatternlyFirstScreenStartup.begin(", "startReactNative: patternlyStartReactNative)", "// @patternly-native-first-screen-end",
      "PatternlyNativeStartupTrace.mark(\"native:launch_end\")");
    assert.equal(next.split("factory.startReactNative(").length, 2, label);
    assert.equal(next.split("FirebaseApp.configure()").length, 2, label);
    assert.equal(next.split("import PatternlyFirstScreen\n").length, 2, label);
    // Every plugin stays idempotent on a non-clean prebuild.
    assert.equal(firstScreen.injectNativeFirstScreen(next), next, label);
    assert.equal(deferred.transformAppDelegate(next), next, label);
    assert.equal(privacy.injectIosBackupPolicy(next), next, label);
  }
  // The closure's braces balance: nothing of didFinishLaunching leaks into or out of it.
  for (const next of outputs) {
    const body = next.slice(next.indexOf("let patternlyStartReactNative"), next.indexOf("PatternlyFirstScreenStartup.begin("));
    assert.equal(body.split("{").length, body.split("}").length);
  }
});

test("a missing or duplicated startReactNative anchor is rejected", () => {
  assert.throws(() => firstScreen.injectNativeFirstScreen(GENERATED.replace("factory.startReactNative(", "factory.start(")), /startReactNative anchor/u);
  const twice = GENERATED.replace("#endif", "    factory.startReactNative(\n      withModuleName: \"main\",\n      in: window,\n      launchOptions: launchOptions)\n#endif");
  assert.throws(() => firstScreen.injectNativeFirstScreen(twice), /exactly once/u);
});

test("kill switch and React Native start mode accept only known values", () => {
  assert.equal(firstScreen.readFirstScreenFlag({}), true);
  assert.equal(firstScreen.readFirstScreenFlag({ PATTERNLY_NATIVE_FIRST_SCREEN: "1" }), true);
  assert.equal(firstScreen.readFirstScreenFlag({ PATTERNLY_NATIVE_FIRST_SCREEN: "0" }), false);
  assert.throws(() => firstScreen.readFirstScreenFlag({ PATTERNLY_NATIVE_FIRST_SCREEN: "off" }), /must be 0 or 1/u);
  assert.equal(firstScreen.readRnStartMode({}), null);
  assert.equal(firstScreen.readRnStartMode({ PATTERNLY_FIRST_SCREEN_RN_START: "after_first_frame" }), null);
  assert.equal(firstScreen.readRnStartMode({ PATTERNLY_FIRST_SCREEN_RN_START: "immediate" }), "immediate");
  assert.throws(() => firstScreen.readRnStartMode({ PATTERNLY_FIRST_SCREEN_RN_START: "lazy" }), /after_first_frame or immediate/u);
});

test("app config links the pod and registers the plugin with the native trace plugin", () => {
  const { createExpoConfig } = require("../app.config.js") as { createExpoConfig: (environment: Record<string, string>) => { expo: { plugins: unknown[] } } };
  const expo = createExpoConfig({
    EXPO_PUBLIC_PATTERNLY_FIREBASE_PROJECT_ID: "demo-patternly-eas-config",
    EXPO_PUBLIC_PATTERNLY_FIREBASE_APP_ID: "1:1:ios:eas-config",
    EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_DOMAIN: "demo-patternly-eas-config.firebaseapp.com",
    EXPO_PUBLIC_PATTERNLY_APPCHECK_ANDROID_PROVIDER: "debug", EXPO_PUBLIC_PATTERNLY_APPCHECK_APPLE_PROVIDER: "debug",
    EXPO_PUBLIC_PATTERNLY_BACKEND_E2E: "true", EXPO_PUBLIC_PATTERNLY_API_ORIGIN: "http://127.0.0.1:8080",
    EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_EMULATOR_ORIGIN: "http://127.0.0.1:19099",
    PATTERNLY_RUNTIME_MODE: "smoke", EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: "smoke",
  }).expo;
  const plugins = expo.plugins.map((entry) => String(Array.isArray(entry) ? entry[0] : entry));
  assert.ok(plugins.includes("./plugins/withNativeFirstScreen"));
  assert.ok(plugins.includes("./plugins/withDeferredNativeStartup"));
  const build = expo.plugins.find((entry) => Array.isArray(entry) && entry[0] === "expo-build-properties") as [string, { ios: { extraPods: { name: string; path?: string }[] } }];
  assert.deepEqual(build[1].ios.extraPods.find((pod) => pod.name === "PatternlyFirstScreen"), { name: "PatternlyFirstScreen", path: "../native/first-screen" });
});
