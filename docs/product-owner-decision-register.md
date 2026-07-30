# Patternly — rejestr decyzji właściciela produktu

## Jak używać rejestru

To jest jedno miejsce dla decyzji właścicielskich dotyczących gotowości do
moderowanych testów. Wykonawca nie zatrzymuje pracy przy każdej pozycji:

- **`resolved`** — decyzja wynika już z kanonicznego kontraktu;
- **`provisional`** — zalecane ustawienie robocze obowiązuje, dopóki dowód albo
  właściciel go nie zmieni;
- **`pending`** — prace niezależne mogą trwać, ale wskazany etap nie może zostać
  zamrożony bez wyboru właściciela;
- **`owner-selection-required`** — gotowe, porównywalne opcje istnieją; wykonawca
  nie może wybrać finalnej opcji za właściciela;
- **`deferred`** — decyzja jest świadomie odsunięta do wskazanego gate'u
  dowodowego.

Brak odpowiedzi nie oznacza akceptacji ceny, przyszłego tracku ani finalnej
stylistyki. Każda zmiana decyzji wymaga aktualizacji konsekwencji i zakresu
aktywnego planu.

## Skrót

| ID     | Decyzja                             | Status                     | Ustawienie robocze                                                            |
| ------ | ----------------------------------- | -------------------------- | ----------------------------------------------------------------------------- |
| PO-001 | Architektura marki                  | `provisional`              | Branded house: Patternly → family → track.                                    |
| PO-002 | Pierwszy klin a tożsamość portfolio | `provisional`              | Algorithms jako klin; Patternly pozostaje wielotrackowe.                      |
| PO-003 | Publiczne nazwy family i track      | `provisional`              | Konkretny track jako tytuł, family jako kategoria.                            |
| PO-004 | Semantyka Progress                  | `resolved`                 | Wszystko wspierane jest dostępne; rekomendacja nie jest blokadą.              |
| PO-005 | Niedostępne akcje Settings          | `provisional`              | W buildzie zewnętrznym nie pokazuj funkcji, która nie istnieje end-to-end.    |
| PO-006 | Język i locale badania              | `resolved`                 | EN dla interfejsu i treści pierwszej kohorty; moderacja może być po polsku.   |
| PO-007 | Kohorta i sygnały powodzenia        | `resolved`                 | Wąska kohorta Algorithms, sygnały zadaniowe i jakościowe.                     |
| PO-008 | Gate przyszłych tracków             | `deferred`                 | Brak rozszerzeń przed dowodem pierwszego klina.                               |
| PO-009 | Kierunek stylistyczny               | `resolved`                 | Option 3 — Quiet Layered; jedna dominująca decyzja pozostaje guardrailem.     |
| PO-010 | Kanał feedbacku                     | `deferred`                 | Moderowane badanie zbiera feedback poza aplikacją.                            |
| PO-011 | Model monetyzacji                   | `deferred`                 | Brak paywalla i ceny w buildzie badawczym.                                    |
| PO-012 | Długość Independent Practice        | `provisional`              | 10 pytań domyślnie; 20 pozostaje wspieranym dłuższym wariantem.               |
| PO-013 | Operacje pierwszego badania         | `selected-inputs-required` | Bez nagrania; przed rekrutacją nadal potrzebne są dane operacyjne badania.    |

## PO-001 — Architektura marki

**Pytanie:** jak relacjonować Patternly, rodziny i konkretne tracki?

**Dowód:** dokumentacja definiuje Certification i Algorithms jako pierwsze
rodziny, a nie zamknięty katalog. Registry przechowuje `familyId` i `trackId`
osobno.

| Opcja                                                     | Konsekwencje                                                                                                            |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| A. Branded house: Patternly → family → track              | Jedna obietnica i design system; najtańsze skalowanie; wymaga dyscypliny, by family nie zastępowała konkretnej nazwy.   |
| B. Endorsed products: osobne nazwy tracków „by Patternly” | Mocniejsze pozycjonowanie per segment, ale większy koszt marki, copy, store presence i nawigacji.                       |
| C. Oddzielne submarki/aplikacje                           | Największa specjalizacja, ale duplikacja dystrybucji, runtime i utrzymania; sprzeczna z aktualną architekturą produktu. |

**Zalecenie:** A.

**Ustawienie robocze:** Patternly jest marką nadrzędną; family porządkuje semantykę
nauki; track jest konkretnym wyborem użytkownika.

**Status:** `provisional`.

**Trigger decyzji właściciela:** przed zatwierdzeniem finalnego copy UTR-003 lub
gdy badanie pokaże, że wspólna obietnica jest niezrozumiała.

## PO-002 — Pierwszy klin a tożsamość portfolio

**Pytanie:** z którego segmentu zacząć walidację bez zamykania marki?

**Dowód:** Algorithms ma największy obecny zakres i różnicuje się ćwiczeniem
decyzji bez code runnera. GCP ACE ma konkretny moment zakupowy, lecz większy
koszt aktualności i silne porównanie z practice exams.

| Opcja                                               | Konsekwencje                                                                                              |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| A. Algorithms jako pierwszy klin, platformowa marka | Najczytelniejsza hipoteza wyróżnika; pozwala badać core loop; nie dowodzi jeszcze wartości Certification. |
| B. GCP ACE jako pierwszy klin, platformowa marka    | Jasny cel egzaminacyjny; wyższe ryzyko aktualności, afiliacji i konkurencji cenowej.                      |
| C. Równoległy komunikat Algorithms + GCP            | Pokazuje szerokość, ale utrudnia zrozumienie wartości i rozmywa rekrutację pierwszej kohorty.             |

**Zalecenie:** A.

**Ustawienie robocze:** pierwsze badanie rekrutuje użytkowników Algorithms;
Patternly pozostaje domain-neutral, a GCP ACE pozostaje działającą drugą
instancją i sanity-checkiem architektury.

**Status:** `provisional`.

**Trigger decyzji właściciela:** przed rekrutacją albo po dowodzie, że segment
Algorithms nie rozpoznaje problemu lub nie widzi przewagi.

## PO-003 — Publiczne nazwy family i track

**Pytanie:** co użytkownik widzi jako nazwę karty i kontekst?

**Dowód:** obecne „Cloud Certification” jest nazwą ogólną, lecz aktywny bank
dotyczy Google Cloud Associate Cloud Engineer. Dokumentacja wymaga rozdzielenia
family i instancji.

| Opcja                                                              | Konsekwencje                                                                    |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| A. Konkretna nazwa tracku jako tytuł; family jako kicker/kategoria | Prawdziwy zakres, skalowalne portfolio, dłuższe nazwy wymagają dobrego layoutu. |
| B. Family jako tytuł; track w szczegółach                          | Krótsze karty, ale ryzyko obietnicy szerszej niż dostępna treść.                |
| C. Marketingowe nazwy niezależne od family/track                   | Więcej charakteru, lecz tworzy trzeci słownik i ryzyko niespójności z registry. |

**Zalecenie:** A.

**Ustawienie robocze:** `Google Cloud Associate Cloud Engineer` z kategorią
`Certification`; `Algorithms` z kategorią opisującą practice, bez zmiany
stabilnych identyfikatorów runtime.

**Status:** `provisional`.

**Trigger decyzji właściciela:** po layout check najdłuższych nazw w UTR-003,
przed copy freeze.

## PO-004 — Semantyka Progress

**Pytanie:** czy progres blokuje, stopniuje, czy tylko rekomenduje?

**Dowód:** kanoniczny kontrakt mówi, że manualny wybór wygrywa i Progress nie
blokuje wspieranej konfiguracji. Publiczne mastery/retention jest zabronione.

| Opcja                                                         | Konsekwencje                                                                     |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| A. Twarde odblokowywanie progami                              | Sprzeczne z kontraktem i obecnymi dostępnymi ścieżkami.                          |
| B. Wszystko wspierane dostępne; jedna wyjaśniona rekomendacja | Zgodne z produktem; wymaga usunięcia starej semantyki, nie tylko zmiany etykiet. |
| C. Miękkie etapy z ukrytym ograniczeniem                      | Mniej jawny lock, ale nadal odbiera wybór i tworzy drugi model.                  |

**Zalecenie:** B.

**Ustawienie robocze:** B jest obowiązującym kontraktem.

**Status:** `resolved`.

**Trigger decyzji właściciela:** tylko formalna zmiana
`canonical-product-contract.yaml`; nie jest to zwykła decyzja layoutowa.

## PO-005 — Niedostępne akcje Settings w badaniu zewnętrznym

**Pytanie:** co zrobić z Feedback i Subscription, które celowo rzucają błąd w
development?

**Dowód:** hard-stop prawidłowo wykrywa brak integracji, ale wiersze wyglądają na
dostępne. Moderowane badanie nie wymaga billing ani in-app feedback.

| Opcja                                                     | Konsekwencje                                                                                          |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| A. Nie renderować funkcji, dopóki nie istnieje end-to-end | Najbardziej prawdziwy produkt; mniejszy zakres; po usunięciu trzeba usunąć martwy gate, copy i testy. |
| B. Pokazać jawny, nieaktywny stan unavailable             | Ujawnia kierunek, ale zajmuje uwagę i może badać przyszłą obietnicę zamiast obecnej wartości.         |
| C. Zaimplementować obie funkcje przed badaniem            | Pełne doświadczenie, lecz billing nie pomaga zweryfikować core value i poszerza zakres.               |

**Zalecenie:** A dla Subscription. Feedback również A w moderowanym badaniu;
może zostać wdrożony end-to-end później, gdy ma realnego odbiorcę.

**Ustawienie robocze:** build dla uczestnika pokazuje wyłącznie działające
ustawienia. Nie powstaje release flag ani fallback. Diagnostyczny wyjątek nie
jest zamieniany w fake success.

**Status:** `provisional`.

**Trigger decyzji właściciela:** przed UTR-006; jeśli właściciel poda działający
kanał feedbacku i chce go badać, Feedback przechodzi do pełnej implementacji.

## PO-006 — Język i locale pierwszego badania

**Pytanie:** czy pierwsza kohorta korzysta z EN, PL, czy miksu?

**Dowód:** powłoka obsługuje EN/PL oraz tryb systemowy, lecz produkcyjna treść
edukacyjna jest angielska. Polish shell może więc przejść w angielskie pytanie.

| Opcja                                                         | Konsekwencje                                                                                  |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| A. EN dla powłoki i treści; moderacja po polsku lub angielsku | Jednolity produkt i najmniejszy zakres; bada segment zdolny pracować z technicznym EN.        |
| B. PL powłoka + EN content                                    | Wykorzystuje istniejącą preferencję, ale miks może zniekształcić wyniki i postrzeganą jakość. |
| C. Pełna lokalizacja PL powłoki i contentu                    | Najlepsza spójność dla polskiej grupy, ale to duży osobny zakres redakcyjny i walidacyjny.    |

**Zalecenie:** A dla pierwszej kohorty.

**Ustawienie robocze:** przygotowanie copy i visual packetu w EN. Nie usuwać
istniejącej preferencji PL przed decyzją, ale wymusić kontrolowany locale w
buildzie/protokole badania bez ukrytego przełącznika produkcyjnego.

**Decyzja właściciela (2026-07-28):** A. Pierwsza kohorta korzysta z
angielskiej powłoki i angielskiej treści. Moderacja może być prowadzona po
polsku lub angielsku, ale interfejs i materiał edukacyjny nie mieszają locale.

**Status:** `resolved`.

**Trigger decyzji właściciela:** przed rekrutacją i UTR-008. Właściciel wybiera
język uczestników, moderatora i dopuszczalność angielskiej treści.

## PO-007 — Kohorta i sygnały powodzenia

**Pytanie:** kogo badamy i co uznajemy za dowód?

**Dowód:** nie ma jeszcze badań użytkowników. Audyt proponuje początkujący klin
Algorithms, ale deklarowana chęć powrotu nie dowodzi rzeczywistej retencji.

| Opcja                                   | Konsekwencje                                                                           |
| --------------------------------------- | -------------------------------------------------------------------------------------- |
| A. Jedna wąska kohorta Algorithms       | Najczystszy test pozycjonowania i journey; nie waliduje Certification.                 |
| B. Dwie osobne kohorty Algorithms i GCP | Szerszy dowód portfolio, dwukrotnie większy research scope i dwa różne momenty użycia. |
| C. Mieszana kohorta bez rozdzielenia    | Szybka, ale wyników nie da się przypisać do segmentu.                                  |

**Zalecenie:** A, 6–8 osób przygotowujących się do rozmów technicznych, które
potrafią rozwiązywać podstawowe zadania, ale mają problem z rozpoznaniem wzorca,
trade-offem albo warunkiem brzegowym.

**Ustawienie robocze:** oceniamy osobno:

- czy uczestnik własnymi słowami opisuje produkt i jego różnicę względem code
  runnera;
- czy bez podpowiedzi przechodzi wybór tracku → sesję → odpowiedź → feedback →
  summary → następną akcję;
- czy potrafi wyjaśnić mechanizm błędu i zastosować regułę w pytaniu
  kontrastowym;
- gdzie potrzebuje interwencji moderatora i jakie ma błędne oczekiwania;
- czy chce powtórzyć praktykę oraz jaka alternatywa dziś rozwiązuje problem;
- jaki rezultat uważa za potencjalnie płatny, bez sugerowania ceny.

GO do kolejnego eksperymentu wymaga większościowego zrozumienia obietnicy i
samodzielnego ukończenia core journey, braku powtarzalnego krytycznego
nieporozumienia oraz jakościowego dowodu, że feedback zmienia następną decyzję.
Nie tworzymy jednego syntetycznego score.

**Decyzja właściciela (2026-07-28):** A. Pierwsze badanie obejmuje jedną
wąską kohortę Algorithms według opisanych wyżej sygnałów jakościowych, bez
syntetycznego score i bez wyciągania wniosków o ścieżce Certification.

**Status:** `resolved`.

**Trigger decyzji właściciela:** przed rekrutacją; po pierwszym badaniu sygnały
są aktualizowane na podstawie realnych obserwacji.

## PO-008 — Gate przyszłych tracków

**Pytanie:** kiedy wybrać kolejną instancję lub rodzinę?

**Dowód:** Azure, AWS, SQL, debugging i system design są w dokumentacji
architektonicznymi kandydatami. Nie są zatwierdzonym roadmapem.

| Opcja                                                 | Konsekwencje                                                                                   |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| A. Najpierw druga instancja Certification             | Najtańszy test rozszerzalności istniejącej family; nadal wymaga operacji aktualności contentu. |
| B. Najpierw nowa family, np. SQL reasoning            | Silniejszy dowód szerokości Patternly; większy koszt runtime, interakcji, designu i treści.    |
| C. Brak rozszerzenia do czasu dowodu pierwszego klina | Chroni fokus i zapobiega placeholderom; opóźnia techniczny proof drugiej instancji.            |

**Zalecenie:** C teraz. Później porównać A i B na podstawie wyniku badań,
kosztu utrzymania treści, potencjału płatnej wartości oraz dowodu, że nowy zakres
nie wymaga track-specific branch w kernelu.

**Ustawienie robocze:** tylko Algorithms i GCP ACE są renderowane. Nie tworzyć
kart, taxonomii, statusów ani pustych runtime'ów przyszłych kandydatów.

**Status:** `deferred`.

**Trigger decyzji właściciela:** po syntezie pierwszej kohorty i ocenie
operacyjnej aktualności GCP ACE.

## PO-009 — Kierunek stylistyczny

**Pytanie:** który z trzech istniejących systemów wizualnych ma stać się finalną
twarzą Patternly?

**Dowód:** ADR-005 ustala dark-first, spokojny, techniczny, premium i
domain-neutral Focus Lab. Obecny UI częściowo go realizuje, lecz użytkownik chce
porównać stylistyczne alternatywy. Wszystkie opcje muszą zachować kontrakt, brak
gamifikacji i prawdziwe stany.

| Opcja                           | Artefakt                                                       | Charakter i konsekwencje                                                                                                                                                                 |
| ------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Option 1 — Editorial / Minimal  | Exploratory reference retired after the decision | Najmniej kart, najmocniejsza typografia i koncentracja na jednej decyzji. Najlepiej redukuje dashboardowość; wymaga uważnego przeniesienia rytmu na dłuższy feedback i gęstsze stany.    |
| Option 2 — Structured Workbench | Exploratory reference retired after the decision | Najbardziej narzędziowa i uporządkowana hierarchia w obrysowanej powierzchni. Jest bliska obecnemu systemowi komponentów, ale może pozostać zbyt podobna do ogólnego premium dashboardu. |
| Option 3 — Quiet Layered        | [option-3.png](designs/product-direction-options/option-3.png) | Spokojna, warstwowa karta i wyraźna separacja rekomendacji. Daje mocną orientację, lecz zużywa najwięcej wysokości i wymaga kontroli na małym ekranie oraz przy większym tekście.        |

**Decyzja właściciela (2026-07-28):** Option 3 — Quiet Layered. Powodem jest
mała liczba napakowanych elementów, ograniczenie powierzchni do informacji
niezbędnych oraz naturalna dyscyplina wynikająca z dużych paddingów kart.

**Konsekwencje dla implementacji:** Option 3 jest kanoniczną bazą wizualną, a
nie połową hybrydy. Z Option 1 zostaje wyłącznie reguła hierarchii: jeden
dominujący wybór i usuwanie powtórzonego kontekstu. Duże paddingi nie mogą
prowadzić do zagnieżdżania kart ani wypychania podstawowej decyzji poza pierwszy
viewport; mały ekran i większy tekst są obowiązkową bramką UTR-005.

**Status:** `resolved`.

**Trigger wykonawczy:** wybór odblokował UTR-005. Implementacja i porównawcze
QA korzystają z
[Option 3](designs/product-direction-options/option-3.png) jako źródła.

## PO-010 — Kanał feedbacku

**Pytanie:** czy feedback wewnątrz aplikacji jest częścią pierwszego badania?

**Dowód:** obecnie nie ma odbiorcy ani integracji. Moderowane badanie ma
moderatora i formularz obserwacji poza aplikacją.

| Opcja                                        | Konsekwencje                                                                                             |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| A. Brak in-app feedback w buildzie badawczym | Najmniejszy prawdziwy zakres; moderator zbiera dane w protokole.                                         |
| B. Działający e-mail lub formularz           | Przydatny po badaniu i dla testów asynchronicznych; wymaga ownera, prywatności i potwierdzonego odbioru. |
| C. Pełny system zgłoszeń w produkcie         | Najlepsza operacyjność, lecz nieproporcjonalny zakres na tym etapie.                                     |

**Zalecenie:** A dla pierwszej moderowanej kohorty; B przed testami
asynchronicznymi, jeśli istnieje realny odbiorca.

**Ustawienie robocze:** brak widocznego wiersza bez działającej integracji.

**Status:** `deferred`.

**Trigger decyzji właściciela:** wskazanie kanału i ownera albo przejście do
testów bez moderatora.

## PO-011 — Model monetyzacji

**Pytanie:** subscription, zakup tracku czy inny model?

**Dowód:** repozytorium nie zawiera ceny, katalogu produktów, entitlement source
of truth ani dowodu gotowości do zapłaty.

| Opcja                                       | Konsekwencje                                                                                             |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| A. Subskrypcja                              | Finansuje aktualność i nowe treści, ale wymaga trwałej wartości, billing/restore oraz jasnego katalogu.  |
| B. Zakup per track                          | Czytelna transakcja i zgodność z portfolio; trudniej finansować ciągłe aktualizacje i cross-track value. |
| C. Hybryda lub darmowy core + płatne tracki | Większa elastyczność, ale największa złożoność katalogu i komunikacji.                                   |

**Zalecenie:** nie wybierać jeszcze modelu. W badaniu pytać o płatny rezultat,
częstotliwość użycia i obecne alternatywy, bez pokazywania fikcyjnego paywalla i
bez przedstawiania ceny jako faktu.

**Ustawienie robocze:** build badawczy bez subskrypcji i lokalnego entitlement.

**Status:** `deferred`.

**Trigger decyzji właściciela:** po dowodzie powtarzalnej wartości i analizie
odpowiedzi o gotowości do zapłaty; przed rozpoczęciem kompletnego pionowego
zakresu billing.

## PO-012 — Długość Independent Practice

**Pytanie:** jaka długość ma być domyślna dla deklarowanego zakresu Independent
Practice?

**Dowód:** deklarowany zakres `Hash map and set` ma 66 pozycji, a przypięty
blueprint i runtime wspierają dla Independent Practice kanoniczne długości 10
albo 20. Dotychczasowy default 20 pozostawiał w 60-minutowym badaniu tylko 28
minut na około 3565 słów promptów, odpowiedzi i feedbacku, interakcje,
think-aloud oraz sondy. Kontrakt deklarował również 40, choć tryb nie wspierał
tej długości.

| Opcja                                          | Konsekwencje                                                                                                                                                                                               |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A. 10 pytań domyślnie, 20 jako dłuższy wariant | Mieści core journey, feedback i summary w jednej sesji badawczej; zachowuje kontrasty 6→8 i 9→10 oraz choice/ordering/complexity; nie obejmuje w tej jednej sesji trzeciej jednostki `frequency_counting`. |
| B. 20 pytań domyślnie                          | Pełniejsze pokrycie trzech jednostek mentalnych, lecz duże ryzyko przerwania journey i utraty danych o summary, Progress oraz następnej akcji.                                                             |
| C. Dodać wybór 10/20 na ekranie zakresu        | Daje kontrolę użytkownikowi, ale dodaje decyzję konfiguracyjną do badanego journey i zwiększa zakres UI bez dowodu, że wybór długości jest teraz istotny.                                                  |

**Zalecenie:** A. Krótszy default służy zarówno pierwszemu badaniu, jak i
regularnej skupionej praktyce. Dłuższa sesja 20 pozostaje realnie wspierana;
niemożliwe 40 zostało usunięte z kontraktu zamiast utrzymywania deklaracji bez
pokrycia.

**Ustawienie robocze:** kontrakt, runtime i manifest badania używają 10.
Wariant 20 może być udostępniony później przez prawdziwy wybór konfiguracji,
jeśli obserwacje pokażą taką potrzebę.

**Status:** `provisional`.

**Trigger decyzji właściciela:** wynik mierzonego dry-runu albo powtarzalna
prośba badanych o dłuższą sesję; przed dodaniem kontrolki długości do
Independent Practice.

## PO-013 — Operacje pierwszego badania

**Pytanie:** jaki minimalny, prawdziwy model operacyjny zastosować do pierwszej
kohorty?

**Dowód:** pakiet pozwala przeprowadzić sesję bez nagrania i przechowuje w
artefaktach badawczych wyłącznie kod uczestnika. Rekrutacja nadal wymaga
konkretnego ownera, kontaktu, miejsca przechowywania notatek, zasad
wynagrodzenia i zgodnej informacji o prywatności. Repozytorium nie może
wiarygodnie wymyślić tych danych.

| Opcja                                                        | Konsekwencje                                                                                                                                                                                                                                          |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A. Pierwsza kohorta bez nagrania, tylko pseudonimowe notatki | Najmniejsza powierzchnia prywatności i najszybsze uruchomienie; moderator i note-taker muszą pracować uważnie, a część niuansów może zostać utracona. Nadal wymagane są zatwierdzone miejsce notatek, owner, kontakt, privacy notice i wynagrodzenie. |
| B. Opcjonalne nagranie ekranu i dźwięku                      | Bogatszy materiał i łatwiejszy audyt syntezy; wymaga osobnej zgody, zatwierdzonego storage, dostępu, terminów usunięcia i procesu wycofania zgody. Brak zgody nie może wykluczać uczestnika.                                                          |
| C. Zewnętrzna platforma lub partner badawczy                 | Może zapewnić rekrutację, zgodę, wynagrodzenia i przechowywanie, ale wprowadza koszt, umowę, transfer danych i przegląd dostawcy.                                                                                                                     |

**Zalecenie:** A dla pierwszej kohorty. Nagranie nie jest potrzebne do
sprawdzenia core journey, a notes-only pozwala nie rozszerzać operacji danych
przed pierwszym dowodem wartości.

**Ustawienie robocze:** dry-run odbywa się bez nagrania. Właściciel produktu
prowadzi badanie, notuje i wykonuje syntezę. Rekrutacja nie rusza, dopóki nie
zostaną podane: kontakt dla uczestnika, zatwierdzone miejsce notatek, zasady
wynagrodzenia oraz właściwa informacja o prywatności. Terminy usunięcia zapisane
w pakiecie obowiązują dopiero po potwierdzeniu ich zgodności z tą informacją.

**Decyzja właściciela (2026-07-28):** A. Pierwsza kohorta działa bez nagrania,
wyłącznie na pseudonimowych notatkach.

**Decyzja operacyjna właściciela (2026-07-29):** badanie prowadzi osobiście
właściciel produktu. W pierwszej kohorcie jest równocześnie research ownerem,
moderatorem, note-takerem i właścicielem syntezy. Nie oznacza to, że dry-run
może zostać wykonany bez osoby z zewnątrz: właściciel prowadzi próbę, a osoba
niezaangażowana w implementację przechodzi protokół jako badany.

**Status:** `selected-inputs-required`. Polityka zbierania danych jest wybrana,
rola research ownera i pozostałe role wykonawcze są potwierdzone, ale rekrutacja
nadal nie może ruszyć bez kontaktu dla uczestnika, zatwierdzonego miejsca
notatek, zasad wynagrodzenia i właściwej informacji o prywatności. Brak tych
danych nie jest zastępowany fikcyjnymi wartościami w repozytorium.

**Trigger decyzji właściciela:** przed rekrutacją. Cztery pozostałe dane
operacyjne należy potwierdzić w jednej odpowiedzi, nie jako serię oddzielnych
pytań.

## Pozostałe dane operacyjne przed rekrutacją

Wybory `PO-009: 3`, `PO-006: A`, `PO-007: A` i `PO-013: A` zostały podjęte
2026-07-28. Nie ma już blokera właścicielskiego dla finalizacji produktu ani
protokołu badania.

Rekrutacja pozostaje osobnym gate'em operacyjnym. Przed jej rozpoczęciem
pozostaje podać w jednej odpowiedzi: kontakt dla uczestnika, zatwierdzone
miejsce pseudonimowych notatek, zasady wynagrodzenia oraz właściwą informację o
prywatności. Do tego czasu można wykonywać implementację, automatyczne QA i
wewnętrzny dry-run bez danych uczestników.

## PO-014 — Zakończenie nieukończonej sesji

**Pytanie:** co powinno się wydarzyć, gdy użytkownik świadomie kończy sesję
przed ostatnim pytaniem?

**Dowód:** dry-run wykazał, że powrót bezpośrednio do wyboru ćwiczenia odbiera
użytkownikowi domknięcie i informację o wykonanej pracy. Jednocześnie
nieukończonej sesji nie wolno przedstawiać jako ukończonego wyniku.

| Opcja | Konsekwencje |
| --- | --- |
| A. Powrót do Practice bez podsumowania | Najkrótszy flow, ale utrata kontekstu, aktywnego czasu i liczby odpowiedzi. |
| B. Częściowe podsumowanie bez score | Pokazuje odpowiedzi, pominięte pytania i czas bez udawania ukończenia; wymaga rozróżnienia pause od end. |
| C. Pełny score z nieodpowiedzianymi jako błędne | Prosty model analityczny, ale fałszuje intencję użytkownika i miesza przerwanie z ukończeniem. |

**Zalecenie robocze:** B. `Pause` zachowuje możliwość wznowienia, natomiast
`End and view summary` trwale kończy sesję i pokazuje jawne `Partial summary`
bez score. To rozwiązanie jest zaimplementowane, ale pozostaje do testu
urządzeniowego po domknięciu bieżącego zestawu zmian.

**Status:** `provisional`.

**Trigger decyzji właściciela:** powtarzalne niezrozumienie różnicy między
pause i end w kolejnym dry-runie.

## PO-015 — Domyślne ustawienia szybkiego startu

**Pytanie:** skąd `Start session` ma brać konfigurację i czy Custom Practice ma
zmieniać ten domyślny zestaw?

**Dowód:** dry-run potwierdził, że główny przycisk powinien uruchamiać sesję
natychmiast. Repozytorium ma kanoniczne domyślne profile trybów, ale nie ma
jeszcze kontraktu zapisania osobistych preferencji sesji.

| Opcja | Konsekwencje |
| --- | --- |
| A. Stały rekomendowany profil produktu | Najbardziej przewidywalny start i badanie; Custom nie zmienia kolejnych szybkich sesji. |
| B. Ostatnia konfiguracja Custom staje się domyślna | Wygodne dla powtarzalnego użycia, lecz jedno eksperymentalne ustawienie może niejawnie zmienić późniejsze sesje. |
| C. Osobny ekran „Default session settings” | Pełna kontrola i jawność, ale dodatkowa funkcja oraz decyzje przed dowodem, że użytkownicy tego potrzebują. |

**Zalecenie robocze:** A dla pierwszej kohorty. Główny `Start session` używa
rekomendowanego profilu; `Custom Practice` pozostaje jawną ścieżką
niestandardową. Jeśli badanie pokaże powtarzalną potrzebę, wybrać B lub C
zamiast po cichu zapisywać ostatnie wartości.

**Status:** `provisional`.

**Trigger decyzji właściciela:** po pierwszej kohorcie albo gdy co najmniej
kilku uczestników niezależnie oczekuje trwałych własnych ustawień.

## PO-016 — Forma szczegółowego wyjaśnienia

**Pytanie:** czy wszystkie `Details` mają mieć jednolity format, czy format ma
wynikać z rodzaju rozumowania?

**Dowód:** bank ma 2735 pytań, renderer już obsługuje prozę, listy, kod, lokalne
diagramy i callouty. 1188 pytań Algorithms i wszystkie 360 Certification
korzystają jednak wyłącznie z jednego akapitu; sam dostęp do formatów nie
zapewnił jakości.

| Opcja | Konsekwencje |
| --- | --- |
| A. Krótka proza dla każdego pytania | Najmniej przewijania, ale źle tłumaczy trace, złożoność, kolejność operacji i granice scenariusza. |
| B. Adaptacyjny format zależny od mechanizmu | Trace/lista dla sekwencji, derivation dla complexity, kod tylko dla mechaniki, counterexample/boundary dla decyzji; najwyższa wartość dydaktyczna i większy koszt review. |
| C. Pełne rozwiązanie z kodem dla każdego pytania | Pozornie kompletne, ale przeciąża prostą praktykę, zamienia Patternly w zbiór editoriali i osłabia strategy-first. |

**Zalecenie robocze:** B. Kanoniczny standard został doprecyzowany w
`docs/07-content-guidelines.md`: mechanizm, konkretne zastosowanie, granica
błędnego założenia i transfer są obowiązkowe, ale długość i format wynikają z
zadania poznawczego.

**Status:** `provisional`.

**Trigger decyzji właściciela:** kalibracja na dwóch realnych sesjach i
obserwacja, czy uczestnik po błędzie potrafi własnymi słowami odtworzyć
mechanizm oraz zastosować go później.
