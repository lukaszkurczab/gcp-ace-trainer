# Patternly — rejestr decyzji właściciela produktu

## Jak używać rejestru

To jest rejestr decyzji produktowych, w tym historycznych decyzji dotyczących
moderowanych testów. Bieżący publiczny launch jest prowadzony przez
[`launch-completion-plan.md`](launch-completion-plan.md). Decyzje operacyjne
badania nie blokują launchu; testy wewnętrzne odbywają się niezależnie.

Wykonawca nie zatrzymuje pracy przy każdej pozycji:

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
| PO-007 | Historyczna kohorta i sygnały       | `resolved`                 | Brak aktywnej kohorty po decyzji o pracy solo; ponowne badanie wymaga nowej decyzji. |
| PO-008 | Gate przyszłych tracków             | `deferred`                 | Brak rozszerzeń przed dowodem pierwszego klina.                               |
| PO-009 | Kierunek stylistyczny               | `resolved`                 | Option 3 — Quiet Layered; jedna dominująca decyzja pozostaje guardrailem.     |
| PO-010 | Kanał feedbacku                     | `deferred`                 | Moderowane badanie zbiera feedback poza aplikacją.                            |
| PO-011 | Model monetyzacji                   | `deferred`                 | Brak paywalla i ceny w buildzie badawczym.                                    |
| PO-012 | Długość Independent Practice        | `provisional`              | 10 pytań domyślnie; 20 pozostaje wspieranym dłuższym wariantem.               |
| PO-013 | Operacje pierwszego badania         | `resolved`                 | Nie będzie rekrutacji ani badania z uczestnikami; właściciel pracuje solo.    |
| PO-017 | Konto i rejestracja w publicznym launchu | `resolved`             | Rejestracja, logowanie i pełny lifecycle konta są wymagane; kontrakt danych powstaje przed UI. |
| PO-018 | Jednorazowe domknięcie audytu tras  | `resolved`                 | Wszystkie bieżące trasy i brakujące powierzchnie są w jednej inwentaryzacji; bez kolejnego szerokiego audytu przy niezmienionym scope. |
| PO-019 | Benchmark kategorii                 | `provisional`              | Dodać historię sesji i content trust/reporting; nie kopiować gamifikacji, judge'a, laboratoriów ani AI tutora. |
| PO-020 | Dostawca konta i zdalnych danych    | `resolved`                 | Firebase Auth + Firestore Standard + Cloud Run w Warszawie; bez Identity Platform, Cloud SQL i bez bezpośredniego Firestore w aplikacji. |
| PO-021 | Projekty Patternly sandbox i production | `resolved`              | Utworzyć dokładnie dwa odrębne projekty; pozostała konfiguracja i billing wymagają osobnej zgody. |
| PO-022 | Bazy Firestore i reguły klienta     | `resolved`                 | Utworzyć po jednej bazie Standard w Warszawie i wdrożyć deny-all rules; billing oraz dalsze usługi pozostają poza zgodą. |
| PO-023 | Standard Firebase Authentication    | `resolved`                 | Włączyć email/hasło z improved email privacy w obu projektach, bez Identity Platform, billingu, aplikacji Firebase i użytkowników. |
| PO-024 | Sandboxowy limit kosztów            | `resolved`                 | Sandbox: alert wszystkich usług 5 PLN i Cloud Run Preview spend cap 5 PLN; produkcja pozostaje bez billingu. |
| PO-025 | Hosting przed promocją rynkową      | `resolved`                 | Brak aktywnego publicznego hosta; jedyną ścieżką przedrynkową jest Firebase Hosting Emulator na `127.0.0.1`, a profesjonalny host/domena są wybierane w gate 11A. |
| PO-026 | Retencja po usunięciu konta          | `resolved`                 | 0 dni danych live; start bez backupu po odczytowym potwierdzeniu; przyszły backup maks. 30 dni bez odtworzenia konta; pięciopolowy proof dokładnie 30 dni. |
| PO-027 | Projekt account lifecycle            | `resolved`                 | Ten sam kompletny ref przeszedł do `APPROVED`; inspekcja i niezależne QA finalizacji zwróciły `pass`. |
| PO-028 | Sandboxowa implementacja Task 3A     | `resolved`                 | Zatwierdzono bazowy pakiet sandbox; jego lokalny build i trzy-SA model zostały następnie jawnie zastąpione przez `PO-031` oraz czwartą, izolowaną build identity. |
| PO-029 | Zakres urządzeń i zakupy przed powrotem właściciela | `resolved`       | Launch wspiera tylko telefony; wszelkie zakupy czekają na nową, jawną zgodę właściciela po jego powrocie. |
| PO-030 | Lokalna instalacja Google Cloud CLI  | `resolved`                 | Po odwracalnej awarii caska użyć oficjalnego archiwum Google sprawdzonego opublikowaną sumą SHA-256. |
| PO-031 | Budowanie obrazu Cloud Run           | `resolved`                 | Zastąpić ciężką lokalną VM ręcznym Cloud Build bez triggerów; dokładny IAM/koszt musi przejść QA przed mutacją. |

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

**Ustawienie robocze:** launch koncentruje się na użytkowniku Algorithms;
Patternly pozostaje domain-neutral, a GCP ACE pozostaje działającą drugą
instancją i sanity-checkiem architektury. `PO-013` wycofuje rekrutację i
badanie uczestników, ale nie zmienia pierwszego klina produktu.

**Status:** `provisional`.

**Trigger decyzji właściciela:** przed zmianą pierwszego klina albo po dowodzie,
że segment Algorithms nie rozpoznaje problemu lub nie widzi przewagi.

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

**Trigger decyzji właściciela:** wyłącznie przed zmianą publicznego języka
interfejsu lub treści. Nie ma już języka uczestników ani moderatora do wyboru.

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

**Nowszy status po `PO-013` (2026-08-01):** nie ma aktywnej kohorty ani sygnałów
badania uczestników. Historyczna decyzja nie tworzy pracy w launch planie.
Ponowne badanie wymaga nowej decyzji i prawdziwego pakietu operacyjnego.

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

**Nowsza decyzja właściciela (2026-08-01):** nie będzie rekrutacji, kohorty ani
badania z uczestnikami. Właściciel rozwija i sprawdza produkt od początku do
końca solo. Ta decyzja wycofuje wcześniejszy plan dry-runu z osobą zewnętrzną
oraz usuwa potrzebę kontaktu dla uczestnika, miejsca notatek, wynagrodzenia i
informacji badawczej o prywatności. Nie wycofuje publicznych obowiązków
prywatności i wsparcia wymaganych przed rynkowym wdrożeniem.

**Status:** `resolved`. Rekrutacja i artefakty badania uczestników są usunięte z
aktywnego planu. Ich ponowne wprowadzenie wymaga nowej decyzji właściciela oraz
pełnego, prawdziwego pakietu operacyjnego; repozytorium nie tworzy dla nich
fikcyjnych wartości ani pustych struktur.

## Wycofany historyczny gate rekrutacji

Wybory `PO-009: 3`, `PO-006: A`, `PO-007: A` i `PO-013: A` zostały podjęte
2026-07-28. Nie ma już blokera właścicielskiego dla finalizacji produktu ani
protokołu badania.

Rekrutacja została wycofana decyzją z 2026-08-01 i nie jest już gate'em
operacyjnym. Historycznie brakowało kontaktu dla uczestnika, zatwierdzonego
miejsca pseudonimowych notatek, zasad wynagrodzenia i właściwej informacji o
prywatności. Żadna z tych danych nie jest obecnie wejściem do implementacji,
automatycznego QA ani samodzielnej kontroli właściciela.

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

## PO-017 — Konto i rejestracja w publicznym launchu

**Pytanie:** czy publiczny launch pozostaje lokalnym produktem bez konta, czy
obejmuje rejestrację i logowanie?

**Decyzja właściciela z 2026-07-31:** rejestracja, logowanie i pozostałe
powierzchnie konta są wymaganym zakresem publicznego launchu.

**Konsekwencje:**

- decyzja zastępuje założenie launchowe z `ADR-003-no-auth-in-mvp.md`;
- nie wystarczy dodać formularzy: wymagane są weryfikacja, odzyskiwanie,
  reautoryzacja, wylogowanie, usunięcie konta i danych;
- przed implementacją trzeba ustalić cel konta, model tożsamości, własność
  danych lokalnych/zdalnych, pierwszy sync, konflikt, offline i retencję;
- istniejące lokalne dane nie mogą zostać cicho połączone, zastąpione ani
  utracone po rejestracji/logowaniu;
- polityki prywatności, bezpieczeństwa i store declarations muszą opisywać
  rzeczywisty model konta.

**Rozstrzygnięcie kontraktu Task 1 z 2026-07-31:** vendor-neutralny model
używa zweryfikowanego e-maila i hasła, wymaga sieci dla pierwszego bootstrapu,
ale po nim zachowuje lokalną praktykę offline. Kanoniczne repozytoria lokalne
są autorytetem trwałości urządzenia, a jeden rewizjonowany dataset zdalny jest
autorytetem konwergencji konta. Adopcja, konflikt, wylogowanie i usunięcie
danych mają jawne, testowane wyniki w `canonical-product-contract.yaml`; żaden
z tych mechanizmów nie jest jeszcze opisany jako zaimplementowany runtime.

**Status:** `resolved` dla wymagania właściciela i kontraktu Task 1. Dostawcę
konta i danych oraz region backendu rozstrzyga `PO-020`; implementacja,
publiczny host/domena i dowody produkcyjne pozostają w Tasks 3 i 8.

## PO-018 — Jednorazowe domknięcie audytu tras

**Pytanie:** czy praca ma nadal wracać do szerokich audytów, czy obecny audyt
ma ustalić całą trasę do launchu?

**Decyzja właściciela z 2026-07-31:** sprawdzić wszystkie bieżące trasy,
brakujące ekrany i prace dystrybucyjne teraz, aby kolejne etapy były
implementacją, a nie następnym audytem odkrywczym.

**Ustawienie:** `launch-surface-inventory.md` jest zamkniętą inwentaryzacją 21
tras, stanów wbudowanych, brakujących ekranów konta/trust oraz rejestracji i
podpisywania aplikacji. Każdy task wykonuje własne before/after i aktualizuje
inwentaryzację, ale nie otwiera szerokiego audytu przy niezmienionym scope.

**Status:** `resolved`.

## PO-019 — Benchmark konkurencji a zakres launchu

**Pytanie:** które braki ujawnione przez konkurencyjne aplikacje są rzeczywistą
luką Patternly, a które tylko kopiowaniem cudzych katalogów funkcji?

**Dowód:** `competitive-product-gap-audit.md` porównuje LeetCode, NeetCode,
AlgoMonster, Pocket Prep, AWS Skill Builder, Google Skills, Microsoft Learn,
Brilliant, Codecademy i Quizlet na aktualnych oficjalnych źródłach.

**Ustawienie robocze:**

- do launchu dochodzą: Study Activity/historia sesji, widoczna informacja o
  wersji i podstawie contentu, `Report a problem` z kontekstem item/release oraz
  operacyjna ścieżka korekty;
- konto musi zapewnić jawną ciągłość lokalne–zdalne i widoczny stan sync;
- learning goal/cadence powstaje tylko wtedy, gdy zmienia rekomendację lub
  przypomnienie;
- globalny katalog/search, code judge, cloud labs, AI tutor, streaki, XP,
  ligi, badge'e, community i paywall nie są wymagane do launchu.

**Status:** `provisional`; zmienić tylko po dowodzie, że odrzucona funkcja
usuwa realną przeszkodę w core loopie albo że wskazana luka nie zmienia decyzji
użytkownika.

## PO-020 — Dostawca konta, zdalnych danych i regionalnego backendu

**Pytanie:** jaki produkcyjny stos konta i zdalnych danych spełnia kontrakt
Task 1 bez wysokiego stałego kosztu przed potwierdzeniem popytu?

**Decyzja właściciela z 2026-08-01:** użyć standardowego Firebase
Authentication z e-mailem i hasłem, Firestore Standard oraz Cloud Run w
regionie `europe-central2` (Warszawa). Na launch nie używać Identity Platform
ani Cloud SQL. Aplikacja nie może łączyć się bezpośrednio z Firestore.

**Konsekwencje:**

- jedna aplikacyjna granica Patternly wysyła uwierzytelnione żądania HTTPS do
  regionalnego API Cloud Run; ekrany i runtime rodzin nie używają Firestore;
- Cloud Run weryfikuje Firebase ID token i jako jedyny wykonuje transakcje
  Firestore, uprzywilejowane operacje tożsamości oraz zdalne usuwanie;
- lokalne repozytoria, journal i outbox pozostają jedyną ścieżką trwałości
  urządzenia; nie używa się klienckiej pamięci offline Firestore ani jej
  automatycznego modelu `last write wins`;
- model Firestore musi zachować `expectedRevision`, idempotentne identyfikatory
  operacji, jawne konflikty, deterministyczną własność rekordów oraz
  wznawialne usuwanie z weryfikacją nieobecności;
- publiczny host i własna domena dla stron oraz zweryfikowanych linków nie są
  częścią tej decyzji i pozostają wejściem operacyjnym Task 3;
- refresh token pozostaje wyłącznie w magazynie chronionym przez system
  operacyjny, a access/ID token w pamięci;
- plan Blaze może zostać włączony dopiero z `min instances = 0`, jawnym limitem
  maksymalnej liczby instancji, limitami API, alertami budżetowymi i — jeśli
  dostępny — limitem wydatków Cloud Run w statusie Preview. Limit wydatków może
  zadziałać z opóźnieniem i nie obejmuje Firestore, limit instancji może zostać
  krótkotrwale przekroczony przez mechanikę skalowania, a zwykły alert budżetowy
  nie jest twardym limitem;
- dostawca poczty, domena nadawcy, retencja, publiczne adresy i dostęp do
  podpisanych buildów pozostają osobnymi wejściami operacyjnymi Task 3;
  projekty sandbox/production zostały utworzone zgodnie z `PO-021`, natomiast
  ich billing i pozostała konfiguracja wymagają osobnej autoryzacji.

**Status:** `resolved`. Zmiana dostawcy lub regionu wymaga nowej decyzji
właściciela i ponownej oceny kontraktu, kosztów, prywatności oraz aktywnego
pakietu Task 3.

## PO-021 — Utworzenie projektów Patternly sandbox i production

**Pytanie:** czy kontroler może wykonać zewnętrzną, trwałą operację utworzenia
dwóch odrębnych projektów Firebase/GCP wymaganych przez prerequisite 3B?

**Decyzja właściciela z 2026-08-01:** utworzyć dokładnie projekty
`patternly-app-sandbox` i `patternly-app-production`.

**Granica autoryzacji:**

- zgoda obejmuje utworzenie projektów i dodanie do nich podstawowej warstwy
  Firebase wykonywane przez `firebase projects:create`;
- zgoda nie obejmuje podłączenia konta billingowego, przejścia na Blaze,
  tworzenia Firestore, włączania Authentication, wdrażania Cloud Run,
  nadawania IAM, tworzenia sekretów ani kluczy kont usługowych;
- jeżeli którykolwiek identyfikator jest niedostępny albo organizacja lub
  uprawnienia wymuszają inny zakres, nie wolno dobierać sufiksu, innego projektu
  ani billingu bez nowej decyzji właściciela;
- istniejące projekty innych produktów pozostają poza zakresem.

**Wynik wykonania z 2026-08-01:** oba dokładne projekty zostały utworzone i są
`ACTIVE`. Polecenie `firebase projects:create` automatycznie dodało podstawowe
zasoby Firebase, w tym zarezerwowało puste domyślne witryny Hosting; nie było to
osobne polecenie workera ani wybór publicznego hostingu. Billing pozostał
wyłączony, lista aplikacji Firebase jest pusta, a Firestore API jest wyłączone.
Pozostałe usługi i uprawnienia nie są deklarowane jako nieistniejące bez
odrębnej weryfikacji.

**Status:** `resolved` wyłącznie dla utworzenia dwóch projektów. Billing i
pozostała konfiguracja prerequisite 3B wymagają osobnej autoryzacji i dowodów
kosztowych.

## PO-022 — Firestore Standard w Warszawie i deny-all client rules

**Pytanie:** czy wykonać bezbillingowy slice 3B-2, który trwale ustala
lokalizację obu domyślnych baz Firestore i blokuje cały bezpośredni dostęp
klienta?

**Decyzja właściciela z 2026-08-01:** utworzyć dokładnie po jednej bazie
Firestore Standard `(default)` w `patternly-app-sandbox` i
`patternly-app-production`, zawsze w `europe-central2` (Warszawa), z ochroną
przed usunięciem włączoną i PITR wyłączonym, a następnie wdrożyć identyczne
reguły odrzucające każdy odczyt i zapis klienta.

**Granica autoryzacji:**

- oba projekty pozostają z `billingEnabled: false`; nie wolno podłączać konta
  billingowego ani przechodzić na Blaze;
- zgoda obejmuje wymagane włączenie Firestore API przez utworzenie bazy,
  kanoniczne aliasy/config/rules w repozytorium oraz wdrożenie wyłącznie rules;
- zgoda nie obejmuje Authentication, Cloud Run, Firebase client-app/SDK,
  Hosting, Functions, Storage, IAM, Secret Manager, danych, indeksów bez realnej
  kwerendy, TTL, backupów, PITR, clone/restore ani kluczy kont usługowych;
- nie wolno wybrać innej lokalizacji, edycji, identyfikatora bazy lub projektu.
  Przy częściowym powodzeniu nie usuwać działającej bazy i nie wykonywać
  automatycznego retry albo substytucji; zatrzymać się i zgłosić stan.

**Status:** `resolved` dla wykonania 3B-2 w powyższej granicy. Lokalizacja
każdej utworzonej bazy jest trwała; każda dalsza usługa lub billing wymagają
osobnej decyzji.

**Wynik wykonania z 2026-08-01 (`QA pass`):** obie bazy `(default)` istnieją
jako Firestore Standard w `europe-central2`, z ochroną przed usunięciem
włączoną, PITR wyłączonym i aktywnymi identycznymi regułami deny-all. Oba
projekty nadal raportują `billingEnabled: false`.

## PO-023 — Standard Firebase Authentication email/password

**Pytanie:** czy wykonać bezbillingowy slice 3B-3 inicjalizujący standardowe
Firebase Authentication w obu projektach?

**Decyzja właściciela z 2026-08-01:** włączyć w
`patternly-app-sandbox` i `patternly-app-production` wyłącznie uwierzytelnianie
e-mail + wymagane hasło oraz improved email privacy.

**Granica autoryzacji:**

- pozostawić wyłączone email-link, anonymous, phone, social, OIDC, SAML, MFA,
  tenants i duplicate emails;
- nie uruchamiać Identity Platform ani billingu/Blaze;
- nie rejestrować aplikacji Firebase, nie tworzyć użytkowników ani testowych
  kont i nie instalować SDK;
- nie zmieniać Cloud Run, IAM, Secret Manager, Firestore ani Hosting;
- zatrzymać się przed każdą ścieżką, która wymaga szerszego zasobu lub
  nieudokumentowanego endpointu.

**Wynik implementacji:** po wcześniejszej nieszkodliwej odpowiedzi
`CONFIGURATION_NOT_FOUND` dla maskowanej próby Admin v2 w sandboxie właściciel
ręcznie wykonał standardowy provider setup w obu projektach. Sanitized
read-only evidence potwierdza `FIREBASE_AUTH`, email + wymagane hasło i improved
email privacy, przy wyłączonych pozostałych providerach, MFA, multi-tenancy i
blocking functions. Oba projekty nadal mają zero użytkowników i aplikacji
Firebase oraz `billingEnabled: false`.

**Status:** `resolved`; implementacja 3B-3 i poprawka jednego nieaktualnego
słowa w raporcie przeszły powtórne niezależne QA z werdyktem `pass`.

## PO-024 — Sandboxowy limit kosztów przed Cloud Run

**Pytanie:** czy autoryzować najwęższy płatny krok wyłącznie dla
`patternly-app-sandbox`, pozostawiając produkcję na bezpłatnym Spark do czasu
walidacji realnego API?

**Zatwierdzona granica:**

- podłączyć do sandboxu jedyne dostępne otwarte konto billingowe w `PLN`, co
  zmieni wyłącznie ten projekt na Blaze;
- utworzyć miesięczny, jednoprojktowy budżet alertowy dla wszystkich usług na
  `5 PLN`, z progami 50%, 80% i 100% wydatku rzeczywistego oraz 100% prognozy,
  jeżeli bieżący interfejs ją obsługuje;
- użyć domyślnych odbiorców ról Billing Account Administrators i Billing
  Account Users; Project Owners dodać tylko przez dostępną opcję Preview dla
  budżetu jednego projektu;
- utworzyć miesięczny Preview Cloud Run spend cap na `5 PLN` tylko wtedy, gdy
  ta dokładna kontrola jest dostępna dla sandboxu i usługi Cloud Run;
- nie włączać API, nie tworzyć IAM, kont usługowych, sekretów, quota overrides,
  Firebase apps ani Cloud Run i nie zmieniać produkcji.

**Ryzyko i stop condition:** zwykły budżet tylko alarmuje, a Preview spend cap
obejmuje wyłącznie Cloud Run, działa z opóźnieniem i może dopuścić nadwyżkę.
Jeżeli widok budżetów jest niedostępny albo istnieje nakładający się budżet,
operacja zatrzymuje się przed billingiem. Jeżeli po podłączeniu billingu nie da
się utworzyć alertu lub Preview capu, zachować częściowy stan i zgłosić go bez
automatycznego odpinania billingu. Produkcja wymaga późniejszej, oddzielnej
decyzji promocyjnej.

**Decyzja właściciela z 2026-08-01:** zatwierdzić dokładnie `5 PLN` dla
budżetu alertowego całego sandboxu i `5 PLN` dla Preview Cloud Run spend cap.

**Status:** `resolved`; wykonanie jest kompletne, a powtórzone niezależne
closure QA po naprawie dokumentacji zwróciło `pass`. Sandbox jest podłączony do zweryfikowanego
otwartego konta PLN, produkcja pozostaje bez billingu, a sześć odroczonych API
pozostaje wyłączonych. Istnieją dokładnie zatwierdzone miesięczne kontrole:
alert wszystkich usług `5 PLN` oraz Preview Cloud Run spend cap `5 PLN` w
stanie `Configured`, z potwierdzonymi progami/odbiorcami i bez Pub/Sub lub
dodatkowego kanału Monitoring. Szczegóły i źródła:
`docs/reports/launch-003b4-cost-cloudrun-preflight.md`.

## PO-025 — Lokalny Firebase Hosting Emulator przed promocją rynkową

**Pytanie:** czy podczas budowy produktu udostępniać powierzchnię webową pod
zarezerwowanymi adresami `*.web.app`, czy pozostawić ją niedostępną z
publicznego Internetu aż do jawnej promocji rynkowej?

**Decyzja właściciela z 2026-08-01:** żaden publiczny host/provider nie jest
aktywny ani wybrany dla rynku. Nie wolno aktywować domyślnych adresów Firebase,
kanału preview ani innego publicznego hosta podczas prac nad produktem. Realne
strony Task 3 powstaną dopiero w ich właściwym zakresie i przed promocją będą
uruchamiane wyłącznie przez Firebase Hosting Emulator jawnie związany z
`127.0.0.1`. Profesjonalny host i własna domena zostaną wybrane razem w gate
11A.

**Granica autoryzacji:**

- bieżąca zmiana dodaje wyłącznie trwałą politykę repozytorium i jej test; nie
  dodaje konfiguracji Hosting, pustego katalogu publicznego, strony zastępczej,
  skryptu preview/deploy ani publicznego tunelu;
- późniejszy realny artefakt Task 3 może korzystać z lokalnego emulatora i
  lokalnych linków akcji Auth, ale nie może deklarować dowodu publicznego
  callbacku, App Links, Universal Links ani gotowości sklepowej;
- aktywowanie Netlify, Firebase Hosting, App Hosting, Cloud DNS lub proxy przed
  gate 11A, hasło JavaScript i drugi artefakt statyczny są wykluczone;
- wybór jednego profesjonalnego hosta, własnej domeny, kontrola DNS i publiczne
  wdrożenie dokładnie tego samego artefaktu, weryfikacja domeny nadawcy oraz
  publikacja AASA i `assetlinks.json` zgodnych z zamrożonymi tożsamościami są odroczone do
  ostatniej bezpiecznej bramki przed Tasks 12–13. Zainstalowane podpisane link
  drills powstają wewnątrz odpowiednio Tasks 12 i 13; ich brak blokuje Task 14.

Firebase dokumentuje, że emulator Hosting domyślnie odpowiada tylko na
`localhost`, a ustawienie `host: "0.0.0.0"` służy do wystawienia go innym
urządzeniom w sieci lokalnej. Kontrakt Patternly celowo wymaga węższego,
jednoznacznego `127.0.0.1`. Firebase opisuje URL kanału preview jako publiczny,
nawet jeśli jest trudny do odgadnięcia, dlatego preview nie spełnia tej granicy
dostępu.

**Status:** `resolved` dla polityki przedrynkowej. Promocja rynkowa pozostaje
`deferred` do gate 11A przed Tasks 12–13 i wymaga wyboru jednego hosta/domeny,
DNS, publicznego wdrożenia i zależnych konfiguracji. Domyślne adresy `web.app` są
zarezerwowanymi nazwami serwisów; ta decyzja nie nazywa ich prywatnymi ani
aktywnymi i nie dowodzi ich bieżącej zawartości.

**Źródła:**

- [Firebase Hosting Emulator — zachowanie hosta](https://firebase.google.com/docs/emulator-suite/use_hosting)
- [Firebase Hosting — preview i live deployment](https://firebase.google.com/docs/hosting/test-preview-deploy)

## PO-026 — Retencja po zweryfikowanym usunięciu konta

**Pytanie:** jakie granice retencji obowiązują po zweryfikowanym usunięciu
konta bez włączania płatnego mechanizmu odzyskiwania przed potwierdzeniem
potrzeby produktu?

**Decyzja właściciela z 2026-08-01:** zachować bez zmian kanoniczną politykę:

- bieżące dane tożsamości, profilu, nauki i operacji synchronizacji mają `0`
  dni retencji w usłudze live po zweryfikowanym usunięciu;
- na starcie faktyczna retencja backupu wynosi `0` dni, pod warunkiem świeżego,
  odczytowego potwierdzenia, że nie istnieje backup ani harmonogram backupu;
- jeżeli zaszyfrowany backup stanie się później operacyjnie konieczny i otrzyma
  osobną autoryzację, wygasa najpóźniej po 30 dniach;
- usuniętego konta nie wolno odtworzyć do usługi live z backupu, klonu, eksportu,
  stale read ani bazowej jednogodzinnej historii wersji Firestore;
- minimalny proof pozostaje dokładnie 30 dni i zawiera wyłącznie `requestId`,
  `irreversibleAccountIdHash`, `requestedAt`, `completedAt` oraz `resultCode`,
  po czym jest fizycznie usuwany.

**Granica dowodowa:** oba raporty 3B potwierdzają wyłączony PITR, a repozytorium
i zarejestrowane operacje nie konfigurują backupu, TTL ani joba retencyjnego.
Nie jest to jednak pełny dowód z provider-specific listy backupów i
harmonogramów. Wyłączony PITR pozostawia bazową jednogodzinną historię wersji,
więc Patternly nie deklaruje „zero recoverable history”; ta historia pozostaje
niedozwolonym źródłem odtworzenia usuniętego konta.

**Granica kosztu i autoryzacji:** ta decyzja nie zezwala na włączenie PITR,
backupu, TTL, Scheduler/retention joba ani na jakąkolwiek mutację Firebase/GCP.
Start bez backupu nie tworzy kosztu backup/PITR. Przyszły backup, TTL lub job
wymagają osobnego pakietu z odczytowym preflightem, kosztem i autoryzacją.

**Status:** `resolved`; zapis decyzji 3A-1 oraz jego granice kosztowe i dowodowe
przeszły niezależne QA z werdyktem `pass`. Implementacja usuwania, expiry,
provider proof i sandbox deletion drill należą do właściwego zakresu Task 3.

## PO-027 — Projekt kompletnego account lifecycle

**Pytanie:** czy autoryzować derivację jednego kompletnego projektu account
lifecycle z zatwierdzonego kierunku Quiet Layered i warunkowo dopuścić jego
późniejsze oznaczenie jako `APPROVED` bez tworzenia wariantów stylistycznych?

**Decyzja właściciela z 2026-08-01:** autoryzować dokładnie jeden projekt
`account-lifecycle-001`, oparty na `PO-009`, ukończonym shellu Task 2,
kanonicznym kontrakcie Task 1 i `option-3.png`. Autoryzacja obejmuje derivację
oraz warunkową zmianę statusu tego samego artefaktu na `APPROVED` wyłącznie po
spełnieniu wszystkich zapisanych kryteriów akceptacji, pozytywnej inspekcji
kontrolera i werdykcie niezależnego QA `pass`.

**Granica autoryzacji:** kandydat wchodzi do rejestru jako `PENDING` i w tym
stanie nie może spełnić readiness user-facing tasku ani odblokować Task 3. Nie
wolno dodać ownership dla nieistniejącego `src/features/account/`, relabelować
`focus-lab-core-shell-001`, tworzyć drugiego shella, wariantów stylistycznych,
nowej metody tożsamości, stanu lifecycle, runtime UI/backend/routes, treści
prawnych, fake success lub ukrytego fallbacku.

`forgotPassword` i `publicDeleteRequest` zachowują non-enumerating accepted
copy. `register` jawnie zachowuje `duplicateIdentity`, a `signIn` może pokazać
`unverifiedIdentity` wyłącznie po poprawnym credential.

**Dalsze dylematy:** każda przyszła rozbieżność wymagająca nowej preferencji
produktu, zakresu danych, treści prawnej, kierunku wizualnego lub zachowania
poza kanonicznym kontraktem musi zostać przedstawiona właścicielowi do jawnej
decyzji; kontroler nie wybiera jej domyślnie.

**Status:** decyzja o derivacji i warunkowej ścieżce zatwierdzenia jest
`resolved`. Artefakt `account-lifecycle-001` pozostaje `PENDING` do zakończenia
inspekcji kontrolera i niezależnego QA; ten zapis nie deklaruje `APPROVED` ani
`pass`.

**Addendum spójności z Fitaly z 2026-08-01:** właściciel dopuścił lokalny kod
Fitaly wyłącznie jako nieautorytatywne, odczytowe źródło wzorców interakcji.
Patternly przyjmuje trwałe etykiety i helper/inline validation, bezpieczny cel
reveal, autofill/content types, zachowanie keyboard-aware, akcje respektujące
safe area, form-level banner dla zdalnego błędu logowania i jawny blok
destrukcyjny. Odrzuca markę, paletę, ornament, username/Terms, ujawniający
account-existence reset, dokładne copy i backendowe zachowanie Fitaly. Nie
powstaje zależność ani import kodu/copy/tokenów. Korekta nie zmienia warunkowej
autoryzacji: kandydat pozostaje `PENDING`, a każdy nowy dylemat nadal wymaga
jawnej preferencji właściciela.

**Audit finalizacji zatwierdzenia z 2026-08-01:** powyższe zapisy `PENDING`
pozostają prawdziwą historią fazy kandydackiej. Następnie kontroler potwierdził
wszystkie kryteria, a niezależne QA kandydata zwróciło `pass`, spełniając
warunek właściciela. Przejście dokładnie tego samego
`account-lifecycle-001` do `APPROVED` zostało zaimplementowane bez zmiany
artefaktu, treści projektu lub ownership. Inspekcja kontrolera i powtórne
niezależne QA samej finalizacji następnie potwierdziły niezmienność artefaktu,
minimalny zakres, poprawne readiness i brak placeholder ownership; niezależny
werdykt brzmiał dokładnie `pass`. 3A-2 jest zamknięte, a Task 3 może rozpocząć
pierwszy rzeczywisty zakres po aktualizacji planu zależności.

## PO-028 — Autoryzacja sandboxowej implementacji Task 3A

**Pytanie:** czy autoryzować jeden kompletny, produkcyjnie ukształtowany zakres
fundamentu konta w sandboxie wraz z wymaganym lokalnym bootstrapem narzędzi,
ograniczonym IAM, publicznym transportem API zabezpieczonym na poziomie
aplikacji, cleanupem retencji i jawnym ryzykiem kosztowym?

**Decyzja właściciela z 2026-08-01:** zatwierdzić cały pakiet 3A-3 po jego
niezależnym preflight QA `pass`, łącznie z później ujawnionym, lecz opisanym
przed wykonaniem lokalnym bootstrapem:

- instalacją bieżącego Homebrew `gcloud-cli`, interaktywnym logowaniem właściciela
  do `gcloud` i ponownym logowaniem Firebase CLI bez user/developer/local ADC,
  klucza konta usługowego ani wyprowadzania tokenów; biblioteki w Cloud Run
  używają wyłącznie dołączonej tożsamości runtime z metadata service;
- jedną rootless maszyną Podman `patternly-build` przez Apple Hypervisor,
  ograniczoną do 2 CPU, 4,096 MiB pamięci i 20 GiB dysku;
- jedynym zatwierdzonym principalem źródłowym, którego znormalizowany email ma
  SHA-256
  `9163e547f9028fabed8378b6087c0aced9065eadebb2e09fedc6069e06eeeee7`;
- sandboxowym Firebase Web App `patternly-mobile-sandbox`, wymaganymi API,
  Artifact Registry `patternly-api`, lokalnym buildem i digest-pinned Cloud Run
  `patternly-api` w `europe-central2`, `min=0`, `max=1`, timeoutem 360 sekund i
  `--no-invoker-iam-check` bez osobnego `allUsers`;
- dokładnie trzema rozdzielonymi kontami użytkowymi usługi: deployerem,
  runtime i bezrolowym `patternly-scheduler` używanym wyłącznie jako
  weryfikowany podmiot OIDC cleanupu;
- wyliczonymi w planie rolami i krawędziami IAM, w tym tymczasowym
  projektowym `roles/run.admin`, tymczasowym
  `roles/cloudscheduler.admin` i tymczasowym scheduler-SA `actAs`, usuwanymi
  natychmiast po wymaganym dowodzie bootstrapu;
- jednym godzinnym jobem `patternly-deletion-proof-cleanup` z dokładną granicą
  OIDC, retry, timeoutu, kosztu oraz 30-dniowej dostępności proofu;
- jawnym przyjęciem, że alert 5 PLN i Cloud Run Preview spend cap nie są jednym
  twardym limitem całego projektu, darmowe pule są współdzielonymi limitami
  użycia, a Firestore, Cloud Run, Artifact Registry i Scheduler pozostają
  osobno mierzone.

**Granica autoryzacji:** zgoda dotyczy wyłącznie
`patternly-app-sandbox`. Nie obejmuje produkcji, publicznego Firebase Hosting,
preview/live deploy, domeny rynkowej, Cloud Build, Cloud Tasks, Firestore TTL,
PITR/backupu, Secret Managera przy pustym inventory, kluczy kont usługowych,
user/developer/local ADC, zwiększenia zasobów Podmana, drugiego backendu ani obejścia zasad
aplikacyjnej autoryzacji. Każde odstępstwo jest nową decyzją właścicielską.

**Warunek wykonawczy:** przed pierwszą mutacją kontroler musi otrzymać ponowne
preflight QA `pass` dla lokalnego bootstrapu, potwierdzić hash-only tożsamość,
wersje CLI i działanie Podmana. Interaktywna autoryzacja w przeglądarce może
wymagać działania właściciela, ale nie zmienia zatwierdzonego zakresu. Żaden
raport nie może deklarować utworzonych zasobów bez realnego, sanetyzowanego
dowodu providera.

**Status:** `resolved` dla autoryzacji. Implementacja i dowody pozostają
`planned` do zakończenia lokalnego preflightu, workera, kontroli diff/testów i
niezależnego QA `pass`.

**Nowsze zastąpienia z 2026-08-01:** `PO-030` zastępuje wyłącznie niedziałający
mechanizm instalacji caska oficjalnym archiwum Google. `PO-031` zastępuje
wyłącznie lokalny Podman build/push jednym ręcznym Cloud Build bez triggerów i
wymaga czwartej, izolowanej build identity. Pozostałe granice `PO-028` nie
zmieniają się; dokładne nowe API/IAM/bucket/build i usunięcie pustej VM wymagają
osobnego preflight QA `pass` oraz enumerowanej autoryzacji.

## PO-029 — Zakres urządzeń i zakupy przed powrotem właściciela

**Pytanie:** które urządzenia obejmuje launch i jakie zobowiązania finansowe
wolno podejmować podczas czasowej niedostępności właściciela?

**Decyzja właściciela z 2026-08-01:** launch wspiera wyłącznie telefony na iOS
i Androidzie. Tablety nie są wspieraną klasą urządzeń i nie wolno sugerować ich
obsługi w konfiguracji, metadanych ani dowodach. Nie tworzy się osobnego
tabletowego layoutu ani tabletowej gałęzi produktu.

Wszelkie nowe zakupy, płatne rejestracje, subskrypcje i zobowiązania odnowieniowe
czekają na osobną, jawną zgodę właściciela po jego powrocie. Sam upływ podanego
okna niedostępności nie odblokowuje wydatku. Dotyczy to w szczególności kont
deweloperskich sklepów, domeny, rejestratora, profesjonalnego hostingu i
płatnego dostawcy poczty. Nie cofa to wcześniej zapisanej, dokładnej zgody
`PO-028` na ograniczony sandbox ani istniejących limitów kosztowych `PO-024`;
każde rozszerzenie tych zgód pozostaje zabronione.

**Status:** `resolved`. Task 9 ma zamkniętą macierz urządzeń bez tabletów.
Tasks 11–14 i gate 11A mogą być przygotowywane odczytowo, lecz muszą zatrzymać
się przed zakupem, płatną aktywacją albo innym zobowiązaniem do czasu nowej
zgody właściciela.

## PO-030 — Lokalna instalacja Google Cloud CLI po awarii caska

**Pytanie:** czy po trzech identycznych, odwracalnych awariach aktualnego caska
Homebrew wolno użyć oficjalnego, wersjonowanego archiwum Google Cloud CLI dla
macOS ARM64?

**Potwierdzone fakty:** `gcloud-cli` 578.0.0 trzy razy przerwał instalację na
`gcloud config virtualenv create` z błędem `virtualenv: command not found` i za
każdym razem usunął wszystkie własne linki oraz payload. Osobna formuła
Homebrew `virtualenv` 21.7.1 oraz jednorazowy `PYTHONPATH` nie zmieniły wyniku;
nie istnieją równoległe linki ani działająca instalacja caska.

**Decyzja właściciela z 2026-08-01:** zatwierdzić przejście na oficjalne,
wersjonowane archiwum Google sprawdzane opublikowaną sumą SHA-256.

**Granica autoryzacji:** pobrać wyłącznie dokładny artefakt macOS ARM64 ze
źródła Google, porównać SHA-256 przed rozpakowaniem, użyć jednego prywatnego
katalogu narzędzi właściciela, nie zmieniać profilu powłoki i wywoływać
`gcloud` jednoznaczną ścieżką. Nie wolno użyć `sudo`, instalatora pipe-to-shell,
drugiej instalacji, niewersjonowanego artefaktu, innej architektury, lokalnego
ADC ani wyprowadzić danych konta lub tokenów. Zbędna formuła `virtualenv` może
zostać usunięta dopiero po sprawdzeniu działającego oficjalnego CLI.

**Status:** `resolved` i wykonane. Oficjalne archiwum 578.0.0 miało dokładną
opublikowaną sumę SHA-256, działa przez prywatną ścieżkę z dołączonym Pythonem,
a nieudana opcjonalna próba użycia `sudo` została odrzucona jako zbędna. Nie
zmieniono PATH/profilu, nie utworzono ADC i nie wykonano mutacji chmurowej.

## PO-031 — Lokalny Podman czy ręczny Cloud Build

**Pytanie:** jak zbudować kanoniczny obraz Cloud Run po tym, jak lokalny Podman
5.0.3 nie uruchomił używalnej maszyny `patternly-build`?

**Potwierdzone fakty:** Podman nie jest zależnością aplikacji ani runtime'u.
Służył wyłącznie do lokalnego zbudowania i wypchnięcia obrazu, ponieważ
`PO-028` wykluczał Cloud Build. Dokładnie zatwierdzona rootless VM została
utworzona z 2 CPU, 4 GiB RAM i 20 GiB dysku, ale trzy starty nie doprowadziły
do SSH ani działającego API: host wysyłał pakiety do VM, nie otrzymując żadnych
danych, po czym maszyna zatrzymywała się. Hostowy Podman 5.0.3 pochodzi z 2024
roku; bieżąca formuła Homebrew oferuje 6.0.2.

| Opcja | Konsekwencje |
| --- | --- |
| A. Zaktualizować Podmana i odtworzyć pustą VM | Nie dodaje chmurowej usługi budowania, ale utrzymuje ciężką lokalną VM, kolejną instalację/aktualizację narzędzia oraz 20 GiB obrazu; nadal wymaga osobnego lokalnego pushu. |
| B. Ręczny Cloud Build bez triggerów | Usuwa lokalną VM i buduje ten sam Dockerfile w GCP. Wymaga `cloudbuild.googleapis.com`, jawnego build configu, user-specified build identity/logging boundary i dodatkowego IAM; darmowa pula wynosi obecnie 2,500 minut `e2-standard-2` na konto billingowe miesięcznie, potem cena wynosi 0.006 USD/min, a osobne Storage/Logging/Artifact Registry mogą kosztować. |

**Rekomendacja:** B. Dla jednoosobowego, rzadko wdrażanego produktu ręczny
Cloud Build jest lżejszy operacyjnie i bardziej reprodukowalny. Nie tworzyć
triggera ani ciągłego CI; każde wykonanie jest jawne i sanetyzowane. Zachować
digest-pinned deploy. Nie używać domyślnego Compute Engine SA: build musi mieć
jawnie wskazaną minimalną tożsamość i logowanie.

**Decyzja właściciela z 2026-08-01:** B. Zastąpić Podmana ręcznym Cloud Build
bez triggerów.

**Granica autoryzacji:** decyzja zastępuje tylko lokalny build/push z `PO-028`.
Nie autoryzuje jeszcze API, IAM, bucketu, builda ani usunięcia VM. Kontroler
musi najpierw zamknąć dokładny packet kosztów, ról, logów, źródła, digestu,
cleanupu pustej VM i uzyskać niezależne preflight QA `pass`. Każdy trigger,
automatyczny retry, domyślna build identity, source-deploy convenience path lub
drugi build path pozostaje zabroniony.

**Status:** `resolved` dla wyboru. Dokładny replacement packet po dwóch małych
naprawach przeszedł niezależne preflight QA z werdyktem `pass`. Wykonanie czeka
już tylko na enumerowaną autoryzację API/IAM/bucketu/jednego builda oraz
usunięcia pustej VM; nie wolno jej wywnioskować z samego wyboru opcji B.

**Enumerowana autoryzacja właściciela z 2026-08-01:** „Zatwierdzam pakiet Cloud
Build i usunięcie pustej VM”. Zgoda obejmuje wyłącznie dokładny Ninth packet po
naprawach QA: warunkowe API Cloud Build/Storage w sandboxie, jedną izolowaną
build identity, jeden prywatny bucket źródłowy, wymienione tymczasowe IAM, jeden
ręczny build `e2-standard-2` z limitem 15 minut i bez retry/triggera, wdrożenie
po digest, deterministyczną politykę trzech obrazów oraz usunięcie pustej VM
`patternly-build`. Nie obejmuje drugiego buildu, produkcji, domyślnej build
identity, szerszych trwałych ról, log bucketu, source deploy ani usunięcia
hostowej instalacji Podmana.

**Bieżący status wykonania:** autoryzacja jest kompletna. Zgodnie z Eleventh
packet worker musi najpierw dostarczyć realny serwer 3A-3 i testy; cloud mutation
poza usunięciem pustej VM pozostaje zatrzymana do ich kontroli przez kontrolera.

## PO-032 — Transport własnego linku publicznego usunięcia konta

**Pytanie:** czy użyć Resend Free wyłącznie do właścicielskiego sandboxowego
e-maila z odrębnym, jednorazowym linkiem usunięcia konta i jawnie dopuścić
maksymalnie 30 dni danych dostarczenia u tego procesora?

**Potwierdzone fakty:** kanoniczny kontrakt wymaga odrębnego
`publicDeletionPossessionToken`, jednorazowego i ważnego 30 minut, oraz
nieujawniającej istnienia konta odpowiedzi. Firebase udostępnia tylko akcje
resetu hasła, weryfikacji adresu i logowania e-mailem; nie oferuje własnej akcji
usunięcia ani transportu dowolnej wiadomości. Wykorzystanie tokenu
resetu/logowania rozszerzyłoby jego uprawnienia i złamało zatwierdzone
rozdzielenie tokenów.

Resend Free kosztuje obecnie 0 USD miesięcznie, obejmuje 3 000 wiadomości
miesięcznie i 100 dziennie. Testowy `resend.dev` może wysyłać tylko na adres
powiązany z kontem Resend, co pasuje do obecnego owner-only sandboxu bez zakupu
domeny. Resend obsługuje klucz idempotencji i klucze o ograniczeniu do wysyłki.
Jednocześnie dane e-maila są przechowywane przez 30 dni, a metadane, logi i
rekordy API znajdują się w USA niezależnie od regionu wysyłki. Wyłączenie
przechowywania treści wymaga obecnie kwalifikującego się płatnego planu i dodatku
50 USD miesięcznie.

**Rekomendacja kontrolera:** zatwierdzić Resend Free tylko dla sandboxu. Użyć
jednego send-only key przechowywanego jako jedna przypięta numerycznie wersja w
GCP Secret Manager, dostępna wyłącznie dla runtime; nie włączać trackingu,
webhooków, kontaktów ani marketingu. Firebase nadal obsługuje swoje wiadomości
weryfikacji/recovery. Zakup i weryfikacja domeny nadawcy pozostają w gate 11A.
Przed implementacją wprowadzić jawny, wąski kontrakt: zero dni dla żywych danych
konta Patternly/Firebase oraz maksymalnie 30 dni dla danych dostarczenia u
procesora pocztowego; następnie powtórzyć niezależne QA kontraktu.

**Alternatywy odrzucone przez kontrolera, lecz dostępne właścicielowi:** zmienić
kontrakt na token resetu/logowania Firebase i ponowić design/security QA; albo
przenieść zachowanie do Task 7 i pozostawić 3A-3 niekompletne. Amazon SES jest
tani jednostkowo, ale dodaje drugą chmurę, konto/billing i nowe długowieczne
poświadczenie albo osobny projekt federacji między chmurami, co jest
nieproporcjonalne dla właścicielskiego sandboxu i kierunku nauki GCP.

**Granica wymaganej zgody:** utworzenie bezpłatnego konta Resend, jednego klucza
send-only, włączenie Secret Manager API w `patternly-app-sandbox`, utworzenie
jednego sekretu i nadanie runtime wyłącznie dostępu do jego dokładnej wersji;
zaakceptowanie opisanego 30-dniowego/USA przetwarzania i wąskiej zmiany
kontraktu. Zgoda nie obejmuje płatnego planu, domeny, produkcji, publicznego
Hostingu, trackingu, webhooków, marketingu, drugiego providera ani klucza w repo,
buildzie lub logach.

**Decyzja właściciela z 2026-08-01:** „Tak”. Zatwierdzić rekomendowaną opcję
Resend Free dokładnie w opisanej granicy, łącznie z jawnym maksymalnym okresem
30 dni dla danych dostarczenia przechowywanych w USA oraz jednym sekretem GCP
dostępnym wyłącznie dla runtime przez przypiętą numerycznie wersję.

**Status:** `resolved` dla wyboru i wymienionej granicy. Nie utworzono jeszcze
konta, klucza, sekretu, API ani zasobu providera. Wąska zmiana kanonicznego
kontraktu po jednym `fail` i małej naprawie otrzymała powtórny niezależny werdykt
`pass`. Częściowa implementacja deletion/email nadal nie jest uznana za gotową.

## PO-033 — Kontynuacja pracy podczas nocnej niedostępności właściciela

**Decyzja właściciela z 2026-08-01:** wykonywać przez noc wszystko, co da się
bezpiecznie ukończyć, pomijać blokery możliwe do odseparowania i wrócić do nich
rano zamiast zatrzymywać cały strumień pracy.

**Interpretacja kontrolera:** brak interaktywnego konta Resend, klucza, sekretu,
logowania właściciela, zakupu, dostępu produkcyjnego albo nieodwracalnej zgody
blokuje wyłącznie odpowiadającą mu gałąź dowodową. Nadal wykonuje się lokalną
zmianę kontraktu, kod, testy, kontrolę diffu i niezależne QA oraz przygotowuje
się sanetyzowany preflight. Nie wolno użyć zastępczego sekretu, fake-send,
ukrytego fallbacku, drugiego providera ani uznać tasku za zamknięty bez
wymaganego dowodu. Jedyny zatwierdzony Cloud Build nie może zostać zużyty,
dopóki lokalny kod może jeszcze zmienić się po review.

**Status:** `resolved`; jest to reguła wykonawcza, nie rozszerzenie zgody na
koszt, produkcję, publiczny hosting lub operacje nieodwracalne.

## PO-034 — Odporne na awarię dokończenie zdalnego usunięcia konta

**Pytanie na powrót właściciela:** czy rozszerzyć zatwierdzony, jeszcze
nieutworzony job proof-cleanup do jednego joba `patternly-deletion-maintenance`,
który również kończy wcześniej autoryzowane, trwałe operacje usunięcia po
awarii procesu?

**Potwierdzony problem:** Firebase Auth i Firestore nie mają wspólnej transakcji.
Po poprawnym usunięciu identity proces może zakończyć się przed zapisaniem
pięciopolowego proofu, a usunięty użytkownik nie powinien być traktowany jako
zdolny do uwierzytelnionego retry. Zapis proofu przed identity byłby fałszywym
sukcesem. Obecne role runtime wystarczają technicznie, ale `PO-028` celowo
zabrania schedulerowemu route'owi czytać deletion operations i wywoływać
operacje Firebase-user, więc potrzebna jest nowa jawna zgoda.

**Rekomendacja kontrolera:** przed destrukcją zapisywać jedną service-owned
operację z UID, jego nieodwracalnym hashem, czasem, triggerem, etapem i
ograniczonym stanem retry. Ten sam godzinowy job, bez drugiej usługi, kończy
idempotentnie etapy i atomowo zamienia ukończoną operację na dotychczasowy
pięciopolowy proof. Jedno wywołanie obsługuje sprawiedliwie maksymalnie 20
operacji i 2 000 proofów w 20 rundach, z dotychczasowym limitem 240 sekund,
marginesem 10 sekund i `503` dopóki którakolwiek kolejka nie jest pusta.

**Rekomendowane potwierdzenie po stronie telefonu:** wyłącznie dokładny,
provider-bound wynik Firebase `user-not-found` dla wcześniej zweryfikowanego i
zapisanego UID, razem z pasującym lokalnym durable deletion intent. Jest to
dopuszczalne tylko po dowodzie emulator/sandbox, że wynik jest jednoznaczny.
Zwykły błąd logowania, wygaśnięty/revoked token, sieć albo request ID nie są
sukcesem. Jeżeli Firebase nie daje takiego deterministycznego wyniku, potrzebna
będzie osobna decyzja o purpose-bound continuation tokenie; nie powstanie on
automatycznie jako fallback.

**Wpływ kosztowy i IAM:** bez nowej roli, SA, API i bez drugiego joba. Pusty
system dodaje około jednego minimalnego zapytania Firestore na godzinę; realne
usunięcie dodaje kilka zapisów/odczytów i operacji Auth. Koszt nie jest twardo
ograniczony, lecz pozostaje w istniejących limitach wywołania i unika drugiego
joba.

**Status:** `owner-decision-required`. Dokładny Sixteenth packet znajduje się w
planie. Nie utworzono kolekcji, route'u, joba ani cloud mutation; zgodnie z
`PO-033` pozostałe niezależne prace lokalne trwają.

## PO-035 — Osobna kanoniczna akcja zakończenia zwykłej sesji Practice

**Decyzja właściciela z 2026-08-01:** zatwierdzony osobny przycisk zakończenia
sesji, czyli opcja B rekomendowana przez kontrolera.

**Interpretacja kontrolera:** ostatnia odpowiedź jest najpierw zapisywana przez
ten sam trwały `submit_training_outcome` co każda wcześniejsza odpowiedź i może
pokazać kanoniczny feedback. Dopiero osobna, jawna akcja `Finish` wykonuje jeden
kanoniczny terminal command, tworzy i weryfikuje wynik oraz zezwala na przejście
do niego. Nie wolno automatycznie kończyć sesji przy ostatnim submit, utrzymywać
równoległej ścieżki terminalnej ani traktować samej nawigacji jako zakończenia.
Zmiana obejmie razem Algorithms i zwykłe Certification, normatywny kontrakt,
validator/testy oraz sprzeczną dokumentację narracyjną.

**Status:** `implemented`; Task 5B-1 zamknięto po 551/551 pełnych testów,
testach siedmiu granic trwałości dla obu rodzin i powtórnym niezależnym QA
`pass`. Osobny `Finish session` jest jedyną kanoniczną ścieżką utworzenia
wyniku zwykłej sesji Practice; usunięto równoległy writer i fallback zapytania
do wyniku.
