# 13 — Risk Register

## Purpose

This document lists the main product, architecture, UX, content, legal, privacy, and delivery risks for the app.

The app is a **multi-track technical training workspace**, not a single GCP exam simulator. The risk model must therefore protect the shared product foundation:

```txt
app → track → session mode → training item → attempt → feedback/result → progress
```

Initial tracks:

- `cloud-certification` — certification-style technical preparation, starting with Google Cloud / Associate Cloud Engineer-like learning scope.
- `algorithms` — LeetCode-style problem-solving preparation focused on patterns, strategy selection, complexity reasoning, and mistake review.

The risk register is intentionally conservative. The main failure mode is not lack of features; it is building the wrong abstraction too early or letting one track dominate the whole architecture.

---

## Risk severity scale

| Level    | Meaning                                                                                            |
| -------- | -------------------------------------------------------------------------------------------------- |
| Low      | Annoying but unlikely to block MVP or corrupt the product direction.                               |
| Medium   | Can slow implementation, degrade UX, or require rework.                                            |
| High     | Can invalidate the architecture, damage trust, create legal exposure, or block launch.             |
| Critical | Can force a major rewrite, make the product legally unsafe, or destroy the core value proposition. |

---

## R-001 — MVP scope expands into a full learning platform

### Severity

High

### Description

The product may grow too quickly into accounts, backend sync, AI coaching, dashboards, social features, public profiles, cloud backups, full analytics, reminders, subscriptions, or generated content pipelines.

The addition of a second track increases this risk because each track can trigger its own “obvious” wishlist.

### Impact

- Slower implementation.
- More bugs.
- Blurred core loop.
- Premature infrastructure.
- Higher maintenance cost.
- Delayed validation of whether the training loop works.

### Mitigation

Keep MVP local-first/offline-first.

MVP should prove:

- track selection works,
- at least two tracks can share the same training architecture,
- users can complete sessions,
- attempts are stored locally,
- feedback is useful,
- review queue works,
- progress suggests what to practice next.

Large additions require an ADR before implementation.

### Watch indicators

- Firebase/Auth appears in implementation before a concrete sync/backup decision.
- A full dashboard is built before the session loop is stable.
- Algorithms work starts with code execution rather than strategy drills.
- Cloud track work starts with exam simulation before practice/review quality is validated.

---

## R-002 — One track dominates the shared architecture

### Severity

Critical

### Description

The app may technically become a GCP quiz app or an algorithm drill app with the other track bolted on later.

Typical symptoms:

- shared types named `Question`, `QuizSession`, `UserAnswer`, `ExamDomain`,
- `Exam Mode` as the main app route,
- Home copy hardcoded to GCP,
- progress based only on cloud exam domains,
- algorithms content forced into multiple-choice questions,
- review queue assuming only correct/incorrect answers.

### Impact

- Multi-track roadmap becomes expensive or unrealistic.
- Algorithms track feels artificial.
- Cloud track assumptions leak into all UI and storage.
- Future content types require rewrites.

### Mitigation

Use neutral shared contracts:

- `Track`,
- `SessionMode`,
- `TrainingItem`,
- `TrainingAttempt`,
- `TrainingSession`,
- `UserItemState`,
- `ReviewQueueItem`,
- `UserProgress`.

Track-specific concepts must stay inside track modules:

- GCP/cloud: services, exam domains, scenarios, certification objectives.
- Algorithms: patterns, data structures, complexity, mistake types, solution strategies.

### Watch indicators

- New shared component is named `QuestionCard` instead of `TrainingItemCard`.
- Storage keys include `gcpAceTrainer` or `questionStates`.
- Algorithms item has to fake an exam domain to fit the model.
- Review only stores `selectedAnswerId`.

---

## R-003 — Overengineering into a plugin system

### Severity

High

### Description

Because the app is multi-track, there is a temptation to build a generic plugin architecture too early: dynamic loading, remote track manifests, runtime plugins, custom scoring engines, public authoring tools, content marketplace, or complex registry lifecycle.

### Impact

- Delayed MVP.
- More abstractions than actual product evidence.
- Harder debugging.
- Poorer developer velocity.
- Architecture optimized for hypothetical tracks instead of the first two real tracks.

### Mitigation

Use a lightweight `trackRegistry` only.

A track should define:

- id,
- label,
- supported session modes,
- taxonomy,
- bundled content pack,
- scoring adapter where needed,
- feedback adapter where needed,
- progress aggregation rules where needed.

No dynamic plugin marketplace in MVP.

### Watch indicators

- Runtime plugin loading appears before the second track is complete.
- Track packages need a build system separate from the app.
- Content authoring UI appears before content validation rules are stable.

---

## R-004 — Weak content quality

### Severity

Critical

### Description

The app’s value depends on content quality. Poor content can make the product useless even if the UI and architecture are good.

For cloud certification, weak content means vague, outdated, memorization-heavy, or misleading questions.

For algorithms, weak content means shallow pattern labels, unclear constraints, wrong complexity analysis, poor strategy comparison, or explanations that skip reasoning.

### Impact

- Users lose trust.
- Progress metrics become meaningless.
- Review queue reinforces bad understanding.
- The product becomes a generic quiz shell.

### Mitigation

Every content item must include:

- clear prompt,
- expected response shape,
- explanation,
- taxonomy references,
- difficulty,
- common mistake or misconception,
- review guidance.

Track-specific requirements:

- Cloud items need scenario realism and service/concept accuracy.
- Algorithm items need constraints, candidate approaches, best strategy, complexity, and common mistakes.

### Watch indicators

- Explanations only say why the correct option is correct.
- Algorithm items only ask “Which data structure?” without reasoning.
- Cloud questions test brand trivia instead of decision-making.
- Content lacks `contentVersion`.

---

## R-005 — Content becomes legally unsafe

### Severity

Critical

### Description

The app may accidentally use or resemble protected content too closely:

- official certification exam questions,
- exam dumps,
- Google copyrighted training material,
- LeetCode problem statements,
- LeetCode editorial explanations,
- copied solution structures from coding platforms,
- platform-specific branding that implies affiliation.

### Impact

- Legal exposure.
- Takedown risk.
- Store rejection risk.
- Reputational damage.
- Product cannot be safely published.

### Mitigation

Content must be original, paraphrased from general knowledge, and educational.

Rules:

- Do not use real exam questions.
- Do not use exam dumps.
- Do not copy LeetCode tasks or editorials.
- Do not imply affiliation with Google, LeetCode, or certification providers.
- Use disclaimers where certification/platform names are referenced.
- Prefer concept-based scenarios and original examples.

### Watch indicators

- Content source is a scraped website.
- Item wording matches known platform tasks.
- Marketing copy says “official”, “actual exam”, “real LeetCode”, or similar.
- Explanations are copied from documentation/editorials.

---

## R-006 — Content gets outdated

### Severity

High

### Description

Cloud services, certification objectives, recommended practices, and platform guidance change over time. Algorithms content is more stable, but complexity explanations and problem categorization can still be wrong or oversimplified.

### Impact

- Cloud track misleads users.
- Deprecated service recommendations remain active.
- Progress and review may reinforce outdated facts.
- User trust drops.

### Mitigation

Use content versioning:

- `contentVersion`,
- `lastReviewedAt`,
- `deprecatedAt`,
- `sourceNotes`,
- `trackId`,
- taxonomy version.

Cloud content should be reviewed more frequently than algorithms content.

Deprecated items should remain readable if tied to old attempts, but should be excluded from new sessions.

### Watch indicators

- Items mention exact product behavior without review date.
- Old attempts break after content update.
- Progress changes unexpectedly after content pack replacement.

---

## R-007 — Feedback is too binary

### Severity

High

### Description

A simple correct/incorrect feedback model is insufficient for the multi-track product.

Cloud certification can use correct/incorrect scoring, but still needs scenario explanation and misconception correction.

Algorithms often needs partial correctness, strategy comparison, complexity correction, and mistake classification.

### Impact

- Algorithms track becomes a shallow quiz.
- Users do not learn why their reasoning failed.
- Review queue becomes less useful.
- Progress metrics are misleading.

### Mitigation

Feedback model must support:

- correct,
- incorrect,
- partially correct,
- explanation blocks,
- misconception tags,
- mistake type,
- recommended next item/session,
- optional self-assessment.

### Watch indicators

- `TrainingAttempt` stores only `isCorrect`.
- Algorithm item cannot distinguish wrong complexity from wrong strategy.
- Feedback text is the same shape for every item type.

---

## R-008 — Progress becomes a decorative dashboard

### Severity

Medium

### Description

Progress can become a complex dashboard with charts, percentages, badges, trend lines, and pseudo-analytics that do not help the user decide what to practice next.

### Impact

- UI noise.
- More implementation work.
- Progress feels impressive but not actionable.
- Users do not know the next step.

### Mitigation

Progress must answer:

> What should I practice next?

Track-specific progress should stay focused:

- Cloud: weak domains, missed services/concepts, exam readiness signal.
- Algorithms: weak patterns, mistaken strategies, complexity errors, review backlog.

### Watch indicators

- Progress screen is built before review queue logic.
- Metrics do not affect session recommendations.
- Charts appear without next action.

---

## R-009 — Local storage migrations corrupt learning data

### Severity

High

### Description

Model changes can break local user data, especially when moving from a question-centric model to a training-item-centric model.

Risky migrations:

- `questionStates` → `itemStates`,
- `quizSessions` → `trainingSessions`,
- `userAnswers` → `trainingAttempts`,
- `domainProgress` → `trackProgress.byTaxonomy`,
- track-specific content version changes.

### Impact

- Lost progress.
- Broken review queue.
- Inconsistent session history.
- App crashes after update.

### Mitigation

Use:

- `schemaVersion`,
- `contentVersion`,
- migration functions,
- fallback reset,
- export/debug dump in development,
- defensive parsing,
- derived progress rebuild from attempts where possible.

### Watch indicators

- Local data shape changes without migration.
- Attempts do not store `trackId` and `contentVersion`.
- Progress is stored as source of truth rather than rebuildable cache.

---

## R-010 — Too much logic leaks into UI components

### Severity

High

### Description

Scoring, progress updates, review scheduling, taxonomy aggregation, and feedback generation may be implemented inside screen components.

### Impact

- Hard-to-test code.
- Duplicated scoring rules.
- Track-specific leaks.
- Bugs when adding new item types.
- UI refactors risk changing learning logic.

### Mitigation

Keep pure domain logic in dedicated modules:

- session creation,
- scoring,
- attempt normalization,
- feedback generation,
- review queue scheduling,
- progress aggregation,
- storage adapters.

UI should render state and dispatch explicit actions.

### Watch indicators

- A React component imports raw content packs and writes progress directly.
- `onPressAnswer` computes scoring and review scheduling inline.
- Track-specific if-statements appear across shared screens.

---

## R-011 — Algorithms track becomes an online judge / IDE too early

### Severity

Critical

### Description

Algorithms work can easily expand into a full coding platform: editor, execution sandbox, test cases, language support, submissions, runtime metrics, account integration, leaderboard, or LeetCode import.

### Impact

- MVP becomes too large.
- Security risk from code execution.
- Legal/IP risk if importing platform content.
- Product competes with established coding platforms instead of complementing them.
- The original strategy-first learning value is lost.

### Mitigation

Algorithms MVP should focus on:

- pattern recognition,
- strategy choice,
- complexity analysis,
- solution comparison,
- mistake review.

No online judge, no sandbox, no code execution, no LeetCode/GitHub login in MVP.

### Watch indicators

- A code editor is treated as required for first release.
- Work starts on language runtime support.
- Content assumes copied LeetCode problem statements.
- Scoring depends on executing submitted code.

---

## R-012 — Exam mode becomes the center of the product

### Severity

High

### Description

`Exam Mode` can dominate navigation, copy, progress, and roadmap because it feels concrete and easy to explain. But it is only one session mode, mainly relevant to certification-style tracks.

### Impact

- Algorithms track gets marginalized.
- Practice/review loop is weakened.
- Product becomes stress-oriented instead of deliberate-practice-oriented.
- Users may overuse simulation before building understanding.

### Mitigation

Main navigation should prioritize:

- Home,
- Practice,
- Progress,
- Settings.

Exam simulation should live inside the cloud/certification track as a session mode, not as the global app center.

### Watch indicators

- `Exam` becomes a main tab.
- Home CTA is always “Start exam”.
- Progress is expressed primarily as exam readiness.
- Algorithms has no equivalent high-value session modes.

---

## R-013 — Branding suggests affiliation or wrong scope

### Severity

High

### Description

The app name, visual identity, or copy may suggest that the whole product is:

- an official Google app,
- an official LeetCode companion,
- only a Patternly,
- only an exam simulator,
- only a coding challenge app.

### Impact

- Legal risk.
- User confusion.
- Product positioning becomes too narrow.
- Future tracks feel inconsistent.

### Mitigation

Use a neutral umbrella brand.

Track names can describe content scope, but the app brand should not depend on one provider, exam, or platform.

Avoid official color systems and marks from Google, LeetCode, or other platforms.

### Watch indicators

- App name contains `GCP`, `ACE`, `Google`, `LeetCode`, or `Exam`.
- Visual style mimics a provider.
- Landing copy says “pass the official exam” or similar.

---

## R-014 — Privacy scope expands without product need

### Severity

Medium

### Description

The app may start collecting unnecessary user data: accounts, email, profile, device identifiers, usage analytics, cloud sync data, coding platform accounts, GitHub/LeetCode tokens, or social features.

### Impact

- More compliance burden.
- More security surface.
- Harder store/privacy review.
- Reduced user trust.

### Mitigation

MVP should not require login.

Collect no personal data unless a specific feature requires it.

Keep progress local by default.

Analytics, crash reporting, sync, and accounts should be introduced only after explicit product decisions.

### Watch indicators

- Auth appears before local progress is proven.
- Analytics events include detailed answer content or freeform notes.
- User identifiers are needed for basic practice.

---

## R-015 — Track switching creates confusing UX

### Severity

Medium

### Description

With multiple tracks, users may not understand where they are, what mode they are using, and whether progress is global or track-specific.

### Impact

- Confusing Home screen.
- Wrong session expectations.
- Progress feels inconsistent.
- Users mix unrelated goals.

### Mitigation

UX rules:

- Active track must be visible.
- Track switching must be explicit.
- Sessions should not mix tracks in MVP.
- Progress should clearly separate global summary and per-track detail.
- Track-specific empty states should explain what happens next.

### Watch indicators

- Practice screen shows mixed GCP and Algorithms items.
- Progress percentages combine incompatible metrics.
- User cannot tell which track a review item belongs to.

---

## R-016 — Review queue becomes noisy or punitive

### Severity

Medium

### Description

Review can become a dumping ground for every mistake, producing too many repeated items or discouraging users.

### Impact

- Users avoid review.
- Review loses educational value.
- Progress feels stuck.
- Algorithms mistakes are repeated without better reasoning prompts.

### Mitigation

Review queue should prioritize:

- recent high-confidence mistakes,
- repeated mistake types,
- weak taxonomy areas,
- items with educational value.

Track-specific review:

- Cloud: missed concepts/services/scenarios.
- Algorithms: wrong pattern, wrong strategy, wrong complexity, missed constraint.

### Watch indicators

- Every incorrect attempt creates the same review priority.
- Review items do not include mistake type.
- Review feedback repeats the original explanation verbatim.

---

## R-017 — AI-generated content lowers quality or creates legal risk

### Severity

High

### Description

AI can help draft content, but it may hallucinate facts, invent cloud behavior, copy common problem structures too closely, produce weak explanations, or generate misleading complexity analysis.

### Impact

- Wrong educational guidance.
- Legal/IP concerns.
- Lower trust.
- Content review burden increases.

### Mitigation

AI-generated content must be treated as draft content only.

Before inclusion, each item needs:

- human review,
- content validation,
- source sanity check,
- originality check,
- taxonomy check,
- explanation quality check.

Cloud facts should be verified against current documentation before publication.

### Watch indicators

- AI-generated content is imported directly into content packs.
- No reviewer is assigned.
- Explanations are verbose but not precise.
- Cloud questions include uncertain product behavior.

---

## R-018 — Accessibility and mobile ergonomics are deferred too long

### Severity

Medium

### Description

The app is mobile-first. Long explanations, code snippets, answer choices, progress cards, and review panels can become hard to use on small screens.

### Impact

- Poor usability.
- Lower session completion.
- Difficult review flow.
- Accessibility issues.

### Mitigation

Design and test for:

- readable text sizes,
- large tap targets,
- scrollable explanations,
- clear selected states,
- high contrast,
- screen reader labels,
- compact code/complexity blocks,
- interruption/resume states.

### Watch indicators

- Training item screens require dense scrolling before the user can answer.
- Code blocks overflow horizontally without handling.
- Correct/incorrect states rely only on color.

---

## R-019 — Session interruption is not handled

### Severity

Medium

### Description

Mobile users can close the app, switch apps, lose battery, or abandon a session mid-way.

### Impact

- Lost progress.
- Frustration.
- Inconsistent session results.
- Broken review queue updates.

### Mitigation

Store in-progress sessions locally.

Support:

- continue session,
- abandon session,
- autosave attempts,
- safe result calculation only after session completion,
- recovery after app restart.

### Watch indicators

- Attempts are stored only at session end.
- In-progress sessions cannot be resumed or dismissed.
- Closing app mid-session creates corrupted progress.

---

## R-020 — Future backend is designed before local-first needs are proven

### Severity

Medium

### Description

The app may prematurely add Firebase, Supabase, custom backend, remote content updates, accounts, or sync flows before validating the local product loop.

### Impact

- Slower development.
- More failure modes.
- Security/privacy work increases.
- Architecture becomes backend-driven instead of domain-driven.

### Mitigation

Backend should be considered only after one of these becomes necessary:

- multi-device sync,
- backup/restore,
- remote content updates,
- subscriptions,
- account-based personalization,
- team/admin content workflows.

Until then, use bundled content packs and local storage.

### Watch indicators

- Remote DB schema is designed before local domain contracts.
- Auth is needed to start practicing.
- Content cannot be tested without network access.

---

## R-021 — Naming drift across documentation and code

### Severity

High

### Description

Different documents or implementation files may use inconsistent terms: `question`, `item`, `quiz`, `session`, `exam`, `track`, `domain`, `category`, `pattern`, `topic`.

### Impact

- Developers implement inconsistent models.
- Tests become confusing.
- Storage migration risk increases.
- Product decisions drift back toward a single-track app.

### Mitigation

Use the canonical vocabulary:

- `Track` — learning area, e.g. cloud certification or algorithms.
- `SessionMode` — practice format inside a track.
- `TrainingItem` — unit of practice.
- `TrainingAttempt` — user interaction with one item.
- `TrainingSession` — group of attempts.
- `UserItemState` — local learning state for an item.
- `ReviewQueueItem` — scheduled review entry.
- `UserProgress` — derived/aggregated learning state.
- `TaxonomyRef` — track-specific classification reference.

### Watch indicators

- New docs reintroduce `QuizSession` or `QuestionState` as shared concepts.
- Code uses `domain` for algorithms patterns.
- UI labels use `Exam` globally.

---

## R-022 — Algorithms content duplicates coding-platform framing

### Severity

High

### Description

Even without copying exact tasks, the algorithms track may become too similar to coding platforms by framing content around full problem statements, acceptance constraints, submitted code, or editorial-like solution walkthroughs.

### Impact

- Weak product differentiation.
- Potential IP concerns.
- User expectation shifts toward online judge functionality.
- Strategy-first learning goal gets diluted.

### Mitigation

Frame algorithms content as:

- pattern recognition,
- strategy selection,
- constraints reasoning,
- complexity comparison,
- mistake diagnosis,
- review prompts.

Use original concise scenarios and abstracted examples rather than full platform-style problem statements.

### Watch indicators

- Items look like full coding challenge pages.
- Users are asked to submit full code.
- Explanations read like editorials.

---

## R-023 — Cloud certification content overpromises exam readiness

### Severity

High

### Description

The cloud track may imply that using the app guarantees passing an exam or accurately simulates the real certification test.

### Impact

- Trust risk.
- Legal/brand risk.
- Misleading product positioning.
- User disappointment.

### Mitigation

Use conservative copy:

- “practice certification-style scenarios”,
- “review weak areas”,
- “prepare deliberately”,
- “not affiliated with Google”,
- “not an official exam simulator”.

Avoid:

- “guaranteed pass”,
- “actual exam questions”,
- “official simulator”,
- “real exam dump”.

### Watch indicators

- Marketing or in-app copy promises pass rates.
- Exam simulation is described as equivalent to the real exam.
- Content uses official-looking labels without disclaimer.

---

## R-024 — Content taxonomy becomes too complex

### Severity

Medium

### Description

Supporting multiple tracks may lead to an overly complex taxonomy system with too many levels, categories, tags, weights, and cross-track mappings.

### Impact

- Harder content authoring.
- Harder progress aggregation.
- More bugs.
- User-facing filters become confusing.

### Mitigation

Use `taxonomyRefs` with track-specific meaning.

Keep MVP taxonomy small:

Cloud:

- domain,
- service,
- concept.

Algorithms:

- pattern,
- data structure,
- complexity,
- mistake type.

Avoid cross-track taxonomy normalization in MVP.

### Watch indicators

- A global taxonomy tries to unify cloud services and algorithm patterns.
- Content authors need many required tags before adding one item.
- Progress depends on deeply nested taxonomy paths.

---

## R-025 — Testing focuses on UI snapshots instead of learning logic

### Severity

High

### Description

The implementation may overtest screens and undertest scoring, progress, review scheduling, content validation, and migrations.

### Impact

- Core learning bugs survive.
- UI refactors break tests unnecessarily.
- Track-specific behavior is not validated.
- Progress becomes unreliable.

### Mitigation

Prioritize tests for:

- track contract,
- scoring per item type,
- attempt normalization,
- feedback result,
- review queue scheduling,
- progress aggregation,
- content pack validation,
- storage migration.

UI tests should cover only critical flows.

### Watch indicators

- Many component snapshot tests, few domain tests.
- Content pack can be invalid but app still builds.
- Migration paths are untested.

---

## Risk review checklist

Before each implementation milestone, check:

- Are shared models still track-neutral?
- Does the app still work without backend/auth?
- Can both initial tracks use the same session engine?
- Does each track keep its own taxonomy and content semantics?
- Are attempts tied to `trackId`, `itemId`, and `contentVersion`?
- Can progress be rebuilt from attempts if needed?
- Does review queue handle different mistake types?
- Is Algorithms still strategy-first, not online-judge-first?
- Is Cloud Certification still practice-first, not exam-dump-first?
- Is content original, reviewed, and legally safe?
- Does copy avoid affiliation and pass guarantees?
- Are new large features guarded by ADRs?

---

## Current highest-priority risks

For the first implementation phase, prioritize these risks:

1. **R-002 — One track dominates the shared architecture**
2. **R-005 — Content becomes legally unsafe**
3. **R-011 — Algorithms track becomes an online judge / IDE too early**
4. **R-004 — Weak content quality**
5. **R-009 — Local storage migrations corrupt learning data**
6. **R-021 — Naming drift across documentation and code**

These are the risks most likely to force rework or invalidate the product direction.
