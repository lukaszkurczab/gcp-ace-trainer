# ODK-E2E-077 — raport wdrożenia

Data: 2026-09-06
Status: `FIXED_PENDING_RETEST`

## Zmiany

- Dodano jeden rejestr spraw dla praw dostępu, sprostowania, usunięcia, ograniczenia, sprzeciwu, przenoszenia i wycofania zgody, z terminem kalendarzowym, kontrolowanymi przejściami, rewizją i pseudonimowym audytem.
- Konto składa wniosek i odbiera status oraz odpowiedź w aplikacji; gość korzysta z publicznego formularza i jednorazowego linku wymienianego na krótką sesję obiektową.
- Kolejka operatora pokazuje wyłącznie dane minimalne. Treść i wskazówki są odszyfrowywane dopiero w audytowanym szczególe.
- Odpowiedzi są szyfrowane i dzielone na ograniczone fragmenty, dostępne 30 dni od doręczenia. Minimalny dowód sprawy ma retencję 3 lat.
- Eksport dostępu/przenoszenia zawiera kopię danych i informacje z art. 15. Stabilny identyfikator nie pozwala odbudować ukończonego eksportu; status `completed` powstaje dopiero po trwałym przygotowaniu odpowiedzi DSAR, a przerwane wykonanie jest jawnie ponawialne.
- Przedłużenie jest możliwe raz przed pierwszym terminem, maksymalnie o dwa miesiące. Konkretny powód jest szyfrowany, przekazywany użytkownikowi w aplikacji/publicznym widoku oraz do nadawcy email, ale nie trafia do kolejki ani audytu.
- Pozytywnego wyniku nie da się wprowadzić ręcznie bez systemowego wykonawcy. Uzasadniona odmowa wymaga treści odpowiedzi, podstawy i informacji o skardze.
- Dodano minimalistyczny ekran w aplikacji, publiczny ekran WWW i kolejkę w istniejącym panelu administratora, zgodnie z zaakceptowanym projektem.

## Najważniejsze pliki

Backend:

- `src/modules/privacy-requests/contracts.ts`
- `src/modules/privacy-requests/store.ts`
- `src/modules/data-export/contracts.ts`
- `src/modules/data-export/store.ts`
- `src/api/app.ts`
- `src/api/openapi.ts`
- `src/infrastructure/firestore/paths.ts`
- `config/firestore-ttl.json`
- `tests/privacyRequestContracts.test.ts`
- `tests/privacyRequests.test.ts`
- `tests/dataExport.test.ts`

Aplikacja:

- `src/features/home/PrivacyRequestsScreen.tsx`
- `src/features/home/YourDataScreen.tsx`
- `src/features/account/AccountSecurityScreen.tsx`
- `src/application/account/AccountSessionProvider.tsx`
- `src/infrastructure/clients/PatternlyApiClientAdapter.ts`
- `src/locales/{pl,en}/data.json`

WWW:

- `src/components/PrivacyRequestsPanel.jsx`
- `src/pages/PrivacyRequestPage.jsx`
- `src/App.jsx`
- `firebase.json`
- `scripts/admin-behavior.test.mjs`

## Weryfikacja

- Backend: lint, typecheck, kontrola 8 polityk TTL, zgodność OpenAPI, zgodność klienta frontendowego i build — PASS.
- Backend: odizolowane testy emulatorowe eksportu i DSAR 15/15 — PASS; testy cloud 6/6 — PASS.
- Mobile: typecheck — PASS; testy klienta API 10/10 — PASS.
- Web: build produkcyjny — PASS; testy zachowania 28/28 — PASS.
- `git diff --check` we wszystkich trzech repozytoriach — PASS.
- Niezależny finalny QA — PASS, bez blockerów P0/P1. Agent nie powtarzał testów emulatorowych; wykonał niezależny przegląd kodu oraz własny typecheck/testy kontraktowe.

## Wynik

Zakres ODK-E2E-077 jest wdrożony i zweryfikowany automatycznie. Status pozostaje `FIXED_PENDING_RETEST`, ponieważ natywna walidacja iOS nadal jest blokowana przez istniejący błąd targetu `ExpoModulesJSI`, opisany już przy ODK-E2E-068.

## Ryzyka i warunki wdrożenia

- Produkcyjny nadawca wiadomości oraz jego szablony są zakresem następnego zadania ODK-E2E-069; bez niego publiczny kanał zwraca jawny stan niedostępności.
- Polityki TTL trzeba zastosować i potwierdzić osobno na każdym projekcie GCP przed promocją.
- Reissue, purge i legal hold pozostają w kolejnych zadaniach retencyjnych ODK-E2E-066/081.
- Po naprawie `ExpoModulesJSI` potrzebny jest natywny retest ekranu: konto/gość, reautoryzacja, duża odpowiedź, VoiceOver i powiększony tekst.

## Ocena po wdrożeniu

- Dopasowanie do celu i architektury: `0.92` — użyto wspólnej koperty, istniejącego eksportu, auth i panelu.
- Prostota: `0.83` — jeden model sprawy i minimalne dwa kanały odbioru, bez dodatkowego systemu workflow.
- Kontrola ryzyka: `0.90` — dane wrażliwe, tokeny, wykonanie i doręczenie mają rozdzielone granice i testy negatywne.
- Utrzymywalność: `0.88` — jeden kontrakt API, jawne przejścia i wspólna konfiguracja retencji.

## Następne zadanie

Przejść do `ODK-E2E-069` zgodnie z kolejnością realizacji.
