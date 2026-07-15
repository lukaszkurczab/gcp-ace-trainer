# 01 — Product Definition

## Product promise

Patternly turns technical mistakes and incomplete understanding into a concrete next practice action.

It is a focused, local, offline-first learning product for certification candidates and algorithmic problem solvers who need repeated retrieval, diagnosis, contrast, and deliberate practice rather than an answer feed.

## Users and value

- A certification candidate practises scenario decisions, sees the competency evidence behind an explained recommendation, and can run a faithful simulation only when the owning certification track provides a valid, official-source-backed `ExamExperienceProfile`.
- An algorithm learner practises mental units, pattern recognition, contrasts, strategy selection, ordering, and complexity reasoning without Patternly pretending to be a coding platform or online judge.
- A returning learner can continue the one active session or abandon it deliberately. An abandoned session does not enter history, while already committed attempts remain diagnostic evidence.

## Modes

Algorithms has exactly these user-facing modes:

1. `Learn Approach`
2. `Guided Practice`
3. `Recognize Patterns`
4. `Contrast Practice`
5. `Weak Area Review`
6. `Independent Practice`
7. `Interview Simulation`

Certification has exactly these user-facing modes:

1. `Diagnostic Baseline`
2. `Focus Practice`
3. `Scenario Practice`
4. `Weak Area Review`
5. `Mixed Practice`
6. `Quick Review`
7. `Exam Simulation`

Algorithms entry points map as follows:

| Entry intent                         | Canonical configuration                       |
| ------------------------------------ | --------------------------------------------- |
| Approach primer or a new mental unit | `Learn Approach`                              |
| Topic or default practice            | `Guided Practice` for the chosen mental unit  |
| Pattern recognition                  | `Recognize Patterns`                          |
| Contrast                             | `Contrast Practice`                           |
| Due review                           | `Weak Area Review`, `source = due_queue`      |
| Session misses                       | `Weak Area Review`, `source = session_misses` |
| Mixed practice                       | `Independent Practice`                        |
| Timed validation                     | `Interview Simulation`                        |

`due_queue` and `session_misses` are sources for Algorithms `Weak Area Review`, not separate modes.

The exact selection, length, feedback, timer, review, and completion contracts for every mode are owned by the applicable family learning-system document and the training runtime specification. A mode name alone is not an implementation contract.

## Evidence and recommendation

Patternly keeps `evidenceVolume`, `learningStageEvidence`, and `performanceSignals` distinct.

Recommendations are deterministic, family-specific, and explained from canonical evidence. Home prioritizes overdue review and repeated mistakes when they require action.

Progress and recommendations never lock access to a mode. A valid manual learner choice among currently supported configurations overrides the recommendation for that session.

Manual choice does not bypass content validation, payload support, track capability, or certification-profile requirements. Missing or unsupported configuration remains an explicit error.

Hints exist only in interactions explicitly designed with hint behaviour. Only actual use of a supported hint can create hint-related review evidence.

## Feedback

Every active instructional item has authored `Reason` and complete `Details`.

`Reason` provides concise orientation at the point when the current mode permits instructional feedback. `Details` provides the complete instructional explanation and is collapsed when first made available.

Practice modes reveal feedback after durable submission. Session-end modes do not reveal item-level correctness, `Reason`, `Details`, or distractor explanations before final session commit.

`Details` connects mechanism and concrete application, corrects the learner’s selected error where applicable, and adds a transfer rule, counterexample, trace, constraint, or decision boundary when useful.

For instructional choice items, every active wrong option has a meaningful authored explanation keyed by stable option ID. Runtime may compose authored item details with the explanation for the selected wrong option, but it never fabricates educational content.

Opening or closing `Details` has no scoring, review, persistence, recommendation, timer, navigation, or other domain side effect.

## Review

A review obligation contains both:

- a reference to the source item;
- skill, competency, topic, mental-unit, or other family-owned taxonomy evidence.

A committed attempt may create or update review because of:

- incorrect work;
- partial work;
- actual supported hint use;
- wrong pattern selection;
- wrong strategy selection;
- complexity error;
- repeated mistake;
- scheduled retrieval;
- weak taxonomy evidence;
- manual marking.

Persistent review resolves only after two consecutive successful review attempts submitted after the applicable `dueAt`.

A successful attempt before `dueAt` does not increment the consecutive-success count. A partial or incorrect review attempt resets the count. A correction during the same session does not resolve persistent review.

The family runtime owns exact-item, reviewed-variant, contrast, and repair-item selection. It may not silently widen taxonomy, add unrelated content, duplicate an item to fill the requested length, or use a generic substitute.

## Boundaries

Patternly does not claim official certification outcomes, affiliation, endorsement, official scoring, or an official pass/fail result.

A Patternly-defined internal practice threshold may exist only when it is clearly labelled as internal and cannot reasonably be mistaken for an official certification decision.

Patternly does not collect confidence or display synthetic readiness, retention, or mastery percentages.

It does not hide missing content, unsupported payloads, unresolved profiles, unknown IDs, persistence failures, or content-version mismatches with:

- default topics;
- default items;
- default answers;
- generic explanations;
- substitute results;
- silent fallback sessions.

These conditions are explicit unavailable or error states.

## Pre-production recovery rule

The approved architecture and persistence contract require deletion rather than preservation of obsolete pre-production semantics.

Historical local records, old storage keys, old runtime models, parallel read or write paths, compatibility adapters, translators, and Cloud write-through are not product requirements.

If an obsolete record or flow cannot move into the canonical model without changing or obscuring its meaning, it is deleted rather than interpreted through a compatibility layer.

This is a product-safety rule. Hidden continuity, translated evidence, or parallel ownership could misstate learning history, review obligations, recommendations, and progress.
