# Native presentation 28 — layout preflight

## Finding

The authored wrong-option diagnostic is visibly clipped at the supported large-text setting in both supplied themes. In the light and dark screenshots, the last line stops after `organization-wide attachme…`; the authored text ends `organization-wide attachment scope.` This is a confirmed visual defect for the Q12 readable-diagnostic criterion. Its layout cause is not established by the screenshots or current source inspection.

The message is rendered in `PracticeFeedbackBlock` as a React Native `Text` with `styles.detailText` and `maxFontSizeMultiplier={2}`. Ordinary Details lines use the same style and cap. The node has no `numberOfLines` or `ellipsizeMode`. The enclosing card has padding but no explicit width or overflow rule. The shared session layout uses a vertical `ScrollView`; the inspected source shows no horizontal scroller. These facts rule out an intentional message-only clamp in this component, but they do not establish the measured native width of the text, its parent, or the screen content.

The installed React Native 0.86.3 source defaults `allowFontScaling` to true and exposes `onLayout` and `onTextLayout`. The existing `maxFontSizeMultiplier={2}` is a text-size cap, not evidence that the text fits its frame. Neighboring Details text wrapping correctly does not establish that this particular text node or native ancestor has a correct width.

## Smallest useful diagnostic probe

If the source change is not self-evident, use the root-owned completed GCP review item and add temporary, development-only layout callbacks to the target diagnostic and its immediate layout ancestors. Record only geometry and layout metadata for question `gcp-ace-gcpace-n01-b03-001`, selected wrong option `D`: window width and scale, `fontScale`, `onLayout` frames for the session content, feedback card, Details container and message `Text`, and `onTextLayout` line text/width/position. Run the existing item in light and dark at the same supported capped large text size. Do not submit answers, clear data, alter text or font caps, or change the session. Remove the temporary callbacks after the read-only measurement.

Interpret the measurement before choosing a fix:

- If a parent or message frame exceeds the usable window width, trace and correct that width constraint in the existing `Screen`/`SessionShell` layout.
- If the message frame is within its parent but the native line measurement does not wrap or extends beyond that frame, isolate the React Native text-layout behavior with the same string, style and font scale before changing the component.
- If all line measurements fit but the screenshot still cuts off glyphs, inspect ancestor clipping/rendering rather than changing authored content or reducing text size.

This probe is diagnostic, not an added acceptance gate. Retest the same visual state after a correction: the complete authored sentence must be readable in both themes at the same supported size, with Details and navigation still reachable. Do not shorten the canonical message, shrink the supported font, clamp the line count, or substitute a generic message to make it fit.

## Scope and limits

This is a read-only layout preflight based on the supplied live screenshots and source inspection. No simulator measurement or native rerun was performed by this reviewer. The confirmed scope is one authored message on the shared practice feedback renderer; the report does not claim full Q12 or BIZQ-01 acceptance, VoiceOver behavior, other content variants, Premium behavior, repaired long options, or native partial scoring.

## Evidence bindings

The two screenshot hashes match the screenshot manifest. Source and package hashes below identify the files inspected for this preflight; they are not a claim that a later implementation has passed.

- Q12 briefing: `BRIEFING.md`, SHA-256 `238e0d78779b2974955ff4dda8bafe52ec10de220b924c953a92c7f5d95a8203`.
- Finding triage: `UI-FINDING-TRIAGE.md`, SHA-256 `0e75a617119189bcdc341a7271f233ca0582c0321c55d0f6817076e54a7f3536`.
- Screenshot manifest: `SCREENSHOT-MANIFEST.json`, SHA-256 `dff4bf4bcd45d4f0c2f200003d45ff7f4b39e577a99c2d24f95a5049f291aa97`.
- Light clipping screenshot: SHA-256 `9f08e2e84b27e7283b93c8e61992c00e1119f2b2d725ce73f2fdbd47e7bdc4db`.
- Dark clipping screenshot: SHA-256 `974d8fb395e3af79a3ac9b6fb73190ba490201a906e5d839f158c1af93f6706e`.
- `src/features/practice/PracticeFeedbackBlock.tsx`: SHA-256 `a0cd2b14e08d63260808727ac2fc775588f52b9e7101ce41e78cc604febbede5`.
- `src/features/practice/PracticeSessionSurface.tsx`: SHA-256 `5262a0c2a1e4be5c6d68fc707b90de60b82435f15aef08263800c05674f03a1e`.
- `src/features/coding-interview/session/SessionShell.tsx`: SHA-256 `ab1c76156c71e769a9f59d214561fb265a34db2e10cffc778046c4443a1b53f1`.
- `src/components/Screen.tsx`: SHA-256 `e980d6b61b5717d53b7f4f9dd5a8f1a465fcb892c49a100cbf51d319ed878d7d`.
- `src/components/DetailsDisclosure.tsx`: SHA-256 `421e22ae8600bfa5baece2e577069fb06baed02da532727d9883d76b42664909`.
- `src/features/practice/practiceFeedbackDelivery.test.ts`: SHA-256 `ec27741b8e0a7a2d936244daadf4a6f78cedfb1220c3e6812c31c3f7eb902059`.
- `src/theme/tokens.ts`: SHA-256 `e48475ab083ac5d387f5b7e8b98a33d0a67e1b177ee51b6ca7b24d7d17e50a0d`.
- `src/content/generated/canonical-content/google-cloud-associate-cloud-engineer.json`: SHA-256 `eea751e977cbfb468577ff4ea47702b914e1de6ad7fa06519a4e919889f0a6f9`.
- `package.json`: SHA-256 `28c6431dd731cf8fe3e2c5472d1f86c4878436b89c4b1ecc3a547e63d3f04654`.
- `package-lock.json`: SHA-256 `0ababcb26d054bd5ea3f10e800e4049c273eb367baceef3b128a63f33e15f000`.
- Installed `react-native/Libraries/Text/Text.js`: SHA-256 `7bd239228e8a92282e976ec7d838416a872c26387f1bdc1ae568597440c2b949`.
- Installed `react-native/Libraries/Text/TextProps.js`: SHA-256 `8e090602424424c0eacf61a10b58a2cbbc7a7c9e5e71697e979c559dd7562637`.
- Repository contracts: `../docs/05-design-system.md`, SHA-256 `45b5f5b259ef1ec5ee2c2ed2070cd9c50964e15c133b81ae8d6b84419da09929`; `../docs/17-training-runtime-and-interaction-spec.md`, SHA-256 `a6d2e12be67d9de9d1e67728506bf29566bf6bbfbb332c4886a5de4d24b8106a`.
