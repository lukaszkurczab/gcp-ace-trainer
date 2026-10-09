# BIZQ-03 — adaptacyjny plan pod zakres, czas i termin

**Priorytet:** P1  
**Główne repo:** aplikacja + content; backend wyłącznie jako konsument koniecznej zmiany kontraktu sync  
**Zależności odbioru:** BIZQ-02, BIZQ-04, BIZQ-05 oraz naprawione pytania z BIZQ-01  
**Cel:** zastąpić powielanie domyślnej sesji propozycją uzasadnioną realnym materiałem, dowodami, powtórkami, dostępnością i datą celu.  
**Dokument wspólny:** [00 — plan BIZQ](00-PATTERNLY-BIZQ-PLAN-ROBOCZY.md).

## 1. Granica zadania

Docelowy planner nie ma odpowiedzieć „ile pytań mieści się do daty”, ale „jaką pracę warto wykonać w dostępnym czasie i czy założony zakres jest realistyczny”. Jest deterministyczny, działa offline i podaje powód rekomendacji.

Nie buduj systemu ML, modelu mastery, codziennego LLM coacha ani probabilistycznego przewidywania zdawalności. Konsumuj docelową regułę wszystkich rozdziałów z BIZQ-02; nie twórz własnej reguły ukończenia. Nie licz całego banku pytań jako obowiązkowego programu. Nie twórz nowego centralnego silnika sesji ani drugiego harmonogramu reminders.

**Wszystkie reguły planowania poniżej są docelową zmianą BIZQ.** Obecny kod i parametry muszą zostać odczytane przed implementacją. Nową semantykę wpisz do właściwego kanonicznego kontraktu i jego testów, nie tylko do komentarzy w generatorze.

## 2. Pojęcia, które muszą pozostać oddzielone

| Pojęcie | Właściciel / znaczenie |
| --- | --- |
| Cel | Typ przygotowania, wybrany zakres, termin lub own pace. |
| Dostępność | Dni i minuty, które użytkownik rzeczywiście przeznacza na ten plan. |
| Stan ukończenia pakietu | Wspólna ocena rozdziałów i agregacja ścieżki z BIZQ-02; nie jest nową definicją wiedzy. |
| Dowody edukacyjne | Z BIZQ-02/04/05: próby, etapy, pokrycie, błędy, due review, nowe przykłady. |
| Propozycja planu | Nowa, niezaakceptowana wersja rekomendowanej pracy i wykonalności. |
| Zaakceptowany plan | Stan zapisany i synchronizowany atomowo z celem. |
| Dzisiejsza rekomendacja | Odczyt wynikający z planu/dowodów w granicach jego kontraktu; nie potajemna modyfikacja zaakceptowanego planu. |
| Plan aktywnej sesji | Utrwalone occurrence/item/option order; nie zmienia się po nowych odpowiedziach. |
| Przypomnienia | Lokalny dla urządzenia harmonogram, osobny od prognozy i propozycji. |

Nazwa wyniku generatora `ready` oznacza poprawną propozycję techniczną, nie „learner is ready”. Nie mieszaj tych znaczeń w copy i testach.

## 3. Dane wejściowe

### 3.1. Fakty od użytkownika

Użyj obecnego modelu celu. Zachowaj rodzaje dat opisane w aktualnym planie głównym: wydarzenie dla egzaminu/rozmowy, termin dla foundations, checkpoint dla refresh, brak daty dla own pace.

Plan wymaga jawnych dni nauki i dostępnych minut. Jeżeli dotychczasowy ekran zapisuje jedynie długość sesji lub „light/regular/intensive”, nie traktuj tego jak potwierdzonej liczby minut. Rozszerz istniejący flow minimalnym, zgodnym z brandem wyborem dostępności i pokaż założenie przed akceptacją. Nie twórz drugiego onboardingu celu.

Jasno określ, czy budżet dotyczy jednego tracka, czy całej nauki. Nie licz tych samych 20 minut jako pełnego budżetu dla dwóch równoległych tracków. Gdy obecny model jest wyłącznie per-track, zachowaj tę granicę i pokaż użytkownikowi, że wpisuje czas dla tego tracka. Globalny optymalizator wielu tracków nie jest wymagany; potwierdzony wspólny budżet wymaga jawnego podziału, nie podwójnego zużycia.

### 3.2. Fakty z pakietu

Wykorzystaj istniejącą taxonomy, mental units, blueprinty trybów, uprawnienia, regułę ukończenia, accepted shortening paths i profile symulacji. Dla każdego potrzebnego elementu ustal istniejącego producenta i konsumenta.

Brakujące dane nie mogą zostać odgadnięte z liczby plików, długości JSON-a ani kolejności `modes[0]`. Najmniejsze uzasadnione rozszerzenie blueprintu planowania może zawierać:

- zakres jednostek/decyzji właściwy dla wybranego celu;
- priorytet i relacje konieczne do zaproponowania kolejnej pracy;
- dozwolone tryby i ich realne długości;
- autorski szacunek czasu dla danej klasy pracy/trybu;
- jawne warianty ograniczenia zakresu, jeżeli pakiet je dopuszcza;
- wersję polityki interpretacji dowodów i kosztu.

To metadane mające konkretnego konsumenta — planner. Nie dodawaj osobnego schematu contentu, drugiej taxonomy, kolejnego manifestu pytań ani nowych „statusów gotowości”. Brak potrzebnego pola ma być jawnie wskazany w raporcie kontraktu.

### 3.3. Fakty z nauki

Pobierz spójny snapshot z BIZQ-02: profil, track, pakiet, cel/plan, kwalifikujące próby, review i obecny stan sesji. Dołącz obsługiwane dowody etapów, nowych przykładów i rzeczywisty foreground time.

Wyświetlenie pytania nie jest wykonaniem pracy. Rozwinięcie Details nie jest sukcesem ani mastery. Nieutrwalona odpowiedź i draft symulacji nie są ukończonymi próbami. Zachowaj rzeczywiste zasady finalization.

## 4. Model pozostałej pracy

### 4.1. Trzy grupy użytkowe

1. **Nowy materiał / dalsza praktyka:** nieobjęte lub słabo zbadane decyzje w zadeklarowanym zakresie, dobierane według etapów nauki i istniejących reguł.
2. **Naprawa i utrwalanie:** rzeczywiste błędy i due obligations z BIZQ-04. Natychmiastowa naprawa i retrieval po czasie są odrębnymi celami.
3. **Sprawdzenie nowych przykładów:** dozwolona diagnoza/mixed practice/transfer/symulacja z BIZQ-05, w granicach uprawnień i profilu trybu.

Wewnętrzna reprezentacja może rozróżniać więcej powodów, ale UI nie powinno pokazywać technicznej taxonomy jako serii kart.

### 4.2. Co jest jednostką pracy

Jednostka planowania to konkretna potrzeba edukacyjna albo blok sesji, a nie każdy niewidziany item. Używaj `mentalUnitId`, stage i rzeczywistych review references. Dobierz ograniczoną liczbę zgodnych pytań do tej potrzeby. Nie generuj celu „przerób wszystkie 752 pytania”.

Wersjonowana polityka ma jawnie określać, jakie dowody uzasadniają następny blok. W pierwszej implementacji wykorzystaj istniejące rekomendacje etapowe; nie dodawaj ukrytego mastery score ani własnego progu „3 poprawne = opanowane”. Gdy w pakiecie brak podstaw do wyliczenia pełnej pozostałej pracy, planuj kolejny uzasadniony etap i pokaż niepewność horyzontu.

### 4.3. Unikanie podwójnego liczenia

Jedna planowana próba może realizować kilka potrzeb: zwiększyć kwalifikujący wolumen i sprawdzić konkretny mental unit. Jej koszt liczysz raz. Prawdziwa powtórka ma dodatkowo własny termin i zasady kwalifikacji; nie zaliczaj zwykłej praktyki jako review tylko po to, by zmniejszyć backlog.

Najprostszy model to planowane bloki z referencjami do pokrywanych potrzeb. `effort(block)` sumujesz po unikalnych blokach, nie po każdej krawędzi do potrzeby. Kontroluj duplikaty source-item, review-entry i work-unit. Prognozowana rezerwa review jest resztą po odjęciu już zaplanowanych rzeczywistych obligations, nie drugim naliczeniem tych samych pozycji.

### 4.4. Znana praca i niepewna praca

Rozróżnij:

- znane obowiązki, np. konkretne due entries i wymagane bloki w zadeklarowanym zakresie;
- planowaną, oszacowaną pracę edukacyjną;
- niepewną dodatkową pracę wynikającą z możliwych błędów i jakości ruchomego okna.

Jeżeli minimum prób jest osiągnięte, ale jakość nadal za niska, planner może zaproponować kolejny ograniczony blok naprawczy i późniejszy check. Nie może wyznaczyć gwarantowanej liczby poprawnych przyszłych odpowiedzi ani uznać pozostałej pracy za zero.

Zmiana kontentu/zakresu może zwiększyć wymagany nakład. Nie „naprawiaj” tego usunięciem dawnych błędów z historii ani przeliczeniem nieporównywalnych wersji na siłę.

## 5. Szacunek czasu

### 5.1. Początek bez historii

Użyj jawnej, wersjonowanej estymaty autorskiej odpowiedniej dla trybu/rodzaju zadania. Estymata ma obejmować rozwiązywanie i typowe czytanie feedbacku w danym trybie. Nie dodawaj kosztu Details po raz drugi, jeśli już mieści się w obserwowanym foreground time.

Nie ustanawiaj globalnego `1 pytanie = 1 minuta`. Pytanie definicyjne, trace algorytmu i scenariusz architektoniczny nie muszą mieć tego samego kosztu. Brak estymaty to `estimate unavailable` albo jawnie ograniczony plan, nie zero minut lub ukryte 60 sekund.

Szacunki autorskie są hipotezami do kalibracji, nie gwarancją czasu rozwiązania. W rekordzie/projekcji zachowaj źródło estymaty: `authored` albo `observed`, liczbę obserwacji i wersję metody — wykorzystując istniejące pola, gdzie to możliwe.

### 5.2. Kalibracja na rzeczywistych sesjach

Najpierw zweryfikuj semantykę istniejącego zegara. Nie dziel wall-clock od startu do końca sesji przez liczbę pytań; pobyt w tle lub wielogodzinna przerwa nie jest nauką.

**Decyzja właściciela z 07.10.2026 — kalibracja czasu:** początkowo używać szacunków autorskich właściwych dla rodzaju zadania. Tempo użytkownika stosować po co najmniej 5 porównywalnych ukończonych sesjach i 20 odpowiedziach, uwzględniając najwyżej 10 ostatnich takich sesji. Użyć mediany aktywnego czasu na odpowiedź, obejmującego również błędne odpowiedzi i czytanie objaśnień; czas w tle nie jest czasem nauki. Nie przenosić tempa pomiędzy nieporównywalnymi rodzajami zadań. To zatwierdzona polityka startowa do zapisania w wersjonowanej polityce i testach; nie jest dowodem wdrożenia ani optymalnego doboru liczb. Szacunek pozostaje przybliżeniem. Przed implementacją uzgodnić właściwy zapis kanonicznego kontraktu 01 z tą zatwierdzoną polityką; dawne ogólne określenie liczb jako propozycji nie wycofuje decyzji właściciela.

Nie kalibruj osobno na samych poprawnych lub najszybszych odpowiedziach — zaniżyłoby to koszt nauki. Nie przenoś tempa prostego trybu certyfikacyjnego na Design Interview. Dla mieszanego materiału stosuj istniejące szczegółowe dane czasu albo pozostaw klasową estymatę autorską z niepewnością; nie przypisuj całego kosztu wszystkim itemom jednocześnie.

Bardzo wolne sesje mogą być rzeczywistym czytaniem, a bardzo szybkie zgadywaniem. Odporna estymacja czasu nie może zmieniać wyniku nauki ani tworzyć diagnozy umiejętności z szybkości. Nie potrzebujesz nowej telemetrii serwerowej.

## 6. Kalendarz i wykonalność

### 6.1. Dostępna pojemność

Dla kwalifikujących się lokalnych dni nauki:

```text
C = suma minut faktycznie dostępnych w dniach do granicy celu
```

Dni wyznaczaj w strefie użytkownika przez semantykę lokalnej daty, nie dzielenie różnicy timestampów przez 24 godziny. Uwzględnij dni tygodnia, wyłączenia już obsługiwane przez aplikację, niezużyty dzisiejszy budżet i zmianę strefy.

Czas już wykonany dzisiaj zmniejsza dostępną pojemność, ale nie liczy się drugi raz jako przyszła praca. Nie odejmuj czasu innego tracka, jeśli budżety są jawnie oddzielne; przy wspólnym budżecie odejmuj go raz na poziomie tego budżetu.

**Granica daty:** termin/checkpoint z samą datą obejmuje tę lokalną datę do końca dnia, o ile aktualny kontrakt nie stanowi inaczej. Wydarzenie z godziną kończy planowanie przed godziną wydarzenia. Dla wydarzenia z samą datą nie zakładaj dostępnego pełnego dnia egzaminu — pokaż jawne założenie i zaplanuj pracę do poprzedniego dnia. Jest to proponowane doprecyzowanie BIZQ; zapisz je w kontrakcie i UI przed wdrożeniem.

Own pace nie otrzymuje sztucznego deadline'u. Generuje następne uzasadnione działania w zadeklarowanym rytmie. Przeszły termin nie skutkuje ujemną liczbą pytań ani automatyczną zmianą celu.

### 6.2. Oszacowana praca

```text
R = czas nowych/dalszych bloków
  + czas realnych review/remediation obligations
  + uzasadniona rezerwa przyszłego review
  + czas zaplanowanych checks
```

To suma pracy bez duplikatów. Rezerwa przyszłego review jest prognozą, nie wpisem do kolejki. Nie twórz fikcyjnych prób, błędów ani `dueAt`. Wyznacz ją z obecnej polityki review, planowanych ekspozycji i — przy wystarczających danych — zaobserwowanej potrzeby powtórek. Bez danych użyj jawnej wersjonowanej rezerwy określonej w blueprintcie. Nie narzucaj na stałe każdemu użytkownikowi „20% sesji to review”.

Wynik powinien umieć odróżnić znane minimum, centralną estymatę i niepewną górną granicę. Nie muszą to być trzy liczby na ekranie; mogą być polami domenowymi wspierającymi uczciwą komunikację. Przedział nie jest statystycznym 95% confidence interval.

### 6.3. Stany decyzji

| Stan semantyczny | Warunek | Komunikat/akcja |
| --- | --- | --- |
| Wykonalny według estymaty | Zakres i koszt są określone, plan mieści się w zadeklarowanym czasie | Propozycja planu z estymatą i ograniczeniem, nie gwarancja zdania. |
| Niedobór czasu | Znana konieczna praca lub ograniczenia terminów nie mieszczą się w pojemności | Pokaż różnicę i konkretne dozwolone zmiany. |
| Niepewna pełna estymata | Jakość/zakres/tempo uniemożliwiają oszacowanie całego przygotowania | Zaplanuj kolejny etap, pokaż ograniczenie i kiedy wynik zostanie przeliczony. |
| Brak kontraktu | Brakuje potrzebnej reguły, blueprintu lub metadanych | Jawny brak; nie „zero pozostałej pracy”. |
| Own pace | Brak terminu | Brak shortfall względem daty; następna użyteczna praca. |
| Dostęp/pakiet blokuje | Nie ma prawa lub prawidłowego contentu do zaproponowanego działania | Prawdziwy stan dostępu/contentu, nie problem z czasem. |

Wykonalność czasowa i spełnienie reguły nauki to dwie osie. Użytkownik może mieć dość czasu, ale nie mieć jeszcze dowodów jakości. Może też spełnić regułę pakietu, lecz nadal chcieć utrwalać do wydarzenia.

### 6.4. Przykład liczbowy do testów

Fixture A ma 360 minut nowej/dalszej pracy, 90 minut review i 30 minut checks; razem 480 minut. Przy 12 dniach po 20 minut pojemność to 240 minut. Niedobór wynosi 240 minut, a równomierne tempo wymagane dla estymaty to 40 minut na dostępny dzień. Planner nie może uznać celu za mieszczący się w 20 minutach tylko dlatego, że zaproponował 10 pytań.

Fixture B: ten sam nakład, 24 dni po 20 minut — mieści się nominalnie, bez rezerwy dodatkowej. Fixture C: 30 dni po 20 minut — zapas 120 minut może pomieścić rzeczywiste powtórki/niepewność; nie trzeba zwiększać liczby nowych pytań tylko po to, by zapełnić każdy dzień.

Liczby nie są estymatą realnego tracka. Każdy test ma jawny blueprint i fake clock.

## 7. Generator planu — najmniejszy spójny algorytm

### 7.1. Kolejność obliczeń

```text
1. Waliduj spójny snapshot, cel, uprawnienia i dostępny pakiet.
2. W razie aktywnej sesji zachowaj jej plan; uwzględnij continue/finish.
3. Zbuduj rzeczywiste potrzeby pracy na podstawie evidence i review.
4. Usuń duplikaty kosztu i rozdziel pracę znaną od niepewnej.
5. Oszacuj koszty z jawnego źródła, zgodnie z trybem i materiałem.
6. Zbuduj lokalny kalendarz oraz pojemność do granicy celu.
7. Rozmieść review z zachowaniem jego dueAt; nie przesuwaj go wstecz.
8. Zaplanuj uzasadnione nowe/dalsze bloki i checks w dostępnych dniach.
9. Sprawdź wykonalność całej estymaty, uprawnienia i dostępność pul.
10. Zbuduj propozycję + powody + różnicę wobec zaakceptowanego planu.
11. Przed akceptacją ponownie sprawdź identity i wykonaj istniejącą atomową mutację.
```

Do obliczeń nie potrzeba wyboru wszystkich konkretnych pytań na kilka miesięcy. Plan nauki może zawierać scope/mode/length i koszt; właściwy komplet occurrence/item/option order powstaje dopiero przy kanonicznym przygotowaniu sesji. Po rozpoczęciu sesji pozostaje niezmienny.

### 7.2. Priorytety

**Decyzja właściciela z 07.10.2026 — rozpoczęcie planu:** jedna diagnoza na początku, potem praktyka, dla ścieżek obsługujących diagnozę. Jej wynik zasila dobór zakresu dalszych ćwiczeń. Nie wybieraj diagnozy jako domyślnej powtarzanej sesji planu. Nie dodawaj trybu diagnostycznego do ścieżki, która go nie obsługuje, ani nie omijaj kontroli dostępu. Ta decyzja określa sposób rozpoczęcia planu; nie ustanawia nowych progów ukończenia i nie potwierdza wdrożenia.

Wykorzystaj family policy: aktywna sesja, pilne due/remediation i powtarzalne błędy, brakujące etapy w ważnym zakresie, a następnie odpowiednie checks. Tie-break ma być stabilny, np. due date, istniejący priorytet celu, niższe pokrycie, stabilny ID.

Nie wybieraj automatycznie pierwszego noda ani `modes[0]`. Priorytety mają być zależne od celu i danych, ale bez branchy po konkretnym trackId w shared kernel.

Gdy backlog review pochłania całą pojemność, pokaż to uczciwie. Nie zwiększaj samowolnie budżetu ani nie przesuwaj due wstecz; nie kasuj też maintenance, żeby ukryć zaległość. Użytkownik zachowuje manualny wybór innej dozwolonej sesji. Plan ma ujawnić kompromis, nie wymusić nieskończoną pułapkę powtórek.

### 7.3. Dobór dziennej intensywności

Nie wykorzystuj zawsze maksymalnego budżetu na nowe pytania. Rozdziel pozostałą oszacowaną pracę proporcjonalnie do pozostałej dostępności, z pierwszeństwem realnie zapadających terminów review i wymaganych okien checks. Bliski termin może wymagać pełnego budżetu; odległy — mniejszych sesji i dni powtórkowych.

Przykładowy wskaźnik roboczy przed kwantyzacją do długości sesji:

```text
cel minut na dzień ≈ pozostała oszacowana praca ×
                    dostępność danego dnia / pozostała dostępność
```

To narzędzie rozłożenia pracy, nie nowy dowód wiedzy. Przy niedoborze ogranicz plan do zadeklarowanej pojemności i pokaż nieobsłużony zakres. Nie dopasowuj wyniku przez ciche usunięcie wymagań.

### 7.4. Legalne rozmiary sesji

Wybieraj wyłącznie długości obsługiwane przez aktualny tryb/pakiet, np. 10/20/40 tam, gdzie rzeczywiście są dozwolone. Nie uruchamiaj 13 pytań, bo taki wynik wyszedł z dzielenia minut. Nie skracaj fixed diagnostic ani symulacji ze względu na budżet.

Dopuszczone skrócenie review przy małej kompatybilnej puli nadal pokazuje realną długość. Brak treści nie jest powodem do uzupełnienia sesji obcym materiałem. Quick Review bez due items nie jest uniwersalnym sposobem zapełnienia małego okna.

Gdy żaden dozwolony blok nie mieści się w budżecie, pokaż realny koszt i istniejące dozwolone akcje. Można wykorzystać resume tej samej sesji w kolejnych oknach, jeżeli aktualny tryb na to pozwala i plan jawnie reprezentuje kontynuację, nie kilka nowych sesji. Tryb z absolutnym czasem egzaminu nie może zostać sztucznie rozłożony na dni. Użytkownik może świadomie zwiększyć budżet; planner nie robi tego za niego.

Szacunek czasu nie jest timerem odcinającym pytanie. Nie przerywaj odpowiedzi w połowie po wykorzystaniu minut. Rzeczywiste przekroczenie kosztu zasila następną estymację.

## 8. Kiedy i jak plan się zmienia

Przelicz propozycję po ukończonej pracy, nowych due obligations, powrocie po przerwie, zmianie daty/dni/minut, zmianie zakresu/pakietu, uprawnień i rozwiązaniu konfliktu sync. Użyj istniejących safe entry points; nie pokazuj nowego dialogu po każdej odpowiedzi.

Można na bieżąco odświeżać read-only forecast oraz dozwoloną rekomendację wewnątrz zaakceptowanego zakresu. Zmiana utrwalonych dni, czasu, zakresu lub zobowiązań planu wymaga nowej propozycji/rewizji i istniejącej akceptacji. Nie przebudowuj obecnego modelu sync na „elastyczną intencję” tylko dla wygody — wykorzystaj istniejący owner.

Pokaż krótką różnicę: np. więcej review, mniej nowego materiału, potrzebne dodatkowe minuty albo nierealny zakres. Po odmowie pozostaje dotychczasowa atomowa para cel+plan; realna prognoza może nadal pokazywać niedobór. Po akceptacji synchronizuj całą parę, a lokalne reminders aktualizuj w ich własnym workflow.

Opuszczony dzień nie tworzy reguły „jutro dwa razy więcej”. Rozdziel pracę po pozostałych dostępnych dniach. Jeśli to nie wystarcza, pokaż shortfall.

Zmiana deadline'u nie przyspiesza biologicznego upływu czasu: planner nie skraca `dueAt`, nie zalicza wcześniejszych odpowiedzi jako retention i nie obiecuje sprawdzenia trwałości, którego nie da się wykonać przed wydarzeniem.

## 9. UI i komunikaty

Najpierw dopasuj istniejący ekran propozycji i Home. Preferowany zakres: jedna główna akcja, krótki nakład, powód i dostęp do szczegółów. Nie pokazuj wszystkich wewnętrznych pól w nowych kartach.

Przykładowe znaczenia copy do przygotowania w obowiązujących locale:

- „Today: review access policies, then continue networking. About 20 minutes.”
- „You have 12 study days left. This plan is estimated to need about 40 minutes per study day.”
- „Your time budget covers only part of this plan. Change your time, scope or target date.”
- „We can plan your next step, but need more practice results to estimate the full workload.”

To przykłady intencji, nie nakaz wklejenia długiego tekstu. Nie używaj „AI optimized”, „ready in 12 days”, readiness percentage ani technicznych nazw `minimumAttemptCount` w interfejsie.

Przy skróceniu zakresu wolno oferować tylko realną, dopuszczoną ścieżkę pakietu. Wyraźnie nazwij wyłączone obszary; nie nazywaj częściowego zakresu pełnym przygotowaniem do egzaminu. Przy braku takiej ścieżki oferuj tylko dostępne realne zmiany, nie wymyślony „essential mode”.

## 10. Obowiązkowa macierz testów

| ID | Scenariusz | Oczekiwany wynik |
| --- | --- | --- |
| A01 | Identyczne dane, termin za 7 i za 60 dni | Różny rozkład nakładu lub jawny shortfall; nie identyczne 10 pytań niezależnie od celu. |
| A02 | 480 min pracy, 240 min pojemności | Jawny niedobór 240 min przy zadanych fixture; nie przepełniony plan oznaczony wykonalnym. |
| A03 | Nowy użytkownik bez historii czasu | Jawna estymata autorska albo brak estymaty; nie globalne 60 sekund. |
| A04 | Doświadczenie w jednym obszarze, brak innych | Plan zmienia zakres, a nie tylko liczbę pytań. |
| A05 | Minimum prób spełnione, próg jakości nie | Następny uzasadniony etap + niepewność; nie „gotowe”. |
| A06 | Dużo czasu i mało nowego materiału | Review/checks w prawdziwych terminach, brak fillerów. |
| A07 | Duży backlog review | Uczciwy podział i shortfall; nie zgubione entries ani nieskończone nowe sesje. |
| A08 | Dzień opuszczony | Replan w pozostałym budżecie, bez automatycznego podwojenia jutra. |
| A09 | Own pace | Brak deadline'u i karzących komunikatów; działają kolejne rekomendacje. |
| A10 | Termin dzisiaj/wczoraj/brak dni nauki | Jawny przypadek graniczny, bez dzielenia przez zero lub ujemnej pracy. |
| A11 | Zmiana DST w Europe/Warsaw, 25.10.2026 | Lokalny dzień jest liczony raz; brak arbitralnego założenia 24h dla każdej doby. |
| A12 | Zmiana strefy i granica dnia | Identity/refresh poprawne; bez znikania lub dublowania slotów. |
| A13 | Minimum trybu dłuższe niż budżet | Dozwolona kontynuacja lub jawny brak dopasowania; nie nielegalna długość. |
| A14 | Fixed diagnostic/symulacja | Zachowane długości, feedback i timer; planner nie „ścina” egzaminu. |
| A15 | Due za tydzień, deadline jutro | Brak przyspieszonego zaliczenia retention; ograniczenie jawne. |
| A16 | Jedna próba realizuje wolumen i coverage | Czas policzony raz, evidence zgodnie z każdą właściwą semantyką. |
| A17 | Dwa tracki i wspólne 20 minut | Brak podwójnego użycia pojemności lub jawnie rozdzielony budżet. |
| A18 | Oferta Premium w planie Free | Brak przygotowania/nawigacji obchodzącej bramkę; zakres dostępności jawny. |
| A19 | Aktywna sesja podczas przeliczenia | Brak zmiany occurrence/option order i brak przerywania. |
| A20 | Zmiana celu/dowodów tuż przed accept | Stale proposal nie nadpisuje nowszej pary. |
| A21 | Offline→restart→sync conflict | Ten sam lokalny wynik, konflikt rozwiązywany w safe point. |
| A22 | Odrzucona aktualizacja planu | Stary zaakceptowany plan pozostaje, forecast nie kłamie o wykonalności. |
| A23 | Scheduler reminders fail po accept | Stan planu i powiadomień rozdzielony, bez pozornej aktywacji. |
| A24 | Niepoprawne/missing metadata | Jawny problem konkretnego kontraktu, bez fallback mode/item/rule. |

Test A11 używa danych kontrolowanego kalendarza, nie sieci ani realnego oczekiwania na zmianę czasu. Sprawdź aktualny runtime timezone contract. Przy parametrach kosztu testuj zero/NaN/ujemne wartości, przekroczenia zakresu dat i brak wystarczających obserwacji.

## 11. Etapy i odbiór

Wykonuj kolejno: kontrakt i fixtures → model pracy → czas/kalendarz → generator i feasibility → integracja proposal/accept/sync → UI i regresja. Nie twórz wszystkich warstw naraz bez sprawdzenia, czy istniejący moduł już posiada daną odpowiedzialność.

Odbiór wymaga co najmniej dwóch rzeczywistych rodzin materiału o odmiennym charakterze zadań, np. Coding Interview i Certification; Design Interview również przechodzi test dostępu i konfiguracji. Pełna końcowa macierz pokrywa wszystkie aktualnie oferowane tracki w zakresie zgodności danych wejściowych.

Pokaż na iOS trzy wersje planu dla tego samego tracka: nowy użytkownik, powracający z review oraz bliski niewykonalny termin. Każdy plan musi prowadzić do rzeczywistej zgodnej sesji, nie karty z fixture. Syntetyczne profile są dopuszczalne jako dane testu, ale używają prawdziwego runtime i zatwierdzonego contentu.

Raport zawiera algorytm i wersję polityki, pochodzenie kosztów, listę braków metadata, różnice planów, testy, identity/sync evidence i ograniczenia prognozy. Brak danych od użytkowników oznacza, że trafność estymat nie została jeszcze empirycznie potwierdzona; nie blokuje technicznego odbioru, ale blokuje claim o udowodnionej skuteczności.

## 12. Bieżące wykonanie — 08.10.2026

Cel pozostaje pełny A01–A24 i odbiór §11. Pierwszy pakiet wdraża kontrakt
producenta i konsumenta oraz rzeczywistą atomową akceptację; nie zamyka BIZQ-03.
Niezależny Luna high design review zatwierdził małą projekcję `planningPolicy`
w istniejącym exact artefakcie. Po wykryciu braku curriculum target→runtime unit join projekcja przenosi
bezpośrednie exact runtime scope `(nodeId, mentalUnitId, modeId)` i autorskie
koszty z niepewnością/rezerwą scoped per estimate albo explicit unavailable.
Scope jest weryfikowany przeciw rzeczywistym canonical pytaniom; nie deklaruje
pokrycia curriculum targetów ani official domains. Wspólne koszty mogą grupować
exact refs tylko przy tym samym uzasadnieniu i zakresie. Nie dodawać nowego enum
klasy pracy bez istniejącego właściciela. Niezależny revised-design review:
fit0.93/simplicity0.92/risk0.90/maintainability0.91; minimum0.90. Bez nowej taxonomy, manifestu, content stage-order ani
kopii legal lengths/Premium/shortening: ich właścicielem pozostaje APP/family.
Szacunki są nowymi wersjonowanymi hipotezami, nie potwierdzoną trafnością.

Dostępność `minutesPerStudyDay` ma jednego trwałego właściciela — accepted plan;
cel i dostępność pozostają draftem przed accept. Obecny zapis goal-first i
plan-only CAS nie spełnia odmowy zachowującej starą parę. Zatwierdzona korekta
używa discriminated `accept_goal_plan` w istniejącym ACTIVE_JOURNAL i wspólnej
write lane: exact before/after envelopes, pinned profile, revision/fingerprint,
roll-forward recovery i gate odczytów/sync. Bez fake session fields i rollbacku
nieutrwalonego jako decyzja. Independent architecture review: fit0.94,
simplicity0.86, risk0.83, maintainability0.88; minimum0.83.

Kalibracja ma jeden APP-side pure projection z kanonicznych ukończonych sesji
i committed attempts. Obecny runtime utrwala łączny `activeForegroundMs`, nie
czas każdej odpowiedzi. Wersjonowana metoda użyje mediany ilorazów aktywnego
czasu sesji i liczby jej odpowiedzi: co najmniej 5 porównywalnych sesji i 20
odpowiedzi, najwyżej 10 ostatnich; błędy, partial i czytanie objaśnień pozostają
w czasie i mianowniku. Tylko kompletny unique attempt set i jedna zgodna klasa
estymaty/polityki/artefaktu; mixed/legacy/active/abandoned lub niewiarygodny timer
nie kalibrują. Content pozostaje authored z observationCount0; APP zachowuje
źródło, liczby i wersję metody, bez dodatkowego persistence/telemetry. Independent
design review: fit0.94/simplicity0.87/risk0.83/maintainability0.88; minimum0.83.
To zatwierdzenie projektu, nie odbiór implementacji lub trafności estymat.

Integracja ujawniła brak trwałej semantyki trybu: Home ponownie wybierał
`modes[0]`, a plan nie zachowywał zaakceptowanego mode/scope/length. Zatwierdzony
projekt rozszerza nieopublikowany plan v2 o jeden `executionPolicy` z osobną
initial diagnosis i recurring practice; due review używa istniejącego resolvera
i kanonicznej kolejki. Proposal i Home używają jednego APP chooser. Potwierdzone
HEAD APP/backend obsługują tylko produkcyjne v1, więc nie tworzyć ghost legacy
v2/v3. Aktualizować strict storage/export/sync/backend w tym samym pakiecie.
Historia zweryfikowanej diagnozy dla tracka nie resetuje się po nowym planId
lub polityce kosztu: active resume, completed practice, abandoned jawna akcja
bez cichego zaliczenia lub automatycznej pętli. Niezależny revised design review:
fit0.94/simplicity0.88/risk0.84/maintainability0.88; minimum0.84.

Pauza/wznowienie nie mogą zapisywać samego goal i rozrywać goalRevision pary.
Rozszerzyć ten sam typed pair journal/lane o jawny lifecycle cause, CAS obu
rekordów i coherent transitions active+accepted ↔ paused+paused; ukończony plan
nie jest reaktywowany. Zachować before/after, recovery i read/sync gates;
reminder reconciliation dopiero po zapisie, z osobnym błędem. Niezależny review:
fit0.93/simplicity0.84/risk0.82/maintainability0.86; minimum0.82.

Pre-push próba CI potwierdziła konflikt źródła z historycznym kandydatem:
automatyczny workflow odbudowywał current source w starej ścieżce i próbował
użyć hash-bound decyzji BIZQ-05. Nowy candidate jest prawidłowo odrzucany jako
stale względem starej decyzji; historyczne verifyCandidateReleaseEvidence nadal
przechodzi i zachowuje publishing/runtime not_granted. Zatwierdzona najmniejsza
korekta obejmuje automatic workflow i jego test: current source draft w
RUNNER_TEMP quarantine, jawny draft/not_granted, osobny odczytowy istniejący
validator historycznych dowodów. Bez zmian manual release gate, approval,
admission lub historycznych artifacts. Root independent review z actual
source/probes: fit0.95/simplicity0.93/risk0.90/maintainability0.94; minimum0.90.
To bramka źródła, nie nowe runtime/publishing admission.

Niezależny źródłowy przegląd kalendarza potwierdza existing date-only owner:
projectGoalTargetDate event strictly_before (ostatni dzień poprzedni),
deadline/checkpoint inclusive, own pace none. Nie dodawać nieistniejącej godziny.
Today/due-day liczyć w aktualnej strefie, stale/refresh po jej zmianie; stored
civil target i absolutny dueAt bez przesunięcia. Real resolver nadal sprawdza
instant due, także później tego samego dnia. activeForegroundMs jest lifetime:
całość odejmować tylko przy udowodnionym same-local-day interval; sesja obejmująca
północ i dziś daje jawnie unknown today capacity, bez arbitralnego0/whole.
Przyszłe dni zachowują known budget; dzienny ledger nie jest nową bramką tego
pakietu. Source review fit0.90/simplicity0.84/risk0.82/maintainability0.84;
minimum0.82, implementacja/tests OPEN.

A19: rzeczywista próba wykazała, że policy-only bump version/SHA odcina także
kwalifikację wcześniejszych postępów, due reviews i terminalnych tombstones.
Zatwierdzono jeden composite training owner: odtworzenie dokładnego wcześniejszego
v1 z nowego źródła przez usunięcie planningPolicy i przywrócenie wyłącznie
schema/contentVersion. Dla wszystkich dziewięciu ścieżek niezależnie uzyskano
identyczny wcześniejszy payload i jego pełny SHA. Training, nowe odpowiedzi,
progress, review i reminders pozostają przy tej rzeczywistej tożsamości v1;
polityka planowania pochodzi z osobno zweryfikowanego v2 i ma własny jawny pin.
Bez aliasów SHA, osłabienia strict parsera, remapowania historii lub podwójnego
runtime. Canonical sync generuje i zachowuje exact predecessor/successor ledger,
sprawdza obie strony i fail-closed przy niespójności; późniejsza zmiana semantyczna
nie może cicho usunąć tego kontraktu. Scope tylko potwierdzony cost-only v1→v2,
bez ogólnego archiwum dowolnych wersji. Independent revised design:
fit0.96/simplicity0.83/risk0.82/maintainability0.82; minimum0.82.
To odbiór projektu i próby źródłowej; implementacja, integracja i native A19 OPEN.

Zależność real native acceptance: nowy existing-user account profile nie dostaje
wymaganego installation/dataset marker; actual memory router→accountDataService
reprodukuje guest_installation_required przy zachowaniu Guest. Zatwierdzony bounded
fix istniejącego profile owner: registry-first → absent marker CAS/readback →
activation; account_bound/accountId exact, localDatasetId zachowany z profilu.
Retry po błędzie refresh/invalidate prepared routing bez activation (dotychczas
transitionActive zakleszczał retry). Wyłącznie pusty scope; malformed/foreign/guest
lub nonempty missing fail-closed/nooverwrite. Odzyskanie po registry commit może
wygenerować nowy distinct installationId przy zachowanym profile.id; żadnej
adopcji lub kasowania Guest, synthetic AccountBinding lub pełnego AUTH rewrite.
Independent revised design fit0.94/simplicity0.84/risk0.82/maintainability0.86;
minimum0.82. To dependency w BIZQ-03, nie przełączenie na konkurencyjny plan.

Uzupełnienie 09.10 — pełny model pracy. Niezależny przegląd odrzucił
wycenianie całego wolumenu C3 przez scope jednego najbliższego bloku (risk0.72).
Zatwierdzony revised projekt zachowuje deficyt każdego obowiązkowego rozdziału,
rzeczywiste due references i exact koszt legalnego trybu. Kwalifikująca odpowiedź
review może pomniejszyć wolumen tylko swojego rozdziału o najwyżej jeden; czas
jest liczony raz, a pozostały deficit to dalsza praktyka. Rezerwa jest dodatkową
prognozą według autorskiej klasy, nigdy nowym wpisem kolejki. Obecny selector
nie daje rozkładu przyszłych odpowiedzi dla wszystkich rozdziałów: exact scope
najbliższego bloku pozostaje osobno; przyszłe bounds wolno podać tylko przy
koszcie każdego możliwego scope rzeczywistej legalnej puli, z jawną niepewnością
rozkładu. Brak legalnego trybu/scope/kosztu lub repair-volume contract zachowuje
jawny rozdział unknown i blokuje full-fit; obowiązkowe Premium nie znika.
Nie retargetować ProductModeConfig ani symulować przyszłych odpowiedzi.
Oceny fit0.84/simplicity0.80/risk0.82/maintainability0.82; minimum0.80.
To zatwierdzenie projektu, nie odbiór full-work/calendar/coordinator/UI A01–A24.

Uzupełnienie integracji 09.10 — niezależny real GCP coordinator wykazał
zero full-work demand i open_ended_preview dla datowanych celów +7/+60 dni;
74 przechodzące testy nie odebrały tej integracji. Korekta ma typed obligations
per phase (diagnosis/practice/due_review) z legalnymi długościami. GCP fixed
ordered diagnosis posiada dokładne QID; koszt całego requestu i prognozowany
credit do minimum rozdziału liczone raz, bez przyszłych durable evidence.
Aktywna diagnoza używa pozostałego utrwalonego itemOrder; ukończona nie wraca,
porzucona ma jawny stan. Aggregate bounds dalszej legalnej praktyki obejmują
cały rzeczywisty selectable pool i koszt każdego możliwego scope; min/max
konserwatywne, centralna mediana scope to jawna estymata polityki. Nie wymagamy
materializacji przyszłych QID; niepełny pool/koszt pozostaje unknown/full-fit
niepotwierdzony. Available A04 sprawdza rzeczywiste wyjściowe QID/unit refs
selektora przy tym samym celu i różnych pinned histories, nie sam modeId.
Independent design fit0.88/simplicity0.84/risk0.80/maintainability0.82;
minimum0.80. Full A01–A24 i native pozostają otwarte do odbioru implementacji.

Bieżący kalendarz wymaga distinct unknown capacity i unknown-blocked obligations,
bez dopisywania ich do confirmed no-fit/shortfall; real due jest rozkładane
według earliest due i dostępnej pojemności. Native bounded account preparation,
zachowanie11 wcześniejszych profili/kategorii77/77 i cold-start powiązanego
profilu mają niezależny odbiór: [raport](../../reports/bizq03-account-profile-native-2026-10-09.md).
Nie zastępuje to journal fault/relaunch, aktywnej sesji ani trzech planów.

Korekta bramki CI po policy-only v2: rzeczywisty candidateContentReleaseLock
check odrzuca raw v2 bundled lock wobec immutable training candidatev1.
Niezależna rekonstrukcja z istniejącego successor ledger daje dokładny dawny
v1 lock SHA i wszystkie dziewięć training identities. Zatwierdzono użycie
jednego istniejącego reconstruction ownera do kontroli tego poprzednika,
bez przepisywania schema3 release.lock, kandydatury, historii lub admission.
Oddzielny wymagany actual current producer build/roundtrip (CI recorded SHA)
pozostaje dowodem v2 policy source; nie jest nową zgodą runtime/publishing.
Negatywne sprawdzenia muszą odrzucać zmienione pytania/training pin oraz
niezgodny policy output. Independent design fit0.93/simplicity0.88/risk0.86/
maintainability0.88; minimum0.86. Implementacja i CI jeszcze nieodebrane.

Native lokalnego przerwania pary: debugger nie udostępnia exact runtime source,
więc testy narzędzia nie odebrały fault/replay. Niezależnie zatwierdzono prostszą
jednorazową __DEV__ awarię po rzeczywistym zapisie i readback celu, przed zapisem
planu, bez zmiany synchronicznych blokad. Strict actor/binding/live SDK UID/lease/
profile/track/proposal/nonce oraz exact persisted journal i envelopes; tylko
świeży kontrolowany profil bez celu/planu/sesji/transition. Po błędzie istniejący
catch pozostawia journal_durable i storage_error, read/sync fence pozostaje.
Root kill tylko po potwierdzonym actual receipt, zwykły bootstrap i exact replay;
bez resetu/global override/sztucznych danych/persistentdebugflag/secretslog.
Oceny fit0.92/simplicity0.90/risk0.85/maintainability0.88; minimum0.85.
To projekt kontrolowanej awarii po native write i restartu, nie power-loss lub
literalnego CPU breakpoint; offline→restart→sync konflikt A21 pozostaje osobny.
Implementacja i bounded native fault/restart/recovery odebrane niezależnie09.10; pełny offline HTTP conflict i pozostały odbiór otwarte.

Kolejność implementacji: CONTENT source/schema/build → APP transport/planner i
BACKEND strict sync consumer; merge po zintegrowanym QA, deployment/publikacja
pozostają osobno autoryzowane. Historyczne exact pakiety i aktywne sesje zachowują
identity; nowe piny nie zastępują utrwalonego occurrence/item/option order.
Odbiór będzie obejmował actual producer output → APP oraz przerwania journalu;
same mocki/typecheck nie zamykają kryteriów. Bieżące dowody i następny krok
są w [jedynym stanie](../../../.agent/WORKING_STATE.md).

### Doprecyzowanie native probe i zegara — 09.10

Niezależny source-design review odrzucił globalny storage setter failpointu: mógł przetrwać do kolejnej propozycji bez authority aktora. Approved correction: arm one-shot jest application runtimeAuditability-owned; konkretny commit przekazuje synchroniczny callback aż do repo seam po exact Goal readback i przed Plan write. Recovery nigdy nie dostaje callbacku. Final synchronous actorFence/lease/exactjournal/proposal/nonce guard, mismatch disarm i consume-before-throw, bez await/nowego journalu/destrukcyjnego resetu. Fit0.91/simple0.84/risk0.84/maint0.84, minimum0.84. Native bounded atomic-pair interruption/restart/recovery independent PASS09.10, strictreceipt allguards→exactpair/revisions/journalclear i stare77/77/GCPpreserved; pełna A21 offline HTTP conflict nadal OPEN.

Dev clock audit wykazał wyłącznie harness mismatch: lifecycle używa istniejącego adjustable WallClock, proposal/editor/Home brały Date systemowy. Approved minimalna integracja wszystkich trzech konsumentów przez publiczne lifecycle.currentTime; production default systemtime unchanged, bez globalDateoverride/history mutation/24h wait. Source graph review acyclic; test actual answer→due→advance→proposal/Home i native po freeze. Fit0.93/simple0.90/risk0.87/maint0.90, minimum0.87. To design approval, nie runtime odbiór.


### Doprecyzowanie konfliktu synchronizacji A21 — 09.10

Research currentownerów wykazał, że zwykły 409 utrwala konflikt, ale retry wysyła stary SyncPlan/accountRevision. docs04:371–375 wymagają atomic Goal/Plan pair i conflict choice at safe entry. Reused local/account group semantics nie oznacza wywołania guest adoption endpoint dla już powiązanego konta. Pierwszy design min0,68 odrzucono: full remote materialization mogłaby wyczyścić inne lokalne pary/outbox; pair-only journal zostawia crash window ponownego uploadu starego intentu.

Ostateczny independent APPROVE design min0,82 (fit0,93/simple0,82/risk0,84/maint0,84): jawny409 tworzy durableconflict gate blokujący startup/HomeautoPOST. Wyłącznie wejście użytkownika w bezpieczny resolver pobiera latestGET poza write lane. Niezmienione pendingtargetversions+whole touchedpair/absence/tombstones pozwalają zrebasować accountRevision i przebudować SyncPlan; zmieniona para wymaga explicit wholetrack local/account choice, bez automatycznego winnera. Timeout zachowuje dokładne poprzednie żądanie i nigdy nie uruchamia rebase.

Keep-account używa tego samego ACTIVE_JOURNAL/write lane/recovery dla exact before/after Goal/Plan envelopes ORAZ pełnego CAS sync-state delta: wyłącznie selectedpair outbox drop/ackversions/revision i remainingplan rebuild, bez usunięcia niezależnej pracy/ackedbatches. Read/sync fences do pełnego readback i clearjournal last. Keep-local zachowuje localpair i atomowo zmienia oba expectedremoteversions/mutationIDs/plan w CAS syncstate. Confirm rechecks SDKactor/bindinglease/profile/localdatasetversion+fingerprint/outbox/remoteversion oraz noactivesession/journal/materialization/reset/pendingchoice; stale/invalid failclosed preserve local.

Backend existingtransaction odczytuje touchedpair counterpart przed write i sprawdza prospectiveeffectivepair przez istniejący strictbundle owner; identicalbatchmarker replay pozostaje przed revision/paircheck. Bez nowego endpointu/schema. Testy: crash każdego pair/statewrite, unrelatedpending preservation, durable409restartnoPOST, stalechoice, bothdelete/orphan/mutatedcounterpart, idempotent ambiguoussuccess replay. To odbiór projektu, nie implementacji ani runtime A21.
