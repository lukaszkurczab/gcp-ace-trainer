# Patternly — stan pracy

## Cel i zasady

Realizować wszystkie zadania z [planu](../docs/PATTERNLY-WORKING-PLAN.md) w pętli, lokalnie i bez wdrożenia. Przed każdym zadaniem sprawdzać API, Metro, emulatory oraz jedyny istniejący iPhone 17. Ogłaszać nazwę i cel każdego użytego skilla. Każdy slice wymaga briefingu `Cel / Ustalenia / Podejście`, niezależnego QA, aktualizacji planu, commitu i push na `main` właściwych repozytoriów.

## Repozytoria

| Repozytorium | Stan po B1c |
| --- | --- |
| `patternly` | B1c zawarte w bieżącym commicie na bazie `17628a4b`: klient Auth, typed reauth, testy, izolowany harness Firebase SDK, macierz 57 tras, raport, plan i ten stan. |
| `patternly-backend` | B1c wypchnięte na `main` jako `2a8c035`: test wyścigu wymiany sesji z obrotem generacji. |

## AUD-08/B1c — wynik

- Lokalny rezultat: **PASS WITH ISSUES** według niezależnego QA `gpt-6-luna/high`.
- Klient wymusza `getIdTokenResult(..., true)`, sprawdza UID przed i po odświeżeniu oraz odrzuca brakujący/błędny claim. `authorization_generation_stale` prowadzi do `account-reauthentication-required`.
- Backendowy test przypina generację 1, obraca konto do 2 przed zakończeniem mintu i potwierdza `401 authorization_generation_stale` na `/v1/me`.
- Izolowany Firebase JS SDK harness potwierdza claim po custom-token sign-in i force refresh oraz brak/błędny claim. Emulator nie dowodzi produkcyjnej walidacji podpisu.
- Maestro na istniejącym iPhonie 17, bez `clearState` i reinstalacji, potwierdziło oba selektory typed reauth po realnym bootstrapie. Pełne dane formularza sprawdzono przed submit w hierarchy i na prywatnym zrzucie. Zachowany profil Gościa nie został wyczyszczony ani przejęty.
- Macierz ponownie pokrywa 57/57 metod, ścieżek i profili. `legalRequests.confirmationStatus` jest kontynuacją doręczenia już zaakceptowanej trwałej sprawy; B1b4c nadal osobno czeka na decyzję PO o niejednoznacznym wyniku SMTP.
- Nie było wdrożenia. Starsze instalacje bez wymiany sesji mogą dostać 401 po przyszłym włączeniu egzekwowania claimu; wymaga to osobnej bramki dystrybucji.
- Recovery takeover i provider revoke nie zostały zmienione.

## Weryfikacja

- Aplikacja: testy ukierunkowane 44/44, typecheck i `git diff --check` — PASS.
- Backend: typecheck, `openapi:check` 57 operacji, test wyścigu 1/1 i `git diff --check` — PASS na poziomie testów wewnętrznych.
- Firebase JS SDK harness: 1/1 PASS na poziomie testu wewnętrznego.
- Oba wrappery Firebase CLI zwróciły kod 2 po zielonych testach dzieci, podczas końcowego update/MOTD config check. Nie raportować całych wrapperów jako PASS.
- Briefing przed wykonaniem: zgodność 0,92; prostota 0,88; ryzyko 0,82; utrzymywalność 0,90; minimum 0,82, APPROVE.

## Otwarte decyzje i blokady

- `AUD-08/B1b4c` — `WAIT/PO`: po SMTP accepted i awarii przed zapisem retry może dać duplikat/późną wiadomość, a brak retry może pozbawić klienta potwierdzenia. Nie implementować polityki bez odpowiedzi.
- `CI-CONTRACT/A2b` — WAIT na `AWS-02/CANDIDATE`.
- `PROFILE-02/B` — WAIT na zapisaną w planie decyzję PO.
- Brak wdrożenia jest granicą zakresu, nie defektem lokalnego B1c.

## Następne działania

1. Po pushu bieżącego commitu aplikacji potwierdzić oba `origin/main`.
2. Wybrać pierwszy rzeczywiście dostępny slice z kolejki. Kroki `CI-CONTRACT/A2b`, `PROFILE-02/B` i `B1b4c` ominąć tylko z powodu zapisanych zależności, nie jako porzucone zadania.
3. Przed następną implementacją wykonać nowy preflight i briefing walidacyjny.

Pełny cel pozostaje aktywny, dopóki wszystkie zadania planu nie mają wymaganych dowodów.
