import type { PatternlyApiClient } from "../../infrastructure/clients/PatternlyApiClientAdapter";
import { FirebaseAuthClientError, type FirebaseAuthClient, type FirebaseAuthUserSnapshot } from "../../infrastructure/firebase/firebaseAuthClient";
import type { LocalLogoutControl, LocalLogoutControlSnapshot, PendingRevoke } from "../../infrastructure/storage/localLogoutControl";
import { ensureAccountSessionGeneration } from "./accountSessionExchange";
import { AccountSessionGenerationStaleError } from "./profileStartupCoordination";

/**
 * Serializes drains that mutate the singleton Firebase Auth client. Identical
 * UID/generation callers join; a new owner waits, then runs its own fresh read.
 */
export function createPendingSessionRevocationDrain() {
  type Owner = Readonly<{ generation: number; uid: string; isCurrent: () => boolean }>;
  type Active = Readonly<{ generation: number; uid: string; promise: Promise<LocalLogoutControlSnapshot> }>;
  let active: Active | null = null;

  const run = async (
    owner: Owner,
    drain: () => Promise<LocalLogoutControlSnapshot>,
  ): Promise<LocalLogoutControlSnapshot> => {
    if (!owner.isCurrent()) throw new AccountSessionGenerationStaleError();
    const current = active;
    if (current?.uid === owner.uid && current.generation === owner.generation) {
      const snapshot = await current.promise;
      if (!owner.isCurrent()) throw new AccountSessionGenerationStaleError();
      return snapshot;
    }
    if (current) {
      try { await current.promise; } catch { /* The next owner must re-read durable state. */ }
      if (!owner.isCurrent()) throw new AccountSessionGenerationStaleError();
      return run(owner, drain);
    }

    const promise = Promise.resolve().then(async () => {
      if (!owner.isCurrent()) throw new AccountSessionGenerationStaleError();
      return drain();
    });
    const entry = Object.freeze({ generation: owner.generation, uid: owner.uid, promise });
    active = entry;
    try {
      const snapshot = await promise;
      if (!owner.isCurrent()) throw new AccountSessionGenerationStaleError();
      return snapshot;
    } finally {
      if (active === entry) active = null;
    }
  };

  return Object.freeze({ run });
}

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

/** Re-read and resume every durable revoke for a UID under one Auth owner. */
export async function drainPendingSessionRevocations(input: Readonly<{
  api: Pick<PatternlyApiClient, "exchangeAccountSession" | "revokeSessions">;
  auth: Pick<FirebaseAuthClient, "getAuthorizationGeneration" | "getSnapshot" | "signInWithSessionToken">;
  canContinue: () => boolean;
  control: Pick<LocalLogoutControl, "completePendingRevoke" | "read">;
  executor: ReturnType<typeof createPendingSessionRevocationDrain>;
  generation: number;
  onSnapshot: (snapshot: LocalLogoutControlSnapshot) => void;
  onSessionTokenSignIn: () => void;
  user: FirebaseAuthUserSnapshot;
}>): Promise<LocalLogoutControlSnapshot> {
  return input.executor.run({ generation: input.generation, isCurrent: input.canContinue, uid: input.user.uid }, async () => {
    let snapshot = await input.control.read();
    if (!input.canContinue()) throw new AccountSessionGenerationStaleError();
    input.onSnapshot(snapshot);
    for (const pending of snapshot.pending.filter((entry) => entry.uid === input.user.uid)) {
      snapshot = await resumePendingSessionRevocation({
        api: input.api,
        auth: input.auth,
        canContinue: input.canContinue,
        control: input.control,
        onSessionTokenSignIn: input.onSessionTokenSignIn,
        pending,
        user: input.user,
      });
      if (!input.canContinue()) throw new AccountSessionGenerationStaleError();
      input.onSnapshot(snapshot);
    }
    return snapshot;
  });
}
