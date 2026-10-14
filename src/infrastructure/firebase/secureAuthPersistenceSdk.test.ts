import assert from "node:assert/strict";
import test from "node:test";
import { AUTH_USER_STORAGE_KEY, createSecureAuthPersistence, type SecureAuthPersistenceStore } from "./secureAuthPersistence";

// Real installed Firebase SDK, synthetic HTTP responses and in-memory native port.
// This exercises SDK serialization/lifecycle, not provider services or Keychain.
test("minimal persisted DTO survives SDK restart, re-auth, link/unlink, sign-out and deletion", async (t) => {
  const stored = new Map<string, string>();
  const store: SecureAuthPersistenceStore = {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 731,
    getItemAsync: async (key) => stored.get(key) ?? null,
    setItemAsync: async (key, value) => { stored.set(key, value); },
    deleteItemAsync: async (key) => { stored.delete(key); },
  };
  const uid = "sdk-user";
  const email = "sdk@example.test";
  const profile = { displayName: "Unused name", photoUrl: "https://example.test/photo", phoneNumber: "+48123456789" };
  const token = `${Buffer.from('{"alg":"none"}').toString("base64url")}.${Buffer.from(JSON.stringify({ sub: uid, iat: 1, exp: 4102444800, auth_time: 1 })).toString("base64url")}.signature`;
  const tokenResponse = { localId: uid, email, idToken: token, refreshToken: "synthetic-refresh", expiresIn: "3600" };
  let googleLinked = false;
  const providers = () => [
    { providerId: "password", rawId: email, email, ...profile },
    ...(googleLinked ? [{ providerId: "google.com", rawId: "google-uid", email, ...profile }] : []),
  ];
  const paths: string[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const path = new URL(String(input)).pathname;
    paths.push(path);
    let response: unknown;
    if (path === "/v1/token") response = { access_token: token, refresh_token: "synthetic-refresh", expires_in: "3600" };
    else if (path === "/v1/accounts:signInWithPassword") response = tokenResponse;
    else if (path === "/v1/accounts:lookup") response = { users: [{ localId: uid, email, emailVerified: true, createdAt: "1000", lastLoginAt: "2000", providerUserInfo: providers(), ...profile }] };
    else if (path === "/v1/accounts:signInWithIdp") {
      assert.equal(JSON.parse(String(init?.body)).idToken, token, "link authorizes the restored current user");
      googleLinked = true;
      response = tokenResponse;
    } else if (path === "/v1/accounts:update") {
      assert.deepEqual(JSON.parse(String(init?.body)).deleteProvider, ["google.com"]);
      googleLinked = false;
      response = { ...tokenResponse, providerUserInfo: providers() };
    } else if (path === "/v1/accounts:delete") response = {};
    else throw new Error(`unexpected_sdk_test_endpoint:${path}`);
    return new Response(JSON.stringify(response), { status: 200 });
  };
  // Import after replacing fetch: the Node SDK captures its transport at import.
  const { initializeApp, deleteApp } = await import("firebase/app");
  const { initializeAuth, signInWithEmailAndPassword, reauthenticateWithCredential, EmailAuthProvider, GoogleAuthProvider, linkWithCredential, unlink, signOut, deleteUser } = await import("firebase/auth");
  const apps: ReturnType<typeof initializeApp>[] = [];
  t.after(async () => {
    for (const app of apps) await deleteApp(app);
    globalThis.fetch = originalFetch;
  });
  function start() {
    const app = initializeApp({ apiKey: "synthetic-api-key", projectId: "synthetic-project" }, "secure-auth-sdk-test");
    apps.push(app);
    return initializeAuth(app, { persistence: [createSecureAuthPersistence(store)] });
  }
  async function stop() { await deleteApp(apps.pop()!); }
  function assertShape() {
    const json = stored.get(AUTH_USER_STORAGE_KEY);
    assert.ok(json);
    assert.deepEqual(JSON.parse(json), {
      uid, email, emailVerified: true, isAnonymous: false,
      providerData: providers().map(({ providerId, rawId, email }) => ({ providerId, uid: rawId, email })),
      createdAt: "1000", lastLoginAt: "2000",
      stsTokenManager: { refreshToken: "synthetic-refresh", expirationTime: 0 },
    });
  }

  let auth = start();
  await auth.authStateReady();
  await signInWithEmailAndPassword(auth, email, "synthetic-password");
  assertShape();
  await stop();
  auth = start();
  await auth.authStateReady();
  assert.equal(auth.currentUser?.uid, uid);
  assert.equal(auth.currentUser.email, email);
  assert.ok(paths.includes("/v1/token"), "restart refreshes without a persisted ID token");
  assertShape();
  await reauthenticateWithCredential(auth.currentUser, EmailAuthProvider.credential(email, "synthetic-password"));
  assertShape();
  await linkWithCredential(auth.currentUser!, GoogleAuthProvider.credential("synthetic-google-id-token"));
  assert.deepEqual(auth.currentUser!.providerData.map((provider) => provider.providerId), ["password", "google.com"]);
  assertShape();
  await stop();
  auth = start();
  await auth.authStateReady();
  assert.deepEqual(auth.currentUser!.providerData.map((provider) => provider.providerId), ["password", "google.com"]);
  await unlink(auth.currentUser!, "google.com");
  assertShape();
  await signOut(auth);
  assert.equal(stored.has(AUTH_USER_STORAGE_KEY), false);
  await stop();
  auth = start();
  await auth.authStateReady();
  assert.equal(auth.currentUser, null);
  await signInWithEmailAndPassword(auth, email, "synthetic-password");
  await deleteUser(auth.currentUser!);
  assert.equal(auth.currentUser, null);
  assert.equal(stored.has(AUTH_USER_STORAGE_KEY), false);
});
