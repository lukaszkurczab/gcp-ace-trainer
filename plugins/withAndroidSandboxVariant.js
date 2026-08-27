const { withDangerousMod } = require("expo/config-plugins");
const { readFileSync, writeFileSync } = require("node:fs");
const { join } = require("node:path");

const ANDROID_SANDBOX_VARIANT_MARKER = "PATTERNLY_ANDROID_SANDBOX_VARIANT";
const ANDROID_SANDBOX_VARIANT_NAME = "sandbox";
const DEBUGGABLE_VARIANTS = ["debug", "debugOptimized"];
const ANDROID_SANDBOX_BUNDLE_GUARD_MARKER = "PATTERNLY_ANDROID_SANDBOX_BUNDLE_GUARD";
const FORBIDDEN_SANDBOX_BUNDLE_ENDPOINTS = ["localhost", "127.0.0.1", "10.0.2.2", ":8081", "expo-development-client"];

function injectAndroidSandboxVariant(source) {
  let transformed = source;
  if (!transformed.includes(ANDROID_SANDBOX_VARIANT_MARKER)) {
    const reactBlockMarker = "react {\n";
    const reactBlockIndex = transformed.indexOf(reactBlockMarker);
    if (reactBlockIndex < 0) {
      throw new Error("Patternly React Native block was not found.");
    }

    const reactConfiguration = `react {\n    // ${ANDROID_SANDBOX_VARIANT_MARKER}\n    debuggableVariants = ["${DEBUGGABLE_VARIANTS.join('", "')}"]\n`;
    transformed = `${transformed.slice(0, reactBlockIndex)}${reactConfiguration}${transformed.slice(reactBlockIndex + reactBlockMarker.length)}`;

    const buildTypesMarker = "    buildTypes {\n";
    const buildTypesIndex = transformed.indexOf(buildTypesMarker);
    if (buildTypesIndex < 0) {
      throw new Error("Patternly Android buildTypes block was not found.");
    }

    const sandboxBuildType = `        ${ANDROID_SANDBOX_VARIANT_NAME} {\n            initWith release\n            matchingFallbacks = ["release", "debug"]\n            signingConfig signingConfigs.debug\n            debuggable false\n            minifyEnabled true\n            shrinkResources true\n        }\n`;
    const insertionIndex = buildTypesIndex + buildTypesMarker.length;
    transformed = `${transformed.slice(0, insertionIndex)}${sandboxBuildType}${transformed.slice(insertionIndex)}`;
  }
  if (transformed.includes(ANDROID_SANDBOX_BUNDLE_GUARD_MARKER)) return transformed;
  const dependenciesMarker = "\ndependencies {";
  const dependenciesIndex = transformed.indexOf(dependenciesMarker);
  if (dependenciesIndex < 0) {
    throw new Error("Patternly Android dependencies block was not found.");
  }
  const sandboxBundleGuard = `\n// ${ANDROID_SANDBOX_BUNDLE_GUARD_MARKER}\ntasks.configureEach { patternlyTask ->\n    if (patternlyTask.name == "packageSandbox") {\n        patternlyTask.doLast {\n            def patternlySandboxBundle = file("$buildDir/generated/assets/react/sandbox/index.android.bundle")\n            if (!patternlySandboxBundle.isFile()) {\n                throw new GradleException("Patternly sandbox bundle is missing from the APK build.")\n            }\n            def patternlySandboxBundleSource = patternlySandboxBundle.getText("UTF-8")\n            def patternlyForbiddenSandboxEndpoints = ${JSON.stringify(FORBIDDEN_SANDBOX_BUNDLE_ENDPOINTS)}\n            def patternlyFoundSandboxEndpoint = patternlyForbiddenSandboxEndpoints.find { endpoint -> patternlySandboxBundleSource.contains(endpoint) }\n            if (patternlyFoundSandboxEndpoint != null) {\n                throw new GradleException("Patternly sandbox bundle contains a forbidden local or development endpoint: ${'$'}{patternlyFoundSandboxEndpoint}")\n            }\n        }\n    }\n}\n`;
  return `${transformed.slice(0, dependenciesIndex)}${sandboxBundleGuard}${transformed.slice(dependenciesIndex)}`;
}

function withAndroidSandboxVariant(config) {
  return withDangerousMod(config, ["android", async (nextConfig) => {
    const buildGradlePath = join(nextConfig.modRequest.platformProjectRoot, "app", "build.gradle");
    writeFileSync(buildGradlePath, injectAndroidSandboxVariant(readFileSync(buildGradlePath, "utf8")));
    return nextConfig;
  }]);
}

module.exports = withAndroidSandboxVariant;
module.exports.injectAndroidSandboxVariant = injectAndroidSandboxVariant;
module.exports.ANDROID_SANDBOX_VARIANT_MARKER = ANDROID_SANDBOX_VARIANT_MARKER;
module.exports.ANDROID_SANDBOX_VARIANT_NAME = ANDROID_SANDBOX_VARIANT_NAME;
module.exports.DEBUGGABLE_VARIANTS = DEBUGGABLE_VARIANTS;
module.exports.ANDROID_SANDBOX_BUNDLE_GUARD_MARKER = ANDROID_SANDBOX_BUNDLE_GUARD_MARKER;
module.exports.FORBIDDEN_SANDBOX_BUNDLE_ENDPOINTS = FORBIDDEN_SANDBOX_BUNDLE_ENDPOINTS;
