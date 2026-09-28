import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("delete account switches from identity confirmation to the hold action", () => {
  const screen = readFileSync("src/features/account/AccountSecurityScreen.tsx", "utf8");
  const locales = ["en", "pl", "de", "fr", "es", "it", "et"].map((locale) => JSON.parse(readFileSync(`src/locales/${locale}/settings.json`, "utf8")) as Record<string, string>);
  const [en, pl] = locales;
  assert.ok(en);
  assert.ok(pl);

  assert.match(screen, /mode === "delete" \? !prepared \? <View style=\{styles\.deleteWarning\} testID="security-delete-warning">[\s\S]*?deletePermanent[\s\S]*?deleteConsequences[\s\S]*?<\/View> : null : <Text/u);
  assert.doesNotMatch(screen, /<InfoBlock[^>]*body=\{t\("deleteConsequences"\)/u);
  assert.match(screen, /failure && errorField === null && mode !== "delete" \? <InfoBlock/u);
  assert.match(screen, /mode === "delete" && failure && errorField === null \? <Text accessibilityLiveRegion="polite" accessibilityRole="alert"[\s\S]*?failure === "pendingSyncRequiresNetwork" \? t\("deletePendingSync"\) : ta\(failure\)/u);
  assert.match(screen, /usesPassword && !prepared \? field\(t\(mode === "delete" \? "password" : "currentPassword"\)/u);
  assert.match(screen, /!prepared \? usesGoogle/u);
  assert.match(screen, /usesApple \? t\("verifyApple"\)/u);
  assert.match(screen, /mode === "delete" \? "deleteConfirm" : mode === "export" \|\| mode === "privacy" \? "verifyIdentity"/u);
  assert.match(screen, /testID="security-google-verify"[\s\S]*?t\("verifyGoogle"\)/u);
  assert.match(screen, /mode === "delete" && prepared \? <HoldToConfirmButton/u);
  assert.doesNotMatch(screen, /security-deletion-authorized|deletionVerified|identityVerified/u);
  assert.doesNotMatch(screen, /deletionRetention|deletionContact|mailto:/u);

  assert.equal(en.password, "Password");
  assert.equal(en.holdDelete, "Hold to delete");
  assert.equal(en.deletePermanent, "This cannot be undone");
  assert.equal(en.deleteConsequences, "Your sign-in, account progress, recovery codes, and learning data on this device will be deleted. Device preferences and limited security records will remain.");
  assert.equal(en.deleteConfirm, "Confirm");
  assert.equal(en.deletePendingSync, "Sync pending changes before deleting your account.");
  assert.doesNotMatch(en.deleteConsequences, /GDPR|Article|retention period|technical deletion/u);
  assert.equal(pl.password, "Hasło");
  assert.equal(pl.holdDelete, "Przytrzymaj, aby usunąć");
  assert.equal(pl.deleteConsequences, "Dane logowania, postęp konta, kody odzyskiwania i dane nauki na tym urządzeniu zostaną usunięte. Preferencje urządzenia i ograniczone zapisy bezpieczeństwa pozostaną.");
  assert.doesNotMatch(pl.deleteConsequences, /RODO|art\.|okres przechowywania|techniczne zapisy/u);
  assert.equal(pl.deleteConfirm, "Potwierdź");
  assert.equal(pl.deletePendingSync, "Zsynchronizuj oczekujące zmiany przed usunięciem konta.");
  const [de, fr, es, it, et] = locales.slice(2);
  assert.equal(locales.length, 7);
  assert.ok(de && fr && es && it && et);
  assert.deepEqual(locales.map((locale) => locale.deleteConfirm), ["Confirm", "Potwierdź", "Bestätigen", "Confirmer", "Confirmar", "Conferma", "Kinnita"]);
  assert.deepEqual(locales.map((locale) => locale.deletePendingSync), [
    "Sync pending changes before deleting your account.",
    "Zsynchronizuj oczekujące zmiany przed usunięciem konta.",
    "Synchronisiere ausstehende Änderungen, bevor du dein Konto löschst.",
    "Synchronisez les modifications en attente avant de supprimer votre compte.",
    "Sincroniza los cambios pendientes antes de eliminar tu cuenta.",
    "Sincronizza le modifiche in sospeso prima di eliminare il tuo account.",
    "Sünkrooni ootel muudatused enne konto kustutamist.",
  ]);
  assert.deepEqual(locales.map((locale) => locale.deleteConsequences), [
    en.deleteConsequences,
    pl.deleteConsequences,
    "Deine Anmeldedaten, dein Kontofortschritt, Wiederherstellungscodes und Lerndaten auf diesem Gerät werden gelöscht. Geräteeinstellungen und begrenzte Sicherheitsnachweise bleiben erhalten.",
    "Vos identifiants de connexion, la progression de votre compte, vos codes de récupération et les données d’apprentissage de cet appareil seront supprimés. Les préférences de l’appareil et certaines données de sécurité limitées seront conservées.",
    "Se eliminarán tu acceso, el progreso de tu cuenta, los códigos de recuperación y los datos de aprendizaje de este dispositivo. Se conservarán las preferencias del dispositivo y algunos registros de seguridad limitados.",
    "Il tuo accesso, i progressi dell’account, i codici di recupero e i dati di apprendimento su questo dispositivo verranno eliminati. Le preferenze del dispositivo e alcuni dati di sicurezza limitati resteranno.",
    "Sinu sisselogimisandmed, konto edenemine, taastamiskoodid ja selles seadmes olevad õpiandmed kustutatakse. Seadme eelistused ja piiratud turvakirjed jäävad alles.",
  ]);
  assert.deepEqual([de.deletePermanent, fr.deletePermanent, es.deletePermanent, it.deletePermanent, et.deletePermanent], ["Diese Aktion kann nicht rückgängig gemacht werden", "Cette action est irréversible", "Esta acción no se puede deshacer", "Questa operazione non può essere annullata", "Seda toimingut ei saa tagasi võtta"]);
  for (const locale of locales) {
    assert.ok(locale.deletePermanent);
    assert.ok(locale.deleteConsequences);
    assert.ok(locale.deleteConfirm);
    assert.ok(locale.deletePendingSync);
    assert.doesNotMatch(locale.deleteConsequences, /These records only confirm|Te zapisy tylko potwierdzają|Diese Nachweise bestätigen nur|Ces données confirment uniquement|Estos registros solo confirman|Questi dati confermano solo|Need kirjed kinnitavad ainult/u);
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
