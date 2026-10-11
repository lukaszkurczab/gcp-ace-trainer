import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { describePremiumNodeOfferFailure } from "./premiumNodeOfferPresentation";
import { NodePackageError, NodePackageStorageIntegrityError, NodePackageStorageUnavailableError } from "../runtime/nodeContentPackage";

test("Premium package errors have distinct localized-copy keys and actionable recovery policy", () => {
  const entries = [
    ["entitlement_required", "Premium access is required for this topic. Choose a free topic or check your subscription.", false, true],
    ["entitlement_unavailable", "We couldn't verify Premium access. Check your connection and try again.", true, false],
    ["not_found", "This Premium topic isn't available yet. Choose a free topic to continue.", false, true],
    ["authentication_required", "Sign in again to prepare Premium content.", false, false],
    ["app_check_unavailable", "We couldn't verify this app connection. Check your connection and try again.", true, false],
    ["reauthentication_required", "Sign in again to verify your session before preparing Premium content.", false, false],
    ["package_unavailable", "This learning package is temporarily unavailable. Try again when connected.", true, true],
    ["package_corrupt", "We couldn't verify this package. Download it again to retry.", true, false],
    ["minimum_app_version", "Update Patternly to prepare this Premium topic.", false, false],
    ["package_storage_failed", "We couldn't save this package on your device. Check available storage and try again.", true, false],
    ["package_identity_mismatch", "This package doesn't match the offered topic. Choose a free topic or try again later.", true, true],
    ["invalid_response", "This package couldn't be verified. Choose a free topic or try again later.", false, true],
  ] as const;
  for (const [code, message, retry, freeAlternative] of entries) {
    assert.deepEqual(describePremiumNodeOfferFailure(new NodePackageError(code)), { message, retry, freeAlternative });
  }
});

test("stored integrity and uncertain write outcomes block unsafe retry and free fallback", () => {
  assert.deepEqual(describePremiumNodeOfferFailure(new NodePackageStorageIntegrityError("corrupt", "manifest_decode")), {
    message: "Patternly couldn't verify saved Premium content on this device. The operation is blocked and the stored files were left in place.", retry: false, freeAlternative: false,
  });
  assert.deepEqual(describePremiumNodeOfferFailure(new NodePackageStorageUnavailableError("pointer_readback", "unknown")), {
    message: "Patternly couldn't confirm the saved Premium content state. This operation is blocked; try again later.", retry: false, freeAlternative: false,
  });
  assert.deepEqual(describePremiumNodeOfferFailure(new NodePackageStorageUnavailableError("inventory_read", "unknown")), {
    message: "Patternly couldn't read saved Premium content. Try again later.", retry: true, freeAlternative: false,
  });
});

test("safe stored-package failure copy is available in every supported locale", () => {
  const locales = ["en", "et", "es", "fr", "de", "it", "pl"] as const;
  const errors = [
    new NodePackageStorageIntegrityError("unsupported", "pointer_decode"),
    new NodePackageStorageIntegrityError("identity_mismatch", "pointer_identity"),
    new NodePackageStorageIntegrityError("corrupt", "manifest_decode"),
    new NodePackageStorageUnavailableError("pointer_readback", "unknown"),
    new NodePackageStorageUnavailableError("inventory_read", "unknown"),
  ];
  const messages = errors.map((error) => describePremiumNodeOfferFailure(error).message);
  for (const locale of locales) {
    const dictionary = JSON.parse(readFileSync(`src/locales/${locale}/common.json`, "utf8")) as Record<string, string>;
    for (const message of messages) assert.ok(Object.hasOwn(dictionary, message), `${locale} is missing Premium storage copy: ${message}`);
  }
});
