# AUD-08-B3 — durable mobile consumer

Status: **RESEARCH ONLY / NOT ACCEPTED**. GPT-6 Luna high readonly completion map; bez testów lub urządzenia. B2 producer jest w implementacji.

## Zweryfikowane wejścia

AccountSessionProvider issue używa runReauthenticatedMutation, zwraca codes tylko w pamięci. Consume używa starego adaptera, signInWithCustomToken i generic finalizeCurrent. PatternlyApiClientAdapter nie przekazuje operationId i oczekuje legacy customToken DTO. AccountSessionExchange przy brakującym claimie może wykonać ordinary session exchange — recovery musi fail closed zamiast tego fallbacku. Adopcja ma lokalny checkbox saved i gubi codes po background; settings security gubi codes po background/focusloss i nie ma saved-ACK checkboxa. Firebase SecureStore persistence przechowuje refresh token; obecny AES MMKV jest profile-scoped i niedostępny przy zamkniętym profilu, więc nie nadaje się na signed-out recovery proof.

## Najmniejszy coherent delta

Jeden root-scoped SecureStore vault operacji i jeden coordinator dla consume/issue. Persist operationId i consume proof przed siecią; expected firebaseUid/generation przedSDK; custom token nigdy persistowany. Resultcodes persist przed wyświetleniem; savedintent przed ACK; proof/codes clear dopiero po potwierdzonym ACK. Coldstartup pendingop gate przedprofilepreparation: restored same UID/generation → ACK bezsignin; mismatch → explicituserchoice, zeroACK/profileprep. Zachować ordinarysignin exchange tylko w zwykłym flow; recovery requiredgeneration blocks missing/malformed/mismatch.

Scope: adapter strict DTOs/newpaths, provider/coordinator/session helper, vaultboundary, sharedsaved/ACK deliveryUI w obu accountentry/security surfaces. Nie blokować endpointnames zanim producerOpenAPI frozen. B3 requires correctcheckedout backendsha and realSDK/nativeacceptance, nie same greenunit tests.

## Wymagana weryfikacja

StrictDTO, persist-before-request/exposure, stableID/retry, lostresponse/status, ACKloss, cleanupafterACKonly, sameUIDcoldresume withoutsignin, wrongUID/gen noACK/no profileprep, ordinarysignin fallbackpreserved, savedcheckboxACKbothscreens. Existing iPhone17/Maestro for runtime po sourceQA. SMTProutePOpending pozaA2research.

Consistency.96/simplicity.83/risk.84/maintainability.86 minimum.83; rootvault uzasadniony signed-out i zmianą profile scope. To ocena podejścia research, nie no-toolsapproval implementacji i nie gotowy runtime.
