# Patternly — complete launch surface inventory

> **Historical reconciliation input:** this dated route inventory describes a
> previous launch contract. Directive 2 must reconcile its verified repository
> facts with the new owner decisions. It is not current product, route, status,
> or execution authority.

Status date: 2026-07-31
Application evidence commit: `4a2c2ab`
Inventory status: `historical input (completed under the previous contract)`
Product status at the evidence date: `PRODUCT COMPLETION NO-GO`

## Purpose and authority

This document closes the one-time discovery inventory requested before public
launch. It covers every route registered by the current application, embedded
surfaces and operational states, missing launch surfaces, account and store
registration, and distribution signing.

This was the discovery inventory for the previous
[`launch-completion-plan.md`](launch-completion-plan.md). Its route observations
remain evidence; its product conclusions and sequencing do not.

The category benchmark and gaps discovered outside the current route graph are
recorded in
[`competitive-product-gap-audit.md`](competitive-product-gap-audit.md).

The owner has made two launch-scope decisions:

1. public launch requires user registration, sign-in and the related account
   lifecycle;
2. store application registration and production signing are explicit launch
   work, not an implied final step.

The first decision supersedes the launch assumption in
[`ADR-003-no-auth-in-mvp.md`](adr/ADR-003-no-auth-in-mvp.md). The current source
still has no account implementation. Completed Task 1 defines the
vendor-neutral account purpose, identity, remote-data boundary and local-data
adoption rules and passed independent QA; provider selection and
authentication screens must implement that contract.

## Evidence boundary

All 21 registered routes were inspected in current source. The current visual
evidence set covers eight registered routes plus Home tab states on iOS,
regular phone, light appearance. A route marked `partial` below has a reachable
implementation but still needs functional or visual completion. A missing
current screenshot is a verification requirement inside its implementation
task, not a reason to schedule another broad audit.

Fresh visual evidence:

- [`full-launch-surface-audit/2026-07-31-current`](../artifacts/maestro-screen-capture/full-launch-surface-audit/2026-07-31-current/)

## Registered route inventory

| # | Route | Current source surface | Status | Required launch closure |
| ---: | --- | --- | --- | --- |
| 1 | `Home` | `HomeScreen` | `partial` | Replace blank loading frame; reconcile first-run account/track entry; tighten Home, Progress and Settings hierarchy; verify both families, empty/populated history and recommendation failure. |
| 2 | `AppearanceSettings` | `AppearanceSettingsScreen` | `partial` | Move into the canonical shell and verify system/light/dark across the supported device matrix. |
| 3 | `YourData` | `YourDataScreen` | `blocking` | Replace the current “no account or recovery” contract with truthful local/remote data, export/adoption, account deletion and recovery semantics. |
| 4 | `LegalInformation` | `LegalInformationScreen` | `blocking` | Connect public privacy/terms destinations and account-data disclosures; preserve only claims proven by the shipped binary. |
| 5 | `LanguageSettings` | removed from the launch route graph | `resolved` | The launch product is English-only. The route and Settings entry were removed until a real second language is implemented. |
| 6 | `NotificationSettings` | `NotificationSettingsScreen` | `partial` | Complete checking, undetermined, denied, granted, invalid-time, save, disable and unexpected-error presentation in the canonical shell. |
| 7 | `SelectTrack` | `SelectTrackScreen` | `partial` | Complete onboarding/returning variants, active/unstarted/archived track states and first-viewport density; connect it to the decided auth entry. |
| 8 | `PracticeHub` | `PracticeHubScreen` | `partial` | Reduce oversized repeated cards; verify both families, enabled/unavailable modes, no-track recovery and every mode destination. |
| 9 | `AlgorithmsScopeSelection` | `AlgorithmsScopeSelectionScreen` | `partial` | Complete loading, ready and unavailable states; verify scope context and back path. |
| 10 | `TopicRoadmap` | `TopicRoadmapScreen` | `partial` | Verify both family projections, current/selected/locked rows, empty/no-track recovery, long titles and route handoff. |
| 11 | `Exam` | `ExamScreen` | `partial` | Apply the canonical shell; complete preparing, unavailable, missing deadline, save/navigation failure, navigator, flagging, timeout and finish-confirmation states. |
| 12 | `ExamReview` | `ExamReviewScreen` | `blocking` | Replace the sparse generic empty/populated layout; preserve question, response, correct answer, reason and next action hierarchy. |
| 13 | `Result` | `ResultScreen` | `blocking` | Replace the thin generic result card; make completion kind, saved outcome, unanswered items, review action and next step explicit. |
| 14 | `AnswerReview` | `AnswerReviewScreen` | `partial` | Complete loading/no-attempt, filtered-empty, populated, update-in-progress and review-error states; verify long explanations. |
| 15 | `PracticeSetup` | `PracticeSetupScreen` | `blocking` | Fix the confirmed clipped title; complete both-family configurations, validation, preparation errors, keyboard and small-screen reflow. |
| 16 | `PracticeSession` | `PracticeSessionScreen` | `blocking` | Keep the Algorithms lifecycle canonical; replace the weaker Certification ordinary-practice lifecycle; verify all response, feedback, exit, pause/resume, conflict, persistence and recovery states. |
| 17 | `AlgorithmsPracticeSummary` | `AlgorithmsPracticeSummaryScreen` | `partial` | Redesign loading, unavailable, completed and ended-early outcomes; remove excessive empty space and clarify saved result/next action. |
| 18 | `AlgorithmsInterviewSimulation` | `AlgorithmsInterviewSimulationScreen` | `partial` | Verify editable, saving, save failure, stale revision, navigation recovery, finalization, timer/draft/version/corrupt recovery, leave, abandon and finish confirmation states. |
| 19 | `AlgorithmsInterviewSimulationSummary` | `AlgorithmsInterviewSimulationResultScreen` | `partial` | Complete verified-completed and verification-failed presentation, including saved outcome and next action. |
| 20 | `AlgorithmsInterviewSimulationReview` | `AlgorithmsInterviewSimulationResultScreen` review variant | `partial` | Verify answer-level review, long content and unavailable result handling in the canonical review hierarchy. |
| 21 | `MistakesReview` | `MistakesReviewScreen` | `partial` | Complete loading, no-track, empty, filtered-empty, populated and unavailable rows; verify both families and return-to-practice actions. |

No registered route is currently proven obsolete. Deletion remains preferable
to retaining a route with no real launch use case, especially
`LanguageSettings` if English remains the only supported locale.

## Embedded and operational surface inventory

These states are not separate navigator routes, but they are part of the launch
surface and must be accepted with their owning task.

| Owning area | Required surfaces and states | Status |
| --- | --- | --- |
| Home shell | Home, Progress and Settings tabs; loading; no active track; returning user; recommendation unavailable | `partial` |
| Account entry | unauthenticated entry, optional/required account decision, local-user-to-account transition | `blocking` |
| Track selection | onboarding and returning variants; active, available, unstarted and archived tracks | `partial` |
| Progress | Algorithms/Certification; empty and populated evidence; recommendation unavailable | `partial` |
| Settings | root list, account group, appearance, language decision, notifications, data, legal, support and app identity | `blocking` |
| Notifications | permission checking, undetermined, denied, granted, device settings dialog, reminder sheet, invalid time, save/disable failure | `partial` |
| Practice setup | family/mode configuration, missing scope/competency validation, keyboard, preparation failure | `blocking` |
| Algorithms practice | preparing, question types, unanswered, submit failure, feedback, details, advance failure, leave, pause, abandon, resume and active-session conflict | `partial` |
| Certification practice | preparing, question, unanswered, feedback, timer, leave, pause/resume, conflict, persistence failure and truthful terminal summary | `blocking` |
| Certification exam | preparing, question, navigator, flag, save/navigation failure, timeout, finish confirmation, finalization failure | `partial` |
| Algorithms simulation | editable through verified result, plus all durable operation and recovery states enumerated in route 18 | `partial` |
| Outcomes and review | completed, ended early, empty, populated, verification failed, filtered empty, long explanation | `blocking` |
| Destructive actions | local-data reset, account sign-out and account/data deletion confirmations, progress, success and failure | `blocking` |
| Platform shell | light/dark/system, iOS/Android, small phone, keyboard, safe area, native prompts and tablet decision | `blocking` |

## Missing product screens and surfaces

These are real launch capabilities, not placeholders. Their final route names
and grouping are set in the account/data contract and visual-shell tasks.

| Missing surface | Status | Required use case |
| --- | --- | --- |
| Account entry / welcome | `blocking` | Explain account requirement and the relationship to first track selection without duplicating onboarding. |
| Register | `blocking` | Create an account with complete validation, duplicate-identity, network and rate-limit failure handling. |
| Verify identity/email | `planned` | Explain pending verification, resend safely, change identity and handle expired/used links if the chosen identity model requires verification. |
| Sign in | `blocking` | Authenticate, expose invalid-credential and unavailable-service states, and resolve pre-existing local data explicitly. |
| Forgot password | `planned` | Request recovery without leaking account existence. |
| Reset password / deep link result | `planned` | Handle valid, expired, already-used and malformed recovery links. |
| Session expired / reauthentication | `planned` | Preserve safe local state and request authentication without fake success or silent data loss. |
| Account / profile | `blocking` | Show identity, data/sync status, security actions, sign-out and deletion access. |
| Sign out confirmation/result | `planned` | State what remains on the device and what becomes unavailable before confirming. |
| Delete account and associated data | `blocking` | In-app request, reauthentication where necessary, explicit scope, progress, success and failure; public web request path for Google Play. |
| Local-data adoption / merge decision | `blocking` | Decide whether anonymous local progress is adopted, replaced or kept local when registering/signing in; never merge silently. |
| Sync/backup state and conflict resolution | `blocking` | Required if accounts own remote learning data; show offline, pending, conflict, failure and retry states explicitly. |
| Study Activity / session history | `blocking` | Chronological durable sessions with mode/configuration, completion kind and links back to the exact result/review; empty, filtered and unavailable states. |
| Content information / trust | `blocking` | Active content release, honest reviewed/published date, certification source basis/checked date, independent-product disclaimer and report path. |
| Report a content problem | `blocking` | Available from feedback/details and answer review; carries stable item/release context and exposes queued, retrying, failed and accepted states. |
| Learning goal / cadence | `planned` | Add only if goal type, optional target date or weekly cadence changes recommendations/reminders; no streak or fake readiness. |
| Privacy policy | `blocking` | Public URL plus in-app access matching actual account, learning, diagnostic and third-party data behaviour. |
| Terms / account consent | `planned` | Present only the agreements required by the chosen account model, with version and acceptance semantics. |
| Support/contact | `blocking` | Reachable in-app and public support destination with actionable failure/contact path. |
| App identity/version | `planned` | Expose product version/build and support/legal entry, either as a focused surface or canonical Settings section. |

If registration is required only to satisfy an assumed convention and has no
defined user value, it should not be implemented. The owner has required it
for launch, so Task 1 must now define its real purpose and data ownership
before selecting a provider or drawing screens.

Account creation also expands store obligations. Apple requires apps that
support account creation to offer account deletion in the app, and Google Play
requires both an in-app deletion path and a public web deletion-request
resource:

- [Apple — Offering account deletion in your app](https://developer.apple.com/support/offering-account-deletion-in-your-app)
- [Google Play — Account deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111)

## Store registration, signing and distribution inventory

| Work | Status | Completion evidence |
| --- | --- | --- |
| Apple Developer membership, agreements and roles | `unknown / needs evidence` | verified account access, current agreements and required role without exposing private account data |
| App Store Connect app registration | `unknown / needs evidence` | Patternly app record, reserved bundle ID, SKU, primary language and access model |
| iOS certificates, identifier and provisioning | `unknown / needs evidence` | distribution identity and profile resolve for the canonical bundle ID |
| Signed iOS archive | `unknown / needs evidence` | validated archive uploaded to App Store Connect and clean TestFlight install |
| Google Play developer account and verification | `unknown / needs evidence` | verified owner/account type, agreements and required access |
| Play Console app registration | `unknown / needs evidence` | Patternly app record, canonical package name, language, contact and declarations |
| Android upload key | `blocking` | production upload key stored outside Git; release build never uses debug signing |
| Play App Signing | `planned` | enrolment accepted and app-signing/upload certificates recorded safely |
| Signed Android App Bundle | `blocking` | signed `.aab`, signature verified, uploaded and install tested from Play-delivered artifact |
| Privacy/data declarations | `blocking` | App Privacy and Data safety answers match the account-enabled signed binaries |
| Store metadata and screenshots | `planned` | validated listings and current release-candidate screenshots for supported device classes |
| Signed-artifact release gate | `planned` | clean-install, cold-start, auth/account, offline, learning, recovery, deletion and legal/support smoke on both store candidates |

Apple requires an App Store Connect app record before a build can be uploaded.
Google Play similarly requires a Play Console app record and a signed bundle;
Play App Signing separates the developer-held upload key from the Play-held app
signing key:

- [Apple — Add a new app](https://developer.apple.com/help/app-store-connect/create-an-app-record/add-a-new-app/)
- [Google Play — Create and set up your app](https://support.google.com/googleplay/android-developer/answer/9859152)
- [Google Play — Use Play App Signing](https://support.google.com/googleplay/android-developer/answer/9842756)

## Closed discovery findings

The inventory confirms the intermediate work that the earlier release plan
omitted:

1. define the account, identity, data-ownership and recovery contract;
2. lock one visual shell and reusable state system;
3. build the missing auth/account, privacy, support and account-deletion
   surfaces;
4. repair entry, discovery and setup, including the confirmed clipped Custom
   Practice title;
5. complete both learning lifecycles and every operational state;
6. redesign outcomes, review and Progress and add durable Study Activity;
7. expose content release/source trust and add per-item problem reporting;
8. finish Settings, theme, responsive and two-platform behaviour;
9. restore future content-release reproducibility;
10. register the applications in App Store Connect and Play Console;
11. configure signing separately for Android and iOS;
12. complete store declarations/metadata and verify the actual signed
    candidates.

Detailed, independently verifiable task packets and their order are maintained
in [`launch-completion-plan.md`](launch-completion-plan.md).

## Evidence limitations and no-repeat rule

- Source reachability and state branches were inspected for all current routes.
- Fresh visual evidence is not complete for every route, platform, theme or
  operational state; those captures are required evidence in the relevant
  implementation task.
- App Store Connect, Apple Developer and Play Console account state was not
  inspected and remains `unknown / needs evidence`.
- No account backend, email delivery, universal/deep-link path, remote-data
  store or deletion service exists in current source.
- No chronological Study Activity route, user-facing content release/source
  surface or per-item content reporting path exists in current source.
- No signed store artifact was produced in this documentation-only work.
- A new broad audit is required only if routes or launch scope change.
  Otherwise each implementation task performs bounded before/after
  verification for its assigned surfaces and updates this inventory in the
  same change.
