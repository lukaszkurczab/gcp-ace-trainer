export type PatternlyAppCheckTokenProvider = () => Promise<string | null>;

let provider: PatternlyAppCheckTokenProvider | null = null;

/** Firebase App Check composition owns installation of the provider. No token is fabricated when it is absent. */
export function configurePatternlyAppCheckTokenProvider(next: PatternlyAppCheckTokenProvider | null): void {
  provider = next;
}

export async function getPatternlyAppCheckToken(): Promise<string | null> {
  return provider ? provider() : null;
}
