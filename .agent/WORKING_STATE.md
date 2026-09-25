# Patternly — stan pracy

## Cel i zasady

Realizować wszystkie zadania z [planu](../docs/PATTERNLY-WORKING-PLAN.md) w pętli, lokalnie i bez wdrożenia. Przed każdym zadaniem sprawdzać API, Metro, emulatory oraz jedyny istniejący iPhone 17. Ogłaszać nazwę i cel każdego użytego skilla. Każdy slice wymaga briefingu `Cel / Ustalenia / Podejście`, niezależnego QA, aktualizacji planu, commitu i push na `main` właściwych repozytoriów.

## Repozytoria

| Repozytorium | Stan po CI-CONTRACT/B |
| --- | --- |
| `patternly` | CI-CONTRACT/B wypchnięte jako `4f18da89`; bieżący diff realizuje i dokumentuje AUD-16. |
| `patternly-backend` | B1c wypchnięte na `main` jako `2a8c035`: test wyścigu wymiany sesji z obrotem generacji. |
| `patternly-content` | CI-CONTRACT/A2b wypchnięte na `master` jako `21707b6`. |

## CI-CONTRACT/A2b — wynik

- Status: **done / QA PASS**; content `21707b6`.
- Push/PR odtwarza exact draft/readiness i odrzuca niezgodne lub nieśledzone evidence.
- Acceptance v2 wiąże 9 Free-node packages z exact package SHA i zaakceptowanymi release artifacts; payload items są porównywane, a limity dekompresji blokują gzip bomb.
- Manual release kończy się oczekiwanym `RELEASE_BLOCKED` dla candidate `11d56baa…`; publishing/runtime nadal `not_granted`, brak deployu i zmiany app lock.
- Pełny content 67/67, gate 4/4, Free-node 9/9, migration 9/117/943/16 077, build/scoring 9/9, YAML i diff check — PASS.

## CI-CONTRACT/A3 — wynik

- Status: **done / QA PASS**.
- Historyczny release lock używa osobnego checkoutu dokładnego `producerCommit`; bieżący builder używa osobnego checkoutu `patternly-content/main`.
- Workflow rozpoznaje i loguje pełny SHA bieżącego checkoutu. Oba testy buildera wymagają tego SHA i porównują go z HEAD, więc brak konfiguracji nie daje pozornego PASS.
- Test cross-repo 3/3, negatywne brak/błąd SHA i root, `check:content-release` 9/117/943/16 077, typecheck, YAML i diff check — PASS.
- Pierwszy qa-gate wykrył opcjonalne SHA i brak logu; po poprawce końcowy niezależny QA: PASS.
- Briefing: 0,96 / 0,88 / 0,94 / 0,90, minimum 0,88 — APPROVE.
- Release lock, generated content, runtime i admission nie zostały zmienione; brak wdrożenia.

## CI-CONTRACT/B — wynik

- Status: **done / QA PASS**.
- `content-test-gate` uruchamia 67 testów contentu, w tym draft-v2, readiness-v2 i release-gate-v2, a końcowy agregator wymaga sukcesu.
- App gate używa osobnego historycznego checkoutu z release locka i exact-SHA bieżącego contentu; oba są sprawdzane przed i po gate’ach.
- Test kontraktu workflow 11/11, test cross-repo 3/3, content 67/67, YAML i diff check — PASS.
- Pełne `qa:static` nadal FAIL na istniejącym `recovery:check` dla czterech importów MMKV; nie jest raportowane jako PASS i nie wynika z diffu B.
- Briefing: 0,96 / 0,87 / 0,84 / 0,90, minimum 0,84 — APPROVE. Niezależny QA: PASS.
- Brak repinu, admission, publikacji i wdrożenia.

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

## AUD-16 — wynik

- Status: **done / niezależne QA PASS**; lokalnie, bez wdrożenia.
- EN i PL mieszczą pełną zgodę w dwóch liniach standardowego układu. PL brzmi: „Akceptuję Warunki korzystania i znam Politykę prywatności.”
- Oba linki, walidacja i boolean `acceptedTerms` pozostały zachowane. Etykieta dostępności checkboxa obejmuje pełną zgodę na Warunki i znajomość Polityki.
- Duży tekst rośnie do czterech linii bez obcięcia. Repozytoryjny flow Maestro przeszedł 1/1 na istniejącym iPhonie 17 bez `clearState`, reinstalacji i tworzenia konta.
- Testy ukierunkowane 33/33, typecheck i diff check — PASS. Prywatne zrzuty zostały obejrzane i nie trafiły do repozytorium.
- Briefing: 0,96 / 0,88 / 0,84 / 0,91, minimum 0,84 — APPROVE.

## Weryfikacja

- Aplikacja: testy ukierunkowane 44/44, typecheck i `git diff --check` — PASS.
- Backend: typecheck, `openapi:check` 57 operacji, test wyścigu 1/1 i `git diff --check` — PASS na poziomie testów wewnętrznych.
- Firebase JS SDK harness: 1/1 PASS na poziomie testu wewnętrznego.
- Oba wrappery Firebase CLI zwróciły kod 2 po zielonych testach dzieci, podczas końcowego update/MOTD config check. Nie raportować całych wrapperów jako PASS.
- Briefing przed wykonaniem: zgodność 0,92; prostota 0,88; ryzyko 0,82; utrzymywalność 0,90; minimum 0,82, APPROVE.

## Otwarte decyzje i blokady

- `AUD-08/B1b4c` — `WAIT/PO`: po SMTP accepted i awarii przed zapisem retry może dać duplikat/późną wiadomość, a brak retry może pozbawić klienta potwierdzenia. Nie implementować polityki bez odpowiedzi.
- `CI-CONTRACT/A2b`, `A3` i `B` — done; C pozostaje otwarte.
- `CI-CONTRACT/C` — wymagany exact-SHA run nie ma lokalnego PASS: blokują go brak JDK 21, brak Chromium Playwright, konflikty portów emulatorów oraz istniejący `recovery:check` dla czterech importów MMKV. Nie utożsamiać tego z hosted PASS.
- `PROFILE-02/B` — WAIT na zapisaną w planie decyzję PO.
- Brak wdrożenia jest granicą zakresu, nie defektem lokalnego B1c.

## Następne działania

1. Rozpocząć `ODK-119-GATE/A`, pierwszy niezależny READY slice po zapisaniu lokalnych blokad CI-CONTRACT/C.
2. Wrócić do `CI-CONTRACT/C`, gdy można wykonać właściwy exact-SHA etap bez omijania jego bramek.
3. AWS-02/ADMISSION pozostaje osobnym późniejszym krokiem.
4. Kroki `PROFILE-02/B` i `B1b4c` pozostają oczekujące wyłącznie na zapisane decyzje PO.

Pełny cel pozostaje aktywny, dopóki wszystkie zadania planu nie mają wymaganych dowodów.
