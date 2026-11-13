import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const plugin = require("../plugins/withDeferredNativeStartup.js") as {
  readDeferFlag: (environment: Record<string, string | undefined>) => boolean;
  transformAppDelegate: (source: string, options?: { defer?: boolean }) => string;
  deferFirebaseStartup: (source: string) => string;
};
const privacy = require("../plugins/withPrivacyBoundary.js") as { injectIosBackupPolicy: (source: string) => string };

// Shape of the Expo SDK 57 Swift template after the @react-native-firebase/app-check dangerous mod.
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

test("Firebase and App Check move behind startReactNative onto the next main-queue turn, in factory order", () => {
  const next = plugin.transformAppDelegate(GENERATED);
  assertInOrder(next, "factory.startReactNative(", "DispatchQueue.main.async { [self] in",
    "RNFBAppCheckModule.sharedInstance()", "FirebaseApp.configure()", "PatternlyNativeStartupTrace.mark(\"native:launch_end\")");
  assert.equal(next.split("RNFBAppCheckModule.sharedInstance()").length, 2);
  assert.equal(next.split("FirebaseApp.configure()").length, 2);
  assert.match(next, /PatternlyNativeStartupTrace\.mark\("native:factory_begin"\)\n    let delegate/u);
  assert.match(next, /let launched = super\.application\(application, didFinishLaunchingWithOptions: launchOptions\)\n    PatternlyNativeStartupTrace\.mark\("native:launch_end"\)/u);
  assert.match(next, /Bundle\.main\.object\(forInfoDictionaryKey: "PatternlyPerfNativeTrace"\) as\? Bool == true/u);
  assert.equal(plugin.transformAppDelegate(next), next, "idempotent on a non-clean prebuild");
});

test("the ACM fixture Firebase guard moves with the block whichever plugin runs first", () => {
  const privacyFirst = plugin.transformAppDelegate(privacy.injectIosBackupPolicy(GENERATED));
  const deferFirst = privacy.injectIosBackupPolicy(plugin.transformAppDelegate(GENERATED));
  for (const next of [privacyFirst, deferFirst]) {
    assertInOrder(next, "factory.startReactNative(", "DispatchQueue.main.async",
      "if !patternlyACMFixtureMarkerPresent() {", "RNFBAppCheckModule.sharedInstance()", "// @patternly-acm-native-firebase-guard-end", "// @patternly-deferred-native-startup-end");
    assert.equal(privacy.injectIosBackupPolicy(next), next);
    assert.equal(plugin.transformAppDelegate(next), next);
  }
});

test("kill switch keeps the generated Firebase order; only 0 and 1 are accepted", () => {
  const next = plugin.transformAppDelegate(GENERATED, { defer: false });
  assertInOrder(next, "RNFBAppCheckModule.sharedInstance()", "factory.startReactNative(");
  assert.ok(!next.includes("DispatchQueue.main.async"));
  assert.equal(plugin.readDeferFlag({}), true);
  assert.equal(plugin.readDeferFlag({ PATTERNLY_DEFER_NATIVE_STARTUP: "1" }), true);
  assert.equal(plugin.readDeferFlag({ PATTERNLY_DEFER_NATIVE_STARTUP: "0" }), false);
  assert.throws(() => plugin.readDeferFlag({ PATTERNLY_DEFER_NATIVE_STARTUP: "false" }), /must be 0 or 1/);
});

test("a Firebase block in the wrong order or a missing startReactNative anchor is rejected", () => {
  assert.throws(() => plugin.deferFirebaseStartup(GENERATED.replace("RNFBAppCheckModule.sharedInstance()\n    FirebaseApp.configure()", "FirebaseApp.configure()\n    RNFBAppCheckModule.sharedInstance()")), /before FirebaseApp\.configure/u);
  assert.throws(() => plugin.deferFirebaseStartup(GENERATED.replace("factory.startReactNative(", "factory.start(")), /startReactNative anchor/u);
  assert.equal(plugin.deferFirebaseStartup(GENERATED.replace(/\/\/ @generated begin[\s\S]*?\/\/ @generated end @react-native-firebase\/app-check\n/u, "")).includes("DispatchQueue"), false);
});

test("app config registers the plugin after the privacy boundary", () => {
  const { createExpoConfig } = require("../app.config.js") as { createExpoConfig: (environment: Record<string, string>) => { expo: { plugins: unknown[] } } };
  const plugins = createExpoConfig({
    EXPO_PUBLIC_PATTERNLY_FIREBASE_PROJECT_ID: "demo-patternly-eas-config",
    EXPO_PUBLIC_PATTERNLY_FIREBASE_APP_ID: "1:1:ios:eas-config",
    EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_DOMAIN: "demo-patternly-eas-config.firebaseapp.com",
    EXPO_PUBLIC_PATTERNLY_APPCHECK_ANDROID_PROVIDER: "debug", EXPO_PUBLIC_PATTERNLY_APPCHECK_APPLE_PROVIDER: "debug",
    EXPO_PUBLIC_PATTERNLY_BACKEND_E2E: "true", EXPO_PUBLIC_PATTERNLY_API_ORIGIN: "http://127.0.0.1:8080",
    EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_EMULATOR_ORIGIN: "http://127.0.0.1:19099",
    PATTERNLY_RUNTIME_MODE: "smoke", EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: "smoke",
  }).expo.plugins.map((entry) => String(Array.isArray(entry) ? entry[0] : entry));
  assert.ok(plugins.indexOf("./plugins/withDeferredNativeStartup") > plugins.indexOf("./plugins/withPrivacyBoundary"));
});
