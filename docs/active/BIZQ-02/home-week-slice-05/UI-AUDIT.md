# Patternly UI audit — Home weekly answered activity slice05

## Outcome

Audit status COMPLETE for bounded static review; UI result source defect corrected, actual rendered result NOT_VERIFIED. Mobile Home existing Overview weekly row only; CODE_ONLY. Source baseline app1515a319 plus current own diff;2026-10-02. Skill patternly-ui-audit, brand/source map, checklist and template applied. This is not a full product audit or new backlog.

## User goal and contract

Understand recorded answers on the selected track this local week, distinct from Progress completed sessions and package completion. Parent docs04 weekly answered activity owns scope/count/calendar/error; docs01 Surface ownership and Learning boundaries separate volume from learning; docs05 Summary and progress requires facts; docs06 Visual approval/handoff retains canonical code components for ordinary repairs. User authorizes implementation; the existing row/layout/styles/tokens/interaction remain. This is a truthful count/copy repair, no system redesign/new interaction grammar or large vertical; no Figma gate inferred.

## Sources and rule map

| Rule | Source/check | Result |
| --- | --- | --- |
| Week matches local calendar | Actual current old Home private functions+repositories RED vs shared Activity calendar; final app projection tests Monday/Warsaw/LA/DST | Before FAIL, source PASS |
| Future timestamps are not current facts | Actual oldHome future count RED; production presenter <=captured now | Source PASS |
| Current-profile activity only | Exact production Home read command AST + actual app reads/router, after-Activity A/B/A; same published lease asserted before success sinks | Source PASS, React/SDK NOT_VERIFIED |
| Numeric local copy matches meaning | Actual i18next seven locales and counts0/1/2/5/21/22 | String resolution PASS, wrapping NOT_VERIFIED |
| Visible and accessible numeric phrase agrees | HomeTab value/accessibilityLabel both use same key+count; scale2 and existing largeText row preserved | Code PASS; VoiceOver NOT_APPLICABLE by owner |
| No fake empty state on failure | Badfacts/context map to weekly unavailable; badclock Review unavailable and Last Activity unavailable, existing shell failure after profile rejection | Source PASS |
| Theme/layout/large-font rendering | Current AppEntry HTTP500, sole runtime preserved | NOT_VERIFIED |

## Evidence and coverage

| State | Variant | Evidence | Result |
| --- | --- | --- | --- |
| Current/old/future/active/ended-early/history/repeat | Actual catalog+durable repository+presenter, all9 tracks | homeWeeklyAnswersIntegration | PASS source |
| Duplicate/conflict/invalid/empty | Real application projection; corrupt storage read fails | Integration/source | PASS source |
| A/B/A and transition before publication | Full actual command body/read ports/router, captured setters only | homeShellProfileReadIntegration and RED logs | PASS source, not React render |
| Seven languages/plurals | Actual translator, numeric counts | Integration | PASS strings |
| Light/dark/contrast and standard/larger fonts | Existing row, current code | No runnable current native bundle | NOT_VERIFIED; same iPhone17 render needed |
| VoiceOver | Any | Explicit owner exclusion | NOT_APPLICABLE |

## Findings

### P2 BIZQ02-HOME-WEEK-01 — local Monday answers disappear

Confirmed state/metric defect; high confidence. UTC week began after a recorded Warsaw Monday00:10 answer. A learner could see empty weekly activity despite this week's answer. Fix count via application owner/shared local civil calendar. Preserve active-session exclusion/history, answer/session/completion distinctions and existing actions. Final actual-artifact/repository/presenter test passes.

### P2 BIZQ02-HOME-WEEK-02 — future answers counted

Confirmed state/metric defect; high confidence. Missing upper bound counted a later timestamp as activity already completed. Use one captured now; no synthetic percentage or readiness. English exact copy `{{count}} answer(s) recorded`; Polish proper plural forms. No element is removed; the user loses no valid information. Unavailable is explicit, not hidden as zero. Only the UTC helper/business count is removed.

### P1 BIZQ02-HOME-SCOPE-01 — old-profile answers accepted after async read

Confirmed source pipeline defect. Actual A/B and A/B/A tests failed after Activity had already completed, during goal load. Shared existing lease fence now prevents success publication; original generic shell error and retry action remain. No new store/account behavior. This proves source ordering, not SDK callback fidelity or full rendered account transition.

## Conflicts and limitations

No current native screen exists for this source because actual AppEntry500 cannot resolve learningEvidenceProjection. Cached screens are not evidence. Latest-session row still uses its prior latest-answer interpretation; this slice does not establish a complete terminal-session metric there. Review and other recommendations retain existing valid-input policy; broad family aggregation/performance ownership unchanged. Native themes/large text/SDK transitions require separate current-code evidence. No test VoiceOver, deploy/push/service change/install/reset/runtime restart.

## Remediation tasks and completion

Findings belong to existing BIZQ02 slice05 in the canonical queue. Files: Activity application projection, shared profile fence, HomeScreen guard, Home overview presenter/consumer, sevencommon locales and focused tests. Source/static audit complete within scope; broader UI/native acceptance remains open. No parallel status workflow.
