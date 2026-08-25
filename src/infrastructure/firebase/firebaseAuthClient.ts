import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  applyActionCode,
  connectAuthEmulator,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  getAuth,
  initializeAuth,
  onAuthStateChanged,
  OAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
  type User,
} from "firebase/auth";
import type { FirebaseClientConfiguration } from "./publicConfig";
import { createSecureAuthPersistence } from "./secureAuthPersistence";

export type FirebaseAuthUserSnapshot = Readonly<{
  email: string | null;
  emailVerified: boolean;
  provider: "apple" | "google" | "password";
  uid: string;
}>;

export type FirebaseAuthClient = Readonly<{
  applyActionCode: (code: string) => Promise<void>;
  confirmPasswordReset: (code: string, password: string) => Promise<void>;
  getIdToken: () => Promise<string | null>;
  getSnapshot: () => FirebaseAuthUserSnapshot | null;
  onUserChanged: (listener: (user: FirebaseAuthUserSnapshot | null) => void) => () => void;
  register: (email: string, password: string) => Promise<FirebaseAuthUserSnapshot>;
  resendVerification: () => Promise<void>;
  requestPasswordRecovery: (email: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<FirebaseAuthUserSnapshot>;
  signInWithApple: () => Promise<FirebaseAuthUserSnapshot>;
  signInWithGoogle: (idToken: string) => Promise<FirebaseAuthUserSnapshot>;
  signOut: () => Promise<void>;
  refreshVerification: () => Promise<FirebaseAuthUserSnapshot | null>;
}>;

type FirebaseAuthError = Readonly<{ code?: unknown }>;

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
    if (emulator.protocol !== "http:" || emulator.hostname !== "127.0.0.1") throw new Error("auth_emulator_unconfigured");
    try { connectAuthEmulator(auth, emulator.origin, { disableWarnings: true }); } catch (error) {
      if (firebaseAuthErrorCode(error) !== "auth/emulator-config-failed") throw error;
    }
  }
  return auth;
}

function providerFor(user: User): "apple" | "google" | "password" {
  if (user.providerData.some((provider) => provider.providerId === "apple.com")) return "apple";
  if (user.providerData.some((provider) => provider.providerId === "google.com")) return "google";
  return "password";
}

function snapshot(user: User): FirebaseAuthUserSnapshot {
  return Object.freeze({ email: user.email ?? null, emailVerified: user.emailVerified, provider: providerFor(user), uid: user.uid });
}

function actionSettings(origin: string): Readonly<{ handleCodeInApp: true; url: string }> {
  return Object.freeze({ handleCodeInApp: true, url: origin });
}

export function createFirebaseAuthClient(input: Readonly<{ config: FirebaseClientConfiguration; authActionOrigin: string; authEmulatorOrigin?: string }>): FirebaseAuthClient {
  const auth = firebaseAuth(firebaseApp(input.config), input.authEmulatorOrigin);
  let current: User | null = auth.currentUser;
  const listeners = new Set<(user: FirebaseAuthUserSnapshot | null) => void>();
  onAuthStateChanged(auth, (user) => {
    current = user;
    const next = user ? snapshot(user) : null;
    for (const listener of listeners) listener(next);
  });

  const requireUser = (): User => {
    if (!current) throw new Error("auth/signed-out");
    return current;
  };
  const afterCredential = async (user: User): Promise<FirebaseAuthUserSnapshot> => {
    current = user;
    return snapshot(user);
  };

  return Object.freeze({
    applyActionCode: async (code: string) => { await applyActionCode(auth, code); if (current) await current.reload(); },
    confirmPasswordReset: async (code: string, password: string) => { await confirmPasswordReset(auth, code, password); },
    getIdToken: async () => current ? current.getIdToken() : null,
    getSnapshot: () => current ? snapshot(current) : null,
    onUserChanged: (listener) => { listeners.add(listener); listener(current ? snapshot(current) : null); return () => { listeners.delete(listener); }; },
    register: async (email: string, password: string) => afterCredential((await createUserWithEmailAndPassword(auth, email, password)).user),
    resendVerification: async () => { await sendEmailVerification(requireUser(), actionSettings(input.authActionOrigin)); },
    requestPasswordRecovery: async (email: string) => { await sendPasswordResetEmail(auth, email, actionSettings(input.authActionOrigin)); },
    signIn: async (email: string, password: string) => afterCredential((await signInWithEmailAndPassword(auth, email, password)).user),
    signInWithApple: async () => {
      const apple = require("expo-apple-authentication") as typeof import("expo-apple-authentication");
      if (!(await apple.isAvailableAsync())) throw new Error("auth/apple-unavailable");
      const { randomUUID } = require("expo-crypto") as typeof import("expo-crypto");
      const rawNonce = randomUUID();
      const credential = await apple.signInAsync({ nonce: rawNonce, requestedScopes: [apple.AppleAuthenticationScope.EMAIL, apple.AppleAuthenticationScope.FULL_NAME] });
      if (!credential.identityToken) throw new Error("auth/provider-unavailable");
      const provider = new OAuthProvider("apple.com");
      return afterCredential((await signInWithCredential(auth, provider.credential({ idToken: credential.identityToken, rawNonce }))).user);
    },
    signInWithGoogle: async (idToken: string) => {
      if (idToken.length === 0) throw new Error("auth/provider-unavailable");
      return afterCredential((await signInWithCredential(auth, OAuthProviderCredential.google(idToken))).user);
    },
    signOut: async () => { await signOut(auth); current = null; },
    refreshVerification: async () => { if (!current) return null; await current.reload(); return snapshot(current); },
  });
}

const OAuthProviderCredential = Object.freeze({
  google: (idToken: string) => {
    const provider = new OAuthProvider("google.com");
    return provider.credential({ idToken });
  },
});
