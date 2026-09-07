# ODK-E2E-003.3 — Create account: fokus pól formularza

Data raportu: 2026-09-07
Status: `VERIFIED_CLOSED` dla uzgodnionego zakresu statycznego i runtime; VoiceOver wyłączono z tego przebiegu decyzją właściciela.

## Autorzy i walidacja briefu

- Worker: `gpt-5.6-luna`, effort `max`.
- Niezależny QA: `gpt-5.6-luna`, effort `max`.
- Brief po redesignie: **0,84 — APPROVE**.
- Oceny składowe: cel/architektura **0,95**, prostota **0,88**, ryzyko **0,84**, utrzymywalność **0,86**. Wynik minimalny: **0,84**.

## Fakt bazowy i zmiana

Przed poprawką trzy pola Create account nie miały jednoznacznego wizualnego wyróżnienia fokusu. Dodano lokalny `emailFocused` dla pola email oraz opt-in `enableFocusHighlight` dla obu rejestracyjnych `AuthPasswordInput`. Każda instancja hasła ma własny stan i własne `onFocus`/`onBlur`; użycia recovery/reset zachowują dotychczasowy wygląd.

Focus używa `palette.primary`. Style błędu są nakładane po stylu focus, dlatego error ma priorytet. Ikona widoczności pozostaje osobnym `Pressable` i nie wywołuje sztucznego fokusu. Pola mają labels, `textContentType` i `returnKeyType`: email `emailAddress/next`, hasło i potwierdzenie `newPassword/next` oraz `newPassword/done`.

## Sprawdzone pliki, konfiguracja i flow

- `src/features/account/AccountEntryScreen.tsx` — pola rejestracji, `AuthPasswordInput`, kolejność stylów i Pressable widoczności.
- `src/application/account/accountIdentityComposition.test.ts` — opt-in focus, error priority i kontrakty pól.
- `src/locales/en/account.json`, `src/locales/pl/account.json` — labels/copy i wiek bez zmian.
- `src/theme/tokens.ts` — token `primary` użyty przez focus.
- `.maestro/account-register-e2e.yaml` — screenshoty fokusu email/password/confirmation oraz stany zgody.
- `package.json`, `tsconfig.json` — konfiguracja testów i typecheck.
- `~/.maestro/tests` — lokalne dowody i screenshot evidence; bez kopiowania do repozytorium.

## Zachowane kontrakty

- Copy wieku i pozostałe copy formularza pozostały bez zmian.
- Wywołanie `account.register(email, password, acceptedTerms)` pozostało bez zmian.
- Linki Legal (`ROUTES.TERMS_OF_SERVICE`, `ROUTES.PRIVACY_POLICY`) pozostały bez zmian.
- Nie zmieniono provider sign-in, Premium ani zachowania innych użyć `AuthPasswordInput`.

## Weryfikacja automatyczna

Wspólny pakiet QA/retestu zakończył się następująco:

- `node --import tsx --test src/application/account/accountIdentityComposition.test.ts` — **19/19**.
- `npm run typecheck` — **pass**.
- `npm run qa:static` — **pass**; recovery baseline: **352 source / 159 tests / 843 baseline cases**.
- `npm test` — **848/848**.
- `npm run validate:content-boundary` — **pass**.
- `npm run validate:runtime-privacy-boundary` — **pass**.

## Retest iOS i E2E

Retest wykonano na izolowanym iPhone 17 z iOS 26.4. Stara próba urządzeniowa została zablokowana przez brak klucza i nie usuwała danych. Świeży simulator baseline EN/light przeszedł. Kontrolny run z rzeczywistym `inputText` potwierdził klawiaturę oraz zmianę fokusu każdego z trzech pól. Po ustawieniu PL przez `Settings → Language`, PL/dark/accessibility-extra-extra-extra-large przeszedł po scrollu dla pristine/checked/unchecked i trzech fokusów.

Wyniki wizualne dla 003.3:

- Email otrzymuje wyraźny primary border tylko podczas fokusu.
- Password i confirmation mają niezależnie widoczny primary border podczas fokusu.
- Po pojawieniu się błędu border danger pozostaje nadrzędny wobec focus.
- Przełącznik widoczności pozostaje osobnym przyciskiem i nie powoduje sztucznego zaznaczenia pola.
- Checkbox zgody zachowuje jasny checked state, a recovery checkbox zachowuje swój wcześniejszy primary-fill/onPrimary-check.
- Klawiatura i układ pozostały używalne w EN/light, PL/dark i bardzo dużym tekście po scrollu.

## Dostępność i ograniczenia

VoiceOver nie był kryterium zamknięcia po decyzji właściciela z 2026-09-07 i nie deklaruję jego ręcznego odsłuchu. Kontrakty kodowe etykiet pól, roli/stanu checkboxa i live region alertu pozostały objęte przeglądem i testami statycznymi.

## Werdykt

Werdykt przed runtime: **PASS WITH GAPS**. Runtime potwierdził kontrakt fokusu, klawiatury i priorytetu błędu w uzgodnionym zakresie, a trwały flow i scope recovery zostały naprawione.
