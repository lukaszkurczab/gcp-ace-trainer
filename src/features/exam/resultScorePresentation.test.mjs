import assert from "node:assert/strict";
import test from "node:test";

import { runActualResultScreen } from "./resultScorePresentationTestHarness.mjs";

test("actual Certification Practice result presents derived overall points and the existing partial diagnostic", async () => {
  const rendered = await runActualResultScreen();
  assert.match(rendered.text, /11\s+\/\s+22/);
  assert.doesNotMatch(rendered.text, /15\s+\/\s+22/);
  assert.match(rendered.text, /7\s+\/\s+10/);
  assert.match(rendered.text, /Correct 7/);
  assert.match(rendered.text, /Partly correct 1/);
  assert.match(rendered.text, /Incorrect 2/);
  assert.match(rendered.text, /Partly correct/);
  assert.match(rendered.text, /Session complete/);
});

test("an unavailable optional practice-points projection preserves counts and omits weighted points", async () => {
  const rendered = await runActualResultScreen({ projectionFails: true });
  assert.match(rendered.text, /7\s+\/\s+10/);
  assert.match(rendered.text, /Correct 7/);
  assert.match(rendered.text, /Partly correct 1/);
  assert.match(rendered.text, /Incorrect 2/);
  assert.match(rendered.text, /Partly correct/);
  assert.doesNotMatch(rendered.text, /Weighted points/);
  assert.doesNotMatch(rendered.text, /Session summary unavailable/);
});

test("generic history without compatible verified points does not render its raw weighted aggregate", async () => {
  const rendered = await runActualResultScreen({ genericMode: true });
  assert.match(rendered.text, /1\s+\/\s+2/);
  assert.match(rendered.text, /Partly correct/);
  assert.doesNotMatch(rendered.text, /Weighted points/);
});
