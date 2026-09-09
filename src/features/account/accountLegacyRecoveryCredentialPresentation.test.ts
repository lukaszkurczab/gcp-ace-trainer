import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("legacy recovery-code retry keeps an invalid credential on its password field", () => {
  const screen = readFileSync("src/features/account/AccountEntryScreen.tsx", "utf8");
  const start = screen.indexOf("function AccountAdoptionScreen");
  const end = screen.indexOf("function AccountRecoveryScreen", start);
  const recovery = screen.slice(start, end);

  assert.ok(start >= 0);
  assert.ok(end > start);
  assert.match(screen, /feedback\.failure === "reauthenticationRequired" \|\| feedback\.failure === "invalidCredential"/u);
  assert.match(recovery, /recoveryFeedback && !isReauthenticationFailure\(recoveryFeedback\) \? renderFeedback/u);
  assert.match(recovery, /error=\{isReauthenticationFailure\(recoveryFeedback\) \? text\.reauthenticationRequired : undefined\}/u);
  assert.match(recovery, /errorTestID="account-recovery-reauth-password-error"/u);
  assert.match(recovery, /setRecoveryPassword\(value\);\s*setRecoveryFeedback\(null\);/u);
  assert.match(recovery, /onPress=\{issueCodes\}/u);
});
