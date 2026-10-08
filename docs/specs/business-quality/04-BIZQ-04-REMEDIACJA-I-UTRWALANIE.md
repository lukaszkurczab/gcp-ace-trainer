# BIZQ-04 — rozdzielenie naprawy błędów i utrwalania

**Priorytet:** P1  
**Główne repo:** aplikacja; content dla jawnej polityki rodziny/pakietu; backend tylko przy rzeczywistej zmianie synchronizowanego kontraktu  
**Zależności:** tożsamość dowodów i snapshot z BIZQ-02; jakość materiału z BIZQ-01 do końcowego odbioru  
**Konsument wyniku:** BIZQ-03 i BIZQ-05  
**Reguły wspólne:** [00 — plan BIZQ](00-PATTERNLY-BIZQ-PLAN-ROBOCZY.md).

## 1. Potwierdzona pozostała praca

Porównanie z 07.10: `CanonicalTrainingRuntime.submitPractice/finalizeSimulation` już kwalifikuje powtórki według zapisanego `answeredAt` i dokładnej tożsamości źródła. Poprawiono projekcje ukończonych wyników oraz odmowę działania przy niewiarygodnym źródle. Nie przywracać zastępczego wyznaczania błędów z historii ani drugiego właściciela kolejki.

W istniejących przejściach po poprawnej powtórce pierwszy kwalifikowany sukces zwiększa `consecutiveAfterDueSuccesses` i zmienia `lastReviewedAt`, lecz nie wyznacza nowego `dueAt`; drugi usuwa wpis. Nie domknięto jeszcze polityki rodzin obejmującej planowanie powtórek po poprawnej odpowiedzi oraz dalsze utrwalanie. Właściciel zatwierdził 07.10 odstęp 7 × 24 godziny po pierwszym kwalifikowanym sukcesie. Do wykonania pozostają spójne przejścia terminów i utrwalania oraz R01–R27 przez istniejących właścicieli rodziny, cyklu sesji i dziennika zmian, ze zweryfikowanym kontekstem ukończonej sesji z ARCH-01/02.

Natychmiastowa poprawa naprawia rozumowanie, a późniejsze odtworzenie dostarcza osobnego dowodu po czasie. Nie dodawać nowej bramki postępu, deklaracji opanowania materiału ani osobnej kolejki.

## 2. Stan istniejący i nowy kontrakt

Normatywne kontrakty produktu i runtime mówią o dwóch poprawnych review attempts po terminie i braku rozwiązywania persistent review przez korektę w tej samej sesji. Nie wynika z tego automatycznie, jaki ma być odstęp między pierwszym i drugim sukcesem. Uzupełnienie tej luki jest **docelową zmianą BIZQ**, nie rzekomo zawsze istniejącym wymaganiem.

Zachowaj rozdzielenie:

- **remediation:** celowane naprawienie błędu;
- **scheduled retrieval:** ponowne sprawdzenie w określonym terminie;
- **persistent resolution:** spełnienie obowiązującej reguły kolejnych kwalifikowanych sukcesów;
- **maintenance:** dalsze, rzadsze przypomnienie po ustąpieniu konkretnego błędu.

To semantyki w jednej istniejącej kolejce i jej family policy, nie cztery kolejki i cztery runnery. Nie dodawaj nowego systemu fiszek ani nowej biblioteki SRS w tym zadaniu.

## 3. Rozpoznanie przed implementacją

Zlokalizuj bieżącego właściciela `CanonicalTrainingRuntime`, review outcome builder, selector review, merge/upsert, mutation journal, pola provenance, persistent counter, `retentionPassedAt` — jeżeli występuje — oraz adaptery sync.

Dla każdej istniejącej rodziny przygotuj macierz:

`trigger | eligible modes | queue key/granularity | initial due | success transition | partial/incorrect transition | maintenance | completion/progress effect`.

Przejdź przez zwykłą poprawną odpowiedź, błąd, partial, naprawę w tej samej sesji, due review, retry i merge. Uwzględnij Certification, Coding Interview i Design Interview według aktualnego rejestru, bez odtwarzania zamkniętej listy rodzin ze starych dokumentów.

Nie rób warunku `trackId === ...` w shared kernel. Polityka należy do rodziny/pakietu; współdzielona warstwa egzekwuje trwałość i identyfikację zdarzeń.

## 4. Docelowe zasady

### 4.1. Jawna polityka odstępów

Najpierw wykorzystaj istniejące poprawne, wersjonowane wartości. Nie zamieniaj bez uzasadnienia wszystkich harmonogramów na nowe stałe. Brakujący odstęp po pierwszym sukcesie uzupełnij w jawnej polityce rodziny, z walidacją dodatniej wartości i testem.

**Decyzja właściciela z 07.10.2026:** odstęp po pierwszym kwalifikowanym sukcesie w zaplanowanej powtórce wynosi 7 × 24 godziny. Nowy termin wylicza się od kanonicznego `answeredAt` tej odpowiedzi. Natychmiastowa korekta błędu nie jest takim sukcesem. Właściciel osobno zatwierdził też pozostałe wartości w tabeli jako politykę startową tam, gdzie pakiet nie ma już zatwierdzonej polityki. Zachować istniejące zatwierdzone polityki; nie zastępować ich globalnymi stałymi. Decyzja wymaga zapisania w wersjonowanej polityce i testach; nie jest dowodem wdrożenia.

Polityka startowa dla brakujących definicji — wartości zatwierdzone 07.10:

| Parametr | Wartość i status | Znaczenie |
| --- | --- | --- |
| Pierwsze odroczone sprawdzenie błędu | 24 godziny — zatwierdzone 07.10 | Natychmiastowa naprawa jest dostępna osobno, lecz nie stanowi sukcesu po tym terminie. |
| Pierwsze utrwalanie po nowej poprawnej pracy | 7 × 24 godziny — zatwierdzone 07.10 | Nowe poprawne odpowiedzi nie wypadają całkowicie z utrwalania. |
| Odstęp po pierwszym kwalifikowanym sukcesie w zaplanowanej powtórce | 7 × 24 godziny — zatwierdzone 07.10 | Drugi kwalifikowany sukces wymaga nowego terminu. |
| Dalsze utrwalanie po poprawnej odpowiedzi | 14, następnie 28 × 24 godziny — zatwierdzone 07.10 | Poprawna odpowiedź w kwalifikującej się powtórce na etapie 28 dni kończy cykl; nie wyznacza kolejnego terminu. |

Wartości są zatwierdzoną polityką startową produktu, a nie deklaracją naukowo optymalnego harmonogramu. Właściciel następnie rozstrzygnął zakończenie: po kwalifikowanej poprawnej odpowiedzi na etapie 28 dni pytanie wypada z automatycznych powtórek. Nie stosować sekwencji 28 → 28 → 28 bez końca. Zapisz je w zatwierdzanej wersji polityki, nie jako ukryty fallback. Jeśli bieżąca zatwierdzona polityka ma inne sensowne wartości, zachowaj je i wyjaśnij, jak spełniają wymagane rozdzielenie zdarzeń. Nie przywracaj globalnego time-spread gate.

`dueAt` oznacza tu instant; „24 godziny” nie oznacza następnej lokalnej daty o północy. Sukces o 23:59 nie uprawnia do drugiego o 00:01. Powiadomienie może być planowane lokalnie, ale nie zmienia momentu kwalifikacji review.

Dla nowej poprawnej pracy cykl utrwalania ma odstępy 7 → 14 → 28 dni → koniec po poprawnej powtórce. Naprawa błędu zaczyna się od odroczonego sprawdzenia po 24 godzinach; pierwszy kwalifikowany sukces wyznacza kolejne sprawdzenie za 7 dni. Po spełnieniu reguły rozwiązania błędu dalsze utrwalanie przechodzi do odstępów 14 i 28 dni. Każdy nowy odstęp liczy się od poprzedniej kwalifikowanej poprawnej odpowiedzi, nie od pierwszego dnia całego cyklu.

Zakończenie dotyczy zaplanowanego etapu o odstępie 28 × 24 godziny od poprzedniego kwalifikowanego sukcesu, a nie 28 dni od pierwszego zetknięcia z pytaniem. Obowiązuje kwalifikacja z §4.3, w tym kanoniczne `answeredAt` i właściwa potrzeba powtórki. Sam upływ terminu, wyświetlenie pytania albo poprawna odpowiedź przed terminem nie zamykają cyklu. Zasada zakończenia jest docelową decyzją produktu; sprzeczną politykę pakietu trzeba zmienić jawnie i wersjonować, zamiast zachować nieskończone powtórki jako wyjątek.

### 4.2. Pierwsza poprawna odpowiedź też może wymagać powtórki

Rozszerz jawne scheduled retrieval na rodziny, dla których obecnie go brakuje, jeżeli pytanie/mode jest właściwym dowodem według family policy. Nie wkładaj każdego zdarzenia do kolejki bez rozróżnienia: guided primer, due review i finalized simulation mają różne źródła i mogą mieć różną politykę.

Zachowaj aktualną granulację queue key. Dla istniejącego klucza nie twórz duplikatu przy każdym poprawnym podejściu. Jeśli jednostka ma już nierozwiązany błąd, zwykła poprawna odpowiedź nie zastępuje jej błędu przez spokojniejsze maintenance ani nie przesuwa terminu w przyszłość.

Po zakończeniu cyklu zwykła poprawna odpowiedź nie tworzy ponownie tej samej potrzeby utrwalania. Pytanie może nadal pojawiać się w zwykłej praktyce. Późniejszy błąd lub częściowo poprawna odpowiedź mogą rozpocząć nową naprawę zgodnie z polityką rodziny; wcześniejsze sukcesy pozostają w historii.

Nie wprowadzaj przy okazji nowej agregacji „jedna powtórka per mental unit” bez zbadania utraty szczegółów o błędach. Połączenie kilku potrzeb jest dopuszczalne wyłącznie przez obecny, jawny kontrakt zgodności/provenance.

### 4.3. Kwalifikowany sukces

Sukces może zwiększyć persistent counter tylko wtedy, gdy wszystkie wymagania są spełnione:

1. Próba jest utrwalona i `correct`, nie `partial`.
2. Powstała w kontekście review dopuszczonym przez aktualną politykę rodziny.
3. Odnosi się do właściwej review obligation albo zatwierdzonego wariantu tej samej potrzeby.
4. Została udzielona po obowiązującym `dueAt`, zgodnie z dokładną regułą porównania.
5. Nie jest natychmiastową korektą, którą kontrakt wyklucza z persistent resolution.
6. Ten sam attempt ID nie został wcześniej skonsumowany do tej zmiany.
7. Tożsamość profilu, pakietu i snapshotu review jest poprawna.

Do kwalifikacji użyj kanonicznego czasu odpowiedzi (`answeredAt`), nie późniejszego czasu synchronizacji lub materializacji. Odpowiedź udzielona przed terminem nie staje się eligible tylko dlatego, że zapis albo sync zakończył się po terminie.

Nie zmieniaj bez potrzeby istniejącego `>` na `>=`; zapisz i przetestuj dokładną granicę. Kluczowym wymaganiem jest nowy późniejszy `dueAt` po pierwszym sukcesie, a nie spór o jedną milisekundę.

### 4.4. Tabela przejść

| Zdarzenie | Counter i rodzaj potrzeby | Termin / inne skutki |
| --- | --- | --- |
| Błąd/partial w zwykłej praktyce | Dodaj/rozszerz remediation, zachowaj provenance i aktualne zasady resetu | Użyj polityki; nie odsuwaj istniejącej pilnej potrzeby tylko dlatego, że pojawiło się kolejne zwykłe zdarzenie. |
| Nowa poprawna zwykła praktyka | Dowód poprawności; ewentualne scheduled retrieval | Nie zwiększa countera istniejącego persistent review. |
| Poprawka w tej samej sesji lub przed due | Immediate correction, nie trwałe rozwiązanie | Counter persistent nie rośnie; nie ma nowego retention event. |
| Pierwszy eligible correct po due | Counter = 1 | Atomowo ustaw nowy `dueAt = attempt.answeredAt + configured interval`; nie pozostaw starego terminu. |
| Kolejna odpowiedź przed nowym due | Praktyka/korekta, nie drugi sukces | Bez zwiększenia countera i bez przesunięcia due przez sam poprawny wynik. |
| Drugi consecutive eligible correct po nowym due | Rozwiąż konkretną persistent obligation | Zachowaj fakty historyczne; dalsze maintenance według polityki, bez fałszywego dodatkowego sukcesu. |
| Eligible due partial/incorrect | Reset kolejnych sukcesów; remediation | Nowy termin odroczonego sprawdzenia według polityki; natychmiastowa naprawa jest osobnym działaniem. |
| Kwalifikowana poprawna powtórka na etapie 7 lub 14 dni | Zapisz rzeczywisty sukces utrwalania | Następny odstęp wynosi odpowiednio 14 lub 28 dni od `answeredAt`, zgodnie z wersją polityki. |
| Kwalifikowana poprawna powtórka na etapie 28 dni | Zakończ cykl tej konkretnej potrzeby | Utrwal zakończenie i usuń jej aktywny wpis; nie wyznaczaj kolejnego terminu. Zachowaj historię odpowiedzi. |
| Zwykła poprawna odpowiedź po zakończeniu cyklu | Nowy dowód poprawności w praktyce | Nie odtwarza zakończonej potrzeby utrwalania. |
| Nowy błąd/partial po zakończeniu cyklu | Nowa potrzeba naprawy według polityki rodziny | Poprzednie zakończenie pozostaje faktem historycznym; nie blokuje ponownej naprawy. |
| Retry identycznego zdarzenia | Brak nowego wkładu | Idempotencja; terminy i counter nie zmieniają się ponownie. |
| Merge/sync/import dowodów | Zachowaj rzeczywiste zdarzenia i unresolved reasons | Nie tworzy `retentionPassedAt`, success ani nowego attemptu. |

Po rozwiązaniu błędu dalsze maintenance powinno korzystać z tej samej kolejki i jej normalnego lifecycle. Nie tworzy się drugiej aktywnej pozycji dla identycznego klucza. Przejście persistent→maintenance nie może zgubić nierozwiązanej przyczyny ani sfabrykować zatwierdzonego wyniku.

Zamknięcie dotyczy wyłącznie właściwego pytania i potrzeby powiązanej ze zweryfikowanym kontekstem odpowiedzi. Nie zamyka innych pytań, profili ani nierozwiązanych przyczyn przez samą wspólną jednostkę umiejętności. Jeżeli rodzina dopuszcza zgodny wariant pytania, powiązanie musi spełniać istniejący jawny kontrakt. Zakończenie cyklu powtórek nie dodaje warunku ukończenia rozdziału lub ścieżki; te reguły należą do BIZQ-02.

### 4.5. `retentionPassedAt` i dowody

Jeśli bieżący model ma `retentionPassedAt`, ustawiaj je wyłącznie na podstawie rzeczywistego poprawnego due-qualified zdarzenia. Nie ustawiaj go przy merge, przygotowaniu sesji, due date arrival, odczycie Details, zwykłej poprawnej próbie ani samym rozwiązaniu rekordu w pamięci.

Nie utożsamiaj pierwszego faktycznego retrieval success z zakończeniem persistent review wymagającym dwóch sukcesów. Pole daty wydarzenia i stan nierozwiązanej potrzeby mają różne znaczenia. Zachowaj aktualny kontrakt historii przy późniejszym błędzie; nie przerabiaj wcześniejszego sukcesu na fakt, który nigdy nie wystąpił.

## 5. Trwałość, konflikt i sync

Counter, reasons, dueAt, provenance i ewentualny event/progress update muszą powstawać jako jeden deterministyczny wynik istniejącej operacji. Nie zapisuj countera w jednej ścieżce, a dueAt chwilę później bez wspólnej ochrony.

Zachowaj istniejący journal i expected revisions. Po zapisie durable journal retry odtwarza ten sam wynik; nie wylicza nowych terminów od aktualnego `now`, bo restart przesuwałby harmonogram.

Zakończenie etapu 28 dni musi być trwałym wynikiem tej samej operacji co zapis odpowiedzi i usunięcie aktywnej potrzeby. Istniejący właściciel historii/powtórek musi rozpoznawać zakończony cykl po restarcie i synchronizacji. Sam brak wpisu kolejki nie wystarcza, jeżeli zwykła poprawna odpowiedź mogłaby go ponownie utworzyć. Retry ani odtworzenie starego zdarzenia nie mogą odtworzyć zakończonej pozycji lub usunąć nowej potrzeby powstałej po późniejszym błędzie. Nie dodawaj drugiego magazynu postępu.

Utrwal wystarczający kontekst kwalifikacji review w już istniejącym planie/occurrence, tak aby można było odtworzyć źródło potrzeby i użyty termin/policy version. Nie twórz historycznego archiwum całych payloadów pytań. Jeżeli potrzebne pole jest nowe, dodaj je do właściwego kontraktu i konsumentów, nie do bocznego MMKV key.

Zmiana review przez inne urządzenie podczas aktywnej sesji wymaga jawnego rozstrzygnięcia rewizji. Nie zaliczaj kolejnego success przez rebase w ciemno. Zastosuj obecny konflikt/journal workflow: nieutrwalony outcome można zbudować ponownie wobec zweryfikowanej aktualnej wersji; już trwałego outcome nie przeliczaj. Nie gub zapisanej odpowiedzi ani nie pozwalaj na jej ponowne ocenienie po commit.


### 5.1. Przyjęty projekt wykonawczy — 08.10.2026

Niezależny przegląd Luna high: początkowo PASS WITH REFINEMENTS; po zapisaniu doprecyzowań końcowy przegląd spójności i read→CAS PASS. Oceny kontrolera: zgodność 0,96; prostota 0,84; kontrola ryzyka 0,84; utrzymywalność 0,88. Jest to kontrakt docelowy, nie dowód implementacji ani odbioru R01–R27.

Wersjonowana polityka rodziny obejmuje etapy `repair24`, `repair7`, `retention7`, `retention14`, `retention28`. Błąd/partial rozpoczyna naprawę za 24 godziny; pierwszy kwalifikowany sukces prowadzi do `repair7`; drugi rozwiązuje błąd i przechodzi do `retention14`, następnie `retention28`, następnie zakończenia. Nowa poprawna praca zaczyna od `retention7`. Wszystkie odstępy liczą się od kanonicznego `answeredAt`, z istniejącą inkluzywną granicą `answeredAt >= dueAt`.

| Rodzina | Pierwsze utrwalanie | Kwalifikacja przejścia istniejącego cyklu |
| --- | --- | --- |
| Certification | Nowa utrwalona poprawna próba pojedynczego itemu, także diagnoza, guided i finalized simulation | Wyłącznie przygotowane due queue w Weak Area Review albo Quick Review |
| Coding Interview | Nowa utrwalona poprawna próba pojedynczego itemu, także guided i finalized simulation | Wyłącznie Weak Area Review ze źródłem `due_queue`; `session_misses` nie daje kwalifikacji przez nazwę trybu |
| Design Interview | Nowa utrwalona poprawna próba pojedynczego itemu | Wyłącznie Weak Area Review ze źródłem `due_queue`; holistyczny wynik symulacji bez prób pojedynczych itemów nie tworzy takich dowodów |

Wyświetlenie, draft i nieoceniona odpowiedź nie tworzą cyklu. Zwykła poprawna praktyka nie zmienia istniejącego cyklu i nie odtwarza zakończonego. Nie ma zatwierdzonego mapowania wariantów: selektor używa dokładnych referencji, skraca sesję przy małej puli i nie dodaje obcego materiału.

Jeden istniejący magazyn review zachowuje rozróżnienie aktywnego i zakończonego cyklu. Aktywny rekord ma wersję polityki, następny etap i termin; zakończony ma `completedAt` i `completedByAttemptId`, bez `dueAt`. ID rekordu jest tożsamością cyklu, więc nie dodaje się równoległego `cycleId`. Dopuszczalne są liczne zakończone rekordy dla tej samej dokładnej referencji, lecz najwyżej jeden aktywny. Nowy błąd po zakończeniu tworzy nowe ID; stare zamknięcie nie może zmienić tego nowego rekordu. Aktywne projekcje i selektory wykluczają zakończone wpisy, synchronizacja zachowuje wszystkie cykle.

Occurrence przygotowane z due queue utrwala źródło `due_queue`, ID rekordu, `sourceAttemptId`, `dueAt`, wersję polityki i etap. Referencja itemu już należy do occurrence. Ten snapshot wchodzi do istniejącego fingerprintu planu. Przejście wymaga zgodności snapshotu z faktycznie odczytanym rekordem; token rewizji tego odczytu musi trafić do expected revisions journala, bez zastąpienia później odczytaną rewizją. Zmiana między odczytem a zapisem wymaga jawnej obsługi konfliktu. Brakujący lub nieaktualny snapshot nie zwiększa licznika i nie zamyka potrzeby; odpowiedź pozostaje zachowana, wynik jawnie wskazuje brak zaliczenia review lub konflikt. Stara sesja bez snapshotu nie uzyskuje kwalifikacji przez sam tryb.

Starsze payloady pozostają zachowane; dodatkowe rozpoznane kształty ręcznego producenta opisuje §5.2. Ścisły dekoder rozpoznaje `legacy_active_unqualified` tylko dla znanych kształtów: `persistent=true`, jedna przyczyna incorrect/partial i licznik 0–1, albo `persistent=false`, jedna przyczyna scheduled_retrieval i licznik 0–1, z prawidłowymi timestampami. Nie traktuje starego licznika ani `lastReviewedAt` jako kwalifikowanego sukcesu i nie przesuwa starego terminu. Nowa sesja due queue może zamrozić rozpoznaną starszą potrzebę; dopiero jej nowy kwalifikowany wynik atomowo promuje rekord przez istniejący journal. Dla starszej naprawy jest to pierwszy sukces i +7 dni, niezależnie od starego licznika; dla starszego scheduled retrieval przejście początkowego etapu 7 prowadzi do +14 dni. Nieznane kombinacje są jawnie niedostępne, nadal zachowane i nie mogą zostać nadpisane nowym cyklem przez domniemanie pustej kolejki. Nie wykonuje się masowej migracji ani nie uznaje braku wpisu za zakończenie.

Weryfikacja dodatkowa: starszy licznik 1 nie skraca naprawy ani utrwalania; nieznany payload nie jest usuwany; stara sesja po zakończeniu i nowym błędzie nie zalicza nowego cyklu; zmiana między odczytem i CAS nie zostaje nadpisana; retry starego zamknięcia nie usuwa nowej naprawy. Zachować bajty niedotkniętych profili. Backend przechowuje review w istniejącym opaque progressState; zmiana backendu jest potrzebna tylko, jeśli rzeczywista walidacja wykaże naruszenie tego kontraktu.


### 5.2. Ręczna prośba o powtórkę — doprecyzowanie producenta

Źródła: produkcyjny `certificationReviewCommands.setQuestionNeedsReview`, `AnswerReviewScreen` oraz workspace docs17 §9. Dotychczasowa komenda ustawia termin na teraz, dodaje `manual_mark`, lecz błędnie resetuje istniejący cykl, a odznaczenie usuwa też automatyczny błąd. Komenda ma rzeczywisty kontrakt i historyczne payloady; późniejszy przegląd entrypointów wykazał, że zarejestrowany AnswerReviewScreen nie ma produkcyjnego wywołania nawigacji. Samo jego istnienie nie dowodzi dostępności czynności dla użytkownika; integrację określa §5.4. Niezależny przegląd Luna high PASS WITH REFINEMENTS; oceny kontrolera 0,96/0,83/0,84/0,82. Doprecyzowanie zachowuje istniejącą czynność użytkownika i zatwierdzone odstępy; nie wymaga nowej decyzji PO.

Nowa samodzielna prośba ma jawny aktywny etap `manual_requested`, `manual_mark` jako przyczynę/provenance i termin równy czasowi oznaczenia. Właściwa kwalifikowana poprawna powtórka przechodzi do `retention7` od kanonicznego `answeredAt`; incorrect/partial do `repair24`. Nie interpretuje się ręcznego oznaczenia jako błędu. Dodanie/zdjęcie znaku przy już aktywnym cyklu zmienia wyłącznie ręczną przyczynę: nie resetuje etapu, terminu ani licznika tego cyklu. Odznaczenie usuwa wpis tylko wtedy, gdy ręczna prośba jest jego jedyną przyczyną; automatyczna naprawa pozostaje. Ekran wyznacza stan ręcznego znacznika z `manual_mark`, a nie z obecności dowolnej potrzeby dla pytania. Nowa jawna prośba po zakończeniu ma inne, stabilne dla tej operacji ID; wcześniejsze zakończenia i idempotencja pozostają.

Ścisłe znane historyczne kształty rozszerza się o `manual_mark` jako jedyną przyczynę albo razem z dokładnie jedną z incorrect, partial, scheduled_retrieval; persistent=true, licznik 0–1 i prawidłowe czasy. Licznik 1 jest osiągalny w starym runtime, który zwiększał go bez zmiany przyczyn. Wszystkie te wpisy pozostają niekwalifikowane; stara liczba nie skraca nowego cyklu. Manual+incorrect/partial zachowuje naprawę; manual-only i historyczne manual+scheduled reprezentują ręczną prośbę. Odznaczenie znanego historycznego manual+scheduled normalizuje tylko persistent do false i usuwa manual_mark, zachowując zapisany termin, licznik, lastReviewedAt oraz tożsamość/provenance. Nie jest to sukces, replanowanie ani migracja pozostałych profili.

Testy producenta: nowe oznaczenie, ponowienie, mark/unmark przy błędzie i maintenance bez zmiany terminu, counter 0/1 w znanych historycznych kombinacjach, nieznane zestawy nadal unavailable/preserved, nowe ID po terminalnym cyklu, odznaczenie nie usuwa błędu ani zakończonej historii. Komenda musi zachować istniejące granice profilu oraz konflikt/revision journal; asynchroniczne rozwiązanie treści nie może zapisać wyniku w profilu wybranym później.

Jawny wynik `reviewConflict` dotyczy praktyki i finalizacji symulacji. Istniejący lifecycle owner przekazuje go do rzeczywistej prezentacji feedbacku/wyniku przez jedną wspólną tłumaczoną kopię. Nie zmienia oceny ani nie tworzy dodatkowego właściciela trwałego wyniku. Testy sprawdzają wszystkie rzeczywiste ekrany wyników i nawigację, a nie samo nieużywane pole.


### 5.3. Natychmiastowa ręczna praktyka przy istniejącym cyklu

Końcowy przegląd tego doprecyzowania Luna high: PASS WITH REFINEMENTS, 0,96/0,82/0,84/0,82. Źródłem jest istniejący producent ustawiający ręczny termin na teraz oraz selektor filtrujący `dueAt`: samo dodanie przyczyny przy odległym terminie ukryłoby działającą możliwość natychmiastowej praktyki. To uzupełnia §5.2, nie zmienia zatwierdzonych odstępów.

Jeden aktywny rekord może mieć opcjonalny `manualRequestId`: niepustą, walidowaną tożsamość ręcznej operacji, stabilną dla jej ponowień, wytworzoną przez istniejącego właściciela tożsamości przejścia. Off→on tworzy nową tożsamość prośby. Nie tworzy się drugiej kolejki ani magazynu. Samodzielny nowy rekord nadal ma etap `manual_requested` i termin oznaczenia. Przy istniejącym cyklu pole i ręczna przyczyna nie zmieniają automatycznego terminu, etapu, licznika ani persistent.

Istniejący właściciel selekcji rozróżnia dwie rzeczywiste możliwości w tej samej kolejce: kwalifikujące `due_queue` po automatycznym terminie oraz natychmiastową prośbę `manual_request` przed nim. Dokładna referencja pozostaje jedyną jednostką; nie ma fillerów ani podwójnego liczenia jednej pozycji. Dashboard/Progress i wejście review muszą widzieć ręczną dostępność również przy przyszłym automatycznym terminie. Gdy automatyczny termin już nadszedł, pierwszeństwo ma normalne `due_queue`. Konsumenci, także Progress „This week”, wykorzystują istniejące rozróżnione reviewQueueCopy; nie podpisują sumy dostępnych pozycji jako due, kiedy obejmuje przedterminową ręczną prośbę.

Occurrence dla ręcznej praktyki wiąże źródło `manual_request`, ID rekordu, `manualRequestId`, sourceAttemptId oraz niezmienione automatyczne dueAt/policy/stage z fingerprintem. Snapshot automatycznej powtórki również wiąże obecność/tożsamość ręcznej intencji jako znaczący stan potrzeby. Znacząca zmiana prośby po przygotowaniu, w tym off→on, daje jawny konflikt i zachowaną odpowiedź bez konsumowania nowej prośby ani fałszywego review creditu. Nie dodaje się globalnej równości rewizji z prepare; nadal obowiązuje semantyczne porównanie i rewizja faktycznego submit-read do CAS.

Correct w dopasowanym `manual_request` przed automatycznym terminem konsumuje wyłącznie tę ręczną intencję/przyczynę, bez zmiany automatycznego dueAt, etapu i licznika. Incorrect/partial korzysta z zatwierdzonej naprawy `repair24` od answeredAt. Samodzielne `manual_requested` po terminie zachowuje przejście correct→retention7, wrong/partial→repair24 z §5.2. Zwykła praktyka bez przygotowanej ręcznej intencji nie konsumuje jej przypadkiem. Wszystkie zmiany przechodzą przez istniejący journal i właściwy profil.

Rozpoznany historyczny manual marker bez nowego ID otrzymuje stabilną tożsamość w projekcji tylko z rozpoznanej tożsamości źródła/rekordu i zapisanego ręcznego terminu; bez masowego przepisywania i bez zaliczania dawnych sukcesów. Nowy producent dodający ręczną intencję do znanego scheduled legacy z persistent=false zapisuje dokładnie scheduled_retrieval+manual_mark oraz prawidłowy explicit manualRequestId, zachowując false/due/counter. Tylko ten jawny nowy kształt jest dopuszczony dodatkowo. Arbitrary historyczne false-combo bez ID i inne zestawy pozostają unavailable/preserved. Stary znany true-combo opisany w §5.2 pozostaje osobnym rozpoznanym kształtem; unmark normalizuje false i zachowuje zapisany termin, licznik i historię.

Dodatkowe sprawdzenia: przyszła maintenance+manual jest rzeczywiście wybierana przez produkcyjny prepare; poprawna praktyka usuwa tylko dopasowany znacznik i zachowuje przyszły termin; off→on unieważnia starą intencję; zmiana znacznika między read i CAS nie jest nadpisana; prośby i due nie są liczone podwójnie; brak ID przy nowym false-combo blokuje zapis; stara sesja bez snapshotu zachowuje przedzmianowy fingerprint i odpowiedź bez review creditu.

### 5.4. Dostępna czynność w kanonicznym przeglądzie wyniku

Niezależny przegląd Luna high: PASS WITH REFINEMENTS; zgodność z celem/architekturą 0,97, prostota 0,88, kontrola ryzyka 0,87, utrzymywalność 0,88 (minimum 0,87). Cel: użytkownik po rzeczywiście ukończonej sesji GCP może oznaczyć dokładną ocenioną odpowiedź do ręcznej powtórki i zdjąć znacznik bez zmiany automatycznego cyklu. Podejście: istniejący ResultScreen → EXAM_REVIEW → ExamReviewScreen, istniejące zweryfikowane projekcje Practice/Exam i jedna komenda journal; bez drugiego renderera lub magazynu.

Projekcje przekazują rzeczywisty attempt ID i dokładną referencję ocenionego itemu. Czynność jest dostępna tylko dla obsługiwanego GCP i ocenionych odpowiedzi; nieodpowiedziany item egzaminu nie otrzymuje fikcyjnego sourceAttemptId. Komenda rozwiązuje treść z referencji, bez redundantnego snapshotu pytania od UI. Znacznik pochodzi wyłącznie z manual_mark. Odczyt i zapis zachowują granice profilu i konflikt rewizji.

Stan czynności jest jawnie pending/ready/unavailable, z blokadą ponownego zapisu i przetłumaczonym błędem w siedmiu locale. Niedostępność odczytu historycznej kolejki blokuje tę czynność, lecz nie ukrywa poprawnie zweryfikowanej odpowiedzi i jej objaśnienia. Nie pokazuje pozornego niezaznaczonego stanu. Używa istniejących komponentów i semantyki dostępności. Nie rozszerza czynności na diagnozę lub nieobsługiwane ścieżki.

Po sprawdzeniu importów, rejestrów, nawigacji i testów usuwa się osierocony AnswerReviewScreen/ANSWER_REVIEW oraz wyłącznie jego zbędne zależności; współdzielone komponenty pozostają, jeśli mają konsumentów. Testy migrują na rzeczywisty entrypoint. Odbiór obejmuje Result→Review dla Practice/Exam, mark/unmark manual/error/scheduled bez zmiany automatycznego terminu/licznika, unavailable przy nieznanej historii, nieodpowiedziane itemy, błędy zapisu/profile-switch/revision, locale i rzeczywiste otwarcie oraz użycie czynności w aplikacji. Przegląd projektu nie oznacza odbioru implementacji.

### 5.5. Ścisłe stany polityki i konsumowanie ręcznej intencji

Doprecyzowanie zapisane przed kodem po niezależnym QA: wersjonowany payload retention28+incorrect+persistent=true był akceptowany i mógł ominąć naprawę. Cel: dopuszczać wyłącznie spójne stany zatwierdzonej polityki, bez przedwczesnego zakończenia lub utraty prośby. Podejście: istniejący guard i producent przejść, jeden store/journal, brak migracji/backendowego schematu. Niezależny design Luna high PASS WITH REFINEMENTS; zgodność 0,98, prostota 0,91, kontrola ryzyka 0,91, utrzymywalność 0,88. Minimum 0,88.

| Wersjonowany status/etap | Powody podstawowe | persistent | Licznik kwalifikowanych sukcesów |
| --- | --- | --- | --- |
| active repair24 | dokładnie incorrect albo partial | true | 0 |
| active repair7 | dokładnie incorrect albo partial | true | 1 |
| active manual_requested | wyłącznie manual_mark | true | 0 |
| active retention7/retention14/retention28 | dokładnie scheduled_retrieval | false | 0 |
| completed retention28 | dokładnie scheduled_retrieval | false | 0 |

Aktywna naprawa lub utrwalanie może mieć dodatkowy manual_mark tylko wraz z poprawnym manualRequestId. manual_requested wymaga takiego ID. ID bez manual_mark jest niepoprawne. Aktywne wpisy wymagają prawidłowego dueAt i nie mają completion fields; zakończone wymagają completedAt i niepustego completedByAttemptId, nie mają dueAt ani aktywnej ręcznej intencji/ID. Etap/status/policyVersion są jawne. Ścisły rozpoznany decoder legacy pozostaje osobny, z granicami §5.1–5.3. Nieznane lub niespójne wpisy pozostają zachowane i jawnie niedostępne, bez reinterpretacji, usuwania, migracji ani seedowania zastępczego cyklu.

Sukces przygotowanego i dopasowanego due_queue konsumuje ręczną intencję równocześnie z przejściem automatycznego cyklu: usuwa manual_mark i ID. Naprawa zachowuje incorrect/partial, późniejsze utrwalanie oraz zakończenie mają scheduled_retrieval. Nie pozostawia się pozornego aktywnego znacznika, którego selektor nie umie wybrać. Zatwierdzone due/stage/counter i zachowana historia pozostają zgodne z §5.1. Pre-due manual_request nadal usuwa wyłącznie dopasowaną ręczną przyczynę/ID, bez automatycznego kredytu.

Zwykła niepowiązana wrong/partial może rozpocząć repair24 od kanonicznego answeredAt, lecz zachowuje istniejący manual_mark i jego tożsamość. Konsumowanie wymaga dopasowanego prepared snapshotu manual_request albo due_queue dla tej samej intencji. Dla rozpoznanego legacy marker ID wylicza istniejący manualRequestIdForEntry przed przejściem; nie wymyśla się ID dla unknown. Off→on lub stale snapshot zachowuje nową prośbę, odpowiedź i jawny konflikt. Zwykła correct nadal nie zmienia istniejącej potrzeby.

Weryfikacja: każda dopuszczona para producent→guard; negatywne cross-pairs stage/reason/persistent/count w repo/import/selector i zachowanie unknown; brak ID przy nowym manual_requested/overlay, ID bez markera i completion z aktywną intencją; qualified due success legacy-error→repair7 i retention/completion bez ghost mark; ordinary wrong/partial zachowuje ID oraz natychmiastową selekcję; matched wrong konsumuje tylko swoją prośbę; stale/off→on nie konsumuje nowej. Nie zastępuje się runtime checks samą tabelą lub typecheckiem.

### 5.6. Świeża tożsamość działania ręcznego — kontrakt przed kodem

Niezależne QA odtworzyło przez rzeczywistą komendę i właścicieli repozytorium/journala mark→unmark→mark przy tym samym kanonicznym czasie: timestamp-only fingerprint odtwarzał manualRequestId. Narusza to §5.3–5.5: stary snapshot nie może skonsumować ponownie włączonej intencji. Czas pozostaje provenance, nie gwarancją unikalności.

Najmniejszy spójny właściciel entropii: wydzielić istniejące międzyplatformowe generowanie UUID (Node crypto / Expo Crypto) do `infrastructure/identity/identityNonce.ts` i wariantu `.native.ts`. Istniejące adaptery content-report oraz produkcyjnej tożsamości sesji delegują wyłącznie ten surowy UUID; formaty identyfikatorów i polityka sesji development pozostają zachowane. Brak fallbacku czas/Math.random, nowego store, schematu, migracji czy zmiany uwierzytelniania.

Komenda ręcznej zmiany generuje jeden nonce wyłącznie wtedy, gdy świeży odczyt w istniejącym local-write lane wykazał rzeczywistą mutację. Ten sam nonce wiąże fingerprint manualRequestId, transitionId istniejącego journala oraz ID nowego czysto ręcznego rekordu. Dla istniejącego cyklu zachowuje jego ID, source refs, historię, terminy i etap. No-op repeated mark/unmark nie tworzy nowej intencji. Przed trwałym journalem ponowienie jest nową komendą; po trwałym zapisie odzyskanie odtwarza zapisane identyfikatory bez ponownego generowania. Błąd generatora zatrzymuje zmianę jawnie przed zapisem, bez fake success.

Weryfikacja: fixed same-ms off→on ma różne manualRequestId/transitionId/new pure-manual ID; przygotowany stary snapshot daje conflict i nie konsumuje nowej intencji; durable journal przerwany i odzyskany wielokrotnie zachowuje dokładne identyfikatory oraz pojedynczy wynik. Sprawdzić idempotentne no-op, profile fence, wcześniejszy terminalny rekord, adaptery content-report/session oraz natywną ścieżkę zgodnie ze zmienionym zakresem. Oceny kontrolera: zgodność 0,96; prostota 0,85; ryzyko 0,90; utrzymywalność 0,88, minimum 0,85. Niezależny Luna high design PASS WITH REFINEMENTS przed kodem, te same oceny. Generator działa dopiero po świeżym odczycie i sprawdzeniu profilu w local-write lane, tuż przed budową rzeczywistej mutacji; nie przed await resolve treści. Zachować istniejący format manual:<64hex> przez fingerprint nonce oraz jawny błąd przed journalem. Identyfikator nowego czysto ręcznego rekordu również zawiera nonce, zamiast polegać na timestamp/suffix. Test no-op zachowuje tożsamość, a durable replay nie generuje ponownie.

Wersjonowany scenariusz odtworzenia już wykonanego PASS: `.maestro/bizq04-manual-review-native.yaml`. Warunki tej próby: istniejący uprawniony syntetyczny aktor, English, ukończony rekord Quick Review `:2`, start z Home i ten sam iPhone 17. Scenariusz otwiera ukończony wynik, oznacza ręczną prośbę, ponownie odczytuje ją, usuwa oznaczenie i wraca do Home. To odtworzenie konkretnej próby, nie procedura odzyskiwania danych użytkownika ani domyślna bramka wydania; nie resetuje danych, nie adoptuje profilu i nie usuwa profilu.

## 6. Selektor, koszt i UX

Użyj prawdziwej due queue. Kolejność wynika z family priority, terminu i przyczyny. Warianty muszą mieć udokumentowaną zgodność z błędem/mechanizmem; nie uzupełniaj sesji przypadkowym materiałem.

Nie zaliczaj jednocześnie dwóch pozycji kolejki tym samym poprawnym itemem, jeżeli obecny kontrakt nie definiuje takiej relacji. W szczególności wiele pytań w tym samym mental unit nie oznacza, że jedna odpowiedź naprawia wszystkie błędy.

BIZQ-03 otrzymuje realne pozycje, terminy i rodzaje pracy. Prognoza może rezerwować czas, ale nie ma prawa tworzyć entries, zmieniać dueAt ani rozwiązywać review. Deadline użytkownika nie jest parametrem skracającym minimalny odstęp do kwalifikowanego sukcesu.

W UI odróżnij natychmiastową naprawę od późniejszej powtórki, korzystając z istniejących ekranów. Możliwe znaczenia copy: „Try a related example” kontra „Review scheduled for …”. Nie pokazuj „mastered”, „retained 100%” ani nowego badge'a. Dopóki cykl trwa, zwykła poprawka nie usuwa informacji o zaplanowanej powtórce. Po kwalifikowanym sukcesie na etapie 28 dni nie pokazuj następnego terminu dla zakończonej potrzeby.

## 7. Testy obowiązkowe

| ID | Scenariusz | Oczekiwany wynik |
| --- | --- | --- |
| R01 | Błąd → natychmiastowa poprawka | Błąd pozostaje w historii; brak persistent resolution i retention event. |
| R02 | Correct przed due | Counter nie rośnie, due nie przesuwa się od zwykłej poprawnej próby. |
| R03 | Pierwszy correct po due | Counter 1 i nowy przyszły due zapisane razem. |
| R04 | Druga sesja pięć minut później | Nie jest drugim due-qualified sukcesem. |
| R05 | Sukces 23:59, kolejna próba 00:01 | Przekroczenie daty lokalnej nie zastępuje wymaganego odstępu. |
| R06 | Drugi correct po nowym due | Persistent obligation rozwiązana zgodnie z polityką; brak podwójnego maintenance. |
| R07 | Partial lub incorrect po pierwszym sukcesie | Counter reset, konkretna remediation i jej termin. |
| R08 | Poprawna nowa praca w każdej rodzinie | Jawny poprawny trigger maintenance albo jawne wyłączenie przez mode policy; brak przypadkowego pominięcia rodziny. |
| R09 | 20 zwykłych correct przy istniejącym błędzie | Nie kasują unresolved reason i nie odsuwają terminu za każdym razem. |
| R10 | Retry/force-close po każdej fazie mutacji | Identyczne counter, dueAt, event IDs i provenance. |
| R11 | Merge/sync bez nowego attemptu | Brak wymyślonego `retentionPassedAt` lub success. |
| R12 | Próba z innego profilu/pakietu | Brak zaliczenia; zgodny current mismatch contract. |
| R13 | Due item i approved variant | Poprawne powiązanie review; obcy mental unit nie wchodzi jako filler. |
| R14 | Za mała kompatybilna pula | Dozwolone skrócenie i jawna actual length, nie duplikacja. |
| R15 | Review zmieniło rewizję w innej sesji/urządzeniu | Jawny konflikt lub prawidłowa operacja wobec nowej wersji; bez utraty trwałej próby. |
| R16 | Zbliżenie deadline'u do jutra | Brak przyspieszenia due i fałszywego zakończenia retention. |
| R17 | Exam/Coding Mock/Design na Free | Review/propozycja nie obchodzi aktualnej bramki Premium. |
| R18 | Otwarcie Details lub samo wyświetlenie review | Żadnych domenowych sukcesów ani zmiany kolejki. |
| R19 | Background i DST | Kwalifikacja według instant i jawnej polityki; nie według liczby odwiedzin aplikacji. |
| R20 | Dwie różne obligations o zbliżonej treści | Brak przypadkowego połączenia przez podobny tekst/mentalUnit bez kontraktu. |
| R21 | `answeredAt` przed due, materializacja/sync po due | Odpowiedź nie kwalifikuje się jako after-due success. |
| R22 | Kwalifikowana poprawna odpowiedź na zaplanowanym etapie 28 dni | Cykl tej potrzeby zakończony; brak aktywnej pozycji i kolejnego terminu; historia zachowana. |
| R23 | Na etapie 28 dni odpowiedź przed terminem, zapis po terminie albo sam upływ czasu | Żaden z tych przypadków nie kończy cyklu. |
| R24 | Błędna lub częściowo poprawna odpowiedź na etapie 28 dni | Naprawa według polityki rodziny; brak oznaczenia zakończenia cyklu. |
| R25 | Retry, przerwanie po każdej fazie zapisu lub sync starego zdarzenia zamykającego | Jeden trwały wynik; bez powielenia historii, następnego terminu i odtworzenia zakończonego wpisu. |
| R26 | Restart, Home i zwykła poprawna praktyka po zakończeniu | Nie odtwarzają powtórki; selektor zwykłej praktyki może nadal wybrać to pytanie. |
| R27 | Nowy błąd po zakończeniu, następnie ponowienie starego zamknięcia | Nowa potrzeba naprawy pozostaje; historia wcześniejszego sukcesu zachowana; obce pytania, profile i nierozwiązane przyczyny pozostają bez zmian. |

Dla R03–R06 oraz R22–R27 użyj deterministycznego zegara i jawnej wersji polityki. Test natywny może korzystać z istniejącego bezpiecznego fixture time provider; nie zmieniaj globalnego zegara systemowego i nie dodawaj produkcyjnego obejścia daty.

## 8. Kryteria odbioru

Wymagane są: macierz rodzin/trybów, jawna polityka odstępów, rzeczywiste zdarzenia w tej samej kolejce, nowy due po pierwszym sukcesie, brak manipulacji datą przez planner, zakończenie po kwalifikowanym sukcesie na etapie 28 dni, idempotencja i poprawny sync. Zakończona potrzeba nie wraca samoczynnie, a nowy błąd może utworzyć nową naprawę bez utraty historii. Cała ścieżka od odpowiedzi do kolejnego wyboru review musi działać w realnym runtime.

Raport pokazuje timeline jednej potrzeby: błąd → naprawa → due success 1 → próba zbyt wcześnie → due success 2 → powtórki według polityki → poprawna powtórka po 28 dniach → zakończenie bez kolejnego terminu. Dołącz scenariusz późniejszej porażki oraz dowód, że nie powstała nowa blokada progresji.

Wynik nie jest dowodem naukowo optymalnego harmonogramu. To sprawdzona implementacja jawnej polityki odróżniającej natychmiastowe wykonanie od późniejszego odtworzenia.

### Odbiór 08.10.2026 — R01–R27

Niezależny Luna high: **PASS WITH ISSUES** dla całego zakresu produktu, źródeł i opisanej próby natywnej. Końcowe `qa:static` na zamrożonych źródłach: exit0, 2070 PASS / 0 FAIL / 4 SKIP; recovery inventory (1958 przypadków), typecheck, content boundary i runtime privacy boundary PASS. Cztery istniejące pominięte testy HTTP/emulator nie stanowią PASS. Wcześniejsze nieudane bramki podczas poprawek nie są dowodem końcowego odbioru.

Przejścia, canonical answer-time boundaries, kwalifikacja rodzin/trybów, terminalność, brak odtwarzania przez zwykłą praktykę, ręczna intencja i jej off→on, read→CAS, przerwanie i replay journala, izolacja oraz sync/materialization są sprawdzone przez rzeczywistych właścicieli. R27 obejmuje opóźniony sync GET, nowy błąd i retry; nie jest oddzielnym dowodem wyścigu uploadu. Wersjonowany `scripts/checkReviewSyncBackendCompatibility.mjs` przechodzi 5/5 przez aktualny backend schema/fingerprint i różne ID zakończonych rekordów; to kompatybilność strukturalna, nie pełny Firestore sync. Partii testów nie sumować.

Na istniejącym iPhone 17/iOS26.4, English/Dark/Large: Focus Practice normalnie ukończona 10/10; mark/unmark/remark z wyjściem i ponownym odczytem 38/38; Quick Review przygotowała dokładny jeden item, normalnie pause→resume→correct→complete 8/8. Wynik z historii potwierdza skonsumowaną intencję. Po HMR jawny timeout; Try again przywróciło Home bez resubmit. Po wdrożeniu nonce rzeczywisty mark→durable reread→unmark→Home przeszedł bez fixtury i zmiany zegara. Siedem locale i negatywne ACK/readback są CODE_ONLY; nie wykonano natywnej iniekcji błędu, VoiceOver ani odbioru fizycznego urządzenia. Nieblokująca niejasność UI: requested limit10 obok rzeczywistego wyniku1/1. Automatyczne terminy potwierdzają testy właściciela, nie niewidoczne daty ekranu.

Kompletne BEFORE/final AFTER: 11 profili/89 wierszy. Niezależne 70/70 chroni Guest i9 wcześniejszych kont: zero braków/różnic w chronionym zakresie. Hash-only delty własnego aktora/control oceniono osobno; brak twierdzenia o globalnej identyczności storage. Dowody prywatne: `/private/tmp/patternly-bizq04-native/`, jeden manifest. Wersjonowany replay jest bajtowo identyczny z rzeczywiście użytym plikiem; hash odczytano po wykonaniu, nie przypięto go przed przebiegiem. To ograniczenie odtwarzalności, nie blokada produktu; bez ponownego wykonania mutacji tylko dla hasha.

Usunięto zastąpione certificationReview/algorithmReview i ich canonicalReviewTransitions self-test, orphan AnswerReviewScreen/route oraz nieużywane ReviewShell/ReviewNavigator i eksporty po sprawdzeniu referencji/entrypointów. Używany Skeleton pozostaje. Usunięto dwa przestarzałe prywatne backend probe/summary, zachowano aktualny reproducer i potrzebne dowody. Zwykły commit/push i odbiór CI pozostają krokiem integracji; wynik nie stanowi GO, admission ani dowodu skuteczności edukacyjnej.
