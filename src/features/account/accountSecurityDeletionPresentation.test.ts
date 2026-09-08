import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("delete account switches from identity confirmation to the hold action", () => {
  const screen = readFileSync("src/features/account/AccountSecurityScreen.tsx", "utf8");
  const en = JSON.parse(readFileSync("src/locales/en/settings.json", "utf8")) as Record<string, string>;
  const pl = JSON.parse(readFileSync("src/locales/pl/settings.json", "utf8")) as Record<string, string>;

  assert.match(screen, /mode === "delete" \? !prepared \? <>[\s\S]*?deleteConsequences[\s\S]*?<\/> : null : <Text/u);
  assert.match(screen, /usesPassword && !prepared \? field\(t\(mode === "delete" \? "password" : "currentPassword"\)/u);
  assert.match(screen, /!prepared \? usesGoogle/u);
  assert.match(screen, /mode === "delete" && prepared \? <HoldToConfirmButton/u);
  assert.doesNotMatch(screen, /security-deletion-authorized|deletionVerified|identityVerified/u);
  assert.doesNotMatch(screen, /deletionRetention|deletionContact|mailto:/u);

  assert.equal(en.password, "Password");
  assert.equal(en.holdDelete, "Hold to delete");
  assert.ok(en.deleteConsequences);
  assert.doesNotMatch(en.deleteConsequences, /GDPR|Article|retention period|technical deletion/u);
  assert.equal(pl.password, "Hasło");
  assert.equal(pl.holdDelete, "Przytrzymaj, aby usunąć");
  assert.ok(pl.deleteConsequences);
  assert.doesNotMatch(pl.deleteConsequences, /RODO|art\.|okres przechowywania|techniczne zapisy/u);
  for (const locale of [en, pl]) {
    assert.equal("deletionVerified" in locale, false);
    assert.equal("identityVerified" in locale, false);
    assert.equal("releaseDelete" in locale, false);
  }
});

test("delete account password failures stay attached to Password", () => {
  const errors = readFileSync("src/features/account/accountSecurityFieldErrors.ts", "utf8");
  assert.match(errors, /input\.mode === "delete" && input\.usesPassword/u);
  assert.match(errors, /input\.failure === "reauthenticationRequired" \|\| input\.failure === "invalidCredential"/u);
  assert.match(errors, /return "security-password"/u);
});
