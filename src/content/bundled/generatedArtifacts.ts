import type { BundledContentRelease } from "../contracts";

/**
 * Build-time boundary. The content publishing pipeline replaces this module
 * atomically with immutable generated references; application code imports no
 * repository content, dev-server data, or network client.
 *
 * This release intentionally ships no track artifacts. That is an explicit
 * unavailable state, not a synthetic content bank.
 */
export const GENERATED_BUNDLED_CONTENT_RELEASE: BundledContentRelease = Object.freeze({
  manifest: Object.freeze({
    envelopeVersion: 1,
    releaseId: "release-without-content-artifacts",
    sourceRepositoryCommit: "4d7109d90a6048b67b6cfb3ed7e03389e0d13091",
  }),
  artifacts: Object.freeze([]),
});
