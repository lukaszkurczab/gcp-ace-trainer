import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const screen = readFileSync(new URL("./AccountEntryScreen.tsx", import.meta.url), "utf8");
const locales = ["en", "pl", "de", "fr", "es", "it", "et"] as const;
const copy = Object.fromEntries(
  locales.map((locale) => [
    locale,
    JSON.parse(
      readFileSync(new URL(`../../locales/${locale}/account.json`, import.meta.url), "utf8"),
    ) as Record<string, string>,
  ]),
) as Record<(typeof locales)[number], Record<string, string>>;

test("welcome screen keeps its mark, localized copy, and entry actions", () => {
  assert.match(
    screen,
    /<PatternlyMark size=\{96\} treatment=\{colorMode === "dark" \? "mint" : "navy"\} \/>/,
  );
  assert.equal(copy.en.welcomeTitle, "Practice. Progress. Be ready.");
  assert.equal(
    copy.en.welcomeDescription,
    "Focused practice for technical interviews and certifications.",
  );

  for (const locale of locales) {
    assert.ok(copy[locale].welcomeTitle?.trim(), `${locale} welcomeTitle must be present`);
    assert.ok(copy[locale].welcomeDescription?.trim(), `${locale} welcomeDescription must be present`);
    if (locale !== "en") {
      assert.notEqual(copy[locale].welcomeTitle, copy.en.welcomeTitle, `${locale} title must be translated`);
      assert.notEqual(
        copy[locale].welcomeDescription,
        copy.en.welcomeDescription,
        `${locale} description must be translated`,
      );
    }
  }

  assert.match(screen, /onPress=\{onSignIn\}[\s\S]*?testID="account-sign-in"/);
  assert.match(screen, /onPress=\{onRegister\}[\s\S]*?testID="account-register"/);
  assert.match(screen, /onPress=\{onContinueAsGuest\}[\s\S]*?testID="account-guest"/);
  assert.match(screen, /onContinueAsGuest=\{continueWithoutAccount\}/);
  assert.match(screen, /onRegister=\{beginRegistration\}/);
  assert.match(screen, /onSignIn=\{\(\) => \{[\s\S]*?setMode\("signIn"\);/);
});
