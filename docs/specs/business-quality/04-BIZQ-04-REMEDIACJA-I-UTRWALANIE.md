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
