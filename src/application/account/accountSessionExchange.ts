import { FirebaseAuthClientError, type FirebaseAuthClient, type FirebaseAuthUserSnapshot } from "../../infrastructure/firebase/firebaseAuthClient";
import type { MeResponseDto, PatternlyApiClient } from "../../infrastructure/clients/PatternlyApiClientAdapter";
import { AccountSessionGenerationStaleError } from "./profileStartupCoordination";

/** Read /me only after an ordinary Firebase identity has entered a pinned app session. */
export async function getMeWithExchangedSession(input: Readonly<{
  api: Pick<PatternlyApiClient, "exchangeAccountSession" | "getMe">;
  auth: Pick<FirebaseAuthClient, "getAuthorizationGeneration" | "getSnapshot" | "signInWithSessionToken">;
  canContinue: () => boolean;
  onExchangeStarting: () => void;
  user: FirebaseAuthUserSnapshot;
  requiredAuthorizationGeneration?: number;
}>): Promise<MeResponseDto> {
  await ensureAccountSessionGeneration(input);
  if (!input.canContinue() || input.auth.getSnapshot()?.uid !== input.user.uid) throw new AccountSessionGenerationStaleError();
  const response = await input.api.getMe();
  if (!input.canContinue() || input.auth.getSnapshot()?.uid !== input.user.uid) throw new AccountSessionGenerationStaleError();
  return response;
}

export async function ensureAccountSessionGeneration(input: Readonly<{
  api: Pick<PatternlyApiClient, "exchangeAccountSession">;
  auth: Pick<FirebaseAuthClient, "getAuthorizationGeneration" | "getSnapshot" | "signInWithSessionToken">;
  canContinue: () => boolean;
  onExchangeStarting: () => void;
  user: FirebaseAuthUserSnapshot;
  requiredAuthorizationGeneration?: number;
}>): Promise<number> {
  let authorizationGeneration = await input.auth.getAuthorizationGeneration();
  if (!input.canContinue() || input.auth.getSnapshot()?.uid !== input.user.uid) throw new AccountSessionGenerationStaleError();

  if (input.requiredAuthorizationGeneration !== undefined) {
    if (!Number.isSafeInteger(input.requiredAuthorizationGeneration) || input.requiredAuthorizationGeneration < 1 || authorizationGeneration !== input.requiredAuthorizationGeneration) {
      throw new FirebaseAuthClientError("auth/authorization-generation-invalid");
    }
    return authorizationGeneration;
  }

  if (authorizationGeneration === null) {
    const exchanged = await input.api.exchangeAccountSession();
    if (!input.canContinue() || input.auth.getSnapshot()?.uid !== input.user.uid) throw new AccountSessionGenerationStaleError();
    input.onExchangeStarting();
    const exchangedUser = await input.auth.signInWithSessionToken(exchanged.customToken);
    if (!input.canContinue() || input.auth.getSnapshot()?.uid !== input.user.uid || exchangedUser.uid !== input.user.uid) {
      throw new AccountSessionGenerationStaleError();
    }
    const exchangedGeneration = await input.auth.getAuthorizationGeneration();
    if (!input.canContinue() || input.auth.getSnapshot()?.uid !== input.user.uid) throw new AccountSessionGenerationStaleError();
    if (exchangedGeneration === null) throw new FirebaseAuthClientError("auth/authorization-generation-invalid");
    authorizationGeneration = exchangedGeneration;
  }
  return authorizationGeneration;
}

/** Restore the exact issue session only after an explicit sign-in or credential reauthentication. */
export async function ensureRecoveryIssueSignInSession(input: Readonly<{
  api: Pick<PatternlyApiClient, "exchangeAccountSession">;
  auth: Pick<FirebaseAuthClient, "getAuthorizationGeneration" | "getSnapshot" | "signInWithSessionToken">;
  canContinue: () => boolean;
  isExplicitSignInCurrent: () => boolean;
  onExchangeStarting: () => void;
  user: FirebaseAuthUserSnapshot;
  requiredAuthorizationGeneration: number;
}>): Promise<number> {
  const current = () => input.canContinue() && input.isExplicitSignInCurrent() && input.auth.getSnapshot()?.uid === input.user.uid;
  if (!Number.isSafeInteger(input.requiredAuthorizationGeneration) || input.requiredAuthorizationGeneration < 1) throw new FirebaseAuthClientError("auth/authorization-generation-invalid");
  if (!current()) throw new AccountSessionGenerationStaleError();
  const generation = await input.auth.getAuthorizationGeneration();
  if (!current()) throw new AccountSessionGenerationStaleError();
  if (generation !== null && generation !== input.requiredAuthorizationGeneration) {
    throw new FirebaseAuthClientError("auth/authorization-generation-invalid");
  }
  const restored = await ensureAccountSessionGeneration({
    ...input,
    canContinue: current,
    ...(generation === null ? { requiredAuthorizationGeneration: undefined } : {}),
  });
  if (!current()) throw new AccountSessionGenerationStaleError();
  if (restored !== input.requiredAuthorizationGeneration) throw new FirebaseAuthClientError("auth/authorization-generation-invalid");
  return restored;
}
