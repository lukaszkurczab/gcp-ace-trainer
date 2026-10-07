# BIZQ-05 — wiarygodna diagnoza i sprawdzanie transferu

**Priorytet:** P1  
**Główne repo:** content + aplikacja; backend tylko dla już zatwierdzonych kontraktów danych  
**Zależności odbioru:** BIZQ-01, BIZQ-02, BIZQ-04  
**Konsument:** BIZQ-03 dobiera dalszą pracę z tych dowodów  
**Wspólna podstawa:** [00 — plan BIZQ](00-PATTERNLY-BIZQ-PLAN-ROBOCZY.md).

## 1. Potwierdzony punkt rozpoczęcia

Porównanie 07.10:  `productModeConfig.ts` definiuje GCP KnowledgeCheck40 jako exact ordered questions z Free N01 (B02=18/B03=20/B04=2). Wynik jest ograniczoną próbką; nie wykazano istniejącego false whole-track claim. Zachować bieżący mode, feedback i eligibility, nie zmieniać go w Exam ani nie przywracać wycofanej taxonomy.

Pierwszy spójny pakiet: istniejący verified GCP result→pinned sample breakdown→rzeczywista rekomendowana sesja przez obecne certification projections, family/lifecycle i shared evidence. ARCH-05/06 określa boundary exact descriptors i summary; BIZQ-02/04 dostarcza kwalifikację dowodów i review. Następnie9 tracków mapping/pool readiness, blueprint/scope/transfer i D01–D20. Używać źródeł official dla faktycznie zmienianego mappingu, bez nowego scoring engine, LLM egzaminatora albo claimu zdania.

Nie wystarczy zmiana etykiety. Nowe przykłady i protokół pomiaru muszą dostarczyć realnego wyniku; dotychczasowe lokalne tests nie dowodzą efficacy.

## 2. Trzy różne zastosowania

| Zastosowanie | Pytanie produktowe | Interpretacja |
| --- | --- | --- |
| Diagnoza zakresu | Jakie obszary sprawdziliśmy i gdzie wystąpiły błędy? | Jawny zakres próbki i jej ograniczenia; nie pełna wiedza o tracku. |
| Transfer | Czy użytkownik rozwiązuje zmieniony przykład bez podpowiedzi poprzedniego kontekstu? | Dowód konkretnego zastosowania/rozróżnienia, z kontrolą wcześniejszej ekspozycji. |
| Retrieval po czasie | Czy potrafi ponownie wykonać właściwą decyzję po due? | Rzeczywisty zdarzeniowy sygnał BIZQ-04, nie syntetyczne mastery. |

Te funkcje mogą korzystać z istniejących trybów. Nie wymagają trzech nowych przycisków. Prawdziwy score sesji, diagnostyczna interpretacja i stan ukończenia pakietu pozostają oddzielne.

## 3. Inwentaryzacja i mapping

Dla każdego obecnie oferowanego tracka ustal:

- zakres obiecywany użytkownikowi i faktycznie dostępny na jego tierze;
- kanoniczny blueprint i jego wersję;
- domeny/kompetencje/node/mentalUnit/skill mapping;
- istniejący diagnostic/mixed/independent/simulation mode;
- rozmiar, timing feedbacku, timer, zasady skracania i review;
- rozkład aktywnej puli oraz rzeczywiste braki;
- źródło wag/priorytetów, jeśli są używane.

Przed poprawką przygotuj raport puli: ile unikalnych zgodnych item IDs istnieje dla każdego wymaganego stratum. Nie wnioskuj o pokryciu egzaminu z samej liczby pytań lub nazwy folderu.

Dla certyfikacji odwzorowanie oficjalnego zakresu i wag wymaga aktualnego oficjalnego przewodnika; Codex ma sprawdzić źródło, wersję i datę. Nie kopiuj pytań egzaminacyjnych ani remembered dumps. Gdy źródło nie podaje wag lub ma luki, zapisz jawny Patternly-defined blueprint, bez udawania oficjalności.

Dla Coding/Design Interview scope jest zakresem ćwiczeń Patternly. Nie nazywaj go pełnym odwzorowaniem rekrutacji do konkretnej firmy.

## 4. Reprezentatywny dobór — bez udawania pełnego pokrycia

### 4.1. Blueprint obejmujący właściwy zakres

Zastąp listę ograniczoną do pierwszego noda doborem z jawnie zadeklarowanych warstw właściwych dla celu. Zachowaj stałą długość, jeżeli obecny kontrakt ją wymaga. Gdy zmiana zakresu wymaga brakujących pytań, zapisz dokładne luki i przygotuj ograniczone nowe/zastępcze elementy zgodnie z BIZQ-01; nie generuj masowo fillerów.

Warstwa może oznaczać domenę egzaminacyjną, kompetencję albo rodzinę decyzji. Jedno pytanie ma jeden główny wkład w licznik pokrycia; dodatkowe tagi nie mogą sprawiać, że wygląda jak pięć niezależnych prób.

Jeżeli liczba umiejętności przekracza długość diagnozy, nie obiecuj, że każda została sprawdzona. Wynik mówi o próbkowaniu szerokich obszarów, nie o wyczerpaniu całej taxonomy.

### 4.2. Deterministyczny podział liczby pytań

Użyj istniejącego mechanizmu blueprint selection. Jeśli potrzebne jest rozdzielenie kwot według wag, zastosuj jeden prosty, testowalny algorytm, np. największych reszt z deterministycznym tie-break po stabilnym ID. Minimalne pokrycie warstw, jeżeli wymagane, jest częścią blueprintu, nie improwizacją generatora.

Przykład syntetyczny: 40 miejsc i pięć warstw o wagach 25/25/20/20/10% daje 10/10/8/8/4. To dane fixture, nie zakres prawdziwego egzaminu. Przy innych wagach suma przydziałów musi dokładnie wynosić N.

Brak pozycji dla wymaganego stratum w stałym trybie to błąd przygotowania albo jawny brak pokrycia wymagający naprawy contentu — nie ciche przeniesienie miejsc do pierwszego noda. Nie używaj duplikatu item ID do domknięcia liczby.

### 4.3. Dostęp Free/Premium

Pełny blueprint nie może omijać uprawnień. Jeżeli Free obejmuje tylko ograniczony zakres danego tracka, legalny preview/diagnosis ma nazwać ten zakres albo istniejący CTA ma prowadzić do paywalla. Nie uruchamiaj płatnego trybu jako „darmowej diagnozy” przez zmianę nazwy.

`Exam`, `Coding Mock Interview` i Design Interview pozostają Premium według aktualnego planu. Nie twórz wyjątku dlatego, że wylosowane pytania pochodzą z darmowego źródła. Jeżeli legalna darmowa wersja diagnostyki nie istnieje, nie wymyślaj jej w tym zadaniu.

## 5. Sprawdzanie nowych przykładów

### 5.1. Co znaczy „nowy”

Rozróżnij nowy item ID od nowego wymagania rozumowania. Zmiana nazwy firmy albo wartości liczbowej może pozostawić identyczny schemat z widoczną odpowiedzią. Takie pytanie może służyć ćwiczeniu, ale nie powinno automatycznie być mocnym dowodem transferu.

Wykorzystaj istniejące metadata stage/archetype/contrast/review variant. Jeśli brakuje jednego niezbędnego oznaczenia relacji bliskich wariantów, dodaj minimalne pole ze wskazanym konsumentem selekcji i testami. Nie twórz drugiej taxonomy ani nowej warstwy „AI quality score”. Heurystyka podobieństwa z BIZQ-01 jest sygnałem redakcyjnym, nie runtime dowodem tożsamości umiejętności.

„Brak wcześniejszej ekspozycji” oznacza brak zarejestrowanej ekspozycji w dostępnej historii danego profilu. Nie jest dowodem, że człowiek nigdy nie widział podobnego pytania w sieci. Nie obiecuj więcej. Gdy historia jest niepełna, zachowaj jawne ograniczenie interpretacji.

### 5.2. Kontrakt zadania transferowego

Dobre sprawdzenie transferu musi obejmować co najmniej jeden sensowny typ zmiany:

- ten sam mechanizm w innym archetypie, wymagającym rozpoznania jego warunków;
- podobny kontekst, ale zmieniony warunek powodujący inną decyzję;
- kontrast dwóch realnie konkurencyjnych podejść;
- zastosowanie bez wcześniejszej podpowiedzi etapu/tematu.

Nie wystarczy nowe ID i odrobinę zmienione copy. W batchu autor opisuje, co zmieniono i dlaczego ta zmiana sprawdza transfer. Reason/Details tłumaczą konkretną granicę, a nie powtarzają ogólny slogan.

W selekcji preferuj zgodne, niewidziane pytania i unikaj bliskiego wariantu pokazanego chwilę wcześniej. Jeśli nie ma odpowiedniej puli, pokaż ograniczenie „practice, not fresh transfer evidence” zgodnie z realnym mode contract albo zgłoś brak wymaganej puli. Nie nazywaj starego pytania nowym, by test przeszedł.

### 5.3. Brak podpowiedzi kontekstowych

Gdy celem jest rozpoznanie wzorca, nagłówek nie może zdradzać jego nazwy. Zachowaj widoczną tożsamość tracka, ale zbędny szczegół topic/mentalUnit ujawnij dopiero w odpowiedniej fazie. Sprawdź także accessibility props, route-derived labels, nazwy odpowiedzi i poprzednią kartę, nie tylko prompt.

Nie usuwaj prawdziwych warunków problemu. Test ma wymagać samodzielnego rozpoznania, a nie zgadywania brakujących założeń.

### 5.4. Granica feedbacku

Nie zmieniaj automatycznie diagnostyki z immediate feedback na end-feedback. To zmiana kontraktu trybu. Jeśli obecny diagnostic udziela feedbacku po każdym pytaniu, jego wynik jest zbiorem obserwacji podczas nauki; feedback może wpływać na późniejsze odpowiedzi. Raport i interpretacja nie mogą udawać czystego pretestu.

Do sprawdzenia z odroczonym feedbackiem wykorzystaj istniejący właściwy tryb, z jego uprawnieniami i timerem. Nie twórz ukrytej symulacji na bazie zwykłego runnera. Pary blisko powiązanych przykładów mogą wspierać naukę w contrast practice, ale nie służą jako niezależne próby potwierdzające transfer natychmiast po objaśnieniu.

## 6. Interpretacja wyników i następne kroki

### 6.1. Właściwy wynik

Pokaż prawdziwy scope, liczbę prób i ograniczenie dowodów. Dla małej liczby zadań w danej domenie lepszy jest opis „2 z 3 odpowiedzi poprawne, mała próbka” niż stanowczy status „obszar opanowany”. Nie wprowadzaj nowego syntetycznego wskaźnika gotowości.

Zachowaj bieżące zasady scoringu: partial, incorrect i unanswered są różnymi kategoriami, chyba że konkretny egzaminowy wynik ma zdefiniowany sposób agregacji. Nie zaliczaj pominiętej odpowiedzi jako dowodu konkretnej błędnej reguły. Liczniki numerator/denominator muszą być jawne w modelu i testach.

### 6.2. Reguły rekomendacji

| Sygnał | Dopuszczalna interpretacja i akcja |
| --- | --- |
| Brak próbek z danego obszaru | Potrzebujemy sprawdzenia/wprowadzenia; nie diagnozuj braku umiejętności. |
| Wiele poprawnych odpowiedzi guided, brak niezależnych prób | Zaproponuj mniej podpowiadające zastosowanie; nie deklaruj transferu. |
| Powtarzalny, autorsko opisany błąd | Zaproponuj konkretną remediation/contrast zgodnie z family policy. |
| Dobre wyniki na znanych przykładach, słabsze na nowych | Priorytet zróżnicowanego zastosowania, nie kolejnych kopii znanych pytań. |
| Słabszy wynik na due retrieval | Wróć do istniejącej remediation z BIZQ-04. |
| Prawidłowy transfer w badanym zakresie | Można zaproponować szerszy zakres; to nie dowód całego tracka. |

Te reguły są rekomendacjami. Nie wprowadzają mastery gate ani blokady kolejnego noda. Każda rekomendacja ma powód wskazujący rzeczywiste dowody. Nie diagnozuj trwałej cechy osoby na podstawie jednej błędnej opcji.

### 6.3. Kontrakt wyjściowy do planera

BIZQ-03 potrzebuje co najmniej: zakres zbadany, obszary bez wystarczających dowodów, etapy praktyki, powtarzalne błędy, dostępność następnego sensownego sprawdzenia i ograniczenia ekspozycji. Zwracaj ten wynik z istniejącego family read model/recommendation ownera, nie nowego scoring repozytorium.

Nie zapisuj drugiego `completionStatus` zbudowanego z tych sygnałów. Istniejąca reguła ukończenia i kryterium odblokowania pozostają kanoniczne. Gdy wynik pakietu i szersza ocena pokrycia różnią się, pokaż oba znaczenia uczciwie.

## 7. Weryfikacja wartości edukacyjnej — bez wymyślonych wyników

Zadanie obejmuje przygotowanie definicji pomiaru i możliwość jego wykonania na istniejących danych, nie deklarację poprawy u użytkowników. Produkt według R1 nie ma jeszcze danych produkcyjnych umożliwiających taki wniosek.

### 7.1. Wskaźniki wewnętrzne

- poprawne odpowiedzi na pierwszej zarejestrowanej próbie nowych, mniej podpowiadających przykładów, z jawnym mianownikiem;
- poprawne odpowiedzi na due-qualified retrieval, osobno od natychmiastowych poprawek;
- ponowne wystąpienia tego samego autorsko zdefiniowanego błędu;
- rzeczywisty foreground time realizacji planu wobec jego estymaty;
- rozkład pokrycia między obszarami i etapami, nie tylko liczba sesji.

Preferuj istniejące lokalne zapytania/test harness i obecny dozwolony zakres danych. Nowe zagregowane zdarzenie albo transmisja wymaga aktualnego kontraktu privacy/telemetry. Nie loguj odpowiedzi i nie uruchamiaj analityki serwerowej tylko po to, by zamknąć zadanie.

### 7.2. Minimalny protokół przyszłego pilota

Przygotuj w raporcie wykonalny opis: określony zakres nauki → nowa, porównywalna próba początkowa → nauka → odroczony test na innych przykładach → porównanie wyników z kontrolą wcześniejszej ekspozycji i czasu. Obie wersje muszą korzystać z poprawnego, dopuszczonego materiału; nie wracaj do wadliwych odpowiedzi jako grupy kontrolnej.

Nie testuj efektu objaśnień przez powtórzenie identycznego pytania tuż po ich przeczytaniu. Nie przypisuj poprawy jednej zmianie, jeśli jednocześnie zmieniły się content, ekspozycja i planner. Pilot wymaga realnych uczestników i właściwego zakresu zgód; Codex nie ma ich fabrykować ani kontaktować bez upoważnienia.

Bez takiego pilota raport brzmi „mechanizm i definicja pomiaru zaimplementowane, efekt edukacyjny niezmierzony”. Jest to prawidłowe ograniczenie, nie powód do fałszowania skuteczności.

## 8. Testy obowiązkowe

| ID | Przypadek | Oczekiwany wynik |
| --- | --- | --- |
| D01 | Blueprint całego tracka, pytania tylko pierwszego noda | Brak fałszywego pełnego zakresu; odrzucone przygotowanie albo prawdziwie ograniczona, legalna konfiguracja. |
| D02 | 40 miejsc, wagi fixture 25/25/20/20/10 | Dokładnie 10/10/8/8/4 i 40 różnych ID. |
| D03 | Wagi z niecałkowitymi kwotami | Suma N, stabilny tie-break, brak losowego zwiększania liczby pytań. |
| D04 | Brak puli w wymaganej domenie | Jawny błąd/brak pokrycia, nie filler z innego noda. |
| D05 | Wiele tagów jednego pytania | Nie udaje wielu niezależnych dowodów. |
| D06 | Nowe ID, prawie ten sam wariant | Nie jest automatycznie uznane za niezależny transfer. |
| D07 | Prompt sprawdza rozpoznanie, nagłówek zdradza wzorzec | Brak niedozwolonej podpowiedzi w widoku i propsach. |
| D08 | Pierwsza zarejestrowana ekspozycja i powtórka | Oddzielne liczniki; nie nabijają dwa razy first-attempt evidence. |
| D09 | Immediate feedback w diagnozie | Zachowana semantyka trybu; brak claimu czystego pretestu. |
| D10 | End-feedback tryb | Brak poprawności/Details przed właściwym finalization. |
| D11 | Wysokie guided score, brak niezależnych przykładów | Rekomendacja dalszego sprawdzenia, nie mastery/ready. |
| D12 | Partial/unanswered | Scoring zgodny z trybem, bez dopisywania nieistniejącego błędu. |
| D13 | Free kontra pełna/płatna diagnoza | Brak obejścia Premium; scope i CTA prawdziwe. |
| D14 | Wybrany content z web demo | Kontrola ekspozycji: nie przedstawiaj świadomie pokazanej próbki jako niezależnego testu. |
| D15 | Sesja restartowana | To samo prepared order/scope; brak ponownego losowania łatwiejszej puli. |
| D16 | Zmiana pakietu lub profilu | Właściwa izolacja i jawne ograniczenie porównywalności danych. |
| D17 | Mało danych w domenie | Mianownik i ograniczenie, bez stanowczej klasyfikacji umiejętności. |
| D18 | Planner konsumuje wynik | Inny uzasadniony scope pracy dla różnych luk; nie tylko inny tytuł karty. |
| D19 | Brak użytkowników/pomiarów | Brak fikcyjnego wyniku skuteczności, wykresu poprawy lub percent uplift. |
| D20 | Test repozytorium/telemetry boundary | Brak nowej nieautoryzowanej transmisji odpowiedzi, danych i identyfikatorów. |

Kontrola ekspozycji na web w D14 nie wymaga śledzenia osoby między stroną i aplikacją. Znane stałe przykłady demo mogą być jawnie wyłączone z puli niezależnego assessmentu przez jego blueprint, o ile ten nadal ma wystarczającą pulę. To konfiguracja rzeczywistego trybu, nie lista ukrywania wad contentu.

## 9. Odbiór

Raport musi pokazać mapping i pool readiness dla aktualnych tracków, before/after diagnozy GCP, przykład prawdziwego kontrastu/transferu, rzeczywiste źródło danych rekomendacji i ograniczenia pomiaru. Materiał nowy lub zmieniony przechodzi właściwe admission BIZQ-01.

Wymagany iOS flow: przygotowanie diagnozy → rzeczywista sesja → summary o prawdziwym zakresie → rekomendowana sesja na konkretną lukę. Dodatkowo test uprawnień oraz brak wycieku odpowiedzi. Motywy i duży tekst według aktualnego UI gate, bez testów VoiceOver.

Samo dodanie `transfer=true` do pytania nie zamyka zadania. Potrzebne są znaczące różnice między przykładami, działający selector i poprawna interpretacja. Pełne przygotowanie do egzaminu/rozmowy nadal nie jest gwarantowane przez żaden wewnętrzny score.
