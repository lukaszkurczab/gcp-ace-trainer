# AUD-11 — ekran odzyskiwania niedostępnych danych

**Status:** `blocking` dla odbioru wizualnego; implementacja lokalna gotowa  
**Data:** 23 września 2026  
**Repozytorium:** `patternly`  

## Zmiany

- Na `EncryptedStorageRecoverySurface` marka jest większa (36 pt zamiast 28) i zaczyna się wyżej; ekran układa treść od góry zamiast centrować cały długi przepływ.
- EN/PL krótko nazywają brak lokalnego klucza i konsekwencję dla niesynchronizowanych sesji/postępu gościa. Drugi opis wyjaśnia, że dane konta zapisane w chmurze pozostaną dostępne.
- Widoczny opis „Przytrzymaj przez co najmniej 3 sekundy…” usunięto z powierzchni. `HoldToConfirmButton` nadal udostępnia go jako `accessibilityHint`, a kontroler zachowuje minimum 3 sekundy i anulowanie po wcześniejszym puszczeniu.
- Destrukcyjna akcja przytrzymania ma neutralny, obramowany wariant o mniejszej wysokości zamiast czerwonej, dominującej karty. Zwykłe użycie `HoldToConfirmButton` zachowuje swój domyślny wariant destrukcyjny.
- W `ContentPreparationGate` ręczne retry utraty klucza ma licznik w `useRef`: initial automatic bootstrap go nie zużywa; próba rezerwuje się tylko raz, licznik zwiększa się po nieudanym zakończeniu, retry znika po piątej porażce, a udany bootstrap zeruje epizod. Stan pozostaje przy rerenderze i powrocie aplikacji z tła; nie zapisuje się do storage. Usuwanie danych i reset deweloperski nie rezerwują retry.
- Usunięto nieużywane wpisy tekstów EN/PL po sprawdzeniu wszystkich konsumentów. Pozostałe katalogi locale w aplikacji nie istnieją (runtime obecnie zawiera `en` i `pl`).

## Niezależna ocena przed implementacją

Repo-specific briefing-only Luna High review zatwierdził zakres: zgodność `0.92`, prostota `0.84`, akceptowalność ryzyka `0.82`, utrzymywalność `0.86`; minimum `0.82`. Ryzyko liczników podwójnie rozliczonych prób ograniczono jedną ścieżką `complete`: zadziała najwyżej raz dla danego zakończonego bootstrapu; helper ignoruje settlement, gdy nie ma aktywnej rezerwacji. Walidator nie przeglądał repozytorium.

## Weryfikacja

- `node --import tsx --test src/content/application/contentPreparationRecovery.test.ts src/content/application/manualRetryLimit.test.ts src/components/holdToConfirmGesture.test.ts` — PASS, 27/27.
- `npm run typecheck` — PASS.
- JSON EN/PL — poprawny; `git diff --check` — PASS.
- Nie wykonywano screenshotów po zmianie, testu dużej czcionki ani runtime kontroli PL/EN: CoreSimulatorService było niedostępne przy początku pracy. API `127.0.0.1:8080/ready` również nie odpowiadało. Firebase Auth/Firestore emulatory (19099/18081) pozostawiono działające. Nie uruchamiano ani nie resetowano usług, aplikacji, iPhone’a 17 ani danych konta.

## Warunek odblokowania

Na tym samym istniejącym iPhonie 17, po bezpiecznym przywróceniu dostępu do działającego symulatora, zebrać porównywalny screenshot przed/po w PL i EN, sprawdzić dużą czcionkę, wizualne przesunięcie logo, drugorzędną hierarchię akcji, czytelność stanu limitu oraz zachowanie VoiceOver/destructive hold. Nie resetować danych. Do czasu tego retestu lokalny PASS nie zamyka visual/runtime acceptance AUD-11.

## Ocena podejścia

Zgodność `0.92`, prostota `0.84`, akceptowalność ryzyka `0.82`, utrzymywalność `0.86`; minimum `0.82`. Licznik pozostał procesowy, bez tworzenia nowego źródła danych. Główne ryzyko resztkowe to brak dowodu z istniejącego urządzenia na odczyt i hierarchię wizualną po zmianach.
