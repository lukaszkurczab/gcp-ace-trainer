# Stage 1 Canonical Learning Kernel — Implementation Handoff

## Goal and decision scope

Replace the mixed global training domain with a small, family-agnostic kernel while preserving the active Algorithms and Cloud Certification learning flows. This handoff covers planning and acceptance only; the next implementation loop owns code changes.

## Evidence-backed status

| Area | Status | Evidence |
| --- | --- | --- |
| Baseline | done | `npm run recovery:check`, `npm run typecheck`, `npm test`, `npm run validate:questions`, `npm run qa:static`, `npm run baseline:report`, and `git diff --check` all passed before this handoff. |
| Algorithms item and response ownership | partial | `src/tracks/algorithms/algorithmQuestionTypes.ts` owns `AlgorithmQuestion`, but `src/domain/training/trainingItem.ts` and `trainingAttempt.ts` still define global concrete unions. |
| Certification item and response ownership | partial | `src/types/question.ts` owns the active `Question` schema; Cloud content maps it into the global training item union. |
| Kernel session/result/review contracts | planned | `src/domain/training` still contains old item references, result variants, confidence, inferred review kind, and `expired` session status. |
| Runtime registry | partial | `src/domain/tracks/trackRegistry.ts` validates tracks, but the registry imports Algorithms content and global mode/item taxonomies. |
| Persistence migration | planned | repository guards and queue repository persist the old attempt, session, and review shapes. |
| Final verification | planned | no Stage 1 cutover exists yet. |

## Verified contradictions and risks

- The v3 recovery plan requires a family-agnostic kernel, but the active registry imports Algorithms content (`src/domain/tracks/trackRegistry.ts`).
- `TrainingItem`, `TrainingAttemptResponse`, and `TrainingAttemptResult` combine Cloud and Algorithms semantics in `src/domain/training`; replacing only their definitions would break active scoring, review, storage, and UI consumers.
- Cloud `Question` has one active owner today (`src/types/question.ts`), so relocating it must update every direct import atomically. A re-export bridge would violate the requested single-owner outcome.
- Existing sessions, attempts, and review entries have a persisted old shape. The Stage 1 decision must explicitly choose either a storage reset or a migration; no silent reader fallback is acceptable.

## Implementation-ready tasks

### 1. Kernel and runtime registry

- Goal: create the canonical `ContentItemRef`, session, attempt, result, evidence, queue, and registry contracts.
- Scope: `src/domain/training`, `src/domain/tracks`, kernel-focused tests.
- Non-goals: family scoring logic, UI rendering, question-bank content changes.
- Inputs: `recovery/stage-1-kernel-inventory.json`, docs 02, 04, 15–17, and the v3 plan.
- Acceptance criteria: plain string track/family ids resolve through a registry; unknown track/family throws; session and result constructors enforce requested invariants; kernel imports no family content; no confidence or legacy result/review symbols remain.
- Verification: focused kernel tests, import-boundary search, `npm run typecheck`.
- Required evidence: updated inventory and a cutover report recording owner paths and deleted symbols.
- Risks: changing persistence shapes before repositories are migrated.
- Report target: `recovery/stage-1-kernel-cutover-report.json`.

### 2. Family ownership cutover

- Goal: make Algorithms and Cloud Certification directly own their concrete items, responses, modes, and scoring inputs.
- Scope: `src/tracks/algorithms`, `src/tracks/cloud-certification`, Cloud question imports, track adapters.
- Non-goals: schema/content redesign or Stage 2 runtime behavior.
- Inputs: task 1 contracts and existing active family tests.
- Acceptance criteria: Algorithms uses `AlgorithmQuestion` and family responses directly; Cloud `Question` is moved atomically under its family; the global item/response/mode union is deleted; registry does not import Algorithms content.
- Verification: Algorithms and certification regression tests plus forbidden-symbol search.
- Required evidence: import graph/search output showing no global concrete union and no second Cloud question owner.
- Risks: Cloud UI/exam imports and cross-family adapter generics.
- Report target: cutover report family-owner section.

### 3. Runtime and persistence consumer migration

- Goal: move session creation, scoring, review creation, repositories, selectors, and active screens to direct kernel envelopes.
- Scope: domain sessions, storage repositories/guards, review/progress consumers, Algorithms session model, Cloud bridges.
- Non-goals: new session modes, visual redesign, retention policy redesign.
- Inputs: tasks 1 and 2 contracts.
- Acceptance criteria: all persisted attempts include required result/evidence; review entries use required source/evidence and explicit reasons; no inferred review kind/retention field remains; active flows compile without compatibility adapters.
- Verification: focused session/storage/Algorithms/Cloud regressions and full test suite.
- Required evidence: storage guards reject prior shape explicitly and active repository tests cover canonical shapes.
- Risks: persisted local data contract decision; behavior regressions in review/progress projections.
- Report target: cutover report active-consumer and behavior-preservation sections.

### 4. Architecture enforcement and acceptance

- Goal: make the Stage 1 boundary mechanically enforceable and close the recovery packet.
- Scope: `recovery/removal-inventory.json`, recovery check, focused tests, report.
- Non-goals: later recovery stages.
- Inputs: completed tasks 1–3.
- Acceptance criteria: recovery check rejects forbidden symbols/imports, no old global contracts are exported, required artifacts have source commit and timestamps, all mandatory commands pass.
- Verification: required seven-command baseline plus focused kernel/architecture tests and all required searches.
- Required evidence: `recovery/stage-1-kernel-cutover-report.json`.
- Risks: stale removal inventory and tests that continue to encode old contracts.
- Report target: final Stage 1 delivery report.

## First next task

Execute task 1 first. Its contracts and import boundary are prerequisites for every direct family/runtime migration; starting with a family adapter or storage conversion would recreate the mixed domain in a new location.

## Unverified areas

The current repository has no evidence for a storage-reset versus explicit-migration decision for existing local training records. The implementation loop must resolve that product/data decision before modifying persistence readers.
