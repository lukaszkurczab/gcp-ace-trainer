# 01 — Product Definition

## Product promise

Patternly turns technical mistakes into a concrete next practice action. It is a focused, local learning product for certification candidates and algorithmic problem solvers who need repeated retrieval, diagnosis, and deliberate practice rather than an answer feed.

## Users and value

- A certification candidate practises scenario decisions, sees the competency evidence behind a recommendation, and can run a faithful simulation only where an official profile supports it.
- An algorithm learner practises mental units, pattern recognition, contrasts, strategy selection, ordering, and complexity reasoning without pretending to be a coding platform.
- A returning learner can continue one active session or abandon it deliberately; committed attempts remain diagnostic evidence.

## Modes

Algorithms modes are `Learn Approach`, `Guided Practice`, `Recognize Patterns`, `Contrast Practice`, `Weak Area Review`, `Independent Practice`, and `Interview Simulation`.

Certification modes are `Diagnostic Baseline`, `Focus Practice`, `Scenario Practice`, `Weak Area Review`, `Mixed Practice`, `Quick Review`, and `Exam Simulation`.

Algorithms entry points map as follows:

| Entry intent | Canonical configuration |
| --- | --- |
| Topic/default practice | `Guided Practice` for the chosen mental unit |
| Pattern recognition | `Recognize Patterns` |
| Contrast | `Contrast Practice` |
| Due review | `Weak Area Review`, `source = due_queue` |
| Session misses | `Weak Area Review`, `source = session_misses` |
| Mixed practice | `Independent Practice` |
| Timed validation | `Interview Simulation` |

## Evidence and recommendation

Patternly keeps distinct `evidenceVolume`, `learningStageEvidence`, and `performanceSignals`. Recommendations are deterministic, family-specific, and explained. Home prioritizes overdue review and repeated mistakes. A manual learner choice wins for that session. Hints exist only in interactions explicitly designed with hints, and only those interactions can turn hint use into review evidence.

## Feedback and review

`Reason` is concise immediate orientation. `Details` is collapsed by default and contains the complete instructional explanation; opening it has no scoring, review, or domain side effect. The Details narrative connects mechanism and application, corrects the selected error, and adds a transfer rule or counterexample when useful.

Review is both a source-item reference and skill, competency, or taxonomy evidence. It may increase for incorrect or partial work, supported hint use, wrong pattern or strategy, complexity error, repeated mistake, scheduled retrieval, weak taxonomy evidence, or manual marking. Resolution requires two successful review attempts after their due dates; a correction in the same session never resolves persistent review.

## Boundaries

The product does not claim official certification outcomes. It does not use confidence collection, synthetic readiness, retention, or mastery scores. It does not hide missing content with default topics, default items, or generic answers. Unknown IDs, unsupported payloads, and missing content are errors.

The approved architecture and persistence contract require removal rather than preservation of obsolete pre-production semantics. This is a product safety rule: hidden continuity would make evidence and review unreliable.
