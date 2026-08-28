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
  assert.match(screen, /ambientVariant\?: "default" \| "activity" \| "goal" \| "auth"/);
  assert.match(screen, /ambient \? <AmbientBackdrop variant=\{ambientVariant\} \/> : null/);
  assert.match(backdrop, /matrix\(16 0 0 14 160 140\)/);
  assert.match(backdrop, /matrix\(16 0 0 15 160 150\)/);
  assert.match(backdrop, /matrix\(32 0 0 28 160 140\)/);
  assert.match(backdrop, /matrix\(32 0 0 28 224 196\)/);
  assert.match(backdrop, /glowOpacity = variant === "goal" \? 0\.06 : variant === "activity" \? 0\.04/);
  assert.match(backdrop, /backgroundColor: ambient\.canvas/);
  assert.match(backdrop, /Topography/);
  assert.match(selectTrack, /<Screen\s+ambient=\{colorMode === "dark"\}/);
  assert.match(practice, /<Screen ambient=\{colorMode === "dark"\} edges=/);
  assert.match(activity, /<Screen ambient=\{colorMode === "dark"\} ambientVariant="activity"/);
  assert.match(source("src/features/home/GoalCadenceScreen.tsx"), /ambientVariant="goal"/);
  assert.match(backdrop, /variant === "default" \?/);
  assert.match(backdrop, /if \(variant === "auth"\)/);
  assert.match(backdrop, /<SignalPulse delay=\{400\} direction="down" length=\{154\} x=\{14\} y=\{60\} \/>/);
  assert.match(backdrop, /<Line stroke=\{effects\.authSignal\} strokeWidth=\{1\} x1=\{14\} x2=\{14\} y1=\{60\} y2=\{166\}/);
  assert.match(backdrop, /useNativeDriver: true/);
  assert.match(topography, /id="contour 4"/);
});
