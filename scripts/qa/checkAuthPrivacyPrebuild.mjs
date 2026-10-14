import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cpSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { localProfilePath, parseDotenv, validateLocalProfile } from "../runLocalProfile.mjs";

// Generate a clean smoke iOS project in a disposable directory. Never touch the
// workspace's native project, installed app, credentials or simulator data.
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(import.meta.url);
const environment = validateLocalProfile("smoke", parseDotenv(readFileSync(localProfilePath("smoke", root), "utf8")));
const { createExpoConfig } = require("../../app.config.js");
const { default: plist } = require("@expo/plist");
const config = createExpoConfig(environment);
const directory = mkdtempSync(join(tmpdir(), "patternly-auth-prebuild-"));
for (const path of ["package.json", "package-lock.json", "plugins", "assets", "GoogleService-Info.plist", "google-services.json"]) {
  cpSync(join(root, path), join(directory, path), { recursive: true });
}
symlinkSync(join(root, "node_modules"), join(directory, "node_modules"), "dir");
writeFileSync(join(directory, "app.json"), JSON.stringify(config));
const result = spawnSync(process.execPath, [join(root, "node_modules/expo/bin/cli"), "prebuild", "--no-install", "--clean", "--platform", "ios"], {
  cwd: directory,
  env: { ...process.env, ...environment, CI: "1", EXPO_NO_DOTENV: "1" },
  encoding: "utf8",
  timeout: 180_000,
});
writeFileSync(join(directory, "prebuild.log"), `${result.stdout ?? ""}\n${result.stderr ?? ""}`);
if (result.status !== 0) throw new Error(`auth_privacy_prebuild_failed: inspect ${join(directory, "prebuild.log")}`);
const infoPath = join(directory, "ios/Patternly/Info.plist");
const infoSource = readFileSync(infoPath, "utf8");
const info = plist.parse(infoSource);
assert.equal("NSFaceIDUsageDescription" in info, false);
const entitlements = plist.parse(readFileSync(join(directory, "ios/Patternly/Patternly.entitlements"), "utf8"));
assert.equal("aps-environment" in entitlements, false);
const privacy = plist.parse(readFileSync(join(directory, "ios/Patternly/PrivacyInfo.xcprivacy"), "utf8"));
// Google still supplies profile scopes; do not conceal its possible Name data.
assert.ok(privacy.NSPrivacyCollectedDataTypes.some((entry) => entry.NSPrivacyCollectedDataType === "NSPrivacyCollectedDataTypeName"));
console.log(JSON.stringify({
  result: "PASS", runtime: "smoke", infoPlist: infoPath,
  infoPlistSha256: createHash("sha256").update(infoSource).digest("hex"),
  faceIDPurposePresent: false, nameDeclarationPresent: true,
  installedOrBuilt: false,
}));
