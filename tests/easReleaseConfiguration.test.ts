import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const app = JSON.parse(readFileSync("app.json", "utf8")).expo as {
  version: string;
  runtimeVersion?: { policy?: string };
  ios?: { buildNumber?: string };
  android?: { versionCode?: number };
};
const eas = JSON.parse(readFileSync("eas.json", "utf8")) as {
  cli: { version: string; appVersionSource: string; requireCommit: boolean };
  build: Record<string, { developmentClient?: boolean; distribution: string; channel: string; autoIncrement?: boolean }>;
};
const easIgnore = readFileSync(".easignore", "utf8");

test("EAS release configuration has explicit version, runtime, and channel policy", () => {
  assert.equal(app.version, "0.1.0");
  assert.deepEqual(app.runtimeVersion, { policy: "appVersion" });
  assert.equal(app.ios?.buildNumber, "1");
  assert.equal(app.android?.versionCode, 1);
  assert.equal(eas.cli.appVersionSource, "local");
  assert.equal(eas.cli.requireCommit, true);
  assert.match(eas.cli.version, /^>= /u);

  assert.deepEqual(eas.build, {
    development: { developmentClient: true, distribution: "internal", channel: "development" },
    preview: { distribution: "internal", channel: "preview" },
    production: { distribution: "store", channel: "production", autoIncrement: true },
  });
});

test("EAS source archives exclude generated native output, artifacts, and credentials", () => {
  for (const entry of ["node_modules/", ".expo/", "dist/", "web-build/", "android/", "ios/", "artifacts/"]) {
    assert.match(easIgnore, new RegExp(`^${entry.replace(/[./]/g, "\\$&")}$`, "mu"));
  }
  for (const pattern of ["*.jks", "*.p8", "*.p12", "*.key", "*.mobileprovision", ".env", ".env.*"]) {
    assert.match(easIgnore, new RegExp(`^${pattern.replace(/[.*]/g, "\\$&")}$`, "mu"));
  }
  assert.doesNotMatch(easIgnore, /PATTERNLY_[A-Z0-9_]+=|BEGIN (?:PRIVATE|OPENSSH) KEY/u);
});
