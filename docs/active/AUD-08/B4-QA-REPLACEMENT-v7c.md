# AUD-08-B4 replacement v7c — independent scoped QA

**PASS WITH ISSUES**, scoped replacement only; not whole B3/B4 acceptance. Reviewer: gpt-6-luna high (`b4_replacement_qa`), qa-gate. Root transcribed the independent reviewer findings; reviewer made no source/report edits and did not run emulators, services or devices.

## Verification

All46 consumer pins in `CONSUMER-SOURCE-PINS-v7c.json` and27 producer pins in `CURRENT-PRODUCER-PINS.json` matched. AppHEAD8d12b0ccabf7b2c28659c78c10a7915abafb2672/backendHEAD15e49d04dcf510cb7081b356a7182343d9d170ab matched. Recorded root required `HTTP-SDK-SOURCE-v7c.log`:1PASS/0FAIL/0SKIP, exit0, isolatedAuth19119/Firestore18119 clean shutdown. LogSHA256 `7c8bb8ac6193b2eb8764cd6299f09fce6b96dd07fe78de43f718a01ec1d5982b`. Reviewer own typecheck exit0 and diffcheck in both repositories PASS; source/log/pin inspection, no emulator rerun.

## Criteria

- RealSDK password reauth checks newer auth_time and absent old claim; canonicalexchange/customtoken restores exactgen3; exactlyone actualexchange asserted. PASS.
- Coordinator awaits durable replacement save beforePOST; transport checks newID/priorID backup; lostresponse vault retains priorcodes. PASS.
- Different codesetgeneration with ten codes, authorizationgeneration remains3. PASS.
- Oldcode indexes absent, newindexes carry replacementgeneration before and afterACK. PASS.
- ActualHTTPPOST response lost only after committed operation/result checks; codesnull/pending/exactlyonePOST. PASS.
- Reconstructed coordinator uses retainedsameID statusGET without anotherPOST. PASS within same-process memoryvault scope.
- Confirmed replacement result persisted before priorbackup disappears from durable record. PASS.
- SavedACK leaves acknowledged status, deletes encryptedresult, preserves newindexes. PASS.

## Limits

Memoryvault, AppCheck and transportloss are explicitfixtures; reconstruction is same-process, Reactprovider/nativeSecureStore/processrestart and productionproviders are outside this scoped acceptance. Diagnostic v7 establishesHTTP401/recent_reauthentication_required; exactfailedtoken auth_time relation was not retained and remains inference. Bounded real-time wait does not change clock/securityguard/limits, and asserts actualSDKauth_time>barrier. Existing accountpolicy/deletion/revoke cases remain open. Reviewer found no material defect blocking release of v7c sourcefreeze.
