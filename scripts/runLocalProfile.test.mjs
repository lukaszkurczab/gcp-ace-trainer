import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { EventEmitter } from "node:events";
import { isLoopbackHttpOrigin, parseDotenv, probeSmokeApiReady, probeSmokeAuthEmulator, runLocalProfile, validateLocalProfile } from "./runLocalProfile.mjs";

const smoke = Object.freeze({
  PATTERNLY_RUNTIME_MODE: "smoke",
  EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: "smoke",
  EXPO_PUBLIC_PATTERNLY_BACKEND_E2E: "true",
  EXPO_PUBLIC_PATTERNLY_API_ORIGIN: "http://127.0.0.1:8080",
  EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_EMULATOR_ORIGIN: "http://127.0.0.1:9099",
  EXPO_PUBLIC_PATTERNLY_FIREBASE_API_KEY: "local-api-key",
  EXPO_PUBLIC_PATTERNLY_FIREBASE_APP_ID: "1:123:ios:local",
  EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_DOMAIN: "patternly-app-sandbox.firebaseapp.com",
  EXPO_PUBLIC_PATTERNLY_FIREBASE_PROJECT_ID: "patternly-app-sandbox",
  EXPO_PUBLIC_PATTERNLY_GOOGLE_ANDROID_CLIENT_ID: "local-android-client",
  EXPO_PUBLIC_PATTERNLY_GOOGLE_IOS_CLIENT_ID: "local-ios-client",
  EXPO_PUBLIC_PATTERNLY_GOOGLE_WEB_CLIENT_ID: "local-web-client",
  EXPO_PUBLIC_PATTERNLY_E2E_EMAIL: "smoke@example.test",
  EXPO_PUBLIC_PATTERNLY_E2E_PASSWORD: "local-password",
});

test("local profile dotenv parser has no process side effect", () => {
  assert.deepEqual(parseDotenv("# comment\nA=one\nB=\"two\"\n"), { A: "one", B: "two" });
  assert.throws(() => parseDotenv("not-an-assignment"), /invalid dotenv/);
});

test("the default iOS command uses the local profile and sandbox remains explicit", () => {
  const scripts = JSON.parse(readFileSync("package.json", "utf8")).scripts;
  assert.equal(scripts.ios, "node scripts/runLocalProfile.mjs smoke ios");
  for (const command of ["start", "web", "android"]) assert.equal(scripts[command], "node scripts/runLocalProfile.mjs");
  assert.equal(scripts["ios:sandbox"], "node scripts/runLocalProfile.mjs sandbox ios");
  assert.equal(scripts["start:smoke"], "node scripts/runLocalProfile.mjs smoke start");
  assert.equal(scripts["start:sandbox"], "node scripts/runLocalProfile.mjs sandbox start");
  assert.equal(scripts["web:smoke"], "node scripts/runLocalProfile.mjs smoke web");
  assert.equal(scripts["web:sandbox"], "node scripts/runLocalProfile.mjs sandbox web");
  assert.equal(scripts["android:local"], "node scripts/verifyNativeScreensPatch.mjs && node scripts/runLocalProfile.mjs smoke android-local");
});

test("smoke profile requires explicit matching local E2E endpoints", () => {
  assert.equal(validateLocalProfile("smoke", smoke).EXPO_NO_DOTENV, "1");
  assert.ok(isLoopbackHttpOrigin(smoke.EXPO_PUBLIC_PATTERNLY_API_ORIGIN));
  assert.throws(() => validateLocalProfile("smoke", { ...smoke, EXPO_PUBLIC_PATTERNLY_BACKEND_E2E: "false" }), /BACKEND_E2E=true/);
  assert.throws(() => validateLocalProfile("smoke", { ...smoke, EXPO_PUBLIC_PATTERNLY_API_ORIGIN: "https://sandbox.patternly.invalid" }), /127\.0\.0\.1/);
  assert.throws(() => validateLocalProfile("smoke", { ...smoke, EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: "sandbox" }), /matching/);
  assert.throws(() => validateLocalProfile("smoke", { ...smoke, EXPO_PUBLIC_PATTERNLY_LOCAL_APPCHECK_TOKEN: "invalid" }), /local App Check/);
  assert.throws(() => validateLocalProfile("smoke", { ...smoke, EXPO_PUBLIC_PATTERNLY_LOCAL_APPCHECK_TOKEN: "a".repeat(64), EXPO_PUBLIC_PATTERNLY_FIREBASE_PROJECT_ID: "production" }), /FIREBASE_PROJECT_ID=patternly-app-sandbox/);
  for (const key of ["EXPO_PUBLIC_PATTERNLY_FIREBASE_API_KEY", "EXPO_PUBLIC_PATTERNLY_FIREBASE_APP_ID", "EXPO_PUBLIC_PATTERNLY_GOOGLE_IOS_CLIENT_ID"]) {
    assert.throws(() => validateLocalProfile("smoke", { ...smoke, [key]: "" }), new RegExp(key));
  }
  assert.equal(validateLocalProfile("smoke", { ...smoke, EXPO_PUBLIC_PATTERNLY_E2E_EMAIL: "", EXPO_PUBLIC_PATTERNLY_E2E_PASSWORD: "" }).EXPO_NO_DOTENV, "1");
});

test("sandbox profile rejects every local auth override", () => {
  const sandbox = { PATTERNLY_RUNTIME_MODE: "sandbox", EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: "sandbox" };
  assert.equal(validateLocalProfile("sandbox", sandbox).EXPO_NO_DOTENV, "1");
  assert.throws(() => validateLocalProfile("sandbox", { ...sandbox, EXPO_PUBLIC_PATTERNLY_BACKEND_E2E: "false" }), /must not set/);
  assert.throws(() => validateLocalProfile("sandbox", { ...sandbox, EXPO_PUBLIC_PATTERNLY_LOCAL_APPCHECK_TOKEN: "a".repeat(64) }), /must not set/);
});

test("smoke emulator probe reports profile, origin, and action on failure", async () => {
  await assert.rejects(
    () => probeSmokeAuthEmulator("http://127.0.0.1:9099", "patternly-app-sandbox", async () => { throw new Error("sensitive-value"); }),
    (error) => /profile=smoke origin=http:\/\/127\.0\.0\.1:9099 action=start Firebase Auth emulator, then rerun npm run start:smoke/.test(error.message) && !error.message.includes("sensitive-value"),
  );
});

test("Auth probe requires the documented emulator configuration response", async () => {
  const calls = [];
  await probeSmokeAuthEmulator("http://127.0.0.1:9099", "patternly-app-sandbox", async (url) => {
    calls.push(url.pathname);
    return { ok: true, json: async () => ({ signIn: { allowDuplicateEmails: false }, extra: true }) };
  });
  assert.deepEqual(calls, ["/emulator/v1/projects/patternly-app-sandbox/config"]);
  await assert.rejects(() => probeSmokeAuthEmulator("http://127.0.0.1:9099", "patternly-app-sandbox", async () => ({ ok: false, json: async () => ({}) })), /probe failed/);
  await assert.rejects(() => probeSmokeAuthEmulator("http://127.0.0.1:9099", "patternly-app-sandbox", async () => ({ ok: true, json: async () => ({ signIn: {} }) })), /probe failed/);
});

test("API readiness waits for dependencies and rejects false checks", async () => {
  let calls = 0;
  await probeSmokeApiReady("http://127.0.0.1:8080", async (url) => {
    assert.equal(url.pathname, "/ready");
    calls += 1;
    return { status: 200, json: async () => calls === 1
      ? { status: "ready", checks: { database: false, authentication: true, providerReader: true } }
      : { status: "ready", checks: { database: true, authentication: true, providerReader: true, contentPackages: true } } };
  }, { timeoutMs: 100, delayMs: 0 });
  assert.equal(calls, 2);
  await assert.rejects(() => probeSmokeApiReady("http://127.0.0.1:8080", async () => ({ ok: true, json: async () => ({ status: "ready", checks: { database: false, authentication: true, providerReader: true } }) }), { timeoutMs: 5, delayMs: 0 }), /not ready/);
});

test("failed smoke preflight cannot spawn Expo", async () => {
  const root = mkdtempSync(join(tmpdir(), "patternly-smoke-preflight-"));
  try {
    writeFileSync(join(root, ".env.smoke.local"), Object.entries(smoke).map(([key, value]) => `${key}=${value}`).join("\n"));
    await assert.rejects(() => runLocalProfile(["smoke", "start"], {
      repositoryRoot: root,
      command: "/no-such-expo-command",
      prepareCurrentContent: async () => {},
      fetchImplementation: async (url) => url.pathname.includes("/config")
        ? { ok: true, json: async () => ({ signIn: { allowDuplicateEmails: false } }) }
        : { ok: false, json: async () => ({ status: "not_ready" }) },
    }), /smoke API is not ready/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("android-local keeps smoke identity, pins Expo to one local Android package, and forwards only its loopback ports", async () => {
  const root = mkdtempSync(join(tmpdir(), "patternly-android-local-launch-"));
  try {
    writeNativeAndroidFixture(root, "com.lkurczab.patternly.local", "com.lkurczab.patternly.local");
    const profile = {
      ...smoke,
      EXPO_PUBLIC_PATTERNLY_LOCAL_APPCHECK_TOKEN: "a".repeat(64),
      ANDROID_SERIAL: "usb-device-123",
      ANDROID_HOME: "/test/android-sdk",
    };
    writeFileSync(join(root, ".env.smoke.local"), Object.entries(profile).map(([key, value]) => `${key}=${value}`).join("\n"));
    const adbCalls = [];
    const stages = [];
    let childOptions;
    const result = await runLocalProfile(["smoke", "android-local", "--port", "8083", "--no-bundler"], {
      repositoryRoot: root,
      prepareCurrentContent: async () => stages.push("content"),
      fetchImplementation: async (url) => {
        stages.push(url.pathname === "/ready" ? "api-probe" : "auth-probe");
        return url.pathname === "/ready"
          ? { status: 200, json: async () => ({ status: "ready", checks: readyChecks }) }
          : { ok: true, json: async () => ({ signIn: { allowDuplicateEmails: false } }) };
      },
      spawnSync: (_command, args) => {
        if (args[0] === "-e") return { status: 0, stdout: JSON.stringify([{ pid: "usb-device-123", name: "Test_Phone", isAuthorized: true, isBooted: true }]) };
        adbCalls.push(args);
        if (args.at(-1) === "get-state") return { status: 0, stdout: "device\n" };
        if (args.at(-1) === "--list") return { status: 0, stdout: "tcp:8080 tcp:8080\n" };
        return { status: 0, stdout: "" };
      },
      spawn: (_command, args, options) => {
        stages.push("expo");
        childOptions = { args, env: options.env };
        const child = new EventEmitter();
        queueMicrotask(() => child.emit("exit", 0, null));
        return child;
      },
    });
    assert.deepEqual(stages, ["content", "auth-probe", "api-probe", "expo"]);
    assert.deepEqual(adbCalls, [
      ["-s", "usb-device-123", "get-state"],
      ["-s", "usb-device-123", "reverse", "--list"],
      ["-s", "usb-device-123", "reverse", "tcp:9099", "tcp:9099"],
    ]);
    assert.deepEqual(childOptions.args, ["expo", "run:android", "--device", "Test_Phone", "--port", "8083", "--no-bundler"]);
    assert.equal(childOptions.env.PATTERNLY_RUNTIME_MODE, "smoke");
    assert.equal(childOptions.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE, "smoke");
    assert.equal(childOptions.env.EAS_BUILD_PLATFORM, "android");
    assert.equal(childOptions.env.PATTERNLY_ANDROID_LOCAL_APP, "true");
    assert.equal(childOptions.env.REACT_NATIVE_PACKAGER_HOSTNAME, "127.0.0.1");
    assert.equal(childOptions.env.EXPO_PUBLIC_PATTERNLY_LOCAL_APPCHECK_TOKEN, "a".repeat(64));
    assert.equal(childOptions.env.EXPO_PUBLIC_PATTERNLY_FIREBASE_PROJECT_ID, "patternly-app-sandbox");
    assert.deepEqual(result, { code: 0, signal: null });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("android-local rejects missing, unauthorized, stopped and ambiguous Expo devices before forwarding", async () => {
  const root = mkdtempSync(join(tmpdir(), "patternly-android-local-inventory-"));
  try {
    const profile = { ...smoke, EXPO_PUBLIC_PATTERNLY_LOCAL_APPCHECK_TOKEN: "a".repeat(64), ANDROID_SERIAL: "usb-device-123", ANDROID_HOME: "/test/android-sdk" };
    writeFileSync(join(root, ".env.smoke.local"), Object.entries(profile).map(([key, value]) => `${key}=${value}`).join("\n"));
    const target = { pid: "usb-device-123", name: "Test_Phone", isAuthorized: true, isBooted: true };
    for (const devices of [[], [{ ...target, pid: "other" }], [{ ...target, isAuthorized: false }], [{ ...target, isBooted: false }], [target, { ...target, pid: "other" }]]) {
      await assert.rejects(() => runLocalProfile(["smoke", "android-local"], {
        repositoryRoot: root, prepareCurrentContent: async () => {},
        fetchImplementation: async (url) => url.pathname === "/ready"
          ? { status: 200, json: async () => ({ status: "ready", checks: readyChecks }) }
          : { ok: true, json: async () => ({ signIn: { allowDuplicateEmails: false } }) },
        spawnSync: (_command, args) => {
          assert.equal(args[0], "-e", "invalid inventory must stop before ADB forwarding");
          return { status: 0, stdout: JSON.stringify(devices) };
        },
        spawn: () => assert.fail("invalid inventory must not launch Expo"),
      }), /selected serial is not one authorized, booted Expo device|selected Expo device name is ambiguous/u);
    }
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("android-local refuses base and near-match Android identities before any effects", async () => {
  const root = mkdtempSync(join(tmpdir(), "patternly-android-local-base-tree-"));
  try {
    writeFileSync(join(root, ".env.smoke.local"), Object.entries({
      ...smoke,
      EXPO_PUBLIC_PATTERNLY_LOCAL_APPCHECK_TOKEN: "a".repeat(64),
      ANDROID_SERIAL: "usb-device-123",
      ANDROID_HOME: "/test/android-sdk",
    }).map(([key, value]) => `${key}=${value}`).join("\n"));
    for (const [namespace, applicationId] of [
      ["com.lkurczab.patternly", "com.lkurczab.patternly"],
      ["comXlkurczabXpatternlyXlocal", "com.lkurczab.patternly.local"],
      ["com.lkurczab.patternly.local", "comXlkurczabXpatternlyXlocal"],
    ]) {
      writeNativeAndroidFixture(root, namespace, applicationId);
      let sideEffects = 0;
      await assert.rejects(() => runLocalProfile(["smoke", "android-local"], {
        repositoryRoot: root,
        prepareCurrentContent: async () => { sideEffects += 1; },
        fetchImplementation: async () => { sideEffects += 1; throw new Error("must not probe"); },
        spawnSync: () => { sideEffects += 1; throw new Error("must not invoke ADB"); },
        spawn: () => { sideEffects += 1; throw new Error("must not spawn Expo"); },
      }), /refused the existing Android native tree .*Preserve that tree, regenerate Android only from the local smoke profile/u);
      assert.equal(sideEffects, 0);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("android-local refuses a matching local tree that contains google-services.json", async () => {
  const root = mkdtempSync(join(tmpdir(), "patternly-android-local-google-config-"));
  try {
    writeNativeAndroidFixture(root, "com.lkurczab.patternly.local", "com.lkurczab.patternly.local");
    mkdirSync(join(root, "android", "app"), { recursive: true });
    writeFileSync(join(root, "android", "app", "google-services.json"), "{}");
    writeFileSync(join(root, ".env.smoke.local"), Object.entries({
      ...smoke,
      EXPO_PUBLIC_PATTERNLY_LOCAL_APPCHECK_TOKEN: "a".repeat(64),
      ANDROID_SERIAL: "usb-device-123",
      ANDROID_HOME: "/test/android-sdk",
    }).map(([key, value]) => `${key}=${value}`).join("\n"));
    await assert.rejects(() => runLocalProfile(["smoke", "android-local"], {
      repositoryRoot: root,
      prepareCurrentContent: async () => assert.fail("native-tree validation must precede content preparation"),
    }), /native google-services.json is present/u);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("android-local fails closed on an unsupported Gradle identity declaration", async () => {
  const root = mkdtempSync(join(tmpdir(), "patternly-android-local-unsupported-gradle-"));
  try {
    writeNativeAndroidFixture(root, "com.lkurczab.patternly.local", "com.lkurczab.patternly.local");
    writeFileSync(join(root, "android", "app", "build.gradle"), `android {\n    namespace = 'com.lkurczab.patternly.local'\n    defaultConfig {\n        applicationId 'com.lkurczab.patternly.local'\n    }\n}\n`);
    writeFileSync(join(root, ".env.smoke.local"), Object.entries({
      ...smoke,
      EXPO_PUBLIC_PATTERNLY_LOCAL_APPCHECK_TOKEN: "a".repeat(64),
      ANDROID_SERIAL: "usb-device-123",
      ANDROID_HOME: "/test/android-sdk",
    }).map(([key, value]) => `${key}=${value}`).join("\n"));
    await assert.rejects(() => runLocalProfile(["smoke", "android-local"], {
      repositoryRoot: root,
      prepareCurrentContent: async () => assert.fail("unsupported Gradle identity syntax must fail before content preparation"),
    }), /namespace is not the exact local Android identity/u);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

function writeNativeAndroidFixture(root, namespace, applicationId) {
  const main = join(root, "android", "app", "src", "main");
  mkdirSync(main, { recursive: true });
  writeFileSync(join(root, "android", "app", "build.gradle"), `android {\n    namespace '${namespace}'\n    defaultConfig {\n        applicationId '${applicationId}'\n    }\n}\n`);
  writeFileSync(join(main, "AndroidManifest.xml"), `<manifest xmlns:android="http://schemas.android.com/apk/res/android"><application><activity><intent-filter><data android:scheme="${applicationId}" /></intent-filter></activity></application></manifest>`);
}

test("android-local rejects target and build-identity overrides before reading profiles or starting work", async () => {
  const root = mkdtempSync(join(tmpdir(), "patternly-android-local-argument-guards-"));
  try {
    let sideEffects = 0;
    const options = {
      repositoryRoot: root,
      prepareCurrentContent: async () => { sideEffects += 1; },
      fetchImplementation: async () => { sideEffects += 1; throw new Error("must not probe"); },
      spawnSync: () => { sideEffects += 1; throw new Error("must not invoke ADB"); },
      spawn: () => { sideEffects += 1; throw new Error("must not spawn Expo"); },
    };
    const invalidOptions = [
      ["--device", "other-device"], ["-d", "other-device"], ["--device=other-device"], ["-d=other-device"],
      ["--app-id", "com.other.app"], ["--app-id=com.other.app"],
      ["--binary", "/tmp/other.apk"], ["--binary=/tmp/other.apk"],
      ["--variant", "release"], ["--variant=release"],
    ];
    for (const args of invalidOptions) {
      await assert.rejects(() => runLocalProfile(["smoke", "android-local", ...args], options), /does not allow the Expo target override/u);
    }
    assert.equal(sideEffects, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("android-local rejects missing target, invalid App Check token, and conflicting endpoint forwarding", async () => {
  const root = mkdtempSync(join(tmpdir(), "patternly-android-local-guards-"));
  try {
    const writeProfile = (overrides = {}) => writeFileSync(join(root, ".env.smoke.local"), Object.entries({
      ...smoke,
      EXPO_PUBLIC_PATTERNLY_LOCAL_APPCHECK_TOKEN: "a".repeat(64),
      ANDROID_SERIAL: "usb-device-123",
      ANDROID_HOME: "/test/android-sdk",
      ...overrides,
    }).map(([key, value]) => `${key}=${value}`).join("\n"));
    writeProfile({ PATTERNLY_ANDROID_LOCAL_APP: "true" });
    await assert.rejects(() => runLocalProfile(["smoke", "android"], {
      repositoryRoot: root, prepareCurrentContent: async () => assert.fail("normal smoke launch must not sync with the local-app switch"),
    }), /reserved for the android-local action/);
    writeProfile({ ANDROID_SERIAL: "" });
    await assert.rejects(() => runLocalProfile(["smoke", "android-local"], {
      repositoryRoot: root, prepareCurrentContent: async () => {}, fetchImplementation: async (url) => url.pathname === "/ready"
        ? { status: 200, json: async () => ({ status: "ready", checks: readyChecks }) }
        : { ok: true, json: async () => ({ signIn: { allowDuplicateEmails: false } }) },
    }), /requires ANDROID_SERIAL/);
    writeProfile({ EXPO_PUBLIC_PATTERNLY_LOCAL_APPCHECK_TOKEN: "invalid" });
    await assert.rejects(() => runLocalProfile(["smoke", "android-local"], { repositoryRoot: root, prepareCurrentContent: async () => {} }), /smoke local App Check requires the generated token/);
    writeProfile();
    await assert.rejects(() => runLocalProfile(["smoke", "android-local"], {
      repositoryRoot: root, prepareCurrentContent: async () => {}, fetchImplementation: async (url) => url.pathname === "/ready"
        ? { status: 200, json: async () => ({ status: "ready", checks: readyChecks }) }
        : { ok: true, json: async () => ({ signIn: { allowDuplicateEmails: false } }) },
      spawnSync: (_command, args) => args[0] === "-e"
        ? { status: 0, stdout: JSON.stringify([{ pid: "usb-device-123", name: "Test_Phone", isAuthorized: true, isBooted: true }]) }
        : args.at(-1) === "get-state"
        ? { status: 0, stdout: "device" }
        : args.at(-1) === "--list" ? { status: 0, stdout: "tcp:8080 tcp:8082\n" } : { status: 0, stdout: "" },
      spawn: () => assert.fail("Expo must not start with a conflicting endpoint mapping"),
    }), /conflicting ADB reverse mapping for tcp:8080/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("local Expo launches synchronize current content before starting the packager", async () => {
  const root = mkdtempSync(join(tmpdir(), "patternly-current-content-launch-"));
  try {
    writeFileSync(join(root, ".env.sandbox.local"), "PATTERNLY_RUNTIME_MODE=sandbox\nEXPO_PUBLIC_PATTERNLY_RUNTIME_MODE=sandbox\n");
    const order = [];
    const result = await runLocalProfile(["sandbox", "start"], {
      repositoryRoot: root,
      prepareCurrentContent: async () => { order.push("sync"); },
      spawn: () => {
        order.push("expo");
        const child = new EventEmitter();
        queueMicrotask(() => child.emit("exit", 0, null));
        return child;
      },
    });
    assert.deepEqual(order, ["sync", "expo"]);
    assert.deepEqual(result, { code: 0, signal: null });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

const readyChecks = { database: true, authentication: true, providerReader: true, contentPackages: true };
const readinessResponse = (status, body) => ({ status, json: async () => body });

test("smoke accepts only the explicit content-only readiness gap and reports it", async (t) => {
  const messages = [];
  t.mock.method(console, "info", (message) => messages.push(message));
  await probeSmokeApiReady("http://127.0.0.1:8080", async () => readinessResponse(503, {
    status: "not_ready", checks: { ...readyChecks, contentPackages: false },
  }));
  assert.match(messages.join("\n"), /online content packages unavailable.*bundled app content/);
});

test("smoke rejects unavailable core services and malformed or inconsistent readiness", async () => {
  const invalid = [
    ...["database", "authentication", "providerReader"].map((key) => readinessResponse(503, {
      status: "not_ready", checks: { ...readyChecks, contentPackages: false, [key]: false },
    })),
    readinessResponse(503, { status: "not_ready", checks: readyChecks }),
    readinessResponse(503, { status: "ready", checks: { ...readyChecks, contentPackages: false } }),
    readinessResponse(503, { status: "not_ready", checks: { database: true, authentication: true, providerReader: true } }),
    readinessResponse(200, { status: "ready", checks: { ...readyChecks, contentPackages: false } }),
    readinessResponse(500, { status: "not_ready", checks: { ...readyChecks, contentPackages: false } }),
    readinessResponse(503, null),
  ];
  for (const response of invalid) await assert.rejects(() => probeSmokeApiReady(
    "http://127.0.0.1:8080", async () => response, { timeoutMs: 5, delayMs: 0 },
  ), /not ready/);
});
