import type { StorageProfile } from "../../infrastructure/storage/profileStorageRouter";
export type AccountSessionGenerationIdentity = Readonly<{ generation: number; uid: string }>;

export type AccountActorIdentity = Readonly<{
  stateKind: "authenticated" | "localOffline";
  uid: string;
  accountId: string;
  generation: AccountSessionGenerationIdentity;
  profile: StorageProfile;
}>;

export type AccountActorIdentityObservation = Readonly<{
  stateKind: string;
  uid: string | null;
  accountId: string | null;
  sdkUid: string | null;
  generation: AccountSessionGenerationIdentity | null;
  generationCurrent: boolean;
  profile: StorageProfile | null;
}>;

/** Shared identity predicate for product confirmation and the Q13 read-only receipt. */
export function matchesAccountActorIdentity(
  expected: AccountActorIdentity,
  current: AccountActorIdentityObservation,
): boolean {
  return current.stateKind === expected.stateKind
    && current.uid === expected.uid
    && current.accountId === expected.accountId
    && current.sdkUid === expected.uid
    && current.generationCurrent
    && current.generation?.uid === expected.generation.uid
    && current.generation.generation === expected.generation.generation
    && current.profile !== null
    && current.profile.id === expected.profile.id
    && current.profile.kind === expected.profile.kind
    && current.profile.accountId === expected.accountId;
}
