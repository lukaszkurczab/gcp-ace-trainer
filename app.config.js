const RUNTIME_MODES = Object.freeze(["sandbox", "smoke", "release"]);
const path = require("node:path");
const PUBLIC_ENVIRONMENT_KEY = "EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT";
const REVENUECAT_IOS_API_KEY = "EXPO_PUBLIC_PATTERNLY_REVENUECAT_IOS_API_KEY";
const FIREBASE_FILE_KEYS = Object.freeze({
  android: "GOOGLE_SERVICES_JSON",
  ios: "GOOGLE_SERVICE_INFO_PLIST",
});
const FIREBASE_PUBLIC_KEYS = Object.freeze([
  "EXPO_PUBLIC_PATTERNLY_FIREBASE_API_KEY",
  "EXPO_PUBLIC_PATTERNLY_FIREBASE_APP_ID",
  "EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_DOMAIN",
  "EXPO_PUBLIC_PATTERNLY_FIREBASE_PROJECT_ID",
  "EXPO_PUBLIC_PATTERNLY_GOOGLE_ANDROID_CLIENT_ID",
  "EXPO_PUBLIC_PATTERNLY_GOOGLE_IOS_CLIENT_ID",
  "EXPO_PUBLIC_PATTERNLY_GOOGLE_WEB_CLIENT_ID",
]);
const GOOGLE_CLIENT_ID_KEYS = Object.freeze({
  android: "EXPO_PUBLIC_PATTERNLY_GOOGLE_ANDROID_CLIENT_ID",
  ios: "EXPO_PUBLIC_PATTERNLY_GOOGLE_IOS_CLIENT_ID",
});

function required(environment, key) {
  const value = environment[key];
  if (typeof value !== "string" || value.trim() !== value || value.length === 0) {
    throw new Error(`Patternly build configuration requires ${key}.`);
  }
  return value;
}

function readRuntimeMode(environment) {
  const mode = required(environment, "PATTERNLY_RUNTIME_MODE");
  if (!RUNTIME_MODES.includes(mode)) {
    throw new Error(`PATTERNLY_RUNTIME_MODE must be one of ${RUNTIME_MODES.join(", ")}.`);
  }
  const publicMode = required(environment, "EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE");
  if (publicMode !== mode) {
    throw new Error("PATTERNLY_RUNTIME_MODE must equal EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE.");
  }
  return mode;
}

function isLoopbackHttpOrigin(value) {
  if (typeof value !== "string" || value.length === 0) return false;
  try {
    const origin = new URL(value);
    return origin.protocol === "http:" && origin.hostname === "127.0.0.1" && origin.pathname === "/" && origin.search === "" && origin.hash === "";
  } catch {
    return false;
  }
}

const LOCAL_E2E_KEYS = Object.freeze([
  "EXPO_PUBLIC_PATTERNLY_BACKEND_E2E",
  "EXPO_PUBLIC_PATTERNLY_API_ORIGIN",
  "EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_EMULATOR_ORIGIN",
  "EXPO_PUBLIC_PATTERNLY_E2E_EMAIL",
  "EXPO_PUBLIC_PATTERNLY_E2E_PASSWORD",
]);

function assertLocalAuthProfile(environment, mode) {
  if (mode === "smoke") {
    if (environment.EXPO_PUBLIC_PATTERNLY_BACKEND_E2E !== "true") {
      throw new Error("smoke builds require EXPO_PUBLIC_PATTERNLY_BACKEND_E2E=true.");
    }
    for (const key of ["EXPO_PUBLIC_PATTERNLY_API_ORIGIN", "EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_EMULATOR_ORIGIN"]) {
      if (!isLoopbackHttpOrigin(environment[key])) throw new Error(`smoke builds require ${key} to be an http://127.0.0.1 origin.`);
    }
  }
  if (mode === "sandbox") {
    for (const key of LOCAL_E2E_KEYS) {
      if (environment[key] !== undefined && environment[key] !== "") {
        throw new Error(`sandbox builds must not set local auth override ${key}.`);
      }
    }
  }
}

function readConfiguredPublicEnvironment(environment, mode) {
  if (mode === "smoke") {
    return undefined;
  }
  const value = required(environment, PUBLIC_ENVIRONMENT_KEY);
  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error(`${PUBLIC_ENVIRONMENT_KEY} must be valid JSON.`);
  }
  const expectedEnvironment = mode === "release" ? "production" : "sandbox";
  if (parsed?.environment !== expectedEnvironment) {
    throw new Error(`${PUBLIC_ENVIRONMENT_KEY}.environment must equal ${expectedEnvironment}.`);
  }
  return parsed;
}

function nativeFirebaseFile(environment, key, mode) {
  if (mode !== "release") {
    return key === FIREBASE_FILE_KEYS.android ? "./google-services.json" : "./GoogleService-Info.plist";
  }
  return required(environment, key);
}

function assertRuntimeEnvironment(environment, mode) {
  assertLocalAuthProfile(environment, mode);
  const publicEnvironment = readConfiguredPublicEnvironment(environment, mode);
  const platform = environment.EAS_BUILD_PLATFORM;
  if (mode !== "smoke") {
    for (const key of FIREBASE_PUBLIC_KEYS) {
      if (platform === "android" && key === GOOGLE_CLIENT_ID_KEYS.ios) continue;
      if (platform === "ios" && key === GOOGLE_CLIENT_ID_KEYS.android) continue;
      required(environment, key);
    }
    if (platform !== "android") required(environment, REVENUECAT_IOS_API_KEY);
  }
  if (platform !== "ios" || mode !== "release") nativeFirebaseFile(environment, FIREBASE_FILE_KEYS.android, mode);
  if (platform !== "android" || mode !== "release") nativeFirebaseFile(environment, FIREBASE_FILE_KEYS.ios, mode);

  const androidAppCheck = environment.EXPO_PUBLIC_PATTERNLY_APPCHECK_ANDROID_PROVIDER;
  const appleAppCheck = environment.EXPO_PUBLIC_PATTERNLY_APPCHECK_APPLE_PROVIDER;
  if (mode !== "smoke") {
    if (platform !== "ios" && androidAppCheck !== "playIntegrity") throw new Error(`${mode} builds require EXPO_PUBLIC_PATTERNLY_APPCHECK_ANDROID_PROVIDER=playIntegrity.`);
    if (platform !== "android" && appleAppCheck !== "deviceCheck" && appleAppCheck !== "appAttest" && appleAppCheck !== "appAttestWithDeviceCheckFallback") {
      throw new Error(`${mode} builds require an Apple release App Check provider.`);
    }
  }
  if (mode !== "smoke" && ((platform !== "ios" && androidAppCheck === "debug") || (platform !== "android" && appleAppCheck === "debug"))) {
    throw new Error("Only smoke builds may use a debug App Check provider.");
  }
  return publicEnvironment;
}

function validateReleaseLegalVariables(legalVariables) {
  require("tsx/cjs");
  const { validateLegalVariables } = require("./src/legal/legalVariablesSchema.ts");
  const issues = validateLegalVariables(legalVariables, "release");
  if (issues.length > 0) {
    const summary = issues.map(({ path: fieldPath, message }) => `${fieldPath}: ${message}`).join("\n");
    throw new Error(`Release legal variables are invalid:\n${summary}`);
  }
}

function readReleaseLegalVariables() {
  const fs = require("node:fs");
  const filename = path.join(__dirname, "config", "public-legal.release.json");
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(filename, "utf8"));
  } catch (error) {
    throw new Error(`Release legal variables could not be read from ${filename}: ${error.message}`);
  }
  return parsed;
}

function validateReleasePublicLegalLinks(legalVariables, publicEnvironment) {
  require("tsx/cjs");
  const { parseConfiguredPublicEnvironment } = require("./src/infrastructure/clients/publicEnvironment.ts");
  const configured = parseConfiguredPublicEnvironment(publicEnvironment);
  const legalLinks = legalVariables?.publicLinks;
  for (const field of ["privacyUrl", "termsUrl", "supportUrl"]) {
    if (typeof legalLinks?.[field] !== "string" || legalLinks[field] !== configured[field]) {
      throw new Error(`Release public legal link mismatch: ${field}.`);
    }
  }
}

function createExpoConfig(environment = process.env) {
  const runtimeMode = readRuntimeMode(environment);
  const publicEnvironment = assertRuntimeEnvironment(environment, runtimeMode);
  if (runtimeMode === "release") {
    const legalVariables = readReleaseLegalVariables();
    validateReleaseLegalVariables(legalVariables);
    validateReleasePublicLegalLinks(legalVariables, publicEnvironment);
  }
  return {
    expo: {
      name: "Patternly",
      slug: "patternly",
      version: "0.1.0",
      runtimeVersion: { policy: "appVersion" },
      scheme: "com.lkurczab.patternly",
      icon: "./assets/brand/app-icon/patternly-app-icon.png",
      orientation: "portrait",
      userInterfaceStyle: "automatic",
      plugins: [
        "expo-notifications",
        ["expo-splash-screen", {
          image: "./assets/brand/app-icon/patternly-app-icon-foreground.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#0C1324",
        }],
        ["@react-native-firebase/app", { ios: { disableSPM: true } }],
        "@react-native-firebase/app-check",
        ["expo-secure-store", { configureAndroidBackup: false }],
        ["expo-build-properties", {
          ios: {
            deploymentTarget: "16.4",
            buildReactNativeFromSource: true,
            usePrecompiledModules: false,
            extraPods: [
              { name: "GoogleUtilities", modular_headers: true },
              { name: "RecaptchaInterop", modular_headers: true },
            ],
          },
          android: { minSdkVersion: 28, targetSdkVersion: 36, compileSdkVersion: 36 },
        }],
        "./plugins/withPrivacyBoundary",
      ],
      assetBundlePatterns: ["**/*"],
      ios: {
        supportsTablet: false,
        bundleIdentifier: "com.lkurczab.patternly",
        buildNumber: "1",
        ...(environment.EAS_BUILD_PLATFORM === "android" && runtimeMode === "release" ? {} : { googleServicesFile: nativeFirebaseFile(environment, FIREBASE_FILE_KEYS.ios, runtimeMode) }),
        appleTeamId: "4KJFN6SXMH",
      },
      android: {
        package: "com.lkurczab.patternly",
        ...(environment.EAS_BUILD_PLATFORM === "ios" && runtimeMode === "release" ? {} : { googleServicesFile: nativeFirebaseFile(environment, FIREBASE_FILE_KEYS.android, runtimeMode) }),
        versionCode: 1,
        adaptiveIcon: {
          foregroundImage: "./assets/brand/app-icon/patternly-app-icon-foreground.png",
          backgroundColor: "#0C1324",
          monochromeImage: "./assets/brand/app-icon/patternly-app-icon-monochrome.png",
        },
      },
      web: { favicon: "./assets/brand/web/favicon.png", themeColor: "#0C1324", backgroundColor: "#F6F8FB" },
      extra: {
        patternlyRuntime: runtimeMode,
        eas: { projectId: "204d9769-4832-4c4a-b932-6359c4ff9dab" },
      },
      updates: { url: "https://u.expo.dev/204d9769-4832-4c4a-b932-6359c4ff9dab" },
    },
  };
}

module.exports = () => createExpoConfig();
module.exports.createExpoConfig = createExpoConfig;
module.exports.FIREBASE_FILE_KEYS = FIREBASE_FILE_KEYS;
module.exports.FIREBASE_PUBLIC_KEYS = FIREBASE_PUBLIC_KEYS;
module.exports.RUNTIME_MODES = RUNTIME_MODES;
module.exports.LOCAL_E2E_KEYS = LOCAL_E2E_KEYS;
module.exports.isLoopbackHttpOrigin = isLoopbackHttpOrigin;
module.exports.validateReleasePublicLegalLinks = validateReleasePublicLegalLinks;
