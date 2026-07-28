# Patternly — release-candidate closure

## Goal

Reach `RC_VERIFIED` only when the pushed application and content commits identify
one immutable multi-track release, the active product paths are canonical, and
current iOS/Android acceptance and accessibility evidence is complete. Otherwise
the state is `BLOCKED` with a reproducible reason.

## Reconciled status — 2026-07-28

Source and current execution evidence take precedence over the previous RC plan.
The completed implementation descriptions were removed from this active document;
their immutable history remains in Git.

| Area | Status | Current evidence |
| --- | --- | --- |
| Canonical Certification mode vocabulary (RC-002) | done | Seven enabled modes, including `certification-exam-simulation`; retired runtime state and duplicate scorer removed. |
| Certification simulation policy and profile (RC-003) | done | Product-owned Patternly policy is published in the profile; the user approved this decision. |
| Canonical simulation lifecycle, draft, timer and finalization (RC-004–RC-007) | done | `CertificationFamilyRuntime` and shared lifecycle own prepare, durable drafts, deadline finalization and result evidence. |
| Parallel exam runtime removal (RC-008) | done | Active UI surfaces use the shared lifecycle and durable projections; duplicate state and scoring paths are removed. |
| Certification feedback and pool readiness (RC-009–RC-010) | done | Every published Certification item has `Reason`, structured `Details` and exact option explanations; publication requires all seven declared modes and profile-compatible capacity. |
| Algorithms readiness and content ingress cleanup (RC-011–RC-012) | done | Previous verified evidence remains valid for the current content source. |
| Immutable multi-track release (RC-013) | partial | `patternly-core-0014` is built locally and synchronized into the app. The content and app commits still require final verification, commit and push. |
| Content gate and local privacy boundaries (RC-014–RC-017) | done | Existing source, tests and CI configuration remain the canonical implementation. |
| iOS acceptance (RC-018) | planned | Requires a current, provenance-bound capture packet. |
| Android acceptance (RC-019) | planned | Requires a current, provenance-bound capture packet. |
| Accessibility and visual review (RC-020) | planned | Runs only against the current iOS and Android capture packets. |
| Final RC evidence pack (RC-021) | planned | Requires all prior rows to be done and exact pushed heads. |

## Current release identity

| Field | Value |
| --- | --- |
| Release | `patternly-core-0014` |
| Producer release commit | `e18fc731e1b577750f954e8f017520e546afc7f9` |
| Content source commit | `7b2e96a5e357264e6ce06a75dbeb11e386a3dea1` |
| Algorithms artifact | `algorithms-core-0007`, `89462b2e0f6f47b5b5c3c62652937609fa8be37d0d399b02b6629c58cdbcec54` |
| Certification artifact | `gcp-ace-0013`, `55dff7ce486cbd1c21b2a8094d60c5ab47d48635256c28c2b2bf83088dc274a2` |

## Active implementation packets

### RC-008 completion — prove and remove any remaining parallel exam ownership

- Goal: retain one Certification session lifecycle and one durable projection path.
- Scope: active routes, `src/features/exam/`, route imports, summary/review queries and their tests.
- Non-goals: unrelated Certification practice changes or visual redesign.
- Acceptance: no duplicate session state, scoring owner, route or selector; every remaining screen uses the shared lifecycle and durable projection.
- Verification: reachability search, typecheck, focused lifecycle/projection tests and full suite.
- Evidence: deleted-path diff plus passing commands.
- Risk: a UI component may be canonical even though its former filename mentions exam; delete only after its reachability and ownership are proved.

### RC-013 completion — publish the verified release pair

- Goal: make the app and content remotes identify exactly the release above.
- Scope: clean worktrees, content push, app bundle/lock push and remote-head confirmation.
- Non-goals: a new release build or artifact rewrite.
- Acceptance: both remote heads contain the verified source; bundle, lock, manifest and checksums agree; neither track becomes available through another artifact.
- Verification: release cross-repo test, typecheck, full suite, clean status and `git ls-remote`.
- Evidence: pushed SHA pair and command output.
- Risk: any source change after verification invalidates its SHA-bound evidence.

### RC-018 and RC-019 — capture current platform acceptance

- Goal: record all supported Algorithms and Certification paths on one explicit iOS simulator/device and one explicit Android emulator/device.
- Scope: current app/release identity, happy paths, resume, finalization, review and explicit unavailable/error states.
- Non-goals: changing behavior solely to obtain screenshots.
- Acceptance: every supported mode has a provenance-bound screenshot/runner manifest; missing or failed state blocks its packet.
- Verification: platform capture scripts, manifest validation and manual real-flow check.
- Evidence: device metadata, app/content/release SHA, screenshots and runner output.
- Risk: unavailable device or native build is an operational blocker, not a skipped state.

### RC-020 and RC-021 — independent quality gate and final decision

- Goal: assess the current capture packets for accessibility/visual defects and issue a binary RC decision.
- Scope: VoiceOver/TalkBack, text scaling, reduced motion, focus order, touch targets, contrast, remote heads, release lock and CI evidence.
- Non-goals: silent acceptance of an open high-severity finding.
- Acceptance: no Critical or High finding remains; every final-gate item is bound to the exact pushed SHA pair.
- Verification: native assistive-technology checks, capture review, release-lock inspection and all prior task commands.
- Evidence: signed audit report and final evidence packet.
- Risk: a post-acceptance commit requires targeted recapture and review.

## Execution rules

1. Continue with the narrowest unblocked packet that advances `RC_VERIFIED`.
2. Do not add fallbacks, compatibility paths, temporary content or synthetic evidence.
3. A product decision belongs in `docs/po-questions/` only when repository and approved policy do not determine one safe answer.
4. Do not mark a packet done before its exact changes are committed, pushed and verified where the packet requires it.
5. Current source, current tests and current captures override older reports.
