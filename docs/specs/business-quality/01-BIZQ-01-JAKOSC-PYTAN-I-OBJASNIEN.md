# BIZQ-01 — jakość pytań, objaśnień i ujawniania odpowiedzi

**Priorytet:** P0  
**Główne repo:** `patternly-content`, aplikacja; web tylko gdy współdzieli wadliwy przykład/renderer  
**Zależności:** brak implementacyjnych; obowiązuje [plan zbiorczy](00-PATTERNLY-BIZQ-PLAN-ROBOCZY.md)  
**Rezultat biznesowy:** wynik sesji ma wynikać z rozumowania, a objaśnienie ma umożliwiać poprawne rozwiązanie następnego, zmienionego problemu.

## 1. Problem i zakres pewności

Audyt A1 wskazał trzy różne klasy problemów, których nie wolno naprawić jednym mechanicznym „rewrite”:

1. **Odpowiedź przed odpowiedzią:** pole `constraints` w próbkach Backend System Design zawierało wprost oczekiwany kierunek decyzji albo instrukcje autora. Według audytu trafiało do widoku pytania.
2. **Pozorny wybór:** poprawna opcja była wyważona i konkretna, a alternatywy zawierały skrajności albo ignorowały wymagania. Rozwiązanie mogło wynikać ze stylu wypowiedzi, nie wiedzy.
3. **Brak mechanizmu:** scenariusz, odpowiedź i Details nie tworzyły spójnego kontraktu. Przykład `besd-n04-b01-i002` łączył wymagania rekordu audytowego z ogólną odpowiedzią o cache.

Próbki Binary Search i Claude zostały ocenione korzystniej. Nie przepisuj ich profilaktycznie i nie zakładaj, że każdy element tych banków jest poprawny. W tym zadaniu odtwórz defekty na aktualnych źródłach. A1 nie jest statystycznym audytem całego katalogu.

Źródła wymagań: A1, K1 oraz aktualny README contentu R6. Bieżące ścieżki i reguły aktywacji wynikają z repo, nie ze starego authoringu.

## 2. Zakres i non-goals

W zakresie: content widoczny przed rozwiązaniem, accepted answers, opcje, Reason, Details, feedback wybranych błędów, mapowanie do mental units, kontrola stylistycznych podpowiedzi oraz rzeczywisty renderer. Uwzględnij single-choice, multi-choice i inne obsługiwane interakcje; nie naprawiaj tylko jednego widoku.

Poza zakresem: nowy kurs, nowy track, hurtowe zwiększenie/zmniejszenie banku, globalny próg liczby pytań, runtime LLM, nowy panel redakcyjny, drugi format pytań, przepisywanie całego frontendu, zmiana scoringu niepowiązana z wykazanym defektem.

Zachowaj aktualne bramki Premium również w testach naprawionych pytań: zmiana contentu lub kolejności opcji nie upoważnia do uruchomienia płatnego trybu na Free. Testy korzystają z prawdziwego, właściwie skonfigurowanego profilu testowego.

Nie maskuj błędu flagą `draft`, listą wykluczeń w aplikacji ani „tymczasowym” filtrem w selektorze. Usterka aktywnego pytania wymaga celowanej naprawy źródła i normalnego admission.

## 3. Rozpoznanie dokładnego batcha przed edycją

Kanoniczny ingress to `content/<trackId>/<nodeId>/<mentalUnitId>.json`, a plik zawiera tablicę pytań. Ustal faktyczne ścieżki w lokalnym checkoutcie; nie kopiuj historycznych ścieżek bez sprawdzenia.

### 3.1. Nasiona z audytu

| Nasiono | Co znaleźć i sprawdzić |
| --- | --- |
| `BESD-N02-B01.json` | Wszystkie pytania z tego mental unit; wycieki w constraints, alternatywy, scenariusz IoT i gwarancje ponowienia. |
| `BESD-N04-B01.json`, `besd-n04-b01-i002` | Związek wymagań rekordu audytowego z akceptowaną odpowiedzią i wyjaśnieniem. |
| `GCPACE-N01-B02.json` | Pytania o strukturę zasobów; plausibility distractorów i wyjaśnienie błędnego założenia. |
| `lower_and_upper_bound.json` | Próbka kontrolna: konkretny trace, zakresy i objaśnienie off-by-one; zachowaj dobre elementy. |
| `CCARP-D03-O01.json` | Próbka kontrolna: decyzja zmieniana przez warunki; nie rozszerzaj wniosków na cały bank. |
| `PracticeQuestionCard`, view model pytania | Jakie pola są pokazywane przed submit i po submit oraz w trybach end-feedback. |
| `CanonicalTrainingRuntime` i przygotowanie sesji | Czy kolejność opcji jest losowana raz, zapisywana i odtwarzana bez wpływu na scoring. |

Nazwy są locatorami A1, nie gwarancją obecności na obecnym HEAD. Gdy plik przeniesiono, znajdź aktualny owner przez manifest/ID. Brak źródła wpisz do raportu; nie twórz go na nowo z nazwy.

### 3.2. Dwa poziomy przeglądu

**Automatyczny przegląd całego aktualnego katalogu:** jedno uruchomienie dla wszystkich deklarowanych tracków, ponieważ ryzyko jest przekrojowe. Zapisz rzeczywisty mianownik: tracki, mental units, pytania i typy interakcji. Potem testuj pojedynczy dotknięty track zgodnie z KISS; wspólny schemat/builder wymaga testów wszystkich konsumentów.

**Przegląd merytoryczny:** przejrzyj w całości trzy wskazane problematyczne mental units oraz minimalną warstwową próbkę pozostałych źródeł: do 24 różnych pytań na track, rozłożonych po nodach, etapach i interakcjach. Liczba 24 to budżet początkowego przeglądu, nie dowód reprezentatywności. Przy małym banku sprawdź wszystkie pytania. Wykrycie szablonowego defektu rozszerza przegląd na cały zbiór jego wystąpień, również poza próbką.

Nie opieraj próby wyłącznie na pierwszych pytaniach pierwszego noda. Dobór ma być odtwarzalny: ustalony seed/hash ID + jawne nadpisania dla ryzyk z audytu. Raport odróżnia próbkę losowo-warstwową od celowo wybranych znanych błędów. Nie wyliczaj z tego „procentu złej bazy”.

### 3.3. Manifest zmiany

Przed przepisaniem treści zapisz w raporcie bieżącego zadania tabelę:

`trackId | source path | itemId | primary mentalUnitId | defect | intended decision | answer change? | ID action | source evidence | reviewer/admission authority`.

W każdym batchu wymagane są dokładne item IDs. Nie zaczynaj edycji z otwartym zakresem „popraw wszystkie słabe pytania”. Pierwsze batche odpowiadają wskazanym mental units; kolejne wynikają z wykrytych wspólnych wad. Nie tworzą osobnych zadań biznesowych ani drugiego planu.

## 4. Docelowy kontrakt jakości

### 4.1. Spójny problem

Każde pytanie musi pozwalać odpowiedzieć na cztery pytania redakcyjne:

- Jaką jedną decyzję lub mechanizm ćwiczymy?
- Jaki jawny warunek rozstrzyga odpowiedź?
- Dlaczego najbliższa alternatywa nie wystarcza?
- Co zmieniłoby decyzję w pokrewnym scenariuszu?

W single-choice dokładnie jedna opcja spełnia cały kontrakt. Jeżeli dwie są poprawne przy rozsądnych, niewykluczonych założeniach, doprecyzuj warunki albo popraw opcje. Nie wprowadzaj decydującego założenia dopiero w Details.

W multi-choice wyjaśnij nie tylko wybraną błędną opcję, ale także istotną pominiętą część poprawnego zbioru. Nie zmieniaj częściowej odpowiedzi na poprawną, by poprawić statystykę.

### 4.2. Podpowiedź vs prawidłowa pomoc dydaktyczna

Instrukcje redakcyjne i dosłowne rozwiązanie nie mogą znajdować się w learner-visible `constraints`. Nie usuwaj jednak wszystkich ograniczeń: prawdziwe wymagania scenariusza są niezbędne do jego rozstrzygnięcia.

W trybie nauki dopuszczalne jest nazwane podejście albo worked example, jeżeli aktualny kontrakt tak stanowi i użytkownik nadal wykonuje znaczącą decyzję. W diagnozie i independent transfer jawne nazwanie szukanego wzorca może unieważniać zadanie. Reguła zależy od celu i etapu, nie od uniwersalnego zakazu wystąpienia danego słowa.

Sprawdź także tytuł, nazwę sekcji, etykiety, walidację formularza, dostępne wartości odpowiedzi i accessibility props. Nie wystarczy wizualnie ukryć Reason przy pozostawieniu accepted answer w tekście pomocniczym kontrolki.

### 4.3. Dobre opcje

Alternatywa ma reprezentować rzeczywisty błąd: pominięty warunek, niewłaściwą gwarancję, pomylenie zakresu, założenie o kolejności lub koszt innego rozwiązania. Opcje powinny mieć porównywalny poziom konkretu. Nie wymagaj identycznej liczby słów; usuń systematyczny sygnał „najdłuższa jest poprawna”.

Preferuj mniej sensownych alternatyw nad sztuczny filler, ale zmniejszenie liczby opcji musi przejść aktualny schema/scoring/mode contract. Nie usuwaj jednej opcji bez aktualizacji odpowiedzi, feedbacku i testów.

### 4.4. Reason i Details

**Reason:** zwykle 1–2 konkretne zdania wskazujące rozstrzygający warunek i decyzję. Nie jest parafrazą poprawnej opcji ani pochwałą.

**Details:** jedna spójna narracja: mechanizm → zastosowanie w scenariuszu → korekta najbliższego błędu → granica stosowalności/trace/kontrprzykład. Długość wynika z potrzeb problemu, nie stałego limitu słów. Nie dodawaj pięciu nagłówków, kiedy wystarczą dwa akapity.

Feedback distractora odnosi się do stabilnego option ID, nie pozycji A/B/C. Dla poprawnej odpowiedzi objaśnienie nie ma udawać błędu użytkownika. Otwarcie Details pozostaje dobrowolne i nie zmienia wyniku, review ani progresji.

### 4.5. Kontrakty naprawy dla znanych przykładów

Dla `besd-n04-b01-i002` najpierw ustal deklarowany learning objective. Jeżeli celem jest decyzja o cache, scenariusz musi faktycznie pytać o odczyt/freshness/cache boundary, a nie sugerować, że cache realizuje wszystkie wymagania trwałego zapisu audytu. Jeżeli celem jest trwałość i atrybucja audytu, pytanie, odpowiedzi, źródła i taxonomy muszą zostać dostosowane do tego celu — to może oznaczać nowy item ID. Nie wybieraj zmiany wyłącznie dlatego, że jest krótsza.

Dla scenariusza ponowienia IoT wyjaśnienie ma uzasadniać konkretną właściwość wymaganą przez prompt, a nie samo hasło „dobierz kontrakt”. Weryfikuj mechanizm i granice gwarancji w źródle pierwotnym; nie obiecuj exactly-once przez sam identyfikator requestu.

Dla GCP alternatywy i feedback mają rozróżniać konkretne zakresy i dziedziczenie zasad zgodnie z aktualną oficjalną dokumentacją. Nie utrudniaj pytania przez nieznane słowo ani nieaktualny detal UI.

To instrukcje naprawy, nie gotowe merytorycznie zatwierdzone odpowiedzi. Każde zastępstwo wymaga sprawdzenia właściwego źródła i admission.

## 5. Implementacja techniczna

### Krok A — kontrola istniejących narzędzi

Znajdź istniejące walidatory, testy contentu, review tooling i builder. Rozszerz jeden istniejący mechanizm. Nie dodawaj nowego pipeline'u lub statusów pytań. Raport analityczny może być generowany przez istniejące narzędzie QA; nie staje się drugim źródłem danych.

### Krok B — automatyczne sygnały ryzyka

Dodaj albo uzupełnij wykrywanie:

- accepted-answer references, brakujących objaśnień i błędnych option IDs;
- instrukcji autora typu „the primary decision is” w polach widocznych dla ucznia, z kontekstowym rozstrzygnięciem;
- istotnego nakładania się odpowiedzi z constraints;
- powtarzalnych Details/Reason i prawie identycznych pytań;
- dominacji pozycji poprawnej odpowiedzi;
- dominacji długości/poprawności i skrajnych sformułowań distractorów;
- rozbieżności source → artifact → renderer.

Twarde naruszenia schematu i mapowania blokują QA. Heurystyki tekstowe tworzą ostrzeżenia do rozstrzygnięcia, nie automatyczny werdykt semantyczny. Ewentualne progi podobieństwa i długości są jawnie testowane jako heurystyki; nie usuwają ani nie zatwierdzają pytań. Każde istotne ostrzeżenie w zmienianym batchu ma rozstrzygnięcie i uzasadnienie.

### Krok C — naprawy źródłowe

Popraw pytania w kanonicznych plikach JSON. Zachowuj item ID, gdy pierwotny zamiar dydaktyczny pozostaje; nowy ID stosuj przy rzeczywistej zmianie decyzji, archetypu lub podstawowej semantyki zgodnie z bieżącym kontraktem. Nie używaj starego option ID dla nowego znaczenia. Nie zmieniaj historycznych dowodów approval, żeby nowe pytanie wyglądało na wcześniej zaakceptowane.

Każdy zmieniony batch otrzymuje before/after i rozstrzygnięcie source/answer/feedback. Zatwierdzanie odbywa się przez faktycznie uprawnionego recenzenta lub delegowaną rolę. Niezależny agent może wykonać techniczny review, ale nie może podpisywać się jako człowiek. Nie przywracaj automatycznie nowej obowiązkowej ręcznej bramki dla wszystkich dziewięciu już zaakceptowanych banków.

### Krok D — kolejność odpowiedzi i disclosure

Dla interakcji, których znaczenie dopuszcza mieszanie opcji, losuj kolejność raz przy przygotowaniu sesji, z kontrolowaną losowością w testach. Zapisuj rzeczywistą kolejność dla occurrence i odtwarzaj przy rerender/resume. Nie losuj na renderze. Wyjątki typu opcje zależne od kolejności muszą wynikać z kontraktu, nie odgadywania treści przez UI.

Scoring i feedback używają option IDs. Zmiana kolejności nie zmienia odpowiedzi, zaznaczeń, partial score ani właściwego objaśnienia. Dla pytań ordering nie stosuj mechanizmu single-choice do naruszenia ich własnego kontraktu.

W rendererze usuń wyłącznie nieuprawnione ujawnianie, nie prawdziwe wymagania zadania. Feedback w trybach końcowych jest niedostępny do czasu ich właściwego commit/finalization boundary.

### Krok E — artefakty i konsumenci

Uruchom rzeczywiste komendy po sprawdzeniu CLI i `package.json`. README R6 dokumentuje poniższy kształt; podstaw prawdziwy `TRACK_ID` i root zgodnie z aktualnym parserem:

```sh
npm run content:validate -- --track "$TRACK_ID"
npm run content:test -- --track "$TRACK_ID"
npm run content:build -- --track "$TRACK_ID"
```

Gdy CLI wymaga jawnych `--root`/`--output-root`, użyj zidentyfikowanych katalogów, nie domyślnego tymczasowego katalogu. Nigdy nie wpisuj do raportu, że komenda przeszła, jeśli uruchomiono inną konfigurację. Aktualizuj content version/lock i artefakt przez kanoniczny builder. Sprawdź consumer aplikacji i webowego demo, jeżeli wykorzystuje zmieniony item. Wspólny schema/builder przechodzi pełną właściwą regresję; pojedyncza korekta nie wymaga przebudowy ośmiu niezmienionych tracków przy każdej iteracji.

## 6. Macierz testów

| ID | Przypadek | Oczekiwany wynik |
| --- | --- | --- |
| Q01 | Pytanie z metainstrukcją autora w constraints | Wykrycie ryzyka; naprawione źródło nie zdradza oczekiwanej decyzji. |
| Q02 | Legalny worked example w trybie nauki | Nie jest odrzucany tylko za nazwanie techniki; nadal ma sensowną decyzję. |
| Q03 | Brak Details lub błędny option ID | Twarde odrzucenie, bez generowania zastępczego feedbacku. |
| Q04 | Dwie poprawne odpowiedzi w single-choice | Odrzucone podczas review; fixture potwierdza poprawiony kontrakt. |
| Q05 | Wybór każdej błędnej opcji | Odpowiednie autorskie objaśnienie po option ID. |
| Q06 | Partial multi-choice | Objaśnienie pominiętych poprawnych elementów bez wymyślania wybranego błędu. |
| Q07 | Poprawna odpowiedź | Reason/Details dostępne, brak fikcyjnej diagnozy błędu. |
| Q08 | Różne seedy kolejności opcji | Inna dozwolona kolejność; identyczny scoring dla tych samych option IDs. |
| Q09 | Rerender/restart aktywnej sesji | Kolejność i zaznaczenia nie zmieniają znaczenia. |
| Q10 | Przed submit i przed końcem symulacji | Brak ujawnienia accepted answer, Reason, Details w widoku/propsach. |
| Q11 | Source i wygenerowany artefakt | Ten sam zaakceptowany zestaw treści i wersja; brak ręcznej łatki w dist. |
| Q12 | Duży tekst, light/dark, długie opcje | Czytelne opcje i Details bez uciekających akcji; bez testów VoiceOver. |
| Q13 | Aktualizacja pakietu z aktywną sesją | Obowiązuje rzeczywisty mismatch/resume contract; bez podmiany odpowiedzi w trakcie. |
| Q14 | Pojedynczy syntetyczny bardzo długi poprawny wariant | Ostrzeżenie jakościowe, nie automatyczne uznanie odpowiedzi za błędną. |

Testy contentu nie zastępują zobaczenia prawdziwej treści w rzeczywistym runnerze. Odbiór iOS ma zawierać co najmniej poprawne, błędne i partial odpowiedzi na naprawionych pytaniach oraz rozwinięte Details.

## 7. Warunki odbioru

BIZQ-01 można zamknąć, gdy wszystkie potwierdzone krytyczne defekty z A1 i rozszerzonego przeglądu mają naprawy, dokładny inventory i zgodny artefakt; nowe semantyczne zmiany przeszły właściwe admission; renderer nie zdradza odpowiedzi; scoring nie zależy od pozycji opcji; wszystkie istotne ostrzeżenia dotyczące zmienionych batchy są rozstrzygnięte.

Raport podaje zakres faktycznie oceniony merytorycznie i zakres tylko automatycznie przeskanowany. Nie wolno napisać „cały content wysokiej jakości” na podstawie próby 24/track. Otwarte krytyczne wady aktywnego contentu uniemożliwiają pełne zamknięcie, nawet gdy inne batche są gotowe.

W raporcie pokaż przynajmniej trzy konkretne before/after: wyciek odpowiedzi, pozorny distractor i niespójność mechanizmu. Wskaż, czego użytkownik może się nauczyć po poprawce, czego nie mógł ustalić z wcześniejszej wersji.

## 8. Prompt wykonawczy dla Codex

```text
Wykonaj BIZQ-01 według tego dokumentu oraz 00-PATTERNLY-BIZQ-PLAN-ROBOCZY.md.
Nie wykonuj hurtowego generowania ani pełnego refaktoru banku.

Odczytaj aktualne AGENTS.md, kanoniczny plan i WORKING_STATE. Sprawdź cztery
repozytoria i bieżące zmiany. Zlokalizuj kanoniczne źródła mental units
BESD-N02-B01, BESD-N04-B01, GCPACE-N01-B02 oraz item besd-n04-b01-i002.
Sprawdź realną projekcję constraints do widoku. Ustalenia poprzedniego audytu
najpierw odtwórz; nie naprawiaj ponownie już poprawionego kodu.

Przygotuj dokładny manifest pierwszego batcha: pliki, item IDs, decision,
defekt, answer contract, potrzebne źródła i obowiązująca authority admission.
Zastosuj wymagany briefing Cel/Ustalenia/Podejście i niezależną walidację.

Wykonaj automatyczny przegląd wszystkich aktualnych tracków i określony
przegląd semantyczny; rozszerzaj zakres tylko na wykazane wspólne defekty.
Napraw pytania w kanonicznym źródle. Reason ma wskazać warunek rozstrzygający,
Details wyjaśnić mechanizm, konkretny przypadek, błąd i granicę transferu.
Nie stosuj fillerów, nowych runtime flag ani generowanego feedbacku.

Sprawdź i w razie potrzeby napraw jednorazowe mieszanie dozwolonych opcji
ze stabilnym option-ID scoring i persisted occurrence order. Testuj restart,
partial, wybrany distractor oraz granicę ujawniania odpowiedzi. Zachowaj
aktualny format contentu, builder, lock, uprawnienia i zasady admission.

Po każdym batchu wykonaj source→validator→artifact→app consumer QA oraz
odpowiedni odbiór iOS. Bez testów VoiceOver, bez deploy ani publikacji.
Kończ raportem exact diff/IDs, before-after, sources, tests, admission,
independent QA i uczciwym zakresem przeglądu. Nie traktuj zielonego schematu
jako dowodu jakości dydaktycznej.
```
