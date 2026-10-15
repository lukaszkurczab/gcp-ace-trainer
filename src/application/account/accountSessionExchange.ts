import { FirebaseAuthClientError, type FirebaseAuthClient, type FirebaseAuthUserSnapshot } from "../../infrastructure/firebase/firebaseAuthClient";
import type { MeResponseDto, PatternlyApiClient } from "../../infrastructure/clients/PatternlyApiClientAdapter";
import { AccountSessionGenerationStaleError } from "./profileStartupCoordination";
import type { RecoveryOperationSnapshot } from "./recoveryOperationCoordinator";

/** Explicit ISSUE may repair a missing claim; an existing issue keeps its vault pin. */
export async function prepareRecoveryIssueSession(input: Readonly<{
  api: Pick<PatternlyApiClient, "exchangeAccountSession">;
  auth: Pick<FirebaseAuthClient, "getAuthorizationGeneration" | "getSnapshot" | "signInWithSessionToken" | "reauthenticateWithCredential">;
  credentials: Parameters<FirebaseAuthClient["reauthenticateWithCredential"]>[0];
  pending: RecoveryOperationSnapshot;
  canContinue: () => boolean;
  onExchangeStarting: () => void;
  onGenerationCaptured?: (generation: number | null) => void;
  user: FirebaseAuthUserSnapshot;
}>): Promise<number> {
  const current = () => input.canContinue() && input.auth.getSnapshot()?.uid === input.user.uid;
  const { pending } = input;
  if (!current()) throw new AccountSessionGenerationStaleError();
  if (pending.kind !== "idle" && pending.kind !== "terminal" && pending.kind !== "issue") throw new FirebaseAuthClientError("auth/authorization-generation-invalid");
  if (pending.kind === "issue" && (pending.firebaseUid !== input.user.uid || pending.deferredFor)) throw new FirebaseAuthClientError("auth/authorization-generation-invalid");
  const observed = await input.auth.getAuthorizationGeneration();
  if (!current()) throw new AccountSessionGenerationStaleError();
  if (observed !== null && (!Number.isSafeInteger(observed) || observed < 1)) throw new FirebaseAuthClientError("auth/authorization-generation-invalid");
  const required = pending.kind === "issue" ? pending.authorizationGeneration : observed;
  if (pending.kind === "issue" && observed !== null && observed !== required) throw new FirebaseAuthClientError("auth/authorization-generation-invalid");
  input.onGenerationCaptured?.(required);
  await input.auth.reauthenticateWithCredential(input.credentials);
  if (!current()) throw new AccountSessionGenerationStaleError();
  const sessionInput = { ...input, canContinue: current };
  return required === null
    ? ensureAccountSessionGeneration(sessionInput)
    : ensureRecoveryIssueSignInSession({ ...sessionInput, isExplicitSignInCurrent: current, requiredAuthorizationGeneration: required });
}

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
