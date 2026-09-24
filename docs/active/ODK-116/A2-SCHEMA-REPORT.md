# ODK-116/A2 — schema obecnych zmiennych prawnych

**Data:** 24.09.2026  
**Status:** wykonana schema dla obecnego źródła PL/EN; pełny ODK-116-A nadal otwarty.

W `src/legal/legalVariablesSchema.ts` jest niezależna, stała lista wymaganych pól obecnego `legalVariables.ts` i par `en`/`pl`. Walidator odrzuca brakujące lub dodatkowe pola, puste albo obcięte spacjami wartości i błędny typ przełącznika zakupu. Tryb testowy dopuszcza jawnie oznaczone pola do uzupełnienia. Tryb `release` wykrywa te placeholdery, podając ścieżki pól bez wypisywania ich wartości. Polecenie `npm run check:legal-variables -- --release` obecnie kończy się odmową, co jest poprawne przy braku prawdziwych danych PO. Zwykłe polecenie i lokalny start pozostają dostępne.

Schemat jest osobny od danych wejściowych: usunięcie pola ze źródła nie zmienia automatycznie kontraktu. Testy obejmują brak/dodatkowe pole, brak locale, puste, białe i obcięte spacjami wartości, tryby test/release, pełne syntetyczne dane oraz wynik CLI. Nie zmieniono szablonów, produktu zakupowego ani zachowania logowania.

**Weryfikacja:** test celowany 6/6 PASS, `npm run typecheck` PASS, `git diff --check` PASS; kontrola release zwraca 1 i wskazuje nierozwiązane pola. Niezależne QA `gpt-6-luna/high`: **PASS**; potwierdziło 78 ścieżek placeholderów bez wypisywania wartości oraz niezależność listy pól od danych źródłowych.

**Granica:** walidacja w tym slice potwierdza kształt i kompletność napisów oraz znane placeholdery, nie poprawność prawną, semantykę adresów, dat czy e-maili. A3 musi podłączyć prawdziwy rekord i bramkę wydania, a ODK-116-B dostarczyć wartości. Aktywne są dwa locale; pozostałe należą do ODK-117.

**Ocena przed zmianą:** zgodność 0,92; prostota 0,88; kontrola ryzyka 0,84; utrzymywalność 0,86; minimum **0,84**. Niezależny walidator `gpt-6-luna/high` zaakceptował briefing; wykonawca `gpt-6-luna/medium`.
