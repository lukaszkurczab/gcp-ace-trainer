# AUD-15 — odpowiedzi i Review

Status: **ACCEPTED — lokalny odbiór 2026-10-01**. Niezależne GPT-6 Luna High: source PASS; standard PASS; dark 2× PASS WITH ISSUES (nieblokujący powtórzony licznik w fixture).

## Zmiana i przyczyna

Dodano odseparowany, wyłącznie pamięciowy fixture dziesięciu ukończonych pytań kanonicznego Claude Focus Practice. Pierwsze pięć obejmuje single correct/incorrect oraz multi correct/partial/incorrect; pozostałe pytania mają odrębne identyfikatory. Rzeczywisty CanonicalTrainingRuntime wykonuje prepare, walidację resume, dziesięć submitPractice i finalize. Wynik: 7 correct, 1 partial, 2 incorrect, 15/22 punktów. Practice używa produkcyjnego renderera feedback, Review współdzieli czystą projekcję z fasadą. Projekcja sprawdza referencje wszystkich prób przed pierwszym resolverem i odrzuca niespójne dowody.

Istniejący smoke entry rozszerzono o `practice-answer-matrix`. Brak nowej trasy produktu, zapisu profilu, Submit czy fallbacku sukcesu. Wyłączony runtime pozostaje niedostępny poza smoke. Usunięto dodatkowy Screen/Scroll otaczający Practice; istniejący SessionShell jest jedynym właścicielem przewijania, a zmiana pytania resetuje pozycję. Nawigacja korzysta z istniejących header/actionBar slots. Domyślny ActionBar i preparing pozostają zachowane.

## Dopasowanie i niezależna walidacja

Briefingi Cel/Ustalenia/Podejście zwalidowano bez narzędzi przed zmianami, przez GPT-6 Luna High. Implementacja GPT-6 Luna Medium. Minimum ocen początkowego zakresu .83; poprawki safe area .98, preflight referencji .95, toolbar .94, reset .97, pojedyncza kompozycja przewijania .87 (cel/architektura .96, prostota .90, ryzyko .89, utrzymywalność .92 w niezależnej walidacji). Każde minimum ≥ .8.

## Weryfikacja końcowa

- Pełna `npm run qa:static`: **1498/1498**, typecheck, content-boundary i runtime-privacy-boundary PASS. Historical content `cc3efca88be7e01137f10ac69a0643f06b61a350`, current content `0174e42fbe7634a54c1f5d87369063c7e01e8c7e`. Diff-check PASS.
- Niezależny source QA pojedynczej kompozycji PASS; test slot/default/preparing 5/5. Wcześniejsza walidacja projekcji i fixture również PASS.
- Ten sam istniejący iPhone 17, iOS26.4, Maestro2.10: **standard/light 222/222 oraz dark/2× 222/222 poleceń** w dwóch pełnych przebiegach. Pięć stanów Practice i Review, 23 odrębne opcje w każdym rendererze, statusy selected correct/incorrect/correct not selected/not selected, nieaktywne karty, reset pytania, granice Previous/Next, ten sam wynik po powrocie i Exit → Home PASS.
- Dwa zaszyfrowane pliki magazynu mają identyczne rozmiary i SHA przed/po każdym przebiegu. Brak odczytu plaintext lub resetu danych. Po testach przywrócono System/EN/standard i potwierdzono Home.
- Źródła nie zmieniły się podczas przebiegów; 14 hashy w `evidence/SOURCE-PINS.json`. Wybrane screenshoty wszystkich stanów oraz pełne commands/manifest są w `evidence/standard` i `evidence/dark-2x`; reprodukcja `evidence/MATRIX.yaml`.

Wcześniejsze przebiegi ujawniły nachodzenie safe area, zachowany scroll offset i zagnieżdżone przewijanie blokujące Next przy 2×. Poprawiono przyczynę i ponowiono obie pełne macierze. Wcześniejsze częściowe wyniki i screenshot z dev Refreshing nie stanowią końcowego dowodu.

## Ograniczenia

Powtórzony licznik nagłówka i stopki istnieje tylko w lokalnym podglądzie; QA uznało go za nieblokujący przy obu rozmiarach. To odbiór prezentacji kanonicznego, pamięciowego runtime, nie backendu ani rzeczywistego providera. VoiceOver jest poza odbiorem decyzją PO. Nie wykonano EAS ani deployu.

Aktywne materiały zakończonego UI-26-02B usunięto; pełne archiwum pozostaje w Git app `654baa33a020e0f093f0fb243c2b2dbb19c40148`. Zastąpiony zagnieżdżony ready Screen usunięto; reusable Maestro UI-26-02B pozostają wymagane przez regresję.
