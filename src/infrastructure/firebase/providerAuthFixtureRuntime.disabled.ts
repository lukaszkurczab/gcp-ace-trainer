import type { AppleCredentialDependencies } from "./firebaseAuthClient";
import type { ProviderAuthFixtureCommand } from "./providerAuthFixtureCommand";

export type ProviderAuthFixtureRuntime = Readonly<{
  createAppleCredentialDependencies: (command: ProviderAuthFixtureCommand) => AppleCredentialDependencies;
  createGoogleIdToken: (command: ProviderAuthFixtureCommand) => string;
}>;

const unavailable = (): never => {
  throw new Error("Provider authentication fixtures are unavailable in this runtime.");
};

export function createProviderAuthFixtureRuntime(): ProviderAuthFixtureRuntime {
  return Object.freeze({
    createAppleCredentialDependencies: unavailable,
    createGoogleIdToken: unavailable,
  });
}
