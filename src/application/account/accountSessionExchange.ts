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
}>): Promise<number> {
  let authorizationGeneration = await input.auth.getAuthorizationGeneration();
  if (!input.canContinue() || input.auth.getSnapshot()?.uid !== input.user.uid) throw new AccountSessionGenerationStaleError();

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
