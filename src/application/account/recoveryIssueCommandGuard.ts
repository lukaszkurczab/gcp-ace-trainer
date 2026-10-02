import type { FirebaseAuthClient, FirebaseAuthUserSnapshot } from "../../infrastructure/firebase/firebaseAuthClient";
import type { RecoveryOperationSnapshot } from "./recoveryOperationCoordinator";

const hidden: RecoveryOperationSnapshot = Object.freeze({ kind: "loading", blocksProfilePreparation: true });

/** Keep subscribed issue results private until the command's final identity fence. */
export function createRecoveryIssuePublicationGate() {
  let held = false;
  return Object.freeze({
    hold: (): RecoveryOperationSnapshot => { held = true; return hidden; },
    publish: (snapshot: RecoveryOperationSnapshot): RecoveryOperationSnapshot => held ? hidden : snapshot,
    release: (): void => { held = false; },
  });
}

/** A failed read cannot authorize code exposure or keep the old profile open. */
export async function readRecoveryIssueCommandIdentity(input: Readonly<{
  auth: Pick<FirebaseAuthClient, "getSnapshot" | "getAuthorizationGeneration">;
  firebaseUid: string;
  authorizationGeneration: number;
  isRevisionCurrent: () => boolean;
}>): Promise<Readonly<{ current: boolean; user: FirebaseAuthUserSnapshot | null }>> {
  let generation: number | null = null;
  let readable = false;
  try {
    if (input.auth.getSnapshot()?.uid === input.firebaseUid && input.isRevisionCurrent()) {
      generation = await input.auth.getAuthorizationGeneration();
      readable = true;
    }
  } catch { /* Failed forced-token reads close access rather than restore a session. */ }
  const user = input.auth.getSnapshot();
  return Object.freeze({
    current: readable && user?.uid === input.firebaseUid && generation === input.authorizationGeneration && input.isRevisionCurrent(),
    user,
  });
}
