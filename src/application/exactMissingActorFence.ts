import type { StorageProfile } from "../infrastructure/storage/profileStorageRouter";
import type { GuestInstallation } from "../storage/repositories/guestInstallationRepository";

type ActorKind = "guest" | "authenticated" | "other";

export type ExactMissingActorFence = Readonly<{ isCurrent(): boolean | Promise<boolean> }>;
export type ExactMissingActorAnchor = Readonly<{
  profile: StorageProfile;
  storage: object;
  guestInstallation: GuestInstallation | null;
}>;

export function sameExactMissingProfile(left: StorageProfile | null, right: StorageProfile | null): boolean {
  return left !== null && right !== null && left.id === right.id && left.kind === right.kind && left.accountId === right.accountId;
}

/** Captures the profile/storage owner before bootstrap starts resuming its active session. */
export async function captureExactMissingActorAnchor(input: Readonly<{
  profile: StorageProfile | null;
  storage: object | null;
  readGuestInstallation: () => Promise<GuestInstallation | null>;
  hasGuestAccess: () => boolean;
}>): Promise<ExactMissingActorAnchor | null> {
  const profile = input.profile;
  const storage = input.storage;
  if (!profile || !storage) return null;
  const anchorProfile = Object.freeze({ id: profile.id, kind: profile.kind, accountId: profile.accountId });
  if (["guest", "legacy_guest"].includes(profile.kind)) {
    const guestInstallation = await input.readGuestInstallation();
    if (!guestInstallation || profile.accountId !== null || guestInstallation.accountId !== null
      || guestInstallation.localDatasetId !== profile.id || guestInstallation.bindingState !== "guest" || !input.hasGuestAccess()) return null;
    return Object.freeze({ profile: anchorProfile, storage, guestInstallation: Object.freeze({ ...guestInstallation }) });
  }
  if (!["account", "legacy_owner"].includes(profile.kind) || !profile.accountId) return null;
  return Object.freeze({ profile: anchorProfile, storage, guestInstallation: null });
}

/** Captures the existing local Guest or authenticated account/profile owner for one explicit recovery confirmation. */
export async function captureExactMissingActorFence(input: Readonly<{
  actorKind: ActorKind;
  currentActorKind(): ActorKind;
  profile: StorageProfile | null;
  currentProfile(): StorageProfile | null;
  storage: object;
  currentStorage(): object | null;
  isCurrentAccountActor?: () => boolean;
  guestInstallationAnchor?: GuestInstallation;
  readGuestInstallation?: () => Promise<GuestInstallation | null>;
  hasGuestAccess?: () => boolean;
}>): Promise<ExactMissingActorFence | null> {
  if (input.actorKind === "authenticated") {
    const profile = input.profile;
    const isCurrentAccountActor = input.isCurrentAccountActor;
    if (!profile || !["account", "legacy_owner"].includes(profile.kind) || !profile.accountId || !isCurrentAccountActor?.()) return null;
    return Object.freeze({ isCurrent: () => input.currentActorKind() === "authenticated"
      && sameExactMissingProfile(profile, input.currentProfile()) && input.currentStorage() === input.storage && isCurrentAccountActor() });
  }
  if (input.actorKind !== "guest") return null;
  const profile = input.profile;
  const readInstallation = input.readGuestInstallation;
  const hasGuestAccess = input.hasGuestAccess;
  if (!profile || !["guest", "legacy_guest"].includes(profile.kind) || profile.accountId !== null || !readInstallation || !hasGuestAccess) return null;
  const installation = input.guestInstallationAnchor ?? await readInstallation();
  if (!installation || installation.accountId !== null || installation.localDatasetId !== profile.id || installation.bindingState !== "guest" || !hasGuestAccess()) return null;
  return Object.freeze({ isCurrent: async () => {
    const actorAndScopeAreCurrent = () => input.currentActorKind() === "guest"
      && sameExactMissingProfile(profile, input.currentProfile())
      && input.currentStorage() === input.storage
      && hasGuestAccess();
    if (!actorAndScopeAreCurrent()) return false;
    const current = await readInstallation();
    return actorAndScopeAreCurrent() && current?.installationId === installation.installationId && current.localDatasetId === profile.id
      && current.accountId === null && current.bindingState === "guest";
  } });
}

/** Captures a fresh consent fence only when the user confirms the exact unavailable-session action. */
export async function captureExactMissingActorFenceAtConfirmation(input: Readonly<{
  anchor: ExactMissingActorAnchor | null;
  actorKind: ActorKind;
  currentActorKind(): ActorKind;
  currentProfile(): StorageProfile | null;
  currentStorage(): object | null;
  captureCurrentAuthenticatedActorFence?: () => Readonly<{ isCurrent(): boolean }> | null;
  readGuestInstallation: () => Promise<GuestInstallation | null>;
  hasGuestAccess: () => boolean;
}>): Promise<ExactMissingActorFence | null> {
  const anchor = input.anchor;
  if (!anchor || !sameExactMissingProfile(anchor.profile, input.currentProfile()) || input.currentStorage() !== anchor.storage) return null;
  const accountProfile = ["account", "legacy_owner"].includes(anchor.profile.kind);
  if (accountProfile) {
    if (input.actorKind !== "authenticated" || !anchor.profile.accountId) return null;
    const accountFence = input.captureCurrentAuthenticatedActorFence?.();
    if (!accountFence || !accountFence.isCurrent()) return null;
    const fence = await captureExactMissingActorFence({
      actorKind: "authenticated",
      currentActorKind: input.currentActorKind,
      profile: anchor.profile,
      currentProfile: input.currentProfile,
      storage: anchor.storage,
      currentStorage: input.currentStorage,
      isCurrentAccountActor: accountFence.isCurrent,
    });
    return fence ? Object.freeze({ isCurrent: () => sameExactMissingProfile(anchor.profile, input.currentProfile())
      && input.currentStorage() === anchor.storage && fence.isCurrent() }) : null;
  }

  if (input.actorKind !== "guest" || anchor.guestInstallation === null || anchor.profile.accountId !== null) return null;
  const fence = await captureExactMissingActorFence({
    actorKind: "guest",
    currentActorKind: input.currentActorKind,
    profile: anchor.profile,
    currentProfile: input.currentProfile,
    storage: anchor.storage,
    currentStorage: input.currentStorage,
    guestInstallationAnchor: anchor.guestInstallation,
    readGuestInstallation: input.readGuestInstallation,
    hasGuestAccess: input.hasGuestAccess,
  });
  return fence ? Object.freeze({ isCurrent: () => sameExactMissingProfile(anchor.profile, input.currentProfile())
    && input.currentStorage() === anchor.storage && fence.isCurrent() }) : null;
}
