# 01 — Product Definition

## Product promise

Patternly turns technical mistakes into a concrete next practice action. It is a focused, local learning product for technical learners who need repeated retrieval, diagnosis, comparison, and deliberate practice rather than an answer feed. Certification and Algorithms are the initial product families; future domains may reuse an existing family or introduce a new family when their response and evaluation semantics are materially different.


## Product family model

A **track** is a concrete learning product such as GCP ACE, Azure AI Fundamentals, Algorithms, SQL and Data Reasoning, or Backend System Design. A **track family** is the reusable learning runtime shared by tracks with the same fundamental interaction, evidence, scoring, and review semantics.

Future candidates illustrate the intended scaling model:

| Candidate track | Intended family | Architectural meaning |
| --- | --- | --- |
| Azure AI Fundamentals | `certification` | New certification instance; no new runner, storage path, or shell branch. |
| AWS Solutions Architect Associate | `certification` | More scenario-heavy certification instance using the same family contracts. |
| SQL and Data Reasoning | `database_reasoning` | New family for query results, schema/index decisions, and deterministic data reasoning. |
| Debugging and Code Review | `code_reasoning` | New family for traces, bug localization, fix comparison, and regression diagnosis. |
| Backend System Design | `system_design` | New family for authored trade-off evaluation, capacity reasoning, and failure-mode diagnosis. |

The table is an extensibility target, not a commitment to ship these tracks. A track belongs to an existing family only when that family can represent its content and evaluation semantics without track-specific exceptions in shared code. Otherwise it receives a new family runtime, not a special case inside Algorithms or Certification.

## Users and value

- A certification candidate practises scenario decisions, sees the competency evidence behind a recommendation, and can run a faithful simulation only where an official profile supports it.
- An algorithm learner practises mental units, pattern recognition, contrasts, strategy selection, ordering, and complexity reasoning without pretending to be a coding platform.
- A returning learner can continue one active session or abandon it deliberately; committed attempts remain diagnostic evidence.

## Modes

Algorithms modes are `Learn Approach`, `Guided Practice`, `Custom Practice`, `Recognize Patterns`, `Contrast Practice`, `Weak Area Review`, `Independent Practice`, and `Interview Simulation`.

Certification modes are `Diagnostic Baseline`, `Focus Practice`, `Scenario Practice`, `Weak Area Review`, `Mixed Practice`, `Quick Review`, and `Exam Simulation`.

Algorithms entry points map as follows:

| Entry intent | Canonical configuration |
| --- | --- |
| Topic/default practice | `Guided Practice` for the chosen mental unit |
| `Custom Practice` setup | `Custom Practice` for the chosen mental unit, using the Guided Practice content blueprint |
| Pattern recognition | `Recognize Patterns` |
| Contrast | `Contrast Practice` |
| Due review | `Weak Area Review`, `source = due_queue` |
| Session misses | `Weak Area Review`, `source = session_misses` |
| Mixed practice | `Independent Practice` |
| Timed validation | `Interview Simulation` |

`Custom Practice` is an Algorithms mode with its own stored mode ID and the same one-active-session lifecycle as other non-simulation practice. It consumes only the immutable Guided Practice content blueprint for the selected mental unit; it does not create a second content taxonomy or selection policy. It permits requested lengths 10, 20, or 40 and explicit feedback timing `afterEachAnswer` or `atSessionEnd`. Reinsert remains profile-owned and cannot be overridden by the learner.

## Evidence and recommendation

Patternly keeps distinct `evidenceVolume`, `learningStageEvidence`, and `performanceSignals`. Recommendations are deterministic, family-specific, and explained. Home prioritizes overdue review and repeated mistakes. A manual learner choice wins for that session. Hints exist only in interactions explicitly designed with hints, and only those interactions can turn hint use into review evidence.

## Feedback and review

`Reason` is concise immediate orientation. `Details` is collapsed by default and contains the complete instructional explanation; opening it has no scoring, review, or domain side effect. The Details narrative connects mechanism and application, corrects the selected error, and adds a transfer rule or counterexample when useful.

Review is both a source-item reference and skill, competency, or taxonomy evidence. It may increase for incorrect or partial work, supported hint use, wrong pattern or strategy, complexity error, repeated mistake, scheduled retrieval, weak taxonomy evidence, or manual marking. Resolution requires two successful review attempts after their due dates; a correction in the same session never resolves persistent review.

## Boundaries

The product does not claim official certification outcomes. It does not use confidence collection, synthetic readiness, retention, or mastery scores. It does not hide missing content with default topics, default items, or generic answers. Unknown IDs, unsupported payloads, and missing content are errors.

The approved architecture and persistence contract require removal rather than preservation of obsolete pre-production semantics. This is a product safety rule: hidden continuity would make evidence and review unreliable.
