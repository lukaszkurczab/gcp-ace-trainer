# UI-26-02B — pierwsze użycie Apple i Google

Status: ACCEPTED lokalnie — implementacja, source QA, native QA i pełna qa:static PASS; commit/push w toku. 2026-09-30.

## Wynik i kontrakt

Apple/Google są dostępne wyłącznie na Sign in; Create account zachowuje email/password. Istniejący dokładny Firebase UID wymienia sesję i otwiera własne konto bez importu gościa. Tylko dokładne HTTP404/account_not_found prowadzi do provisional tego samego UID. Każdy dokument trzeba otworzyć; Terms acceptance i Privacy acknowledgement pozostają oddzielne i początkowo odznaczone. Utworzenie konta wymaga obu. Tylko created:true otwiera jawny przegląd adopcji; dane przechodzą dopiero po Continue. Cancel wraca do neutralnego Sign in; zimny restart przed rejestracją jest bezpiecznie wylogowany, a jawny retry wymaga świeżych wyborów.

Źródło decyzji: zatwierdzony UI-26-02A CONTRACT.md w app78d805ede6c07fed36a5c2f57bbdb43e8b31b9d7. ACTIVE stashe app acc4dd4b104d202e81064fabd2c268e28ffbf5cd i backend0ab654cbb2e7ece519d8d34e739b50db8bb00e7d zintegrowano bez usunięcia stashów ani cofnięcia UI10/UI09/UI01. Historycznych zamkniętych zadań nie otwierano ponownie.

## Rzeczywiste poprawki

Zintegrowano providerFirstUseCoordinator, AccountSessionProvider, AccountEntryScreen oraz osobne dokumenty i warunki rejestracji. Nie zmieniono kontraktu API/schema. Backend otrzymał jedynie19 linii testów dowodzących braku mutacji prawnej przy mapped exchange i braku danych dla unmapped404.

Smoke fixture zastępuje wyłącznie pozyskanie tokenu Apple/Google. Ścisły URL jest obsługiwany przez zamontowany AccountEntryScreen, bez nowej ścieżki produktu/nawigacji. Dalej działa rzeczywisty Firebase SDK credential/signInWithCredential/getIdToken, HTTP backend, exchange/custom token i lokalny storage. Gate wymaga DEV+Smoke+E2E+oczekiwanego projektu+loopback; poza Smoke fixture jest niedostępny, bez fallbacku. Apple ma pełny typ acquisition oraz nonce SHA256/rawNonce.

Dowody native wykryły dwa błędy funkcjonalne: Cancel automatycznie otwierał HomeGuest, a provider reentry po rzeczywistym logout omijał pending-revocation drain. Pierwszy naprawia UID-scoped intent konsumowany przez właściwy null observer; drugi jeden executor życia providera, wspólny dla restore i jawnego finalization, przed profile preparation. Identyczny UID/lokalna generacja współdzieli operację; inny właściciel czeka, ponownie sprawdza aktualność i odczytuje trwałe markery. Stary właściciel nie publikuje stanu ani nie usuwa blokady nowego. Błąd pozostawia marker i jawny stan pending. Usunięto nieużywany coordinator.cancel i jego zależność signOut po sprawdzeniu wszystkich referencji. Nie obiecuje się pojedynczego HTTP między różnymi generacjami: serwer obsługuje replay dokładnego operationId.

Resolver nieznanego runtime poprawiono na fail-closed zamiast fixture-ready. Żadne brakujące wartości PO nie zostały wymyślone.

## Środowiska i przypięte wersje

Start: app058ae2a1103efdf3cbbc549d65069698c57b8a3f/backend4f714e5146c48815ae03d03d8d47ccc96146c440; wszystkie cztery repo clean/upstream0. Zachowano stashe i cudze zmiany. Istniejący iPhone17 7F315654-3175-4F3C-BB24-B0263F59360C, iOS26.4; Node22.22.3, Maestro2.10/Java17. Shared Auth19099, Firestore18081, backend localhost8080 ready(database/authentication/providerReader), Metro localhost8081 status running. Nie resetowano wspólnych danych ani nie tworzono urządzeń/kopii aplikacji. Proces sam nie był dowodem: SDK/HTTP/native i odczyty Firestore weryfikowano oddzielnie.

Backend producer tests2/2 uruchomiono na osobnych Auth19199/Firestore18181/hub4441/log4541/ws19150, ponieważ istniejący test hook clearFirestore resetuje bazę. Tymczasowe emulatory zatrzymano. Backend checkpoint29165944d087486075c9ccd23657c5c2fb45a84c jest test-only; runtime/API nadal4f714e5. Content0174e42fbe7634a54c1f5d87369063c7e01e8c7e i web9585919b7d0c1a8396e6d255e49850e64e129d0e niezmienione.

Native piny według czasu wykonania (Europe/Warsaw): mapped21:11/21:13 appc51e67476ff5c86dc742941d8dbb1127bb9352e7; consent/cold21:35/21:44 appe031b8c195151dac4597d103f0d98636c5fe30be; cancel/new/adoption22:18–22:31 appff0dc08314b1d0f2e6729b92c848cfcc324bc848; coldgoal/failingreentry22:36–22:44 app1b8940676440326e34b7137d536c71a3e3a18668. Końcowy naprawiony logout/reentry/cold obu providerów appc66419b6969cbc6ab54c45af6db42b68852beaf5. Nie przypisano historycznych prób późniejszemu SHA. App zamknięto podczas edycji drain; świeży start nastąpił dopiero po source QA/checkpoint.

## Odbiór native i backendu

- Obaj mapped providerzy: puste konto otwiera właściwy Track Selection, następnie Home bez planu gościa; logout i jawny ContinueGuest przywraca pierwotny plan gościa. Existing user/legal bez mutacji i progress0.
- Obaj provisional: pristine review, oba dokumenty niewidziane/odznaczone, createDisabled. Otwarcie nie oznacza zgody; Terms-only oraz Privacy-only nadal disabled, oba checked enabled. Zimny restart daje Sign in; retry daje świeże wybory. Przed rejestracją oba identityMappings nie istnieją.
- Obaj Cancel→Sign in→retry świeżych wyborów→Cancel→jawny ContinueGuest: pierwotny plan zachowany, żadnego backend account/map. Niezależny odbiór21/21 komend każdego flow PASS.
- Google EN new201: przed Continue legal1(2026-09-05 Terms/Privacy, acktrue), progress0/generations0/syncnull; po jawnym transferze3 rekordy active_track/goal/learning_plan z Complexity and constraints. Legal niezmienione.
- Apple PL/light2×: pełna oddzielna zgoda i rejestracja50 komend PASS oraz UIaudit bez nakładania kart/footer. Przed Continue legal1 dokładnych PL wersji, progress0; po transferze tylko active_track+goal refresh_and_maintain_skills dni mon/wed/fri/sat, bez learning_plan. Google3 rekordy nietknięte.
- Replay rzeczywistym SDK/HTTP wszystkich4 UID, również przeciwny locale:200/createdfalse/acceptanceNull, mapping/user/legal/progress/sync/generations deepEqual.
- Po poprawce drain: Apple świeży logout→Sign in→mapped reentry Home bez review/adoption/pending; coldrestart zachowuje rzeczywisty cel i Pt.; final logout Sign in PASS. Google reentry zachowuje plan, coldrestart zachowuje plan, logout→świeży Guest nie ma planu konta; ponowny mapped retry po tym świeżym logout Home bez pending PASS. Końcowe snapshoty zachowują mapping/legal/progress/sync/generations wszystkich4 UID; każde nowe konto ma dwie zakończone operacje revoke(status revoked).

Dowody: evidence/INDEX.json, completed commands.json oraz rzeczywiste obrazy w katalogach scenariuszy; sanitized Firestore snapshots i registration-replay.json. Wszystkie UID/userId/operationId zastąpiono spójnymi etykietami fixture (SANITIZATION.json); surowe prywatne snapshoty nie trafiają do Git. To nie są dowody realnego native provider sheet/signed token/handoff.

Maestro iOS nie eksponuje ID długiego selectable document Text; weryfikowano rzeczywisty header/context, obraz treści i przejście tam/z powrotem. Custom checkbox zwraca błędny checked attribute; użyto dokładnego accessibility value checkbox, checked/unchecked +ID/enabled+obrazu. Pierwsza próba goal setup miała offscreen Back; zapis celu faktycznie nastąpił, jawny scrollUP i recovery PASS, pierwotny flow nie jest oznaczony jako PASS. Pierwsze logout tap trafiało w Progress tab (środek przycisku był pod paskiem); poprawiony flow centruje w pełni widoczny przycisk. Zachowano diagnozę oraz rzeczywisty failing pending-reentry przed poprawką. Przerwany dependent flow(exit130), cached fixture failure, offscreen privacy i błędna oczekiwana natychmiastowa Home nie są zaliczone.

## Briefingi, QA i ograniczenia

Przed edycjami independent gpt-6-luna/high bez narzędzi: integration min.84; fixture min.82; unknown runtime.95; typed Apple.91; cancel.82/refinement.86; deadcancel.95; drain redesign .94/.82/.88/.88 min.82. Pierwszy drain brief odrzucono .77 za brak koordynacji callerów; przeprojektowano przed edycją. Root ocena końcowego drain .94/.84/.83/.89 min.83. Bounded fixture worker gpt-6-luna/medium, multi-module merge/debug gpt-6-luna/high, niezależny QA gpt-6-luna/high.

Source: integration63+20+4/typecheck, QA58; fixture76/typecheck, QA51+2Metro; legal15+QA2; typedApple8+QA2; cancel68+QA68; deadcancel67+QA34; drain worker60+QA76. Odpowiednie typecheck/content-boundary/runtime-privacy-boundary/diff PASS. Backend2/2+independentQA/typecheck PASS. Testy helper/static composition nie zastępują native evidence. Final native independent LunaHigh QA PASS; INDEX odświeżony. Pierwsza szeroka qa:static1488/1492PASS:3 błędy konfiguracji cross-repo poprawiono istniejącym clean historicalcc3efca/current0174e42 pinned test3/3PASS. Czwarty strict visualShell count obejmował niezależny UI11 proposal fixture; Test-only correction po briefingmin.89 rozdziela proposal fixture od istniejącego strict inventory i dodaje istniejący headerless EXAM_REVIEW do exactlist; worker31/31PASS. Pełna qa:static na przypiętych checkoutach1492/1492, recovery/typecheck/content/privacy PASS. Independent test-only QA15/15PASS, diffcheck PASS. Root sprawdził JSON validity, brak surowych UID i porównania invariantów po pseudonimizacji (VERIFICATION.json).

Public legal EN/PL Smoke zawiera jawne brakujące wartości PO; nie stanowi zatwierdzenia prawnego/release. Pięć innych locale ma draft/unavailable consent. Lokalny AppCheck i providerReader również są fixtures. Rzeczywisty Apple/Google chooser, podpisane tokeny, nonce/callback i konfiguracja produkcyjnych klientów pozostają odrębną bramką release; pełny lokalny fixture jest zatwierdzonym zakresem UI-26-02B. Nie wykonano deploymentu/EAS/publikacji.

Sprzątanie: własne4AuthUID/backend users/mappings oraz4serverrevocations usunięto indywidualnie, kontrola nieobecności PASS; globalReset:false, shared ready/Metro PASS, app osobny Gość. Pozostałe lokalne profile i historyczne stashe nie były resetowane. Finalne commit/push: pending. UI12 aktywne obrazy/raporty usunięto zgodnie z rotacją aktywnego zadania; komplet dowodów pozostaje w historii058ae2a. Najpierw push backend test-only, potem app. Stashe pozostają. Cel całego planu nadal aktywny; kolejne dostępne zadanie AUD-15, wartości LEGAL-VALUES oczekują PO.
