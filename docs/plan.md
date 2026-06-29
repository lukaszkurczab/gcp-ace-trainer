Patternly — Working Execution Plan v2

Status: active working document
Repository: lukaszkurczab/gcp-ace-trainer
Product: Patternly
Purpose: control Patternly implementation from GPT planning through Codex implementation, GitHub push, GPT review, documentation update, and next-step decision.

⸻

1. Why this plan exists

Patternly is transitioning from a GCP ACE Trainer codebase into a multi-track technical learning product.

The previous execution plan over-prioritized backend/domain architecture and under-prioritized visual/product correctness. That created a critical risk: technically correct infrastructure was being added while the visible app diverged from the approved design direction and while core user paths were not reliably runnable.

This plan resets execution order around three non-negotiable gates:

1. Product/design parity
2. Runnable user paths
3. Canonical multi-track architecture

No implementation pass is accepted unless it protects all three.

⸻

2. Current product direction

Patternly is a calm, premium, dark-first technical learning app for:

- focused practice,
- pattern recognition,
- mistake review,
- technical skill training,
- track-based learning.

Initial tracks:

- cloud-certification
- algorithms

The app is not:

- a GCP-branded app,
- a LeetCode clone,
- a generic quiz app,
- a gamified streak/level product,
- a Google-style Material app,
- a dashboard-heavy analytics product.

⸻

3. Canonical UI direction

The active visual direction is Dark-first Focus Lab.

The approved design direction is represented by the current design screenshots and the Patternly documentation:

- deep navy / slate background,
- restrained blue/violet accents,
- premium technical look,
- minimal geometric iconography,
- calm cards,
- clear hierarchy,
- low clutter,
- strong mobile readability,
- no unnecessary gamification,
- no Google-like color language,
- no LeetCode-specific identity.

Hard UI constraints

Do not introduce or preserve:

- streaks,
- levels,
- achievement badges,
- gamified status rows,
- avatars as a primary product element unless explicitly designed,
- random profile/user identity UI in MVP,
- inconsistent tab labels,
- inconsistent headers,
- unrelated icon systems between screens,
- old “GCP trainer” screen structures,
- screens that visually contradict the approved references.

Current visual blockers observed

The current implementation has or recently had the following issues:

- Home layout does not match approved Patternly references.
- Practice layout differs from approved reference structure.
- Progress layout differs significantly from approved reference.
- Settings layout differs significantly from approved reference.
- Bottom navigation labels/icons are inconsistent across references and implementation.
- Some screens still show gamified elements such as streak/level style metrics.
- Some CTAs imply flows that are not wired or testable.
- The app shell is not yet a stable implementation of the approved designs.

These are product blockers, not polish tasks.

⸻

4. Source-of-truth hierarchy

When there is a conflict, use this priority order:

1. User-approved current design screenshots
2. Patternly docs: product, architecture, navigation, design system, testing
3. Current repository reality
4. Older implementation behavior
5. Codex assumptions

Legacy GCP implementation is current code reality, not canonical product direction.

⸻

5. Core working loop

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
├─ ACCEPTED → update working plan → next task
├─ PARTIAL_ACCEPT → correction prompt
└─ REJECTED / BLOCKED → stop and re-plan

GitHub pushed state is the review source of truth.

A Codex report without pushed code is not accepted.

⸻

6. Review statuses

Use exactly one:

- ACCEPTED
- PARTIAL_ACCEPT
- NEEDS_CORRECTION
- REJECTED
- BLOCKED
- NEEDS_MANUAL_DECISION

Important distinction:

- Technical accepted means code compiles/tests and matches the narrow technical prompt.
- Product accepted means the result matches Patternly’s visible product direction and user paths work.

A phase can be technically accepted but product-blocked.

⸻

7. Current repository state

Current baseline:

- Expo / React Native / TypeScript app.
- Product name: Patternly.
- Repository/package identity still contains gcp-ace-trainer.
- Cloud Certification is the active track.
- Algorithms exists as a draft track.
- Dark-first theme work exists but is not yet fully aligned with approved screen layouts.
- Shared training domain contracts exist.
- Track adapter contracts exist.
- Session engine primitives exist.
- Storage repositories for canonical training data exist.
- Cloud write-through to canonical attempts/review exists.
- Canonical Cloud progress/review selectors exist.
- Progress tab has begun using canonical progress data.
- Legacy Cloud flows still exist and must not be broken.
- UI layout parity is not yet achieved.
- Core user paths are not yet verified as runnable end-to-end.

⸻

8. Current blockers

P0-B1 — Approved layout mismatch

Severity: Critical
Status: active blocker

The implemented app must match the approved Patternly screen references before additional feature expansion.

Affected screens:

- Home
- Practice
- Practice session / question
- Progress
- Settings
- bottom navigation
- screen headers

P0-B2 — Broken or unverified user paths

Severity: Critical
Status: active blocker

The app must support at least these runnable paths:

Home → Start/Continue Practice → Question screen → Select answer → Check answer → Feedback/Next
Practice tab → Exam simulation → Exam session starts
Practice tab → Review weak items → Review session or clear unavailable state
Progress tab → Review queue CTA → Review path or explicit unavailable state
Settings → Clear local history → data reset confirmed

If a CTA exists, it must either:

- navigate to a working flow, or
- be disabled with clear product copy, or
- be removed.

No dead CTAs.

P0-B3 — Testability gap

Severity: High
Status: active blocker

Unit tests are not enough. The product needs route-level smoke checks or a deterministic manual QA checklist before further feature expansion.

Minimum verification:

npm run typecheck
npm test
npm run validate:questions
manual / scripted route smoke:

- app opens
- Home renders
- Practice renders
- Cloud practice starts
- answer can be selected
- Check Answer works
- Progress renders
- Settings renders

Maestro can be added later, but the route smoke checklist must exist now.

P0-B4 — Working plan stale

Severity: High
Status: active blocker

The previous plan claims phases are accepted while the visible app is still product-blocked. This document replaces that plan as the active working source.

⸻

9. Corrected implementation strategy

The correct order is now:

1. Plan reset and blocker capture
2. UI/layout parity baseline
3. Runnable route/path repair
4. Smoke QA gate
5. Canonical Review UI migration
6. Algorithms MVP
7. Further progress/review diagnostics
8. Focus Lab polish
9. CI/release gate

Do not continue domain/selector expansion until UI parity and runnable paths are restored.

⸻

10. Phase 0 — Plan reset and blocker capture

Goal: replace stale execution plan with this v2 working plan.

Scope:

- add/update active working plan,
- mark visual/layout parity as P0,
- mark broken/unverified routes as P0,
- clarify that previous architecture work is technically accepted but product integration remains blocked.

Definition of done:

- active plan reflects current repo and design reality,
- next Codex task is unambiguous,
- no app code changes in this phase unless explicitly requested.

Status: active

⸻

11. Phase 1 — UI/layout parity baseline

Goal: align implemented screens with approved Patternly visual references before adding more features.

Scope:

- Home
- Practice
- Practice question/session screen
- Progress
- Settings
- bottom navigation
- headers
- CTA hierarchy

Rules:

- This is not a redesign.
- This is implementation alignment to approved designs.
- Do not invent new product sections.
- Do not add gamification.
- Do not expose implementation terms.
- Do not change domain architecture unless required to wire existing data.

Required corrections:

Home

Must align with approved Patternly Home structure:

- app header,
- clear continue learning card,
- recommended actions,
- no streak/level footer,
- no random gamified identity row,
- CTA must route to a working learning/practice path.

Practice

Must align with approved Patternly Practice structure:

- active track section,
- primary recommended/continue session card,
- secondary practice modes,
- no unnecessary “why this session” block unless design requires it,
- all visible CTAs either working or explicitly unavailable.

Practice session/question

Must align with approved question screen:

- consistent top bar,
- item progress,
- question card,
- option cards,
- bottom check-answer CTA,
- no disabled button confusion,
- answer selection must make CTA usable.

Progress

Must align with approved Progress structure:

- Focus overview,
- review queue card,
- practice activity or canonical replacement if available,
- performance section,
- concrete metrics only,
- no readiness/retention/pass prediction.

Settings

Must align with approved Settings structure:

- profile/track card only if product-relevant,
- active tracks,
- session length,
- review priority,
- app preferences,
- data/privacy,
- account section if applicable,
- no fake user/account data if auth does not exist.

Definition of done:

- screens visually match reference structure,
- no gamified artifacts remain,
- bottom nav is consistent,
- no dead CTA remains on visible screen,
- tests still pass.

Suggested commit:

ui: align core screens with Patternly reference layouts

Status: next

⸻

12. Phase 2 — Runnable route and CTA repair

Goal: make the visible product paths actually work.

Required path contracts:

Home

Start learning
→ active Cloud practice setup or practice session

Recommended cards:

Review IAM policies
→ review path if canonical review items exist
→ otherwise disabled/empty state
Due for review
→ canonical review path if items exist
→ otherwise disabled/empty state
Weak area card
→ topic/domain detail if implemented
→ otherwise disabled/empty state

Practice

Start session
→ starts Cloud practice session
Exam simulation
→ starts Cloud exam session
Review weak items
→ starts canonical review path or shows unavailable state

Question screen

select option
→ Check Answer enabled
→ feedback shown
→ Next item or finish session

Progress

Start review
→ canonical review path if due items exist

Settings

Clear local history
→ confirmation
→ clears legacy and canonical local data

Definition of done:

- every visible CTA has working route or safe unavailable state,
- user can complete at least one Cloud practice question flow,
- user can start exam simulation,
- no screen leads to blank/broken state.

Suggested commit:

flow: repair core Cloud practice and review routes

Status: blocked until Phase 1 complete or done together if tightly coupled.

⸻

13. Phase 3 — Smoke QA gate

Goal: prevent accepting invisible breakages.

Add one of:

- manual QA checklist in repo,
- route smoke test,
- Maestro baseline flow,
- lightweight script if available.

Minimum manual QA checklist:

[ ] App opens on Home
[ ] Home Start Learning opens Cloud practice path
[ ] Practice tab opens
[ ] Practice Start Session opens question screen
[ ] Selecting an answer enables Check Answer
[ ] Check Answer shows result/feedback
[ ] Exam simulation opens exam session
[ ] Progress tab opens without crash
[ ] Review queue CTA is working or safely unavailable
[ ] Settings opens
[ ] Clear local history confirmation appears
[ ] Clear local history clears legacy and canonical training data

Definition of done:

- QA checklist exists,
- Codex must report it for every future UI pass,
- typecheck/test/question validation still pass.

Suggested commit:

qa: add Patternly route smoke checklist

⸻

14. Phase 4 — Canonical Review UI migration

Goal: use canonical review selector in the Review/Mistakes UI.

Do not start until:

- core layouts are aligned,
- review entry path is clear,
- route smoke is possible.

Scope:

- review screen read path,
- review model adapter,
- legacy fallback.

Definition of done:

- canonical review items can be displayed,
- legacy fallback remains,
- degraded state is shown inline,
- no navigation breakage.

⸻

15. Phase 5 — Algorithms MVP Pattern Drill

Goal: make Algorithms a real MVP track without turning it into a quiz clone.

Do not start until:

- Cloud core flows are runnable,
- shared UI shell is stable,
- canonical session/attempt/review paths are working.

Initial Algorithms scope:

- original pattern drill content,
- pattern identification,
- strategy choice,
- complexity analysis,
- feedback explaining why the chosen pattern/strategy works,
- no code editor,
- no online judge,
- no LeetCode references.

⸻

16. Phase 6 — Progress and review diagnostics

Goal: improve diagnostics only after paths are reliable.

Allowed metrics:

- attempts count,
- first-attempt accuracy,
- recent accuracy,
- due review count,
- high-priority review count,
- weak taxonomy nodes,
- repeated mistake types,
- coverage.

Forbidden metrics:

- generic readiness percent,
- retention percent,
- exam pass prediction,
- fake confidence score.

⸻

17. Phase 7 — CI and release gate

Goal: make regressions visible.

Required commands:

npm run typecheck
npm test
npm run validate:questions

Future:

npm run validate:tracks

Release checklist should include:

- app launch,
- Home,
- Practice,
- Cloud practice session,
- Cloud exam simulation,
- Progress,
- Review,
- Settings reset,
- Algorithms unavailable or working state depending on implementation stage.

⸻

18. Current phase status

Phase Status Notes
Shared training contracts Technical accepted Product integration still ongoing
Track adapters Technical accepted Algorithms still draft
Session engine Technical accepted Not fully wired into UI
Storage repositories Technical accepted Clear/reset path must include canonical data
Cloud bridge/write-through Technical accepted UI still legacy/mixed
Canonical progress selector Technical accepted Progress UI partially wired
Progress tab canonical migration Partial technical accepted Product/layout parity still blocked
Review UI migration Not started Blocked by UI/path baseline
Algorithms MVP Not started Blocked by Cloud flow baseline
Focus Lab UI alignment Critical active blocker Must move earlier
QA/route smoke Critical active blocker Must be added before more feature work

⸻

19. Active next task

The next task is:

Phase 1 — UI/layout parity baseline for Home, Practice, Question, Progress, Settings, and bottom navigation.

The task must not add new domain infrastructure.

The task must not migrate Review UI yet.

The task must fix visible product divergence from approved Patternly screen references.

⸻

20. Codex rules for next pass

Codex must:

- inspect current screens before editing,
- compare implementation to approved screen references,
- keep scope narrow,
- fix layout and CTA correctness,
- preserve canonical data work,
- avoid new product concepts,
- avoid gamification,
- run checks,
- report any CTA that cannot be wired yet.

Codex must not:

- continue architecture expansion,
- add Algorithms content,
- rewrite navigation broadly,
- add backend/auth/user accounts,
- add streaks/levels/badges,
- modify docs unless explicitly requested,
- hide broken routes.

⸻

21. Next Codex prompt summary

Next Codex task:

Align the core Patternly screens with the approved dark-first Focus Lab reference layouts and repair visible CTAs so each is working, disabled, or removed.

Expected changed areas:

src/features/home/
src/features/practice/
src/features/exam/
src/features/review/ only if CTA unavailable state requires it
src/components/
src/theme/
tests/

Forbidden:

domain model expansion
Algorithms content
new backend/auth
documentation updates
large unrelated cleanup

⸻

22. Open risks

Risk Severity Status Notes
Implemented UI diverges from approved design Critical Active Current blocker
Visible CTAs do not route to working flows Critical Active Current blocker
Unit tests pass while app is unusable High Active Add smoke QA
Architecture work continues while product shell is broken High Active Stop architecture expansion
Gamification leaks into product High Active Remove streak/level/badge patterns
Algorithms becomes generic quiz High Watch Do not start before Cloud baseline
Legacy and canonical storage diverge Medium Watch Clear/reset must handle both
Progress uses fake precision High Watch Use concrete evidence only
No CI/release gate Medium Later Add after route baseline

⸻

23. Completion log

Date Commit / PR Phase Status Notes
2026-06-29 TBD Shared training contracts Technical accepted UI not affected
2026-06-29 TBD Track adapters Technical accepted Algorithms draft only
2026-06-29 TBD Session engine Technical accepted Not fully UI-wired
2026-06-29 TBD Storage repositories Technical accepted Canonical storage added
2026-06-29 TBD Cloud bridge/write-through Technical accepted Legacy behavior preserved
2026-06-29 TBD Canonical progress selectors Technical accepted Read-side added
2026-06-29 TBD Progress tab canonical migration Partial accept Product/layout parity blocked
2026-06-29 TBD Plan v2 reset Active UI/path baseline moved to P0
