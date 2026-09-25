import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./PracticeSetupScreen.tsx", import.meta.url), "utf8");

test("Premium offer stacks copy and actions instead of squeezing copy beside the action", () => {
  assert.match(source, /style=\{\[styles\.reviewCard, styles\.premiumOfferCard\]\}/u);
  assert.match(source, /premiumOfferCard:\s*\{[\s\S]*?alignItems: "stretch",[\s\S]*?flexDirection: "column",[\s\S]*?gap: spacing\.md,/u);
});
