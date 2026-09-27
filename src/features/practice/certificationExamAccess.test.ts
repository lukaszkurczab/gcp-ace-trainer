import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

import { resolveCertificationExamAccess } from "./certificationExamAccess";

test("certification exam premium admission maps each outcome explicitly", () => {
  assert.equal(resolveCertificationExamAccess("allowed"), "startExam");
  assert.equal(resolveCertificationExamAccess("denied"), "purchasePremium");
  assert.equal(resolveCertificationExamAccess("unavailable"), "retryAdmission");
});

test("Practice Hub keeps the exam offer visible and routes each admission outcome", () => {
  const hub = readFileSync("src/features/practice/PracticeHubScreen.tsx", "utf8");

  assert.match(hub, /usePatternlyAccount\(\)/);
  assert.match(hub, /authorizePremiumSessionStart\(\)/);
  assert.match(hub, /resolveCertificationExamAccess\(admission\)/);
  assert.match(hub, /case "startExam":\s*navigation\.navigate\(ROUTES\.EXAM\)/);
  assert.match(hub, /case "purchasePremium":\s*navigation\.navigate\(ROUTES\.PREMIUM_PURCHASE\)/);
  assert.match(hub, /case "retryAdmission":\s*setExamAccessUnavailable\(true\)/);
  assert.match(hub, /examAdmissionPendingRef\.current/);
  assert.match(hub, /authorizePremiumSessionStart\(\)[\s\S]*?catch[\s\S]*?setExamAccessUnavailable\(true\)/);
  assert.match(hub, /mode\.mode === "certification-exam-simulation"/);
  assert.match(hub, /<InfoBlock[\s\S]*?accessibilityAlert[\s\S]*?testID="practice-exam-access-error"/);
  assert.match(hub, /<Button[\s\S]*?onPress=\{\(\) => startSession\("certification-exam-simulation"\)\}[\s\S]*?\{t\("Try again"\)\}/);
});
