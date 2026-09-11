# GATE-03 — portable four-repository release manifest

Status: `done`

## Outcome

- One canonical `patternly-release-manifest-v1` binds the exact clean HEADs of `patternly`, `patternly-backend`, `patternly-content`, and `patternly-web`.
- Its deterministic `manifestId` covers the ACC-02 `candidateId`, the exact nine-track scope, repository identities, and hashes of the owning release/readiness/OpenAPI contracts.
- Creation and verification reject dirty or stale repositories, malformed or legacy repository sets, altered references, unsafe paths and symlinks, and invalid content/OpenAPI ownership evidence.
- Enforced launch readiness now fails closed when the four-repository manifest is missing or invalid, while provider and owner evidence remain separate blockers.
- Reports contain repository roles and portable relative paths rather than machine-local absolute paths.

The final evidence file is generated outside all four worktrees only after their commits are stable, then verified again from that external location.

## Verification

- Pre-implementation briefing validation: `gpt-5.6-luna`, reasoning `max`, minimum score `0.85` (`0.93 / 0.85 / 0.86 / 0.90`).
- Independent QA: `gpt-5.6-luna`, reasoning `max`, `PASS`, no open findings after one remediation loop.
- Contract tests: `23/23` passed.
- Full application suite: `1089/1089` passed.
- `node --check scripts/releaseManifest.mjs` and `node --check scripts/releaseGate.mjs`: passed.
- `git diff --check`: passed.

GATE-04 remains responsible for wiring the full four-repository contract into CI.
