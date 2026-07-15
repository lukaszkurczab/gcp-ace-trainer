# 12 — Testing Strategy

## Contract tests

Test the shared kernel, each family runtime, repositories, content validation, integration flows, and essential accessible UI states. Tests assert target behaviour and explicit failure; they do not preserve old storage or runtime behaviour.

## Exact scoring tests

- Multiple-choice: exact correct set is correct; non-empty proper correct subset with no wrong option is partial; any wrong option is incorrect with zero points; an exam counts only correct.
- Ordering: reject fewer than two elements; score every correct adjacent relation; all is correct, one-to-max-minus-one is partial, zero is incorrect; no exact-position scoring remains.
- Complexity: test declared dimensions, values, aliases, shared presets, time-only, space-only, and rejection of a value outside the item contract; no closed global class list exists.

## Session and review tests

Test all canonical Algorithms modes and entry-point mappings. `due_queue` and `session_misses` must be sources of `Weak Area Review`, never modes. Review selection takes source items, then reviewed compatible taxonomy/competency items, otherwise shortens and exposes actual length; it never widens taxonomy, duplicates, or substitutes generic content.

Test reinsert only in `Guided Practice` and Algorithms `Weak Area Review` with `source = due_queue` or `source = session_misses`; all other Algorithms modes prohibit it. A failed or partial item is eligible at most once. After two other items are submitted, its reviewed variant—or the exact original only when no reviewed compatible variant exists—may appear once. The second appearance creates a separate attempt and both attempts remain in diagnostics.

Test that zero intervening submitted items skips reinsert, and that one intervening submitted item also skips it. When skipped, the session is not extended or reordered, unrelated items are not added or duplicated, taxonomy is not widened, generic content is not inserted, and the persistent review entry is neither changed nor resolved. Preparation failures, merely displayed items, abandoned items, and the original item itself do not count toward the two submitted intervening items. Test that hint review evidence is impossible for an interaction without an explicitly supported hint.

Test each remaining review trigger, two-level evidence, two successful after-due attempts to resolve, pre-due non-increment, same-session non-resolution, and reset after partial/incorrect.

Test the fixed Algorithms `Interview Simulation` contract: exactly 40 items; free navigation; response add, overwrite, and removal until final submission; session-end feedback only; no reinsert; and manual or 45-minute foreground-time finalization. Assert `remainingMs = max(0, 45 minutes - activeForegroundMs)`, background and closed-app time do not decrement it, and no deadline or wall-clock expiry is used. Resume must restore persisted drafts, current position, and foreground timer state.

Assert that draft changes create no attempts, review mutations, score, or feedback. Manual and timeout finalization must be idempotent and atomic across immutable attempts, submitted-outcome review mutations, session completion, and draft deletion, including force-close recovery. Unanswered item IDs remain separate summary diagnostics and create neither attempts nor review entries.

## Persistence tests

Test one active session, persistence before first item, item/option order, foreground timer, no unsubmitted selection in immediate-feedback practice, abandon/history behavior, content mismatch block, and durable journal order. Test idempotent retry and force-close journal completion. Assert that old keys, AsyncStorage access, dual reads/writes, translators, and default substitutes are absent or fail explicitly.

## Certification tests

Test `ExamExperienceProfile` in architecture integration, data validation, flows, certification behavior, and runtime. Validate official source/date/profile fields and profile changes. Test navigation, answer change, flagging, navigator, sections, deadline, resume, auto-finalization, unanswered warning/category, raw score, percentage, competency breakdown, no pre-final feedback, and no official pass/fail.

## Content and UI tests

Require Reason, Details, and stable-ID explanations for every active wrong instructional option. Details must be available after all result kinds and opening it must have no domain side effect. Structural checks cannot replace human editorial review.

Test visible shortened-review disclosure, timer variants, ordering controls, content-defined complexity controls, profile-driven exam controls, accessible states, and explicit missing-content/profile/storage errors. Missing design reference blocks implementation rather than becoming a Codex-created interaction.

## Required negative suite

The suite must fail if confidence fields or UI return; synthetic readiness/retention/mastery percentage returns; an old mode becomes active; a fallback/default/translator/parallel path appears; historical migration appears; or an old model remains reachable.
