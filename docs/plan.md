Patternly — Working Execution Loop

Status: working document
Repository: lukaszkurczab/gcp-ace-trainer
Product: Patternly
Purpose: control the implementation process from GPT planning through Codex implementation, Git push, GPT review, documentation update, and next-step decision.

⸻

1. Purpose

This document defines the working process for developing Patternly in controlled iterations.

Patternly is currently transitioning from a GCP ACE Trainer codebase into a multi-track technical learning product. The main implementation risk is adding new features on top of legacy GCP-shaped architecture before the shared Patternly domain model is stable.

The process must prevent:

- implementing features without a clear product/architecture goal,
- letting Codex make broad uncontrolled changes,
- mixing documentation updates, architecture changes, UI changes, and feature work in one pass,
- progressing without review,
- allowing documentation to become stale after implementation,
- building Algorithms as a second generic quiz instead of a separate learning system.

⸻

2. Core Working Loop

Every implementation cycle follows this loop:

GPT planning prompt
↓
Codex implementation
↓
Push to GitHub
↓
GPT review of pushed changes
↓
Decision:
├─ accept → update working docs → move to next task
└─ reject / partial → create correction prompt → Codex fixes → push again

No implementation step should be considered complete until GPT has reviewed the pushed diff and the working documentation reflects the new repo state.

⸻

3. Roles

GPT

GPT acts as:

- product-engineering reviewer,
- architecture reviewer,
- documentation maintainer,
- prompt author for Codex,
- quality gate before moving to the next task.

GPT is responsible for:

- defining the next task,
- checking whether the task matches Patternly’s product direction,
- reviewing Codex output after push,
- identifying regressions, overreach, missing tests, and documentation drift,
- deciding whether to proceed or request corrections,
- updating this working plan when the repository state changes.

GPT must not assume implementation success without inspecting the pushed repo state.

Codex

Codex acts as:

- implementation agent,
- repository-aware engineer,
- test runner,
- local change author.

Codex is responsible for:

- inspecting the current repository before making changes,
- implementing only the requested scope,
- running relevant checks,
- reporting changed files,
- pushing changes to GitHub when requested.

Codex must not:

- silently broaden scope,
- rewrite unrelated files,
- mix unrelated phases,
- implement future phases early,
- treat legacy GCP-specific architecture as canonical shared Patternly architecture,
- skip tests unless it explicitly explains why.

GitHub

GitHub is the source of truth for review.

Every completed Codex implementation pass must result in:

- pushed branch or commit,
- visible diff,
- implementation summary,
- tests/checks summary.

⸻

4. Current Repository Baseline

Current observed baseline:

- App stack: Expo / React Native / TypeScript.
- Product name in app.json: Patternly.
- Repo/package identity still contains gcp-ace-trainer.
- Documentation now treats Patternly as a multi-track product.
- docs/README.md describes GCP ACE as historical context of the first certification track, not as the full product scope.
- ADR-005-dark-first-focus-lab-ui.md supersedes the earlier light-first direction.
- Shell is split into Home/Practice/Progress/Settings tab components.
- Runtime UI uses dark-first tokens in key shell paths.
- Storage active keys use patternly:v1:\*.
- Legacy gcpAceTrainer.\* keys are still read/cleared for compatibility.
- Cloud Certification track is active.
- Algorithms track exists in registry but remains draft.
- Cloud practice/exam/review flows still rely on Question, ExamDomain, AttemptSummary, PracticeAnswerRecord, and ActiveExamSession.
- There is no canonical shared implementation yet for:
  - TrainingItem,
  - TrainingSession,
  - TrainingAttempt,
  - ReviewQueueItem,
  - UserProgress.
- Progress/review are still partially Cloud-shaped and not fully track-aware.
- CI/release gate is missing or not yet production-ready.

⸻

5. Canonical Product Decisions

The following decisions are active unless explicitly changed in documentation:

1. Patternly is the canonical product name.
2. Patternly is a multi-track technical learning product.
3. First product tracks:
   - cloud-certification,
   - algorithms.
4. Certification-style learning and LeetCode-like / algorithmic learning are separate learning systems.
5. Tracks may share:
   - app shell,
   - navigation,
   - design system,
   - storage primitives,
   - session history,
   - progress infrastructure,
   - review infrastructure.
6. Tracks must not be collapsed into one generic quiz loop.
7. 14-learning-effectiveness-model.md is the canonical general learning model.
8. 15-certification-track-learning-system.md is the canonical certification learning model.
9. 16-leetcode-like-learning-system.md is the canonical LeetCode-like / algorithmic learning model.
10. UI direction is dark-first Focus Lab:
    - calm,
    - premium,
    - technical,
    - domain-neutral,
    - focused,
    - non-gamified.
11. Fake precision metrics such as generic readiness/retention percentages are not canonical product metrics.
12. GCP-specific implementation concepts are current implementation reality, not canonical shared architecture.

⸻

6. Active Implementation Strategy

Current priority is not UI polish and not Algorithms feature expansion.

The correct next implementation direction is:

1. refresh the working plan to match current repo reality,
2. add shared domain contracts,
3. add session engine primitives,
4. add track content/scoring/review adapter contracts,
5. add storage repositories for new training models,
6. migrate Cloud Certification gradually,
7. implement Algorithms MVP on the canonical model,
8. then align Progress/Review,
9. then perform Focus Lab UI alignment,
10. then add QA/CI/release gates.

⸻

7. Development Phases

Phase 0 — Planning Baseline Refresh

Goal: make the planning documents reflect the actual current repository state.

Scope:

- Update planning/patternly-product-audit-and-execution-plan.md.
- Mark completed or partially completed:
  - documentation alignment,
  - ADR-005 dark-first decision,
  - Home shell split,
  - removal of fake readiness UI,
  - Patternly v1 storage namespace,
  - observable storage issues.
- Remove or demote outdated blockers from active P0 lists.
- Keep active P0 blockers:
  - no shared TrainingItem,
  - no shared TrainingSession,
  - no shared TrainingAttempt,
  - no shared ReviewQueueItem,
  - no shared UserProgress,
  - Algorithms track is draft-only,
  - Cloud flow still relies on GCP/question-shaped models.

Definition of done:

- The planning file no longer contradicts the current repo state.
- Historical observations are clearly marked as historical.
- Active next steps are unambiguous.

Suggested commit:

docs/planning: refresh Patternly execution baseline

⸻

Phase 1 — Shared Domain Contract Foundation

Goal: create neutral Patternly domain contracts before migrating screens or adding Algorithms content.

Create or update:

src/domain/training/
trainingItem.ts
trainingSession.ts
trainingAttempt.ts
trainingFeedback.ts
trainingReview.ts
trainingProgress.ts
index.ts

Minimum contracts:

TrainingItem

- id
- trackId
- contentVersion
- type
- prompt/title/question
- taxonomyRefs
- difficulty?
- estimatedTime?
- learningObjective?
  TrainingSession
- id
- trackId
- modeId
- status
- startedAt
- completedAt?
- itemIds
- currentItemIndex
  TrainingAttempt
- id
- trackId
- sessionId
- itemId
- itemType
- modeId
- answeredAt
- response
- result
- confidence?
- mistakeTypes?
- feedbackSignals
  ReviewQueueItem
- id
- trackId
- itemId
- sourceAttemptId
- dueAt
- priority
- reason
- mistakeTypes
  UserProgress
- trackId
- taxonomyProgress
- recentActivity
- reviewQueueSummary
- evidenceSignals

Rules:

- Question may remain for Cloud Certification content.
- Question must not become the shared Patternly root model.
- No UI migration in this phase unless required for type exports.
- No Algorithms feature implementation in this phase.

Tests to add:

tests/trainingContracts.test.ts
tests/sessionModel.test.ts
tests/reviewQueueModel.test.ts

Definition of done:

- Contracts can represent at least one Cloud item and one Algorithms item.
- Tests demonstrate both tracks without any.
- Existing Cloud flows still compile.
- npm run typecheck passes.
- npm test passes.

Suggested commit:

domain: add shared training contracts

State: accepted

⸻

Phase 2 — Track Adapter Contracts

Goal: make tracks responsible for content, scoring, and review behavior without hardcoding everything into shared screens.

Create:

src/tracks/cloud-certification/
cloudCertificationContentAdapter.ts
cloudCertificationScoringAdapter.ts
cloudCertificationReviewAdapter.ts
index.ts
src/tracks/algorithms/
algorithmsContentAdapter.ts
algorithmsScoringAdapter.ts
algorithmsReviewAdapter.ts
index.ts

Cloud Certification adapter:

- maps existing Question into TrainingItem,
- keeps correctness-based scoring,
- maps existing domains/tags into taxonomy refs,
- does not rewrite Cloud screens yet.

Algorithms adapter:

- defines item/scoring/review contracts,
- may return empty content initially,
- does not enable Algorithms UI yet.

Definition of done:

- Both tracks expose content/scoring/review adapter contracts.
- Cloud adapter maps existing question content.
- Algorithms adapter compiles and is tested with fixture items.
- Shared domain does not import Cloud-specific types.

Suggested commit:

tracks: add content and scoring adapter contracts

State: accepted

⸻

Phase 3 — Session Engine Primitives

Goal: create a testable session engine outside React Native screens.

Create:

src/domain/sessions/
createTrainingSession.ts
answerTrainingItem.ts
completeTrainingSession.ts
sessionNavigation.ts
sessionScoring.ts
index.ts

Engine must support:

- starting a session,
- navigating items,
- recording answers,
- completing a session,
- calculating result state,
- feedback timing:
  - immediate,
  - after_submit,
  - session_summary_only.

Rules:

- Do not redesign screens.
- Do not migrate Cloud UI fully yet.
- Use tests before UI integration.

Tests:

tests/sessionEngine.test.ts

Definition of done:

- Cloud practice can be simulated through the engine in tests.
- Algorithms pattern drill can be simulated with fixture items in tests.
- Existing app behavior is not broken.

Suggested commit:

domain: add training session engine primitives

State: accepted

⸻

Phase 4 — Storage Repositories for Training Models

Goal: stop expanding localStorage.ts as a global helper and introduce repositories for the new domain model.

Create:

src/storage/repositories/
activeTrackRepository.ts
trainingAttemptRepository.ts
trainingSessionRepository.ts
reviewQueueRepository.ts
userProgressRepository.ts
storageResult.ts

Rules:

- Keep legacy storage compatibility.
- New code should use repositories.
- Storage errors should be observable.
- Do not silently convert corrupt data into valid product state.

Tests:

tests/storageRepositories.test.ts

Definition of done:

- New training models have repository coverage.
- Missing/corrupt data cases are tested.
- Existing Cloud storage still works.

Suggested commit:

storage: add training repositories

⸻

Phase 5 — Cloud Certification Migration

Goal: migrate the working Cloud Certification flow to the canonical training model without breaking existing behavior.

Scope:

src/features/practice/
src/features/exam/
src/features/review/
src/features/analytics/
src/tracks/cloud-certification/

Steps:

1. Map Cloud questions to TrainingItem.
2. Map practice answers to TrainingAttempt.
3. Map exam summaries to session-level attempts/progress.
4. Generate review queue entries from:
   - incorrect answers,
   - marked items,
   - low confidence,
   - repeated weak taxonomy nodes.
5. Keep exam simulation Cloud-specific.
6. Keep immediate feedback for practice.

Definition of done:

- Cloud practice works.
- Cloud exam works.
- Review works.
- Cloud progress reads from canonical attempt/progress structures.
- No shared code depends on ExamDomain as a root architecture concept.

Suggested commits:

cloud: map certification questions to training items
cloud: migrate practice attempts to training attempts
cloud: connect certification review to review queue

⸻

Phase 6 — Algorithms MVP Pattern Drill

Goal: make Algorithms a real MVP track without building a LeetCode clone.

Create content pack:

data/tracks/algorithms/algorithms-core-v1.json

Initial content:

- 3–5 algorithmic patterns:
  - two pointers,
  - sliding window,
  - hash map,
  - binary search,
  - DFS/BFS.
- 2–3 original items per pattern.
- Item types:
  - pattern_identification,
  - strategy_choice,
  - complexity_analysis.

No code editor.
No runtime execution.
No LeetCode references.
No copied problem statements.

UI scope:

- enable algorithms-pattern-drill,
- add simple item renderer,
- add answer selection,
- add feedback:
  - why this pattern,
  - why alternatives are weaker,
  - time complexity,
  - space complexity,
  - mistake type.

Definition of done:

- Algorithms no longer shows only draft state.
- User can complete one Pattern Drill session.
- Attempts save as TrainingAttempt.
- Progress shows minimal pattern-level signal.

Suggested commits:

algorithms: add MVP pattern drill content
algorithms: enable pattern drill session

⸻

Phase 7 — Shared Review and Progress

Goal: replace placeholder progress/review with real track-aware diagnostics.

Review queue must represent actual due/pending items, not merely the number of answered practice records.

Progress should show concrete evidence signals:

- practice coverage,
- first-attempt accuracy,
- repeated mistake types,
- due review count,
- weak taxonomy nodes,
- recent activity.

Avoid:

- generic readiness percentage,
- generic retention percentage,
- fake certainty,
- exam-passing predictions.

Definition of done:

- Review queue uses ReviewQueueItem.
- Cloud progress shows topic/domain diagnostics.
- Algorithms progress shows pattern diagnostics.
- Home recommendations are explainable.

Suggested commits:

review: add due review queue model
progress: add track-aware progress diagnostics

⸻

Phase 8 — Focus Lab UI Alignment

Goal: align screens with dark-first Focus Lab after domain and product flows are stable.

Scope:

- Home,
- Practice,
- Progress,
- Settings,
- Cloud practice/session screens,
- Algorithms pattern drill,
- review screens,
- empty/loading/error states,
- icons,
- spacing,
- card density,
- typography.

Rules:

- No major domain changes in this phase.
- UI copy must not expose implementation tasks such as “content and scoring are next”.
- Track-specific accents must remain restrained.
- Do not make Patternly look like Google, LeetCode, a bootcamp app, or a gamified learning app.

Definition of done:

- Main screens are consistently dark-first.
- No placeholder tab icons.
- Empty states are user-facing, not developer-facing.
- Maestro screenshots exist for both tracks.

Suggested commits:

ui: align shell screens with Focus Lab
ui: complete empty and unavailable states

⸻

Phase 9 — QA, CI, and Release Gate

Goal: make progress measurable and prevent regressions.

Add or update:

.github/workflows/ci.yml
.maestro/release/
eas.json or docs/release-build.md
docs/release-checklist.md

CI should run:

npm run typecheck
npm test
npm run validate:questions

Later add:

npm run validate:tracks

Maestro release flows should cover:

- app opens,
- track switch,
- Cloud practice,
- Cloud review,
- Algorithms pattern drill,
- Settings local data reset confirmation.

Definition of done:

- CI exists.
- Release checklist exists.
- Maestro release flows exist or are explicitly deferred.
- No P0/P1 issues remain before release candidate.

Suggested commit:

qa: add CI and release gates

⸻

8. Iteration Template

Each implementation iteration should use this structure.

8.1 GPT Planning Prompt

Before Codex starts, GPT prepares a precise prompt with:

- goal,
- scope,
- files likely involved,
- files not allowed,
- current repo assumptions,
- required checks,
- acceptance criteria,
- expected commit shape.

Prompt must include:

Do not broaden scope.
Do not implement later phases.
Inspect the current repo before editing.
Report changed files and checks run.

8.2 Codex Implementation

Codex implements only the requested scope.

Expected Codex output:

Summary

- ...
  Changed files
- ...
  Checks run
- npm run typecheck
- npm test
- ...
  Notes / risks
- ...

  8.3 Push to GitHub

After implementation:

- push branch/commit,
- provide commit SHA or PR URL,
- include summary and checks.

  8.4 GPT Review

GPT reviews the pushed state.

Review checklist:

- Did Codex stay in scope?
- Did it modify forbidden files?
- Did it implement the requested architecture/product goal?
- Did it avoid legacy architecture leakage?
- Did it preserve existing Cloud functionality?
- Did tests cover the new behavior?
- Did documentation need updates?
- Did the working plan need updates?
- Is the repo ready for the next phase?

  8.5 Decision

Use one of these statuses:

ACCEPTED
PARTIAL_ACCEPT
REJECTED
NEEDS_CORRECTION
NEEDS_MANUAL_DECISION

8.6 Documentation Update

After accepted or partially accepted implementation:

- update this working file,
- update audit/execution plan if needed,
- mark completed phases/tasks,
- add newly discovered risks,
- adjust next prompt.

No phase should be considered closed until documentation reflects the actual pushed state.

⸻

9. GPT Review Report Template

Use this after every Codex push.

# Patternly GPT Review

Date:
Reviewed commit / PR:
Scope requested:
Scope delivered:

## Verdict

Status: ACCEPTED / PARTIAL_ACCEPT / REJECTED / NEEDS_CORRECTION / NEEDS_MANUAL_DECISION

## Summary

...

## What matches the request

- ...

## Problems found

- ...

## Scope issues

- ...

## Architecture/product concerns

- ...

## Tests and validation

Reported by Codex:

- ...
  Verified by GPT:
- ...

## Documentation impact

- Working plan update needed: yes/no
- Product docs update needed: yes/no
- ADR update needed: yes/no
- Testing docs update needed: yes/no

## Required corrections

1. ...
2. ...

## Next recommended action

...

⸻

10. Codex Prompt Template

Use this for each implementation pass.

Act as a strict senior product-engineering implementation agent for Patternly.
You are working in the repository:
`lukaszkurczab/gcp-ace-trainer`

## Goal

[Insert one precise goal.]

## Current context

Patternly is transitioning from a GCP ACE Trainer implementation into a multi-track technical learning product.
The current canonical product direction is:

- Patternly is multi-track.
- First tracks are `cloud-certification` and `algorithms`.
- Certification-style learning and LeetCode-like / algorithmic learning have separate mechanics.
- Shared infrastructure is allowed: shell, design system, storage primitives, sessions, attempts, progress, review.
- Do not collapse both tracks into one generic quiz/question loop.
- Dark-first Focus Lab is the canonical UI direction.
- Avoid fake precision metrics such as generic readiness/retention percentages.

## Scope

Allowed:

- [Allowed files/areas.]
  Not allowed:
- [Forbidden files/areas.]
- Do not implement later phases.
- Do not rewrite unrelated code.
- Do not perform broad cleanup.
- Do not modify docs unless explicitly listed.

## Required work

1. ...
2. ...
3. ...

## Tests / checks

Run:

````bash
npm run typecheck
npm test

Also run if relevant:

npm run validate:questions

If a command fails, stop and report the failure with the relevant output. Do not hide failures.

Acceptance criteria

* …
* …
* …

Output required

After implementation, report:

1. Files changed.
2. Summary of changes.
3. Tests/checks run.
4. Any failures.
5. Any risks or follow-up tasks.

Do not commit or push unless explicitly instructed.

---
## 11. Active Next Task
The next task should be:
```txt
Phase 0 — Planning Baseline Refresh

Then:

Phase 1 — Shared Domain Contract Foundation

Recommended next GPT prompt for Codex:

Update the Patternly planning baseline to reflect the current repository state, then stop. Do not modify app code.

After that is accepted:

Add shared Patternly training domain contracts without migrating UI or Cloud flows yet.

⸻

12. Open Risks

Risk	Severity	Notes
Cloud-specific models remain shared architecture	High	Blocks clean Algorithms implementation
Algorithms becomes a second quiz loop	High	Violates learning-system docs
Planning file contains historical stale blockers	Medium	Can mislead Codex
Storage compatibility grows into permanent legacy layer	Medium	Needs explicit migration/reset strategy
UI work starts before domain model	Medium	Can polish unstable architecture
Progress/review remain fake or proxy metrics	High	Contradicts learning model
No CI/release gate	Medium	Fine during architecture work, not fine before release

⸻

13. Completion Log

Use this section after every accepted iteration.

Date	Commit / PR	Phase	Status	Notes
2026-06-29	TBD	Phase 0	Planned	Create/update working baseline
````
