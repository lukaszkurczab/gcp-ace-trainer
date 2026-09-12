# ODK-104 — authenticated data translations

Status: **VERIFIED_CLOSED / done**, 2026-09-12. Scope is ODK-104 only.

## Result and scope

The complete authenticated EN/PL online retest passed: **102/102 recorded Maestro commands**, including **43 assertions** and **12 screenshots**. Both locales show translated Your data summaries/actions, data details, privacy list and empty state, form introduction, all seven rights and descriptions, narrative label/placeholder and submit action. Controller inspected all twelve screenshots; no raw translation keys were visible. No application implementation or locale changes were needed after ODK-091.

The source baseline is app `main` at `0445614d6688396dba3abc88f750f7d0679bbc60`. Unrelated concurrent SIMP identity migration files were preserved. This report does not close ODK-105 copy correctness, ODK-106 session presentation, provider/device gates or later queue items.

## Verification

| Check | Actual result |
| --- | --- |
| Preferences and locale parity, including flat common keys | 11/11 PASS |
| Export failure classification and settings presentation | 19/19 PASS |
| Every EN/PL data leaf resolved through actual i18next, including date/reason/seconds interpolation | 166/166 PASS |
| Authenticated online EN/PL Maestro | 102/102 recorded commands completed; 43 assertions; 12 screenshots |
| Authenticated offline export and privacy-list messages, EN/PL | 26/26 recorded commands completed; 6 assertions; 4 screenshots |

[Reproduction instructions and flows](odk104/README.md); [translation verification script](odk104-verify-data-translations.cjs). The 166-value check establishes resolution of all configured data values, including dynamic status/response/extension and error copy. It does not establish runtime execution of every branch. All five failures emitted by account privacy methods have translations; shared `appCheckUnavailable` is currently emitted only by the separate public legal path and is translated there.

Request lifecycle/status/response/extension variants and the remaining export failure branches were verified through source wiring and translation contracts, not by synthesizing requests or provider responses. No privacy request was sent. Physical-device export/share behavior and production providers remain outside this task.

## Runtime and evidence

- Simulator: `Maestro_IOS_iPhone-17_26`, iPhone 17, iOS 26.4; UDID `C3477113-C193-4C0F-9125-FEC9E5A71181`; screenshots 1206×2622, dark appearance.
- App: `com.lkurczab.patternly`, native debug build, Metro `localhost:8081`.
- Local-only test account: `odk104-local-20260912c@example.test`. Registration reached **Your account is ready**, no guest-adoption choice was present, and Continue entered Home. No simulator state was cleared.
- API: loopback `127.0.0.1:8080`, Auth emulator `19099`, Firestore emulator `18081`, project `patternly-app-sandbox`; `/health` and `/ready` passed before online capture. Temporary process used ephemeral cryptographic keys, no SMTP/production provider configuration or repository config edits.
- Final online run: [commands](../../artifacts/maestro-screen-capture/odk-e2e-104/2026-09-12-final-online/2026-09-12_103802/odk104-repeat-capture/commands.json), [screenshots](../../artifacts/maestro-screen-capture/odk-e2e-104/2026-09-12-final-online/2026-09-12_103802/odk104-repeat-capture/takeScreenshot/). The wrapper first returned from the previous EN form to Settings, then ran the saved online scenario.

## Review and capture corrections

Controller pre-change scores (fit, simplicity, risk, maintainability): 0.95 / 0.94 / 0.86 / 0.93; minimum **0.86**. Independent briefing validation by `/root/odk104_briefing`, **gpt-5.6-luna / max**, inspected only the Cel/Ustalenia/Podejście briefing without tools: 0.95 / 0.89 / 0.85 / 0.92, minimum **0.85, PASS**. Capture worker and independent QA also used **gpt-5.6-luna / max** without further delegation.

Initial flow QA requested route-aware navigation, full right descriptions, an explicit empty-list/failure distinction and reproducible static evidence. These were incorporated. Captures preserve the running session using `launchApp.stopApp: false`, allow 120 seconds for content startup, scroll to controls, use localized back labels and check the intermediate data route. ChoiceRow accessibility text combines title and description; the Close control scrolls with the sheet. Failed assertions on standalone labels and an offscreen Close were capture defects, corrected before the passing run. Launch semantics were verified against [official Maestro documentation](https://docs.maestro.dev/api-reference/commands/launchapp).

Earlier bootstrap runs failed because the configured local API was absent. Later navigation failures coincided with React Native Fast Refresh overlays. Final evidence uses the original simulator and Metro with Fast Refresh disabled for capture. A temporary Metro 8082 and an attempted extra simulator were diagnostic experiments, excluded from final evidence; both were stopped and the extra simulator deleted. A temporary project copy shared node_modules resolving back to original source, so it was not treated as isolated-source proof. No production file changes were needed.

The Home screen showed unrelated `Recommendation unavailable [LOCAL_OPERATION_FAILED]` during bootstrap. The authenticated data screens remained reachable and the complete online flow passed. This observation is not resolved or hidden by ODK-104.

## Independent final QA and evidence

`/root/odk104_flow_qa`, **gpt-5.6-luna / max**, returned **PASS** after read-only source, command-result and screenshot inspection. It confirmed both final runs, the translated copy and all seven rights. It found no material i18n gap; lifecycle/provider branches retain the explicit contract-only limitation above.

Combined result: **128/128 recorded Maestro commands completed, 49 assertions, 16 screenshots**, plus **30/30 tests and 166/166 translation values**. Recorded commands include Maestro configuration and flow navigation; they are not 128 independent test cases.

- [Evidence manifest: both runs, screenshot hashes, locale/state and source hashes](odk104/evidence/manifest.json).
- [Online command evidence](odk104/evidence/online-commands.json), [offline command evidence](odk104/evidence/offline-commands.json), [30-test TAP output](odk104/evidence/contract-tests.tap).
- [Offline runtime screenshots](../../artifacts/maestro-screen-capture/odk-e2e-104/2026-09-12-final-offline-retry/2026-09-12_104334/odk104-offline-repeat/takeScreenshot/).

The offline rerun resumed on Polish Your data, repeated the export action, then exercised both locale/list error paths. The first offline assertion had matched only the body of an iOS grouped alert; the final run matches title plus body. Both executed entrypoints are retained with the evidence; the online include path is relocated to the durable scenario copy. Screenshots include correctly translated placeholders, independently inspected visually.

## Changed files and cleanup

Added this report, the read-only translation verifier, reproduction instructions, two capture flows and their evidence. Updated only the ODK-104 observation/status and its place in the workspace queue. No application code, locale, schema or production configuration changed. Removed the task-created unsuccessful bootstrap YAML, replacing its incorrect route assumption with the observed bootstrap instructions. Unrelated SIMP migration edits are preserved.

The locally started backend and temporary Metro have been stopped; the extra experimental simulator was deleted. Pre-existing Metro/Auth/Firestore services remain. The app is left in English on the local test account; existing simulator data was not cleared. Fast Refresh was restored through the native menu (cleanup retry PASS); the original `RCT_jsLocation=localhost:8081` preference was restored and read back. `git diff --check`, all 16 screenshot hashes, seven unchanged source hashes and both completed command sets were verified. No later task was started.
