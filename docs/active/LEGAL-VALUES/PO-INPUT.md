# LEGAL-VALUES — wymagane dane właściciela

Status: BLOCKING wydanie; praca lokalna UI/backend może trwać. Kanoniczny zapis: `config/public-legal.release.json` w app. To publiczne dane wydaniowe, nie sekret ani plik lokalnego runtime. Nie przesyłać haseł/tokenów/API keys.

Realny przykład: użytkownik otwiera Settings → Legal information → Terms i musi znaleźć rzeczywistego sprzedawcę, kontakt reklamacyjny/odstąpienia oraz cenę i odnowienie Premium. Brak tych danych blokuje release config/build i produkcyjny eksport prawny WWW.

## Dane do uzupełnienia i potwierdzenia

| Grupa | Dokładne pola kanonicznego źródła |
| --- | --- |
| Publiczne strony | `publicLinks.privacyUrl` (HTTPS `/privacy`), `termsUrl` (HTTPS `/terms`), `supportUrl` (HTTPS). |
| Operator / sprzedawca | `terms.operatorLegalName`, `operatorBusinessForm`, `operatorRegisteredAddress`, `operatorEmail`, `operatorPhone`, `operatorRegistrationNumber`, `operatorTaxIdentifier`. |
| Administrator danych | `privacy.controllerLegalName`, `controllerBusinessForm`, `controllerAddress`, `privacyEmail`, `controllerPhone`, `registrationNumber`, `taxIdentifier`, `dpoContact` (rzeczywisty kontakt/status, bez wymyślania roli). |
| Zasady Terms | `terms.adrEntity`, `adrPosition`, `competentCourts`, `complaintEmail`, `distributionTerritories`, `effectiveDate`, `governingLaw`, `minimumUserAgeScope`, `supportCommitment`, `technicalRequirements`, `withdrawalEmail`. |
| Premium | `terms.premiumPriceIncludingTaxes`, `premiumRenewalPriceIncludingTaxes`, `premiumServiceScope`; potwierdzić actual SKU/product name, billing period, merchant of record i checkout state w store/RevenueCat. Bieżący checkout jest wyłączony; nie włączać przez domysł. |
| Rzeczywiste przetwarzanie danych | `privacy.activeCloudProcessors`, `activeIndependentRecipients`, `clipboardRecoveryCodeRetentionMinutes`, `distributionTerritories`, `internationalTransferSafeguards`, `processingRegisterDisclosure`, `revenueCatStatus`, `supervisoryAuthority`; potwierdzić fakty hostingu/retencji/PITR z aktualną konfiguracją i umowami. |

Pola lokalizowane obecnego źródła wymagają EN+PL. Nie tłumaczyć tożsamości, adresów, identyfikatorów i kontaktów tak, aby zmieniać fakty. Warunek kanonicznego planu obejmuje weryfikację siedmiu locale; aktualne EN/PL release source i pięć translation drafts trzeba sprawdzić i spójnie doprowadzić do tego warunku, a nie uznać dwóch języków za odbiór siedmiu.

Rekomendacja: PO uzupełnia albo przekazuje zatwierdzone fakty odpowiadające tabeli; agent zapisuje je tylko w jednym kanonicznym źródle, sprawdza wszystkie konsumenty i eksport. Brak wartości pozostaje jawną blokadą — bez placeholderów wydaniowych i bez interpretowania ciszy jako zgody.

## Blokowane bramki i weryfikacja

LEGAL-VALUES → produkcyjny WEB-PUBLISH/legal → FREEZE finalnego config/build → GO/PUBLISH. Nie blokuje lokalnego UI-26-12, AUD-15, AUD-08/OPS ani badań środowiska. Samo dostarczenie wartości nie autoryzuje deployu ani publikacji.

Aktualny release validator nie przechodzi z niewypełnionymi polami (read-only research Luna medium). Po otrzymaniu danych: Node22 `npm run check:legal-variables -- --release`, `npm run launch:readiness`, finalnie `npm run release:gate`; `npm run export:legal` dopiero po poprawnej walidacji (tworzy artefakt, nie deploy). WWW używa eksportu app z oczekiwanym fingerprint, nie niezależnej kopii wartości.

Źródła: `config/public-legal.release.json`, `src/legal/legalVariablesSchema.ts`, `scripts/checkLegalVariables.mjs`, `scripts/exportPublicLegal.mjs`, `app.config.js`, `patternly-web/README.md`, kanoniczny plan R01–R08. Żadne dane ani konfiguracja providerów nie zostały zmienione.

Ocena przygotowania listy wejść (bez zmiany produktu): spójność .96, prostota .95, kontrola ryzyka .98, utrzymywalność .96; minimum .95. Pytanie PO wysłano 30.09.2026; odpowiedź pozostaje otwarta.
