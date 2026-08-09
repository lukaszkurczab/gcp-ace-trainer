import { randomUUID } from "node:crypto";

export type GuestInstallationIdentity = Readonly<{ installationId: string; localDatasetId: string }>;
export type GuestInstallationIdentityPort = Readonly<{ create(): Promise<GuestInstallationIdentity> }>;

export const installationIdentity: GuestInstallationIdentityPort = Object.freeze({
  async create() {
    try {
      return Object.freeze({ installationId: randomUUID(), localDatasetId: randomUUID() });
    } catch (cause) {
      throw new Error("Guest installation identity generation failed.", { cause });
    }
  },
});
