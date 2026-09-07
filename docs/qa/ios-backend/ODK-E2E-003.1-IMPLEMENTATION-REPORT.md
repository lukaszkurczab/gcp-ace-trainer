# ODK-E2E-003.1 — Create account: stan początkowy zgody

Data raportu: 2026-09-07
Status: `VERIFIED_CLOSED` dla uzgodnionego zakresu statycznego i runtime; VoiceOver wyłączono z tego przebiegu decyzją właściciela.

## Autorzy i walidacja briefu

- Worker: `gpt-5.6-luna`, effort `max`.
- Niezależny QA: `gpt-5.6-luna`, effort `max`.
- Brief po redesignie: **0,84 — APPROVE**.
- Oceny składowe: cel/architektura **0,95**, prostota **0,88**, ryzyko **0,84**, utrzymywalność **0,86**. Wynik minimalny: **0,84**.

## Fakt bazowy i zmiana

Przed poprawką `TermsAcceptance` renderował komunikat `termsRequired` wyłącznie na podstawie `!accepted`, więc ostrzeżenie było widoczne i ogłaszane natychmiast po wejściu w Create account. `acceptedTerms` pozostawał domenowym booleanem używanym przez submit i provider sign-in.

Formularz ma teraz osobny stan prezentacji `pristine | checked | uncheckedAfterInteraction`. Wejście w rejestrację ustawia `pristine`; pierwsze zaznaczenie ustawia `checked`; odznaczenie po interakcji ustawia `uncheckedAfterInteraction`. Alert jest renderowany wyłącznie dla `uncheckedAfterInteraction && !accepted`, a ponowne zaznaczenie usuwa go. Przycisk Create account nadal pozostaje disabled, gdy `acceptedTerms === false`.

## Sprawdzone pliki, konfiguracja i flow

- `src/features/account/AccountEntryScreen.tsx` — stan zgody, `TermsAcceptance`, submit i kontrakty Legal/provider.
- `src/application/account/accountIdentityComposition.test.ts` — kontrakty stanu prezentacji i zachowania domeny.
- `src/locales/en/account.json`, `src/locales/pl/account.json` — zachowanie copy oraz granicy wieku.
- `src/theme/tokens.ts` — źródło tokenów `primary` i `onPrimary`.
- `.maestro/account-register-e2e.yaml` — trwały, śledzony flow bazowy EN/light.
- `.gitignore` — wyjątek wyłącznie dla powyższego flow.
- `~/.maestro/tests` — lokalne dowody przejść; nie są kopiowane do repozytorium.

## Zachowane kontrakty

- Copy wieku pozostało bez zmian: EN `Confirm that you are at least 18 and agree to the Terms of Service to create an account.`, PL `Potwierdź, że masz co najmniej 18 lat, i zaakceptuj Warunki korzystania, aby utworzyć konto.`
- Wywołanie `account.register(email, password, acceptedTerms)` pozostało bez zmian.
- Linki `ROUTES.TERMS_OF_SERVICE` i `ROUTES.PRIVACY_POLICY` pozostały bez zmian.
- Nie zmieniono provider sign-in, Premium ani żadnego kontraktu Legal.

## Weryfikacja automatyczna

Wspólny pakiet QA/retestu zakończył się następująco:

- `node --import tsx --test src/application/account/accountIdentityComposition.test.ts` — **19/19**.
- `npm run typecheck` — **pass**.
- `npm run qa:static` — **pass**; recovery baseline: **352 source / 159 tests / 843 baseline cases**.
- `npm test` — **848/848**.
- `npm run validate:content-boundary` — **pass**.
- `npm run validate:runtime-privacy-boundary` — **pass**.

## Retest iOS i E2E

Retest wykonano na izolowanym iPhone 17 z iOS 26.4. Pierwsza próba na starym urządzeniu została zablokowana przez brak klucza; nie usuwano danych. Świeży simulator baseline EN/light przeszedł. Kontrolny run z rzeczywistym `inputText` potwierdził działanie klawiatury i fokusu trzech pól. Następnie ustawiono PL przez `Settings → Language`; wariant PL/dark/accessibility-extra-extra-extra-large przeszedł po scrollu dla stanów pristine/checked/unchecked oraz trzech fokusów.

Wyniki wizualne dla 003.1:

- `pristine`: formularz otwiera się bez komunikatu zgody; Create account jest disabled.
- `checked`: komunikat nie jest obecny; submit jest enabled.
- `uncheckedAfterInteraction`: komunikat zgody jest widoczny; submit wraca do disabled.
- `rechecked`: komunikat znika, a submit jest enabled.
- W stanach `checked`/`rechecked` checkbox ma jasne wypełnienie tokenem `palette.onPrimary`, primary border i primary check; wariant recovery pozostaje bez zmian.
- Układ zachował czytelność po scrollu w PL, dark mode i bardzo dużym tekście.

## Dostępność i ograniczenia

VoiceOver nie był kryterium zamknięcia po decyzji właściciela z 2026-09-07 i nie deklaruję jego ręcznego odsłuchu. Kontrakty kodowe `accessibilityRole`, `accessibilityState`, etykiety oraz live region alertu pozostały objęte przeglądem i testami statycznymi.

## Werdykt

Werdykt przed runtime: **PASS WITH GAPS**. Po poprawce trwałego flow i scope fixie checkboxa runtime zamknął luki w uzgodnionym zakresie: stan początkowy nie pokazuje błędu, akceptacja steruje submit, a recheck usuwa alert.
