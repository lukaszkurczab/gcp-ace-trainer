import assert from "node:assert/strict";
import test from "node:test";

import { getAccountSecurityErrorAfterEdit, getAccountSecurityErrorField } from "./accountSecurityFieldErrors";

test("email validation identifies the address field for all sign-in providers", () => {
  for (const usesPassword of [true, false]) {
    assert.equal(getAccountSecurityErrorField({ mode: "email", failure: "invalidEmail", usesPassword }), "security-new-email");
  }
});

test("reauthentication errors identify a password only when that field exists", () => {
  for (const failure of ["reauthenticationRequired", "invalidCredential"]) {
    assert.equal(getAccountSecurityErrorField({ mode: "email", failure, usesPassword: true }), "security-password");
    assert.equal(getAccountSecurityErrorField({ mode: "email", failure, usesPassword: false }), null);
  }
});

test("general errors and other security screens retain their existing banner presentation", () => {
  for (const failure of [null, "offline", "providerUnavailable", "revokedSession", "rateLimited"]) {
    assert.equal(getAccountSecurityErrorField({ mode: "email", failure, usesPassword: true }), null);
  }
  for (const mode of ["password", "recovery", "delete", "export", "privacy"]) {
    assert.equal(getAccountSecurityErrorField({ mode, failure: "reauthenticationRequired", usesPassword: true }), null);
    assert.equal(getAccountSecurityErrorField({ mode, failure: "invalidEmail", usesPassword: true }), null);
  }
});

test("editing another field preserves its error; editing the affected field clears it", () => {
  for (const [failure, affected, other] of [
    ["invalidEmail", "security-new-email", "security-password"],
    ["reauthenticationRequired", "security-password", "security-new-email"],
    ["invalidCredential", "security-password", "security-new-email"],
  ] as const) {
    const input = { mode: "email", failure, usesPassword: true };
    assert.equal(getAccountSecurityErrorAfterEdit({ ...input, editedField: other }), failure);
    assert.equal(getAccountSecurityErrorAfterEdit({ ...input, editedField: affected }), null);
  }
  assert.equal(getAccountSecurityErrorAfterEdit({ mode: "email", failure: "offline", usesPassword: true, editedField: "security-password" }), null);
  assert.equal(getAccountSecurityErrorAfterEdit({ mode: "password", failure: "reauthenticationRequired", usesPassword: true, editedField: "security-new-password" }), null);
});
