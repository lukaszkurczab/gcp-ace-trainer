# Next native presentation feasibility

Date: 2026-10-05. Read-only source/runtime preflight; no device, account, service, app preference, learning history, active track, reminder, or goal state was changed.

## Finding

The existing free Coding practice flow uses the shared native practice runner and supports multiple interaction types, but there is no exact-question picker in the learner flow. With an empty attempt history, the actual selector returned only `choice_single` questions in every available Coding free-node session length (10, 20, or 40). Since single-choice scoring has no `partial` outcome, none of those selected sessions can produce the requested partial result. It also did not select the long-option multiple-choice candidate below. Reaching other history-dependent selection behavior would require training activity not established as part of a state-preserving route.

The candidate is `alg-complexity-amortized-013` in the current generated Coding artifact. It is a real multiple-select question with three correct choices and one incorrect choice; its longest option is 98 characters. Selecting only `ignore_spike` is a complete response that should score `partial`. The track's August content approval is for the canonical track/source commit, but its review packet sampled three other item IDs and does not establish item-specific BIZQ repaired-question acceptance for this candidate. It is not in the accepted OOD N07 closure. Do not count this candidate as repaired BIZQ native evidence on these bindings.

There is a concrete state change if the current active track is GCP. The visible track picker persists Coding as the active track, then reconciles reminders against that new track. Goal and plan records are keyed by track, so the selection does not itself overwrite the stored GCP goal/plan. But it changes the active-track setting. For reminders, the implementation reads the selected track's goal and plan: if that source is missing or invalid, it cancels the existing OS notification IDs and clears the saved schedules; if Coding has a ready plan, its `trackId` differs from the current GCP reminder identity, so reconciliation takes the replacement path instead of the same-source no-op and moves reminder provenance to Coding. Returning to GCP is another reconciliation and is not guaranteed to restore the original notification IDs byte-for-byte. The active track, Coding plan, and personal reminder state were not inspected, so this report does not claim which branch a real account would take.

## Existing route and selector probe

When Coding is already the active track, the learner-facing route is Practice → Custom Practice → select length 10, 20, or 40 → Start Session. The setup offers length and feedback timing, not a question or mental-unit selector. Learn Approach offers length 10; Guided Practice offers 10/20/40. All three normal modes use the free `complexity_and_constraints` node.

The probe called the existing `selectPracticeQuestions` implementation directly with the current free-node pool, current artifact content pin, no attempts, and each length exposed by the normal UI. Results were:

| Requested | Selected | Selected interaction types | Any selected item can score `partial`? | Candidate selected |
| ---: | ---: | --- | --- | --- |
| 10 | 10 | `choice_single`: 10 | no | no |
| 20 | 20 | `choice_single`: 20 | no | no |
| 40 | 40 | `choice_single`: 40 | no | no |

The selected item types were checked against the current scorer, not inferred from the absence of multiple-choice. Each selected item was `choice_single`, whose scorer returns only `correct` or `incorrect`; therefore these actual sessions contain no partial-capable interaction. This is a fresh-history selector result, not a claim about every possible prior history. Prior attempts can influence selection, but I did not inspect or create such history. A question appearing after deliberate practice would not be a no-seed, state-preserving acceptance route.

If this question were naturally present in a session, stable runtime selectors would be:

- question: `patternly:session:question:alg-complexity-amortized-013`
- options: `patternly:session:option:alg-complexity-amortized-013:ignore_spike`, `...:random_average`, `...:unbounded_cleanup`, `...:sequence_total`
- submit: `patternly:session:submit:alg-complexity-amortized-013`
- partial result: `patternly:session:result:alg-complexity-amortized-013:partial`
- explanation: `patternly:session:details-toggle:alg-complexity-amortized-013` and `patternly:session:details:alg-complexity-amortized-013`

`choice_multiple` is rendered with checkbox controls. The score contract returns a partial result when a non-empty proper subset of correct option IDs is selected without an incorrect choice. Those are source/runtime capabilities only; no native action or result was performed.

## Preserving the current GCP state

The selected track is persisted by the normal track-selection action and account data is marked pending. Reminder reconciliation reads the active track and its goal/plan. If the new track lacks a valid reminder source, `clearForSource` cancels the recorded notification IDs and empties saved schedules. If a Coding source is ready, the reminder identity includes `trackId`, so the GCP identity cannot satisfy the existing same-identity/same-slots no-op; reconciliation proceeds through the journaled materialization/replacement path. The GCP goal and plan remain separately keyed by GCP, but the active reminder source changes or clears. Going back to GCP is a second transition, not a guaranteed byte-exact restoration of the prior OS notification IDs. I did not perform it or inspect the user's state.

There is a `trackId` route parameter used by the practice read model, but the normal in-app entry points supply the active track. Manually invoking a route with a different track would bypass the ordinary track-selection flow and would not establish an end-to-end learner path.

## Practical disposition

There is no presently demonstrated free Coding normal-UI path that both preserves the active GCP reminder state and naturally reaches a known partial-capable long-option item. If Coding is already active, the normal 10/20/40 flow is available, but the no-history selector probe shows it is insufficient to guarantee such a question. Do not seed attempts, force the selector, alter active-track state, or use a test fixture to manufacture Q12 evidence.

The read-only existing GCP session remains suitable for presentation checks on content it naturally displays. It cannot establish a partial native response. OOD questions are all `choice_single`, and the Premium settings switch exposes only the one-item AWS smoke fixture; neither supplies the missing partial case. A future Q12 partial demonstration needs an already accepted repaired question that is naturally eligible through an existing mode, or an explicitly reviewed product/runtime change. This report does not propose either change.

No simulator or device test was run. No native, Q12-complete, repaired-partial, Premium OOD, or full BIZQ-01 acceptance claim is made.

## Bound source references

The JSON companion binds the exact current hashes of the question artifact, selector, mode configuration, runner controls, track-switch/reminder path, relevant BIZQ/runtime contracts, and Coding track approval/review packet. The generated Coding artifact reports content version `coding-interview-dsa-problem-solving-authoring-v2026.10.02-bizq01-04`; its current track approval packet reviewed three sample questions rather than this candidate.
