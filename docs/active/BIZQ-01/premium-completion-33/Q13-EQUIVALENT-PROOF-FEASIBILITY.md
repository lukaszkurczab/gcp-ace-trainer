# Q13 equivalent proof feasibility

Date: 2026-10-07. Read-only source and prior-receipt assessment. No build, install, simulator action, app/storage inspection, or source/config change was performed.

**Superseding design review:** a test-only fresh-nonce JS entry receipt plus an exact `resumeActiveSession` failure wrapper can close the OTA-selection and generic-UI gaps described below without native getters or product configuration changes. See [Q13 test-build attestation design review](Q13-TEST-ATTESTATION-DESIGN-QA.md). That design remains gated on a real, bounded `Paths.cache` capability probe; no runtime or Q13 acceptance evidence exists yet.

## Finding

There is a proportionate behavioral candidate that avoids LLDB: start an ordinary Premium OOD session from the accepted v23 app, leave it active before answering, then install the accepted v24 app over the same `com.lkurczab.patternly` installation and observe startup. The v23 UI can establish that the session actually exposed its old pinned OOD item; the v24 app bundle can be bound to the accepted v24 canonical catalog hash. A v24 resume must resolve the session's exact v23 `(trackId, contentVersion, artifactSha256)` reference. The resolver has no latest-version substitution, so a successful exact resume or an unavailable-content result would falsify the expected mismatch behavior.

This candidate does not yet establish an unconditional Q13 pass. Smoke mode is needed for the authorized local Premium fixture/override, but its app config leaves Expo Updates enabled. The app's runtime version is derived from the unchanged app version, so v23 and v24 builds are compatible with the same Expo update runtime. No app-level OTA check/fetch/reload call exists, but that does not rule out an already cached compatible update or the SDK's automatic launch/check behavior. The test is therefore interpretable only if the executed v24 content is independently established; an embedded bundle hash alone proves what was packaged, not what Expo Updates selected at launch.

The behavioral failure is also not uniquely observable in the normal Release UI. `bootstrapApplication` wraps a direct exact-session resume failure as a generic blocking result. Its stage observer is installed only under `__DEV__`, while Debug builds skip embedded JS bundling and need Metro. The distinct “active session needs attention” screen is for a previously recorded unavailable-active-session record, not the direct v23 pin mismatch. Thus a generic startup block does not independently prove that the exact resolver caused it.

## Alternatives reviewed

| Candidate | Evidence it supplies | Material gap | Assessment |
| --- | --- | --- | --- |
| Same-app embedded v23→v24 install plus old-session behavior | Old v23 item shown in the ordinary UI; exact session pin; installed app identity; embedded bundle/catalog hashes; real app-container-preserving update; v24 startup outcome | Cached OTA can select different JS; Release blocking UI does not identify the resume stage | Best bounded behavioral candidate, conditional only |
| Read `expo-updates` JS `isEmbeddedLaunch` / `updateId` | Could identify the SDK-selected update in a Release process | The module constants are populated through native constants; the reviewed native path can materialize/read the embedded manifest. This conflicts with the explicit no-`getConstants`/manifest inspection boundary and still does not bind the selected update to the expected canonical catalog | Excluded |
| Clear Expo Updates cache or disable updates for this run | Could remove selection ambiguity | Cache cleanup mutates app data; changing the profile/config alters the admitted runtime and may remove the local Premium test path | Excluded under the task constraints |
| Retry Swift/Objective-C LLDB access | Could expose SDK launch IDs if selectors/symbols are callable | Both guarded routes failed before getter access; repeating method discovery has no new evidence and adds attach risk | Stop this route |

The prior Swift and Objective-C receipts both confirm safe detach/resume and no getter read. They establish method failure only. They do not justify adding instrumentation or making the preferred native getter a new acceptance criterion.

## Candidate procedure if the execution-binding gap is resolved

1. Build the exact admitted v23 source and an Xcode Release configuration with its JS packaged into the `.app`; do not use a Metro-served development session. Record source SHA, generated OOD version/hash, exported JS hash, embedded manifest/catalog identity, Xcode configuration, runtime mode, and bundle identifier. Do not include environment values or credentials.
2. Verify the installed v23 app identity and bundled artifact from the existing iPhone 17 app container. In the ordinary UI, use the already authorized synthetic local Premium path to start a minimal OOD session, expose its first item, leave it unanswered, and record session ID, active status, current occurrence/item, and exact v23 content pin. Do not seed or edit profile storage.
3. Install the accepted v24 Release `.app` over the same app identity without uninstalling or clearing app data. Verify the installed bundle identifier and the embedded v24 app/catalog hashes, and confirm Metro is not serving the process.
4. Observe the normal startup/resume result. A ready screen with the active session and same unanswered occurrence would show exact old content remains available; it is not a mismatch pass. The unavailable-active-session gate is also not the direct mismatch result. A blocking screen alone is inconclusive unless the direct resume stage can be distinguished without development-only diagnostics. Never answer, replace, abandon, or migrate the old session to obtain a desired result.
5. Preserve the original Guest baseline categories and verify the expected own-account session cleanup and app restoration only after the outcome is understood. Keep screenshots and raw device evidence private.

## Exact additional fact needed

For Q13 acceptance under the current constraints, establish both facts without reading Expo module constants or app storage:

- the v24 JavaScript selected at launch is the JS embedded in the accepted v24 `.app`, despite Expo Updates being enabled in smoke mode; and
- the observed v24 block occurred during exact active-session resolution, rather than another bootstrap stage.

Repository source, bundle hashes, installed native app identity, no-Metro execution, and normal UI behavior narrow these uncertainties but do not resolve them by themselves. Do not claim Q13 runtime acceptance from this feasibility note. No new product/config requirement is proposed.

## Design scores

For the conditional same-app behavioral candidate: objective/architecture fit **0.86**, simplicity **0.91**, risk **0.72**, maintainability **0.90**; minimum **0.72**. The risk score is below the 0.8 threshold because OTA selection and generic Release bootstrap failure are not independently distinguished. The method is useful as a bounded experiment only if its outcome is reported as inconclusive when either gap remains.

## Repository evidence

- `app.config.js:169-172, 220, 240` — release runtime disables Expo Updates; other modes set the update URL without disabling updates; app bundle identifier is stable.
- `src/content/canonical/runtimeCatalog.ts` and `src/content/generated/canonical-content/content-lock.json` — canonical content is bundled and pinned; generated lock carries the admitted current artifact identity.
- `src/application/trainingLifecycle/TrainingLifecycleUseCases.ts:563-581` — resume resolves the exact session artifact pin and checks returned identity; no latest-content fallback.
- `src/application/bootstrap/applicationBootstrap.ts:45-117` — bootstrap resolves the active session after repository/content preparation and returns a generic blocking result on thrown failure.
- `src/content/application/ContentPreparationGate.tsx:137-143, 189-220` — unavailable-active-session UI is a separate explicit state; ordinary blocking UI displays the generic failure.
- `src/content/application/ContentPreparationGate.tsx:102-106` and `src/application/bootstrap/applicationBootstrap.ts:113-117` — diagnostic observer is only passed for `__DEV__`.
- `ios/Patternly.xcodeproj/project.pbxproj:227` — Xcode Debug build skips JS bundling; Release is the embedded-JS candidate.
- `node_modules/expo-updates/src/Updates.ts:35-37, 98-100` — the JS `updateId` and `isEmbeddedLaunch` exports are populated from native module constants.
- `docs/active/BIZQ-01/premium-completion-33/Q13-NATIVE-PROVENANCE-DESIGN-QA.md` and the two Q13 capability receipts — SDK source-based getter method and its safe failures; no runtime launch identity obtained.
- `docs/active/BIZQ-01/native-partial-29/Q13-ACTUAL-UPDATE-PREFLIGHT.md` — exact accepted v23/v24 pair, same-app install path, and active-session objective.
