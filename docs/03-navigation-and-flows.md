# 03 — Navigation and Flows

## Navigation

Root navigation exposes Home, track selection, session setup, session runner, session summary, review, progress, and settings. Track context is visible throughout. A session never mixes tracks.

Home shows deterministic, explained recommendations, prioritizing overdue review and repeated mistakes. It never shows confidence, readiness, retention, or mastery percentages. A learner can override the recommendation.

## Algorithms modes and setup

The only Algorithms labels are `Learn Approach`, `Guided Practice`, `Recognize Patterns`, `Contrast Practice`, `Weak Area Review`, `Independent Practice`, and `Interview Simulation`. Topic practice starts `Guided Practice`; pattern recognition starts `Recognize Patterns`; contrast starts `Contrast Practice`; mixed starts `Independent Practice`; timed validation starts `Interview Simulation`.

`Weak Area Review` setup declares `source = due_queue` or `source = session_misses`. Selection first takes that source, then only reviewed items from the same mental category or competency. If the compatible pool is too small, the session is shortened, its actual length is shown before start, and no unrelated item, duplicate, or generic substitute is used.

## Session flow

```txt
setup → show actual configuration → persist one active session → first item
→ practice submit and durable journal → feedback or next item → summary
```

All non-simulation sessions use elapsed foreground time and show a count-up timer. Algorithms `Interview Simulation` uses a 45-minute foreground countdown: `remainingMs = max(0, 45 minutes - activeForegroundMs)`. It is not a deadline, and background or closed-app time does not consume it. Certification `Exam Simulation` uses the absolute deadline required by its profile. The learner can continue an active session or explicitly abandon it. An abandoned session is absent from history; committed attempts remain.

Practice gives feedback after each answer and does not persist an unsubmitted selection. Simulation gives no per-item feedback before final submit. The runner has a visible question counter, accessible response controls, and explicit content/preparation errors.

## Algorithms Interview Simulation

`Interview Simulation` has exactly 40 items. It permits free navigation and answer changes until final submission. Each draft response, the current position, and accumulated foreground time are persisted so resume restores the draft and timer state. Draft changes create no attempt, review mutation, score, or feedback.

Manual submission or exhaustion of 45 minutes of foreground time freezes the drafts and starts one idempotent finalization. That atomic finalization creates immutable attempts and persistent-review mutations only for answered, submitted outcomes, completes the session, and deletes its draft state. Unanswered item IDs are allowed and reported separately; they create neither attempts nor review entries. Feedback appears only after finalization. Reinsert is disabled.

## Certification simulation

Each certification `Exam Simulation` reads the track instance's `ExamExperienceProfile`. Its question count, deadline, navigation, answer changes, flagging, navigator, section behavior, and final timeout behavior are profile-driven. If official behavior is unclear, the track cannot claim faithful simulation.

System exit asks for confirmation. Manual finish permits unanswered items but warns with their count. Timeout freezes answers and starts an idempotent final commit. If the app returns before the deadline, the learner resumes; after it, the app auto-finalizes. Results show raw correct count, percentage, competency breakdown, and unanswered as a distinct incorrect diagnostic category. No official-looking pass/fail is shown; any practice threshold is labelled Patternly-defined. Review defaults to missed items and can show all.

## Design dependency

Missing UI design for a required interaction, timer state, review disclosure, or exam navigator blocks implementation. Codex must not invent a new product interaction in its place.
