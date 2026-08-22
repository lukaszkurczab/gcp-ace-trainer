import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("src/features/simulation/SimulationSessionSurface.tsx", "utf8");

test("active simulation surface fills the viewport and keeps navigator presentation outside the approved active screen", () => {
  assert.match(source, /<View style=\{styles\.root\} testID=/);
  assert.match(source, /root: \{ flex: 1 \}/);
  assert.match(source, /layout=\{savedResponse \? "simulationSaved" : "simulation"\}/);
  assert.match(source, /onPositionPress=\{projection\.state === "editable"/);
  assert.match(source, /actionBar: \{ gap: spacing\.sm, width: "100%" \}/);
  assert.match(source, /questionCard: \{ backgroundColor: "transparent", borderWidth: 0, padding: 0 \}/);
  assert.match(source, /styles\.questionLabel[\s\S]*t\("QUESTION"\)/);
  assert.match(source, /<SimulationQuestionNavigator onDismiss=/);
  assert.match(source, /visible=\{navigatorVisible\}/);
});
