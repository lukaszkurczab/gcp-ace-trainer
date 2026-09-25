import { createHash } from "node:crypto";

const SHA256_PATTERN = /^[a-f0-9]{64}$/u;
const COMMIT_PATTERN = /^[a-f0-9]{40}$/u;
const IOS_BUILD_KEYS = Object.freeze(["appVersion", "buildId", "buildNumber", "bundleIdentifier"]);
const CONFIGURATION_KEYS = Object.freeze([
  "apiOrigin",
  "appCheckAppleProvider",
  "authActionOrigin",
  "channel",
  "environment",
  "firebaseProjectId",
  "iosAssociatedDomain",
  "publicWebOrigin",
  "runtimeMode",
  "runtimeVersion",
  "updatesUrl",
]);

function compare(left, right) { return left === right ? 0 : left < right ? -1 : 1; }
export function canonicalJson(value) {
  if (value === null) return "null";
  if (["boolean", "string"].includes(typeof value)) return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("Canonical JSON does not accept non-finite numbers.");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (!value || typeof value !== "object") throw new TypeError("Canonical JSON accepts JSON values only.");
  return `{${Object.keys(value).sort(compare).map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
}
export function canonicalHash(value) { return createHash("sha256").update(canonicalJson(value)).digest("hex"); }

function exactKeys(value, keys, label) {
  if (!value || typeof value !== "object" || Array.isArray(value) || canonicalJson(Object.keys(value).sort(compare)) !== canonicalJson([...keys].sort(compare))) {
    throw new Error(`${label} has unsupported or missing fields.`);
  }
}
function nonEmpty(value, label) {
  if (typeof value !== "string" || value.trim() !== value || value.length === 0) throw new Error(`${label} must be a non-empty trimmed string.`);
}

export function validateSigningReleaseBinding(binding) {
  exactKeys(binding, ["configuration", "iosBuild"], "Signing release binding");
  exactKeys(binding.iosBuild, IOS_BUILD_KEYS, "Signing iOS build identity");
  for (const key of IOS_BUILD_KEYS) nonEmpty(binding.iosBuild[key], `Signing iOS build identity ${key}`);
  if (!/^\d+$/u.test(binding.iosBuild.buildNumber)) throw new Error("Signing iOS build identity buildNumber must be decimal digits.");
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/u.test(binding.iosBuild.buildId)) throw new Error("Signing iOS build identity buildId is invalid.");
  exactKeys(binding.configuration, CONFIGURATION_KEYS, "Signing public configuration");
  for (const key of CONFIGURATION_KEYS) nonEmpty(binding.configuration[key], `Signing public configuration ${key}`);
  if (binding.configuration.runtimeMode !== "release" || binding.configuration.environment !== "production" || binding.configuration.channel !== "production") {
    throw new Error("Signing public configuration must identify the production release profile.");
  }
  if (!/^https:\/\//u.test(binding.configuration.apiOrigin) || !/^https:\/\//u.test(binding.configuration.authActionOrigin) || !/^https:\/\//u.test(binding.configuration.publicWebOrigin) || !/^https:\/\//u.test(binding.configuration.updatesUrl)) {
    throw new Error("Signing public configuration origins and updatesUrl must use HTTPS.");
  }
  return binding;
}

export function validateReleaseEvidence(value, { expectedId, expectedApplicationCommit } = {}) {
  const signing = value?.id === "signing-and-builds";
  exactKeys(value, ["applicationCommit", "evidenceReferences", "evidenceSha256", "id", ...(signing ? ["releaseBinding"] : []), "schemaVersion", "status", "verifiedAt", "verifiedBy"], "Release evidence");
  if (value.schemaVersion !== "patternly-release-evidence-v2" || value.status !== "verified") throw new Error("Release evidence envelope identity is invalid.");
  nonEmpty(value.id, "Release evidence id");
  if (expectedId !== undefined && value.id !== expectedId) throw new Error("Release evidence id mismatch.");
  if (!COMMIT_PATTERN.test(value.applicationCommit ?? "") || (expectedApplicationCommit !== undefined && value.applicationCommit !== expectedApplicationCommit)) throw new Error("Release evidence application commit mismatch.");
  if (typeof value.verifiedAt !== "string" || Number.isNaN(Date.parse(value.verifiedAt)) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/u.test(value.verifiedAt)) throw new Error("Release evidence verifiedAt is invalid.");
  nonEmpty(value.verifiedBy, "Release evidence verifiedBy");
  if (!Array.isArray(value.evidenceReferences) || value.evidenceReferences.length === 0) throw new Error("Release evidence references are required.");
  for (const reference of value.evidenceReferences) {
    exactKeys(reference, ["kind", "value"], "Release evidence reference");
    nonEmpty(reference.kind, "Release evidence reference kind");
    nonEmpty(reference.value, "Release evidence reference value");
  }
  if (signing) validateSigningReleaseBinding(value.releaseBinding);
  const { evidenceSha256, ...identity } = value;
  if (!SHA256_PATTERN.test(evidenceSha256 ?? "") || evidenceSha256 !== canonicalHash(identity)) throw new Error("Release evidence hash mismatch.");
  return value;
}

export function signingManifestBinding(evidence) {
  validateReleaseEvidence(evidence, { expectedId: "signing-and-builds" });
  return {
    configurationFingerprint: canonicalHash(evidence.releaseBinding.configuration),
    evidence: [{ id: evidence.id, sha256: evidence.evidenceSha256 }],
    iosBuild: { ...evidence.releaseBinding.iosBuild },
  };
}
