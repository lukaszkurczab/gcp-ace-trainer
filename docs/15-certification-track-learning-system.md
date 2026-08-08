# 15 — Certification Track Learning System

This document provides Certification-family context for the behavior defined by `canonical-product-contract.yaml`; it cannot override that contract.

## Learning model

Certification content is organized by exam domain, competency area, topic, and skill atom. Competency area drives remediation; topic gives the learner understandable focus; skill atom makes evidence and feedback precise. Remediation batches by competency area and then topic.

Certification modes, their availability, and all session configuration are resolved from `canonical-product-contract.yaml`. Recommendations are deterministic and explained; learner choice always wins for the current session.


## Certification track instances

Certification is one internal reusable family runtime, not a learner-visible category and not a separate runner per exam. GCP ACE is the representative reference track. AWS Solutions Architect Associate is the second target proof that must reuse the family without new shared lifecycle code. Other target certification tracks use the same admission boundary through track metadata, taxonomy, blueprint, `ExamExperienceProfile`, bundled Free node, package manifest, and reviewed authored content.

Adding a certification track must not require:

- a new session runner or screen;
- a new persistence repository or storage key family;
- a new attempt or review model;
- a global exam duration or navigation default;
- branching on the concrete track ID in shared application code.

Differences between providers and exams belong in the track instance and its official-source profile. If a proposed learning domain cannot use certification scoring, competency evidence, remediation, feedback, and simulation contracts without exceptions, it is not a certification track and requires another family runtime.

## Evidence, feedback, and review

Evidence separates volume, learning-stage evidence, and performance signals. The track neither collects confidence nor displays synthetic readiness/retention/mastery percentages.

Every instructional choice item has a concise `Reason`, complete collapsed `Details`, and a meaningful explanation for each active wrong option keyed by stable option ID. Details remains available after correct, partial, and incorrect attempts. Content must explain the scenario requirement, relevant service/property, expected decision, selected wrong reasoning where applicable, and transfer boundary. Human technical/editorial review is required.

Review stores stable source item/package reference and competency/topic/skill evidence. It may be triggered by incorrect, partial, supported hint use, wrong pattern, wrong strategy, complexity error, repeated mistake, scheduled retrieval, weak taxonomy area, or manual marking. It resolves only through two successful after-due review attempts. Correct canonical source and publish a new immutable version; do not mutate published packages or reconstruct historical explanations against current content.

## Exam Simulation

Each track instance owns a versioned, official-source-backed `ExamExperienceProfile`. It supplies the track-specific exam behavior consumed by the canonical product contract and runtime; this document does not define global timing, feedback, navigation, item-count, reinsert, or finalization rules.

A missing or unclear official rule prevents a faithful-simulation claim and is never inferred from memory or another exam. UI copy must distinguish a Patternly practice result from any official outcome.

## Provenance and boundaries

Use stable official sources and include volatile source/version data where an item depends on it. Do not copy exam dumps or claim affiliation. The target does not preserve pre-production local certification history through translators or compatibility paths.
