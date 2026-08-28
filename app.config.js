const RUNTIME_MODES = Object.freeze(["sandbox", "smoke", "release"]);
const PUBLIC_ENVIRONMENT_KEY = "EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT";
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

function required(environment, key) {
  const value = environment[key];
  if (typeof value !== "string" || value.trim() !== value || value.length === 0) {
    throw new Error(`Patternly build configuration requires ${key}.`);
  }
  return value;
}

function readRuntimeMode(environment) {
  const mode = environment.PATTERNLY_RUNTIME_MODE ?? "smoke";
  if (!RUNTIME_MODES.includes(mode)) {
    throw new Error(`PATTERNLY_RUNTIME_MODE must be one of ${RUNTIME_MODES.join(", ")}.`);
  }
  return mode;
}

function readConfiguredPublicEnvironment(environment, mode) {
  const encoded = environment[PUBLIC_ENVIRONMENT_KEY];
  if (mode === "smoke") {
    return;
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
}

function nativeFirebaseFile(environment, key, mode) {
  if (mode !== "release") {
    return key === FIREBASE_FILE_KEYS.android ? "./google-services.json" : "./GoogleService-Info.plist";
  }
  return required(environment, key);
}

function assertRuntimeEnvironment(environment, mode) {
  readConfiguredPublicEnvironment(environment, mode);
  if (mode !== "smoke") {
    for (const key of FIREBASE_PUBLIC_KEYS) required(environment, key);
  }
  nativeFirebaseFile(environment, FIREBASE_FILE_KEYS.android, mode);
  nativeFirebaseFile(environment, FIREBASE_FILE_KEYS.ios, mode);

  const androidAppCheck = environment.EXPO_PUBLIC_PATTERNLY_APPCHECK_ANDROID_PROVIDER;
  const appleAppCheck = environment.EXPO_PUBLIC_PATTERNLY_APPCHECK_APPLE_PROVIDER;
  if (mode !== "smoke") {
    if (androidAppCheck !== "playIntegrity") throw new Error(`${mode} builds require EXPO_PUBLIC_PATTERNLY_APPCHECK_ANDROID_PROVIDER=playIntegrity.`);
    if (appleAppCheck !== "deviceCheck" && appleAppCheck !== "appAttest" && appleAppCheck !== "appAttestWithDeviceCheckFallback") {
      throw new Error(`${mode} builds require an Apple release App Check provider.`);
    }
  }
  if (mode !== "smoke" && (androidAppCheck === "debug" || appleAppCheck === "debug")) {
    throw new Error("Only smoke builds may use a debug App Check provider.");
  }
}

function createExpoConfig(environment = process.env) {
  const runtimeMode = readRuntimeMode(environment);
  assertRuntimeEnvironment(environment, runtimeMode);
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
        googleServicesFile: nativeFirebaseFile(environment, FIREBASE_FILE_KEYS.ios, runtimeMode),
        appleTeamId: "4KJFN6SXMH",
      },
      android: {
        package: "com.lkurczab.patternly",
        googleServicesFile: nativeFirebaseFile(environment, FIREBASE_FILE_KEYS.android, runtimeMode),
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
