import { readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";

const testsDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = join(testsDirectory, "..");
const markDirectory = join(repositoryRoot, "src/assets/brand/mark");
const appIconSourceDirectory = join(repositoryRoot, "src/assets/brand/app-icon");
const appIconOutputDirectory = join(repositoryRoot, "assets/brand/app-icon");

const markFiles = [
  "patternly-mark-navy.svg",
  "patternly-mark-mint.svg",
  "patternly-mark-black.svg",
  "patternly-mark-white.svg",
];

const microMarkFiles = [
  "patternly-mark-navy-micro.svg",
  "patternly-mark-mint-micro.svg",
  "patternly-mark-black-micro.svg",
  "patternly-mark-white-micro.svg",
];

const appIconSourceFiles = [
  "patternly-app-icon.svg",
  "patternly-app-icon-foreground.svg",
  "patternly-app-icon-monochrome.svg",
];

const appIconOutputFiles = [
  "patternly-app-icon.png",
  "patternly-app-icon-foreground.png",
  "patternly-app-icon-monochrome.png",
];

const qaAMasterPathFragments = ["M102 228", "M131 24H175.84", "M78.80 24H119.90"];

function readText(path: string) {
  return readFileSync(path, "utf8");
}

function assertNonEmptyFile(path: string) {
  assert.ok(statSync(path).size > 0, `${path} must not be empty`);
}

function pathData(source: string) {
  return [...source.matchAll(/<path\b[^>]*\bd="([^"]+)"/g)].flatMap((match) => match[1] ? [match[1]] : []);
}

test("Patternly mark SVG family stays deterministic and raster-free", () => {
  let canonicalGeometry: string[] | undefined;

  for (const file of markFiles) {
    const path = join(markDirectory, file);
    const source = readText(path);

    assertNonEmptyFile(path);
    assert.match(source, /viewBox="0 0 256 256"/);
    assert.equal((source.match(/<path\b/g) ?? []).length, 4);
    assert.doesNotMatch(source, /<(?:text|image|filter|mask|clipPath)\b/i);
    assert.doesNotMatch(source, /\btransform=/i);
    for (const fragment of qaAMasterPathFragments) assert.match(source, new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

    const geometry = pathData(source);
    canonicalGeometry ??= geometry;
    assert.deepEqual(geometry, canonicalGeometry);
  }
});

test("launcher source and generated assets are present", () => {
  for (const file of appIconSourceFiles) {
    const path = join(appIconSourceDirectory, file);
    const source = readText(path);

    assertNonEmptyFile(path);
    assert.equal((source.match(/<path\b/g) ?? []).length, 4);
    assert.doesNotMatch(source, /<(?:text|image|filter|mask|clipPath)\b/i);
    assert.doesNotMatch(source, /\btransform=/i);
  }

  assert.deepEqual(pathData(readText(join(appIconSourceDirectory, "patternly-app-icon.svg"))), pathData(readText(join(markDirectory, "patternly-mark-mint.svg"))));

  for (const file of appIconOutputFiles) {
    assertNonEmptyFile(join(appIconOutputDirectory, file));
  }

  assertNonEmptyFile(join(repositoryRoot, "assets/brand/web/favicon.png"));
});

test("sanctioned micro mark family has one distinct optical geometry", () => {
  let canonicalMaster: string[] | undefined;
  let canonicalMicro: string[] | undefined;

  for (const file of markFiles) {
    canonicalMaster ??= pathData(readText(join(markDirectory, file)));
  }

  for (const file of microMarkFiles) {
    const path = join(markDirectory, file);
    const source = readText(path);
    assertNonEmptyFile(path);
    assert.match(source, /viewBox="0 0 256 256"/);
    assert.equal((source.match(/<path\b/g) ?? []).length, 4);
    assert.doesNotMatch(source, /<(?:text|image|filter|mask|clipPath)\b/i);
    assert.doesNotMatch(source, /\btransform=/i);
    const geometry = pathData(source);
    canonicalMicro ??= geometry;
    assert.deepEqual(geometry, canonicalMicro);
  }

  assert.notDeepEqual(canonicalMicro, canonicalMaster);
});

test("Expo points to the canonical Patternly launcher assets", () => {
  const appConfig = JSON.parse(readText(join(repositoryRoot, "app.json"))) as {
    expo: {
      icon?: string;
      android?: {
        adaptiveIcon?: {
          foregroundImage?: string;
          backgroundColor?: string;
          monochromeImage?: string;
        };
      };
      web?: {
        favicon?: string;
        themeColor?: string;
        backgroundColor?: string;
      };
    };
  };

  assert.equal(appConfig.expo.icon, "./assets/brand/app-icon/patternly-app-icon.png");
  assert.deepEqual(appConfig.expo.android?.adaptiveIcon, {
    foregroundImage: "./assets/brand/app-icon/patternly-app-icon-foreground.png",
    backgroundColor: "#0C1324",
    monochromeImage: "./assets/brand/app-icon/patternly-app-icon-monochrome.png",
  });
  assert.deepEqual(appConfig.expo.web, {
    favicon: "./assets/brand/web/favicon.png",
    themeColor: "#0C1324",
    backgroundColor: "#F6F8FB",
  });
});
