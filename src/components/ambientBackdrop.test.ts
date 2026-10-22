import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = (path: string) => readFileSync(path, "utf8");

const jsxOpenings = (text: string, tagName: string): readonly string[] => {
  const file = ts.createSourceFile("screen.tsx", text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const openings: string[] = [];
  const visit = (node: ts.Node): void => {
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && node.tagName.getText(file) === tagName) {
      openings.push(node.getText(file));
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return openings;
};

test("route ambient layer is the default shared background for every Screen", () => {
  const screen = source("src/components/Screen.tsx");
  const backdrop = source("src/components/AmbientBackdrop.tsx");
  const selectTrack = source("src/features/home/SelectTrackScreen.tsx");
  const practice = source("src/features/practice/PracticeHubScreen.tsx");
  const activity = source("src/features/home/ActivityView.tsx");

  assert.match(screen, /ambient\?: boolean/);
  assert.match(screen, /ambientVariant\?: "default" \| "activity" \| "goal" \| "auth"/);
  assert.match(screen, /ambient = true/);
  assert.match(screen, /ambient \? <AmbientBackdrop variant=\{ambientVariant\} \/> : null/);
  assert.match(backdrop, /backgroundColor: palette\.ambient\.canvas/);
  assert.match(backdrop, /useThemedStyles\(createStyles\)/);
  assert.doesNotMatch(backdrop, /RadialGradient|<Rect|Topography|glowOpacity/);
  assert.doesNotMatch(selectTrack, /ambient=\{colorMode === "dark"\}/);
  assert.doesNotMatch(practice, /ambient=\{colorMode === "dark"\}/);
  const activityScreens = jsxOpenings(activity, "Screen");
  assert.equal(activityScreens.length, 3, "loading, error and populated Activity keep the shared backdrop");
  for (const opening of activityScreens) {
    assert.match(opening, /\bambientVariant="activity"/);
    assert.ok(!/\sambient=/.test(opening) || /\sambient=\{true\}/.test(opening), "ambient is explicitly true or uses the shared true default");
  }
  assert.match(source("src/features/home/GoalCadenceScreen.tsx"), /ambientVariant="goal"/);
  assert.match(backdrop, /transparent=\{variant !== "auth"\}/);
});

test("ambient keeps randomized routes and signals without rectangular glow layers", () => {
  const backdrop = source("src/components/AmbientBackdrop.tsx");
  const account = source("src/features/account/AccountEntryScreen.tsx");

  const authScreens = jsxOpenings(account, "Screen").filter((opening) => /\bambientVariant="auth"/.test(opening));
  assert.equal(authScreens.length, 3, "auth form, registration and status keep the auth backdrop");
  for (const opening of authScreens) {
    assert.ok(!/\sambient=/.test(opening) || /\sambient=\{true\}/.test(opening), "ambient is explicitly true or uses the shared true default");
  }
  assert.match(backdrop, /type AmbientRoute/);
  assert.match(backdrop, /const AUTH_ROUTES: readonly AmbientRoute\[\]/);
  assert.ok((backdrop.match(/id: "[^"]+", points:/g) ?? []).length >= 10);
  assert.match(backdrop, /const ROUTE_VARIANTS = \[/);
  assert.match(backdrop, /<Polyline[\s\S]*points=\{route\.points/);
  assert.match(backdrop, /<RouteSignal opacity=\{opacity\} progress=\{progress\} route=\{activeRoute\}/);
  assert.match(backdrop, /TRAIL_OFFSETS\.map/);
  assert.match(backdrop, /AccessibilityInfo\.isReduceMotionEnabled\(\)/);
  assert.match(backdrop, /shouldAnimate \? <RouteSignal/);
  assert.match(backdrop, /pointerEvents="none"/);
  assert.match(backdrop, /importantForAccessibility="no-hide-descendants"/);
  assert.doesNotMatch(backdrop, /RadialGradient|<Rect|Topography/);
});
