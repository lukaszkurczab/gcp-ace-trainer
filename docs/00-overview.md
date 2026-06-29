# 00 — Overview

## Status dokumentu

Ten dokument jest punktem wejścia do dokumentacji aplikacji. Nie opisuje wszystkich detali funkcjonalnych ani implementacyjnych. Ustala natomiast model produktu, granice MVP, podstawowe decyzje architektoniczne i zasady, których pozostałe dokumenty powinny się trzymać.

Najważniejsza decyzja zakresowa: aplikacja nie jest już zamknięta na pojedynczy tryb przygotowania do GCP ACE. Produkt należy traktować jako **wielotrackową aplikację treningową** dla technicznej nauki i przygotowania do sprawdzianów umiejętności.

## Jednozdaniowy opis

**Patternly** to niezależna, minimalistyczna aplikacja mobilna do treningu technicznych umiejętności, zaczynająca od dwóch ścieżek: przygotowania do **Google Cloud Associate Cloud Engineer** oraz treningu **algorytmicznego / LeetCode-style**.

Aplikacja skupia się na krótkich sesjach, wyjaśnieniach odpowiedzi, rozpoznawaniu wzorców, review błędów i diagnostyce postępu w obrębie wybranej ścieżki. Nazwa `Patternly` wzmacnia główną ideę produktu: użytkownik ma nie tylko odpowiadać na pytania, ale stopniowo rozpoznawać powtarzalne wzorce, decyzje i typowe błędy.

## Model produktu

Produkt składa się z dwóch poziomów:

```txt
aplikacja
  ↓
track / ścieżka nauki
  ↓
tryb sesji
  ↓
training item
  ↓
attempt / odpowiedź użytkownika
  ↓
feedback, wyjaśnienie, review, progres
```

### Track

`Track` oznacza obszar nauki lub przygotowania.

Na obecnym etapie dokumentacja powinna zakładać co najmniej dwa tracki:

1. **Cloud Certification Track**  
   Przygotowanie do GCP ACE przez pytania, domeny egzaminacyjne, Practice Mode, Exam Mode i review błędów.

2. **Algorithms / LeetCode-style Track**  
   Trening rozwiązywania problemów algorytmicznych przez rozpoznawanie wzorców, dobór strategii, analizę złożoności, review błędów i krótkie zadania problemowe.

### Tryb sesji

`Tryb` nie jest tym samym co `track`.

Przykłady trybów:

- Practice,
- Exam,
- Review,
- Pattern Drill,
- Timed Challenge,
- Weak Areas.

Nie każdy track musi mieć te same tryby. `Exam Mode` ma sens dla przygotowania certyfikacyjnego, ale nie powinien być wymuszany jako główny model dla tracka algorytmicznego.

### Training item

Dokumentacja powinna używać pojęcia `training item` jako ogólnego modelu jednostki nauki.

Dla GCP może to być pytanie jednokrotnego lub wielokrotnego wyboru.

Dla tracka algorytmicznego może to być:

- opis problemu,
- zadanie rozpoznania wzorca,
- wybór optymalnej strategii,
- analiza złożoności,
- porównanie dwóch rozwiązań,
- mini-problem bez pełnego edytora kodu.

Nie należy modelować całej aplikacji tak, jakby każdy element był wyłącznie pytaniem egzaminacyjnym.

## Charakter aplikacji

Aplikacja jest technicznym narzędziem treningowym, nie kursem, platformą społecznościową, oficjalnym symulatorem egzaminu ani pełnym środowiskiem programistycznym.

W MVP aplikacja ma być:

- mobilna,
- szybka,
- lokalna,
- offline-first,
- bez logowania,
- bez backendu,
- oparta o ręcznie kontrolowaną bazę contentu,
- przygotowana architektonicznie na wiele tracków,
- skoncentrowana na nauce przez feedback, wyjaśnienia i review,
- zaprojektowana jako skupione narzędzie treningowe, nie gra,
- wizualnie zgodna z kierunkiem Focus Lab,
- odchudzona informacyjnie: jeden główny cel ekranu, reszta dostępna po wejściu głębiej.

Aplikacja nie jest oficjalnym produktem Google, LeetCode ani żadnej innej platformy. Nie może wizualnie ani komunikacyjnie sugerować afiliacji, autoryzacji, zgodności 1:1 z prawdziwym egzaminem albo dostępu do zastrzeżonych materiałów.

## Nazwa i kierunek marki

Docelowa nazwa aplikacji: **Patternly**.

Patternly jest nazwą parasolową dla całej aplikacji. Tracki mają pozostawać opisowe i neutralne, np. `Cloud Certification` oraz `Algorithms`, bez budowania osobnych mini-brandów.

Kierunek stylistyczny: **Focus Lab**.

Oznacza to, że aplikacja powinna sprawiać wrażenie osobistego laboratorium treningowego:

- dark-first, ale czytelna,
- premium, ale nie dekoracyjna,
- techniczna, ale nie terminalowa,
- skoncentrowana na jednej głównej akcji na ekranie,
- z ograniczoną liczbą kart i metryk na pierwszym widoku,
- oparta o progressive disclosure zamiast ekranów przeładowanych treścią,
- z neonowymi akcentami używanymi oszczędnie do CTA, statusów i postępu.

Patternly nie powinno wyglądać jak katalog kursów, oficjalny symulator egzaminu, klon LeetCode ani pełne IDE.

## Główna obietnica

Aplikacja ma pomóc użytkownikowi odpowiedzieć na cztery pytania:

1. **Co powinienem ćwiczyć teraz?**
2. **Które obszary są moją słabością?**
3. **Dlaczego moja odpowiedź albo strategia była poprawna lub błędna?**
4. **Jaki wzorzec, koncept albo sposób rozwiązania powinienem rozpoznać następnym razem?**

Dla tracka certyfikacyjnego gotowość oznacza wewnętrzną diagnozę opartą na historii sesji, wynikach według domen i jakości odpowiedzi. Nie jest gwarancją zdania egzaminu.

Dla tracka algorytmicznego postęp oznacza poprawę w rozpoznawaniu wzorców, wyborze strategii, analizie złożoności i unikaniu typowych błędów. Nie jest gwarancją rozwiązania dowolnego zadania rekrutacyjnego.

## Core loop

Podstawowa pętla produktu jest wspólna dla wszystkich tracków:

```txt
wybór tracka
  ↓
wybór trybu sesji
  ↓
training item
  ↓
attempt użytkownika
  ↓
feedback albo zapis odpowiedzi
  ↓
wyjaśnienie / strategia / analiza
  ↓
aktualizacja historii i statystyk
  ↓
review błędów i słabych obszarów
  ↓
kolejna rekomendowana sesja
```

Każda funkcja MVP powinna wzmacniać tę pętlę. Funkcje, które jej nie wzmacniają, należy odłożyć.

## Core loop per track

### Cloud Certification Track

```txt
wybór domeny albo Practice Mode
  ↓
pytanie
  ↓
odpowiedź
  ↓
feedback i wyjaśnienie
  ↓
aktualizacja wyniku domeny
  ↓
review błędów
  ↓
diagnoza gotowości
```

Kluczowe elementy:

- domeny egzaminacyjne,
- pytania jednokrotnego lub wielokrotnego wyboru,
- wyjaśnienie poprawnej odpowiedzi,
- wyjaśnienie dystraktorów,
- Practice Mode,
- Exam Mode,
- Review Mode,
- Progress według domen.

### Algorithms / LeetCode-style Track

```txt
wybór wzorca albo typu problemu
  ↓
problem / mini-zadanie
  ↓
rozpoznanie wzorca lub wybór strategii
  ↓
analiza rozwiązania
  ↓
złożoność czasowa i pamięciowa
  ↓
typowe pułapki
  ↓
review błędnie rozpoznanych wzorców
  ↓
progres według kategorii problemów
```

Kluczowe elementy:

- wzorce rozwiązań, np. two pointers, sliding window, binary search, DFS/BFS, dynamic programming,
- dobór struktury danych,
- wybór strategii rozwiązania,
- analiza złożoności,
- porównanie rozwiązań naiwnych i optymalnych,
- review błędów koncepcyjnych,
- progres według kategorii problemów.

Pełny edytor kodu, uruchamianie testów i judge online nie są wymagane w MVP. Pierwsza wersja tracka algorytmicznego może być strategy-first, czyli skupiona na rozpoznawaniu problemu i wyborze rozwiązania, a nie na pisaniu kompletnego kodu na telefonie.

## Zakres MVP

MVP obejmuje:

- ekran wyboru tracka albo Home obsługujący wiele tracków,
- wspólny shell aplikacji,
- lokalną bibliotekę contentu per track,
- generyczny model sesji i odpowiedzi,
- lokalny zapis sesji,
- lokalny zapis attemptów,
- podstawowe statystyki per track,
- Review Mode dla błędów i elementów oznaczonych do powtórki,
- Progress jako prostą diagnostykę,
- ustawienia minimalne, w tym reset danych i informacje prawne.

Dla **Cloud Certification Track** MVP obejmuje:

- domeny egzaminacyjne i tagi tematyczne,
- Practice Mode z natychmiastowym feedbackiem,
- Exam Mode z wynikiem po zakończeniu sesji,
- diagnostykę domen.

Dla **Algorithms / LeetCode-style Track** MVP obejmuje:

- kategorie problemów i wzorce rozwiązań,
- krótkie zadania problemowe,
- wybór strategii albo wzorca,
- wyjaśnienie rozwiązania,
- analizę złożoności,
- review błędnie rozpoznanych wzorców.

## Poza zakresem MVP

MVP nie obejmuje:

- kont użytkownika,
- logowania,
- synchronizacji między urządzeniami,
- backendu,
- Firebase Auth,
- Firestore,
- płatności,
- panelu admina,
- społeczności,
- rankingów,
- achievementów,
- pełnego edytora kodu,
- judge online,
- importu pytań lub problemów przez UI,
- oficjalnej symulacji egzaminu 1:1,
- generowania contentu przez AI bez ręcznej kontroli jakości,
- używania prawdziwych pytań egzaminacyjnych,
- kopiowania zastrzeżonych treści z platform takich jak LeetCode.

## Główne powierzchnie aplikacji

```txt
Home
Track Selector
Practice / Drill
Exam / Challenge
Review
Progress
Settings
```

Rola powierzchni:

- **Home** — szybki start, ostatni track, skrót aktualnego stanu nauki.
- **Track Selector** — wybór ścieżki: Cloud Certification albo Algorithms.
- **Practice / Drill** — główny tryb nauki z feedbackiem.
- **Exam / Challenge** — tryb sprawdzający, zależny od tracka.
- **Review** — powrót do błędów, słabych obszarów i oznaczonych elementów.
- **Progress** — diagnoza postępu per track, domena, tag albo wzorzec.
- **Settings** — minimalna konfiguracja, reset danych, informacje prawne i źródłowe.

Nawigacja nie powinna być projektowana wyłącznie pod egzamin GCP. Ekrany powinny działać jako wspólna rama dla różnych tracków, z track-specific wariantami tam, gdzie jest to konieczne.

## Fundamentalna decyzja techniczna

MVP powinno być maksymalnie proste technicznie, ale nie jednotrackowe:

```txt
Expo / React Native / TypeScript
        ↓
wspólny app shell
        ↓
track registry
        ↓
lokalne dane contentu per track
        ↓
lokalna historia sesji
        ↓
lokalne statystyki per track
```

Backend i synchronizacja są potencjalnym etapem późniejszym. Nie są fundamentem MVP.

Architektura powinna zakładać wiele tracków od początku, ale bez budowania ciężkiego plugin systemu. Wystarczy prosty `track registry`, spójne typy danych i separacja contentu per track.

## Zasady contentowe i prawne

Content powinien być tworzony lub redagowany jako niezależny materiał edukacyjny.

Aplikacja nie powinna:

- sugerować dostępu do prawdziwych pytań egzaminacyjnych,
- kopiować materiałów chronionych prawem autorskim,
- kopiować treści problemów z LeetCode lub innych platform,
- używać znaków, kolorów lub układów sugerujących oficjalny produkt Google,
- sugerować afiliacji z LeetCode,
- obiecywać zdania egzaminu,
- obiecywać sukcesu w rekrutacji,
- przedstawiać wyniku jako oficjalnej predykcji.

Bezpieczne pozycjonowanie:

```txt
independent study tool
technical practice trainer
cloud certification practice
algorithmic problem-solving trainer
readiness helper
mistake review tool
pattern recognition practice
```

Niebezpieczne pozycjonowanie:

```txt
official exam simulator
real exam questions
guaranteed pass
Google-certified trainer
exact ACE exam replica
LeetCode clone
official LeetCode trainer
copied interview questions
```

## Nie negocjować na starcie

Nie należy rozbudowywać aplikacji o funkcje, które zwiększają złożoność, ale nie poprawiają jakości treningu.

Do odłożenia:

- profile użytkowników,
- logowanie,
- cloud backup,
- social features,
- rankingi,
- achievementy,
- publiczna baza pytań,
- AI tutor,
- plan nauki oparty o kalendarz,
- rozbudowane onboarding flows,
- zaawansowane wykresy przed stabilnym core loopem,
- pełny edytor kodu,
- runtime do wykonywania kodu,
- integracje z zewnętrznymi platformami.

Równie ważne: nie wolno zamykać modelu danych, nawigacji ani copy wyłącznie pod GCP. Nawet jeżeli pierwszy dopracowany content powstanie dla GCP, dokumentacja i architektura muszą zakładać drugi track.

## Docelowy charakter

Aplikacja powinna być bardziej podobna do narzędzia treningowego niż do kursu.

Dobry kierunek:

```txt
krótkie sesje
jasne zadania
czytelny feedback
obowiązkowe wyjaśnienia
review błędów
progres według domen, tagów i wzorców
spokojny UI
lokalne działanie
track-specific content
wspólna rama aplikacji
```

Zły kierunek:

```txt
dużo ekranów
nadmiar metryk
gamingowy interfejs
logowanie na starcie
ciężka infrastruktura
niekontrolowana baza contentu
komunikacja jak oficjalny produkt Google
komunikacja jak oficjalny produkt LeetCode
data model oparty wyłącznie o exam questions
nawigacja oparta wyłącznie o GCP domains
```

## Relacja do pozostałych dokumentów

Ten dokument ustala ramy. Szczegóły są rozwijane w kolejnych plikach:

- `01-product-definition.md` — problem, persony, tracki, zakres funkcjonalny i kryteria sukcesu,
- `02-architecture.md` — stack, warstwy, track registry, struktura katalogów i zasady implementacyjne,
- `03-navigation-and-flows.md` — nawigacja, wybór tracka i przepływy ekranów,
- `04-data-model.md` — model tracków, training itemów, sesji, attemptów i postępu,
- `05-design-system.md` — komponenty, typografia, kolory i layout,
- `06-branding-and-style-direction.md` — pozycjonowanie, ton komunikacji i kierunek stylistyczny bez zamykania się na GCP,
- `07-content-guidelines.md` — zasady tworzenia pytań, problemów, wyjaśnień i analiz rozwiązań,
- `08-storage-and-offline.md` — lokalny zapis, offline i migracje,
- `09-security-and-privacy.md` — prywatność, legal, permissions i content integrity,
- `10-roadmap.md` — kolejność prac dla tracków,
- `11-implementation-guidelines.md` — standardy kodu i separacja track-specific logiki,
- `12-testing-strategy.md` — testy i manual QA dla wielu tracków,
- `13-risk-register.md` — główne ryzyka i mitigacje.

## Decyzje bazowe

Na potrzeby MVP przyjmujemy:

- nazwa produktu: Patternly,
- aplikacja mobile-first,
- Expo / React Native / TypeScript,
- brak backendu,
- brak logowania,
- lokalny storage,
- ręcznie kontrolowany content,
- produkt wielotrackowy od poziomu dokumentacji,
- Cloud Certification Track jako pierwszy track certyfikacyjny,
- Algorithms / LeetCode-style Track jako drugi track treningowy,
- Practice i Review jako wspólne wzorce sesji,
- Exam jako tryb specyficzny głównie dla certyfikacji,
- Pattern Drill / Strategy Practice jako tryb specyficzny dla algorytmów,
- Progress jako prosta diagnostyka per track,
- branding niezależny od Google i LeetCode,
- kierunek stylistyczny: Focus Lab,
- dark-first UI z ograniczonymi neonowymi akcentami,
- redukcja gęstości informacji jako zasada projektowa,
- prostota ważniejsza niż rozbudowana infrastruktura,
- generyczny model `track → training item → attempt → feedback → progress` zamiast modelu zamkniętego na pytania egzaminacyjne.
