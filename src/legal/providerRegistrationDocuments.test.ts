import assert from "node:assert/strict";
import test from "node:test";

import { resolveProviderRegistrationDocuments } from "./providerRegistrationDocuments";

test("provider registration binds the complete canonical English and Polish documents to their loaded versions", () => {
  for (const locale of ["en", "pl"] as const) {
    const result = resolveProviderRegistrationDocuments(locale, "sandbox");
    assert.equal(result.kind, "ready");
    if (result.kind !== "ready") continue;
    assert.equal(result.documents.locale, locale);
    assert.ok(result.documents.terms.content.length > 1_000);
    assert.ok(result.documents.privacy.content.length > 1_000);
    assert.match(result.documents.terms.version, /^\d{4}-\d{2}-\d{2}$/u);
    assert.match(result.documents.privacy.version, /^\d{4}-\d{2}-\d{2}$/u);
  }
});

test("provider registration fails closed for draft locales and incomplete release legal configuration", () => {
  for (const locale of ["de", "fr", "es", "it", "et"] as const) {
    assert.deepEqual(resolveProviderRegistrationDocuments(locale, "release"), { kind: "unavailable", reason: "locale" });
  }
  assert.deepEqual(resolveProviderRegistrationDocuments("en", "release"), { kind: "unavailable", reason: "documents" });
});
