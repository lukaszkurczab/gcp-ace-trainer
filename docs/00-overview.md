# 00 — Overview

## Product

Patternly is a local, offline-first focus lab for technical certification and algorithmic decision practice. A track is a content and learning domain; a mode is a session configuration. The product does not provide an online judge, copied exam material, official certification status, user accounts, cloud synchronization, or a content feed.

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

`due_queue` and `session_misses` are sources for Algorithms `Weak Area Review`, not modes. Progress never locks a mode; it supplies an evidence-based recommendation and the learner may choose another mode.

## Product loop

```txt
choose track and mode → select a bounded session → attempt → receive authored feedback
→ create evidence and review obligations → choose the next explained action
```

The product shows only metrics that answer a training question, change a training decision, and have enough evidence. It does not collect confidence or display synthetic readiness, retention, or mastery percentages.

## Content and feedback

Every instructional item has concise immediate `Reason` and collapsed, complete `Details`, available after correct, partial, and incorrect attempts. Choice-item wrong options have authored explanations keyed by stable option ID. Patternly corrects content in place: it does not retain obsolete explanations to reconstruct local history.

Algorithms batches teach one mental unit at a time: active roadmap units, then highest false-heuristic risk, then contrasts and mistake diagnosis, then remaining foundations and mechanics. Certification remediation batches by competency area and then topic. All active content receives human editorial review.

## Persistence and recovery rule

The target is one MMKV client, imported only by infrastructure, and one set of repositories. Historical local data, old keys, old read/write APIs, and Cloud write-through are deleted; they are not migrated or translated. A content version identifies the active bank only.

If an existing model, record, flow, or module cannot move into the canonical structure without preserving obsolete semantics, delete it. Do not create fallbacks, translators, compatibility adapters, or parallel paths. Backward compatibility is not required for pre-production storage, content, or runtime models. An explicit runtime failure is a valuable signal that migration work remains; it must not be hidden by defaults or by reading the old system.

## Certification boundary

Each certification track instance owns a versioned `ExamExperienceProfile` sourced from an official public guide and dated when checked. Patternly mirrors only documented official behaviour and never implies affiliation, official scoring, or a pass/fail outcome.

## Documentation authority

Documents `00`–`17` are the canonical product and architecture contract. They distinguish target behaviour from current repository facts. The recovery plan is generated separately from this contract.
