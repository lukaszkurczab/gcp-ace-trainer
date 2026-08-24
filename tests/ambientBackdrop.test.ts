import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (path: string) => readFileSync(path, "utf8");

test("dark Figma ambient layer is shared by Track selection and Practice", () => {
  const screen = source("src/components/Screen.tsx");
  const backdrop = source("src/components/AmbientBackdrop.tsx");
  const selectTrack = source("src/features/home/SelectTrackScreen.tsx");
  const practice = source("src/features/practice/PracticeHubScreen.tsx");
  const activity = source("src/features/home/ActivityScreen.tsx");
  const topography = source("src/assets/ambient/topography.svg");

  assert.match(screen, /ambient\?: boolean/);
  assert.match(screen, /ambientVariant\?: "default" \| "activity"/);
  assert.match(screen, /ambient \? <AmbientBackdrop variant=\{ambientVariant\} \/> : null/);
  assert.match(backdrop, /matrix\(16 0 0 14 160 140\)/);
  assert.match(backdrop, /matrix\(16 0 0 15 160 150\)/);
  assert.match(backdrop, /backgroundColor: "#081328"/);
  assert.match(backdrop, /Topography/);
  assert.match(selectTrack, /<Screen\s+ambient=\{colorMode === "dark"\}/);
  assert.match(practice, /<Screen ambient=\{colorMode === "dark"\} edges=/);
  assert.match(activity, /<Screen ambient=\{colorMode === "dark"\} ambientVariant="activity"/);
  assert.match(backdrop, /variant === "activity" \? null/);
  assert.match(topography, /id="contour 4"/);
});
