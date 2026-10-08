import { randomUUID } from "node:crypto";
import { createIdentityNonceFrom } from "./identityNonceShared";

export function createIdentityNonce(): string {
  return createIdentityNonceFrom(randomUUID);
}
