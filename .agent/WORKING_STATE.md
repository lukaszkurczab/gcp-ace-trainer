# Patternly — stan pracy

## Cel i zasady

Realizować wszystkie zadania z [planu](../docs/PATTERNLY-WORKING-PLAN.md) w pętli, lokalnie i bez wdrożenia. Przed każdym zadaniem sprawdzać API, Metro, emulatory oraz jedyny istniejący iPhone 17. Ogłaszać nazwę i cel każdego użytego skilla. Każdy slice wymaga briefingu `Cel / Ustalenia / Podejście`, niezależnego QA, aktualizacji planu, commitu i push na `main` właściwych repozytoriów.

## Repozytoria

| Repozytorium | Stan po SIMP-05 |
| --- | --- |
| `patternly` | B1c wypchnięte jako `aa5b26e3`; bieżący diff dokumentuje ponowną walidację SIMP-05 i synchronizuje plan. |
| `patternly-backend` | B1c wypchnięte na `main` jako `2a8c035`: test wyścigu wymiany sesji z obrotem generacji. |
| `patternly-content` | Czysty `master` `36fd693`; SIMP-05 bez zmian runtime, ponownie zweryfikowane z aktualnego consumer graph, ingressu i historii. |

## SIMP-05 — wynik

- Status: **done**; ponowna walidacja nie wykazała aktywnego równoległego formatu, adaptera ani fallbacku.
- Aplikacja konsumuje dziewięć artefaktów przez kanoniczny runtime; content ma jeden ingress, wspólny kontrakt i builder.
- Historyczny raport zatwierdzono w `08020ea` i celowo usunięto w `2623222`; nie przywrócono go jako drugiego aktywnego dokumentu.
- `patternly-content`: testy 60/60 i migration verifier PASS dla 9 tracków / 117 nodes / 943 mental units / 16 077 pytań.
- Briefing: 0,93 / 0,94 / 0,84 / 0,91, minimum 0,84 — APPROVE.
- Niezależne QA: PASS WITH ISSUES. `validateContentBoundary.mjs` i diff check
  przeszły; `checkRecoveryBaseline.mjs` wskazał cztery istniejące importy MMKV
  w obszarze konta, poza dokumentacyjnym diffem SIMP-05.
- Stare odwołania workflow do usuniętych generatorów i release gate pozostają luką `CI-CONTRACT/A2b`, zależną od `AWS-02/CANDIDATE`.

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

1. Rozpocząć `AWS-02/CANDIDATE`; nie naprawiać CI przez odtworzenie legacy publishera.
2. Po jego kandydacie wrócić do `CI-CONTRACT/A2b` według zależności planu.
3. Kroki `PROFILE-02/B` i `B1b4c` pozostają oczekujące wyłącznie na zapisane decyzje PO.

Pełny cel pozostaje aktywny, dopóki wszystkie zadania planu nie mają wymaganych dowodów.
