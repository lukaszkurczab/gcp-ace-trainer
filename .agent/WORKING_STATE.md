# Patternly — stan pracy

## Cel i zasady

Realizować wszystkie zadania z [planu](../docs/PATTERNLY-WORKING-PLAN.md) w pętli, lokalnie i bez wdrożenia. Przed każdym zadaniem sprawdzać API, Metro, emulatory oraz jedyny istniejący iPhone 17. Ogłaszać nazwę i cel każdego użytego skilla. Każdy slice wymaga briefingu `Cel / Ustalenia / Podejście`, niezależnego QA, aktualizacji planu, commitu i push na `main` właściwych repozytoriów.

## Repozytoria

| Repozytorium | Stan po CI-CONTRACT/A2b |
| --- | --- |
| `patternly` | AWS-02/CANDIDATE wypchnięte jako `eb6e2889`; bieżący diff dokumentuje A2b i synchronizuje kolejkę. |
| `patternly-backend` | B1c wypchnięte na `main` jako `2a8c035`: test wyścigu wymiany sesji z obrotem generacji. |
| `patternly-content` | CI-CONTRACT/A2b wypchnięte na `master` jako `21707b6`. |

## CI-CONTRACT/A2b — wynik

- Status: **done / QA PASS**; content `21707b6`.
- Push/PR odtwarza exact draft/readiness i odrzuca niezgodne lub nieśledzone evidence.
- Acceptance v2 wiąże 9 Free-node packages z exact package SHA i zaakceptowanymi release artifacts; payload items są porównywane, a limity dekompresji blokują gzip bomb.
- Manual release kończy się oczekiwanym `RELEASE_BLOCKED` dla candidate `11d56baa…`; publishing/runtime nadal `not_granted`, brak deployu i zmiany app lock.
- Pełny content 67/67, gate 4/4, Free-node 9/9, migration 9/117/943/16 077, build/scoring 9/9, YAML i diff check — PASS.

## AWS-02/CANDIDATE — wynik

- Status: **done / PASS WITH ISSUES**; exact candidate `11d56baa82f897482a6def37d2af6bd90977b855a2fd5ddcb151838c7108a5f1`.
- Decyzja `delegated_codex` według DEC-23 wiąże 9 tracków, source snapshot `79060003…`, release `617f2216…` i wszystkie hashe pytań/artefaktów.
- Readiness v2 zatwierdza wyłącznie kandydata. Publishing/runtime pozostają `not_granted`, app release lock bez zmian; historyczne v1 i human approval nietknięte.
- Pierwsze QA wykryło, że `git diff` pomija untracked JSON. Pełny guard ścieżek, trybów i Git blob IDs oraz izolowany test regresji naprawiły lukę; retest QA: PASS WITH ISSUES.
- Weryfikacja: targeted 2/2 i 1/1, pełny content 63/63, migration 9/117/943/16 077 z 36 dodatkami ODK-096, draft/readiness generators i diff check — PASS.
- Briefing: 0,94 / 0,84 / 0,84 / 0,84, minimum 0,84 — APPROVE.

## SIMP-05 — wynik

- Status: **done**; ponowna walidacja nie wykazała aktywnego równoległego formatu, adaptera ani fallbacku.
- Aplikacja konsumuje dziewięć artefaktów przez kanoniczny runtime; content ma jeden ingress, wspólny kontrakt i builder.
- Historyczny raport zatwierdzono w `08020ea` i celowo usunięto w `2623222`; nie przywrócono go jako drugiego aktywnego dokumentu.
- `patternly-content`: testy 60/60 i migration verifier PASS dla 9 tracków / 117 nodes / 943 mental units / 16 077 pytań.
- Briefing: 0,93 / 0,94 / 0,84 / 0,91, minimum 0,84 — APPROVE.
- Niezależne QA: PASS WITH ISSUES. `validateContentBoundary.mjs` i diff check
  przeszły; `checkRecoveryBaseline.mjs` wskazał cztery istniejące importy MMKV
  w obszarze konta, poza dokumentacyjnym diffem SIMP-05.
- Stare odwołania workflow do usuniętych generatorów i release gate zostały zastąpione rzeczywistymi bramkami A2b w `21707b6`.

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
- `CI-CONTRACT/A2b` — done; A3/B/C pozostają otwarte.
- `PROFILE-02/B` — WAIT na zapisaną w planie decyzję PO.
- Brak wdrożenia jest granicą zakresu, nie defektem lokalnego B1c.

## Następne działania

1. Rozpocząć `CI-CONTRACT/A3`, następny dostępny slice: rozdzielić historyczny release lock od exact SHA bieżącego buildera w app QA.
2. CI-CONTRACT/B/C i AWS-02/ADMISSION pozostają osobnymi późniejszymi krokami.
3. Kroki `PROFILE-02/B` i `B1b4c` pozostają oczekujące wyłącznie na zapisane decyzje PO.

Pełny cel pozostaje aktywny, dopóki wszystkie zadania planu nie mają wymaganych dowodów.
