# 15 — Certification Track Learning System

## Learning model

Certification content is organized by exam domain, competency area, topic, and skill atom. Competency area drives remediation; topic gives the learner understandable focus; skill atom makes evidence and feedback precise. Remediation batches by competency area and then topic.

The canonical modes are `Diagnostic Baseline`, `Focus Practice`, `Scenario Practice`, `Weak Area Review`, `Mixed Practice`, `Quick Review`, and `Exam Simulation`. Recommendations are deterministic and explained; learner choice always wins for the current session.

## Evidence, feedback, and review

Evidence separates volume, learning-stage evidence, and performance signals. The track neither collects confidence nor displays synthetic readiness/retention/mastery percentages.

Every instructional choice item has a concise `Reason`, complete collapsed `Details`, and a meaningful explanation for each active wrong option keyed by stable option ID. Details remains available after correct, partial, and incorrect attempts. Content must explain the scenario requirement, relevant service/property, expected decision, selected wrong reasoning where applicable, and transfer boundary. Human technical/editorial review is required.

Review stores source item reference and competency/topic/skill evidence. It may be triggered by incorrect, partial, supported hint use, wrong pattern, wrong strategy, complexity error, repeated mistake, scheduled retrieval, weak taxonomy area, or manual marking. It resolves only through two successful after-due review attempts. Correct content in place; do not retain obsolete content or historical explanation reconstruction.

## Exam Simulation

Each track instance owns a versioned `ExamExperienceProfile` with `sourceUrl`, `sourceCheckedAt`, optional guide version, duration, question count or range, navigation policy, answer-change policy, flagging policy, navigator policy, section policy, and automatic-final-submit timeout policy. The source must be official and public. A missing or unclear official rule prevents a faithful-simulation claim; it is never inferred from memory or another exam.

The profile controls every allowed navigator, answer change, flag, section, question count, and deadline behavior. There is no global duration. Simulation supplies no feedback before final submit. System exit confirms; manual finish warns but permits unanswered questions; unanswered are incorrect and separately diagnosed. Timeout freezes answers and starts an idempotent final commit. One exam per track is active, resume is allowed while its absolute deadline remains, and expiry outside the app auto-finalizes. Results show raw correct count, percentage, and competency breakdown; partial never increments correct. Answer review defaults to missed and can show all. No official-looking pass/fail exists; an internal threshold is clearly Patternly-defined.

## Provenance and boundaries

Use stable official sources and include volatile source/version data where an item depends on it. Do not copy exam dumps or claim affiliation. The target does not preserve pre-production local certification history through translators or compatibility paths.
