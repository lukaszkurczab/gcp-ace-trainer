import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("src/features/practice/PracticeFeedbackBlock.tsx", "utf8");
const certificationSession = readFileSync("src/features/practice/CertificationPracticeSessionScreen.tsx", "utf8");
const algorithmsSession = readFileSync("src/features/practice/PracticeSessionScreen.tsx", "utf8");
const designSession = readFileSync("src/features/practice/DesignInterviewPracticeScreen.tsx", "utf8");

test("source links expose exact targets and unavailable has no press handler", () => {
  assert.match(source, /feedback\.sources\?\.length \? feedback\.sources\.map/);
  assert.match(source, /accessibilityRole="link"/);
  assert.match(source, /openCanonicalSourceLink\(source, Linking\.openURL\)/);
  assert.match(source, /source\.host/);
  assert.match(source, /: <Text maxFontSizeMultiplier=\{2\} style=\{styles\.sourceUnavailable\}>\{t\("Source unavailable"\)\}<\/Text>/);
  assert.doesNotMatch(source, /canOpenURL|google\.com\/search|fallback/i);
});

test("source open failure is explicit and never changes answer or report state", () => {
  assert.match(source, /setSourceError\(result === "failed"\)/);
  assert.match(source, /accessibilityRole="alert"/);
  assert.doesNotMatch(source, /submit|response|scoreCanonicalQuestion/);
});

test("every canonical practice session preserves projected sources at the shared feedback boundary", () => {
  assert.match(certificationSession, /sources: feedback\.sources/);
  assert.match(algorithmsSession, /sources: projection\.feedback\.sources/);
  assert.match(designSession, /sources: projection\.feedback\.sources/);
});
