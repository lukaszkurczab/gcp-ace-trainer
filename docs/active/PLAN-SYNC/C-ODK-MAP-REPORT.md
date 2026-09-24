# PLAN-SYNC/C-ODK-MAP — odzyskane kontrakty providerów

**Data:** 24.09.2026

**Status:** discovery done; żaden provider gate ODK-082–087 nie jest przez tę mapę odebrany.

## Źródła

Historyczny pakiet [ODK-E2E-082–088](https://github.com/lukaszkurczab/gcp-ace-trainer/blob/fd9407040a5d585ce7ad2448de55de3cc04edc89/docs/qa/ios-backend/ODK-E2E-082-088-PROVIDER-GATES.md) jest osiągalny w historii aplikacji, chociaż nie ma go w bieżącym HEAD. Późniejsza [tabela ID](https://github.com/lukaszkurczab/gcp-ace-trainer/blob/b1a41157f3d8c3e9da7c42521e81e0763c75c336/docs/qa/ios-backend/E2E-OBSERVACJE-ROBOCZE.md) aktualizuje zakres 084. Bieżące HEAD przy sprawdzaniu: app `d1c23c1`, backend `0ea62f7`, content `36fd693`, web `10e3182`; czyste. Historyczny kontrakt jest punktem wyjścia, nie aktualnym dowodem PASS.

| ID | Odzyskany zakres i obecny stan | Właściciel / następny kontrakt |
| --- | --- | --- |
| ODK-082 | Firestore TTL dla `legalRequests` i `legalRequestRateLimits`; historycznie cel 22 ACTIVE wobec 20. Bieżący backendowy `config/firestore-ttl.json` i skrypty istnieją, ale `docs/retention-runbook.md` podaje 20 zatwierdzonych polityk. To konflikt kontraktu, a nie upoważnienie do włączenia TTL. Brak bieżącego odczytu GCP. | Codex uzgadnia zatwierdzoną listę i robi dry-run/read-only; rzeczywistą zmianę TTL rozpatruje osobno na właściwym projekcie, po ustaleniu skutku usuwania danych i dostępu. |
| ODK-083 | Finalny iOS archive, Xcode Privacy Report i deklaracja App Store Connect dla tego samego buildu. Brak aktualnego pakietu archiwum/ASC. | Codex przygotowuje porównanie build/SDK/manifest; konkretny brak dostępu ASC dopiero wtedy trafia do PO-ACCESS. WAIT: finalny build. |
| ODK-084 | Realny App Check na finalnym kliencie i reprezentatywnych żądaniach gość/konto; poprawny, brakujący, błędny i niedostępny token, Authentication/recent reauth, retry oraz metryki odmów. [Późniejsza tabela ID](https://github.com/lukaszkurczab/gcp-ace-trainer/blob/b1a41157f3d8c3e9da7c42521e81e0763c75c336/docs/qa/ios-backend/E2E-OBSERVACJE-ROBOCZE.md#L17) aktualizuje pierwotny zakres publicznych endpointów; trzeba użyć tej tabeli i bieżących granic mobile. Lokalne APPCHK-01–04 są kontraktami, nie dowodem prawdziwej atestacji. | Codex/QA; WAIT: freeze, realny provider i urządzenie. Nie zaliczać debug tokenu. |
| ODK-085 | Prawdziwy cykl miesięcznego Premium w App Store sandbox/RevenueCat: purchase, cancel, restore, refund, price change, webhook i idempotencja. Brak rzeczywistego SKU/ceny i provider evidence. | Jeden wspólny przebieg z ODK-119-PROVIDER; Codex przygotowuje techniczne SKU/konta, PO-PRICE dostarcza decyzję cenową. Bez duplikatu gate. |
| ODK-086 | Prawdziwy SMTP/Google Workspace, account/guest, sukces/odmowa/niepewne delivery. Historyczny zapis obejmuje e-mail potwierdzający zakup. Bieżący `BE-DEC-003` przenosi wszystkie żądania praw do aplikacyjnego Settings, zachowując e-mailową weryfikację gościa bez publicznej ścieżki web; zastępuje starszą granicę mailową `BE-DEC-002`. Nie znaleziono bieżącego kontraktu e-maila zakupowego, więc jego wymaganie trzeba osobno potwierdzić przed testem. Brak live delivery evidence. | Codex/backend; WAIT: docelowa konfiguracja SMTP i uzgodniony bieżący zakres. PO-ACCESS tylko przy realnej odmowie dostępu. |
| ODK-087 | Prawdziwe dane operatora, dostawców, regionów, transferów, SKU/ceny oraz prywatne DPA/TIA/LIA/RoPA. Produkcyjny rekord nadal zawiera placeholdery; prywatnych zatwierdzeń nie odnaleziono w repo. | ODK-116-B/PO-116 dla faktów publicznych, PO-PRICE dla ceny, prywatny owner/legal dla dokumentów governance. Nie tworzyć równoległego źródła danych ani zastępować zatwierdzenia testowym profilem. |

## Rozdział odpowiedzialności

PLAN-SYNC dokumentuje odzyskane źródła i rozbieżności. AWS-02 odpowiada za candidate approval/readiness, SIMP-05 za aktywnych konsumentów i legacy, a poszczególne ID za późniejszy odbiór providerów dla exact build/SHA/config. Ani 082 (historyczne 22 wobec bieżących 20), ani 086 (historyczna publiczna ścieżka/purchase e-mail wobec BE-DEC-003 i nieustalonego kontraktu zakupowego) nie mają automatycznie obowiązującego historycznego AC. Stan rzeczywistych usług pozostaje unknown do odczytu/odbioru.

**Ocena dopasowania:** cel i architektura 0,93; prostota 0,91; ryzyko 0,88; utrzymywalność 0,92; minimum **0,88**.
