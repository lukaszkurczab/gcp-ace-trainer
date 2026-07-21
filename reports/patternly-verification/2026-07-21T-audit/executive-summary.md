# Patternly verification audit

## Status

**COMPLETE_WITH_BLOCKED_AREAS** — the available iOS real-runtime slice, both repositories, the pinned content chain and canonical validators were audited. Cloud Certification, full Simulation, full Summary/Progress lifecycle, Android and the requested content sample breadth remain precisely blocked or unexecuted.

## Audited state

- App: `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly`, `main`, `c5ea1cedff59550eb68ac558705f2e71155bb2fa`, **dirty** (80 pre-existing status entries).
- Content: `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly-content`, `master`, `b424faa6d8c7209acb51ac23af812d08c31842dc`, **clean**.
- Device: iOS Simulator, iPhone 17 / iOS 26.4; local Expo dev build.
- Consumed content: Algorithms release `algorithms-core-0002-b424faa6`, `algorithms-core-0002`, SHA `fccc4c8564c61b1941d398712a2836ca980ce4fc1df1d1d02a12136112d41f0c`.

## Real work performed

- Passed Home → Practice Hub → real Guided Practice question → deliberately incorrect answer → authored feedback.
- Passed leave, relaunch and resume; the same incorrect response state returned at Question 1 of 20.
- Captured 1 real item, 5 primary checkpoints, HTML reports, debug output and accessibility trees.
- Ran supported validators in both repos; results are in `validation-results.md`.

## Key findings

1. **P1:** Cloud Certification cannot be smoke-tested: it has no ingress and no bundled artifact. See `domain-findings.md` DF-001.
2. **P2:** item-level UI-to-artifact evidence is not deterministic because UI does not expose an item correlation key. See `content-mismatches.json` CM-001.
3. **P2:** active-session resume has only a composite accessibility label; title-only automation fails. See `maestro-matrix.md` F07.
4. **P2:** current app tests fail on a Practice Hub option-set mismatch (277 pass / 2 fail). See `validation-results.md`.
5. **CONFIRMED:** Algorithms uses the exact pinned immutable artifact, not HTTP, a fixture or a legacy question bank. See `content-chain.md`.

## Vertical slice actually working

For **Algorithms**, observed evidence reaches: bundled content → Guided Practice question → answer evaluation/Reason → durable leave → app relaunch → resumed answer/feedback state. Summary, Progress mutation, due/remediation/retention and full Simulation are not yet verified on device.

## Biggest unknowns

- Whether the 40-item Simulation completes and materializes Summary correctly.
- Whether completion mutates Progress and due/remediation correctly without duplication.
- Full learner-visible Details and wrong-option explanations over a broad content sample.
- Any Cloud Certification runtime behavior (there is no real artifact to run).

## Next work candidates

See `roadmap-input.md`: Algorithms completion evidence, Certification canonical readiness, runtime auditability, Practice Hub contract reconciliation, and Simulation end-to-end evidence.

## Local changes

Only the untracked report directory was created: reports, logs, screenshots, hierarchies and nonproduction Maestro audit flows. No product/content/release/lock change, commit or push was made. No `audit-changes.patch` exists because no application instrumentation was required.

## Artifacts

All required report artifacts are under this directory; `maestro/` contains the execution evidence and `commands/` contains validator outputs.
