# 07 — Content Guidelines

## Cel

Ten dokument opisuje zasady tworzenia, utrzymywania i recenzowania treści treningowych w aplikacji.

Aplikacja nie jest już projektowana jako pojedynczy quiz egzaminacyjny. Content musi wspierać wiele tracków, różne typy sesji i różne typy zadań treningowych.

Model nadrzędny:

```txt
track → session mode → training item → attempt → feedback → review → progress
```

Dlatego dokument nie powinien używać `question` jako jedynego pojęcia bazowego. `Question` jest tylko jednym typem `training item`.

## Zasady nadrzędne

Content powinien:

- uczyć rozpoznawania wzorców, nie tylko zapamiętywania odpowiedzi,
- sprawdzać rozumowanie, a nie przypadkowe kliknięcia,
- dawać wyjaśnienie po próbie, nie tylko wynik,
- wspierać review błędów,
- mieć stabilne ID i wersję,
- być przypisany do tracka, trybu sesji i taksonomii,
- nie kopiować zamkniętych ani chronionych materiałów egzaminacyjnych,
- nie sugerować afiliacji z Google, LeetCode ani innymi właścicielami marek.

## Pojęcia

### Track

Track to obszar nauki.

Przykłady:

- `cloud-certification`,
- `algorithms`.

Track definiuje:

- taksonomię,
- typy itemów,
- typowe sesje,
- metryki postępu,
- wymagania jakościowe contentu.

### Session mode

Session mode to sposób pracy z contentem.

Przykłady:

- `practice`,
- `exam_simulation`,
- `review`,
- `pattern_drill`,
- `strategy_practice`,
- `timed_challenge`.

Nie każdy tryb pasuje do każdego tracka. `exam_simulation` jest naturalny dla tracków certyfikacyjnych. `pattern_drill` i `strategy_practice` są naturalne dla tracka algorytmicznego.

### Training item

Training item to pojedyncza jednostka pracy użytkownika.

Może być:

- pytaniem jednokrotnego wyboru,
- pytaniem wielokrotnego wyboru,
- scenariuszem decyzyjnym,
- zadaniem rozpoznania patternu,
- analizą złożoności,
- porównaniem rozwiązań,
- krótką refleksją po błędzie.

## Track: Cloud Certification

### Cel contentu

Content certyfikacyjny ma pomagać użytkownikowi zrozumieć usługi, decyzje architektoniczne, ograniczenia, best practices i typowe scenariusze egzaminacyjne.

Nie może być kopią rzeczywistych pytań egzaminacyjnych ani sugerować, że aplikacja jest oficjalnym symulatorem.

### Dobre pytanie certyfikacyjne

Dobre pytanie powinno:

- sprawdzać rozumienie, nie tylko pamięć,
- mieć jednoznacznie poprawną odpowiedź,
- zawierać realistyczny kontekst,
- mieć technicznie prawdopodobne dystraktory,
- mieć wyjaśnienie poprawnej odpowiedzi,
- wyjaśniać, dlaczego błędne opcje są błędne,
- być przypisane do domeny lub obszaru wiedzy,
- mieć stabilne ID,
- mieć wersję,
- wskazywać stabilne źródła referencyjne.

### Struktura pytania certyfikacyjnego

```txt
Scenario / prompt
  ↓
Answer options
  ↓
Correct answer
  ↓
Correct explanation
  ↓
Incorrect explanations
  ↓
Taxonomy refs / tags / references
```

### Typy pytań certyfikacyjnych

#### Conceptual

Sprawdza rozumienie pojęcia.

Przykład:

```txt
Which principle is violated by granting a project-level Owner role for a read-only storage use case?
```

#### Scenario-based

Sprawdza decyzję w realistycznym kontekście.

Przykład:

```txt
A team needs to give an application read-only access to a single bucket. What should they configure?
```

#### Best practice

Sprawdza rekomendowane podejście.

Przykład:

```txt
Which option follows least privilege?
```

#### Troubleshooting

Sprawdza diagnozę problemu.

Przykład:

```txt
A VM cannot access an API despite having network connectivity. What should be checked first?
```

### Złe pytania certyfikacyjne

Unikać pytań:

- zależnych od szczegółów UI konsoli,
- zależnych od szybko zmieniających się cen,
- z niejednoznaczną odpowiedzią,
- bez wyjaśnienia,
- z odpowiedziami `all of the above` jako skrótem,
- z podchwytliwą składnią zamiast realnej wiedzy,
- z nieaktualnymi nazwami usług,
- z odpowiedziami różniącymi się tylko niuansem językowym,
- sugerujących, że pochodzą z oficjalnego egzaminu,
- zbudowanych na podstawie zapamiętanych lub skopiowanych pytań egzaminacyjnych.

## Track: Algorithms / LeetCode-style

### Cel contentu

Content algorytmiczny ma uczyć użytkownika dobierania strategii rozwiązania problemu.

W MVP nie chodzi o pełny online judge ani kopiowanie platformy LeetCode. Najważniejsza wartość to:

```txt
problem recognition → pattern selection → complexity reasoning → mistake review
```

### Dobre zadanie algorytmiczne

Dobre zadanie powinno:

- prowadzić do rozpoznania właściwego patternu,
- ujawniać, dlaczego brute force jest niewystarczający albo kiedy jest akceptowalny,
- pokazywać trade-off między czasem, pamięcią i prostotą,
- zawierać przynajmniej jedną typową pułapkę,
- mieć wyjaśnienie strategii,
- mieć oczekiwaną złożoność czasową i pamięciową,
- mieć tagi patternów i struktur danych,
- dawać użytkownikowi feedback na poziomie rozumowania, nie tylko poprawności.

### Struktura itemu algorytmicznego

```txt
Problem summary
  ↓
Constraints / signal words
  ↓
Candidate approaches
  ↓
Best strategy / pattern
  ↓
Complexity reasoning
  ↓
Common mistakes
  ↓
Review prompt
  ↓
Taxonomy refs / tags / references
```

### Typy itemów algorytmicznych

#### Pattern identification

Użytkownik wybiera najbardziej pasujący pattern.

Przykład:

```txt
You need to find whether a target sum exists in a sorted array. Which pattern should you consider first?
```

Poprawna odpowiedź może wskazywać `two pointers`, a feedback powinien wyjaśnić, dlaczego sortowanie zmienia dostępne strategie.

#### Strategy choice

Użytkownik wybiera najlepsze podejście dla ograniczeń.

Przykład:

```txt
n can be up to 100,000 and each lookup must be fast. Which approach is most appropriate?
```

#### Complexity analysis

Użytkownik ocenia złożoność rozwiązania.

Przykład:

```txt
A loop iterates over all elements and performs O(1) hash map operations. What is the expected time complexity?
```

#### Solution comparison

Użytkownik porównuje dwa rozwiązania.

Przykład:

```txt
Approach A uses sorting and two pointers. Approach B uses a hash set. Which trade-off is more relevant here?
```

#### Mistake review

Użytkownik analizuje, dlaczego wybrał zły pattern albo źle ocenił ograniczenia.

Przykład:

```txt
You selected binary search, but the input was not sorted and no monotonic condition was present. What signal was missing?
```

### Złe itemy algorytmiczne

Unikać itemów:

- będących kopią problemów z LeetCode lub innych platform,
- wymagających pełnego IDE jako warunku rozwiązania w MVP,
- sprawdzających tylko znajomość nazwy patternu,
- bez ograniczeń wejściowych,
- bez wyjaśnienia trade-offów,
- bez informacji o złożoności,
- z jedną “magiczną” odpowiedzią bez kontekstu,
- które premiują pamiętanie konkretnego problemu zamiast rozpoznawania struktury.

## Dystraktory i błędne strategie

Dystraktor lub błędna strategia powinny być wiarygodne, ale błędne w danym kontekście.

Dobry dystraktor certyfikacyjny:

```txt
Grant the role at the project level instead of the bucket level.
```

Dlaczego dobry:

- jest technicznie możliwy,
- często wynika z błędnego rozumowania,
- pozwala wyjaśnić least privilege.

Dobry dystraktor algorytmiczny:

```txt
Use binary search because the expected answer can be checked in logarithmic time.
```

Dlaczego dobry:

- brzmi technicznie sensownie,
- ujawnia błędne założenie,
- pozwala wyjaśnić, że binary search wymaga uporządkowania albo monotonicznego warunku.

Zły dystraktor:

```txt
Restart the internet.
```

Dlaczego zły:

- nie jest realistyczny,
- nie uczy,
- jest oczywistym żartem.

## Wyjaśnienia

Każdy training item powinien mieć feedback po próbie.

### Wyjaśnienie dla pytań certyfikacyjnych

Preferowana struktura:

```txt
The correct answer is X because...
Option A is incorrect because...
Option C is incorrect because...
Option D is incorrect because...
Remember: ...
```

### Wyjaśnienie dla itemów algorytmicznych

Preferowana struktura:

```txt
Best strategy: ...
Why this fits: ...
Why the tempting alternatives fail: ...
Time complexity: ...
Space complexity: ...
Common mistake: ...
Review note: ...
```

Feedback algorytmiczny powinien jasno oddzielać:

- rozpoznanie patternu,
- wybór struktury danych,
- analizę ograniczeń,
- analizę złożoności,
- typ błędu.

## Taxonomy refs i tagi

Każdy item powinien mieć przypisanie do taksonomii.

### Cloud Certification

Przykładowe wymiary:

- domain,
- service,
- concept,
- best practice,
- difficulty,
- scenario type.

Przykład:

```json
{
  "taxonomyRefs": [
    "cloud-certification/domain/security",
    "cloud-certification/concept/least-privilege",
    "cloud-certification/service/cloud-storage"
  ]
}
```

### Algorithms

Przykładowe wymiary:

- pattern,
- data structure,
- complexity class,
- mistake type,
- difficulty,
- constraint signal.

Przykład:

```json
{
  "taxonomyRefs": [
    "algorithms/pattern/two-pointers",
    "algorithms/data-structure/array",
    "algorithms/complexity/o-n",
    "algorithms/mistake/ignored-sorted-input"
  ]
}
```

## Linki referencyjne

Linki powinny prowadzić do:

- oficjalnej dokumentacji,
- stabilnych stron koncepcyjnych,
- przewodników best-practice,
- neutralnych materiałów edukacyjnych,
- własnych notatek lub źródeł open-license, jeżeli content zostanie zbudowany poza oficjalnymi dokumentacjami.

Unikać linkowania do:

- losowych blogów,
- materiałów sprzedażowych,
- stron zależnych od konkretnej daty,
- pricingu jako źródła prawdy dla pytań, chyba że pytanie jest wyraźnie o pricing,
- stron z wyciekami pytań egzaminacyjnych,
- skopiowanych rozwiązań problemów z platform codingowych.

## Prawa, marki i afiliacje

Content nie może sugerować, że aplikacja jest oficjalnym produktem Google, LeetCode ani innej platformy.

Zasady:

- nie używać logo Google, GCP, LeetCode ani podobnych znaków jako elementów marki aplikacji,
- nie kopiować prawdziwych pytań egzaminacyjnych,
- nie kopiować problemów codingowych z platform zamkniętych,
- nie obiecywać zdania egzaminu,
- nie obiecywać konkretnego wyniku rekrutacyjnego,
- używać nazw marek tylko opisowo, gdy jest to potrzebne do zrozumienia tracka.

## Wersjonowanie contentu

Każdy zestaw contentu powinien mieć wersję.

Przykład:

```json
{
  "trackId": "cloud-certification",
  "contentSetVersion": "1.0.0",
  "updatedAt": "2026-06-26"
}
```

Training item może mieć własną wersję:

```json
{
  "id": "cloud-iam-001",
  "version": "1.2.0"
}
```

Dla tracka Algorithms:

```json
{
  "id": "alg-two-pointers-001",
  "version": "1.0.0"
}
```

## Deprecated content

Nie usuwać itemów bez śladu, jeżeli użytkownik mógł już na nie odpowiadać.

Lepiej:

```json
{
  "id": "cloud-iam-001",
  "deprecated": true,
  "replacedBy": "cloud-iam-001-v2"
}
```

Deprecated content nie powinien pojawiać się w nowych sesjach, ale powinien być możliwy do odtworzenia w historii użytkownika, jeżeli istnieją powiązane próby.

## Kontrola jakości

Przed dodaniem itemu sprawdzić:

- czy item jest przypisany do właściwego tracka,
- czy typ itemu pasuje do trybu sesji,
- czy odpowiedź lub oczekiwana strategia jest jednoznaczna,
- czy feedback jest wystarczający,
- czy dystraktory albo błędne strategie uczą,
- czy taksonomia i tagi są poprawne,
- czy item nie zależy od szybko starzejącego się UI,
- czy item nie sugeruje afiliacji z właścicielem marki,
- czy item nie kopiuje chronionych materiałów,
- czy język jest neutralny,
- czy poziom trudności jest uzasadniony.

Dla contentu certyfikacyjnego dodatkowo sprawdzić:

- czy pytanie nie wygląda jak dump egzaminacyjny,
- czy źródło referencyjne jest stabilne,
- czy nazwy usług i zależności są aktualne,
- czy pytanie nie zależy od pricingu bez wyraźnego powodu.

Dla contentu algorytmicznego dodatkowo sprawdzić:

- czy problem nie jest kopią znanego zadania,
- czy ograniczenia wejściowe są podane lub implikowane,
- czy wskazany pattern rzeczywiście wynika z problemu,
- czy złożoność jest poprawna,
- czy common mistake jest realistyczny,
- czy item uczy decyzji, a nie tylko nazwy algorytmu.

## Język

Rekomendacja dla MVP:

- UI i content treningowy mogą być po angielsku, bo cloud certification, algorytmy i dokumentacja techniczna funkcjonują głównie w angielskim nazewnictwie,
- dokumentacja projektu może być po polsku,
- terminy techniczne mogą pozostać po angielsku, jeżeli ich polskie tłumaczenie pogarsza precyzję,
- decyzję o pełnej lokalizacji należy zamknąć osobnym ADR przed publicznym release poza anglojęzycznym MVP.

## AI-generated content

Jeżeli pojawi się generowanie contentu przez AI, każdy item musi przejść ręczną weryfikację.

AI może pomagać w:

- wariantach wyjaśnień,
- oznaczaniu tagów,
- propozycjach dystraktorów,
- propozycjach błędnych strategii,
- skracaniu copy,
- wykrywaniu niespójności taksonomii,
- generowaniu własnych wariantów problemów algorytmicznych inspirowanych patternem, ale nie kopiujących konkretnych zadań.

AI nie powinno samodzielnie publikować contentu bez review.

AI-generated content musi być sprawdzony pod kątem:

- poprawności technicznej,
- halucynacji,
- nieaktualnych informacji,
- podobieństwa do materiałów chronionych,
- jednoznaczności feedbacku,
- zgodności z modelem danych.

## Antywzorce

Unikać:

- traktowania `question` jako jedynego typu contentu,
- projektowania wszystkich treści pod `Exam Mode`,
- robienia z Algorithms pełnej kopii LeetCode,
- tworzenia contentu bez taksonomii,
- publikowania itemów bez wyjaśnień,
- mylenia `track` z `session mode`,
- używania marek zewnętrznych jako obietnicy produktu,
- pytań, które testują pamięć sformułowania zamiast rozumowania,
- zadań algorytmicznych, które wymagają znajomości konkretnego problemu zamiast rozpoznania patternu.

## Decyzje bazowe

- Jednostką bazową contentu jest `training item`, nie `question`.
- `Question` pozostaje typem itemu dla tracków certyfikacyjnych.
- Algorithms MVP skupia się na patternach, strategiach i złożoności, nie na pełnym judge online.
- Każdy item musi mieć feedback.
- Każdy item musi mieć track, typ, taksonomię i wersję.
- Content nie może kopiować materiałów egzaminacyjnych ani platform codingowych.
