import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import test from "node:test";

import { deleteApp, initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  deleteUser,
  inMemoryPersistence,
  initializeAuth,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  verifyPasswordResetCode,
} from "firebase/auth";

const PROJECT_ID = "demo-patternly-auth-removal";
const AUTH_ORIGIN = "http://127.0.0.1:19109";
const ACTION_ORIGIN = "http://127.0.0.1:8080";

test("Firebase Auth Emulator accepts password reset, consumes OOB code, and rejects invalid code", async () => {
  assert.equal(process.env.GCLOUD_PROJECT, PROJECT_ID, "test must run only in the dedicated demo project");
  assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST, "127.0.0.1:19109", "test must run only against loopback Auth Emulator");
  const app = initializeApp({
    apiKey: "fake-api-key",
    authDomain: `${PROJECT_ID}.firebaseapp.com`,
    projectId: PROJECT_ID,
    appId: "1:1234567890:web:password-reset-test",
  }, `auth-password-reset-${process.pid}-${randomUUID()}`);
  const auth = initializeAuth(app, { persistence: inMemoryPersistence });
  connectAuthEmulator(auth, AUTH_ORIGIN, { disableWarnings: true });
  const email = `auth-reset-${randomUUID()}@example.invalid`;
  const oldPassword = "Old-local-test-password-42";
  const newPassword = "New-local-test-password-84";
  let user;

  try {
    user = (await createUserWithEmailAndPassword(auth, email, oldPassword)).user;
    const uid = user.uid;
    await signOut(auth);
    await sendPasswordResetEmail(auth, email, { handleCodeInApp: true, url: `${ACTION_ORIGIN}/auth/action` });

    const response = await fetch(`${AUTH_ORIGIN}/emulator/v1/projects/${PROJECT_ID}/oobCodes`, { redirect: "error" });
    assert.equal(response.ok, true, "Auth Emulator must expose its local OOB fixture endpoint");
    const payload = await response.json();
    const code = payload.oobCodes?.find((entry) => entry.email === email && entry.requestType === "PASSWORD_RESET")?.oobCode;
    assert.equal(typeof code, "string", "a password reset request must create a local OOB code");
    assert.equal(await verifyPasswordResetCode(auth, code), email);

    await assert.rejects(confirmPasswordReset(auth, "invalid-local-reset-code", newPassword), (error) => error?.code === "auth/invalid-action-code");
    await confirmPasswordReset(auth, code, newPassword);
    await assert.rejects(confirmPasswordReset(auth, code, newPassword), (error) => error?.code === "auth/invalid-action-code");
    const signedIn = await signInWithEmailAndPassword(auth, email, newPassword);
    assert.equal(signedIn.user.uid, uid, "the changed password must sign into the same local account");
    user = signedIn.user;

    const receiptPath = process.env.PATTERNLY_AUTH_RESET_RECEIPT;
    if (receiptPath) writeFileSync(receiptPath, JSON.stringify({ result: "PASS", project: PROJECT_ID, emulator: AUTH_ORIGIN, resetEmailRequested: true, localOobCodeVerified: true, passwordResetConfirmed: true, invalidCodeRejected: true, reusedCodeRejected: true, newPasswordSignIn: true, rawEmailOrOobCodeRecorded: false }) + "\n", { mode: 0o600 });
  } finally {
    if (auth.currentUser) {
      try { await deleteUser(auth.currentUser); } catch { await signOut(auth).catch(() => undefined); }
    }
    await auth._delete();
    await deleteApp(app);
  }
});
