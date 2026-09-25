import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { isLanguageSettingsAuditCommand } from "./languageSettingsAuditCommand";

const command = "com.lkurczab.patternly://audit/show-language-settings";

test("language settings audit command is exact and development-smoke only", () => {
  assert.equal(isLanguageSettingsAuditCommand(command, { development: true, smoke: true }), true);
  assert.equal(isLanguageSettingsAuditCommand(command, { development: false, smoke: true }), false);
  assert.equal(isLanguageSettingsAuditCommand(command, { development: true, smoke: false }), false);
  assert.equal(isLanguageSettingsAuditCommand(`${command}?write=true`, { development: true, smoke: true }), false);
  assert.equal(isLanguageSettingsAuditCommand("com.lkurczab.patternly://audit/show-language", { development: true, smoke: true }), false);
  assert.equal(isLanguageSettingsAuditCommand(null, { development: true, smoke: true }), false);
});

test("language settings audit route renders the production screen without account or preference commands", () => {
  const navigator = readFileSync("src/navigation/RootNavigator.tsx", "utf8");
  const auditEffect = navigator.slice(
    navigator.indexOf("if (!__DEV__ || !isPatternlySmokeRuntime()) return;"),
    navigator.indexOf("}, []);", navigator.indexOf("if (!__DEV__ || !isPatternlySmokeRuntime()) return;")),
  );
  const auditNavigator = navigator.slice(
    navigator.indexOf("if (auditLanguageSettings)"),
    navigator.indexOf("const applicationSessionReady"),
  );

  assert.match(auditEffect, /isLanguageSettingsAuditCommand/);
  assert.match(auditEffect, /Linking\.addEventListener\("url"/);
  assert.doesNotMatch(auditEffect, /setLanguage|signOut|retryRemote|continueAsGuest|clear/);
  assert.match(auditNavigator, /component=\{LanguageSettingsScreen\}/);
  assert.doesNotMatch(auditNavigator, /AccountEntryScreen|HomeScreen/);
});
