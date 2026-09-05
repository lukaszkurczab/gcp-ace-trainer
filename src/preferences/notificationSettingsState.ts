export type NotificationSettingsReadToken = Readonly<{
  mutationRevision: number;
  readRevision: number;
  startedWhileBusy: boolean;
}>;

export type NotificationSettingsRequestGuard = Readonly<{
  beginMutation: () => number | null;
  finishMutation: (revision: number) => void;
  beginRead: () => NotificationSettingsReadToken;
  canCommitRead: (token: NotificationSettingsReadToken) => boolean;
}>;

/**
 * Coordinates the small number of async operations owned by the notification settings hook.
 * Reads are committed only when they started idle, are still the latest read, and no mutation
 * has started since them. Mutations are single-flight synchronously before any Promise work.
 */
export function createNotificationSettingsRequestGuard(): NotificationSettingsRequestGuard {
  let busy = false;
  let mutationRevision = 0;
  let readRevision = 0;

  return {
    beginMutation() {
      if (busy) return null;
      busy = true;
      mutationRevision += 1;
      return mutationRevision;
    },
    finishMutation(revision) {
      if (busy && revision === mutationRevision) busy = false;
    },
    beginRead() {
      const token: NotificationSettingsReadToken = {
        mutationRevision,
        readRevision: readRevision + 1,
        startedWhileBusy: busy,
      };
      readRevision = token.readRevision;
      return token;
    },
    canCommitRead(token) {
      return !busy && !token.startedWhileBusy && token.mutationRevision === mutationRevision && token.readRevision === readRevision;
    },
  };
}
