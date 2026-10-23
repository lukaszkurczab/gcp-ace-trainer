import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("src/features/account/AccountEntryScreen.tsx", "utf8");

test("password recovery confirmation stays in its form and successful reset returns to sign-in", () => {
  assert.match(source, /feedback\?\.kind === "success" && feedback\.next === "passwordResetEmailSent"[\s\S]*?account-recovery-accepted/);
  assert.doesNotMatch(source, /testID="account-recovery-accepted"[\s\S]{0,240}AuthStatusScreen/);
  assert.match(source, /if \(result\.kind === "success"\) \{\s*setFeedback\(null\);\s*setPasswordResetCompleted\(true\);\s*setMode\("signIn"\);/);
  assert.match(source, /confirmPasswordReset\(resetCode, password\)/);
  assert.match(source, /account-reset-complete/);
  assert.match(source, /onEmailChange=\{\(value\) => \{\s*setPasswordResetCompleted\(false\);[\s\S]*?setEmail\(value\);/);
  assert.match(source, /onPress=\{\(\) => \{ setPasswordResetCompleted\(false\); setMode\("recovery"\); \}\}/);
  assert.match(source, /const beginRegistration = \(\) => \{\s*setPasswordResetCompleted\(false\);/);
});
