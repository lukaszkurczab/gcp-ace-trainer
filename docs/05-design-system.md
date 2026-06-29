# 05 — Design System

## Status dokumentu

Ten dokument definiuje wspólny design system dla wielotrackowej aplikacji treningowej.

Design system nie może być projektowany wyłącznie pod GCP ACE, quizy ani tryb egzaminacyjny. Musi obsługiwać różne tracki nauki, różne typy itemów treningowych i różne tryby sesji.

Nota kanoniczna 2026-06-29: po decyzji `ADR-005-dark-first-focus-lab-ui.md` docelowy kierunek UI to **dark-first Focus Lab**. Wcześniejsze wzmianki o light-first należy traktować jako historyczny kontekst, nie aktywną wytyczną.

Bazowy model produktu:

```txt
app → track → session mode → training item → attempt → feedback → progress
```

## Cel

Design system ma utrzymać spójność wizualną aplikacji, ograniczyć lokalne style w ekranach i zapewnić wspólny język UI dla:

- tracków certyfikacyjnych, np. GCP ACE,
- tracków problem-solvingowych, np. Algorithms / LeetCode-style,
- różnych trybów sesji, np. Practice, Exam Simulation, Review, Pattern Drill, Strategy Practice, Timed Challenge,
- różnych typów itemów treningowych, np. pytanie jednokrotnego wyboru, analiza strategii, identyfikacja patternu, porównanie rozwiązań.

Aplikacja powinna wyglądać jak spokojne, techniczne narzędzie treningowe. Nie powinna wyglądać jak gra, oficjalna aplikacja Google, kopia LeetCode ani ciężki system e-learningowy.

## Kierunek wizualny

Roboczy kierunek:

> Calm technical training workspace.

Cechy:

- dark-first,
- light-compatible jako późniejszy wariant dostępnościowy lub preferencja,
- minimalistyczny,
- techniczny,
- spokojny,
- mobile-first,
- czytelny w dłuższych sesjach,
- neutralny domenowo,
- wystarczająco elastyczny dla certyfikacji i algorytmów.

## Zasada neutralności tracków

Design system nie może zakładać, że:

- każdy item jest pytaniem egzaminacyjnym,
- każda sesja kończy się wynikiem procentowym,
- każdy błąd oznacza tylko złą odpowiedź,
- każda kategoria to domena egzaminacyjna,
- `Exam Mode` jest najważniejszym miejscem aplikacji.

Nazwy komponentów i tokenów powinny preferować pojęcia neutralne:

```txt
TrainingItem
ItemCard
ChoiceOption
SessionCard
TrackCard
TaxonomyBadge
FeedbackPanel
ProgressInsight
ReviewQueueCard
```

Zamiast nazw zawężających:

```txt
QuestionCard
ExamCard
DomainCard
AnswerOnlyOption
QuizSummaryCard
```

Wyjątek: komponenty specyficzne dla tracka mogą mieć nazwę domenową, jeśli są trzymane w katalogu danego tracka, np. `CloudQuestionCard` albo `AlgorithmPatternCard`.

## Kolory

Docelowa paleta bazowa powinna być dark-first. Poniższe wartości są przykładem semantycznej struktury tokenów, a nie finalną paletą implementacyjną:

```ts
export const colors = {
  background: '#050816',
  surface: '#0D1324',
  surfaceMuted: '#141C2F',
  surfaceRaised: '#182036',

  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#64748B',
  textInverse: '#050816',

  border: '#263247',
  borderStrong: '#3A4A63',

  primary: '#7DD3FC',
  primaryMuted: '#0B344A',
  primaryStrong: '#BAE6FD',

  success: '#6EE7A8',
  successMuted: '#123B2A',

  warning: '#F6B44B',
  warningMuted: '#442B0B',

  error: '#FDA29B',
  errorMuted: '#4A1715',

  info: '#7DD3FC',
  infoMuted: '#0B344A',

  neutral: '#94A3B8',
  neutralMuted: '#334155'
};
```

## Zasady koloru

Kolor powinien komunikować stan, hierarchię lub kontekst. Nie powinien być dekoracją.

- `primary`: główne CTA, aktywny track, aktywny tryb sesji.
- `success`: poprawna odpowiedź, dobrze dobrana strategia, poprawna klasyfikacja patternu, mocny obszar.
- `warning`: częściowo poprawna odpowiedź, niepełna analiza, obszar wymagający utrwalenia.
- `error`: błędna odpowiedź, destrukcyjne akcje, krytyczny błąd.
- `info`: neutralne objaśnienia i wskazówki.
- `neutral`: stan drugorzędny, metadane, pomocnicze badge.
- `muted`: tła i elementy o niskim priorytecie.

Nie używać kolorów Google jako głównego motywu brandingu. Można oznaczać GCP jako temat tracka, ale UI nie powinien wyglądać jak oficjalna aplikacja Google.

Nie używać kolorystyki LeetCode jako podstawy tracka algorytmicznego. Track algorytmiczny ma być częścią tej samej aplikacji, nie osobnym klonem wizualnym.

## Kolory tracków

Tracki mogą mieć delikatne akcenty, ale nie osobne pełne theme'y.

Przykład:

```ts
export const trackAccentColors = {
  cloudCertification: {
    accent: '#2563EB',
    accentMuted: '#DBEAFE'
  },
  algorithms: {
    accent: '#7C3AED',
    accentMuted: '#EDE9FE'
  }
};
```

Zasady:

- akcent tracka może pojawić się w `TrackCard`, aktywnym chipie, ikonografii i wybranych badge'ach,
- komponenty bazowe nadal używają wspólnego systemu kolorów,
- nie tworzyć dwóch osobnych aplikacji wizualnych,
- nie uzależniać czytelności od koloru tracka.

## Typografia

```ts
export const typography = {
  titleLarge: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700'
  },
  titleMedium: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700'
  },
  heading: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600'
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400'
  },
  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400'
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500'
  },
  code: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400'
  }
};
```

## Typografia — zasady

- `titleLarge`: główne tytuły ekranów.
- `titleMedium`: tytuły sekcji i ekranów drugiego poziomu.
- `heading`: tytuły kart, itemów i paneli.
- `body`: podstawowe treści, pytania, opisy problemów.
- `bodySmall`: metadane, opisy pomocnicze, drugorzędne instrukcje.
- `caption`: badge, etykiety, krótkie statusy.
- `code`: krótkie fragmenty kodu, pseudokodu, sygnatur funkcji i złożoności.

Track algorytmiczny może używać `code`, ale MVP nie powinno projektować pełnego edytora kodu jako elementu bazowego design systemu.

## Spacing

```ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48
};
```

## Radii

```ts
export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999
};
```

## Elevation

MVP powinno używać bardzo ograniczonego elevation.

```ts
export const elevation = {
  none: 0,
  subtle: 1,
  raised: 2
};
```

Zasady:

- większość kart używa obramowania i tła, nie cienia,
- elevation tylko dla elementów interaktywnych, sticky paneli albo aktywnych modal bottom sheet,
- nie dodawać cieni na każdym komponencie.

## Komponenty bazowe

Minimalny zestaw:

```txt
Screen
Text
Button
Card
Badge
Chip
Divider
ProgressBar
ProgressRing
TrackCard
SessionModeCard
TrainingItemCard
ChoiceOption
FeedbackPanel
ExplanationBlock
TaxonomyBadge
SessionSummaryCard
ProgressInsightCard
ReviewQueueCard
EmptyState
ErrorState
LoadingState
BottomSheet
```

## Screen

Wspólny wrapper ekranu.

Odpowiada za:

- safe area,
- tło,
- padding,
- scroll behavior,
- podstawową strukturę,
- obsługę sticky footer CTA,
- spójne odstępy między sekcjami.

Warianty:

```txt
default
session
summary
settings
```

`session` może mieć mniej dekoracji i większy nacisk na czytelność itemu.

## Text

Własny komponent tekstu powinien obsługiwać warianty:

```txt
titleLarge
titleMedium
heading
body
bodySmall
caption
muted
code
```

Nie używać bezpośrednio surowego `Text` z React Native w ekranach, jeśli aplikacja ma zachować spójną typografię.

## Button

Warianty:

```txt
primary
secondary
ghost
danger
```

Stany:

```txt
default
pressed
disabled
loading
```

Zasady:

- jeden ekran powinien mieć jedną dominującą akcję `primary`,
- akcje kończące sesję nie powinny walczyć wizualnie z akcją przejścia dalej,
- destrukcyjne akcje, np. reset progresu, zawsze używają `danger`,
- `ghost` tylko dla akcji pomocniczych.

## Card

Warianty:

```txt
default
interactive
muted
selected
success
warning
error
info
```

Karta jest podstawowym kontenerem dla:

- tracka,
- trybu sesji,
- itemu treningowego,
- odpowiedzi lub wyboru strategii,
- wyniku,
- rekomendacji,
- insightu progresu,
- elementu review queue.

## TrackCard

`TrackCard` pokazuje dostępny lub aktywny track.

Powinna zawierać:

- nazwę tracka,
- krótki opis,
- typ tracka, np. `Certification` albo `Problem solving`,
- status progresu,
- rekomendowaną następną akcję.

Przykłady:

```txt
Google Cloud ACE
Certification track · 4 items due
Continue IAM practice
```

```txt
Algorithms
Problem-solving track · 8 patterns started
Practice two pointers
```

## SessionModeCard

`SessionModeCard` reprezentuje sposób pracy w ramach aktywnego tracka.

Przykłady:

```txt
Practice
Short focused session with instant feedback.
```

```txt
Exam Simulation
Timed certification-style session. Feedback after summary.
```

```txt
Pattern Drill
Recognize the right algorithmic pattern before solving.
```

```txt
Strategy Practice
Compare solution approaches and choose the best one.
```

Zasada: nazwa trybu sesji nie powinna sugerować, że wszystkie tracki działają jak egzamin.

## Badge / Chip

`Badge` służy do krótkich oznaczeń statusu i kategorii.

`Chip` służy do wyborów filtrowalnych lub przełączników.

Przykłady badge'y:

```txt
Practice
Exam
Review
Pattern Drill
Needs review
Strong
IAM
Networking
Two pointers
Dynamic programming
O(n log n)
```

Zasady:

- `Badge` nie powinien być głównym nośnikiem informacji,
- nie upychać wielu badge'y w jednej karcie,
- taxonomy badge musi działać dla domen GCP i patternów algorytmicznych.

## TrainingItemCard

`TrainingItemCard` jest neutralnym kontenerem dla itemu treningowego.

Może reprezentować:

- pytanie jednokrotnego wyboru,
- pytanie wielokrotnego wyboru,
- identyfikację patternu,
- wybór strategii,
- porównanie rozwiązań,
- analizę złożoności.

Elementy wspólne:

- tytuł lub prompt,
- treść itemu,
- metadane tracka i taksonomii,
- poziom trudności,
- obszar odpowiedzi,
- feedback po próbie, jeśli tryb na to pozwala.

Nie tworzyć założenia, że każdy item ma dokładnie cztery odpowiedzi A/B/C/D.

## ChoiceOption

`ChoiceOption` obsługuje wybór odpowiedzi, strategii, patternu lub wariantu rozwiązania.

Stany:

```txt
default
selected
correct
incorrect
partiallyCorrect
disabled
```

Zasady dla Practice Mode:

- wybrana błędna odpowiedź: `incorrect`,
- poprawna odpowiedź: `correct`,
- częściowo poprawna odpowiedź lub strategia: `partiallyCorrect`,
- pozostałe: `disabled`.

Zasady dla Exam Simulation:

- przed summary nie pokazywać `correct`, `incorrect` ani `partiallyCorrect`,
- po zakończeniu sesji pokazywać feedback zbiorczy i możliwość wejścia w review.

Zasady dla Algorithms:

- `correct` nie zawsze oznacza jedyną możliwą odpowiedź,
- przy wyborze strategii można pokazać „best fit”, „acceptable”, „suboptimal”,
- feedback powinien wyjaśniać trade-off, nie tylko oznaczać wynik.

## FeedbackPanel

`FeedbackPanel` pokazuje informację po próbie lub po zakończeniu sesji.

Warianty:

```txt
correct
incorrect
partial
strategy
info
```

Powinien zawierać:

- krótki werdykt,
- zwięzłe wyjaśnienie,
- opcjonalny błąd lub pattern,
- link/akcję do review albo kolejnego itemu.

Przykłady:

```txt
Correct
This option matches the least-privilege access pattern for IAM.
```

```txt
Suboptimal strategy
Brute force works conceptually, but this problem is better approached with a hash map to avoid repeated scans.
```

## ExplanationBlock

`ExplanationBlock` służy do dłuższego wyjaśnienia.

Zasady:

- oddzielić werdykt od wyjaśnienia,
- używać krótkich akapitów,
- w Algorithms pokazywać reasoning i trade-off,
- w Certification pokazywać zasadę i dlaczego inne odpowiedzi odpadają,
- nie przeciążać pierwszego ekranu po odpowiedzi.

## ProgressBar / ProgressRing

Używać ostrożnie. Zbyt wiele wskaźników procentowych obniża czytelność.

Dobre użycia:

- postęp sesji,
- evidence level albo practice signal w tracku certyfikacyjnym,
- completion w tracku algorytmicznym,
- accuracy per taxonomy,
- review queue size.

Unikać:

- procentów bez wyjaśnienia,
- jednego globalnego wyniku sugerującego pełną gotowość użytkownika,
- porównywania wyników GCP i Algorithms tą samą metryką bez kontekstu.

## ProgressInsightCard

`ProgressInsightCard` pokazuje pojedynczy wniosek z progresu.

Przykłady:

```txt
IAM needs review
You missed 3 IAM questions in recent sessions.
```

```txt
Pattern recognition improving
You correctly identified two-pointer problems in 4 of 5 recent drills.
```

Zasada: insight powinien prowadzić do działania, np. `Review now`, `Start drill`, `Practice weak area`.

## SessionSummaryCard

`SessionSummaryCard` pokazuje wynik zakończonej sesji.

Wspólne elementy:

- liczba itemów,
- wynik lub status,
- czas,
- mocne obszary,
- obszary do review,
- następna rekomendowana akcja.

Track certyfikacyjny może pokazać:

- score,
- evidence level albo practice signal,
- accuracy by domain,
- missed questions.

Track algorytmiczny może pokazać:

- poprawnie rozpoznane patterny,
- trafność strategii,
- najczęstsze typy błędów,
- complexity awareness.

## ReviewQueueCard

`ReviewQueueCard` pokazuje item lub grupę itemów do powtórki.

Powinna zawierać:

- tytuł itemu lub obszaru,
- track,
- taxonomy badge,
- powód trafienia do review,
- ostatni wynik,
- CTA.

Przykłady powodów:

```txt
Missed recently
Weak pattern
Suboptimal strategy
Low confidence
Due for review
```

## EmptyState

Każdy pusty stan powinien mieć:

- krótki tytuł,
- jednozdaniowe wyjaśnienie,
- jedną akcję.

Przykłady:

```txt
No items to review
Missed or low-confidence items will appear here after your sessions.
Start practice
```

```txt
No algorithm patterns started
Begin with pattern recognition to learn how to choose an approach before coding.
Start pattern drill
```

```txt
No certification progress yet
Start a short practice session to establish your first practice evidence.
Start practice
```

## ErrorState

Błędy powinny być rzeczowe i możliwe do obsłużenia.

Dobre:

```txt
Could not load this session
Check your connection or try again.
Retry
```

Złe:

```txt
Something went wrong :(
```

## LoadingState

Loading nie powinien wyglądać jak zawieszenie aplikacji.

Dobre zastosowania:

- inicjalizacja tracka,
- ładowanie sesji,
- zapisywanie próby,
- generowanie summary lokalnie.

Dla krótkich operacji preferować subtelny stan przycisku `loading`, nie pełnoekranowy loader.

## Motion

Animacje powinny być subtelne.

Dobre:

- delikatne przejście między itemami,
- pojawienie się feedbacku,
- aktualizacja progressu,
- rozwinięcie explanation block,
- zmiana aktywnego tracka.

Unikać:

- konfetti,
- intensywnych animacji,
- długich przejść,
- animacji blokujących czytanie,
- gamifikacji sugerującej zabawę zamiast nauki.

## Ikony

Ikony powinny wspierać skanowanie UI, ale nie zastępować tekstu.

Zasady:

- używać ikon liniowych, prostych i neutralnych,
- każdy ważny element musi mieć etykietę tekstową,
- nie używać logo Google ani ikon sugerujących oficjalny związek z Google,
- nie używać ikon LeetCode ani stylistyki kojarzącej się z konkretną platformą,
- tracki mogą mieć abstrakcyjne ikony, np. chmura dla certyfikacji, graf/pattern dla algorytmów.

## Dark-first theme

MVP jest dark-first zgodnie z `ADR-005-dark-first-focus-lab-ui.md`. Theme powinien nadal zachować semantyczne tokeny, żeby późniejszy light-compatible wariant nie wymagał przebudowy komponentów.

Nie kodować kolorów bezpośrednio w komponentach. Używać tokenów z `src/theme`.

Minimalna paleta dark-first:

```ts
export const darkColors = {
  background: '#020617',
  surface: '#0F172A',
  surfaceMuted: '#1E293B',
  surfaceRaised: '#111827',

  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#64748B',
  textInverse: '#020617',

  border: '#334155',
  borderStrong: '#475569',

  primary: '#60A5FA',
  primaryMuted: '#1E3A8A',
  primaryStrong: '#93C5FD',

  success: '#4ADE80',
  successMuted: '#14532D',

  warning: '#FBBF24',
  warningMuted: '#78350F',

  error: '#F87171',
  errorMuted: '#7F1D1D',

  info: '#22D3EE',
  infoMuted: '#164E63',

  neutral: '#94A3B8',
  neutralMuted: '#334155'
};
```

## Accessibility

Minimalne wymagania:

- tekst podstawowy minimum 16 px,
- elementy dotykowe minimum 44×44,
- kontrast zgodny z czytelnością mobilną,
- status odpowiedzi nie może zależeć wyłącznie od koloru,
- każdy `ChoiceOption` powinien mieć tekstowy status po submit,
- ikony nie mogą być jedynym nośnikiem znaczenia,
- loading i error states muszą mieć tekst.

## Struktura theme w kodzie

Preferowana struktura:

```txt
src/theme/
  colors.ts
  typography.ts
  spacing.ts
  radii.ts
  elevation.ts
  trackAccents.ts
  index.ts
```

Komponenty bazowe:

```txt
src/components/ui/
  Screen.tsx
  Text.tsx
  Button.tsx
  Card.tsx
  Badge.tsx
  Chip.tsx
  Divider.tsx
  ProgressBar.tsx
  ProgressRing.tsx
  EmptyState.tsx
  ErrorState.tsx
  LoadingState.tsx
  BottomSheet.tsx
```

Komponenty produktowe wspólne:

```txt
src/components/training/
  TrackCard.tsx
  SessionModeCard.tsx
  TrainingItemCard.tsx
  ChoiceOption.tsx
  FeedbackPanel.tsx
  ExplanationBlock.tsx
  TaxonomyBadge.tsx
  SessionSummaryCard.tsx
  ProgressInsightCard.tsx
  ReviewQueueCard.tsx
```

Komponenty specyficzne dla tracków:

```txt
src/tracks/cloud-certification/components/
  CloudQuestionMetadata.tsx
  CloudDomainBreakdown.tsx

src/tracks/algorithms/components/
  PatternBadge.tsx
  ComplexityBadge.tsx
  StrategyComparisonBlock.tsx
```

## Zasady projektowania ekranów

- Ekran powinien mieć jeden główny cel.
- Track selection powinien być czytelny, ale nie dominować każdej sesji.
- Aktywny track powinien być widoczny w Home, Practice i Progress.
- Sesja powinna minimalizować rozproszenia.
- Feedback powinien być edukacyjny, nie tylko oceniający.
- Progress powinien prowadzić do kolejnej akcji.
- Settings nie są miejscem naprawiania błędów w głównym flow.

## Antywzorce

Nie robić:

- lokalnych kolorów inline,
- magicznych wartości spacingu,
- wielu stylów przycisków,
- cieni na każdym komponencie,
- UI przypominającego oficjalne materiały Google,
- UI przypominającego LeetCode,
- przypadkowych ikon i ilustracji,
- zbyt agresywnych stanów błędu,
- komponentów bazowych nazwanych wyłącznie pod egzamin,
- `QuestionCard` jako podstawowego komponentu dla całej aplikacji,
- `DomainCard` jako ogólnej karty taksonomii,
- jednego globalnego score dla wszystkich tracków,
- kolorów tracka jako osobnego pełnego theme'u,
- pełnego code editor UI w MVP,
- feedbacku, który mówi tylko „correct/incorrect” bez wartości edukacyjnej.

## Decyzje bazowe

- Design system jest neutralny względem tracków.
- GCP ACE i Algorithms korzystają z tej samej warstwy UI bazowej.
- Różnice tracków są obsługiwane przez akcenty, komponenty domenowe i typy itemów, nie przez osobne aplikacje wizualne.
- `TrainingItemCard` i `ChoiceOption` są bazą dla sesji, nie `QuestionCard` i `AnswerOption`.
- Kolor komunikuje stan lub kontekst; nie służy jako dekoracja.
- MVP jest dark-first Focus Lab; light-compatible może być późniejszym wariantem, ale nie jest kierunkiem kanonicznym.
- Track algorytmiczny w MVP nie wymaga pełnego edytora kodu ani środowiska uruchomieniowego.
