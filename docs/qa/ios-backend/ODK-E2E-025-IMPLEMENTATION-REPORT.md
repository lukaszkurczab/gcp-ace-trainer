# ODK-E2E-025 — projekt godzin

Status: BLOCKED. Licznik próśb PO: 5/5. Projekt i specyfikacja gotowe. Bez implementacji.

## Wykonano

Sprawdzono obecny ekran, bottom sheet, lokalizacje, model celu i tokeny. Maestro2026-09-08_045809 przechwycił edytor bez zapisu i zmiany uprawnień. Obejrzano zrzut. Trzy osobne wywołania ImageGen otrzymały ten zrzut. Każdy wynik pokazano raz. Kolejność1–3 jest zapisana w ODK-E2E-025-DESIGN-SPEC.md.

Brief został niezależnie zatwierdzony przez gpt-5.6-luna / max. Minimum początkowe0,87. Po doprecyzowaniu szkicu i nowego dnia0,91. Spec opisuje oba tryby, nowe dni, anulowanie, błędy, EN/PL, motywy i duży tekst. Nie rozstrzyga zakresu024.

## Prośby PO

1. Po pokazaniu wszystkich obrazów zapytano o wybór1/2/3 albo poprawki. Brak odpowiedzi.
2. Po zapisaniu spec przekazano regułę szkicu i prostą różnicę obsługi: segmenty/lista, checkbox/lista, wybór dnia/jedno pole. Ponownie poproszono o numer. Brak odpowiedzi.

3. Po niezależnym QA i uzupełnieniu lokalizacji oraz dużego tekstu poproszono o sam numer. Brak odpowiedzi.

4. Polecono wariant1, bo pokazuje oba tryby i wszystkie godziny. Pytanie uproszczono do Tak1 albo2/3. Brak odpowiedzi.

5. Ostatnia prośba po przygotowaniu projektów, spec i QA. Wyjaśniono, że brak wyboru spowoduje BLOCKED i przejście do044. Brak odpowiedzi. Zadanie pozostaje aktywne jako BLOCKED. Wymagana decyzja: wybór projektu 1, 2 albo 3 lub wskazanie zmian.

## Weryfikacja i ograniczenia

Obrazy obejrzano. Są kierunkami wizualnymi, nie działającą aplikacją. Spec wskazuje odstępstwa generatora: gradienty, kontrast wybranego dnia w3 i dodatkowy blok tła w2. Nie należy ich przenosić do kodu. Nie wykonano testów wdrożenia025 ani retestu obu nowych trybów. Nie utworzono zadania wdrożeniowego przed wyborem PO. Brak zatwierdzenia oznacza, że025 pozostaje aktywne. Materiały są tymczasowe do zakończenia ścieżki.

Niezależne QA projektu, gpt-5.6-luna / max: PASS warunkowy. Uzupełniono pełną tabelę copy EN/PL, skróty dni, token light bottomSheet oraz źródło tracka przy wejściu z Settings. Brak dowodu7dni/2×/klawiatura pozostaje jawnym wymogiem przyszłego wdrożenia. Nie zmieniono kodu.
