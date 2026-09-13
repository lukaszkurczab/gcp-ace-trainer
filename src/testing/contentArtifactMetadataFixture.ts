import type { ContentArtifactMetadata } from "../content/contracts";

export const TEST_CONTENT_ARTIFACT_METADATA: ContentArtifactMetadata = Object.freeze({
  artifactSha256: "f".repeat(64),
  contentVersion: "test-free-node-0001",
  contentReleaseId: "test-release-0001",
});
