import assert from "node:assert/strict";
import test from "node:test";

import { colors } from "./tokens";

function relativeLuminance(hexColor: string): number {
  const normalized = hexColor.slice(1);
  assert.equal(normalized.length, 6, `Expected a six-digit hex color: ${hexColor}`);
  const redChannel = Number.parseInt(normalized.slice(0, 2), 16) / 255;
  const greenChannel = Number.parseInt(normalized.slice(2, 4), 16) / 255;
  const blueChannel = Number.parseInt(normalized.slice(4, 6), 16) / 255;
  const red = redChannel <= 0.03928 ? redChannel / 12.92 : ((redChannel + 0.055) / 1.055) ** 2.4;
  const green = greenChannel <= 0.03928 ? greenChannel / 12.92 : ((greenChannel + 0.055) / 1.055) ** 2.4;
  const blue = blueChannel <= 0.03928 ? blueChannel / 12.92 : ((blueChannel + 0.055) / 1.055) ** 2.4;
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

test("onDanger keeps destructive button text above normal-text contrast in both themes", () => {
  const minimumNormalTextContrast = 4.5;

  assert.equal(colors.light.onDanger, "#FFFFFF");
  assert.equal(colors.dark.onDanger, "#081328");
  assert.ok(contrastRatio(colors.light.onDanger, colors.light.danger) >= minimumNormalTextContrast);
  assert.ok(contrastRatio(colors.dark.onDanger, colors.dark.danger) >= minimumNormalTextContrast);
});
