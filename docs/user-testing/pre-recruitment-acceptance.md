# Pre-recruitment acceptance record

## Purpose and decision rule

This is the canonical execution record for the stable participant-build
identity and three manual/operational gates that remain after Patternly's
automated, publication, device and visual checks. It does not replace human
judgment with automation.

Recruitment remains blocked until every required record below is complete and
the final readiness decision is `GO`. There is no conditional GO and no permission
to substitute another build, question sample, participant path or data policy.

## Bound release

| Field | Required value |
| --- | --- |
| App ID | `com.lkurczab.patternly` |
| Release | `patternly-core-0015` |
| Producer commit | `d780204eba858c05b94fdbce8de38ec4c3900a50` |
| Content source commit | `9e23b08d051ac473436f27544b0dbfefeda496d6` |
| Algorithms | `algorithms-core-0008` / `2c6749d68c4c2c9f95bc4b9c4d21350df92776603648b2240fd1da39bb8d9adf` |
| Certification | `gcp-ace-0014` / `f692d3878c12907cc1df7922a1eb6e5567757989450063dc9e495cebf4bd4042` |
| Algorithms participant sample | Exact ten-item order in [representative-content-manifest.md](representative-content-manifest.md) |
| Participant-build identity | Schema 1 / 279 inputs / `6c113edc3bbbfdd716d48385b5356a35eb1b22932084287b3a2e896a863bf646` |

If any identity changes, stop and re-run the release, device and visual gates
before using this record.

## Current gate status

| Gate | Status | Completion evidence |
| --- | --- | --- |
| Complete reviewed publication and application pin | `done` | [Current product status](../release-candidate-closure.md) and cross-repository release test |
| Automated/static application checks | `done` | Dated baseline in current product status: 400/400 tests plus recovery, type, content and privacy boundaries |
| iOS and Android core journey | `done` | Dated baseline in current product status: two consecutive passes per platform |
| Current visual review | `done` | 100 screenshots and zero open P0–P3 in represented states |
| Stable participant-build identity | `done` | Schema 1, 279 inputs and exact SHA above; the dated four-run result is retained in current product status |
| PO-013 A protocol consistency | `done` | Screener, consent, moderator guide, observation form and synthesis require notes-only operation and contain no optional-recording path |
| Manual VoiceOver traversal | `blocking` | Complete section 1A |
| Manual TalkBack traversal | `blocking` | Complete section 1B |
| Timed human dry-run | `blocking` | Complete section 2 |
| PO-013 operational inputs | `blocking` | Complete section 3 |
| Recruitment | `blocking` | Requires final readiness `GO` in section 4 |

## 1. Manual screen-reader acceptance

### Operator rules

- Use the exact release above on the final participant platform.
- Keep the product locale in English.
- Start from clean first-use learning state.
- Listen to the complete announcement; visual inspection or hierarchy output
  is supporting evidence, not a substitute.
- Record what was actually announced for a failed or ambiguous control.
- Do not add hidden labels, alternate paths or test-only runtime behavior to
  make the traversal pass.

### Required journey

Traverse and operate each point using only the screen reader:

1. Home heading, Algorithms track context and bottom navigation.
2. Practice Hub and the `Independent Practice` mode card.
3. `Hash map and set` scope selection and session start.
4. One choice response, the ordering response and the complexity response.
5. Submit, correctness state, Reason, expanded Details and Next.
6. Pause/end modal, `Pause and resume later`, relaunch and Resume.
7. Summary, Progress and the next-action route.
8. From the post-session state, start a new Guided Practice session with the
   main `Start session` action, pause it with `Pause and resume later`, then
   navigate to `Independent Practice → Hash map and set`. On `Finish or leave
   the active session first`, activate `Abandon and start Independent
   Practice`; on `Abandon active session?`, cancel with `Keep session`.

For every point, all applicable criteria must pass:

- spoken name identifies the action or content without relying on position;
- role and selected/disabled/expanded state are announced correctly;
- focus order follows the visible and task order without duplicate interactive
  descendants;
- route and modal transitions place focus in a meaningful new context;
- dismissal or Back returns focus to a sensible control;
- every required action is reachable and operable without sight;
- answer correctness and destructive consequences retain their meaning without
  color;
- authored prompt and feedback can be read in full without a focus trap.

For each row below, enter `pass` or `fail` plus a short observation. A passing
observation records at least the initial spoken context and the focus outcome;
`pass` without evidence, a blank cell, hierarchy output alone, or visual
inspection does not close the platform gate.

| Required journey point | VoiceOver result and observation | TalkBack result and observation |
| --- | --- | --- |
| 1. Home heading, Algorithms context and bottom navigation | | |
| 2. Practice Hub and `Independent Practice` card | | |
| 3. `Hash map and set` selection and session start | | |
| 4. Choice, ordering and complexity responses | | |
| 5. Submit, correctness, Reason, expanded Details and Next | | |
| 6. Pause, relaunch and Resume | | |
| 7. Summary, Progress and next action | | |
| 8. Guided session → pause → Independent Practice conflict → `Keep session` | | |

Any failed criterion blocks the gate. Record the exact screen, announcement,
expected behavior and reproduction steps, repair the canonical UI, and repeat
the complete affected platform journey.

### 1A. VoiceOver record

| Field | Entry |
| --- | --- |
| Operator | |
| Date/time and timezone | |
| Device / iOS version | |
| Build identity confirmed | yes / no |
| English locale confirmed | yes / no |
| Full required journey completed | yes / no |
| Failed or ambiguous announcements | |
| Focus-order or focus-return failures | |
| Unreachable actions or unreadable content | |
| Defect IDs / repair evidence | |
| Re-run result | pass / fail / not run |
| Final VoiceOver result | pass / fail |

### 1B. TalkBack record

| Field | Entry |
| --- | --- |
| Operator | |
| Date/time and timezone | |
| Device / Android version | |
| Build identity confirmed | yes / no |
| English locale confirmed | yes / no |
| Full required journey completed | yes / no |
| Failed or ambiguous announcements | |
| Focus-order or focus-return failures | |
| Unreachable actions or unreadable content | |
| Defect IDs / repair evidence | |
| Re-run result | pass / fail / not run |
| Final TalkBack result | pass / fail |

## 2. Timed human dry-run

Use one person who did not implement Patternly and has not seen the tested
questions. The product owner moderates using
[moderator-guide.md](moderator-guide.md), records the run in a copy of
[observation-form.md](observation-form.md), and verifies the exact sample
against [representative-content-manifest.md](representative-content-manifest.md).

Mark the record `DRY-RUN — NOT A COHORT CASE`. Do not include it in participant
counts or product claims. Use participant code only, collect no sensitive
details, and run without recording under PO-013 A.

The dry-run passes only when:

- the owner can prepare and moderate from the canonical packet without an
  undocumented instruction;
- the exact release, Independent Practice mode and ten-item order are used;
- the complete protocol fits within 60 minutes, or its stop rule produces a
  truthful incomplete state without improvisation;
- every prompt, observation field and intervention level is usable as written;
- no build, content or protocol defect creates a hard stop;
- actual timings, interventions, confusing instructions, participant
  misunderstandings and candidate defects are recorded;
- every real defect is routed to its canonical owner and the affected portion
  is repeated after repair.

Participant struggle or negative product feedback does not invalidate the
dry-run. A missing instruction, wrong build/sample, fabricated state, forced
substitution or unrecorded intervention does.

| Field | Entry |
| --- | --- |
| Dry-run code | |
| Date/time and timezone | |
| Moderator | Product owner |
| Uninvolved test participant confirmed | yes / no |
| Build identity confirmed | yes / no |
| Exact ten-item order confirmed | yes / no |
| Start-to-close duration | |
| Representative session duration | |
| Highest intervention level | |
| Protocol hard stops or ambiguities | |
| Product/content defects found | |
| Repairs and repeated sections | |
| Observation-form path | |
| Final timed dry-run result | pass / fail |

## 3. PO-013 operational inputs

The owner must enter real approved values. A blank entry, example value,
unmonitored contact, unapproved personal folder or text such as `TBD` does not
close the gate.

| Required input | Owner entry | Acceptance check |
| --- | --- | --- |
| Participant research contact | | Monitored address/channel, named owner and response path for questions or withdrawal |
| Pseudonymous-note storage | | Exact provider/workspace/folder, access limited to the product owner, approved for the stated data and retention |
| Compensation | | Amount, currency, method, payment timing, cancellation/no-show rule and confirmation that withdrawal does not remove agreed compensation |
| Applicable privacy notice | | Exact file/URL and version/effective date; matches notes-only collection, access, withdrawal and deletion periods |

Final operational confirmation:

- [ ] Scheduling contact data stays outside research notes.
- [ ] Notes use only study-generated participant codes.
- [ ] No screen, audio or video recording is requested or made for the first
      cohort.
- [ ] The privacy notice matches the deletion rules in
      [participant-screener-and-consent.md](participant-screener-and-consent.md),
      or the canonical protocol was corrected before recruitment.
- [ ] The research contact remains monitored through the withdrawal and
      deletion period.
- [ ] The confirmation message contains the approved logistics, compensation,
      contact and privacy notice.

| Field | Entry |
| --- | --- |
| Research owner | Product owner |
| Operational inputs approved by | |
| Approval date/time and timezone | |
| PO-013 result | pass / fail |

## 4. Final readiness decision

The owner updates
[current product status](../release-candidate-closure.md) only after checking
this table against the completed evidence.

| Required gate | Final result | Evidence location |
| --- | --- | --- |
| VoiceOver | |
| TalkBack | |
| Timed human dry-run | |
| PO-013 operational inputs | |
| No unresolved blocking build/content/protocol defect | |

| Decision field | Entry |
| --- | --- |
| Product ready for moderated user testing | GO / NO-GO |
| Recruitment may start | GO / NO-GO |
| Decision owner | Product owner |
| Decision date/time and timezone | |
| Evidence reviewed | |
| Remaining unsupported claims | |

If any required result is not `pass`, both decisions are `NO-GO`. Preserve the
evidence, repair the canonical source or protocol, repeat the affected gate and
then make a new explicit decision.
