import { gzipSync } from "fflate";
import type { Question } from "../canonical";
import { contentHasher } from "../../infrastructure/identity/contentHasher";
import type { NodePackageTransport } from "../runtime/nodeContentPackage";
import { PREMIUM_NODE_OFFERS } from "./premiumNodeOffers.smoke";

const offer = PREMIUM_NODE_OFFERS[0]!;
const fixtureQuestion = Object.freeze({
  questionId: "aud04-smoke-fixture-question",
  trackId: offer.trackId,
  nodeId: offer.nodeId,
  mentalUnitId: "aud04-smoke-fixture-unit",
  prompt: "Which statement is true about this local package test?",
  interaction: Object.freeze({ type: "choice_single", scoringMethod: "exact_selected_set", options: Object.freeze([{ optionId: "local_only", text: "It is a local test fixture." }, { optionId: "published", text: "It is published Premium content." }]) }),
  answer: Object.freeze({ type: "choice_single", optionId: "local_only" }),
  feedback: Object.freeze({ type: "choice_single", reason: "The package exists only to exercise local installation and exact runtime resolution.", details: Object.freeze({ boundary: "smoke_only" }) }),
  difficulty: null,
}) as Question;

export function getLocalSmokePremiumNodePackageTransport(): NodePackageTransport {
  return Object.freeze({
    async getNodePackage(trackId, nodeId) {
      if (trackId !== offer.trackId || nodeId !== offer.nodeId) throw new Error("local_smoke_package_not_found");
      const artifactBytes = new TextEncoder().encode(JSON.stringify({
        schemaVersion: "patternly-content-node-payload-v1",
        trackId: offer.trackId,
        nodeId: offer.nodeId,
        contentVersion: offer.contentVersion,
        contentReleaseId: "aud04-local-smoke-fixture",
        items: [fixtureQuestion],
      }));
      const packageBytes = gzipSync(artifactBytes);
      const [artifactSha256, packageSha256] = await Promise.all([contentHasher.sha256Bytes(artifactBytes), contentHasher.sha256Bytes(packageBytes)]);
      if (artifactSha256 !== offer.artifactSha256) throw new Error("local_smoke_package_fixture_hash_mismatch");
      return Object.freeze({
        status: 200,
        headers: new Headers({
          "content-type": "application/gzip",
          "content-length": String(packageBytes.length),
          "x-content-package-sha256": packageSha256,
          "x-content-artifact-sha256": artifactSha256,
          "x-content-version": offer.contentVersion,
          "x-content-release-id": "aud04-local-smoke-fixture",
          "x-content-minimum-app-version": "0.1.0",
          "x-content-artifact-size-bytes": String(artifactBytes.length),
        }),
        bytes: packageBytes,
      });
    },
  });
}
