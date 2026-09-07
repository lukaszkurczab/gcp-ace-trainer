# ODK-E2E-003.2 — Create account: wizualny stan checkboxa

Data raportu: 2026-09-07
Status: `VERIFIED_CLOSED` dla uzgodnionego zakresu statycznego i runtime; VoiceOver wyłączono z tego przebiegu decyzją właściciela.

## Autorzy i walidacja briefu

- Worker: `gpt-5.6-luna`, effort `max`.
- Niezależny QA: `gpt-5.6-luna`, effort `max`.
- Brief po redesignie: **0,84 — APPROVE**.
- Oceny składowe: cel/architektura **0,95**, prostota **0,88**, ryzyko **0,84**, utrzymywalność **0,86**. Wynik minimalny: **0,84**.

## Fakt bazowy i zmiana

Przed poprawką checkbox zgody używał `termsCheckboxChecked` z wypełnieniem `palette.primary`, co nie spełniało wymogu jasnego, jednoznacznego zaznaczenia. Ten sam styl był współdzielony z `account-recovery-codes-saved-checkbox`.

`TermsAcceptance` używa teraz osobnych tokenowych stylów `termsAcceptanceCheckboxChecked` i `termsAcceptanceCheckboxIcon`: odpowiednio jasne `palette.onPrimary` fill, `palette.primary` border i `palette.primary` check. Recovery codes zachowują dokładnie wcześniejszy wariant `palette.primary` fill oraz `palette.onPrimary` check. Nie użyto literalnych kolorów.

## Sprawdzone pliki, konfiguracja i flow

- `src/features/account/AccountEntryScreen.tsx` — oba warianty checkboxa, provider row i recovery codes.
- `src/application/account/accountIdentityComposition.test.ts` — rozdzielenie stylów oraz regresja recovery.
- `src/theme/tokens.ts` — tokeny `primary`/`onPrimary`.
- `src/locales/en/account.json`, `src/locales/pl/account.json` — brak zmian copy.
- `.maestro/account-register-e2e.yaml` — trwały flow stanów checkboxa i submit.
- `.gitignore` — precyzyjny wyjątek dla flow.
- `~/.maestro/tests` — lokalne dowody wizualne; nie są częścią repozytorium.

## Zachowane kontrakty

- Wiek i copy pozostały bez zmian w EN/PL.
- `account.register(email, password, acceptedTerms)` pozostało bez zmian.
- Linki Terms of Service/Privacy Policy pozostały bez zmian.
- Nie zmieniono provider sign-in, Premium ani kontraktów Legal.
- Recovery checkbox zachowuje wcześniejszy primary-fill/onPrimary-check, mimo nowego wyglądu checkboxa zgody.

## Weryfikacja automatyczna

Wspólny pakiet QA/retestu zakończył się następująco:

- `node --import tsx --test src/application/account/accountIdentityComposition.test.ts` — **19/19**.
- `npm run typecheck` — **pass**.
- `npm run qa:static` — **pass**; recovery baseline: **352 source / 159 tests / 843 baseline cases**.
- `npm test` — **848/848**.
- `npm run validate:content-boundary` — **pass**.
- `npm run validate:runtime-privacy-boundary` — **pass**.

## Retest iOS i E2E

Retest wykonano na izolowanym iPhone 17 z iOS 26.4. Próba na starym urządzeniu została zatrzymana przez brak klucza, bez usuwania danych. Świeży simulator baseline EN/light przeszedł. Realny `inputText` potwierdził działanie klawiatury i fokusu trzech pól. Po ustawieniu PL przez `Settings → Language` wariant PL/dark/accessibility-extra-extra-extra-large przeszedł po scrollu przez pristine/checked/unchecked oraz trzy pola fokusowe.

Wyniki wizualne dla 003.2:

- `pristine` i `uncheckedAfterInteraction`: checkbox pozostaje nieaktywny; w drugim stanie widoczny jest inline alert.
- `checked` i `rechecked`: jasne wypełnienie `palette.onPrimary`, primary border i primary check są jednoznaczne; alert jest nieobecny, a submit enabled.
- Recovery codes nie przejęły nowego jasnego wariantu: ich zaznaczenie zachowuje primary fill i onPrimary check.
- PL, dark mode i bardzo duży tekst zachowały czytelność po scrollu.

## Dostępność i ograniczenia

VoiceOver nie był kryterium zamknięcia po decyzji właściciela z 2026-09-07 i nie deklaruję jego ręcznego odsłuchu. Kontrakty kodowe roli, stanu zaznaczenia, etykiety i live region alertu pozostały objęte przeglądem i testami statycznymi.

## Werdykt

Werdykt przed runtime: **PASS WITH GAPS**. Po runtime oraz poprawce rozdzielającej scope recovery luki w uzgodnionym zakresie zostały zamknięte: jasny stan zgody jest widoczny w Create account, a recovery zachowuje poprzedni kontrakt.
