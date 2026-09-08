import type { VerifiedContentPackage } from "../contracts";
const VERIFIED_PACKAGES = new WeakSet<object>();
/** Internal resolver/capacity boundary. Do not export from the application barrel. */
export function markResolvedContentPackage(pkg: VerifiedContentPackage): VerifiedContentPackage { VERIFIED_PACKAGES.add(pkg); return pkg; }
export function assertResolvedContentPackage(pkg: VerifiedContentPackage): void { if (!VERIFIED_PACKAGES.has(pkg)) throw new Error("Content package was not resolved and verified by ContentPackageResolver."); }
