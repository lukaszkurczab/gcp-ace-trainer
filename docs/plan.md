---
plan_date: 2026-07-20
active_next_task: H04-ALGORITHMS-DECLARED-SCOPE-ACTIONS-01
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

### H03-ALGORITHMS-DECLARED-SCOPE-ACTION-REFINEMENT-01 — wykonano

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

**Wynik potwierdzony:**

- `PracticeSessionScreen` przyjmuje tylko deklarowany `algorithmScope` dla trzech rozpatrywanych trybów. `PracticeHubScreen` oznacza je dziś jako aktywne, ale nie przekazuje zakresu, więc uruchomienie kończy się jawnym błędem zamiast sesją. To jest funkcjonalna luka, nie wariant do ukrycia.
- Każdy z 51 mental units obecnych w zestawach rozpoznawania należy do dokładnie jednego takiego zestawu. Home może uruchomić `Recognize Patterns` wyłącznie po znalezieniu jednego zestawu obejmującego target; przy braku zestawu musi zachować jawną niedostępność.
- Kontrast nie ma takiej własności: dla części mental units istnieje od 2 do 16 pasujących zestawów. Sygnał agregowany per mental unit nie rozstrzyga, którego kontrastu potrzebuje uczeń, dlatego potrzebny jest jawny wybór spośród pasujących struktur.
- `Independent Practice` nie dostaje targetu w rekomendacji i zgodnie z kontraktem wymaga wyboru ucznia.
- Każdy obecny zestaw rozpoznawania, kontrastu i practice scope ma elementy z dokładnie jednego węzła roadmapy. Ekran wyboru może użyć kanonicznego tytułu tego węzła; dla kontrastu szczegółem jest już istniejące `transferBoundary`. Nie trzeba tworzyć alternatywnego katalogu ani generować etykiet z identyfikatorów.

**Przekazanie:** H04 jest gotowe do implementacji. Nie ma decyzji właściciela produktu blokującej ten zakres.

### H04-ALGORITHMS-DECLARED-SCOPE-ACTIONS-01

**Zależność:** H03.

**Cel:** udostępnić jeden kanoniczny wybór deklarowanego zakresu dla `Recognize Patterns`, `Contrast Practice` i `Independent Practice`, używany zarówno przez Home, jak i Practice Hub.

**Zakres:**

- runtime zwraca akcję bezpośredniego startu tylko dla jednoznacznego zestawu rozpoznawania oraz jawny wybór dla kontrastu i independent practice;
- lifecycle/read model udostępnia wyłącznie struktury zadeklarowane w artefakcie wraz z kanonicznym węzłem roadmapy i, dla kontrastu, `transferBoundary`;
- jeden ekran wyboru przekazuje wybrane `recognitionSetId`, `contrastSetId` albo `interleavedScopeId` do istniejącej ścieżki sesji;
- Home i Practice Hub korzystają z tej samej trasy oraz nie pozostawiają aktywnej akcji, która kończy się błędem braku zakresu;
- usunąć każdą zastąpioną ścieżkę skrótową lub test, który dopuszcza uruchomienie bez scope.

**Kryteria akceptacji:**

1. Rekomendacja rozpoznawania uruchamia sesję wyłącznie z jednym potwierdzonym `recognitionSetId`; brak lub wieloznaczność pozostaje jawną niedostępnością.
2. Kontrast pokazuje wyłącznie zestawy zawierające target mental unit i wymaga wyboru ucznia, gdy kandydatów jest więcej niż jeden.
3. Independent Practice wymaga wyboru spośród zadeklarowanych interleaved scopes.
4. Każdy wybór kończy się istniejącym `buildPracticeSessionConfig` z właściwym `algorithmScope`; żadna ścieżka nie używa pierwszego zestawu, globalnego banku ani identyfikatora wygenerowanego z tekstu.
5. Nazwa zakresu pochodzi z jedynego kanonicznego roadmap node, a opis kontrastu z `transferBoundary`.
6. Home i Practice Hub mają ten sam kontrakt; kliknięcie aktywnej pozycji nie może zakończyć się błędem „requires its declared content scope”.

**Weryfikacja:** testy runtime wyboru scope, Home, Practice Hub i route params; typecheck; pełna kontrola statyczna po zmianie kodu; sprawdzenie nieużywanych akcji, tras i importów.

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

Wykonać H04. To najmniejsza prawdziwa naprawa aktywnych trybów Algorithms: użytkownik wybiera zadeklarowany zakres tam, gdzie dane nie rozstrzygają go jednoznacznie, a runtime startuje sesję tylko z tym zakresem.
