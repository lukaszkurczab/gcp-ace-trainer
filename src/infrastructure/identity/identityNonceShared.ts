const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

let testGenerator: (() => string) | null = null;

export function createIdentityNonceFrom(secureRandomUUID: () => string): string {
  try {
    const nonce = (testGenerator ?? secureRandomUUID)();
    if (!UUID_V4.test(nonce)) throw new Error("Secure identity source returned an invalid UUID.");
    return nonce.toLowerCase();
  } catch (cause) {
    throw new Error("Identity nonce generation failed.", { cause });
  }
}

/** Test seam for deterministic command and entropy-failure coverage. */
export function setIdentityNonceGeneratorForTests(generator: (() => string) | null): void {
  testGenerator = generator;
}
