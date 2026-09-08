# ODK-E2E-026 — model planu nauki

Status: BLOCKED

## Potwierdzone fakty

- Plan może używać tylko zweryfikowanego profilu aktualnego pakietu.
- `validModes` z opisu tracka nie oznacza dostępności w runtime.
- Pakiety mają różne rozmiary i długości sesji.
- AWS ma obecnie tylko 4 pytania. Nie można obiecać sesji 10-pytaniowej.
- Due review jest ważne tylko dla zgodnego tracka, `contentVersion` i `packagePin`. Node wynika ze zweryfikowanego pakietu.
- Próba wpływa na plan dopiero po trwałym zapisie odpowiedzi.
- `targetDate` ma walidowany format `YYYY-MM-DD`, ale nie ma dziś znaczenia produktowego.
- Liczba pytań w pakiecie nie jest zdefiniowanym warunkiem ukończenia celu.

## Model propozycji

`LearningPlanProposal` jest nietrwała. Powstaje z:

- `GoalSnapshot`;
- aktywnego tracka;
- zweryfikowanego profilu i wersji pakietu;
- dostępnych trybów i długości;
- zakończonych sesji oraz trwałych prób;
- kolejki due review;
- strefy czasowej i początku tygodnia;
- wybranych dni oraz godzin.

Wynik zawiera:

- dokładny scope tracka i node;
- wersję oraz pin pakietu;
- dostępne tryby;
- intencję sesji: tryb, wymagany selektor i wspieraną długość;
- sloty tygodnia;
- liczbę due review;
- pojemność planu;
- shortfall;
- `attainability`;
- następną rekomendację;
- jawny stan `unavailable` albo `blocked`.

## Reguły priorytetu

1. Due review dla dokładnego tracka, content version i package pin.
2. Najstarsze `dueAt`.
3. Stabilny identyfikator jako tie-breaker.
4. Jeśli due review istnieje, propozycja wskazuje osobną sesję review. Nie uzupełnia jej zwykłym pool'em.
5. Gdy review nie jest należne, propozycja używa bieżącego resolved package pool.
6. Tylko tryby, selektory i długości dozwolone przez profil pakietu.

## Intencja sesji

Każdy slot wskazuje jedną materializowalną intencję:

```ts
type PlannedSessionIntent =
  | { modeId: CodingLearnOrGuidedMode; selector: { roadmapNodeId: string } | { mentalUnitId: string }; requestedLength: number }
  | { modeId: CodingCustomMode; selector: { roadmapNodeId: string } | { mentalUnitId: string }; feedbackMode: CodingFeedbackMode; requestedLength: number }
  | { modeId: CodingWeakReviewMode; selector: { reviewSource: "due_queue" } | { reviewSource: "session_misses"; reviewItemRefs: ContentItemRef[] }; requestedLength: number }
  | { modeId: "certification-diagnostic-baseline"; selector: null; resolvedLength: 40 }
  | { modeId: CertificationFocusMode; selector: { domain: string }; requestedLength: number }
  | { modeId: CertificationOrDesignReviewMode; selector: { reviewSource: "due_queue" }; requestedLength: number }
  | { modeId: CertificationQuickReviewMode; selector: null; resolvedLength: number }
  | { modeId: DesignPracticeMode; selector: null; requestedLength: number };
```

Dokładny wariant wynika z profilu rodziny i trybu. W Design scope free node wynika ze zweryfikowanego pakietu i nie jest parametrem requestu. Quick Review używa stałego `maximumLength`, więc propozycja zapisuje wynik jako `resolvedLength`. Długość zależy od `modeId`, selektora i liczby eligible itemów. Generator nie tworzy uniwersalnego selektora.

Każdy `ContentItemRef` zawiera `trackId`, `itemId`, `contentVersion` i `packagePin`. Powstaje wyłącznie z trwałego wyniku sesji.

Nie wolno dodawać pytań z innego tracka, node, pakietu premium ani starego pinu. Nie wolno wymyślać brakujących kompetencji z samego wyniku próby.

## Ograniczenia

- `paused`: brak aktywnej propozycji;
- brak dni po odczycie legacy: `blocked`;
- brak pakietu albo trybu: `unavailable`;
- pusty review: tryb review jest niedostępny albo prawdziwie skrócony zgodnie z profilem;
- niewspierana długość: jawny shortfall, bez cichego zaokrąglenia;
- brak `targetDate`: plan otwarty bez prognozy końca;
- brak definicji ukończenia: `attainability = unknown`.

## Rzeczywista dostępność

- Coding: 158 pytań; Learn 10, Guided/Custom 10/20/40, Weak Review 10/20.
- Design: 136–150 pytań; dostępne wąskie tryby 1/10 oraz Weak Review 1/10.
- GCP: 136 pytań; Diagnostic 40, Focus 10/20/40, Weak 10/20, Quick 10.
- AWS: 4 pytania; dostępne długości kończą się na 4.
- Pozostałe certyfikacje: 48–144 pytania; Focus 10/20/40, Weak 10/20, Quick 10.

## Decyzje PO

### Target date

- T1 — twardy termin ukończenia zakresu;
- T2 — data egzaminu lub rozmowy, więc nauka kończy się wcześniej;
- T3 — orientacyjny checkpoint bez obietnicy ukończenia.

Rekomendacja: semantyka zależy od `goalType`. Przygotowanie do rozmowy lub certyfikacji używa T2. Budowanie podstaw używa T1. Odświeżanie wiedzy używa T3. Nauka we własnym tempie domyślnie nie ma daty.

Kod nie tworzy konfliktów między rodzinami. Tracki Coding i Design oferują `prepare_for_an_interview`. Tracki Certification oferują `prepare_for_a_certification`. Pozostałe trzy typy celu są wspólne.

| `goalType` | Znaczenie `targetDate` | Zachowanie |
| --- | --- | --- |
| `prepare_for_an_interview` | T2: dzień rozmowy | Ostatnia sesja wcześniej |
| `prepare_for_a_certification` | T2: dzień egzaminu | Ostatnia sesja wcześniej |
| `build_foundations` | T1: termin zakresu | Pokazuj osiągalność ukończenia |
| `refresh_and_maintain_skills` | T3: checkpoint | Nie kończ celu automatycznie |
| `learn_at_own_pace` | brak daty | Odrzuć `targetDate` |

### Zgodność z zapisanymi celami

Obecny kontrakt dopuszcza `targetDate` dla każdego `goalType`. Dlatego zapis może już zawierać datę dla `learn_at_own_pace`.

Najmniejsza bezpieczna migracja:

1. Odczyt zachowuje stary rekord.
2. Generator ignoruje datę dla `learn_at_own_pace`.
3. Ekran wyjaśnia, że ten typ celu nie używa daty.
4. Następny jawny zapis celu usuwa `targetDate`.

Nie usuwamy danych w tle. Nie nadajemy starej dacie nowego znaczenia.

### Ukończenie celu

- C1 — pokrycie wszystkich pytań wybranego scope;
- C2 — próg wyniku lub mastery;
- C3 — reguła ukończenia zadeklarowana przez wersjonowany pakiet.

Rekomendacja: C3. Pakiet treści jest właścicielem zakresu i mierzalnej reguły. Jeśli pakiet nie ma reguły, status pozostaje `unknown`.

### Shortfall

- S1 — pokaż niedostępność i pozwól zmienić cel, dni lub długość;
- S2 — automatycznie skróć tylko wtedy, gdy profil pakietu jawnie na to pozwala;
- S3 — uzupełnij innym materiałem.

Rekomendacja: S1 + S2. S3 jest zabronione.

## Przykłady wpływu rekomendacji

### Przygotowanie do rozmowy — Coding

Data oznacza dzień rozmowy. Ostatni planowany slot jest wcześniej. Długość zależy od trybu: Learn 10, Guided/Custom 10/20/40, Weak Review 10/20. Węższa pula selektora może zgodnie z profilem skrócić sesję. Due review tworzy osobną sesję. Brak reguły ukończenia pakietu daje `attainability: unknown`, bez fałszywej obietnicy gotowości.

### Przygotowanie do certyfikacji — AWS

Pakiet ma 4 pytania. Plan może zaproponować tylko wspieraną długość 4. Nie powtarza pytań jako filler. Termin może mieć shortfall do czasu wydania większego pakietu albo nowych due review.

### Budowanie podstaw — Design

Data jest terminem ukończenia zakresu. Dostępne są tylko tryby zadeklarowane przez bieżący pakiet. Plan nie używa trybów z samego `validModes`. Bez wersjonowanej reguły ukończenia pakietu prognoza pozostaje nieznana.

### Odświeżanie wiedzy

Data jest checkpointem. Cel nie kończy się automatycznie. Plan jest kroczący i stawia due review przed nowym materiałem.

### Nauka we własnym tempie

Domyślnie nie ma daty ani prognozy ukończenia. Plan wykorzystuje wybrane dni i wspierane długości. Użytkownik może zmienić rytm bez komunikatu o opóźnieniu.

## Minimalny kontrakt ukończenia pakietu

Wariant C3 wymaga od wersjonowanego pakietu jawnych danych:

- `scopeId`;
- `completionRuleVersion`;
- mierzalne wymagane fakty;
- minimalne pokrycie;
- sposób rozliczenia due review;
- stan przy brakującym materiale.

Brak tych danych nie oznacza ukończenia. Daje `attainability: unknown` i wskazuje brak kontraktu treści.

## Wpływ decyzji na ekran propozycji

Ekran z `ODK-E2E-027` może użyć obecnego wzorca `GoalCadenceScreen`: nagłówek, karta podsumowania i przycisk w sticky footer. Nie wymaga nowego systemu komponentów.

- T1 pokazuje „ukończysz do” i stan osiągalności terminu.
- T2 pokazuje datę wydarzenia oraz ostatnią sesję przed wydarzeniem.
- T3 pokazuje checkpoint. Nie pokazuje obietnicy ukończenia.
- C3 pokazuje warunek ukończenia z pakietu. Brak reguły daje „nie można jeszcze oszacować”.
- S1 pokazuje powód braku planu i akcję „Edytuj cel”.
- S2 pokazuje krótszą sesję oraz powód skrócenia.
- Zakaz S3 chroni scope tracka i pakietu.

Bez wyboru T i C ten sam wynik mógłby zostać opisany jako termin, wydarzenie albo checkpoint. To zmienia główny komunikat i stan osiągalności. Projekt nie powinien tego zgadywać.

## Walidacja briefu

Niezależny `gpt-5.6-luna / max`, bez narzędzi:

- zgodność celu i architektury: 0,93;
- prostota: 0,90;
- kontrola ryzyka: 0,80;
- utrzymywalność: 0,91;
- minimum: 0,80;
- werdykt: APPROVE.

## Licznik decyzji PO

- Próba 1/5: przekazano trzy krótkie decyzje T, C i S wraz z rekomendacją.
- Próba 2/5: dodano przykłady Coding, AWS, Design, refresh i self-paced oraz minimalny kontrakt ukończenia pakietu.
- Próba 3/5: dodano wpływ każdego wariantu na ekran propozycji i prostą odpowiedź zbiorczą.
- Próba 4/5: sprawdzono wszystkie tracki. Dodano pełne mapowanie `goalType` do znaczenia daty i zachowania planu.
- Próba 5/5: dodano bezpieczną obsługę istniejących celów self-paced z datą i przekazano ostatnią uproszczoną prośbę o decyzję.

PO nie odpowiedział po piątej prośbie. Zadanie pozostaje aktywne jako `BLOCKED`.
