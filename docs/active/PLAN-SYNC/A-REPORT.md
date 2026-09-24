# PLAN-SYNC/A — kanoniczny plan i inventory kontraktów

**Data:** 24.09.2026<br>
**Status:** `done` dla A; całe PLAN-SYNC pozostaje `partial`.<br>
**Model analizy:** `gpt-6-luna` high. Niezależna walidacja briefingu: zgodność 0,93; prostota 0,87; ograniczenie ryzyka 0,88; utrzymywalność 0,90; minimum 0,87.<br>
**Zakres:** dokumentacja i read-only kontrola czterech repo; bez implementacji CI, treści, providerów i publikacji.

## Stan źródeł

| Repo | Gałąź | HEAD podczas inventory | Stan |
| --- | --- | --- | --- |
| Aplikacja | `main` | `488bdc17647ca579da750a598add9881805c4b01` | czysty przed zmianą dokumentów |
| Backend | `main` | `e3c3fc6570faa13a802f47a19e17005b0c1eecd1` | czysty |
| Content | `master` | `618baae428d7d42e59834eaef322e57393d54c7d` | czysty |
| Web | `main` | `b389009b38e80a9919337f7f9bd13dc76bdca2b7` | czysty |

Plan i raport dodatków były poza Git. Ich jedyna edytowalna treść jest teraz w `patternly/docs/`; ścieżki root pozostają lokalnymi symlinkami. Linki do źródeł innych repo są przypięte do powyższych SHA. Pięć wcześniej brakujących pakietów nie zostało odtworzonych; plan nazywa je jawnie bez pozornych linków. Dokumenty innych repo nadal odwołują się do lokalnej ścieżki root, która w osobnym checkout nie istnieje. PLAN-SYNC/B musi zamienić te odnośniki na trwały adres kanonicznego planu i wypchnąć właściwe repozytoria.

## Sprawdzenie lokalnych środowisk

- Jeden istniejący symulator: iPhone 17, iOS 26.4, UDID `7F315654-3175-4F3C-BB24-B0263F59360C`; aplikacja `com.lkurczab.patternly` jest zainstalowana. Maestro 2.10.0 wykrywa ten sam `iPhone-17`.
- Auth emulator `127.0.0.1:19099` i Firestore `127.0.0.1:18081` działały już przed zadaniem. Próba ich ponownego uruchomienia zakończyła się konfliktem zajętych portów; żadnego nie restartowano ani nie czyszczono.
- Lokalny backend `dev:smoke` uruchomiono z projektem `patternly-app-sandbox`; `GET /ready` zwróciło `ready` oraz `database`, `authentication`, `providerReader` = true. Walidacja profilu mobile potwierdziła połączenia Auth/API i zgodność testowego tokenu App Check bez wypisywania wartości.
- `patternly-web`: `npm run verify:local` PASS (build, granice tras, render marketingu, lokalny admin entry). Nie jest to dowód zdalnego deployu.
- `patternly-content`: `npm run test:shared-contract` PASS 22/22.
- `patternly`: `src/content/contentReleaseCrossRepo.test.ts` PASS 3/3 względem bieżącego buildera contentu. Nie uruchomiono pełnej sesji aplikacji ani providerów.

## Potwierdzone rozjazdy i ograniczenia

1. Workflow aplikacji wywołuje `authoring:validate` i `audit:aws-workbook-source`, których nie ma w scripts contentu; test `test:candidate-draft-v2` nie jest częścią głównego `npm test`. To wejście dla `CI-CONTRACT/A–C`, nie PASS pipeline'u.
2. `candidate-manifest.mjs` nadal wymaga `humanApproval` powiązanego z historyczną ścieżką, podczas gdy plan deleguje akceptację banków Codexowi. `PLAN-SYNC/B` ustala prawidłowy kontrakt evidence; AWS-02 zmienia konsumentów po osobnym QA.
3. `SIMP-05`: nie znaleziono pakietu ani raportu; dokumenty SIMP-03 nadal mówią o aktywnym legacy do SIMP-05. Rzeczywisty aktywny ingress/runtime wymaga ustalenia; status `unknown / needs evidence`.
4. `AUD-02`: raport potwierdza `partial`; driver forms i RC pozostają bez odbioru z powodu zachowanego owner mismatch. Aktualny preflight jest lokalny; candidate admission należy do AWS-02.
5. `ODK-082–087`: nie znaleziono pakietów przypisujących wszystkie ID do konkretnych providerów/operacji. Znany wspólny dowód `ODK-085` i `ODK-119-PROVIDER` nie wystarcza do odgadnięcia pozostałych.
6. `ODK-116-A`: aktualny `app.config.js` nadal sprawdza pola Androida przy konfiguracji iOS; implementacja platformowej walidacji pozostaje osobnym slice.
7. `PO-ACCESS`: nie stwierdzono konkretnego niedostępnego uprawnienia. Nie jest globalną blokadą.
8. Brak w workspace: `PATTERNLY-AUDIT-TASKS-2026-09-22.md`, `PATTERNLY-AUDIT-2026-09-22.md`, `ODK-116-INPUTS-PACKET.md`, `AUD-01-REPORT.md`, `IDENTITY-CUTOVER-2026-09-22.md`. Historycznych wyników z planu nie przeniesiono do nowego PASS.

## PLAN-SYNC/B — następny task dokumentacyjny

**Cel:** uzgodnić aktywne kontrakty czterech repo z decyzjami PO i usunąć niejasności blokujące implementację.<br>
**Zakres:** odnaleźć lub odtworzyć z obecnych źródeł brakujące pakiety, rozdzielić lokalny AUD-02 od AWS-02 admission, ustalić zakres SIMP-05 i każdy ID ODK-082–087, naprawić odnośniki do planu w samodzielnych checkoutach backend/content/web, opisać delegowany format decyzji contentu, zmapować publiczne pola i sekrety ODK-116 oraz konkretne potrzeby PO-ACCESS.<br>
**Poza zakresem:** implementacja kodu, provider E2E, konta produkcyjne, decyzja GO i publikacja.<br>
**Wejścia:** bieżący plan, raport dodatków, wskazane skrypty i raporty czterech repo.<br>
**AC:** każdy aktywny kontrakt ma właściciela i ścieżkę dowodu; sprzeczne wymagania Android/PO approval/PO-116 są usunięte lub oznaczone jako blokada; brak pakietu jest odtworzony z dowodu albo ma jawny task weryfikacyjny; ODK-082–087 nie mają wymyślonych przypisań; zależności są bez cykli.<br>
**Weryfikacja:** kontrola odnośników i ID, porównanie zapisów z aktualnymi skryptami, niezależne QA dokumentacji; testy kodu tylko przy uzasadnionym ryzyku.<br>
**Dowód:** raport B z tabelą kontraktów, statusami `done`/`partial`/`blocking`/`deferred`/`planned`/`unknown / needs evidence` i listą pozostałych luk.<br>
**Ryzyko:** brak historycznych pakietów może wymagać ograniczonej rekonstrukcji, lecz nie wolno przypisywać historycznych PASS bez evidence.<br>
**Raport:** `patternly/docs/active/PLAN-SYNC/B-REPORT.md`.
