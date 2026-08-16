export type VerifiedFirebaseIdToken = Readonly<{
  aud: string;
  auth_time: number;
  email_verified: boolean;
  exp: number;
  iss: string;
  sub: string;
  uid: string;
}>;

export interface FirebaseIdTokenVerifier {
  verifyIdToken(token: string, checkRevoked: boolean): Promise<VerifiedFirebaseIdToken>;
}

export type VerifiedFirebaseAppCheckToken = Readonly<{
  appId: string;
}>;

export interface FirebaseAppCheckTokenVerifier {
  verifyToken(token: string): Promise<VerifiedFirebaseAppCheckToken>;
}

export type AccountRequestAuthenticationInput = Readonly<{
  headers: Readonly<Record<string, string | undefined>>;
  suppliedUid?: string;
}>;

export type AccountRequestAuthenticationDependencies = Readonly<{
  expectedProjectId: string;
  expectedAppCheckAppIds: readonly string[];
  nowSeconds: () => number;
  requireRecentAuthentication?: boolean;
  appCheckVerifier: FirebaseAppCheckTokenVerifier;
  verifier: FirebaseIdTokenVerifier;
}>;

export type AuthenticatedAccount = Readonly<{
  uid: string;
}>;

const RECENT_AUTHENTICATION_SECONDS = 5 * 60;

const readBearerToken = (authorization: string | undefined): string => {
  if (authorization === undefined) throw new Error("missing_authorization");
  const match = /^Bearer ([^\s]+)$/u.exec(authorization);
  if (!match?.[1]) throw new Error("malformed_authorization");
  return match[1];
};

export async function authenticateAccountRequest(
  request: AccountRequestAuthenticationInput,
  dependencies: AccountRequestAuthenticationDependencies,
): Promise<AuthenticatedAccount> {
  const token = readBearerToken(request.headers.authorization);
  const sensitive = dependencies.requireRecentAuthentication === true;
  const claims = await dependencies.verifier.verifyIdToken(token, sensitive);
  const expectedIssuer = `https://securetoken.google.com/${dependencies.expectedProjectId}`;
  const now = dependencies.nowSeconds();

  if (claims.aud !== dependencies.expectedProjectId) throw new Error("wrong_firebase_project");
  if (claims.iss !== expectedIssuer) throw new Error("wrong_firebase_issuer");
  if (!Number.isFinite(claims.exp) || claims.exp <= now) throw new Error("expired_id_token");
  if (claims.email_verified !== true) throw new Error("unverified_identity");
  if (claims.uid === "" || claims.sub !== claims.uid) throw new Error("invalid_token_subject");
  if (request.suppliedUid !== undefined && request.suppliedUid !== claims.uid) throw new Error("uid_mismatch");
  if (sensitive && (
    !Number.isFinite(claims.auth_time)
    || claims.auth_time <= 0
    || claims.auth_time > now
    || now - claims.auth_time > RECENT_AUTHENTICATION_SECONDS
  )) {
    throw new Error("recent_authentication_required");
  }

  const appCheckToken = request.headers["x-firebase-appcheck"];
  if (appCheckToken === undefined || appCheckToken.trim() === "") throw new Error("missing_app_check");
  const appCheckClaims = await dependencies.appCheckVerifier.verifyToken(appCheckToken);
  if (!dependencies.expectedAppCheckAppIds.includes(appCheckClaims.appId)) {
    throw new Error("wrong_app_check_app");
  }

  return { uid: claims.uid };
}
