# 15 — Certification Track Learning System

## Status dokumentu

Ten dokument projektuje system nauki dla **ścieżek certyfikacyjnych** w Patternly.

Dokument doprecyzowuje wcześniejsze decyzje z:

- `00-overview.md`,
- `01-product-definition.md`,
- `03-navigation-and-flows.md`,
- `04-data-model.md`,
- `07-content-guidelines.md`,
- `14-learning-effectiveness-model.md`.

Zakres dokumentu jest celowo ograniczony do certyfikacji technicznych, np. Google Cloud Associate Cloud Engineer-style learning. Track `Algorithms / LeetCode-style` powinien mieć osobny system, ponieważ uczy innego typu kompetencji: rozpoznawania wzorców algorytmicznych, doboru strategii, analizy złożoności i porównywania rozwiązań. Nie należy mieszać tych modeli na poziomie dydaktycznym, nawet jeżeli korzystają ze wspólnego `TrainingItem`, `Attempt`, `Session` i `Progress`.

## Decyzja nadrzędna

Ścieżka certyfikacyjna w Patternly nie jest bankiem pytań ani symulatorem egzaminu.

Jest to **adaptive certification practice system**, którego celem jest doprowadzenie użytkownika do lepszego rozumienia:

- usług,
- pojęć,
- zasad decyzyjnych,
- konfiguracji,
- scenariuszy operacyjnych,
- typowych dystraktorów,
- błędnych intuicji,
- ograniczeń i trade-offów.

Certyfikacja wymaga innego modelu niż LeetCode-like learning. W certyfikacji najważniejsze jest:

```txt
rozumienie domeny
  ↓
rozpoznanie scenariusza
  ↓
dobór właściwej usługi / konfiguracji / zasady
  ↓
eliminacja dystraktorów
  ↓
uzasadnienie decyzji
  ↓
utrwalenie słabych pojęć i błędnych intuicji
```

W LeetCode-like tracku rdzeniem będzie raczej:

```txt
rozpoznanie patternu
  ↓
dobór strategii rozwiązania
  ↓
analiza złożoności
  ↓
porównanie podejść
  ↓
częściowa lub pełna implementacja
```

Dlatego ten dokument nie projektuje systemu algorytmicznego.

---

# 1. Jak dzielimy materiał

## 1.1. Problem z prostym podziałem po usługach

Nie należy dzielić materiału certyfikacyjnego wyłącznie według usług, np. tylko:

```txt
IAM
Compute Engine
Cloud Storage
VPC
Cloud SQL
Monitoring
```

Taki podział jest prosty, ale edukacyjnie za słaby. Egzaminy certyfikacyjne zwykle sprawdzają nie tylko znajomość usług, ale decyzje w scenariuszu. Jedna usługa może występować w wielu domenach, a jeden scenariusz może wymagać rozumienia kilku usług naraz.

Przykład:

```txt
Temat: IAM
Może dotyczyć:
- security,
- least privilege,
- service accounts,
- troubleshooting access,
- deployment,
- auditability,
- organization policy.
```

Dlatego materiał musi być dzielony wielowymiarowo.

## 1.2. Docelowa struktura materiału

Dla tracków certyfikacyjnych używamy pięciu poziomów:

```txt
Certification Track
  ↓
Exam Domain
  ↓
Competency Area
  ↓
Topic
  ↓
Skill Atom
```

Dodatkowo każdy `Skill Atom` może być powiązany z:

```txt
Service / Product
Decision Rule
Scenario Pattern
Mistake Type
Difficulty
Exam Relevance
Prerequisites
```

## 1.3. Certification Track

`Certification Track` to pełna ścieżka przygotowania do jednej certyfikacji lub certyfikacyjnego zakresu.

Przykłady:

- `gcp-ace`,
- `aws-cloud-practitioner`,
- `azure-fundamentals`,
- `kubernetes-administrator`.

W MVP można zacząć od jednego aktywnego tracka, np. `gcp-ace`, ale model nie może być nazwany ani zbudowany jako `GcpQuestion` albo `AceQuiz`.

```ts
type CertificationTrack = Track & {
  category: 'cloud_certification' | 'technical_certification';
  provider?: 'google_cloud' | 'aws' | 'azure' | 'kubernetes' | 'other';
  certificationCode?: string;
  examGuideVersion?: string;
  contentVersion: ContentVersion;
};
```

## 1.4. Exam Domain

`Exam Domain` to najwyższy poziom zgodny z publicznym zakresem certyfikacji.

Przykład semantyczny:

```txt
Domain: Security and access
Domain: Compute and deployment
Domain: Networking
Domain: Data and storage
Domain: Operations and monitoring
```

Nie należy hardkodować domen globalnie. Domeny są częścią wersjonowanego content packa danego tracka.

```ts
type ExamDomainNode = TaxonomyNode & {
  axisId: 'exam_domain';
  examWeight?: number;
  sourceRef?: string;
};
```

## 1.5. Competency Area

`Competency Area` to praktyczna zdolność użytkownika w obrębie domeny. To poziom ważniejszy dydaktycznie niż sama nazwa usługi.

Przykłady:

```txt
Access control decisions
Service account usage
Network connectivity diagnosis
Storage class selection
Managed compute selection
Deployment configuration
Monitoring and alerting interpretation
Cost-aware service choice
```

Ten poziom powinien być podstawą dla ekranu `Performance by topic`, bo lepiej oddaje realną kompetencję niż lista usług.

Przykład:

```txt
Złe:
- IAM: 71%

Lepsze:
- Least privilege decisions: 64%
- Service account access patterns: 82%
- IAM troubleshooting: 48%
```

## 1.6. Topic

`Topic` to bardziej konkretna grupa materiału widoczna dla użytkownika jako obszar ćwiczeń.

Przykłady:

```txt
IAM policies
Service accounts
Predefined vs custom roles
VPC firewall rules
Private access
Storage classes
Cloud SQL backups
Managed instance groups
Logging and metrics
```

Topic może być używany jako `Active focus`, ale nie powinien być mylony z `Track`.

Rekomendowane nazewnictwo UI:

```txt
Track: Google Cloud ACE
Active focus: IAM policies
```

Nie:

```txt
Active track: IAM policies
```

Jeżeli w UI używamy skrótu `Active track`, to powinien oznaczać certyfikację, nie aktualny temat. Dla tematu lepsze etykiety to `Active focus`, `Current focus`, `Practice focus` albo po prostu nazwa sekcji na Home.

## 1.7. Skill Atom

`Skill Atom` to najmniejszy sensowny element kompetencji, który można sprawdzić i utrwalić.

Skill Atom nie musi być widoczny jako osobny ekran. Jest jednostką projektowania contentu, scoringu i rekomendacji.

Przykłady:

```txt
Rozpoznać, kiedy użyć predefined role zamiast project Owner.
Rozpoznać, że service account jest używany przez aplikację, nie przez człowieka.
Wybrać regionalny zasób, gdy wymaganie dotyczy wysokiej dostępności w regionie.
Odróżnić firewall issue od IAM issue w scenariuszu dostępu do API.
Wybrać storage class na podstawie access pattern i cost constraint.
```

Każdy `TrainingItem` powinien sprawdzać 1 główny `Skill Atom` i maksymalnie 1–2 pomocnicze. Jeśli pytanie sprawdza zbyt wiele rzeczy naraz, feedback będzie nieczytelny, a scoring diagnostycznie słaby.

```ts
type CertificationSkillAtom = {
  id: string;
  trackId: TrackId;
  domainRef: TaxonomyRef;
  competencyRef: TaxonomyRef;
  topicRef: TaxonomyRef;
  label: string;
  description: string;
  primaryDecisionRuleId?: string;
  prerequisiteSkillAtomIds?: string[];
  relatedServiceIds?: string[];
  commonMistakeTypeIds?: string[];
  examRelevance: 'low' | 'medium' | 'high';
  expectedCognitiveLoad: 'low' | 'medium' | 'high';
};
```

---

# 2. Osie taksonomii dla certyfikacji

## 2.1. Wymagane osie

Track certyfikacyjny powinien mieć co najmniej te osie:

```txt
exam_domain       — zgodność z zakresem certyfikacji
competency_area   — praktyczna zdolność użytkownika
topic             — widoczny obszar nauki
service           — usługa, produkt, narzędzie lub komponent
concept           — pojęcie techniczne
decision_rule     — reguła wyboru w scenariuszu
scenario_pattern  — typowy wzorzec pytania / sytuacji
mistake_type      — rodzaj błędu użytkownika
difficulty        — trudność itemu
```

## 2.2. Primary axis dla progresu

Dla tracków certyfikacyjnych `primaryAxis` nie powinien być zawsze `exam_domain`.

Rekomendacja:

```txt
primaryAxis: competency_area
secondaryAxes:
  - exam_domain
  - topic
  - service
  - decision_rule
  - mistake_type
```

Powód: użytkownik potrzebuje wiedzieć, co realnie umie lub czego nie umie. Domena egzaminacyjna jest zbyt szeroka, a usługa zbyt techniczna. `Competency Area` jest najlepszym poziomem dla decyzji: „co ćwiczyć dalej?”.

## 2.3. Widoczność osi w UI

Nie wszystkie osie powinny być widoczne użytkownikowi naraz.

| Oś | Widoczna w UI | Główne użycie |
|---|---:|---|
| `competency_area` | Tak | Progress, topic detail, rekomendacje |
| `topic` | Tak | Wybór focus area, topic details |
| `exam_domain` | Tak, ale drugorzędnie | Mapowanie do zakresu certyfikacji |
| `service` | Tak, w detalach | Wyjaśnienia, filtrowanie |
| `decision_rule` | Częściowo | Feedback, weak areas |
| `scenario_pattern` | Częściowo | Mixed practice, explanation |
| `mistake_type` | Tak, w insightach | Review, diagnostics |
| `difficulty` | Tak | Filtrowanie, sesje |

---

# 3. Typy jednostek contentu

Track certyfikacyjny nie powinien składać się wyłącznie z pytań wielokrotnego wyboru. Potrzebuje kilku typów itemów, które odpowiadają różnym mechanizmom nauki.

## 3.1. Concept Check

Cel: sprawdzenie podstawowego rozumienia pojęcia.

Przykład:

```txt
Which statement best describes the purpose of a service account?
```

Użycie:

- pierwszy kontakt z tematem,
- powtórka po czasie,
- naprawa podstawowego błędu koncepcyjnego.

## 3.2. Decision Scenario

Cel: wybór usługi, konfiguracji lub zasady na podstawie scenariusza.

Przykład:

```txt
A backend application needs read-only access to a single storage bucket. Which access pattern follows least privilege?
```

Użycie:

- główny typ praktyki certyfikacyjnej,
- najlepszy nośnik active recall,
- źródło danych o słabych regułach decyzyjnych.

## 3.3. Distractor Elimination

Cel: nauczyć użytkownika odrzucać technicznie brzmiące, ale błędne odpowiedzi.

Przykład zadania:

```txt
Select the option that looks plausible but violates least privilege.
```

Użycie:

- przygotowanie do pytań egzaminacyjnych,
- korekta fałszywych intuicji,
- analiza błędów po sesji.

## 3.4. Troubleshooting Scenario

Cel: diagnoza przyczyny problemu.

Przykład:

```txt
A VM can reach the network but cannot call a cloud API. What should be checked first?
```

Użycie:

- odróżnianie problemów IAM, network, API enablement, service account, firewall, DNS,
- budowanie modeli przyczynowo-skutkowych.

## 3.5. Configuration Sequence

Cel: rozumienie kolejności działań lub minimalnego zestawu konfiguracji.

Przykład:

```txt
Put the steps in the correct order to give an application access to a resource.
```

Użycie:

- tematy operacyjne,
- deployment,
- IAM,
- monitoring,
- backup/restore.

## 3.6. Concept Contrast

Cel: odróżnienie podobnych usług, pojęć lub konfiguracji.

Przykład:

```txt
When would you choose option A instead of option B?
```

Użycie:

- storage options,
- compute options,
- network access patterns,
- predefined vs custom roles,
- managed vs self-managed.

## 3.7. Mini Case

Cel: krótszy scenariusz z kilkoma sygnałami decyzyjnymi.

Użycie:

- interleaving,
- końcówka topicu,
- przygotowanie do exam mode.

## 3.8. Exam-style Question

Cel: test bez natychmiastowego feedbacku albo końcowa walidacja.

Ograniczenie: nie kopiować rzeczywistych pytań egzaminacyjnych. Item ma być autorskim scenariuszem zbudowanym na podstawie publicznego zakresu wiedzy, dokumentacji i realnych decyzji technicznych.

## 3.9. Review Repair Item

Cel: krótkie zadanie naprawiające konkretny błąd użytkownika.

Przykład:

```txt
Earlier you selected project Owner for a narrow read-only use case.
Which signal in the prompt should have ruled that out?
```

To nie musi być nowe pytanie egzaminacyjne. Może być krótkim itemem diagnostycznym.

---

# 4. Model progresji nauki w topicu

Każdy większy temat powinien mieć wewnętrzną progresję. Nie zaczynamy od losowej mieszanki pytań.

## 4.1. Progresja topicu

```txt
1. Orientation
2. Guided Concept Checks
3. Focused Decision Practice
4. Contrast Practice
5. Troubleshooting / Edge Cases
6. Interleaved Practice
7. Exam-style Validation
8. Spaced Review
```

## 4.2. Orientation

Krótka orientacja w temacie. Nie jest to pełna lekcja.

Zasady:

- maksymalnie kilka zdań,
- nie zastępuje praktyki,
- kończy się aktywnym pytaniem,
- może zawierać jedną mapę pojęć lub listę sygnałów decyzyjnych.

Przykład:

```txt
IAM policies control who can do what on which resource.
The key exam signal is scope: organization, folder, project, or resource.
```

Następnie aplikacja powinna zadać pytanie sprawdzające, nie przejść do kolejnego tekstu.

## 4.3. Guided Concept Checks

Krótka seria podstawowych itemów, które weryfikują, czy użytkownik rozumie język tematu.

Minimalne wymagania:

- natychmiastowy feedback,
- wyjaśnienia dystraktorów,
- zapis `firstAttempt`, `confidence`, `mistakeType`.

## 4.4. Focused Decision Practice

Główna praktyka w jednym obszarze.

Przykład:

```txt
Focus: IAM policies
Itemy:
- least privilege decision,
- service account access,
- predefined role choice,
- resource-level vs project-level access.
```

To jest `blocked practice`. Dobre dla wejścia w nowy materiał.

## 4.5. Contrast Practice

Mieszanie podobnych, ale różnych pojęć.

Przykład:

```txt
IAM condition vs custom role
Service account key vs workload identity
Project-level permission vs resource-level permission
```

Cel: użytkownik ma nauczyć się różnicowania, nie tylko rozpoznawania jednego wzorca po etykiecie.

## 4.6. Troubleshooting / Edge Cases

Scenariusze, gdzie poprawna odpowiedź wymaga zidentyfikowania brakującego elementu.

Przykłady sygnałów:

- uprawnienie istnieje, ale na złym poziomie,
- API nie jest włączone,
- service account jest niewłaściwy,
- network path działa, ale auth nie,
- zasób jest regionalny/zonalny niezgodnie z wymaganiem.

## 4.7. Interleaved Practice

Mieszana sesja bez jawnej etykiety tematu przy każdym pytaniu.

Użytkownik nie powinien wiedzieć, że „teraz ćwiczymy IAM”. Ma sam rozpoznać sygnał w scenariuszu.

Interleaving powinien być używany dopiero, gdy użytkownik ma minimalną ekspozycję na kilka topiców.

## 4.8. Exam-style Validation

Walidacja bez natychmiastowego feedbacku.

Zasady:

- feedback dopiero po zakończeniu setu,
- wynik pokazany per competency/topic/mistake type,
- po zakończeniu powstaje lista konkretnych review actions,
- nie używać komunikatu „ready for exam” jako procentowej obietnicy.

## 4.9. Spaced Review

Powrót po czasie do konkretnych itemów i podobnych skill atoms.

Review powinien łączyć:

```txt
same item
  + similar item
  + contrast item
  + short repair item
```

Nie wystarczy pokazać identycznego pytania po kilku dniach.

---

# 5. Tryby sesji dla certyfikacji

## 5.1. Diagnostic Baseline

Cel: szybka diagnoza startowa.

Charakterystyka:

- krótka sesja,
- mieszanka domen i kompetencji,
- brak agresywnej oceny końcowej,
- wynik jako mapa pierwszych sygnałów, nie diagnoza finalna.

Output:

```txt
Initial signals:
- Strong: basic storage concepts
- Needs review: IAM least privilege
- Not enough data: networking troubleshooting
Recommended next: Focus Practice — IAM policies
```

## 5.2. Focus Practice

Cel: nauka jednego topicu lub competency area.

Charakterystyka:

- blocked practice,
- natychmiastowy feedback,
- większa liczba concept checks i decision scenarios,
- dobre dla nowego lub słabego tematu.

## 5.3. Scenario Practice

Cel: ćwiczenie decyzji w realistycznych sytuacjach.

Charakterystyka:

- głównie decision scenarios, troubleshooting, mini cases,
- feedback diagnostyczny,
- nacisk na reguły decyzyjne i dystraktory.

## 5.4. Weak Area Review

Cel: naprawa konkretnych słabych miejsc.

Charakterystyka:

- generowany z review queue,
- krótki,
- wyjaśnia powód doboru itemów,
- zawiera repair itemy i kontrastowe przykłady.

## 5.5. Mixed Practice

Cel: rozpoznawanie tematu bez etykiety.

Charakterystyka:

- interleaving,
- tematy z kilku competency areas,
- używać po ekspozycji na podstawowe topic nodes.

## 5.6. Exam Simulation

Cel: sprawdzenie pracy bez natychmiastowego feedbacku.

Charakterystyka:

- brak feedbacku po każdym pytaniu,
- ograniczony czas opcjonalnie,
- wynik końcowy per competency/topic/mistake type,
- zawsze kończy się review planem.

Exam Simulation nie jest głównym trybem nauki. Jest walidacją i źródłem danych diagnostycznych.

## 5.7. Quick Review

Cel: szybki powrót do itemów due.

Charakterystyka:

- 3–7 minut,
- tylko itemy z wysokim priorytetem,
- dobre na Home jako szybkie CTA.

---

# 6. Mechanika rekomendacji

## 6.1. Rekomendacja ma wybierać następną najlepszą akcję

Home nie powinien losowo proponować sesji. Każda rekomendacja musi wynikać z sygnałów:

- błędne odpowiedzi,
- powtarzalny typ błędu,
- niski first-attempt accuracy,
- wysoki hint usage,
- niska pewność,
- brak ekspozycji na ważną kompetencję,
- review due,
- przygotowanie do exam simulation,
- ręcznie wybrany focus przez użytkownika.

## 6.2. Deterministyczny scoring MVP

Nie używać ML w MVP.

```txt
recommendationScore =
  reviewDueWeight
  + weakCompetencyWeight
  + repeatedMistakeWeight
  + lowCoverageWeight
  + lowFirstAttemptWeight
  + lowConfidenceWeight
  + manualFocusWeight
  + examDomainImportanceWeight
  - recentSuccessWeight
  - tooRecentPracticePenalty
```

Przykładowe wagi:

```txt
item due for review                  +4
same mistake repeated                +4
competency first-attempt < 60%       +3
topic has low coverage               +2
high exam relevance                  +2
manual user-selected focus           +2
used hints repeatedly                +1
low confidence despite correct       +1
correct twice recently               -3
practiced in previous session        -1
```

## 6.3. Rekomendacja musi być wyjaśnialna

Dobre komunikaty:

```txt
Recommended because you missed least-privilege decisions twice and have 4 IAM items due for review.
```

```txt
Recommended because networking troubleshooting has low coverage and has not appeared in your last 5 sessions.
```

Złe komunikaty:

```txt
Recommended by AI.
```

```txt
Your readiness is 73%.
```

## 6.4. Priorytet wyboru sesji

Rekomendowany porządek:

```txt
1. Review due with high priority
2. Repeated mistake repair
3. Weak competency focus practice
4. Low coverage in important domain
5. Contrast practice for confused topics
6. Mixed practice
7. Exam simulation
```

Exam Simulation nie powinien być promowany, gdy użytkownik ma wiele zaległych review albo bardzo słabe podstawowe competency areas.

---

# 7. Evidence model zamiast readiness / retention

## 7.1. Nie używać syntetycznego readiness score

Aplikacja nie powinna mówić:

```txt
Readiness: 78%
Retention: 84%
```

Jeżeli nie ma kontrolowanej definicji i danych, takie metryki są mylące.

## 7.2. Używać evidence level

Dla każdego topicu / competency area pokazujemy poziom dowodów, nie obietnicę gotowości.

```ts
type EvidenceLevel =
  | 'not_enough_data'
  | 'weak_evidence'
  | 'developing'
  | 'consistent'
  | 'strong_evidence';
```

Znaczenie:

| Evidence level | Znaczenie |
|---|---|
| `not_enough_data` | Za mało prób, żeby oceniać. |
| `weak_evidence` | Są próby, ale wynik jest niestabilny albo niski. |
| `developing` | Użytkownik zaczyna odpowiadać poprawnie, ale są błędy lub hinty. |
| `consistent` | Kilka poprawnych prób bez dużej pomocy. |
| `strong_evidence` | Powtarzalne poprawne odpowiedzi, również po czasie lub w mixed practice. |

## 7.3. Dane pod evidence level

Evidence level powinien wynikać z konkretnych sygnałów:

```txt
attempt count
first-attempt accuracy
hint usage
confidence calibration
repeat mistake count
review overdue count
correct after delay
mixed practice performance
exam simulation performance
```

## 7.4. UI powinno pokazywać sygnały, nie tylko stan

Przykład:

```txt
IAM least privilege
First try: 58%
Repeated mistake: over-permissioning ×3
Review due: 4 items
Evidence: developing
Next: Weak Area Review
```

Nie:

```txt
IAM readiness: 58%
```

---

# 8. Model danych dla certyfikacji

## 8.1. Rozszerzenie TrainingItem

```ts
type CertificationItem = TrainingItem & {
  certification: CertificationMetadata;
  learning: CertificationLearningMetadata;
};
```

```ts
type CertificationMetadata = {
  trackId: TrackId;
  provider?: string;
  certificationCode?: string;
  examGuideVersion?: string;
  examDomainRefs: TaxonomyRef[];
  competencyRefs: TaxonomyRef[];
  topicRefs: TaxonomyRef[];
  serviceRefs?: TaxonomyRef[];
};
```

```ts
type CertificationLearningMetadata = {
  primarySkillAtomId: string;
  secondarySkillAtomIds?: string[];

  itemKind:
    | 'concept_check'
    | 'decision_scenario'
    | 'distractor_elimination'
    | 'troubleshooting_scenario'
    | 'configuration_sequence'
    | 'concept_contrast'
    | 'mini_case'
    | 'exam_style_question'
    | 'review_repair';

  decisionRuleIds?: string[];
  scenarioPatternIds?: string[];
  expectedMistakeTypeIds?: string[];
  prerequisiteSkillAtomIds?: string[];
  contrastSkillAtomIds?: string[];

  cognitiveLoad: 'low' | 'medium' | 'high';
  examRelevance: 'low' | 'medium' | 'high';
  recommendedStage:
    | 'orientation'
    | 'guided_concept'
    | 'focused_decision'
    | 'contrast'
    | 'troubleshooting'
    | 'interleaved'
    | 'exam_validation'
    | 'review';
};
```

## 8.2. Attempt metadata

```ts
type CertificationAttemptMetadata = {
  confidence?: 'low' | 'medium' | 'high';
  usedHint: boolean;
  firstAttempt: boolean;
  answerChanged: boolean;
  timeSpentMs: number;

  selectedOptionIds?: string[];
  selectedDecisionRuleId?: string;
  detectedMistakeTypeIds?: string[];

  wasScenarioSignalRecognized?: boolean;
  wasDistractorSelected?: boolean;
};
```

## 8.3. Progress per competency

```ts
type CertificationCompetencyProgress = {
  competencyRef: TaxonomyRef;

  exposureCount: number;
  attemptCount: number;
  firstAttemptCorrectCount: number;
  correctWithoutHintCount: number;
  incorrectCount: number;
  partialCount: number;

  firstAttemptAccuracy?: Percent;
  hintUsageRate?: Percent;
  lowConfidenceCorrectCount: number;
  highConfidenceIncorrectCount: number;

  repeatedMistakeTypes: Record<string, number>;
  reviewDueCount: number;
  lastPracticedAt?: ISODateString;
  lastCorrectAfterDelayAt?: ISODateString;

  evidenceLevel: EvidenceLevel;
  recommendedAction?: CertificationRecommendedAction;
};
```

```ts
type CertificationRecommendedAction = {
  type:
    | 'start_focus_practice'
    | 'start_weak_area_review'
    | 'start_contrast_practice'
    | 'start_mixed_practice'
    | 'start_exam_simulation'
    | 'continue_current_focus';
  reason: string;
  targetRefs: TaxonomyRef[];
  priority: number;
};
```

---

# 9. Review queue dla certyfikacji

## 9.1. Co trafia do review

Do review trafia item lub skill atom, gdy wystąpi:

- błędna odpowiedź,
- odpowiedź częściowa,
- poprawna odpowiedź z niską pewnością,
- poprawna odpowiedź po użyciu hintu,
- wybór dystraktora,
- pomylenie dwóch podobnych usług / pojęć,
- powtarzalny mistake type,
- brak powrotu do ważnego tematu przez dłuższy czas,
- ręczne oznaczenie przez użytkownika.

## 9.2. Typy review

```txt
same_item_review      — powrót do tego samego itemu
similar_item_review   — podobny scenariusz
contrast_review       — odróżnienie od podobnego pojęcia
repair_review         — krótkie zadanie naprawiające błąd
spaced_check          — kontrola po czasie
```

## 9.3. Harmonogram MVP

Prosty harmonogram:

```txt
incorrect / partial:
  first review: next session or next day
  second review: +3 days after success
  third review: +7 days after success

correct with hint or low confidence:
  first review: +1 day
  second review: +5 days after success

correct without hint in mixed practice:
  reduce review priority
```

Nie trzeba implementować pełnego algorytmu spaced repetition w MVP. Ważne, żeby review miało `dueAt`, `reason`, `priority` i żeby nie było wyłącznie ręczną listą błędów.

---

# 10. Struktura content packa

## 10.1. Foldery

Rekomendowana struktura:

```txt
data/tracks/gcp-ace/
  manifest.json
  taxonomy/
    exam-domains.json
    competency-areas.json
    topics.json
    services.json
    concepts.json
    decision-rules.json
    scenario-patterns.json
    mistake-types.json
  skill-atoms/
    iam.json
    networking.json
    compute.json
    storage.json
  items/
    concept-checks.json
    decision-scenarios.json
    troubleshooting.json
    contrast.json
    exam-style.json
    review-repair.json
  references/
    sources.json
```

## 10.2. Manifest

```ts
type CertificationContentManifest = {
  trackId: TrackId;
  title: string;
  provider?: string;
  certificationCode?: string;
  contentVersion: ContentVersion;
  examGuideVersion?: string;
  generatedAt?: ISODateString;

  taxonomyFiles: string[];
  skillAtomFiles: string[];
  itemFiles: string[];
  referenceFiles: string[];

  itemCount: number;
  skillAtomCount: number;
  domainCount: number;
  topicCount: number;
};
```

## 10.3. Minimalny zakres MVP contentu

MVP nie powinno próbować pokryć całej certyfikacji powierzchownie. Lepsze jest pokrycie kilku obszarów z dobrą pętlą nauki.

Rekomendowany MVP content scope:

```txt
3–5 competency areas
8–12 topics
40–80 skill atoms
150–250 training items
3–5 item kinds
1 short diagnostic set
3–5 exam-style mini sets
```

Minimalne item kinds dla MVP:

```txt
concept_check
decision_scenario
troubleshooting_scenario
concept_contrast
exam_style_question
review_repair
```

## 10.4. Zasada jakości contentu

Każdy item certyfikacyjny musi mieć:

```txt
primarySkillAtomId
competencyRefs
topicRefs
serviceRefs where relevant
decisionRuleIds where relevant
scenarioPatternIds where relevant
correct explanation
incorrect explanations
mistake type mapping
source/reference metadata
content version
```

Bez tych pól item może wyglądać jak pytanie, ale nie będzie użyteczny dla adaptacyjnego systemu nauki.

---

# 11. UI / UX konsekwencje

## 11.1. Home

Home powinien rozdzielać:

```txt
Active certification track
Current focus / Practice focus
Recommended next action
Manual topic selection
Review due
Progress shortcut
```

Przykład:

```txt
Track
Google Cloud ACE

Current focus
IAM policies

Continue practice
Recommended: Weak Area Review
Because: over-permissioning mistakes repeated ×3

Choose what to practice
[Security] [Networking] [Compute] [Storage]
```

Najważniejsze: użytkownik musi mieć swobodę wyboru tematu, a rekomendacja ma być propozycją, nie jedynym CTA.

## 11.2. Topic detail

Topic detail powinien pokazywać:

```txt
Topic name
Related competency areas
Evidence level
First-attempt accuracy
Common mistakes
Review due
Recent sessions
Available practice modes
```

Nie pokazywać syntetycznego `readiness`.

## 11.3. Feedback screen

Feedback po itemie powinien mieć strukturę:

```txt
Result
Your answer
Correct answer
Why this is correct
Why selected distractor is wrong
Decision rule
Scenario signal
Mistake type
Next action
```

## 11.4. Progress screen

Progress screen powinien odpowiadać na pytanie:

```txt
Co ćwiczyć dalej i dlaczego?
```

Nie:

```txt
Czy jestem gotowy na egzamin w 78%?
```

`Performance by topic` powinno agregować topic/competency areas i po tapnięciu prowadzić do topic detail.

---

# 12. Reguły dla wording i komunikacji

## 12.1. Dobre sformułowania

```txt
Needs review
Low evidence
Developing
Consistent
Strong evidence
First-try accuracy
Repeated mistake
Review due
Common mistake
Recommended next
Because...
```

## 12.2. Sformułowania do unikania

```txt
Readiness score
Retention score
You are ready for the exam
Guaranteed pass
AI knows your level
Mastery percentage
```

## 12.3. Ostrożny wording dla walidacji

Dobre:

```txt
You show consistent evidence in IAM least-privilege scenarios.
```

Złe:

```txt
You are ready for IAM questions on the exam.
```

---

# 13. MVP implementation order

## Phase 1 — Certification taxonomy foundation

Zakres:

- `competency_area` jako primary progress axis,
- `topic`, `service`, `decision_rule`, `mistake_type`,
- content manifest,
- skill atoms.

## Phase 2 — Certification item model

Zakres:

- `concept_check`,
- `decision_scenario`,
- `troubleshooting_scenario`,
- `concept_contrast`,
- `exam_style_question`,
- explanations and distractor mapping.

## Phase 3 — Attempt and evidence model

Zakres:

- `firstAttempt`,
- `confidence`,
- `hintUsage`,
- `mistakeTypes`,
- `firstAttemptAccuracy`,
- `evidenceLevel`,
- progress per competency/topic.

## Phase 4 — Review queue

Zakres:

- `dueAt`,
- `priority`,
- `reason`,
- `reviewType`,
- same/similar/contrast/repair review selection.

## Phase 5 — Recommendation engine MVP

Zakres:

- deterministic scoring,
- explainable recommendation,
- Home recommendation,
- Topic detail recommendation.

## Phase 6 — Session modes

Zakres:

- Diagnostic Baseline,
- Focus Practice,
- Scenario Practice,
- Weak Area Review,
- Mixed Practice,
- Exam Simulation.

---

# 14. Najważniejsze decyzje do przeniesienia do istniejących dokumentów

## `00-overview.md`

Dopisać, że certyfikacje korzystają z modelu:

```txt
track → domain → competency area → topic → skill atom → item → attempt → evidence/review
```

## `01-product-definition.md`

Doprecyzować, że certyfikacyjny track nie jest bankiem pytań, tylko adaptive certification practice system.

## `03-navigation-and-flows.md`

Rozdzielić:

```txt
Active track
Current focus
Recommended next action
Manual topic selection
```

## `04-data-model.md`

Zastąpić `readiness` przez `EvidenceLevel` albo oznaczyć `readiness` jako deprecated.

Dodać:

```txt
CertificationSkillAtom
CertificationLearningMetadata
CertificationCompetencyProgress
CertificationRecommendedAction
```

## `07-content-guidelines.md`

Dopisać szczegółowy standard dla itemów certyfikacyjnych:

```txt
concept_check
decision_scenario
distractor_elimination
troubleshooting_scenario
configuration_sequence
concept_contrast
mini_case
exam_style_question
review_repair
```

## `10-roadmap.md`

Dodać fazę budowy taxonomy/content foundation przed dopracowywaniem dashboardów.

## `12-testing-strategy.md`

Dodać testy:

- mapping item → skill atom,
- scoring evidence level,
- review queue due dates,
- recommendation scoring,
- no readiness/retention display in UI.

---

# 15. Decyzja końcowa

Dla ścieżek certyfikacyjnych Patternly powinno działać jako system treningu oparty o kompetencje, nie jako quiz app.

Materiał dzielimy według:

```txt
Certification Track
  ↓
Exam Domain
  ↓
Competency Area
  ↓
Topic
  ↓
Skill Atom
```

A równolegle tagujemy przez:

```txt
Service
Concept
Decision Rule
Scenario Pattern
Mistake Type
Difficulty
Exam Relevance
```

Najważniejszym poziomem produktowym jest `Competency Area`, bo to ona najlepiej odpowiada na pytanie, co użytkownik realnie umie i co powinien ćwiczyć dalej.

Najważniejszym poziomem contentowym jest `Skill Atom`, bo pozwala tworzyć precyzyjny feedback, review i rekomendacje.

Najważniejszym poziomem UI jest `Topic / Current Focus`, bo jest zrozumiały dla użytkownika i daje mu swobodę wyboru nauki.

