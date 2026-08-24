import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  injectAndroidReleaseSigning,
  RELEASE_SIGNING_PROPERTIES,
} = require("../plugins/withAndroidReleaseSigningBoundary.js") as {
  injectAndroidReleaseSigning: (source: string) => string;
  RELEASE_SIGNING_PROPERTIES: readonly string[];
};

const generatedGradle = `android {
    defaultConfig {
        versionName "0.1.0"
    }
    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }
    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            signingConfig signingConfigs.debug
        }
    }
}

dependencies {
    implementation("com.facebook.react:react-android")
}
`;

test("release signing boundary is part of the canonical Expo config", () => {
  const appConfig = JSON.parse(readFileSync("app.json", "utf8"));
  assert.ok(appConfig.expo.plugins.includes("./plugins/withAndroidReleaseSigningBoundary"));
  assert.deepEqual(RELEASE_SIGNING_PROPERTIES, [
    "PATTERNLY_ANDROID_RELEASE_STORE_FILE",
    "PATTERNLY_ANDROID_RELEASE_STORE_PASSWORD",
    "PATTERNLY_ANDROID_RELEASE_KEY_ALIAS",
    "PATTERNLY_ANDROID_RELEASE_KEY_PASSWORD",
  ]);
});

test("generated Android release signing cannot fall back to the debug keystore", () => {
  const transformed = injectAndroidReleaseSigning(generatedGradle);
  assert.match(transformed, /PATTERNLY_RELEASE_SIGNING_BOUNDARY/u);
  assert.match(transformed, /rootProject\.file\("\.\.\/credentials\.json"\)/u);
  assert.match(transformed, /!patternlyReleaseSigningAvailable && !patternlyEasSigningAvailable/u);
  assert.match(transformed, /signingConfig patternlyReleaseSigningAvailable \? signingConfigs\.release : null/u);
  const buildTypes = transformed.slice(transformed.indexOf("    buildTypes {"));
  assert.doesNotMatch(buildTypes, /release \{[\s\S]*?signingConfig signingConfigs\.debug/u);
  assert.match(transformed, /run the build through EAS with managed Android credentials/u);
  for (const property of RELEASE_SIGNING_PROPERTIES) assert.match(transformed, new RegExp(property, "u"));
});

test("release signing injection is idempotent", () => {
  const once = injectAndroidReleaseSigning(generatedGradle);
  assert.equal(injectAndroidReleaseSigning(once), once);
});
