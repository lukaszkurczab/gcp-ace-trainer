export async function createGenerationPinnedSmokeSession({ email, password, appCheck, apiOrigin, authOrigin, fetchImplementation = fetch }) {
  const credentials = { email, password, returnSecureToken: true };
  const passwordSignIn = await postJson(
    new URL("/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key", authOrigin),
    credentials,
    "Firebase password sign-in",
    fetchImplementation,
  );
  const ordinaryIdToken = requiredToken(passwordSignIn.body?.idToken, passwordSignIn.response.status, "Firebase password sign-in");

  const exchange = await postJson(
    new URL("/v1/account/session/exchange", apiOrigin),
    {},
    "Account session exchange",
    fetchImplementation,
    { authorization: `Bearer ${ordinaryIdToken}`, "x-firebase-appcheck": appCheck },
  );
  const customToken = requiredToken(exchange.body?.customToken, exchange.response.status, "Account session exchange");

  const customSignIn = await postJson(
    new URL("/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=fake-api-key", authOrigin),
    { token: customToken, returnSecureToken: true },
    "Firebase generation-pinned sign-in",
    fetchImplementation,
  );
  const pinnedIdToken = requiredToken(customSignIn.body?.idToken, customSignIn.response.status, "Firebase generation-pinned sign-in");
  const authorizationGeneration = readAuthorizationGeneration(pinnedIdToken);

  return Object.freeze({
    idToken: pinnedIdToken,
    appCheck,
    evidence: Object.freeze({
      passwordSignInHttpStatus: passwordSignIn.response.status,
      sessionExchangeHttpStatus: exchange.response.status,
      customTokenSignInHttpStatus: customSignIn.response.status,
      customTokenPresent: true,
      authorizationGeneration,
    }),
  });
}

export function readAuthorizationGeneration(idToken) {
  if (typeof idToken !== "string") throw new Error("Generation-pinned Firebase ID token is invalid.");
  const payload = idToken.split(".")[1];
  if (!payload) throw new Error("Generation-pinned Firebase ID token is invalid.");
  let claims;
  try { claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")); }
  catch { throw new Error("Generation-pinned Firebase ID token is invalid."); }
  const generation = claims.authorizationGeneration;
  if (!Number.isSafeInteger(generation) || generation <= 0) throw new Error("Generation-pinned Firebase ID token has no valid numeric authorizationGeneration.");
  return generation;
}

async function postJson(url, payload, label, fetchImplementation, extraHeaders = {}) {
  let response;
  try {
    response = await fetchImplementation(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...extraHeaders },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    throw new Error(`${label} request failed before an HTTP response was received.`);
  }
  let body;
  try { body = await response.json(); } catch { body = undefined; }
  if (response.status !== 200) {
    const code = safeHttpErrorCode(body);
    throw new Error(`${label} failed (HTTP ${response.status}${code ? `, error.code=${code}` : ""}).`);
  }
  if (!body || typeof body !== "object") throw new Error(`${label} returned an invalid response (HTTP ${response.status}).`);
  return { response, body };
}

function requiredToken(value, status, label) {
  if (typeof value !== "string" || !value) throw new Error(`${label} returned no token (HTTP ${status}).`);
  return value;
}

export function safeHttpErrorCode(body) {
  const value = body?.error?.code;
  return typeof value === "string" && /^[a-zA-Z0-9_-]{1,80}$/u.test(value) ? value : undefined;
}
