import assert from "node:assert/strict";
import test from "node:test";
import { describePremiumNodeOfferFailure } from "./premiumNodeOfferPresentation";
import { NodePackageError } from "../runtime/nodeContentPackage";

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
