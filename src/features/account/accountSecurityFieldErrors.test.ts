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
    assert.equal(getAccountSecurityErrorField({ mode: "delete", failure, usesPassword: true }), "security-password");
    assert.equal(getAccountSecurityErrorField({ mode: "delete", failure, usesPassword: false }), null);
  }
});

test("password change validation identifies the edited password field", () => {
  assert.equal(getAccountSecurityErrorField({ mode: "password", failure: "passwordMismatch", usesPassword: true }), "security-confirm-password");
  assert.equal(getAccountSecurityErrorField({ mode: "password", failure: "weakPassword", usesPassword: true }), "security-new-password");
});

test("recovery-code wrong-password failures identify the current password", () => {
  assert.equal(getAccountSecurityErrorField({ mode: "recovery", failure: "invalidCredential", usesPassword: true }), "security-password");
  assert.equal(getAccountSecurityErrorField({ mode: "recovery", failure: "invalidCredential", usesPassword: false }), null);
});

test("general errors and non-field security failures retain their existing banner presentation", () => {
  for (const failure of [null, "offline", "providerUnavailable", "revokedSession", "rateLimited"]) {
    assert.equal(getAccountSecurityErrorField({ mode: "email", failure, usesPassword: true }), null);
  }
  for (const mode of ["password", "recovery", "export", "privacy"]) {
    assert.equal(getAccountSecurityErrorField({ mode, failure: "reauthenticationRequired", usesPassword: true }), null);
    assert.equal(getAccountSecurityErrorField({ mode, failure: "invalidEmail", usesPassword: true }), null);
  }
  assert.equal(getAccountSecurityErrorField({ mode: "password", failure: "invalidCredential", usesPassword: true }), null);
  assert.equal(getAccountSecurityErrorField({ mode: "delete", failure: "invalidEmail", usesPassword: true }), null);
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
  for (const [failure, affected, other] of [
    ["passwordMismatch", "security-confirm-password", "security-new-password"],
    ["weakPassword", "security-new-password", "security-confirm-password"],
    ["invalidCredential", "security-password", "security-new-password"],
  ] as const) {
    const mode = failure === "invalidCredential" ? "recovery" : "password";
    assert.equal(getAccountSecurityErrorAfterEdit({ mode, failure, usesPassword: true, editedField: other }), failure);
    assert.equal(getAccountSecurityErrorAfterEdit({ mode, failure, usesPassword: true, editedField: affected }), null);
  }
  assert.equal(getAccountSecurityErrorAfterEdit({ mode: "password", failure: "reauthenticationRequired", usesPassword: true, editedField: "security-new-password" }), null);
  assert.equal(getAccountSecurityErrorAfterEdit({ mode: "delete", failure: "invalidCredential", usesPassword: true, editedField: "security-password" }), null);
});
