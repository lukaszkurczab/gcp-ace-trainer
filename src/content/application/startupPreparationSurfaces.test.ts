import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { colors } from "../../theme/tokens";
function luminance(hex: string) {
  const rgb = hex.slice(1).match(/../g)!.map(value => parseInt(value, 16) / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * rgb[0]! + 0.7152 * rgb[1]! + 0.0722 * rgb[2]!;
}
test("F01 unavailable descriptions use readable secondary text without changing other EmptyState consumers", () => {
  const presentation = readFileSync("src/content/application/startupPreparationSurfaces.tsx", "utf8");
  assert.equal((presentation.match(/<EmptyState descriptionTone="secondary"/g) ?? []).length, 2);
  const empty = readFileSync("src/components/EmptyState.tsx", "utf8");
  assert.match(empty, /descriptionTone = "muted"/);
  assert.match(empty, /descriptionSecondary: \{ color: palette.textSecondary \}/);
  assert.match(empty, /color: palette.emptyState.textMuted/);
  for (const mode of ["light", "dark"] as const) {
    const foreground = luminance(colors[mode].textSecondary), background = luminance(colors[mode].background);
    assert.ok((Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05) >= 4.5, mode);
  }
});
