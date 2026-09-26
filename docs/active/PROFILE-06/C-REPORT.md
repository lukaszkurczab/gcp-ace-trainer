# PROFILE-06/C — transfer i discard danych Gościa

## Status

**DONE / niezależny qa-gate PASS WITH ISSUES.** Oba trwałe wybory adopcji przeszły przez produkcyjne UI na istniejącym iPhonie 17, restart przed zatwierdzeniem i restart po zakończeniu. Lokalny Auth i exact-account Firestore inspection rozdzielają Firebase UID od wewnętrznego account ID i potwierdzają wynik bez ujawniania danych logowania.

Ocena zatwierdzonego podejścia: zgodność celu i architektury 0,94; prostota 0,84; kontrola ryzyka 0,88; utrzymywalność 0,89; minimum **0,84 — APPROVE**.

## Transfer

- Gość miał Coding Interview oraz zapisany cel i plan. Po utworzeniu izolowanego konta wybór „Save to account” pozostał włączony po `stopApp`/`launchApp clearState:false`.
- Zatwierdzenie otworzyło ten sam track i cel. Kolejny restart zachował Home, a ekran wyboru adopcji nie wrócił.
- Exact-account inspection: jedna mapa Firebase→konto, istniejący profil, dokładnie trzy rekordy (`active_track`, `goal`, `learning_plan`), trzy mutacje, jedno metadata i jedna operacja sync. Operacja zawiera dokładnie trzy mutation IDs i trzy rekordy; nie ma drugiej operacji ani duplikatu.

## Discard

- Po wylogowaniu utworzono świeżego Gościa z Backend System Design i świeże izolowane konto.
- „Save to account” ustawiono na `false`; wybór przetrwał restart. „Continue” wymagało jawnego potwierdzenia „Remove device data”.
- Po zatwierdzeniu i kolejnym restarcie nie wrócił ekran adopcji. Stabilny ekran wyboru tracku potwierdza brak przejęcia porzuconego tracku Gościa.
- Exact-account inspection: jedna mapa Firebase→konto i istniejący profil, ale `0` progress, `0` mutations, `0` metadata, `0` sync operations, `0` generations i `0` adoption transfers/idempotency. Dane Gościa nie trafiły do konta.

## Środowisko i bezpieczeństwo evidence

- Preflight i przebieg użyły działających lokalnie: API `127.0.0.1:8080`, Auth `19099`, Firestore `18081`, Metro `8081` oraz jednego istniejącego iPhone'a 17 `7F315654-3175-4F3C-BB24-B0263F59360C` z iOS 26.4. Nie utworzono urządzenia ani duplikatu aplikacji.
- Pierwsze uruchomienie Maestro było blokowane przez sandbox przy zmianie trybu `applesimutils`; właściwe przebiegi wykonano poza sandboxem. Jedna próba podała `undefined`, bo Maestro wymagało jawnych `-e`; formularz nie został wysłany i nie stanowi dowodu produktu.
- Dane kont, UID/account ID, tokeny, surowe logi i prywatne artefakty formularzy pozostały w katalogu tymczasowym poza repo. Każdy wybrany screenshot został obejrzany; nie zawiera e-maila, hasła, tokenu, identyfikatora konta ani powiadomienia. Kadry z debugger toastem i przejściowym „Restoring session” odrzucono.
- Manifesty [transfer](evidence/selected/profile06-c-transfer.manifest.json) i [discard](evidence/selected/profile06-c-discard.manifest.json) wiążą flow, runtime, dirty-worktree patch, urządzenie, hashe screenshotów i zanonimizowane liczniki exact-account.

## Weryfikacja

- Maestro `adoption-transfer-restart.yaml`: **43 zakończone komendy, cały flow PASS** (warunkowe zamknięcie debug toast także zakończone poprawnie).
- Maestro `adoption-discard-restart.yaml`: **51 zakończonych komend, cały flow PASS**.
- Dodatkowy stabilny final-state capture discard: **7 zakończonych komend, PASS**.
- Exact-account Auth/Firestore inspection: transfer i discard **PASS** zgodnie z licznikami powyżej.
- Ukierunkowany pakiet kontraktu/lifecycle/startupu: **102/103 PASS**. Jedyny FAIL to istniejący statyczny assertion `ODK-E2E-041 data evidence...` oczekujący starego tekstu testu; ten sam niezależny residual był już zapisany w PROFILE-06/B i nie dotyczy C ani zachowania runtime.
- Niezależne QA uruchomiło węższy pakiet lifecycle/kontrakt/kompozycja: **73/73 PASS** i wydało **PASS WITH ISSUES**.
- Oba manifesty przechodzą `jq`; wszystkie cztery SHA-256 screenshotów odpowiadają plikom; `git diff --check` — **PASS**.

## Ograniczenia i następny krok

Dowód jest lokalny i nie obejmuje produkcyjnych providerów ani wdrożenia. Runtime bazował na `a3813ac1` oraz istniejącym dirty-worktree patchu `e024d2f9…`, zapisanym w manifestach; równoległe zmiany nie należą do C. Prywatny exact-account inspector i identyfikatory nie trafiają do repo, dlatego QA mogło sprawdzić zanonimizowane wyniki i metodę, ale nie odtworzyć z repo mapowania konkretnego UID do account ID ani kompletności korzeni. PROFILE-06 pozostaje `partial`: następny niezależny slice to D (logout offline i izolacja A/B), a E nadal wymaga decyzji PO.
