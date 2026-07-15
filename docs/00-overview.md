# 00 — Overview

## Product

Patternly is a local, offline-first focus lab for technical certification and algorithmic decision practice.

A track is a content and learning domain. A mode is a user-facing training contract that resolves into a bounded session configuration, including selection, feedback timing, timer behaviour, review behaviour, and completion rules.

The product does not provide an online judge, copied exam material, official certification status, user accounts, cloud synchronization, or a user-facing content feed.

## Canonical session modes

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

`due_queue` and `session_misses` are sources for Algorithms `Weak Area Review`, not modes.

Progress never locks a mode. It supplies an evidence-based, explained recommendation, and the learner may choose another mode for the current session.

## Product loop

```txt
choose track and mode
→ prepare and persist a bounded session
→ attempt
→ durably commit the deterministic outcome, evidence, and review obligations
→ reveal authored feedback at the point configured by the mode
→ choose the next explained action
```

Practice modes reveal feedback after each durable submission. Session-end modes reveal no item-level correctness or instructional feedback before finalization.

The product shows only metrics that answer a concrete training question, can change a training decision, and have sufficient supporting evidence. It does not collect confidence or display synthetic readiness, retention, or mastery percentages.

## Content and feedback

Every active instructional item has an authored concise `Reason` and complete `Details`.

In practice modes, `Reason` is revealed after durable submission and `Details` is initially collapsed. In session-end modes, both remain unavailable until finalization and post-session review.

`Reason` and `Details` are available for correct, partial, and incorrect submitted attempts. Choice-item wrong options have meaningful authored explanations keyed by stable option ID. Runtime does not fabricate educational explanations.

Patternly corrects active content in place. It does not retain obsolete explanations or historical item mappings to reconstruct local learning history.

Algorithms content-authoring and editorial-review batches cover one mental unit at a time, prioritized as follows:

1. active roadmap units;
2. highest false-heuristic risk;
3. contrasts and mistake diagnosis;
4. remaining foundations and mechanics.

Certification content remediation batches by competency area and then topic.

Content enters the active bank only after human editorial review against the applicable family rubric.

## Persistence and recovery rule

The canonical target is one MMKV client, imported only by infrastructure, and one repository set.

Historical local data, old keys, old read/write APIs, and Cloud write-through are deleted. They are not migrated, translated, or read as a fallback. A content version identifies the active content bank only.

If an existing model, record, flow, or module cannot move into the canonical structure without preserving obsolete semantics, delete it.

Do not create fallbacks, translators, compatibility adapters, dual reads, dual writes, parallel runtimes, or parallel authoritative paths. Backward compatibility is not required for pre-production storage, content, or runtime models.

An explicit runtime failure is valuable evidence that migration work remains. It must not be hidden by defaults, generic substitutes, suppressed errors, or reads from the old system.

## Certification boundary

Each certification track instance owns a versioned `ExamExperienceProfile` sourced from an official public guide and dated when checked.

Patternly mirrors only documented official behaviour. If an official rule is unclear, the track cannot claim faithful simulation until that rule is resolved.

Patternly never implies affiliation, endorsement, an official score, or an official pass/fail outcome. Any internal practice threshold must be explicitly labelled as Patternly-defined and must not resemble an official certification decision.

## Documentation authority

Documents `00`–`17` define the canonical product, learning, interaction, architecture, persistence, content, and testing contracts.

They describe target behaviour separately from current repository facts.

Document `18` is a subordinate execution plan. It may describe current repository evidence, completed recovery stages, implementation gates, and sequencing, but it cannot override or reinterpret documents `00`–`17`.

If document `18`, the repository, an earlier plan, or an implementation prompt conflicts with the canonical contract, documents `00`–`17` take precedence and the conflicting execution material must be corrected or regenerated.
