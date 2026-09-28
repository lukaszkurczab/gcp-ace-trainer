import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CANDIDATE_TRACK_IDS } from "./releaseManifest.mjs";

const APP_ROOT = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
export const AUD02D_UDID = "7F315654-3175-4F3C-BB24-B0263F59360C";
export const AUD02D_TRACK_IDS = CANDIDATE_TRACK_IDS;
export const AUD02D_CUSTOM_PRACTICE = Object.freeze(
  [10, 20, 40].flatMap((length) => ["afterEachAnswer", "atSessionEnd"].map((feedbackTiming) => Object.freeze({ length, feedbackTiming }))),
);
export const AUD02D_ENTITLEMENT_SUITES = Object.freeze([
  Object.freeze({ id: "exam", free: ".maestro/rc-certification-exam-free.yaml", premiumRunner: "scripts/runCertificationExamRcIos.mjs", premiumFlows: [".maestro/rc-certification-exam-smoke.yaml", ".maestro/rc-certification-exam-resume-finish.yaml"], tracks: ["google-cloud-associate-cloud-engineer"] }),
  Object.freeze({ id: "coding", free: ".maestro/aud02b-coding-mock-free.yaml", premiumRunner: "scripts/runCodingMockAud02bIos.mjs", premiumFlows: [".maestro/aud02b-coding-mock-premium.yaml", ".maestro/aud02b-coding-mock-expiry.yaml", ".maestro/aud02b-coding-mock-expiry-result.yaml"], tracks: ["coding-interview-dsa-problem-solving"] }),
  Object.freeze({ id: "design", free: ".maestro/aud02c-design-simulation-free.yaml", premiumRunner: "scripts/runDesignInterviewAud02cIos.mjs", premiumFlows: [".maestro/aud02c-design-simulation-premium.yaml", ".maestro/aud02c-design-simulation-timeout.yaml", ".maestro/aud02c-design-simulation-timeout-result.yaml"], tracks: ["backend-system-design-interview", "frontend-system-design-interview", "object-oriented-design-interview"] }),
]);
export const AUD02D_FEEDBACK_REFERENCES = Object.freeze([
  ".maestro/aud02d-feedback-at-session-end.yaml",
  ".maestro/aud02d-feedback-after-each-answer.yaml",
]);

export async function readAud02dBindings(appRoot = APP_ROOT, contentRoot = path.resolve(appRoot, "../patternly-content")) {
  const lockBytes = await readFile(path.join(appRoot, "integration/contracts/content-release/release.lock.json"));
  const lock = JSON.parse(lockBytes.toString("utf8"));
  const trackIds = lock.artifacts.map(({ trackId }) => trackId).sort();
  if (lock.schemaVersion !== 3 || trackIds.length !== 9 || new Set(trackIds).size !== 9 || trackIds.join("\n") !== [...AUD02D_TRACK_IDS].sort().join("\n")) {
    throw new Error("AUD-02D requires the exact nine unique track IDs bound by the canonical candidate lock.");
  }
  const bundledLockBytes = await readFile(path.join(appRoot, "src/content/generated/canonical-content/content-lock.json"));
  const contentBindings = Object.fromEntries(await Promise.all([
    ["candidateManifestSha256", "reports/candidate-reconciliation/AWS-02-DRAFT/candidate/manifest.json"],
    ["releaseManifestSha256", "reports/candidate-reconciliation/AWS-02-DRAFT/release/release.json"],
    ["readinessEvidenceSha256", "evidence/readiness/candidate-readiness-v2.json"],
    ["admissionEvidenceSha256", "evidence/admissions/candidate-admission-v3.json"],
  ].map(async ([key, relativePath]) => [key, hash(await readFile(path.join(contentRoot, relativePath)))])));
  return Object.freeze({
    candidateId: lock.candidateId,
    appLockSha256: hash(lockBytes),
    bundledContentLockSha256: hash(bundledLockBytes),
    contentBindings: Object.freeze(contentBindings),
    trackIds: Object.freeze(trackIds),
  });
}

export function hash(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function canonicalHash(value) {
  const canonical = (entry) => entry === null || typeof entry !== "object"
    ? JSON.stringify(entry)
    : Array.isArray(entry)
      ? `[${entry.map(canonical).join(",")}]`
      : `{${Object.keys(entry).filter((key) => entry[key] !== undefined).sort().map((key) => `${JSON.stringify(key)}:${canonical(entry[key])}`).join(",")}}`;
  return hash(Buffer.from(`${canonical(value)}\n`));
}
