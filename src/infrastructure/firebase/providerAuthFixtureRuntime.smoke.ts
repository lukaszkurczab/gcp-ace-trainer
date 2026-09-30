import type { AppleCredentialDependencies } from "./firebaseAuthClient";
import type { AppleAuthenticationCredential } from "expo-apple-authentication";
import type { ProviderAuthFixtureCommand } from "./providerAuthFixtureCommand";
import type { ProviderAuthFixtureRuntime } from "./providerAuthFixtureRuntime.disabled";

function subjectFor(command: ProviderAuthFixtureCommand): string {
  return `patternly-smoke-${command.provider}-${command.runId}`;
}

function assertProvider(command: ProviderAuthFixtureCommand, provider: ProviderAuthFixtureCommand["provider"]): void {
  if (command.provider !== provider) throw new Error(`This fixture is armed for ${command.provider}, not ${provider}.`);
}

function createExpoRawNonce(): string {
  const { randomUUID } = require("expo-crypto") as typeof import("expo-crypto");
  return randomUUID();
}

export function createProviderAuthFixtureRuntime(
  options: Readonly<{ createRawNonce?: () => string }> = {},
): ProviderAuthFixtureRuntime {
  return Object.freeze({
    createGoogleIdToken(command) {
      assertProvider(command, "google");
      return JSON.stringify({ sub: subjectFor(command), email_verified: true });
    },
    createAppleCredentialDependencies(command): AppleCredentialDependencies {
      assertProvider(command, "apple");
      const apple = Object.freeze({
        AppleAuthenticationScope: Object.freeze({ EMAIL: 1, FULL_NAME: 0, 0: "FULL_NAME", 1: "EMAIL" }) satisfies AppleCredentialDependencies["apple"]["AppleAuthenticationScope"],
        async isAvailableAsync() { return true; },
        async signInAsync(options) {
          const nonce = options?.nonce ?? "";
          const result = {
            user: subjectFor(command),
            state: options?.state ?? null,
            fullName: null,
            email: null,
            realUserStatus: 2 as AppleAuthenticationCredential["realUserStatus"],
            identityToken: JSON.stringify({ sub: subjectFor(command), email_verified: true, nonce }),
            authorizationCode: null,
          } satisfies AppleAuthenticationCredential;
          return result;
        },
      }) satisfies AppleCredentialDependencies["apple"];
      return Object.freeze({ apple, createRawNonce: options.createRawNonce ?? createExpoRawNonce });
    },
  });
}
