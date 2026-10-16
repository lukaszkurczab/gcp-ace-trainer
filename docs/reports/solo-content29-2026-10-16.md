# Prompt 29 / SOLO-CONTENT-02 / M09 — odbiór

16.10.2026 — **PASS: kod i lokalny odbiór narzędzia. Bez residualu29.** Następny dopuszczalny prompt30; nieuruchomiony. [Kanoniczny plan](../../../docs/PATTERNLY-WORKING-PLAN.md), [bieżący stan](../../../.agent/WORKING_STATE.md).

## Zakres i kontrakt

`updateCandidateContentReleaseLock` w trybie `write` wywołuje istniejący `readHistoricalContentProducerPin({ appRoot })` przed jedynym zapisem aktywnego locka. Usunięto przechwytywanie dowolnego błędu odczytu i kopiowanie aktywnego pliku do historii. Writer nie tworzy ani nie naprawia historii; ewentualne odtworzenie poprawnych bajtów z Git pozostaje oddzielną świadomą operacją. Generowanie kandydata, walidator historii, frozen hash/pin, CLI i tryb `check` zachowane. Nie dodano abstrakcji, fallbacku ani nowego narzędzia odtwarzania.

AC: missing/hash/read-error odrzucają operację bez zmiany aktywnych bajtów ani stanu historii; poprawna historia pozwala uzyskać dotychczasowe kanoniczne bajty. Testy używają rzeczywistego systemu plików i tymczasowego appRoot, istniejącej poprawnej fixture `cc6cd256dea06bf6b940f59587dd4600e642be53` oraz aktualnego producer checkout. Aktywny WIP nigdy nie był celem writera.

Wejście: APP HEAD `3911c7c0882299ca2d5217c26a67ff24bb574af0`, CONTENT HEAD `420cdf237e6ca8f1d4cf84c3d70e38ba7896f292`. Plan i stan potwierdzały końcowy handoff QLE APP9c9798a5/CONTENT71b0096; dwa skrypty i oba locki były czyste. Odebranego QLE/28 nie powtarzano. Wskazany historyczny audyt `solo-maintainability-audit-2026-10-13.md` jest niedostępny, zgodnie z uwagą w planie; defekt potwierdzono bezpośrednio w kodzie i testem RED.

Ocena przed implementacją: dopasowanie0,99 / prostota0,99 / kontrola ryzyka0,96 / utrzymywalność0,99; minimum0,96. Jeden istniejący reader pozostaje właścicielem kontraktu. Niezależny design review `luna_high_contract_review` (gpt-6-luna, high, read-only) **PASS**; minimum0,95, brak konfliktu kontraktowego. Jedyny writer: główny agent.

## Wykonana weryfikacja

Polecenia uruchamiano w repo `patternly`, Node22.22.3 (wymagane >=22.13.0 <23).

| Sprawdzenie | Wynik i granica |
| --- | --- |
| `node --test scripts/candidateContentReleaseLock.test.mjs` przed zmianą | 26/26 PASS — dotychczasowe zachowanie |
| `node --test --test-name-pattern='candidate lock writer' scripts/candidateContentReleaseLock.test.mjs` przed naprawą | RED: missing/hash nie zgłaszały błędu; EISDIR i pozytywny przypadek przechodziły. Dowód regresji, nie końcowy wynik |
| `node --test scripts/candidateContentReleaseLock.test.mjs` po naprawie | 31/31 PASS, 12 top-level testów; produkcyjny kod finalny |
| To samo wąskie polecenie z `--test-name-pattern='candidate lock writer'` po doprecyzowaniu setupu | 5/5 PASS. Jedyna późniejsza zmiana testowa: negatywny aktywny lock zaczyna od odmiennych bajtów, aby wykryć przedwczesny zapis. Pozostałe testy/źródła/config bez zmian, ich dowód31/31 zachowuje zastosowanie |
| Niezależne QA Luna high, ten sam finalny wąski test | **PASS, 5/5**; reviewer sam sprawdził diff, reader/writer, brak zmian locków i `git diff --check`. Nie powtarzał pełnego pliku |
| `node --check scripts/candidateContentReleaseLock.mjs` oraz `node --check scripts/candidateContentReleaseLock.test.mjs` | PASS, test ponownie sprawdzony po finalnym setupie |
| `npm run recovery:check` | PASS: inventory i Stage1 boundaries; 554 source files / 432 test files / 2654 cases. To nie pełna suita |
| `git diff --check -- scripts/candidateContentReleaseLock.mjs scripts/candidateContentReleaseLock.test.mjs` i refcheck | PASS; brak zastąpionego zapisu historii, nieużywanych importów lub nowych runtime paths |
| Zachowanie WIP/pinów | Snapshot194 ścieżek: poza dwoma własnymi skryptami192/192 bez zmian hashów/stanu, w tym zastane WIP, wygenerowane treści, package-lock i oba release locki |

Negatywne przypadki sprawdzają kod `ENOENT` i nadal nieistniejącą historię, błędny hash i identyczne uszkodzone bajty oraz rzeczywisty `EISDIR` (historia jako katalog), zachowany typ katalogu i jego zawartość. Wszystkie sprawdzają identyczne aktywne bajty sentinela. Pozytywny przypadek porównuje wygenerowany kandydat z istniejącą fixture, nadpisuje wyłącznie tymczasowy aktywny lock, wymaga dokładnych oczekiwanych bajtów, zachowuje historię i przechodzi `check`.

## Finalne SHA-256

| Plik | SHA-256 |
| --- | --- |
| `scripts/candidateContentReleaseLock.mjs` | `3a03217c1a767483951388319e331187b377b9b79fd93c3daf218f9d4a314d18` |
| `scripts/candidateContentReleaseLock.test.mjs` | `c062ead9b32768ea0631a30ecf6c9cccad62c3866d2e284d3f30af98c6d21bee` |
| `integration/contracts/content-release/release.lock.json` (niezmieniony) | `22f3ef64cb3801bc0345b8d8bf6f8b656bd6579c6a46816b5ce9c0b30f5e8823` |
| `integration/contracts/content-release/release.lock.historical-0024.json` (niezmieniony) | `d5058e8678ceab38fbdb3fc6ea423b80e21571885549df9b42dd6e3916312195` |

## Granice odbioru

Odebrano wyłącznie zachowanie tego writera i regresje jego pliku. Nie uruchamiano pełnej suity repo, hosted CI, builda, urządzeń, usług, promotion ani publikacji; nie wykonano commit/push. Nie zmieniano pinów, treści, zależności ani cudzych plików WIP. Istniejąca semantyka samego `writeFile` aktywnego locka i równoległa zewnętrzna ingerencja w pliki nie były przedmiotem zmiany ani dowodu. Błąd odczytu dowiedziono realnym EISDIR na lokalnym systemie; nie symulowano wszystkich kodów błędów systemu operacyjnego. Brak pozostałego defektu w uzgodnionych AC; wynik nie ustanawia gotowości usług ani wydania.

Zmieniono dwa wskazane skrypty i ten raport, usunięto wyłącznie odebrany wiersz SOLO-CONTENT-02 z planu workspace oraz uaktualniono jeden bieżący stan. Nie odtworzono usuniętej kopii planu ani historii raportów. Sesja kończy się po handoff29.
