import type { ContentPackagePin } from "../src/domain";

export const TEST_CONTENT_PACKAGE_PIN: ContentPackagePin = Object.freeze({
  packageIdentity: "f".repeat(64),
  packageVersion: "test-free-node-0001",
  contentReleaseId: "test-release-0001",
});
