# AUD-03 — selekcja pytań zwiększająca pokrycie

**Status:** `done` dla lokalnego zakresu AUD-03  
**Data:** 23 września 2026  
**Repozytorium:** `patternly`  

## Wynik

Zwykłe tryby `node` używają jednego deterministycznego selectora zamiast pobierania prefiksu puli. Selector działa na puli już ograniczonej przez katalog do właściwego tracka/node/profile/Free boundary. Uwzględnia tylko próby tego tracka i dokładnego pina contentu, których pytanie należy do aktualnej puli.

Kolejność jest leksykograficzna: (1) jednostki bez historycznie ćwiczonych pytań, (2) pytania bez własnych prób, (3) niższy stosunek pokrytych kwalifikujących się pytań w jednostce, z pokryciem jednostek aktualizowanym po każdym wyborze w bieżącym planie, (4) mniejsza liczba prób pytania, (5) stabilna pozycja pytania w puli. Rozmiar mianownika pochodzi tylko z aktualnej kwalifikującej się puli. Pytanie nie staje się „ćwiczone” od samego faktu, że próbowano inne pytanie w jego jednostce.

Tryby `exact_ordered_questions` oraz `evidence_conditioned` zachowują swoje dotychczasowe ścieżki. Sesja nadal zapisuje wybrany `itemOrder` i kolejność opcji przed rozpoczęciem; `validateResume` weryfikuje przypięty, niezmienny plan.

## Zmiany

- `src/application/canonical/practiceQuestionSelector.ts` — wspólna deterministyczna selekcja, kontrola wejść, zakres historii, priorytet pokrycia i shortfall przy wyczerpaniu.
- `src/application/canonical/CanonicalTrainingRuntime.ts` — podłączenie selectora wyłącznie dla zwykłych trybów `node`.
- `src/application/canonical/CanonicalTrainingSelection.test.ts` — pokrycie kolejnych planów w Coding, Backend Design i GCP; unikalność w planie, ograniczenie do puli, deterministyczność, resume, wyczerpanie, nieważna długość, pin i świeże pytanie w jednostce z historią.
- `src/application/canonical/CanonicalTrainingRuntime.test.ts` — zachowanie testu Claude multi-select z nową, opartą na historii selekcją.

## Niezależna ocena briefingu

Wymagany przegląd przed implementacją został pominięty; pierwsza ocena po fakcie uzyskała minimum `0.72` (spójność 0.90, prostota 0.88, akceptowalność ryzyka 0.72, utrzymywalność 0.87) i nie zatwierdziła pierwotnego briefingu. Po doprecyzowaniu jawnej kolejności priorytetów oraz mianowników ograniczonych do puli poprawiony briefing dostał minimum `0.88` (spójność 0.94, prostota 0.91, akceptowalność ryzyka 0.88, utrzymywalność 0.92). Walidator działał wyłącznie na briefingu i nie oglądał repozytorium. Pominięcie gate’u przed implementacją pozostaje ograniczeniem procesu; nie wykryto przez to samo defektu produktu.

## Weryfikacja

- `npm run typecheck` — PASS.
- `node --import tsx --test src/application/canonical/CanonicalTrainingSelection.test.ts src/application/canonical/CanonicalTrainingRuntime.test.ts` — PASS, 10/10.
- `git diff --check` w repo `patternly` — PASS.
- Usługi nie były uruchamiane. Auth i Firestore emulatory pozostawiono działające; API `/ready` nie odpowiadało. CoreSimulatorService było niedostępne, więc zachowany iPhone 17 nie mógł być ponownie sprawdzony; nie uruchamiano ani nie resetowano urządzenia/aplikacji.

## Porównanie z probe i ograniczenia

Probe z 22 września pokazało identyczne początkowe zestawy 10 pytań między kolejnymi sesjami (AWS 40, Coding 158, Backend Design 145). Nowe testy potwierdzają serię planów rozwijającą wybrane pytania na trzech reprezentatywnych rodzinach i pozostawiają durable resume oraz granicę Free w istniejącym katalogu. Pełny matrix AUD-06, wszystkie dziewięć tracków, odbiór na iPhonie oraz release admission nie są częścią lokalnego PASS AUD-03.

## Ocena podejścia

Zgodność/architektura `0.90`, prostota `0.88`, akceptowalność ryzyka `0.80`, utrzymywalność `0.87`; minimum `0.80`. Jedno wspólne miejsce selekcji unika kopii per family, a utrwalony plan izoluje lifecycle. Główne ograniczenie dowodu to brak aktualnego uruchomienia symulatora oraz brak testu live na każdym tracku; selektor ma dedykowane testy na trzech rodzinach i katalog posiadające istniejące macierze testowe.
