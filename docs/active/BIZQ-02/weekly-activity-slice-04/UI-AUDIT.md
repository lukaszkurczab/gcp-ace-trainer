# Patternly UI audit — Progress weekly activity slice04

## Outcome

Audit status: COMPLETE for the bounded static review; UI result: source defects corrected, rendered result NOT_VERIFIED. Scope: existing Progress “This week” card only, mobile, CODE_ONLY. Baseline appcf1aca58; current own source diff. Date2026-10-02. Skill: `.agents/skills/patternly-ui-audit/SKILL.md`, source map/checklist/template applied. No full product audit or parallel backlog.

## User goal and contract

Understand how many sessions were actually completed this week on the selected track. Parent docs04 “weekly terminal activity” owns counting and calendar; docs05 “Summary and progress” requires canonical facts and prohibits decorative certainty; docs01 separates volume, evidence and performance. Current task explicitly authorizes the corrective implementation. Existing card, typography, tokens, track selector, goal action and evidence panels remain; this is a bounded truthfulness correction, not significant new brand/layout/interaction design. No historical Figma is used as an oracle or new manual gate inferred.

## Sources and rule map

| Rule | Source/check | Result |
| --- | --- | --- |
| Counts match their name | ProgressTab weekValue + three activitySummary builders; actual repository RED3≠1/0≠1 | Before FAIL; source projection correction PASS |
| Percentage has supporting facts | progressRatio uses focus accuracy or any-answer→100%, unrelated to weekly sessions | Before FAIL; removed, no loss of a valid weekly metric |
| Profile/track/time scope | Existing Activity owner, new lease fence and weekly projection; actual all9/runtime/repositories/calendar/profile cases | Source PASS; SDK/UI switching NOT_VERIFIED |
| Natural local copy/plurals | common7locale, actual i18next counts0/1/2/5/21/22 | PASS for string resolution; native wrapping NOT_VERIFIED |
| Accessibility meaning | Numeric title remains Text, max scale2, polite live region; existing actions retain roles/labels | Code props PASS; VoiceOver NOT_APPLICABLE by owner instruction |
| Learning/state/action invariants | Practice/Review/evidence/CAS/reminders/Premium/admission untouched; canonical regressions | Source PASS within touched scope |
| Brand/visual/text-size/theme behavior | Existing card/tokens retained; live current Metro HTTP500 | NOT_VERIFIED; rerun current code on sole iPhone17 |

## Evidence and coverage

| State | Surface | Variant | Evidence | Status |
| --- | --- | --- | --- | --- |
| Empty/current/old/future/abandoned/zero-answer | Mobile source/application | Actual persisted DTOs and current nine artifacts | weeklyActivityIntegration and RED logs | PASS source |
| Count pluralization/unavailable | Mobile copy/source | Seven locales, multiple plural categories | Actual translator/source checks | PASS source |
| Light/dark/contrast/larger text | Existing Progress card | All relevant render variants | No current native bundle | NOT_VERIFIED |
| VoiceOver | Mobile | Any | Explicit exclusion | NOT_APPLICABLE |

## Findings

### P1 BIZQ02-WEEK-01 — “sessions completed” displayed answers/items

Confirmed state/metric defect; high confidence. ProgressTab displayed all-time values from installed/Coding/GCP builders. A learner could interpret answering3items in one session as completing3sessions this week. Fix behavior with existing application terminal-session facts; retain all-time attempts/items in their evidence metrics. Copy is localized `{{count}} session(s) completed`; scope detail is “For the selected track.” Invalid facts render “Weekly activity is unavailable.” Actual persisted-data regression plus source consumer check establishes bounded acceptance; full native presentation remains open.

### P2 BIZQ02-WEEK-02 — weekly bar used an unrelated percentage

Confirmed metric defect; high confidence. The bar used focus quality, or100% after any evidence. Docs05 says visible metrics need sufficient supporting facts. Remove this bar and its styles, not the actual focus evidence elsewhere. The learner loses no accurate weekly progress measurement; no justified denominator existed. Existing goal action remains. No synthetic replacement percentage or new target rule is introduced.

## Conflicts and limitations

Device-local Monday follows existing Activity. Separate HomeTab answered overview still uses UTC Monday and no upper bound; it is an open bounded follow-up, not corrected by this card. Current profile fence protects Activity loaders; this is not proof of the full multi-model Home shell/native SDK transition. Current Metro cannot resolve learningEvidenceProjection; cached UI is not evidence of this slice. No runtime reset/install/deploy/VoiceOver was performed.

## Remediation and completion

Both findings are the existing canonical BIZQ-02 weekly activity slice04, not new status rows. Files: application/activityReadModels, utils/date, Activity presentation, Progress model/card, seven common locales and focused tests. Source review is complete within this scope; current native rendering, text wrapping/themes and full Home-shell switching need direct evidence before broader UI acceptance.
