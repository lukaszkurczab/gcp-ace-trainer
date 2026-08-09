export type PublicEnvironmentName = "sandbox" | "production";

export type ConfiguredPublicEnvironment = Readonly<{
  apiOrigin: string;
  androidAppLinkHost: string;
  authActionOrigin: string;
  authRedirectDomain: string;
  environment: PublicEnvironmentName;
  iosAssociatedDomain: string;
  privacyUrl: string;
  publicDeletionUrl: string;
  publicWebOrigin: string;
  supportUrl: string;
  termsUrl: string;
  transactionalSenderDomain: string;
}>;

export type PublicEnvironment =
  | Readonly<{ kind: "configured"; value: ConfiguredPublicEnvironment }>
  | Readonly<{ kind: "unconfigured"; reason: "no_public_environment_configuration" }>;

const REQUIRED_KEYS = [
  "apiOrigin",
  "androidAppLinkHost",
  "authActionOrigin",
  "authRedirectDomain",
  "environment",
  "iosAssociatedDomain",
  "privacyUrl",
  "publicDeletionUrl",
  "publicWebOrigin",
  "supportUrl",
  "termsUrl",
  "transactionalSenderDomain",
] as const;

const invalid = (name: string): never => { throw new Error(`invalid_public_environment:${name}`); };

const exactHttpsUrl = (value: unknown, name: string, allowPath = false): string => {
  if (typeof value !== "string" || value.trim() !== value || value.length === 0) invalid(name);
  const text = value as string;
  let parsed: URL;
  try { parsed = new URL(text); } catch { return invalid(name); }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || (!allowPath && (parsed.pathname !== "/" || parsed.search || parsed.hash))) invalid(name);
  return text;
};

const hostname = (value: unknown, name: string): string => {
  if (typeof value !== "string" || value.trim() !== value || value.length === 0 || /[/:?#@]/u.test(value)) invalid(name);
  const text = value as string;
  try {
    const parsed = new URL(`https://${text}`);
    if (parsed.hostname !== text || parsed.port) invalid(name);
  } catch { invalid(name); }
  return text;
};

const isDefaultFirebaseDomain = (hostnameValue: string): boolean => hostnameValue.endsWith(".firebaseapp.com") || hostnameValue.endsWith(".web.app");

/**
 * Validates only public configuration. Secrets and provider credentials never
 * belong in an application bundle or this schema.
 */
export function parseConfiguredPublicEnvironment(input: unknown): ConfiguredPublicEnvironment {
  if (typeof input !== "object" || input === null || Array.isArray(input)) invalid("shape");
  const source = input as Record<string, unknown>;
  if (Object.keys(source).sort().join(":") !== [...REQUIRED_KEYS].sort().join(":")) invalid("shape");
  if (source.environment !== "sandbox" && source.environment !== "production") invalid("environment");
  const environment = source.environment as PublicEnvironmentName;
  const apiOrigin = exactHttpsUrl(source.apiOrigin, "apiOrigin");
  const publicWebOrigin = exactHttpsUrl(source.publicWebOrigin, "publicWebOrigin");
  const authActionOrigin = exactHttpsUrl(source.authActionOrigin, "authActionOrigin");
  const privacyUrl = exactHttpsUrl(source.privacyUrl, "privacyUrl", true);
  const termsUrl = exactHttpsUrl(source.termsUrl, "termsUrl", true);
  const supportUrl = exactHttpsUrl(source.supportUrl, "supportUrl", true);
  const publicDeletionUrl = exactHttpsUrl(source.publicDeletionUrl, "publicDeletionUrl", true);
  const authRedirectDomain = hostname(source.authRedirectDomain, "authRedirectDomain");
  const androidAppLinkHost = hostname(source.androidAppLinkHost, "androidAppLinkHost");
  const transactionalSenderDomain = hostname(source.transactionalSenderDomain, "transactionalSenderDomain");
  if (typeof source.iosAssociatedDomain !== "string" || !source.iosAssociatedDomain.startsWith("applinks:")) invalid("iosAssociatedDomain");
  const iosAssociatedDomain = `applinks:${hostname((source.iosAssociatedDomain as string).slice("applinks:".length), "iosAssociatedDomain")}`;
  const relevantHosts = [new URL(apiOrigin).hostname, new URL(publicWebOrigin).hostname, new URL(authActionOrigin).hostname, authRedirectDomain, androidAppLinkHost, transactionalSenderDomain, iosAssociatedDomain.slice("applinks:".length)];
  if (environment === "production" && relevantHosts.some(isDefaultFirebaseDomain)) invalid("production_default_firebase_domain");
  return Object.freeze({ apiOrigin, androidAppLinkHost, authActionOrigin, authRedirectDomain, environment, iosAssociatedDomain, privacyUrl, publicDeletionUrl, publicWebOrigin, supportUrl, termsUrl, transactionalSenderDomain });
}

/** Local builds have no implicit network destination. A supplied configuration
 * must pass the closed schema before any approved client can be composed. */
export const LOCAL_SAFE_PUBLIC_ENVIRONMENT: PublicEnvironment = Object.freeze({
  kind: "unconfigured",
  reason: "no_public_environment_configuration",
});
