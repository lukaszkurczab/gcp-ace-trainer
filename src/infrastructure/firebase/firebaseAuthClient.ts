import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  applyActionCode,
  connectAuthEmulator,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  getAuth,
  initializeAuth,
  onAuthStateChanged,
  OAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  reauthenticateWithCredential,
  signInWithCustomToken,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  verifyBeforeUpdateEmail,
  type Auth,
  type AuthCredential,
  type User,
} from "firebase/auth";
import type { FirebaseClientConfiguration } from "./publicConfig";
import { createSecureAuthPersistence } from "./secureAuthPersistence";
import { developmentLoopbackHost } from "../developmentEndpoints";
import { sha256Utf8 } from "../identity/sha256";

export type FirebaseAuthProvider = "apple" | "google" | "password";

export type FirebaseAuthUserSnapshot = Readonly<{
  email: string | null;
  emailVerified: boolean;
  providers: readonly FirebaseAuthProvider[];
  uid: string;
}>;

export type FirebaseAuthCredentials =
  | Readonly<{ kind: "password"; password: string }>
  | Readonly<{ kind: "google"; idToken: string }>
  | Readonly<{ kind: "apple" }>;

export type FirebaseAuthClient = Readonly<{
  applyActionCode: (code: string) => Promise<void>;
  changePassword: (credentials: FirebaseAuthCredentials, newPassword: string) => Promise<void>;
  confirmPasswordReset: (code: string, password: string) => Promise<void>;
  getIdToken: () => Promise<string | null>;
  getSnapshot: () => FirebaseAuthUserSnapshot | null;
  onUserChanged: (listener: (user: FirebaseAuthUserSnapshot | null) => void) => () => void;
  register: (email: string, password: string) => Promise<FirebaseAuthUserSnapshot>;
  resendVerification: () => Promise<void>;
  requestEmailChange: (credentials: FirebaseAuthCredentials, email: string) => Promise<void>;
  requestPasswordRecovery: (email: string) => Promise<void>;
  reauthenticateWithCredential: (credentials: FirebaseAuthCredentials) => Promise<FirebaseAuthUserSnapshot>;
  signIn: (email: string, password: string) => Promise<FirebaseAuthUserSnapshot>;
  signInWithApple: () => Promise<FirebaseAuthUserSnapshot>;
  signInWithGoogle: (idToken: string) => Promise<FirebaseAuthUserSnapshot>;
  signInWithRecoveryToken: (customToken: string) => Promise<FirebaseAuthUserSnapshot>;
  signOut: () => Promise<void>;
  refreshAccountIdentity: () => Promise<FirebaseAuthUserSnapshot | null>;
  refreshVerification: () => Promise<FirebaseAuthUserSnapshot | null>;
}>;

type FirebaseAuthError = Readonly<{ code?: unknown }>;

export class FirebaseAuthClientError extends Error {
  public readonly code: string;

  public constructor(code: string) {
    super(code);
    this.name = "FirebaseAuthClientError";
    this.code = code;
  }
}

export type FirebaseAuthCurrentUser = Readonly<{ uid: string }>;
export type FirebaseAuthCurrentUserReader = Readonly<{ currentUser: FirebaseAuthCurrentUser | null }>;
export type FirebaseAuthTokenUser = Readonly<{ getIdToken: () => Promise<string>; uid: string }>;

type AppleAuthenticationModule = Pick<typeof import("expo-apple-authentication"), "AppleAuthenticationScope" | "isAvailableAsync" | "signInAsync">;

export type AppleCredentialDependencies = Readonly<{
  apple: AppleAuthenticationModule;
  createCredential: (identityToken: string, rawNonce: string) => AuthCredential;
  createRawNonce: () => string;
}>;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
export const firebaseAuthErrorCode = (error: unknown): string => isRecord(error) && typeof (error as FirebaseAuthError).code === "string" ? (error as FirebaseAuthError).code as string : "auth/unknown";

function firebaseApp(config: FirebaseClientConfiguration): FirebaseApp {
  const existing = getApps().find((candidate) => candidate.name === "patternly");
  return existing ?? initializeApp({ apiKey: config.apiKey, appId: config.appId, authDomain: config.authDomain, projectId: config.projectId }, "patternly");
}

function firebaseAuth(app: FirebaseApp, emulatorOrigin: string | undefined): Auth {
  let auth: Auth;
  try {
    auth = initializeAuth(app, { persistence: [createSecureAuthPersistence()] });
  } catch (error) {
    if (firebaseAuthErrorCode(error) !== "auth/already-initialized") throw error;
    auth = getAuth(app);
  }
  if (emulatorOrigin) {
    const emulator = new URL(emulatorOrigin);
    if (emulator.protocol !== "http:" || emulator.hostname !== developmentLoopbackHost) throw new Error("auth_emulator_unconfigured");
    try { connectAuthEmulator(auth, emulator.origin, { disableWarnings: true }); } catch (error) {
      if (firebaseAuthErrorCode(error) !== "auth/emulator-config-failed") throw error;
    }
  }
  return auth;
}

function providerCapabilities(user: User): readonly FirebaseAuthProvider[] {
  const providers = user.providerData.flatMap((provider): FirebaseAuthProvider[] => {
    if (provider.providerId === "apple.com") return ["apple"];
    if (provider.providerId === "google.com") return ["google"];
    if (provider.providerId === "password") return ["password"];
    return [];
  });
  return Object.freeze([...new Set(providers)]);
}

function snapshot(user: User): FirebaseAuthUserSnapshot {
  return Object.freeze({ email: user.email ?? null, emailVerified: user.emailVerified, providers: providerCapabilities(user), uid: user.uid });
}

/**
 * Returns a bearer token only when the Firebase identity remains the same
 * across the asynchronous SDK call. The narrow reader/user boundary keeps
 * the race test independent from Firebase initialization while this helper is
 * still used by the production client below.
 */
export async function getIdTokenForCurrentUser(auth: FirebaseAuthCurrentUserReader, user: FirebaseAuthTokenUser): Promise<string> {
  const uid = user.uid;
  if (auth.currentUser?.uid !== uid) throw new FirebaseAuthClientError("auth/uid-changed");
  const token = await user.getIdToken();
  if (auth.currentUser?.uid !== uid) throw new FirebaseAuthClientError("auth/uid-changed");
  return token;
}

function actionSettings(origin: string): Readonly<{ handleCodeInApp: true; url: string }> {
  return Object.freeze({ handleCodeInApp: true, url: origin });
}

function createExpoRawNonce(): string {
  const { randomUUID } = require("expo-crypto") as typeof import("expo-crypto");
  const rawNonce = randomUUID();
  return rawNonce;
}

function defaultAppleCredentialDependencies(): AppleCredentialDependencies {
  const apple = require("expo-apple-authentication") as AppleAuthenticationModule;
  return Object.freeze({
    apple,
    createCredential: (identityToken: string, rawNonce: string) => new OAuthProvider("apple.com").credential({ idToken: identityToken, rawNonce }),
    createRawNonce: createExpoRawNonce,
  });
}

export async function createAppleCredential(
  dependencies: AppleCredentialDependencies = defaultAppleCredentialDependencies(),
): Promise<AuthCredential> {
  const { apple } = dependencies;
  if (!(await apple.isAvailableAsync())) throw new FirebaseAuthClientError("auth/apple-unavailable");
  const rawNonce = dependencies.createRawNonce();
  const credential = await apple.signInAsync({ nonce: sha256Utf8(rawNonce), requestedScopes: [apple.AppleAuthenticationScope.EMAIL, apple.AppleAuthenticationScope.FULL_NAME] });
  if (!credential.identityToken) throw new FirebaseAuthClientError("auth/provider-unavailable");
  return dependencies.createCredential(credential.identityToken, rawNonce);
}

export function createFirebaseAuthClient(input: Readonly<{ config: FirebaseClientConfiguration; authActionOrigin: string; authEmulatorOrigin?: string }>): FirebaseAuthClient {
  const auth = firebaseAuth(firebaseApp(input.config), input.authEmulatorOrigin);
  let current: User | null = auth.currentUser;

  const requireUser = (): User => {
    if (!current) throw new FirebaseAuthClientError("auth/signed-out");
    return current;
  };
  const afterCredential = async (user: User): Promise<FirebaseAuthUserSnapshot> => {
    current = user;
    return snapshot(user);
  };

  const requireCurrentUser = (): User => {
    const user = requireUser();
    if (auth.currentUser?.uid !== user.uid) throw new FirebaseAuthClientError("auth/uid-changed");
    return user;
  };

  const providerCredential = async (user: User, credentials: FirebaseAuthCredentials) => {
    if (credentials.kind === "password") {
      if (!user.email) throw new FirebaseAuthClientError("auth/reauthentication-provider-unavailable");
      return EmailAuthProvider.credential(user.email, credentials.password);
    }
    if (credentials.kind === "google") {
      if (!credentials.idToken.trim()) throw new FirebaseAuthClientError("auth/provider-unavailable");
      return OAuthProviderCredential.google(credentials.idToken);
    }

    return createAppleCredential();
  };

  const reauthenticateCurrentUser = async (credentials: FirebaseAuthCredentials): Promise<FirebaseAuthUserSnapshot> => {
    const user = requireCurrentUser();
    const uid = user.uid;
    const credential = await providerCredential(user, credentials);
    if (auth.currentUser?.uid !== uid) throw new FirebaseAuthClientError("auth/uid-changed");
    await reauthenticateWithCredential(user, credential);
    if (auth.currentUser?.uid !== uid) throw new FirebaseAuthClientError("auth/uid-changed");
    const refreshed = auth.currentUser ?? user;
    await refreshed.reload();
    if (auth.currentUser?.uid !== uid || refreshed.uid !== uid) throw new FirebaseAuthClientError("auth/uid-changed");
    await refreshed.getIdToken(true);
    if (auth.currentUser?.uid !== uid) throw new FirebaseAuthClientError("auth/uid-changed");
    current = refreshed;
    return snapshot(refreshed);
  };

  return Object.freeze({
    applyActionCode: async (code: string) => {
      await applyActionCode(auth, code);
      if (!current) return;
      const uid = current.uid;
      await current.reload();
      if (auth.currentUser?.uid !== uid) throw new FirebaseAuthClientError("auth/uid-changed");
      await current.getIdToken(true);
      if (auth.currentUser?.uid !== uid) throw new FirebaseAuthClientError("auth/uid-changed");
    },
    changePassword: async (credentials: FirebaseAuthCredentials, newPassword: string) => {
      const user = requireCurrentUser();
      const uid = user.uid;
      await reauthenticateCurrentUser(credentials);
      const refreshed = requireCurrentUser();
      if (refreshed.uid !== uid) throw new FirebaseAuthClientError("auth/uid-changed");
      await updatePassword(refreshed, newPassword);
      if (auth.currentUser?.uid !== uid) throw new FirebaseAuthClientError("auth/uid-changed");
      await refreshed.getIdToken(true);
      if (auth.currentUser?.uid !== uid) throw new FirebaseAuthClientError("auth/uid-changed");
      current = refreshed;
    },
    confirmPasswordReset: async (code: string, password: string) => { await confirmPasswordReset(auth, code, password); },
    getIdToken: async () => current ? getIdTokenForCurrentUser(auth, current) : null,
    getSnapshot: () => current ? snapshot(current) : null,
    onUserChanged: (listener) => onAuthStateChanged(auth, (user) => {
      current = user;
      listener(user ? snapshot(user) : null);
    }),
    register: async (email: string, password: string) => afterCredential((await createUserWithEmailAndPassword(auth, email, password)).user),
    resendVerification: async () => { await sendEmailVerification(requireUser(), actionSettings(input.authActionOrigin)); },
    requestEmailChange: async (credentials: FirebaseAuthCredentials, email: string) => {
      const user = requireCurrentUser();
      const uid = user.uid;
      await reauthenticateCurrentUser(credentials);
      const refreshed = requireCurrentUser();
      if (refreshed.uid !== uid) throw new FirebaseAuthClientError("auth/uid-changed");
      await verifyBeforeUpdateEmail(refreshed, email, actionSettings(input.authActionOrigin));
      if (auth.currentUser?.uid !== uid) throw new FirebaseAuthClientError("auth/uid-changed");
      current = refreshed;
    },
    requestPasswordRecovery: async (email: string) => { await sendPasswordResetEmail(auth, email, actionSettings(input.authActionOrigin)); },
    reauthenticateWithCredential: reauthenticateCurrentUser,
    signIn: async (email: string, password: string) => afterCredential((await signInWithEmailAndPassword(auth, email, password)).user),
    signInWithApple: async () => {
      return afterCredential((await signInWithCredential(auth, await createAppleCredential())).user);
    },
    signInWithGoogle: async (idToken: string) => {
      if (!idToken.trim()) throw new FirebaseAuthClientError("auth/provider-unavailable");
      return afterCredential((await signInWithCredential(auth, OAuthProviderCredential.google(idToken))).user);
    },
    signInWithRecoveryToken: async (customToken: string) => {
      if (!customToken) throw new FirebaseAuthClientError("auth/provider-unavailable");
      return afterCredential((await signInWithCustomToken(auth, customToken)).user);
    },
    signOut: async () => { await signOut(auth); current = null; },
    refreshAccountIdentity: async () => {
      if (!current) return null;
      const uid = current.uid;
      await current.reload();
      const refreshed = auth.currentUser;
      if (!refreshed || refreshed.uid !== uid) throw new FirebaseAuthClientError("auth/uid-changed");
      await refreshed.getIdToken(true);
      if (auth.currentUser?.uid !== uid) throw new FirebaseAuthClientError("auth/uid-changed");
      current = refreshed;
      return snapshot(refreshed);
    },
    refreshVerification: async () => {
      if (!current) return null;
      const uid = current.uid;
      await current.reload();
      if (auth.currentUser?.uid !== uid) throw new FirebaseAuthClientError("auth/uid-changed");
      await current.getIdToken(true);
      if (auth.currentUser?.uid !== uid) throw new FirebaseAuthClientError("auth/uid-changed");
      return snapshot(current);
    },
  });
}

const OAuthProviderCredential = Object.freeze({
  google: (idToken: string) => {
    const provider = new OAuthProvider("google.com");
    return provider.credential({ idToken });
  },
});
