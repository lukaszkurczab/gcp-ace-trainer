# 17 — Training Runtime and Interaction Specification

## 1. Preconditions and mode configuration

Resolve track, canonical mode, content version, and supported payload before setup. Unknown ID, unsupported payload, missing content, missing profile, or content mismatch is an explicit error. The runner never substitutes default topic, item, answer, score, or generic explanation.

Algorithms configuration is fixed:

| Mode | Length | Feedback | Timer | Reinsert |
| --- | ---: | --- | --- | --- |
| Learn Approach | 10 | after each | elapsed foreground | no |
| Guided Practice | 20 | after each | elapsed foreground | yes |
| Recognize Patterns | 20 | after each | elapsed foreground | no |
| Contrast Practice | 20 | after each | elapsed foreground | no |
| Weak Area Review / `due_queue` | 10 | after each | elapsed foreground | yes |
| Weak Area Review / `session_misses` | 10 | after each | elapsed foreground | yes |
| Independent Practice | 20 | after each | elapsed foreground | no |
| Interview Simulation | 40 | session end | 45-minute foreground countdown | no |

Review selection is source items first, then reviewed compatible mental-category/competency items. If insufficient, set `actualLength` below requested length, show it before start, and never widen taxonomy, duplicate an item, or use an unrelated/default item.

## 2. Session lifecycle and persistence

```txt
prepare → persist one active session → active unanswered → active answered
→ practice: validate and freeze → journal durable → feedback or transition → materialize → verify → clear journal
```

Persist before first item. Persist immutable session item order, shuffled option order, mode configuration, content version, and foreground active time. Immediate-feedback practice does not persist an unsubmitted selection. Algorithms `Interview Simulation` persists editable response drafts, occurrence-keyed flags, and current position as canonical active-session recovery state. Flags are session fields (never draft fields), use only immutable plan occurrence IDs, and remain available in the terminal session record. Only one active session exists. A learner can continue it or explicitly abandon it; abandoned sessions are not history and committed attempts remain.

The durable journal contains a deterministic attempt/session/review outcome. No feedback or advance occurs before journal durability. Retry is idempotent. Force-close recovery finishes journaled work. No partial-success copy, old store, or second write path is permitted.

## 3. Responses and scoring

An immediate-feedback practice selection changes only local UI state until submit. Submitted practice responses are immutable attempts. Algorithms simulation selections are persisted editable drafts and do not become attempts until finalization. Multiple-choice practice is correct when selected set equals correct set, partial when it is a non-empty proper subset with no wrong option, otherwise incorrect with zero points. Simulation counts only correct; partial is diagnostic.

Ordering content has at least two elements. For canonical order `A → B → C → D`, evaluate adjacent relations `A→B`, `B→C`, `C→D`; maximum points equals item count minus one. All preserved is correct, at least one but not all is partial, and zero is incorrect. Exact-position scoring is not used.

Complexity content declares checked dimensions, values, and accepted values or aliases. Award one point for each checked dimension. Time-only and space-only items are valid. No global closed list of complexity classes exists.

## 4. Feedback

Practice shows feedback after each durable submit. `Reason` is concise immediate orientation. `Details` is collapsed, complete, and available after correct, partial, and incorrect results. It connects mechanism/application, corrects the actually selected error, and gives transfer/counterexample when useful. Choice details include authored stable-ID explanation for each selected wrong option. Opening Details has no domain side effect. Runtime never fabricates educational copy.

Session-end modes reveal no per-item feedback before the finalization journal is durable. A post-session review can use the same authored Reason and Details.

## 5. Review and reinsert

Create/increase review for incorrect, partial, supported hint use, wrong pattern, wrong strategy, complexity error, repeated mistake, scheduled retrieval, weak taxonomy area, or manual mark. Store source item plus skill/competency/taxonomy evidence. A family may select exact, reviewed-variant, contrast, or repair item.

Persistent review resolves only after two successful review attempts after `dueAt`. An earlier attempt does not increment success; partial/incorrect resets it; same-session correction does not resolve it. Reinsert is enabled only in `Guided Practice` and Algorithms `Weak Area Review` with `source = due_queue` or `source = session_misses`; it is disabled in every other Algorithms mode. It is maximum once for the original failed or partial attempt.

```txt
eligible failed or partial attempt
  ↓
reinsert allowance still unused?
  ├─ no  → no reinsert
  └─ yes
       ↓
can two other submitted items occur before session completion?
  ├─ no  → skip reinsert
  └─ yes → schedule reviewed variant, or exact item if no reviewed compatible variant exists
```

A reinsert may occur only after at least two other items have been successfully submitted since the original attempt. Displaying, preparing, abandoning, or reusing the original item does not count. The reinsert creates a separate attempt and both attempts remain diagnostics; it does not remove the first error or resolve persistent review after same-session correction. It must fit the already selected session plan and never changes requested or actual length. If separation is impossible, skip it as a normal outcome without extending or reordering the session, duplicating unrelated items, widening taxonomy, inserting generic content, or changing persistent review scheduling.

## 6. Timers, interruption, and errors

Practice timers count foreground active time only. Algorithms `Interview Simulation` also counts foreground active time and displays `max(0, 45 minutes - activeForegroundMs)`; it has no deadline, and background or closed-app time does not decrement it. Certification simulation uses the absolute deadline from its owning profile. A content mismatch blocks resume. Preparation, submit, materialization, and completion errors remain explicit; none creates a substitute result.

## 7. Algorithms Interview Simulation

The session plan contains exactly 40 items. Navigation is free, answers may be added, changed, or removed until final submission, feedback is session-end only, unanswered items are allowed, and reinsert is disabled. Persist every draft response, the current position, and accumulated foreground time so resume restores both draft and timer state. Saving a draft creates no attempt, review mutation, score, or feedback.

Manual submission or exhaustion of 45 foreground minutes freezes the drafts and starts one idempotent finalization. The finalization journal atomically creates immutable attempts and persistent-review mutations only for answered, submitted outcomes, completes the session, and deletes the persisted draft. Unanswered item IDs are reported separately and create neither attempts nor review entries. Feedback remains unavailable until this journal is durable.

## 8. Certification simulation

Certification `Exam Simulation` uses the owning track's versioned `ExamExperienceProfile`: official source URL/date, guide version when available, duration, question count/range, navigation, answer-change, flagging, navigator, section, and automatic-final-submit policies. It does not use global defaults or infer unspecified official rules.

No feedback appears before final submit. Confirm system exit. Manual finish warns but permits unanswered responses; they count incorrect and remain a distinct diagnostic. Timeout freezes answers and starts idempotent final commit. Resume while absolute deadline remains; otherwise auto-finalize. Show raw correct count, percentage, competency breakdown, and missed-by-default review with an all-items option. Partial does not increment correct; no official-looking pass/fail result exists.

## 9. Required recovery rule

If an existing model, record, flow, or module cannot be moved into the canonical structure without preserving obsolete semantics, delete it. Do not create fallbacks, translators, compatibility adapters, or parallel paths. Backward compatibility is not required for pre-production storage, content, or runtime models. An explicit runtime failure is a valuable signal that migration work remains; it must not be hidden by substituting defaults or reading the old system.
