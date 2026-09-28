# UI-26-07 — raport odbioru

## Wynik

Ekran brakującego klucza ma jedną hierarchię bazową, destrukcyjną akcję przytrzymania i osobny, wycentrowany stan sukcesu. Operacja kryptograficzna, limit retry, czas przytrzymania i routing nie zostały zmienione.

## Ocena podejścia przed zmianą

| Kryterium | Ocena | Uzasadnienie |
| --- | ---: | --- |
| Spójność z celem i architekturą | 0,96 | Zmiana pozostaje w istniejącym `EncryptedStorageRecoverySurface`, locale i testach prezentacji. |
| Prostota | 0,91 | Jedna kanoniczna gałąź recovery i jedna izolowana gałąź sukcesu, bez nowej abstrakcji. |
| Ryzyko | 0,86 | Destrukcyjna operacja nie została zmieniona; runtime wykrył i pozwolił usunąć lokalny defekt szerokości przy dużym tekście. |
| Utrzymywalność | 0,93 | Wspólny `HoldToConfirmButton` zachowuje API, a responsywność poprawiono lokalnie bez zmiany globalnego `Screen`. |

Wynik minimalny: **0,86**. Niezależna walidacja briefingu i korekty responsywności na GPT-6 Luna High zatwierdziła oba podejścia.

## Zmiana

- Bazowy blok recovery jest wycentrowany w dostępnej przestrzeni, a ikona dokumentu/tarczy jest większa.
- Usunięto powtórzony nagłówek sekcji i zapewnienie o danych chmurowych z bazowego stanu.
- Dodano jawne ostrzeżenie o trwałej utracie niewysłanych sesji i postępu Gościa przechowywanego tylko lokalnie.
- Widoczna i dostępna nazwa akcji brzmi `Remove unavailable data`; instrukcja trzech sekund pozostaje w `accessibilityHint`.
- Hold korzysta z istniejącego wariantu `destructive` oraz jego semantycznych tokenów.
- Ostrzeżenie o konsekwencji poprzedza bezpieczny retry, zgodnie z kolejnością problem → konsekwencja → retry → destrukcyjna akcja.
- `removing` nadal blokuje ponowne uruchomienie i komunikuje trwanie; `error` zachowuje alert, diagnostykę, retry usuwania i powrót bez redundantnego, wyłączonego retry bootstrapu.
- Sukces renderuje wyłącznie ikonę, wynik, informację o niezmienionych danych chmurowych i `Continue`.
- Lokalne ograniczenie szerokości wycentrowanych bloków zapewnia zawijanie zamiast poziomego clippingu przy największym Dynamic Type.
- Zmiana copy została wykonana dla EN/PL/DE/FR/ES/IT/ET; usunięto martwe klucze starego hold, bazowego zapewnienia o chmurze i powtórzonego komunikatu sukcesu.

## Weryfikacja

| Dowód | Wynik |
| --- | --- |
| Targeted recovery/audit/locale/hold suite | PASS — 37/37 po finalnej korekcie |
| `npm run typecheck` | PASS |
| `git diff --check` | PASS |
| `npm test` | 1439 PASS / 3 FAIL uruchomione bez wymaganych wejść cross-repo; dokładnie te trzy testy przeszły 3/3 po podaniu historycznego checkoutu `cc3efca…`, bieżącego content SHA `010930a…` i `PATTERNLY_CONTENT_EXPECTED_CURRENT_SHA`. |
| Runtime: bazowy ekran na bieżącym Metro | PASS — jedna hierarchia i destructive hold. |
| Runtime: realne przytrzymanie 3,5 s, usunięcie lokalnych danych, izolowany sukces i `Continue` | PASS |
| Runtime: development/smoke-only, niemutujący stan `error` z alertem, diagnostyką, retry removal i `Return` | PASS |
| Maestro: `accessibility-extra-extra-extra-large` | Pierwszy screenshot wykrył poziomy clipping; po lokalnej korekcie tekst zawija się, a retry i hold są osiągalne po scrollu — PASS. |

Test zachowania wykonał prawdziwą lokalną operację usunięcia na istniejącym iPhonie 17. Screenshot sukcesu potwierdza wyłącznie prezentację; powodzenie operacji potwierdził przebieg runtime i przejście przez `Continue` do ekranu Gościa.

## Evidence robocze

- bazowy stan bieżącego bundle: `/tmp/ui-26-07-base-current-bundle.png`
- stan error bieżącego bundle: `/tmp/ui-26-07-error-current-bundle.png`
- realny sukces po lokalnym usunięciu: `/tmp/ui-26-07-real-success-current.png`
- duży tekst po poprawce i przewinięciu: `/tmp/ui-26-07-maestro-large-text/2026-09-28_192816/ui-26-07-large-text/takeScreenshot/ui-26-07-large-text-scrolled-fixed.png`

Pliki w `/tmp` są krótkotrwałym evidence lokalnym i nie należą do produktu. Historia Git archiwizuje ten raport; po zamknięciu zadania raport zostanie usunięty z aktywnego drzewa.

## Ograniczenia i ryzyko resztkowe

- Stan `error` pokazano przez istniejącą granicę runtime audit rozszerzoną o development-only/smoke-only, niemutujący fixture. Nie symuluje on samego błędu storage; dowodzi prezentacji aktywnej produkcyjnej gałęzi komponentu bez wykonywania operacji.
- Zgodnie z decyzją właściciela nie wykonywano testu VoiceOver i nie jest on kryterium odbioru. Kontrakty accessibility w kodzie i testach pozostają zachowane.
- Dolny pasek debuggera Expo pojawia się na screenshotach deweloperskich i nie jest elementem UI produktu.

## Środowisko końcowe

- aplikacja: `patternly` `57fc2d05f3f1275e4f658bb4fcd2c9d7d7a026e4` + diff UI-26-07;
- content: `010930a3f47648dcc88eeee2ff28f3ec62cf58f6`;
- urządzenie: istniejący iPhone 17 Simulator, iOS 26.4, UDID `7F315654-3175-4F3C-BB24-B0263F59360C`;
- runtime: smoke Metro, lokalny smoke backend, Firebase Auth `19099` i Firestore `18081`; fixture nie jest dowodem providera ani produkcji.

## Niezależny odbiór

`qa-gate` na GPT-6 Luna High: **PASS**. Agent niezależnie przejrzał finalny diff i runtime artifacts oraz uruchomił targeted 28/28, typecheck i diff-check. Nie stwierdził utraty ostrzeżenia, semantyki destructive, stanów błędu/sukcesu ani zmiany operacji, limitu retry, czasu hold lub routingu. VoiceOver pozostał jawnie poza odbiorem zgodnie z decyzją właściciela.
