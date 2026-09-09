import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("password-change field errors use the localized field-specific copy", () => {
  const screen = readFileSync("src/features/account/AccountSecurityScreen.tsx", "utf8");
  const accountLocales = ["en", "pl"].map((locale) => JSON.parse(readFileSync(`src/locales/${locale}/account.json`, "utf8")) as Record<string, string>);
  const settingsLocales = ["en", "pl"].map((locale) => JSON.parse(readFileSync(`src/locales/${locale}/settings.json`, "utf8")) as Record<string, string>);

  assert.match(screen, /failure === "passwordMismatch"\s*\? ta\("passwordMismatch"\)/u);
  assert.match(screen, /failure === "weakPassword"\s*\? ta\("weakPassword"\)/u);
  assert.match(screen, /mode === "recovery" && failure === "invalidCredential"\s*\? ta\("invalidCredential"\)/u);
  assert.match(screen, /failure === "emailUnavailable"\s*\? "emailChangeAddressUnavailable"\s*:\s*"emailChangeAddressError"/u);
  assert.match(screen, /t\("emailChangePasswordError"\)/u);
  assert.match(screen, /testID=\{`\$\{id\}-error`\}/u);
  assert.deepEqual(accountLocales.map((locale) => locale.passwordMismatch), ["Passwords do not match.", "Hasła nie są takie same."]);
  assert.deepEqual(accountLocales.map((locale) => locale.weakPassword), ["Use at least 8 characters for your password.", "Hasło musi mieć co najmniej 8 znaków."]);
  assert.deepEqual(accountLocales.map((locale) => locale.invalidCredential), ["We couldn’t verify your sign-in details.", "Nie udało się potwierdzić danych logowania."]);
  assert.deepEqual(accountLocales.map((locale) => locale.emailUnavailable), ["This email address can't be used. Try a different address.", "Tego adresu e-mail nie można użyć. Spróbuj innego adresu."]);
  assert.deepEqual(settingsLocales.map((locale) => locale.emailChangeAddressUnavailable), ["This email address can't be used. Try a different address.", "Tego adresu e-mail nie można użyć. Spróbuj innego adresu."]);
  assert.ok(settingsLocales.every((locale) => !/already|exists|account|zaję|istnie/u.test(locale.emailChangeAddressUnavailable ?? "")));
  assert.deepEqual(settingsLocales.map((locale) => locale.emailChangePasswordError), ["We couldn't verify your password. Check it and try again.", "Nie udało się potwierdzić hasła. Sprawdź je i spróbuj ponownie."]);
});
