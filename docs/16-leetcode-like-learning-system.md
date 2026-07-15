# 16 — Algorithms Learning System

## Scope

Algorithms is a strategy-first learning track, not an online judge or clone of an external platform. Its canonical taxonomy is roadmap mental unit, pattern family/variant, problem archetype, and skill atom. Content teaches constraints, preconditions, invariant, state, correctness, complexity, contrast, and transfer.

## Canonical modes

| Mode | Default length | Feedback | Timer | Reinsert |
| --- | ---: | --- | --- | --- |
| Learn Approach | 10 | after each | elapsed foreground | no |
| Guided Practice | 20 | after each | elapsed foreground | yes |
| Recognize Patterns | 20 | after each | elapsed foreground | no |
| Contrast Practice | 20 | after each | elapsed foreground | no |
| Weak Area Review — due queue | 10 | after each | elapsed foreground | yes |
| Weak Area Review — session misses | 10 | after each | elapsed foreground | yes |
| Independent Practice | 20 | after each | elapsed foreground | no |
| Interview Simulation | 40 | session end | 45-minute foreground countdown | no |

Topic/default practice maps to `Guided Practice`; pattern recognition to `Recognize Patterns`; contrast to `Contrast Practice`; due and session-miss sources to `Weak Area Review`; mixed to `Independent Practice`; timed validation to `Interview Simulation`. No second mode taxonomy exists.

## Interview Simulation

`Interview Simulation` uses one fixed 40-item plan, free navigation, and editable responses until final submission. It persists draft responses, current position, and accumulated foreground time for resume. Its remaining time is `max(0, 45 minutes - activeForegroundMs)`: background and closed-app time pause the countdown, and no wall-clock deadline exists.

Manual submission or foreground-time exhaustion performs one idempotent atomic finalization. Only then are immutable attempts and persistent-review mutations created, and only for answered, submitted outcomes; the completed session is persisted and its draft is deleted in the same operation. Unanswered item IDs are allowed and reported separately, with no attempt or review entry. Feedback is session-end only. Reinsert is disabled.

## Review selection and reinsert

Select due items or session misses first. Fill only with reviewed items from the same mental category or competency. If still too small, shorten, disclose actual selected length before start, and do not widen taxonomy, add unrelated content, duplicate items, or use a generic answer.

Reinsert is enabled only in `Guided Practice` and Algorithms `Weak Area Review` with `source = due_queue` or `source = session_misses`; it is disabled in every other Algorithms mode. It can occur at most once for the original failed or partial attempt and only after at least two other items have been submitted. Prefer a reviewed variant of the same mechanism; the exact item is allowed only when no reviewed compatible variant exists. The reinsert creates a separate attempt, both attempts remain evidence, and a corrected reinsert does not resolve persistent review.

When the remaining compatible session structure cannot provide two intervening submitted items, skip the reinsert rather than forcing unrelated content or changing the session contract. Do not extend or reorder the session, duplicate items, widen taxonomy, or insert generic content; skipping leaves persistent review scheduling unchanged.

## Interaction contracts

Multiple choice: exact set is correct; non-empty proper correct subset with no wrong option is partial; any wrong option is incorrect with zero points. Ordering scores preserved correct adjacent relations and requires two or more elements. Complexity is content-defined: the item declares dimensions, values, accepted values or aliases, with one point per checked dimension; time-only and space-only are valid.

## Content quality and recommendation

Every instructional item has authored Reason and complete Details; each wrong option has stable-ID explanatory coverage. Batch order is active roadmap units, false-heuristic risk, contrasts/mistake diagnosis, then remaining foundations/mechanics. Human editorial review applies the content rubric.

Recommendation is deterministic and explained from evidence volume, learning-stage evidence, and performance signals. It never locks a mode, collects confidence, or claims readiness. It prioritizes due review and repeated mistakes while allowing learner override.
