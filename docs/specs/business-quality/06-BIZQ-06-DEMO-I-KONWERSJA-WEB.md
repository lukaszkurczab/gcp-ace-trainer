# BIZQ-06 — demonstracja wartości i przejście do aplikacji

**Priorytet:** P2  
**Główne repo:** `patternly-web`; content dla źródła przykładów; aplikacja dla prawdziwych tras/linków; backend tylko dla już istniejącego zatwierdzonego endpointu  
**Zależności:** BIZQ-01 dla jakości demo; BIZQ-05 dla zakresu twierdzeń; BIZQ-03 tylko dla copy obiecującego adaptacyjny plan  
**Podstawa:** [00 — plan BIZQ](00-PATTERNLY-BIZQ-PLAN-ROBOCZY.md).

## 1. Cel i zakres pewności

A1 opisywał publiczną stronę jako prezentację metody i katalogu, z przykładem SQL i głównymi akcjami prowadzącymi do przykładu/katalogu. Audyt nie potwierdził wyraźnego następnego kroku do aplikacji po wykonaniu zadania.

Przed zmianą sprawdź aktualny `patternly-web`, routing, komponent przykładu, konfigurację dystrybucji i faktycznie istniejące linki. Jeśli CTA zostało już poprawione, zachowaj je i skup się na pozostałej luce. Nie zakładaj na podstawie wcześniejszej odpowiedzi, że aplikacja jest albo nie jest już opublikowana.

**Cel biznesowy:** odwiedzający ma zobaczyć konkretny przykład ćwiczenia odpowiadający jego celowi, poznać wartość objaśnienia i dostać prawdziwy następny krok. Nie chodzi o większą liczbę sekcji, animacji i przymiotników.

Poza zakresem: rebranding, nowa strategia cenowa, redesign całego serwisu, nowy blog/CMS, płatna kampania, nowy mailing provider, sprzedaż webowa, implementacja płatnych trybów jako darmowej aplikacji webowej, publikacja.

## 2. Pierwszy odczyt i ograniczony audyt przepływu

Przejdź lokalnie przez istniejący flow od wejścia do wykonania przykładu i następnej akcji. Zrób screenshoty przed zmianą, jeśli wymagają tego aktualne skille design/QA. Nie traktuj samego przeglądu JSX jako dowodu wyglądu i działania strony.

Sprawdź:

- jakie cele i tracki faktycznie komunikuje strona;
- czy próbka reprezentuje te cele;
- co użytkownik widzi przed submit, po odpowiedzi i po otwarciu Details;
- gdzie prowadzą wszystkie CTA;
- czy link do dystrybucji pochodzi z prawdziwej konfiguracji;
- czy web nie ma ręcznej, starej kopii contentu;
- jakie analityki i zgody już istnieją;
- aktualne tokeny, komponenty, lokalizacje i build/release gates.

Wylistuj znalezione dead links, mylące obietnice i problemy konkretnego flow. Nie wykonuj pełnego nowego audytu całej marki. Przestarzała Figma nie jest źródłem nadrzędnym wobec aktualnego brandu i komponentów.

## 3. Docelowy przebieg

```text
cel odwiedzającego / wybrany obszar
  → jeden odpowiadający mu przykład
  → własna odpowiedź
  → konkretny Reason
  → opcjonalne pełne Details z korektą błędu
  → jasna następna akcja odpowiadająca rzeczywistej dostępności produktu
```

Na ekranie pokazuj jeden przykład naraz, nie trzy długie karty obok siebie. Wykorzystaj obecny mechanizm wyboru tracka/kategorii, jeśli istnieje. Nie dodawaj kolejnego katalogu ponad obecnym katalogiem.

Plan bazowy to maksymalnie trzy starannie dobrane przykłady reprezentujące różne cele: coding, certification i design. Zakres publicznych przykładów ma odpowiadać faktycznemu upoważnieniu do marketingowego preview. Szczególnie Design Interview jest Premium: pełna sesja jest niedozwolona na Free, a publiczny przykład z płatnego banku wymaga jawnie dozwolonego wykorzystania marketingowego. Jeżeli brak takiego upoważnienia, nie rób obejścia; użyj dopuszczonego materiału albo odnotuj granicę tej części demonstracji.

Liczba trzech jest zakresem tego zadania, nie wymaganiem budowania darmowego preview dla każdego z dziewięciu tracków. Nie sugeruj, że jedna próbka certyfikacyjna demonstruje zakres wszystkich egzaminów.

## 4. Wybór i źródło przykładów

### 4.1. Kryteria przykładu

Przykład powinien:

- mieścić się w realnym flow telefonu/przeglądarki bez długiego wprowadzenia;
- wymagać sensownej decyzji, a nie odgadnięcia najdłuższej opcji;
- mieć rozstrzygający warunek widoczny przed odpowiedzią;
- oferować objaśnienie mechanizmu, najbliższej pomyłki i granicy stosowalności;
- działać poprawnie niezależnie od kolejności dozwolonych opcji;
- pochodzić z zatwierdzonego, legalnego źródła objętego BIZQ-01.

Nie wybieraj najbardziej efektownego, ale niejednoznacznego problemu architektonicznego. Nie wybieraj też banalnego quizu tylko dlatego, że daje odwiedzającym wysoki wynik.

### 4.2. Jeden kanoniczny content

W raporcie podaj dla każdego przykładu trackId, itemId, source path, content version i reference do właściwego approval/admission. Przykłady mają pochodzić z kanonicznego ingressu, a web konsumować ograniczony zatwierdzony wycinek przez istniejący build/artifact flow.

Nie kopiuj ręcznie Reason i Details do JSX i nie twórz osobnego banku JSON o tych samych item IDs. Jeśli web nie ma obecnie odpowiedniego wejścia, dodaj najmniejszą build-time projekcję wskazanych przykładów do istniejącego mechanizmu, ze sprawdzeniem identity. To ma chronić konkretnego konsumenta, nie być nowym uniwersalnym publishing systemem.

Nie bundluj całego płatnego banku do strony, jeśli potrzebne są trzy pytania. Nie dodawaj runtime fetch do repo contentowego ani endpointu będącego obejściem aplikacyjnego admission. Zmiana aktywnego źródła ma wymagać ponownej walidacji próbki; brak itemu ma powodować jawny błąd buildu/kontraktu, nie losowy przykład.

Demo jest prezentacją, nie bezpiecznym egzaminem. Dane klienta mogą technicznie zawierać odpowiedź; nie buduj obfuskacji ani backendu anty-cheat, by ukryć ten fakt. W normalnym UI i accessibility props nie ujawniaj odpowiedzi przed submit.

## 5. Zachowanie przykładu

Użyj istniejącego komponentu i współdzielonych czystych funkcji scoring/feedback, jeżeli są dostępne. Jeśli aplikacja nie publikuje takiej biblioteki, nie portuj całego RN runtime do weba. Użyj ograniczonego modelu istniejącej demonstracji i kontrtestu zgodności z rzeczywistym accepted answer/option-ID feedback. Nie twórz drugiego ogólnego silnika nauki.

Stan przykładu obejmuje: nierozwiązane, wybrana odpowiedź, zatwierdzone, feedback oraz opcjonalnie rozwinięte Details. Nie naliczaj publicznej próbce mastery, streaku ani postępu w aplikacji. Nie generuj fałszywej historii użytkownika.

Po submit pokaż od razu Reason. Details pozostają opcjonalne i nie blokują następnej akcji. Dla wybranej błędnej opcji pokazuj właściwy authored feedback po ID. Dla odpowiedzi poprawnej nie opisuj błędu, którego nie było.

Zmiana przykładu czy reset nie może pozostawić feedbacku z poprzedniego pytania. Dozwolona eksploracja innej odpowiedzi jest jawna, nie udaje kolejnego niezależnego zaliczenia.

Każda próbka ma widoczną tożsamość celu/tracka, ale nie zdradza szukanego wzorca przez nagłówek, jeżeli jego rozpoznanie jest częścią zadania. Demo nie jest diagnozą całego tracka.

## 6. Następna akcja — wyłącznie prawdziwa

Zbadaj istniejący mechanizm dystrybucji. Nie wpisuj linku App Store, TestFlight lub waitlisty z pamięci. Weryfikacja celu linku musi dotyczyć konkretnej aplikacji, nie tylko odpowiedzi HTTP 200.

| Faktyczny stan dystrybucji | Poprawna główna akcja po przykładzie |
| --- | --- |
| Aplikacja opublikowana i dostępna w potwierdzonym sklepie/regionie | Link do właściwej strony aplikacji albo istniejący zweryfikowany app link. |
| Dopuszczony publiczny/ograniczony dostęp TestFlight | Jawne przejście do wersji testowej z prawdziwym linkiem i właściwym opisem. |
| Brak dystrybucji, ale istnieje zatwierdzona działająca lista zainteresowanych | Istniejący formularz z prawdziwym endpointem, zgodami i stanami powodzenia/błędu. |
| Brak któregokolwiek z powyższych | Uczciwy stan niedostępnego dostępu do aplikacji; bez fałszywego „Get the app” i bez przycisku udającego działanie. Publiczna bramka konwersji pozostaje otwarta. |

W ostatnim przypadku strona nadal może umożliwiać dalszą eksplorację przykładów, ale nie jest to dowód ukończonego lejka instalacji. Nie zakładaj nowej listy mailingowej ani dostawcy tylko po to, by wszystkie pola DoD były zielone. Implementacja obsługi prawdziwej konfiguracji i jej testów może być gotowa, a dostęp publiczny nadal jawnie blokowany przez brak docelowego kanału.

Przycisk po przykładzie powinien nawiązywać do celu, np. kontynuowanie praktyki w aplikacji, ale nie obiecywać zachowania wyniku, przeniesienia sesji czy automatycznego track selection, jeśli aplikacja tego nie obsługuje. Gdy istnieje deep link do tracka, zweryfikuj jego identity i bramki uprawnień. Nie dodawaj tajnego parametru omijającego paywall.

Link z weba do Design Interview/Coding Mock/Exam nie uruchamia płatnej sesji bez Premium. Powinien przejść przez normalny app routing i istniejącą bramkę.

## 7. Copy i dowody wartości

Zachowaj zatwierdzone elementy marki. Nie zmieniaj całego hero ani sloganu tylko dlatego, że powstał nowy przykład. Popraw wyłącznie copy, które nie odpowiada rzeczywistemu zachowaniu albo ukrywa następny krok.

Akcent ma padać na konkretną wartość: ćwiczenie decyzji, zrozumienie mechanizmu i następna sensowna sesja. Nie zastępuj tego listą ilości pytań. Liczba banków i tracków jest informacją katalogową, nie dowodem skuteczności.

Nie publikuj twierdzeń:

- „adaptive plan to your deadline”, zanim BIZQ-03 faktycznie działa i jest odebrane;
- „covers the full exam”, bez właściwego mappingu i ograniczeń BIZQ-05;
- „proven to improve”, „X% success rate”, opinii, ocen, user counts lub wyników, których nie ma;
- „official exam” lub obietnicy zdania;
- funkcji sync/restore/deep link, których nie sprawdzono.

Wynik przykładu ma mówić o jednej decyzji. Nie pokazuj po poprawnej odpowiedzi „You are ready for the interview”. Treść angielska pozostaje pierwotna, o ile aktualny web tak działa; utrzymaj wszystkie faktycznie obsługiwane locale zgodnie z istniejącym workflow. Nie duplikuj tekstów poza systemem lokalizacji.

## 8. Pomiar bez nowej nieautoryzowanej infrastruktury

Najpierw sprawdź istniejącą analitykę, jej consent i schema. Jeśli jest zatwierdzona, można w jej ramach mierzyć przejścia: rozpoczęcie przykładu, submit, otwarcie Details i kliknięcie docelowej akcji. Nie przesyłaj raw answer, pełnego promptu ani danych identyfikujących osobę bez realnej potrzeby i zatwierdzonego kontraktu.

Jeśli analityki nie ma, nie instaluj automatycznie nowego SDK. Zdefiniuj zdarzenia/mianowniki w raporcie i przetestuj sam flow. Brak pomiaru marketingowego jest odrębny od działania strony; nie produkuj fikcyjnego dashboardu.

Rozróżnij `store link click`, faktyczną instalację, rozpoczęcie aplikacyjnej sesji i zakup. Kliknięcie nie jest instalacją, a instalacja nie jest płacącym klientem. Ewentualny pomiar end-to-end musi wynikać z istniejącego, zatwierdzonego attribution contract.

Nie uruchamiaj kampanii ani eksperymentu na użytkownikach w tym zadaniu. Do oceny późniejszej zmiany przygotuj hipotezę i miarę, nie obiecany uplift.

## 9. Testy i kryteria

| ID | Przypadek | Oczekiwany wynik |
| --- | --- | --- |
| W01 | Wybór celu | Odpowiadający mu przykład, bez trzech długich kart jednocześnie i pomieszanych etykiet. |
| W02 | Poprawna odpowiedź | Właściwy Reason/Details, brak claimu pełnej gotowości. |
| W03 | Każda błędna opcja | Właściwy authored feedback po option ID. |
| W04 | Przed submit | Brak ujawnienia odpowiedzi w normalnym widoku i accessibility props. |
| W05 | Reset/zmiana przykładu | Poprzedni wynik i Details nie przechodzą na nowy item. |
| W06 | Zmiana content version/missing item | Jawna kontrola źródła; brak ręcznego fallbacku do innego pytania. |
| W07 | Build frontend | Tylko zamierzony wycinek contentu, bez całego płatnego banku i sekretów. |
| W08 | CTA do sklepu/TestFlight | Prawdziwa aplikacja i poprawny kanał; nie placeholder/losowy ID. |
| W09 | Brak kanału dystrybucji | Uczciwy stan; nie udający działania przycisk „download”. |
| W10 | Istniejąca waitlista: success/error/retry | Prawdziwy status wyniku; bez pozornego zapisu i niebezpiecznego ponawiania. |
| W11 | Deep link do płatnego trybu | Aplikacja sprawdza Premium przed prepare/resume. |
| W12 | Mobile/desktop, duży tekst, motywy wspierane przez web | Czytelne opcje, Details i CTA, brak przepełnienia oraz zmian layoutu zasłaniających akcję. |
| W13 | Nawigacja klawiaturą i semantyczne props | Poprawne kontrolki/role/focus styles; bez testów VoiceOver. |
| W14 | Consent/analytics niedostępne lub wyłączone | Flow nadal działa; brak nieautoryzowanej transmisji. |
| W15 | Kliknięcie CTA | Nie raportuje automatycznie instalacji/zakupu. |
| W16 | Copy planowania przed odbiorem BIZQ-03 | Brak niepotwierdzonej obietnicy adaptacji pod deadline. |
| W17 | Próbka z płatnej rodziny | Wyłącznie jawnie dozwolone marketingowe preview; brak darmowego pełnego trybu. |
| W18 | Rzeczywisty deploy gate | Zmiany lokalne/push nie są raportowane jako publikacja strony. |

Weryfikuj działanie w istniejącym web toolchainie oraz właściwych viewportach. Obsługa weba nie wymaga dodawania automatyzacji aplikacji Android. Mobilny deep link testuj na uzgodnionym istniejącym iPhonie, bez drugiej instalacji.

## 10. Odbiór i raport

Raport zawiera: screenshoty before/after, mapę flow, source IDs i admission przykładów, macierz dostępności CTA, rzeczywiste link targets, testy, bundle/content boundary oraz listę opublikowanych/nieopublikowanych twierdzeń. Nie publikuj niczego bez osobnej autoryzacji.

Zadanie jest odebrane w pełnym zakresie konwersji dopiero, gdy po przykładzie istnieje rzeczywista zatwierdzona ścieżka dalszego dostępu. Jeśli nie ma kanału dystrybucji, nie udawaj ukończenia: oddziel gotową implementację, lokalny odbiór demo i otwartą zależność kanału publikacji. Brak dystrybucji nie jest powodem do blokowania niezależnej naprawy pytań lub CTA.

Nie wykazuj skuteczności biznesowej samym screenshotem. Nowy flow tworzy możliwość pomiaru; wzrost konwersji wymaga późniejszych realnych danych.

## 11. Prompt wykonawczy dla Codex

```text
Wykonaj BIZQ-06 według tego dokumentu i dokumentu 00. Nie wykonuj rebrandingu,
pełnego redesignu, kampanii ani publikacji. Po preflight i wymaganym briefingu
sprawdź aktualny web flow, źródło demo, CTA, routing i realny kanał dystrybucji.
Nie zakładaj, że luka z audytu A1 nadal istnieje bez jej odtworzenia.

Zbuduj ograniczoną demonstrację dopasowaną do celu odwiedzającego: maksymalnie
trzy zatwierdzone przykłady, jeden widoczny naraz, odpowiedź → Reason →
opcjonalne Details → jedna jasna następna akcja. Content ma pochodzić z
kanonicznego source/build, nie ręcznie skopiowanego banku w JSX. Nie bundluj
całego płatnego katalogu. Zakres preview płatnych rodzin musi być dozwolony.

Każdy przykład ma uczyć decyzji i wyjaśniać mechanizm oraz błąd. Scoring i
feedback zachowują stable option IDs. Brak pełnej diagnozy, readiness score,
fikcyjnego progresu i obietnic niepotwierdzonego adaptacyjnego planowania.

CTA dobierz do prawdziwej konfiguracji: App Store, uprawniony TestFlight lub
istniejąca zatwierdzona waitlista. Nie wymyślaj URL, providerów ani zapisów.
Gdy kanału nie ma, zachowaj uczciwą blokadę tej części odbioru. Deep link nie
obchodzi Premium ani nie udaje przeniesienia sesji, którego app nie wspiera.

Użyj obecnych komponentów, brandu i locale. Analitykę rozszerzaj wyłącznie
w istniejącym zatwierdzonym zakresie, bez danych odpowiedzi. Kliknięcie nie
jest instalacją. Wykonaj W01–W18, screenshots i independent QA, bez VoiceOver
tests oraz bez deploy. Raportuj source IDs, prawdziwe cele CTA, testy,
ograniczenia dystrybucji i rozdziel implementację od wyniku biznesowego.
```
