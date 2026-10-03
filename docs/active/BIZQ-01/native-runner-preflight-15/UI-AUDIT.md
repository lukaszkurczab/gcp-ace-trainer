# Patternly UI audit — current guest preservation and Premium entry

## Outcome

Audit PARTIAL; findings present. Bounded mobile LIVE_UI on existing iPhone17/iOS26.4, current app e682e95e and exact ten bundle payloads. English, System appearance observed dark; text size not independently measured. Date2026-10-03. This is not full question-runner or Premium UI acceptance.

## User goal and contract

Read the preserved accepted learning schedule after current-source cold launch and determine whether the existing profile can enter Premium testing, without editing goal/plan/reminders, logging in or buying. BIZQ01 §2/§6 requires real properly configured test profile/actual gates; existing LEGAL-VALUES retains separate release-data dependency.

## Sources and rule map

| Rule | Source | Check | Result |
|---|---|---|---|
| Current source content | runtimeCatalog imports and generated tenJSON; existing candidate lock | exact bundle payloads + integration lock check | PASS bounded identity |
| Preserve visible accepted schedule | existing accepted-plan editor/coordinator; BIZQ constraints | native Mon09:15/Wed18/Sat18, no Save/input | PASS visible values; no whole-store claim |
| Guest cannot qualify as Premium account | PremiumPurchaseScreen/account admission; BIZQ01 §2 | account-required offer visible | PASS this entry; no all-mode claim |
| Actual public Premium scope | LEGAL-VALUES/PO-INPUT.md Premium row | observed scope placeholder | Existing unresolved release input; no values invented |
| Q12 themes/large text and actual question Details | BIZQ01 §6 | no question entered | NOT_VERIFIED |

## Evidence and coverage

screens/ and screenshot-manifest.json: current Home, Progress existing entry, schedule, Guest Settings, account-required Premium. All same device, English/dark observed; font category unknown. COLD.log and PRESERVE-GREEN.log establish actual commands. Initial two navigation failures retained; warning dismissal based on observed screenshot. Screenshots alone do not establish accessibility tree, scoring, remote SDK or persistence interruptions.

## Findings

### [P2] UI15-01 — Premium scope still shows a release placeholder

Confirmed interface-language/state observation at Guest Premium entry: `[TO BE COMPLETED: premiumServiceScope]`, screens/native15-real-guest-gate.png. PremiumPurchaseScreen.tsx obtains terms.premiumServiceScope[legalLocale]; existing LEGAL-VALUES/PO-INPUT.md explicitly awaits PO-approved scope/SKU and says current checkout is disabled. Confidence high for visible text; release/commercial impact, not a new BIZQ01 local-test gate. The scope cannot be completed by guessing a sales promise. Preserve actual account gate, sale model, legal-value ownership and disabled checkout. Recommendation: use existing LEGAL-VALUES task to fill approved scope in canonical legal config, then check actual offer and legal consumers. No copy proposed without those facts; no new competing remediation task.

## Conflicts and limitations

Current profile is Guest; no authorized Premium profile confirmed. Settings testing toggle/backend simulation do not establish remote SDK acceptance. New N02/N04 seed reachability independently belongs to ARCH02; Premium alone does not fix it. No current question correct/wrong/partial/Details, theme switching/large text or VO test. Developer warning overlay covered tabs; closing observed overlay was diagnostic navigation, no production warning suppression.

## Remediation tasks

Reuse existing LEGAL-VALUES dependency for UI15-01, BIZQ01 existing native runner requirement for profile/correct-wrong-partial/Details, and ARCH02 existing reachability ownership. This report creates no new product requirement, gate, queue or implementation owner.

## Completion summary

Bounded current-source guest read-only evidence is complete; full UI verification remains incomplete. Finding does not invalidate the observed account-required gate or visible schedule values. Independent actual QA is recorded separately.
