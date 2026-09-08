# ODK-E2E-036 — onboarding celu dla gościa

Status: VERIFIED

## Cel

Gość z wybranym trackiem i bez celu widzi na Home krótkie zaproszenie do ustawienia celu. Może je pominąć. Nadal może od razu rozpocząć naukę.

## Miejsce

Zaproszenie znajduje się pod główną kartą działania na Home. Nie zastępuje karty „Start learning”. Nie jest modalem i nie blokuje innych akcji.

Gdy zaproszenie jest widoczne, zastępuje ogólny blok „Your learning starts here”. Nie pokazujemy dwóch podobnych kart obok siebie.

## Warunek pokazania

Pokaż zaproszenie tylko wtedy, gdy:

- stan konta to `guest`;
- aktywny track jest wybrany;
- ten track nie ma zapisanego celu;
- gość nie pominął zaproszenia dla tego tracka.

Pominięcie jest lokalne i zapisane per `trackId`. Klucz należy do repozytorium preferencji onboardingu. Nie trafia do rekordu celu.

To preferencja urządzenia. Nie jest synchronizowana. Przetrwa czyszczenie danych nauki i usunięcie konta tak samo jak ustawienia urządzenia. Użytkownik nadal ma stałe wejścia do celu w Progress i Settings.

## Układ

Użyj istniejącej karty i tokenów Home.

1. Ikona celu.
2. Tytuł w jednym lub dwóch wierszach.
3. Krótki opis z nazwą tracka.
4. Główne CTA na pełną szerokość.
5. Drugie CTA jako spokojna akcja tekstowa.

Przy dużym tekście akcje układają się pionowo. Nazwa tracka może zawijać się bez obcinania. Hitbox każdej akcji ma co najmniej 44 punkty.

## Copy

### English

- Title: `Set a goal for this track`
- Body: `Choose when and why you want to practise {{trackName}}.`
- Primary: `Set a goal`
- Secondary: `Not now`

### Polski

- Tytuł: `Ustaw cel dla tej ścieżki`
- Opis: `Wybierz, kiedy i po co chcesz ćwiczyć: {{trackName}}.`
- Główna akcja: `Ustaw cel`
- Druga akcja: `Nie teraz`

Tekst nie obiecuje planu. Plan pozostaje zależny od zablokowanego `ODK-E2E-026`.

## Zachowanie

### Ustaw cel

Otwórz wspólny `GoalCadenceScreen` z nowym `returnTo: home` i aktywnym `trackId`. Nagłówek pokazuje kontekst Home. Back oraz zapis wracają do zakładki Home. Po powrocie Home ponownie odczytuje cel. Gdy cel istnieje, karta znika.

### Nie teraz

Zapisz pominięcie dla aktywnego tracka. Usuń kartę od razu. Główna karta nauki nie zmienia się. Użytkownik nadal może ustawić cel w Progress lub Settings.

### Zmiana tracka

Pominięcie jednego tracka nie ukrywa zaproszenia dla innego tracka. Po powrocie do wcześniej pominiętego tracka karta nadal jest ukryta.

### Błąd odczytu lub zapisu

Nie blokuj Home. Przy błędzie odczytu nie pokazuj zaproszenia. Przy błędzie zapisu pozostaw kartę i pokaż krótki błąd pod akcjami.

Karta nie zmienia dostępności głównej sesji. Jeśli istniejący runtime oznaczy sesję jako niedostępną, onboarding nie ukrywa ani nie zastępuje tego stanu.

## Selektory

- `patternly:home:guest-goal-onboarding:root`
- `patternly:home:guest-goal-onboarding:set-goal`
- `patternly:home:guest-goal-onboarding:not-now`
- `patternly:home:guest-goal-onboarding:error`

## Kryteria ODK-E2E-037

- gość bez celu widzi kartę i aktywną kartę „Start learning”;
- „Set a goal” otwiera cel dla właściwego tracka;
- po zapisaniu celu karta znika;
- „Not now” ukrywa kartę po ponownym uruchomieniu;
- pominięcie działa osobno dla dwóch tracków;
- zalogowany użytkownik nie widzi tej karty;
- duży tekst i długa nazwa nie nachodzą na akcje;
- EN i PL pokazują pełne copy.

VoiceOver jest poza zakresem zgodnie z decyzją właściciela.

## Walidacja briefu

Niezależny `gpt-5.6-luna / max`, bez narzędzi:

- zgodność celu i architektury: 0,96;
- prostota: 0,94;
- kontrola ryzyka: 0,92;
- utrzymywalność: 0,93;
- minimum: 0,92;
- werdykt: APPROVE.
