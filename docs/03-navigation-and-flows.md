# 03 — Navigation and Flows

## Cel

Ten dokument opisuje strukturę nawigacji i główne przepływy użytkownika dla wielotrackowej aplikacji treningowej.

Aplikacja nie jest pojedynczym symulatorem egzaminu. Bazowy model UX to:

```txt
app → track → session mode → training item → attempt → feedback/result → progress
```

Nawigacja powinna być płytka, czytelna i zoptymalizowana pod szybkie rozpoczęcie nauki, ale nie może zakładać, że każdy użytkownik ćwiczy ten sam typ materiału.

## Założenia produktowe dla nawigacji

Aplikacja wspiera co najmniej dwa tracki:

1. `Cloud Certification Track` — np. GCP ACE.
2. `Algorithms / LeetCode-style Track` — trening rozpoznawania wzorców, doboru strategii i analizy problemów.

Track nie jest trybem sesji.

Tryb sesji określa sposób pracy w ramach tracka, np.:

- `Practice`,
- `Exam Simulation`,
- `Review`,
- `Pattern Drill`,
- `Strategy Practice`,
- `Timed Challenge`.

## Główne sekcje

Rekomendowany układ MVP:

```txt
Home
Practice
Progress
Settings
```

Nie rekomenduję osobnej głównej zakładki `Exam` w MVP, ponieważ zamyka produkt mentalnie wokół certyfikacji. `Exam Simulation` powinien być trybem dostępnym wewnątrz tracka certyfikacyjnego.

`Review` również nie musi być osobną zakładką. Dla MVP powinien być dostępny jako akcja z:

- `Home`,
- `Progress`,
- `Session Summary`,
- track-specific dashboard.

## Root Navigation

```txt
AppRoot
  └── RootNavigator
        ├── OnboardingStack
        │     ├── Welcome
        │     ├── TrackSelection
        │     └── InitialPreferences
        ├── MainTabs
        │     ├── HomeStack
        │     ├── PracticeStack
        │     ├── ProgressStack
        │     └── SettingsStack
        └── ModalStack
              ├── TrackSwitcherModal
              ├── ItemExplanationModal
              ├── ResetDataConfirmModal
              └── SessionExitConfirmModal
```

## Track Selection Flow

Track selection jest elementem pierwszego uruchomienia i późniejszej zmiany kontekstu.

```txt
Open app first time
  ↓
Welcome
  ↓
Choose primary track
  ├── Cloud Certification
  └── Algorithms
  ↓
Choose goal / default session preference
  ↓
Home for selected track
```

Użytkownik powinien móc później dodać lub zmienić track bez resetowania danych.

```txt
Home
  ↓
Track switcher
  ↓
Choose active track
  ↓
Home updates recommendations and progress context
```

## Home Flow

Home jest ekranem decyzyjnym, nie listą funkcji.

```txt
Open app
  ↓
Home
  ↓
Active track context
  ↓
Recommended action
  ├── Continue session
  ├── Start recommended practice
  ├── Review mistakes
  ├── Open weak area
  └── Switch track
```

Home powinien pokazywać aktywny track wyraźnie, ale nie dominować UI selektorem. Przykład:

```txt
Header
  - Active track: GCP ACE / Algorithms
  - Switch track action

Primary Card
  - Recommended next action
  - Reason for recommendation
  - Primary CTA

Secondary Cards
  - Review queue
  - Weak areas
  - Last session
```

## Practice Flow — wspólny szkielet

`Practice` jest wspólnym wejściem do sesji treningowych, ale konfiguracja zależy od tracka.

```txt
Practice
  ↓
Active track selected
  ↓
Choose session mode
  ↓
Configure session
  ↓
Start session
  ↓
Training item screen
  ↓
Attempt
  ↓
Feedback/result
  ↓
Next item
  ↓
Session summary
```

## Cloud Certification Practice Flow

```txt
Practice Setup
  ↓
Choose domain / all domains
  ↓
Choose number of questions
  ↓
Choose feedback behavior
  ├── immediate feedback
  └── summary-only feedback
  ↓
Start session
  ↓
Question item
  ↓
Select answer
  ↓
Submit
  ↓
Feedback + explanation
  ↓
Next question
  ↓
Session summary
```

## Cloud Certification Exam Simulation Flow

```txt
Practice
  ↓
Cloud Certification Track
  ↓
Exam Simulation
  ↓
Choose exam length
  ↓
Start exam
  ↓
Question item
  ↓
Select answer
  ↓
Next question
  ↓
Submit exam
  ↓
Exam summary
  ↓
Review answers
```

Exam Simulation nie powinien pokazywać poprawności w trakcie sesji. Feedback pojawia się dopiero po zakończeniu.

## Algorithms Pattern Drill Flow

Ten flow nie powinien udawać LeetCode ani wymagać pełnego edytora kodu w MVP. Celem jest trening rozpoznania problemu i wyboru strategii.

```txt
Practice
  ↓
Algorithms Track
  ↓
Pattern Drill
  ↓
Choose topic / all topics
  ├── arrays
  ├── strings
  ├── hash maps
  ├── two pointers
  ├── sliding window
  ├── binary search
  ├── trees
  └── dynamic programming
  ↓
Problem prompt
  ↓
Choose likely pattern / strategy
  ↓
Submit
  ↓
Feedback
  ├── correct strategy
  ├── why this strategy fits
  ├── rejected alternatives
  └── complexity intuition
  ↓
Next problem
  ↓
Session summary
```

## Algorithms Strategy Practice Flow

Ten flow powinien iść krok głębiej niż `Pattern Drill`, ale nadal nie musi być online judge.

```txt
Practice
  ↓
Algorithms Track
  ↓
Strategy Practice
  ↓
Problem prompt
  ↓
User chooses approach
  ↓
User orders solution steps
  ↓
User estimates complexity
  ↓
Submit
  ↓
Feedback
  ├── approach assessment
  ├── step-by-step explanation
  ├── complexity correction
  └── common traps
  ↓
Next problem or summary
```

## Review Flow

Review powinien działać per track i globalnie.

```txt
Review entry point
  ↓
Choose scope
  ├── current track
  └── all tracks
  ↓
Review queue
  ↓
Training item
  ↓
Attempt
  ↓
Feedback
  ↓
Mark as understood / keep for review
  ↓
Next review item
```

Dla GCP review dotyczy przede wszystkim błędnych pytań i słabych domen.

Dla Algorithms review dotyczy przede wszystkim:

- błędnie rozpoznanych wzorców,
- mylonych strategii,
- błędnych estymacji złożoności,
- problemów oznaczonych jako trudne.

## Progress Flow

Progress musi wspierać dwa poziomy:

1. globalny obraz aktywności,
2. szczegółowy progress per track.

```txt
Progress
  ↓
Global overview
  ├── active tracks
  ├── recent sessions
  └── review queue
  ↓
Select track
  ↓
Track progress
  ├── readiness / confidence
  ├── weak areas
  ├── recent sessions
  ├── accuracy / success by category
  └── recommended next session
```

## Cloud Certification Progress

```txt
Track Progress: GCP ACE
  ↓
Overall readiness
  ↓
Domain breakdown
  ↓
Weak domains
  ↓
Recent sessions
  ↓
Tap domain
  ↓
Filtered practice session
```

## Algorithms Progress

```txt
Track Progress: Algorithms
  ↓
Pattern recognition confidence
  ↓
Topic breakdown
  ↓
Weak patterns
  ↓
Complexity estimation accuracy
  ↓
Recent sessions
  ↓
Tap weak pattern
  ↓
Pattern Drill session
```

## Settings Flow

```txt
Settings
  ├── Active tracks
  ├── Session defaults
  ├── Data management
  ├── Content disclaimer
  ├── About
  └── Legal / privacy
```

Settings nie powinny być głównym miejscem wyboru tracka. Track switching jest częścią codziennego flow i powinien być dostępny z Home.

## Ekran Home

Cel:

- szybko skierować użytkownika do następnego działania.

Sekcje:

1. active track,
2. primary recommendation,
3. reason for recommendation,
4. review queue,
5. weak areas,
6. last session,
7. lightweight track switcher.

Przykładowe CTA dla GCP:

- `Start domain practice`,
- `Review mistakes`,
- `Take exam simulation`,
- `Continue session`.

Przykładowe CTA dla Algorithms:

- `Start pattern drill`,
- `Practice weak strategy`,
- `Review missed patterns`,
- `Continue challenge`.

## Ekran Training Item

Nie nazywać tego ekranu wyłącznie `Question Screen` w architekturze UI. `Question Screen` może być wariantem dla tracka certyfikacyjnego.

Struktura wspólna:

```txt
Header
  - progress in session
  - active track
  - mode label
  - optional timer

Item Card
  - prompt
  - optional context/scenario
  - item-specific interaction

Footer
  - submit / next
  - mark for review
```

## Cloud Question Item Screen

```txt
Header
  - progress
  - GCP ACE
  - Practice / Exam Simulation
  - optional timer

Question Card
  - prompt
  - optional scenario
  - answer options

Footer
  - submit / next
  - mark for review
```

Po odpowiedzi w Practice Mode:

```txt
Feedback Card
  - correct / incorrect
  - correct answer
  - explanation
  - why other answers are wrong
  - references, if available
```

## Algorithm Strategy Item Screen

```txt
Header
  - progress
  - Algorithms
  - Pattern Drill / Strategy Practice
  - optional timer

Problem Card
  - prompt
  - constraints
  - examples, if useful

Interaction Area
  - choose pattern
  - choose approach
  - order steps
  - estimate complexity

Footer
  - submit / next
  - mark for review
```

Po odpowiedzi:

```txt
Feedback Card
  - selected strategy assessment
  - recommended strategy
  - why it fits
  - why alternatives are weaker
  - time and space complexity
  - common implementation traps
```

## Ekran Session Summary

Sekcje wspólne:

- result,
- accuracy / success rate,
- weak areas,
- missed items,
- recommendations,
- CTA: review mistakes,
- CTA: start another session.

Dla GCP dodatkowo:

- domain breakdown,
- exam readiness signal,
- missed question categories.

Dla Algorithms dodatkowo:

- pattern breakdown,
- strategy mistakes,
- complexity estimation mistakes,
- recommended drill.

## Ekran Progress

Nie robić z niego statystycznego cockpit'u. Progress powinien wskazywać decyzję.

Najważniejsze pytanie ekranu:

> Co powinienem ćwiczyć teraz?

Sekcje:

- global activity summary,
- track selector,
- readiness / confidence per track,
- weak areas,
- recent sessions,
- review queue,
- recommended next session.

## Empty States

Empty state musi być zależny od tracka.

Przykłady:

```txt
No GCP sessions yet.
Start with a short domain practice session.
```

```txt
No algorithm drills yet.
Start with a pattern recognition session.
```

Nie używać globalnego tekstu sugerującego, że każda aktywność jest egzaminem.

## Zasady UX

### 1. Jedna główna akcja na ekran

Na każdym ekranie powinna być jedna dominująca akcja.

### 2. Track context musi być widoczny

Użytkownik powinien zawsze wiedzieć, czy ćwiczy GCP, Algorithms czy inny przyszły track.

### 3. Nie mieszać tracków w jednej sesji

Jedna sesja należy do jednego tracka i jednego trybu. Globalne rekomendacje mogą porównywać tracki, ale session flow nie powinien przełączać domeny w trakcie.

### 4. Unikać ukrywania feedbacku

Wyjaśnienie odpowiedzi powinno być łatwo dostępne po każdej odpowiedzi w trybach treningowych.

Wyjątek: `Exam Simulation`, gdzie feedback pojawia się po zakończeniu.

### 5. Nie straszyć wynikiem

Komunikaty błędów mają być neutralne i edukacyjne.

Źle:

```txt
You failed this topic.
```

Dobrze:

```txt
This area needs review.
```

### 6. Sesja ma być łatwa do przerwania

Użytkownik mobilny może przerwać naukę. Aplikacja powinna obsłużyć session abandon/continue bez utraty stanu.

### 7. Review musi być blisko błędu

Po zakończeniu sesji użytkownik powinien mieć bezpośrednią akcję do przejrzenia błędnych itemów.

### 8. Nie robić z Algorithms pełnego IDE w MVP

Algorithms track w MVP powinien skupiać się na rozpoznawaniu wzorców, wyborze strategii, analizie złożoności i review. Pełny edytor kodu, test runner i online judge są poza zakresem MVP.

## Antywzorce

Unikać:

- głównej zakładki `Exam` jako centrum aplikacji,
- nazywania całego ekranu `QuestionScreen`, jeśli obsługuje także problemy algorytmiczne,
- Home z tekstami specyficznymi wyłącznie dla GCP,
- Progress liczony wyłącznie po domenach certyfikacyjnych,
- Review zakładającego tylko pytania jednokrotnego wyboru,
- Settings jako jedynego miejsca zmiany tracka,
- kopiowania UX LeetCode z edytorem kodu jako wymaganiem MVP.
