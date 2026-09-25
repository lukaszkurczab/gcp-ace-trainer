import type { PatternlyApiClient } from "../../infrastructure/clients/PatternlyApiClientAdapter";
import { FirebaseAuthClientError, type FirebaseAuthClient, type FirebaseAuthUserSnapshot } from "../../infrastructure/firebase/firebaseAuthClient";
import type { LocalLogoutControl, LocalLogoutControlSnapshot, PendingRevoke } from "../../infrastructure/storage/localLogoutControl";
import { ensureAccountSessionGeneration } from "./accountSessionExchange";
import { AccountSessionGenerationStaleError } from "./profileStartupCoordination";

/** Completes one durable remote-revocation marker while account storage stays closed. */
export async function resumePendingSessionRevocation(input: Readonly<{
  api: Pick<PatternlyApiClient, "exchangeAccountSession" | "revokeSessions">;
  auth: Pick<FirebaseAuthClient, "getAuthorizationGeneration" | "getSnapshot" | "signInWithSessionToken">;
  canContinue: () => boolean;
  control: Pick<LocalLogoutControl, "completePendingRevoke">;
  onSessionTokenSignIn: () => void;
  pending: PendingRevoke;
  user: FirebaseAuthUserSnapshot;
}>): Promise<LocalLogoutControlSnapshot> {
  const expectedGeneration = await ensureAccountSessionGeneration({
    api: input.api,
    auth: input.auth,
    canContinue: input.canContinue,
    onExchangeStarting: input.onSessionTokenSignIn,
    user: input.user,
  });
  if (!input.canContinue()) throw new AccountSessionGenerationStaleError();
  const response = await input.api.revokeSessions(input.pending.operationId);
  if (!input.canContinue() || response.operationId !== input.pending.operationId) throw new AccountSessionGenerationStaleError();
  input.onSessionTokenSignIn();
  const replacementUser = await input.auth.signInWithSessionToken(response.customToken);
  if (!input.canContinue() || replacementUser.uid !== input.user.uid || input.auth.getSnapshot()?.uid !== input.user.uid) {
    throw new AccountSessionGenerationStaleError();
  }
  const replacementGeneration = await input.auth.getAuthorizationGeneration();
  if (!input.canContinue()) throw new AccountSessionGenerationStaleError();
  if (replacementGeneration !== expectedGeneration) throw new FirebaseAuthClientError("auth/authorization-generation-invalid");
  const completed = await input.control.completePendingRevoke(input.pending.uid, input.pending.operationId, input.canContinue);
  if (!input.canContinue()) throw new AccountSessionGenerationStaleError();
  return completed;
}
