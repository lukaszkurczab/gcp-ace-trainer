# AUD-15 — usunięcie redundantnych badge odpowiedzi

**Status:** `blocking` dla końcowego odbioru wizualnego i dostępności; implementacja lokalna gotowa  
**Data:** 23 września 2026  
**Repozytorium:** `patternly`

## Cel i zakres

Zgodnie z decyzją PO usunięto powtarzające informację badge ze wspólnej karty odpowiedzi w sesji i review. Zachowano treść, literę, stan karty oraz ogłoszenia dostępności. Nie zmieniano scoringu, treści pytań, journal ani recovery.

## Zmiany

- `src/components/AnswerOption.tsx`: usunięto `statusLabel`, widoczny wiersz badge, helpery `statusStyle`, `statusTextStyle`, `statusIcon` i powiązane style. Po tekście odpowiedzi nie pozostaje pusty wiersz; karta renderuje treść bez dodatkowego potomka statusu.
- `src/features/practice/PracticeResponseControls.tsx` i `src/features/review/AnswerReviewScreen.tsx`: usunięto przekazywanie statusu prezentacyjnego. Pozostają `accessibilityLabel`, `accessibilityState.checked` oraz `accessibilityValue`, zawierające poprawność i wybór.
- `src/features/practice/practiceAnswerFeedbackPresentation.test.ts`: zastąpiono test poprzedniego badge asercjami braku badge, rozróżnienia ramek dla correct/incorrect/omitted-correct/not-selected/selected oraz zachowania semantyki dostępności dla sesji i review.
- Sprawdzenie referencji potwierdza brak pozostałych użyć starego API/helperów; inne `statusBadge`/`statusLabel` w aplikacji dotyczą niezależnych ekranów i modeli.

## Niezależna ocena przed implementacją

Briefing-only walidator `gpt-6-luna` / `high` zatwierdził zakres bez inspekcji repozytorium: zgodność `0.96`, prostota `0.94`, akceptowalność ryzyka `0.88`, utrzymywalność `0.93`; minimum `0.88`. Główne ryzyka: niechciane usunięcie semantyki dostępności, zatarcie różnicy pominiętej poprawnej odpowiedzi i odpowiedzi niewybranej oraz pozostawienie rezerwacji układu.

## Weryfikacja

- `node --import tsx --test src/features/practice/practiceAnswerFeedbackPresentation.test.ts src/tracks/coding-interview/algorithmsSessionAccessibility.test.ts` — PASS, 17/17.
- `rg` dla `statusLabel` i badge/helperów w kodzie quizu potwierdził usunięcie starej ścieżki; wyniki poza nią dotyczą innych, niezależnych statusów.
- `git diff --check` — PASS.
- `npm run typecheck` — PASS po naprawie brakujących typów w `AccountEntryScreen.tsx` podczas AUD-17.
- iPhone 17 (`7F315654-3175-4F3C-BB24-B0263F59360C`) i lokalne usługi działają; Maestro potwierdził bieżący ekran Account Entry, ale to nie jest powierzchnia AUD-15. Z katalogu repozytorium `patternly/` uruchomiono `maestro --device 7F315654-3175-4F3C-BB24-B0263F59360C test docs/active/AUD-15/evidence/account-entry-bootstrap-recovery.yaml`; flow ma `clearState: false`, czeka na `Continue without an account`, asertuje `Sign in`, `Create account` oraz brak `Application unavailable` i bootstrap error, a następnie zapisuje screenshot. Wynik **PASS**. Zrzut dowodowy z 23.09.2026, 20:43 CEST: [Account Entry](evidence/account-entry-bootstrap-recovered.png). Flow uruchomił tylko aplikację i wykonał asercje. Nie uruchomiono flow odpowiedzi/review: istniejące kandydaty Maestro resetują stan albo tworzą/zapisują odpowiedzi w aktywnym profilu, a brak niezależnego syntetycznego fixture. Przy zachowaniu obecnych danych i bez `clearState` brak bezpiecznej drogi do wymaganego zestawu stanów. Nie zmieniano preferencji urządzenia, nie resetowano danych i nie dodawano prób do lokalnego profilu.

## Warunek odblokowania

Przygotować deterministyczny, odseparowany fixture odpowiedzi i review, który nie czyści ani nie zapisuje do bieżącego profilu; następnie na tym samym istniejącym iPhonie 17 zebrać screenshoty przed/po po polsku i angielsku, także przy dużej czcionce. Sprawdzić stany poprawne, błędne, pominięte poprawne i niewybrane dla single/multi select oraz wynik review. VoiceOver ma ogłaszać treść, wybór i poprawność. Nie resetować urządzenia ani danych.

## Ocena podejścia

Zgodność `0.96`, prostota `0.94`, akceptowalność ryzyka `0.88`, utrzymywalność `0.93`; minimum `0.88`. Zmiana ogranicza się do wspólnego UI komponentu, jego dwóch konsumentów i kontraktowego testu prezentacji. Pozostałe ryzyko to brak urządzeniowego dowodu wizualnego i VoiceOver oraz niezależny błąd typecheck w bazowym kodzie konta.
