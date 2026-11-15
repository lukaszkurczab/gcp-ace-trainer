/**
 * T2.5 stage 3: the native first screen's generated inputs stay in step with the React Native sources
 * (tokens, native-only strings, icons), and the whole Swift module typechecks for the iOS simulator SDK.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

import { checkGenerated, renderStrings, renderTokens } from "../../../scripts/generateFirstScreenNative.mjs";
import * as tokens from "../../theme/tokens";

const ROOT = path.resolve(__dirname, "../../..");
const IOS = path.join(ROOT, "native/first-screen/ios");
const iosSdk = process.platform === "darwin" && spawnSync("xcrun", ["--sdk", "iphonesimulator", "--show-sdk-path"], { stdio: "ignore" }).status === 0;

test("generated tokens, strings and icons match the React Native sources", async () => {
  assert.deepEqual(await checkGenerated(), [], "run: node --import tsx scripts/generateFirstScreenNative.mjs");
});

test("tokens keep light and dark palettes in the same shape, with every color parsed", () => {
  const swift = renderTokens(tokens);
  assert.match(swift, /public static let light = FirstScreenPalette\(/u);
  assert.match(swift, /navigationActive: FirstScreenRGBA\(r: 15, g: 118, b: 110, a: 1\)/u);
  assert.match(swift, /effectsDivider: FirstScreenRGBA\(r: 255, g: 255, b: 255, a: 0.06\)/u);
  assert.throws(() => renderTokens({ ...tokens, colors: { light: tokens.colors.light, dark: { ...tokens.colors.dark, extra: "#000000" } } }), /differ in shape/u);
});

test("every app locale has the native-only strings; English is the fallback", () => {
  const swift = renderStrings((locale: string) => locale === "en" ? { "Loading…": "Loading…", "Opening…": "Opening…" } : { "Loading…": `L-${locale}`, "Opening…": `O-${locale}` });
  assert.match(swift, /case "pl": return FirstScreenNativeStrings\(loading: "L-pl", opening: "O-pl"\)/u);
  assert.match(swift, /default: return FirstScreenNativeStrings\(loading: "Loading…", opening: "Opening…"\)/u);
  assert.throws(() => renderStrings((locale: string) => locale === "et" ? { "Loading…": "x" } : { "Loading…": "x", "Opening…": "y" }), /missing et common:Opening…/u);
});

test("the Swift module typechecks for the iOS simulator (deployment target 16.4)", { skip: !iosSdk && "iOS simulator SDK not available" }, () => {
  const files = readdirSync(IOS).filter((name) => name.endsWith(".swift")).map((name) => path.join(IOS, name));
  assert.ok(files.length >= 7);
  const result = spawnSync("xcrun", ["-sdk", "iphonesimulator", "swiftc", "-typecheck", "-target", "arm64-apple-ios16.4-simulator", ...files], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
});
