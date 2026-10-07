# Q13 signing recovery tool QA

**Verdict: PASS WITH GAPS.** The source changes implement the reviewed simulator-signing correction and a separately guarded v2-to-v2 regeneration path. Focused tests and typecheck pass. This accepts the source tooling only: the corrected artifact has not been built, signed, inspected, installed, or run in this review.

The build driver changes only the Xcode invocation from unsigned/linker-signed mode to `CODE_SIGNING_ALLOWED=YES` and `CODE_SIGN_IDENTITY=-` for the existing simulator Release build. It retains the private checkout/root guards, exact admitted refs, smoke environment validation, Auth/API readiness probes, existing simulator destination, arm64 architecture, derived-data scope, and mode-0600 private build log. The change does not edit Xcode project/configuration, bundle identity, entitlements, Keychain settings, or product code. The test asserts the signing arguments are present and the unsigned override absent.

The v2 regeneration dispatch is separate from the legacy v1 flow. For an existing v2 binding, it requires `completed_bound`, exact v2 top-level/tool version, admitted source/content identity, exact tool/source/five-path patch key sets with SHA-256 values, and app-tree plus embedded-JS hashes. It checks detached HEAD, exact current five-path scope, each on-disk patch hash, source hashes against both the binding and `git show HEAD`, and exact generated-helper directory contents. It creates a fresh nonce and refuses an identical nonce before mutation. Success restores only the two tracked source files and removes only the three generated helpers, confirms a clean checkout, then reapplies the current tool into a new external binding. The prior binding bytes remain unchanged.

Tests exercise a prior v2 binding generated through the real `applyPatchToDetachedCheckout` and `bindBuiltApp` helpers, then verify fresh-nonce success, old-binding preservation, unchanged content lock, and exactly five resulting patch paths. They also test same-nonce, wrong build outcome, occupied output, stale ref/content/source/build binding, and changed/missing/extra/symlink patch-path refusals before mutation. One narrow coverage gap remains: the generated-directory exact-name guard is present in source, but the “extra file” test is caught earlier by Git status; no case currently makes an ignored extra helper-directory entry bypass Git status and exercise that specific guard. The guard is nonetheless explicit and the actual working-tree scope remains exact.

The signing change is not evidence that signing caused the prior local logout-control failure. That previous Release run stopped at the first gate read before profile storage preparation and Q13 resume; its safe category remains corrupt versus unavailable. If the new artifact passes signature checks but startup fails at the same gate, stop without retry, clearing, or bypass. Only install after the artifact itself passes the briefing’s bundle identifier, signature identifier, ad-hoc/no-linker, and strict verification checks.

## Verification

- `node --import tsx --test 'docs/active/BIZQ-01/premium-completion-33/q13-test-attestation/*.test.*'`: **26/26 passed**.
- `node --check docs/active/BIZQ-01/premium-completion-33/q13-test-attestation/generate.mjs`: passed.
- `npm run typecheck`: passed.
- No private checkout, build, install, runtime, device, or product-source mutation was performed.

Scores: objective/architecture fit **0.94**, simplicity **0.83**, risk **0.82**, maintainability **0.85**; minimum **0.82** (threshold **0.80**). The remaining risks are the unverified signed artifact and the still-unknown local logout-control category; both are explicit pre-install/run gates rather than implied success.

Reviewed source hashes:

- `q13-build-release.mjs`: `68a4dcbd0211fd4d0101598ee3308481cb317bd0933ec894f6e85798c3845796`
- `q13-test-attestation/generate.mjs`: `0f70117cac29151ad86faa37635d789fb6cd768a5ff588af803e6ae6839f76ec`
- `q13-test-attestation/generate.test.mjs`: `ba611aa5cd086163e934d18202576be55aa3b51d196f94b69f97c5a1d27dde8e`
- `q13-test-attestation/README.md`: `5d49373c64e9aba4a3e6d7a81fcd540434cfc6d89d36364aa0c2efdc7e1dfd69`
