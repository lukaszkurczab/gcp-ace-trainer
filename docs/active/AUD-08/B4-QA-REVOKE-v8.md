# AUD-08-B4 actual HTTP revoke — v8 independent QA

**PASS WITH ISSUES**, bounded HTTP revoke only; wholeB4 remainsopen. Independent reviewer gpt-6-luna high (`b4_replacement_qa`), qa-gate, read-only; report transcribed by root. Reviewer did not edit source or rerun services/emulators.

## Verification

46/46consumer and27/27producer pins matched, independently rechecked after own typecheck exit0. Onlyconsumer integrationtest hash differs fromv7c; producerpins unchanged. Rootrecorded required `HTTP-SDK-SOURCE-v8.log`:2PASS/0FAIL/0SKIP, exit0 and isolated19119/18119shutdown. LogSHA256 `bf6625aa085e3ce3cbba3ccfae1a494c08d55d9db83cef7e6c15c6344ac5359e`. AppHEAD8d12b0ccabf7b2c28659c78c10a7915abafb2672/backendHEAD15e49d04dcf510cb7081b356a7182343d9d170ab.

## Criteria

ActualHTTPissue→savedACK/publicconsume, actualSDKcustomsignin exactgen2, persisted resultavailable/op/user/slot checks PASS. TypedPatternlyApiClientError(server_error,409,session_revocation_operation_conflict) while resultownsslot; call-through canonicalFirebaseAdminadapter counterzero, no revokeoperation, samegen/result/slot PASS. ExactconsumeACK acknowledged/resultgone/slotclear/gen2 PASS. Fresh explicitrevoke HTTP200/persistedrevoked/oneactualAdmincall/slotclear/gen2 unchanged PASS; actualSDKreplacementtoken exactsameUID/gen2 PASS.

Fixturecleanup is uniquely scoped to owneduser/AuthUID/operationIDs/codehashes/mappings/securityset; bootstrapfactory/store signatures typed, no clock/limits/config changed. Recordedgate exercises testorder and ratebudget. No material scoped defect; sourcefreeze can be released.

## Limits

LocalHTTP/Admin/Firestore/FirebaseSDK with explicitAppCheckfixture. This case does not exercise mountedReactprovider/nativepersistence/productionprovider, wholeB4, deletion/concurrency or comprehensive logredaction. Required gate was rootrun, not independentlyrerun.

P3 test stability: v8 revoke case lacks its own rate-budget preflight for four recovery HTTP calls. All tests share the requester-IP bucket; current requiredrun passes, but laterrequestgrowth/configchanges may causeorder-sensitive ratefailure. This does not invalidate recordedv8. A canonical test-only preflight is being assessed for demonstratedreuse across revoke/deletion/concurrency, without changinglimits or clearingbuckets.
