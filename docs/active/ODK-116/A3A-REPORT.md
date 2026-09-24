# ODK-116/A3a — jeden rekord publicznych danych wydania

**Data:** 24.09.2026  
**Status:** done dla wyboru i walidacji rekordu; A3b release readiness i web pozostają otwarte.

Dotychczas `legalVariables.ts` było jedynym statycznym obiektem używanym przez Privacy, Terms, wersje zgód i Premium. Wydzielono zachowane wartości do lokalnego fixture; tryby smoke/sandbox nadal go używają. Tryb `release` wybiera dokładnie `config/public-legal.release.json`. `app.config.js` odczytuje ten sam plik i przed buildem uruchamia wspólną schemę w trybie release. Obecny rekord ma jawne nierozwiązane pola, więc produkcyjny build kończy się błędem do czasu dostarczenia danych PO. Nie ma powrotu do fixture przy błędzie odczytu.

Polecenie `check:legal-variables` w zwykłym trybie sprawdza lokalny fixture, a z `--release` odczytuje bezpośrednio kanoniczny JSON. Testy sprawdzają wybór źródła, błędny/brakujący plik w izolowanym katalogu, odmowę placeholderów i niezmienione pola konsumentów. Żaden sekret nie jest częścią publicznego rekordu.

**Weryfikacja:** 21 celowanych testów PASS; `npm run typecheck`, walidacje content/runtime privacy i `git diff --check` PASS. `npm run check:legal-variables -- --release`: oczekiwany FAIL dla obecnego rekordu. Niezależne QA `gpt-6-luna/high`: **PASS WITH GAPS**. Brakujący lub błędny JSON jest przetestowany przez resolver CLI, a ścieżka `app.config.js` odmawia odczytu/parsing błędu według przeglądu kodu; nie ma osobnego testu uszkodzonego pliku przez Expo config.

**Granica:** A3b musi dołączyć tę samą walidację do raportu readiness; web ma konsumować wersjonowany eksport w A4. Prawdziwych danych i poprawności prawnej nie oceniano. Obecny kod nadal obsługuje dwa locale; pozostałe należą do ODK-117.

**Ocena przed zmianą:** zgodność 0,96; prostota 0,91; kontrola ryzyka 0,92; utrzymywalność 0,92; minimum **0,91** po poprawionym briefingu zaakceptowanym przez `gpt-6-luna/high`. Wykonawca `gpt-6-luna/high`.
