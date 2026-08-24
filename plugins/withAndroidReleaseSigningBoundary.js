const { withDangerousMod } = require("expo/config-plugins");
const { readFileSync, writeFileSync } = require("node:fs");
const { join } = require("node:path");

const RELEASE_SIGNING_PROPERTIES = Object.freeze([
  "PATTERNLY_ANDROID_RELEASE_STORE_FILE",
  "PATTERNLY_ANDROID_RELEASE_STORE_PASSWORD",
  "PATTERNLY_ANDROID_RELEASE_KEY_ALIAS",
  "PATTERNLY_ANDROID_RELEASE_KEY_PASSWORD",
]);

function injectAndroidReleaseSigning(source) {
  if (source.includes("PATTERNLY_RELEASE_SIGNING_BOUNDARY")) return source;

  const signingConfigsMarker = "    signingConfigs {\n";
  const signingConfigsIndex = source.indexOf(signingConfigsMarker);
  if (signingConfigsIndex < 0) {
    throw new Error("Patternly Android signingConfigs block was not found.");
  }

  const declarations = `    // PATTERNLY_RELEASE_SIGNING_BOUNDARY\n    def patternlyReleaseStoreFile = findProperty("PATTERNLY_ANDROID_RELEASE_STORE_FILE") ?: System.getenv("PATTERNLY_ANDROID_RELEASE_STORE_FILE")\n    def patternlyReleaseStorePassword = findProperty("PATTERNLY_ANDROID_RELEASE_STORE_PASSWORD") ?: System.getenv("PATTERNLY_ANDROID_RELEASE_STORE_PASSWORD")\n    def patternlyReleaseKeyAlias = findProperty("PATTERNLY_ANDROID_RELEASE_KEY_ALIAS") ?: System.getenv("PATTERNLY_ANDROID_RELEASE_KEY_ALIAS")\n    def patternlyReleaseKeyPassword = findProperty("PATTERNLY_ANDROID_RELEASE_KEY_PASSWORD") ?: System.getenv("PATTERNLY_ANDROID_RELEASE_KEY_PASSWORD")\n    def patternlyReleaseSigningAvailable = [patternlyReleaseStoreFile, patternlyReleaseStorePassword, patternlyReleaseKeyAlias, patternlyReleaseKeyPassword].every { value -> value != null && value.toString().trim() }\n    // EAS injects its managed keystore through credentials.json and eas-build.gradle after Expo prebuild has generated this file.\n    def patternlyEasCredentialsFile = rootProject.file("../credentials.json")\n    def patternlyEasSigningAvailable = patternlyEasCredentialsFile.isFile()\n`;
  let transformed = `${source.slice(0, signingConfigsIndex)}${declarations}${source.slice(signingConfigsIndex)}`;

  const signingConfigsEndMarker = "    }\n    buildTypes {";
  const signingConfigsEndIndex = transformed.indexOf(signingConfigsEndMarker, signingConfigsIndex + declarations.length);
  if (signingConfigsEndIndex < 0) {
    throw new Error("Patternly Android signingConfigs block end was not found.");
  }

  const releaseConfig = `        if (patternlyReleaseSigningAvailable) {\n            release {\n                storeFile file(patternlyReleaseStoreFile)\n                storePassword patternlyReleaseStorePassword\n                keyAlias patternlyReleaseKeyAlias\n                keyPassword patternlyReleaseKeyPassword\n            }\n        }\n`;
  transformed = `${transformed.slice(0, signingConfigsEndIndex)}${releaseConfig}${transformed.slice(signingConfigsEndIndex)}`;

  const releaseBuildTypeIndex = transformed.indexOf("        release {", signingConfigsEndIndex + releaseConfig.length);
  if (releaseBuildTypeIndex < 0) {
    throw new Error("Patternly Android release build type was not found.");
  }
  const debugReleaseSigning = "            signingConfig signingConfigs.debug";
  const debugReleaseSigningIndex = transformed.indexOf(debugReleaseSigning, releaseBuildTypeIndex);
  if (debugReleaseSigningIndex < 0) {
    throw new Error("Patternly Android release build type does not contain the expected debug signing fallback.");
  }
  transformed = `${transformed.slice(0, debugReleaseSigningIndex)}            signingConfig patternlyReleaseSigningAvailable ? signingConfigs.release : null${transformed.slice(debugReleaseSigningIndex + debugReleaseSigning.length)}`;

  const dependenciesMarker = "\ndependencies {";
  const dependenciesIndex = transformed.indexOf(dependenciesMarker);
  if (dependenciesIndex < 0) {
    throw new Error("Patternly Android dependencies block was not found.");
  }
  const guard = `\n// A release task must never produce an unsigned or debug-signed production artifact.\ntasks.configureEach { patternlyTask ->\n    if (patternlyTask.name.toLowerCase().contains("release")) {\n        patternlyTask.doFirst {\n            if (!patternlyReleaseSigningAvailable && !patternlyEasSigningAvailable) {\n                throw new GradleException("Patternly release signing is unavailable. Configure ${RELEASE_SIGNING_PROPERTIES.join(", ")} for a local build or run the build through EAS with managed Android credentials.")\n            }\n        }\n    }\n}\n`;
  return `${transformed.slice(0, dependenciesIndex)}${guard}${transformed.slice(dependenciesIndex)}`;
}

function withAndroidReleaseSigningBoundary(config) {
  return withDangerousMod(config, ["android", async (nextConfig) => {
    const buildGradlePath = join(nextConfig.modRequest.platformProjectRoot, "app", "build.gradle");
    writeFileSync(buildGradlePath, injectAndroidReleaseSigning(readFileSync(buildGradlePath, "utf8")));
    return nextConfig;
  }]);
}

module.exports = withAndroidReleaseSigningBoundary;
module.exports.injectAndroidReleaseSigning = injectAndroidReleaseSigning;
module.exports.RELEASE_SIGNING_PROPERTIES = RELEASE_SIGNING_PROPERTIES;
