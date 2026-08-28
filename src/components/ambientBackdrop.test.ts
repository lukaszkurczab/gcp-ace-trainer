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
  assert.match(backdrop, /backgroundColor: palette\.ambient\.canvas/);
  assert.match(backdrop, /useThemedStyles\(createStyles\)/);
  assert.match(backdrop, /Topography/);
  assert.match(selectTrack, /<Screen\s+ambient=\{colorMode === "dark"\}/);
  assert.match(practice, /<Screen ambient=\{colorMode === "dark"\} edges=/);
  assert.match(activity, /<Screen ambient=\{colorMode === "dark"\} ambientVariant="activity"/);
  assert.match(source("src/features/home/GoalCadenceScreen.tsx"), /ambientVariant="goal"/);
  assert.match(backdrop, /variant === "default" \?/);
});

test("auth ambient uses one responsive route-bound signal with reduced-motion support", () => {
  const backdrop = source("src/components/AmbientBackdrop.tsx");
  const account = source("src/features/account/AccountEntryScreen.tsx");

  assert.match(account, /<Screen ambient ambientVariant="auth"/);
  assert.match(backdrop, /type AmbientRoute/);
  assert.match(backdrop, /const AUTH_ROUTES: readonly AmbientRoute\[\]/);
  assert.match(backdrop, /AUTH_ROUTES\.map\(\(route\) => measureRoute\(route, width, height\)\)/);
  assert.match(backdrop, /<Polyline[\s\S]*points=\{route\.points/);
  assert.match(backdrop, /<RouteSignal opacity=\{opacity\} progress=\{progress\} route=\{activeRoute\}/);
  assert.match(backdrop, /TRAIL_OFFSETS\.map/);
  assert.match(backdrop, /route\.progress/);
  assert.match(backdrop, /AccessibilityInfo\.isReduceMotionEnabled\(\)/);
  assert.match(backdrop, /AccessibilityInfo\.addEventListener\("reduceMotionChanged", setReduceMotion\)/);
  assert.match(backdrop, /reduceMotion === false \? <RouteSignal/);
  assert.match(backdrop, /pointerEvents="none"/);
  assert.match(backdrop, /importantForAccessibility="no-hide-descendants"/);
  assert.match(backdrop, /useWindowDimensions\(\)/);
  assert.match(backdrop, /useNativeDriver: true/);
  assert.doesNotMatch(backdrop, /Math\.random|height=\{880\}|width=\{360\}|<SignalPulse|<Line /);
  assert.equal((backdrop.match(/<RouteSignal /g) ?? []).length, 1);
});
