# FCA-AUDIT-COMPLETE — dokończenie oceny każdego pytania

Status i kolejność prac określa wyłącznie [plan główny](../../PATTERNLY-WORKING-PLAN.md). To niewykonany zakres AUDIT 3. Obejmuje dokończenie oceny wszystkich pytań; naprawy już wykrytych problemów oraz narzędzie EPIC-09 są osobnymi zadaniami. Porządkowanie dokumentacji nie stanowi wykonania audytu.

## Zachowane wyniki i punkt rozpoczęcia

Dane audytu znajdują się w repozytorium contentu, w `evidence/business-quality/full-content-audit-2026-10-02/`. Zachowano spis pytań, manifest, kryteria oceny, indywidualne recenzje, rekordy unieważnionych ocen oraz narzędzia weryfikacji i agregacji.

Audyt z 02.10 obejmował 16 077 pytań. Weryfikator odczytał 4 236 poprawnych rekordów ocen; 11 841 pytań nadal ma status `PENDING`. Nie wykrył błędów strukturalnych. Dawne podsumowanie wskazujące 3 703 oceny było nieaktualne. Sprawdzenie struktury rekordów nie jest ponowną oceną merytoryczną pytań.

Źródła z 07.10 zawierają 16 622 pytania. Narzędzie `scripts/content-audit/reconcile.mjs` ustaliło, że 2 752 z nich mają identyczną treść źródłową jak pytania z wcześniejszą oceną. Pozostałe 13 870 wymaga przypisania właściwych ocen albo nowego przeglądu. Plik `current-source-binding.json` zawiera pełny spis z identyfikatorami, skrótami treści, ścieżkami, taksonomią i odniesieniami do dawnych wyników. Zgodność treści nie potwierdza aktualności faktów o usługach dostawcy ani poprawności obecnego mechanizmu punktacji.

Najpierw sprawdź, czy źródła zmieniły się od tego porównania. Następnie przypisz do aktualnych pytań pasujące indywidualne oceny z późniejszych odbiorów OOD 24, Claude i zastępstw BESD. Dopiero potem rozpocznij ocenę brakujących pytań.

Rejestr oceny Claude można odzyskać z Git: `4b0f1ff:docs/evidence/content-audits/2026-10-07-claude-current-review.jsonl`. Zawiera 943 wiersze; obecny bank ma 845 pytań. Żadna z tych liczb sama nie potwierdza pełnego odbioru. Uwzględnij wyłącznie rekordy pasujące do aktualnej treści i spełniające pełne kryteria audytu. Nie otwieraj ponownie zamkniętych napraw OOD ani nie oceniaj mechanicznie od nowa 1 413 pytań bez wykazania brakującego kryterium. Uzgodnij istniejący odbiór z wymaganiami audytu. Werdykty 34 dawnych pytań BESD nie przechodzą na ich zastępstwa o nowych identyfikatorach.

## Indywidualna ocena — 13 wymiarów

Każde pytanie wymaga osobnej oceny:

1. Cel nauki i zgodność z deklarowaną umiejętnością.
2. Treść zadania: kompletność warunków, jednoznaczność i brak podpowiedzi odpowiedzi.
3. Poprawność techniczna i faktograficzna.
4. Kontrakt odpowiedzi i punktacji: odpowiedź zaakceptowana, częściowa, zerowa, kolejność, złożoność i aliasy.
5. Jakość każdej błędnej opcji odpowiedzi oraz błąd rozumowania, który reprezentuje.
6. Pole `Reason`: konkretny warunek rozstrzygający i uzasadnienie odpowiedzi.
7. Pole `Details`: mechanizm, zastosowanie do zadania i granice rozwiązania.
8. Objaśnienie każdej aktywnej błędnej opcji, powiązane z jej identyfikatorem.
9. Możliwość zastosowania wiedzy w innym problemie.
10. Trudność i obciążenie poznawcze.
11. Duplikaty i bliskie parafrazy, ze wskazaniem porównywanych pytań.
12. Oryginalność i pochodzenie materiału.
13. Jakość właściwa dla danej rodziny treści.

Fakty dotyczące certyfikacji i usług dostawców sprawdzaj w aktualnych oficjalnych źródłach. Zapisz URL, datę, sprawdzane twierdzenie i wynik. W zadaniach algorytmicznych sprawdź niezmienniki, warunki stosowalności, przypadki graniczne, wyprowadzenie złożoności i możliwość przeniesienia wiedzy.

Nieprzeczytane pytanie pozostaje `PENDING`; nie otrzymuje `BLOCKED_FACT_CHECK`. Po pełnej ocenie przypisz dokładnie jeden werdykt: `PASS`, `FIX_MINOR`, `FIX_MAJOR`, `REMOVE` albo `BLOCKED_FACT_CHECK`. Sam poprawny schemat danych nie uzasadnia `PASS`.

## Rejestr ocen i zadania naprawcze

Aktualny rekord oceny musi wskazywać ścieżkę nauki, rodzinę, `contentVersion`, węzeł, jednostkę umiejętności, `itemId`, plik i skrót treści pytania. Musi zawierać ocenę wszystkich 13 wymiarów wraz z dowodami, przegląd każdej opcji i punktacji, sprawdzone fakty, porównywane duplikaty, autora oceny i datę. Dawna ocena pozostaje przypisana do dawnej wersji; powiązanie z nową wersją musi zachować jej tożsamość i wynik porównania treści.

Oceniaj pozostałe pytania w ustalonej kolejności i aktualizuj maszynowo czytelne liczniki według ścieżki nauki, werdyktu i rodzaju problemu. Nie stosuj próbkowania, zbiorczego `PASS`, automatycznego dziedziczenia werdyktów ani oceny wyłącznie przez wyrażenia regularne lub walidator schematu. Nowe problemy grupuj według ścieżki, węzła, jednostki umiejętności lub wspólnego defektu, zawsze z pełną listą identyfikatorów. Rozszerzaj właściwe istniejące zadania; nie twórz drugiej kolejki.

[Zachowane zadania naprawcze](content-maintenance.md) obejmują 158 grup i 2 129 pytań z potwierdzonymi problemami w treści. Każde zadanie musi podać identyfikatory, kategorie problemów, dowody, wymagane poprawki, źródła do sprawdzenia, zabronione zmiany, walidację, ponowną ocenę każdego pytania i przekazanie do przeglądu redakcyjnego przez człowieka. Należy też określić zależności od wersji treści, manifestu, dopuszczenia pakietu i przypięcia go w aplikacji.

Podczas audytu nie poprawiaj treści. Nie przepisuj całych banków, nie ukrywaj słabych pytań i nie zmieniaj schematu wykonania. Ocena modelu nie zastępuje zatwierdzenia redakcyjnego przez człowieka.

## Weryfikacja i kryteria odbioru

W repozytorium contentu polecenie `node evidence/business-quality/full-content-audit-2026-10-02/verify.mjs` odtwarza nieśledzony rejestr i podsumowanie dawnego audytu. Opcja `--require-complete` musi zwracać kod 2, dopóki ten audyt pozostaje niepełny. Narzędzie `aggregate.mjs` uruchamiaj wyłącznie na tymczasowej kopii starego planu: dawny zakres zawiera już rozwiązane problemy. Nie nadpisuj nim aktualnego planu.

Polecenie `node scripts/content-audit/reconcile.mjs <output.json>` odtwarza porównanie aktualnych pytań z dawnymi ocenami. Po zmianie źródeł, kryteriów, mechanizmu punktacji lub faktów dowód musi nadal pasować do ocenianego zakresu. Walidator aktualnej kompletności musi odrzucać rekordy powielone, obce, nieaktualne, z niepełną oceną oraz błędną tożsamością źródła. Ma jawnie zgłaszać niepełny audyt. Dawny weryfikator stanowi wzorzec, ale nie potwierdza kompletności obecnego banku.

Audyt można odebrać dopiero, gdy liczba ocenionych pytań jest równa liczbie pytań w uzgodnionym aktualnym zakresie. Nie może pozostać żadne `PENDING` ani błąd tożsamości lub walidacji. Każde pytanie musi mieć pełną ocenę i aktualne sprawdzenie wymaganych faktów; każdy wynik inny niż `PASS` musi wskazywać konkretne zadanie naprawcze. Raport podaje SHA źródeł, wersję, zakres, rzeczywiste liczniki według ścieżki i werdyktu oraz ograniczenie dotyczące zatwierdzenia przez człowieka. Stare podsumowanie, odbiór całej partii, walidacja schematu ani usunięcie dowodów nie zamykają tego zadania.
