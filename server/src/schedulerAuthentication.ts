import { OAuth2Client } from "google-auth-library";

export type SchedulerClaims = Readonly<{
  aud?: string;
  email?: string;
  email_verified?: boolean;
  exp?: number;
  iss?: string;
  sub?: string;
}>;

export interface SchedulerTokenVerifier {
  verify(token: string, audience: string): Promise<SchedulerClaims>;
}

export class GoogleSchedulerTokenVerifier implements SchedulerTokenVerifier {
  private readonly client = new OAuth2Client();

  async verify(token: string, audience: string): Promise<SchedulerClaims> {
    const ticket = await this.client.verifyIdToken({ audience, idToken: token });
    return ticket.getPayload() ?? {};
  }
}

export async function authenticateSchedulerRequest(input: Readonly<{
  authorization: string | undefined;
  expectedAudience: string;
  expectedEmail: string;
  expectedSubject: string;
  nowSeconds: () => number;
  verifier: SchedulerTokenVerifier;
}>): Promise<void> {
  const match = /^Bearer ([^\s]+)$/u.exec(input.authorization ?? "");
  if (!match?.[1]) throw new Error("scheduler_authorization_required");
  const claims = await input.verifier.verify(match[1], input.expectedAudience);
  if (claims.iss !== "https://accounts.google.com") {
    throw new Error("scheduler_issuer_mismatch");
  }
  if (claims.aud !== input.expectedAudience) throw new Error("scheduler_audience_mismatch");
  if (claims.email_verified !== true || claims.email !== input.expectedEmail) throw new Error("scheduler_email_mismatch");
  if (claims.sub !== input.expectedSubject || !/^\d{10,30}$/u.test(claims.sub)) throw new Error("scheduler_subject_mismatch");
  if (!Number.isFinite(claims.exp) || claims.exp! <= input.nowSeconds()) throw new Error("scheduler_token_expired");
}
