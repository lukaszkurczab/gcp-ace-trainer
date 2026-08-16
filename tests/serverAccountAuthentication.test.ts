import assert from "node:assert/strict";
import test from "node:test";

import {
  authenticateAccountRequest,
  type FirebaseIdTokenVerifier,
} from "../server/src/authentication.js";

const PROJECT_ID = "patternly-app-sandbox";
const APP_ID = "test-app-id";
const NOW_SECONDS = 1_785_528_000;

const validClaims = {
  aud: PROJECT_ID,
  auth_time: NOW_SECONDS - 60,
  email_verified: true,
  exp: NOW_SECONDS + 3_600,
  iss: `https://securetoken.google.com/${PROJECT_ID}`,
  sub: "firebase-user-1",
  uid: "firebase-user-1",
} as const;

const request = (authorization?: string, suppliedUid?: string) => ({
  headers: authorization === undefined ? {} : { authorization, "x-firebase-appcheck": "valid-app-check" },
  suppliedUid,
});

const appCheckVerifier = { verifyToken: async () => ({ appId: APP_ID }) };

test("rejects invalid account authentication before any repository access", async () => {
  const cases = [
    { name: "missing", input: request(), error: "missing_authorization" },
    { name: "malformed", input: request("Token abc"), error: "malformed_authorization" },
    { name: "empty bearer", input: request("Bearer "), error: "malformed_authorization" },
  ] as const;

  for (const entry of cases) {
    let verifierCalls = 0;
    let repositoryCalls = 0;
    const verifier: FirebaseIdTokenVerifier = {
      verifyIdToken: async () => {
        verifierCalls += 1;
        return validClaims;
      },
    };

    await assert.rejects(
      authenticateAccountRequest(entry.input, {
        expectedProjectId: PROJECT_ID,
        expectedAppCheckAppIds: [APP_ID],
        nowSeconds: () => NOW_SECONDS,
        appCheckVerifier,
        verifier,
      }).then(() => {
        repositoryCalls += 1;
      }),
      (error: unknown) => error instanceof Error && error.message === entry.error,
      entry.name,
    );
    assert.equal(repositoryCalls, 0, entry.name);
    assert.equal(verifierCalls, 0, entry.name);
  }
});

test("rejects invalid verified claims and caller-selected UID before repository access", async () => {
  const cases = [
    { name: "wrong project", claims: { ...validClaims, aud: "patternly-app-production" }, error: "wrong_firebase_project" },
    { name: "wrong issuer", claims: { ...validClaims, iss: "https://issuer.invalid" }, error: "wrong_firebase_issuer" },
    { name: "expired", claims: { ...validClaims, exp: NOW_SECONDS }, error: "expired_id_token" },
    { name: "unverified", claims: { ...validClaims, email_verified: false }, error: "unverified_identity" },
    { name: "subject mismatch", claims: { ...validClaims, sub: "other-user" }, error: "invalid_token_subject" },
  ] as const;

  for (const entry of cases) {
    let repositoryCalls = 0;
    const verifier: FirebaseIdTokenVerifier = {
      verifyIdToken: async () => entry.claims,
    };
    await assert.rejects(
      authenticateAccountRequest(request("Bearer valid-id-token"), {
        expectedProjectId: PROJECT_ID,
        expectedAppCheckAppIds: [APP_ID],
        nowSeconds: () => NOW_SECONDS,
        appCheckVerifier,
        verifier,
      }).then(() => {
        repositoryCalls += 1;
      }),
      (error: unknown) => error instanceof Error && error.message === entry.error,
      entry.name,
    );
    assert.equal(repositoryCalls, 0, entry.name);
  }

  let repositoryCalls = 0;
  await assert.rejects(
    authenticateAccountRequest(request("Bearer valid-id-token", "caller-selected-user"), {
      expectedProjectId: PROJECT_ID,
      expectedAppCheckAppIds: [APP_ID],
      nowSeconds: () => NOW_SECONDS,
      appCheckVerifier,
      verifier: { verifyIdToken: async () => validClaims },
    }).then(() => {
      repositoryCalls += 1;
    }),
    (error: unknown) => error instanceof Error && error.message === "uid_mismatch",
  );
  assert.equal(repositoryCalls, 0);
});

test("derives UID only from a verified token and requests revocation checks for sensitive routes", async () => {
  const revocationChecks: boolean[] = [];
  const verifier: FirebaseIdTokenVerifier = {
    verifyIdToken: async (_token, checkRevoked) => {
      revocationChecks.push(checkRevoked);
      return validClaims;
    },
  };

  const ordinary = await authenticateAccountRequest(request("Bearer ordinary-token"), {
    expectedProjectId: PROJECT_ID,
    expectedAppCheckAppIds: [APP_ID],
    nowSeconds: () => NOW_SECONDS,
    appCheckVerifier,
    verifier,
  });
  const sensitive = await authenticateAccountRequest(request("Bearer sensitive-token", validClaims.uid), {
    expectedProjectId: PROJECT_ID,
    expectedAppCheckAppIds: [APP_ID],
    nowSeconds: () => NOW_SECONDS,
    appCheckVerifier,
    requireRecentAuthentication: true,
    verifier,
  });

  assert.equal(ordinary.uid, validClaims.uid);
  assert.equal(sensitive.uid, validClaims.uid);
  assert.deepEqual(revocationChecks, [false, true]);
});

test("rejects stale authentication for sensitive routes", async () => {
  for (const authTime of [NOW_SECONDS - 301, 0, -1, NOW_SECONDS + 1, Number.NaN, "not-a-number"] as const) {
    await assert.rejects(
      authenticateAccountRequest(request("Bearer valid-id-token"), {
        expectedProjectId: PROJECT_ID,
        expectedAppCheckAppIds: [APP_ID],
        nowSeconds: () => NOW_SECONDS,
        requireRecentAuthentication: true,
        appCheckVerifier,
        verifier: {
          verifyIdToken: async () => ({ ...validClaims, auth_time: authTime } as unknown as typeof validClaims),
        },
      }),
      (error: unknown) => error instanceof Error && error.message === "recent_authentication_required",
      String(authTime),
    );
  }
});

test("requires a verified App Check token and an allow-listed app identity", async () => {
  await assert.rejects(
    authenticateAccountRequest({ headers: { authorization: "Bearer valid-id-token" } }, {
      expectedProjectId: PROJECT_ID,
      expectedAppCheckAppIds: [APP_ID],
      nowSeconds: () => NOW_SECONDS,
      appCheckVerifier,
      verifier: { verifyIdToken: async () => validClaims },
    }),
    (error: unknown) => error instanceof Error && error.message === "missing_app_check",
  );

  await assert.rejects(
    authenticateAccountRequest({ headers: { authorization: "Bearer valid-id-token", "x-firebase-appcheck": "other" } }, {
      expectedProjectId: PROJECT_ID,
      expectedAppCheckAppIds: [APP_ID],
      nowSeconds: () => NOW_SECONDS,
      appCheckVerifier: { verifyToken: async () => ({ appId: "unregistered-app" }) },
      verifier: { verifyIdToken: async () => validClaims },
    }),
    (error: unknown) => error instanceof Error && error.message === "wrong_app_check_app",
  );
});
