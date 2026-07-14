import { canonicalSerialize } from "../../infrastructure/identity/canonicalSerialization";
import { contentHasher } from "../../infrastructure/identity/contentHasher";
export async function createIdentityFingerprint(value: unknown): Promise<string> { return contentHasher.sha256(canonicalSerialize(value)); }
export async function createAttemptId(sessionId: string, itemId: string, response: unknown): Promise<string> { return `attempt:${sessionId}:${itemId}:${await createIdentityFingerprint(response)}`; }
