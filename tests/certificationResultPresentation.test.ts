import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("src/features/exam/ResultScreen.tsx", "utf8");

test("certification result distinguishes an empty ending and presents truthful session metrics", () => {
  assert.match(source, /Promise\.all\(\[useCases\.loadSummary\(route\.params\.sessionId\), useCases\.loadSessionRecord\(route\.params\.sessionId\)\]\)/);
  assert.match(source, /noAnswersSubmitted \? "Session ended without answers"/);
  assert.match(source, /session\.requestedLength/);
  assert.match(source, /session\.actualLength/);
  assert.match(source, /answeredCount/);
  assert.match(source, /result\.unansweredOccurrenceIds\.length/);
  assert.match(source, /formatElapsed\(session\.activeForegroundMs\)/);
  assert.match(source, /formatMode\(session\.modeId\)/);
  assert.match(source, /formatDomains\(session\.configurationSnapshot\.sectionPresentation\)/);
  assert.match(source, /function formatDomains\(value: unknown\)/);
  assert.match(source, /return "Not recorded"/);
});
