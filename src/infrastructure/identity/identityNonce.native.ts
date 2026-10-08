import * as Crypto from "expo-crypto";
import { createIdentityNonceFrom } from "./identityNonceShared";

export function createIdentityNonce(): string {
  return createIdentityNonceFrom(Crypto.randomUUID);
}
