import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("src/features/simulation/SimulationSessionSurface.tsx", "utf8");

test("active simulation surface fills the viewport and keeps navigator presentation outside the approved active screen", () => {
  assert.match(source, /<View style=\{styles\.root\} testID=/);
  assert.match(source, /root: \{ flex: 1 \}/);
  assert.match(source, /projection\.state === "editable" \? activeQuestionLabel\(projection\.position\?\.label\) : projection\.title/);
  assert.match(source, /actionBar: \{ flexDirection: "row", gap: spacing\.sm \}/);
  assert.match(source, /questionCard: \{ backgroundColor: "transparent", borderWidth: 0, padding: 0 \}/);
  assert.match(source, /<SimulationQuestionNavigator onDismiss=/);
  assert.match(source, /visible=\{navigatorVisible\}/);
});
