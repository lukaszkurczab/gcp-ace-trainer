import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (path: string) => readFileSync(path, "utf8");

test("route ambient layer is the default shared background for every Screen", () => {
  const screen = source("src/components/Screen.tsx");
  const backdrop = source("src/components/AmbientBackdrop.tsx");
  const selectTrack = source("src/features/home/SelectTrackScreen.tsx");
  const practice = source("src/features/practice/PracticeHubScreen.tsx");
  const activity = source("src/features/home/ActivityScreen.tsx");

  assert.match(screen, /ambient\?: boolean/);
  assert.match(screen, /ambientVariant\?: "default" \| "activity" \| "goal" \| "auth"/);
  assert.match(screen, /ambient = true/);
  assert.match(screen, /ambient \? <AmbientBackdrop variant=\{ambientVariant\} \/> : null/);
  assert.match(backdrop, /backgroundColor: palette\.ambient\.canvas/);
  assert.match(backdrop, /useThemedStyles\(createStyles\)/);
  assert.doesNotMatch(backdrop, /RadialGradient|<Rect|Topography|glowOpacity/);
  assert.doesNotMatch(selectTrack, /ambient=\{colorMode === "dark"\}/);
  assert.doesNotMatch(practice, /ambient=\{colorMode === "dark"\}/);
  assert.match(activity, /<Screen ambientVariant="activity"/);
  assert.match(source("src/features/home/GoalCadenceScreen.tsx"), /ambientVariant="goal"/);
  assert.match(backdrop, /transparent=\{variant !== "auth"\}/);
});

test("ambient keeps randomized routes and signals without rectangular glow layers", () => {
  const backdrop = source("src/components/AmbientBackdrop.tsx");
  const account = source("src/features/account/AccountEntryScreen.tsx");

  assert.match(account, /<Screen ambient ambientVariant="auth"/);
  assert.match(backdrop, /type AmbientRoute/);
  assert.match(backdrop, /const AUTH_ROUTES: readonly AmbientRoute\[\]/);
  assert.ok((backdrop.match(/id: "[^"]+", points:/g) ?? []).length >= 10);
  assert.match(backdrop, /const ROUTE_VARIANTS = \[/);
  assert.match(backdrop, /<Polyline[\s\S]*points=\{route\.points/);
  assert.match(backdrop, /<RouteSignal opacity=\{opacity\} progress=\{progress\} route=\{activeRoute\}/);
  assert.match(backdrop, /TRAIL_OFFSETS\.map/);
  assert.match(backdrop, /AccessibilityInfo\.isReduceMotionEnabled\(\)/);
  assert.match(backdrop, /reduceMotion === false \? <RouteSignal/);
  assert.match(backdrop, /pointerEvents="none"/);
  assert.match(backdrop, /importantForAccessibility="no-hide-descendants"/);
  assert.doesNotMatch(backdrop, /RadialGradient|<Rect|Topography/);
});
