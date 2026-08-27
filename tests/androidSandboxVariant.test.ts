import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createRequire } from "node:module";
import { PNG } from "pngjs";

const require = createRequire(import.meta.url);
const {
  ANDROID_SANDBOX_VARIANT_MARKER,
  ANDROID_SANDBOX_VARIANT_NAME,
  ANDROID_SANDBOX_BUNDLE_GUARD_MARKER,
  DEBUGGABLE_VARIANTS,
  FORBIDDEN_SANDBOX_BUNDLE_ENDPOINTS,
  injectAndroidSandboxVariant,
} = require("../plugins/withAndroidSandboxVariant.js") as {
  ANDROID_SANDBOX_VARIANT_MARKER: string;
  ANDROID_SANDBOX_VARIANT_NAME: string;
  ANDROID_SANDBOX_BUNDLE_GUARD_MARKER: string;
  DEBUGGABLE_VARIANTS: readonly string[];
  FORBIDDEN_SANDBOX_BUNDLE_ENDPOINTS: readonly string[];
  injectAndroidSandboxVariant: (source: string) => string;
};

const generatedGradle = `react {
    bundleCommand = "export:embed"
}

android {
    signingConfigs {
        debug {
            storeFile file('debug.keystore')
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
}
`;

test("Expo config registers the standalone sandbox Android variant against the sandbox Firebase app", () => {
  const app = JSON.parse(readFileSync("app.json", "utf8")).expo as {
    android: { googleServicesFile: string; package: string };
    plugins: readonly (string | readonly unknown[])[];
  };
  const googleServices = JSON.parse(readFileSync(app.android.googleServicesFile, "utf8")) as {
    project_info: { project_id: string };
    client: readonly [{ client_info: { android_client_info: { package_name: string } } }];
  };

  assert.ok(app.plugins.includes("./plugins/withAndroidSandboxVariant"));
  assert.equal(app.android.googleServicesFile, "./google-services.json");
  assert.equal(googleServices.project_info.project_id, "patternly-app-sandbox");
  assert.equal(googleServices.client[0].client_info.android_client_info.package_name, app.android.package);
  assert.equal(app.android.package, "com.lkurczab.patternly");
  assert.equal("splash" in app, false);
  assert.deepEqual(app.plugins.find((plugin) => Array.isArray(plugin) && plugin[0] === "expo-splash-screen"), [
    "expo-splash-screen",
    {
      image: "./assets/brand/app-icon/patternly-app-icon-foreground.png",
      imageWidth: 200,
      resizeMode: "contain",
      backgroundColor: "#0C1324",
    },
  ]);
});

test("launcher foreground and monochrome assets have the same explicit safe bounds", () => {
  const bounds = (path: string) => {
    const png = PNG.sync.read(readFileSync(path));
    let minX = png.width; let minY = png.height; let maxX = -1; let maxY = -1;
    for (let y = 0; y < png.height; y += 1) for (let x = 0; x < png.width; x += 1) {
      if ((png.data[(y * png.width + x) * 4 + 3] ?? 0) > 0) {
        minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
      }
    }
    return [minX, minY, maxX, maxY];
  };
  assert.deepEqual(bounds("assets/brand/app-icon/patternly-app-icon-foreground.png"), [179, 179, 844, 844]);
  assert.deepEqual(bounds("assets/brand/app-icon/patternly-app-icon-monochrome.png"), [179, 179, 844, 844]);
});

test("sandbox embeds JS and is not a Metro-debuggable variant", () => {
  const packageManifest = JSON.parse(readFileSync("package.json", "utf8")) as {
    dependencies: Record<string, string | undefined>;
    scripts: Record<string, string | undefined>;
  };
  const gradle = readFileSync("android/app/build.gradle", "utf8");
  const gradleProperties = readFileSync("android/gradle.properties", "utf8");
  const androidManifest = readFileSync("android/app/src/main/AndroidManifest.xml", "utf8");
  const metroConfig = readFileSync("metro.config.js", "utf8");
  assert.equal(packageManifest.dependencies["expo-dev-client"], undefined);
  assert.equal(packageManifest.dependencies["@react-native-firebase/auth"], undefined);
  assert.match(packageManifest.scripts["android:sandbox:prebuild"] ?? "", /npm ci --omit=optional/u);
  assert.match(packageManifest.scripts["android:sandbox"] ?? "", /android:sandbox:prebuild/u);
  assert.match(packageManifest.scripts["android:sandbox"] ?? "", /NODE_ENV=production/u);
  assert.match(packageManifest.scripts["android:sandbox"] ?? "", /PATTERNLY_ANDROID_SANDBOX=1/u);
  assert.match(packageManifest.scripts["android:sandbox"] ?? "", /assembleSandbox/u);
  assert.match(gradleProperties, /^newArchEnabled=true$/mu);
  assert.match(gradle, /debuggableVariants = \["debug", "debugOptimized"\]/u);
  assert.match(gradle, /bundleCommand = "export:embed"/u);
  assert.match(gradle, /sandbox \{[\s\S]*?debuggable false/u);
  assert.match(gradle, /entryFile = file\(\["node", "-e", "require\('expo\/scripts\/resolveAppEntry'\)/u);
  assert.doesNotMatch(androidManifest, /expo\.modules\.devlauncher/u);
  assert.match(metroConfig, /metro-sandbox-endpoint-transformer/u);
});

test("sandbox Metro boundary removes local endpoint literals and comments from transformed dependencies", () => {
  const babel = require("@babel/core") as { parseSync: (source: string, options: Record<string, unknown>) => unknown; transformFromAstSync: (ast: unknown, source: string, options: Record<string, unknown>) => { code?: string } | null };
  const metroTransformer = require("../metro-sandbox-endpoint-transformer.js") as {
    sanitizeSandboxAst: (ast: unknown) => unknown;
  };
  const source = '// http://localhost:8081\nconst auth = "http://localhost"; const loopback = "127.0.0.1"; const devClient = "expo-development-client";';
  const ast = babel.parseSync(source, { sourceType: "module" });
  const transformed = babel.transformFromAstSync(metroTransformer.sanitizeSandboxAst(ast), source, { ast: false, babelrc: false, comments: true, configFile: false })?.code ?? "";
  assert.doesNotMatch(transformed, /localhost|127\.0\.0\.1|expo-development-client|:8081/u);
  assert.match(transformed, /patternly-app-sandbox\.firebaseapp\.com/u);
});

test("sandbox Gradle variant is standalone and uses only the local debug identity", () => {
  const transformed = injectAndroidSandboxVariant(generatedGradle);
  assert.match(transformed, new RegExp(ANDROID_SANDBOX_VARIANT_MARKER, "u"));
  assert.deepEqual(DEBUGGABLE_VARIANTS, ["debug", "debugOptimized"]);
  assert.match(transformed, /debuggableVariants = \["debug", "debugOptimized"\]/u);

  const sandboxBuildType = transformed.slice(transformed.indexOf(`        ${ANDROID_SANDBOX_VARIANT_NAME} {`));
  assert.match(sandboxBuildType, /initWith release/u);
  assert.match(sandboxBuildType, /matchingFallbacks = \["release", "debug"\]/u);
  assert.match(sandboxBuildType, /signingConfig signingConfigs\.debug/u);
  assert.match(sandboxBuildType, /debuggable false/u);
  assert.match(sandboxBuildType, /minifyEnabled true/u);
  assert.match(sandboxBuildType, /shrinkResources true/u);
  assert.doesNotMatch(sandboxBuildType, /credentials\.json|eas-build\.gradle|PATTERNLY_ANDROID_RELEASE_/u);
  assert.match(transformed, new RegExp(ANDROID_SANDBOX_BUNDLE_GUARD_MARKER, "u"));
  assert.match(transformed, /patternlyTask\.name == "packageSandbox"/u);
  assert.match(transformed, /generated\/assets\/react\/sandbox\/index\.android\.bundle/u);
  assert.deepEqual(FORBIDDEN_SANDBOX_BUNDLE_ENDPOINTS, ["localhost", "127.0.0.1", "10.0.2.2", ":8081", "expo-development-client"]);
});

test("sandbox Gradle injection is idempotent", () => {
  const once = injectAndroidSandboxVariant(generatedGradle);
  assert.equal(injectAndroidSandboxVariant(once), once);
});
