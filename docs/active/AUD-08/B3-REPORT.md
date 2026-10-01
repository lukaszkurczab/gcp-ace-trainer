# AUD-08-B3 — durable mobile consumer

Status: **RESEARCH ONLY / NOT ACCEPTED**. GPT-6 Luna high readonly completion map; bez testów lub urządzenia. B2 producer jest zamrożony w originalbackend workingtree i nadal nieodebrany/niepush; aktualny HEAD e3a771b sam nie zawiera A2. Readonly refresh High zakończony 2026-10-01, bez edycji/testów/runtime.

## Zweryfikowane wejścia

AccountSessionProvider issue używa runReauthenticatedMutation, zwraca codes tylko w pamięci. Consume używa starego adaptera, signInWithCustomToken i generic finalizeCurrent. PatternlyApiClientAdapter nie przekazuje operationId i oczekuje legacy customToken DTO. AccountSessionExchange przy brakującym claimie może wykonać ordinary session exchange — recovery musi fail closed zamiast tego fallbacku. Adopcja ma lokalny checkbox saved i gubi codes po background; settings security gubi codes po background/focusloss i nie ma saved-ACK checkboxa. Firebase SecureStore persistence przechowuje refresh token; obecny AES MMKV jest profile-scoped i niedostępny przy zamkniętym profilu, więc nie nadaje się na signed-out recovery proof.

## Najmniejszy coherent delta

Jeden root-scoped SecureStore vault operacji i jeden coordinator dla consume/issue. Persist operationId i consume proof przed siecią; expected firebaseUid/generation przedSDK; custom token nigdy persistowany. Resultcodes persist przed wyświetleniem; savedintent przed ACK; proof/codes clear dopiero po potwierdzonym ACK. Coldstartup pendingop gate przedprofilepreparation: restored same UID/generation → ACK bezsignin; mismatch → explicituserchoice, zeroACK/profileprep. Zachować ordinarysignin exchange tylko w zwykłym flow; recovery requiredgeneration blocks missing/malformed/mismatch.

Scope: adapter strict DTOs/newpaths, provider/coordinator/session helper, vaultboundary, sharedsaved/ACK deliveryUI w obu accountentry/security surfaces. Nie blokować endpointnames zanim producerOpenAPI frozen. B3 requires correctcheckedout backendsha and realSDK/nativeacceptance, nie same greenunit tests.

## Wymagana weryfikacja

StrictDTO, persist-before-request/exposure, stableID/retry, lostresponse/status, ACKloss, cleanupafterACKonly, sameUIDcoldresume withoutsignin, wrongUID/gen noACK/no profileprep, ordinarysignin fallbackpreserved, savedcheckboxACKbothscreens. Existing iPhone17/Maestro for runtime po sourceQA. SMTProutePOpending pozaA2research.

Consistency.96/simplicity.83/risk.84/maintainability.86 minimum.83; rootvault uzasadniony signed-out i zmianą profile scope. To ocena podejścia research, nie no-toolsapproval implementacji i nie gotowy runtime.

## Aktualny contract refresh (2026-10-01)

Source app main1fd0c4d91da90687816c29760a96d9e05f976ba8; originalbackend maine3a771b9c2a255be5aa1fdaa9cafca6b015e1704 +pendingA2dirty27files. Osiem hashy producer source: `evidence/B3/CURRENT-PRODUCER-PINS.json`. Nie używać isolatedOPS checkout jako producenta A2. Model `gpt-6-luna`, high; readonly, brak testów/services/devices.

| Obszar | Stan | Dowód / brakująca zmiana |
| --- | --- | --- |
| Producer DTO/routes | PARTIAL / nieodebrany | account-lifecycle/contracts.ts oraz api/app.ts1212–1293 w dirtyproducer; istnieją strictoperations, brak publikacji/końcowegoB2odbioru. |
| Mobileadapter | LEGACY | PatternlyApiClientAdapter.ts467–468/688–689: issue{} i consume{code}, legacycustomTokenDTO. Zastąpić strictA2, bezcompatibilityfallback. |
| Issue/results/savedACK | PARTIAL | Provider2142–2160 codesmemoryonly; AccountEntry918–920/1089–1101 localcheckbox; Security60–83/182–188 clearonblur/background, bezsavedACK. |
| Consume trwałość | MISSING | Provider2162–2168 noID/proofpersist→SDKsignin. |
| Recoverygeneration | PARTIAL | firebaseAuthClient163–179/303–307 ma forcedrefresh/claimparser; accountSessionExchange20–43 ordinaryexchangefallback wymaga recovery-specific failclosed path. Ordinarysignin zachować. |
| Startupgate | MISSING | Provider918–932 authobserver zaczyna profileprep; RootNavigator159–163/321–325 guardekranu byłby za późny. |
| Native/SDKacceptance | UNVERIFIED | Brak SecureStorecoldresume/mismatch/profilegate/savedACK runtime. Unitmocks nie dowodzą SDK UID/claim. |

Sixrequests: issue POST `/v1/account/recovery-codes` body{operationId}; issueStatus GET `/v1/account/recovery-codes/issue/status?operationId=...`; savedACK POST `/v1/account/recovery-codes/issue/saved-ack` body{operationId}; consume POST `/v1/public/recovery-codes/consume` body{operationId,code}; consumeStatus POST `/v1/public/recovery-codes/consume/status` proof wyłączniebody; consumeACK POST `/v1/account/recovery-codes/consume/ack` body{operationId}. Cztery brakująceinventorycalls to oba statusy i oba ACK. Consume/consumeStatus AppCheck bezbearer; issue/status/ACK bearer+generation; issue zachowuje original300s reauthwindow.

Resultissue: operationId/status/generationId/authorizationGeneration/codes. Resultconsume: operationId/status/firebaseUid/authorizationGeneration/customToken. Porównywać FirebaseUID zSDK, niebackendUUID; force-refresh generation dokładnie. Statusy: in_progress/result_available/acknowledged/delivery_unconfirmed/superseded/expired_or_invalid/provider_retryable. delivery_unconfirmed nie oznacza nieważnychkodów i nie pozwalaautoissue. Invalid/progress/errors zachowaćtyped:400/401/409/429/503, nie spłaszczać do ordinaryfallback. Runtimeconfig brak → explicit503 recovery_operations_unavailable.

Najmniejszy coherent delta: strictadapter6calls; jeden rootSecureStorevault+coordinator; ID/proofbeforePOST, expectedUID/genbeforeSDK, customtokennopersist; codesbeforeexposure i savedintentbeforeACK, cleanupafterconfirmedresolutiononly. Authobserver serializuje pendingrecovery przed exchange/me/profileprepare; sameUID/gen coldACKbezsignin, mismatch zeroACK/exchange/me/profileprep przedjawnądecyzją. Oba entry/security UI używają trwałego codes/savedACK, nie screenstate; ordinarysessionexchange pozostaje wyłącznieordinarysignin.

Ocena research .95/.86/.84/.88 minimum.84; to nie wymagany no-tools implementationAPPROVE. Potrzebne briefing/preflight/testyrealSDK/native/Maestro naexistingiPhone17. PO SMTP/retention blokują finalB2config, nie zmianęA2consumercontract; brak zgody na productiondefaults lubSMTPscope.
