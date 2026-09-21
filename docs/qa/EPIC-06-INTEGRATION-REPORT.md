# EPIC-06 — local integration of ODK-124–129

Date: 2026-09-21
Status: `VERIFIED_CLOSED` for local feature slices; the global release-manifest gate remains outside this epic and is red on historical AWS evidence.

## Reconciliation

The restart snapshot described ODK-124–129 as staged, uncommitted work. Current repository evidence is different: commit `6c8cee2` already contains their code, reports and screenshots, and the application worktree was clean before ODK-097's isolated follow-up `aa07416`. No additional staging or commit of these six task implementations was needed. That broad historical commit also included ODK-114 and ODK-097; it is not represented as six isolated task commits.

| Task | Current implementation and evidence | Existing independent QA | Remaining local gap |
| --- | --- | --- | --- |
| [ODK-124](ODK-124-REPORT.md) | Claude structured prompt/constraints, reset barrier, Light/Dark/large-text captures in `6c8cee2` | PASS, minimum 0.84 | P2: no deterministic screenshot of a separate >400-character prompt |
| [ODK-125](ODK-125-REPORT.md) | Four explicit answer states and checked semantics, runtime screenshots/tree in `6c8cee2` | PASS, minimum 0.86 | Multi-select covered by tests rather than a device capture |
| [ODK-126](ODK-126-REPORT.md) | Report action affordance and form opening, screenshots/tree in `6c8cee2` | PASS, no P0–P2 | None recorded in local report |
| [ODK-127](ODK-127-REPORT.md) | Exact authored Source URL projection, runtime capture in `6c8cee2` | PASS, minimum 0.88 | P2: no separate unavailable/Safari capture |
| [ODK-128](ODK-128-REPORT.md) | Closed Claude/GCP domain metadata with EN/PL and large text captures in `6c8cee2` | PASS, minimum 0.84 | P2: no separate GCP/unknown/empty-state device capture |
| [ODK-129](ODK-129-REPORT.md) | Typed Activity resolver and terminal inline facts, PL captures in `6c8cee2` | PASS, no P0/P1 | No open implementation P1 in report |

The current ODK-097 change routes Design mode entries through Practice Setup; it does not change the ODK-124–129 behavior or their captured content. No path owned by those tasks was edited during this reconciliation.

## Current integration checks

- `npm test`: 1207 total, 1197 PASS, 10 FAIL. The ten failures are the ten `scripts/releaseManifest.test.mjs` cases. A focused rerun confirmed all ten stop at `ACC-02 owning validator rejected content evidence: EVIDENCE_VALUE: aws-certified-solutions-architect-associate.source.artifact.contentVersion does not match catalog.` The historical AWS evidence is not rewritten by this epic.
- `npm run typecheck`: PASS after ODK-097 navigation correction.
- `npm run validate:content-boundary`: PASS.
- `npm run validate:runtime-privacy-boundary`: PASS.
- `npm run check:content-release`: PASS, producer HEAD `33c8286`, inventory `9/117/943/16077`.
- `git diff --cached --check` for the isolated ODK-097 commit: PASS. App worktree is clean after `aa07416`.

The full-suite failure is a global candidate/evidence gate, not a failure in the six local features. Local EPIC-06 task status can close with this explicit release limitation; the global release gate remains red and must not be reported as passing.
