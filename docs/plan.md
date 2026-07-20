---
plan_date: 2026-07-20
active_next_task: H03-ALGORITHMS-DECLARED-SCOPE-ACTION-REFINEMENT-01
execution_model: development_first
---

# Patternly — aktywny plan wykonania

## Decyzja wykonawcza

Najpierw rozwijamy i weryfikujemy małe, działające pionowe zakresy produktu. Pełny audyt natywny, ręczne przejścia oraz pakiet zrzutów są wymagane wyłącznie dla kandydata wydania, nie po każdym commicie ani pushu.

Commit i SHA mogą wskazywać historyczne wykonanie zmiany, ale nie są bramką odbioru ani trwałym identyfikatorem dowodu. Dowodem są powtarzalne polecenia, ich wynik i aktualny stan kanonicznej ścieżki.

## Stan potwierdzony

| Obszar | Stan | Dowód / wniosek |
| --- | --- | --- |
| Kontrakt statyczny Stage 3 | wykonano | Statyczna kontrola nie wymaga artefaktu APK; manifesty bez porównywalnego odpowiednika są oznaczane jawnie jako nieaktualne. |
| Rdzeń lifecycle i sesje Algorithms | wykonano | Istnieją kontrakty, use cases, testy i kanoniczna ścieżka `AlgorithmsFamilyRuntime`. |
| Rekomendacja Algorithms na Home | wykonano | Home ładuje dashboard przez lifecycle i uruchamia tylko akcję z zadeklarowanym zakresem albo pokazuje jawny stan niedostępności. |
| Rekomendacje rozpoznawania, kontrastu i samodzielnej praktyki | częściowo | Runtime wykrywa te potrzeby, lecz nie zgaduje zakresu sesji; gdy zakres nie wynika bezpiecznie z kontraktu, zwraca jawną niedostępność. |
| Certification jako obiecana rodzina produktu | luka funkcjonalna | Dokumentacja produktu opisuje rodzinę Certification, a kompozycja runtime rozwiązuje obecnie wyłącznie Algorithms. Nie wolno ukrywać tej rozbieżności w metadanych ani nazywać jej ukończoną. |
| Pełny audyt natywny | odroczony do kandydata wydania | Nie jest blokadą kolejnych małych zmian funkcjonalnych. |
| Zdalne CI po publikacji | wymaga sprawdzenia przy kandydacie wydania | Lokalna pełna kontrola statyczna przeszła przed publikacją; status zdalnego środowiska nie został tu zastąpiony założeniem. |

## Zamknięta praca

- Usunięto z aktywnej kolejki wymóg zamykania całego audytu wizualnego przed następną pracą produktową.
- Usunięto wymóg przechowywania dokładnego SHA jako warunku dowodowego.
- Naprawiono kanoniczny kontrakt statycznego audytu Stage 3.
- Podłączono runtime Algorithms do Home, usuwając statyczne rekomendacje i niebezpieczne uruchamianie sesji bez zakresu.
- Pełna lokalna kontrola statyczna po tej zmianie: typecheck, 259 testów oraz kontrole granic kontraktów i treści — wynik pozytywny.

## Znane rozbieżności wymagające kolejnych prac

1. Runtime ma jawne wykrywanie części potrzeb Algorithms, ale nie ma jeszcze potwierdzonego kontraktu akcji dla każdego z nich. Domyślne wybieranie mental unit, wariantu lub zakresu byłoby ukrytym fallbackiem i nie jest dopuszczalne.
2. Dokumentacja produktu i nawigacji opisuje Certification jako dostępną rodzinę, podczas gdy aktualna kompozycja runtime nie dostarcza tej rodziny. To wymaga oddzielnego audytu kanonicznego kontraktu przed implementacją, nie kosmetycznej zmiany opisów.
3. Zrzuty i manualne przepływy nie są aktualnym warunkiem pracy rozwojowej. Stają się obowiązkowe po ustaleniu zakresu kandydata wydania.

## Kolejna praca

### H03-ALGORITHMS-DECLARED-SCOPE-ACTION-REFINEMENT-01

**Cel:** ustalić jeden kanoniczny kontrakt akcji dla rekomendacji `recognize_patterns`, `contrast_practice` i `independent_practice`, aby każda możliwa akcja Home miała jawny, poprawny zakres sesji albo prowadziła do jawnego wyboru zakresu.

**Zakres:**

- zbadać typy rekomendacji i akcji dashboardu Algorithms;
- sprawdzić strukturę katalogu, mental units, wariantów i deklarowanych zakresów sesji;
- sprawdzić istniejące trasy i modele wyboru praktyki;
- zapisać minimalny kontrakt wejścia użytkownika lub deterministycznego mapowania, tylko jeśli wynika on wprost z danych kanonicznych.

**Poza zakresem:** implementacja Certification, zmiana modelu pytań, domyślne przypisywanie zakresów, pełny audyt natywny i zmiany komercyjne.

**Kryteria akceptacji:**

1. Każdy z trzech typów rekomendacji ma opisany pojedynczy wynik: bezpośrednią akcję z deklarowanym zakresem albo konkretny jawny wybór użytkownika.
2. Żaden wynik nie zależy od zgadywania pierwszego dostępnego mental unit, wariantu ani tracku.
3. Dla każdego wyniku są wskazane właściwy owner, pliki implementacji i testy kontraktowe.
4. Jeśli istniejąca nawigacja nie umie wyrazić wymaganego wyboru, następne zadanie zawiera najmniejszą konkretną zmianę UI i kontraktu, zamiast ukrytego obejścia.

**Weryfikacja:** porównanie kontraktów runtime, katalogu i testów; sprawdzenie wszystkich istniejących wywołań rekomendacji oraz tras uruchamiania sesji; `git diff --check` dla dokumentacji wyniku.

**Stop:** zakończyć po określeniu implementowalnego kontraktu i przekazać dokładnie jeden następny zakres implementacyjny. Nie pisać kodu na podstawie niejednoznacznego mapowania.

### H04-ALGORITHMS-DECLARED-SCOPE-ACTIONS-01

**Zależność:** H03.

**Cel:** wdrożyć kontrakt wybrany w H03 w kanonicznej ścieżce runtime, Home i uruchamiania sesji.

**Zakres:** wyłącznie akcje z jednoznacznie zadeklarowanym zakresem oraz minimalna nawigacja potrzebna do jawnego wyboru, jeśli H03 ją potwierdzi.

**Kryteria akceptacji:** rekomendacja nie może uruchomić sesji poza zadeklarowanym zakresem; nie może zniknąć milcząco; testy obejmują wszystkie obsłużone akcje i stan niedostępności.

**Weryfikacja:** testy jednostkowe dashboardu oraz Home, typecheck i pełna kontrola statyczna po zmianie kodu.

### H05-CERTIFICATION-CANONICAL-GAP-AUDIT-01

**Cel:** rozstrzygnąć rozbieżność między deklarowaną rodziną Certification a aktualnym runtime oraz przygotować najmniejszy prawdziwy zakres jej uruchomienia.

**Zakres:** porównać definicję produktu, architekturę, nawigację, kompozycję lifecycle, dostępne artefakty treści i testy; wskazać brakujące kontrakty oraz wejścia wymagające decyzji właściciela produktu.

**Kryteria akceptacji:** raport rozdziela fakty repozytorium od założeń; wskazuje jedną kanoniczną ścieżkę implementacji; nie zastępuje brakującej funkcji zmianą etykiety, flagą ani ukryciem rodziny.

**Weryfikacja:** kontrola importów, tras, testów i artefaktów treści; `git diff --check` dla dokumentacji wyniku.

### H06-RELEASE-CANDIDATE-EVIDENCE-01

**Warunek rozpoczęcia:** ustalony kandydat wydania z określonym zakresem funkcjonalnym.

**Cel:** wykonać pełny, aktualny pakiet dowodowy dla kandydata wydania.

**Zakres:** pełna kontrola statyczna, kontrola zdalnego CI, powtarzalne przepływy natywne, zrzuty wymaganych stanów i przegląd regresji w zakresie wydania.

**Kryteria akceptacji:** każdy artefakt opisuje uruchomione polecenie, wynik, datę i stan produktu; brak artefaktu jest raportowany jawnie; pakiet nie korzysta ze starych manifestów jako dowodu bieżącego działania.

## Pierwszy następny krok

Wykonać H03. Jest to najmniejsza praca potrzebna, aby dokończyć istniejący przepływ Algorithms bez wprowadzania zgadywania zakresów ani niepotwierdzonej nowej nawigacji. Po H03 należy przejść bezpośrednio do jednego zakresu implementacyjnego H04 albo — jeżeli kontrakt wymaga decyzji produktowej — pokazać tę decyzję jawnie przed kodowaniem.
