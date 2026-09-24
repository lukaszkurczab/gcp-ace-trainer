# ODK-116/A4a1 — adresy publiczne w rekordzie wydania

**Data:** 24.09.2026  
**Status:** done dla kontraktu linków; eksport A4a2 i web A4b pozostają otwarte.

Do kanonicznego rekordu danych prawnych dodano dokładnie trzy pola `publicLinks`: Privacy, Terms i Support. Lokalny fixture oraz obecny plik wydania mają jawne znaczniki do uzupełnienia. Schema akceptuje je tylko w trybie testowym; w release wskazuje ich ścieżki i blokuje build. Po otrzymaniu prawdziwych danych `app.config.js` sprawdzi adresy istniejącym parserem publicznej konfiguracji HTTPS i wymusi dokładną zgodność z trzema linkami używanymi przez aplikację. Komunikat o niezgodności nazywa pole, nie wypisuje URL.

**Weryfikacja:** celowane testy 22/22 PASS, `npm run typecheck`, walidacje content/runtime privacy i `git diff --check` PASS. `npm run launch:readiness` pozostaje `not_ready` z `public_legal_variables_incomplete` oraz ścieżkami trzech linków. Niezależne QA `gpt-6-luna/high`: **PASS WITH ISSUES** — pełny A4a wymaga jeszcze eksportera, a rzeczywisty release z kompletnymi adresami nie może być uruchomiony przed dostarczeniem wartości PO. Helper porównania jest przetestowany na danych syntetycznych.

**Granica:** nie dodano fikcyjnych adresów do UI ani webu. Szablony Privacy/Terms i ich eksport będą następnym slice; obecny build release słusznie odmawia pracy z placeholderami.

**Ocena przed zmianą:** zgodność 0,95; prostota 0,85; kontrola ryzyka 0,85; utrzymywalność 0,90; minimum **0,85** po poprawionym briefingu zatwierdzonym przez `gpt-6-luna/high`. Wykonawca `gpt-6-luna/high`.
