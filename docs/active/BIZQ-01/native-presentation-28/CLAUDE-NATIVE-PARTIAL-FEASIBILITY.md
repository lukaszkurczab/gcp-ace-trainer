# Claude ordinary-practice partial-score feasibility

## Finding

A fresh, normal `certification-focus-practice` session for Claude's free N01 does **not** naturally include a partial-capable multiple-choice question at any configured session length (10, 20, or 40). I loaded the current canonical catalog, installed an isolated in-memory repository, read its empty attempt/review state, and asked the production `CanonicalTrainingRuntime.prepare` path for each length. All 10, 20, and 40 selected questions were `choice_single`.

The 48-question free-node pool itself contains 42 `choice_single` and 6 `choice_multiple` items. Each of those six multiple-choice questions can score partial through the real scorer: selecting one of its two accepted options is a complete response scoring 4/5. They are beyond the first 40 questions selected from empty history.

I then completed that ordinary 40-item prepared session through `CanonicalTrainingRuntime.submitPractice`, using each selected question's authored answer, advanced through the existing domain session transition, and finalized it. The runtime produced 40 correct attempts. Preparing the next ordinary 10-, 20-, and 40-item sessions from those actual attempt objects naturally selected all six `choice_multiple` questions each time (the rest were `choice_single`). Therefore the content is reachable through ordinary follow-on practice after completing the first session; the gap is limited to the very first fresh selection. No manually constructed history or item replacement was used.

The existing Claude runtime test exercises multi-select scoring by replacing one prepared single-select occurrence with a pool multiple-choice question when none was selected (`CanonicalTrainingRuntime.test.ts:98-123`). That is a valid scorer/runtime-contract test, but it is a deliberately altered plan, not evidence that the ordinary selector naturally includes the item.

The supported UI route is to make Claude the active track, open Practice Hub, select Focus Practice, choose 10/20/40, then start the session. The mode is immediate and does not take the Premium-admission branch. `requiresPremiumProductMode` reserves Premium for exam/simulation modes, while the ordinary focus mode routes through Practice Setup. That route requires Claude to be the active track; the native feasibility probe did not change it or create a user session.

## Reproduction

From `patternly/`, with Node 22 and the existing `tsx` loader:

```sh
PATH=/opt/homebrew/opt/node@22/bin:$PATH node --import tsx docs/active/BIZQ-01/native-presentation-28/CLAUDE-NATIVE-PARTIAL-PROBE.mjs
```

The versioned probe is SHA-256 `cc0ee73735045f26e3abf646e2b56a44fb82cc777afb24cc0d4c49b7fc55a920`. It used `installKeyValueStorageForTests(new MemoryKeyValueStorage())`, then `loadTrainingAttempts()` and `loadReviewQueueItems()`; both returned zero. It called `loadCanonicalRuntimeCatalog()`, obtained Claude's `certification-focus-practice` pool, and called `new CanonicalTrainingRuntime(track).prepare(...)` for requested lengths 10, 20 and 40 with those empty in-memory records. It inspected the prepared session's actual `itemOrder`, resolved each item through `track.getQuestion`, and counted its interaction type. The script then completed one ordinary 40-item session through real runtime submissions/finalization and prepared follow-on sessions from those returned in-memory attempts. No user repository, question replacement, seeded history, SDK, simulator, or device was used.

For each pool `choice_multiple`, the probe submitted a complete response containing one of the two accepted `optionIds`. `isCanonicalResponseComplete` returned true and `scoreCanonicalQuestion` returned `partial`, 4 earned of 5 maximum. The scorer's `choice_single` path yields only correct/incorrect, and no first fresh-session question used another interaction type.

For the repeat-selection check, the same in-memory probe submitted the correct answer for each of the 40 first-session questions via the production runtime, advanced with the existing `advanceTrainingSession` domain transition between submissions, and called `finalizePractice`. It passed the resulting 40 runtime-created attempts into the next `prepare` calls. The attempt objects remained in the isolated process; nothing was persisted to a user repository.

## Track-switch and reminder consequence

Opening Claude's ordinary route from a currently active GCP context requires committing a track switch in the normal UI. `SelectTrackScreen` saves the new active track and then calls `reconcileDeviceReminder`. The account-data operation also marks account data pending after the active-track write. I did not perform this operation or inspect the live account, goal, plan, reminder settings, or OS notifications.

Goals and plans are stored under track-specific keys. Switching the active track therefore does not itself overwrite the saved GCP goal or learning plan. Reminder reconciliation is different: it reads the *currently active* track's goal, plan, content identity, and reminder settings. If Claude has no valid reminder source, the coordinator cancels currently recorded reminder IDs and clears the active reminder identity/schedules. If Claude has a valid source and reminders are enabled, it materializes a Claude-bound identity and slots, then cancels obsolete IDs. Switching back to GCP reads its separately stored goal and plan and can reconcile GCP reminders again when that source is still valid, permission is granted, the timezone matches, and the pinned artifact resolves.

This makes semantic restoration possible from the stored GCP goal/plan, but it does not promise that native notification IDs stay byte-for-byte identical or that reminders never pause during the track change. The scheduler may recover a matching ID or create a new one and cancel an obsolete ID. No exact-ID preservation requirement is established by the implementation. Given the instruction to preserve the current GCP context and reminders, this report stops before any active-track switch; root remains the state/device owner.

## Boundaries

This is deterministic source/runtime feasibility for empty history and one completed ordinary 40-item session. It is not native acceptance, does not verify the UI's rendered partial feedback on device, and is not full Q12 or BIZQ-01 acceptance. It does establish that current production selection can naturally reach partial-capable questions in ordinary follow-on practice, without a synthetic replacement item. The earlier GCP presentation slice remains separate from this Claude-specific runtime result.

Evidence bindings, first and follow-on 10/20/40 selected IDs, the completed-session outcome, and the six scorer checks are recorded in the JSON companion.
