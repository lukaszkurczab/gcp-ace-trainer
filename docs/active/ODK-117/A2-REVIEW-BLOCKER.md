# ODK-117/A2 — pakiet odblokowania przeglądu językowego

**Status:** `blocking` / `WAIT: competent linguistic review`

**Data:** 25 września 2026

## Cel

Dostarczyć kompletne pakiety namespace `de/fr/es/it/et` bez przedstawiania automatycznie wygenerowanych przekładów jako zweryfikowanych tekstów produktu.

## Potwierdzony stan

- Aplikacja ma 8 namespace’ów i 1 521 wartości liści na locale, czyli A2 obejmuje 7 605 nowych wartości dla pięciu języków.
- Runtime ma obecnie kompletne pakiety aplikacyjne EN/PL. Testowe legal drafty B-CONTRACT nie są pakietami zwykłego UI i nie mogą zostać promowane do A2.
- W repozytorium nie ma app draftów DE/FR/ES/IT/ET, procesu recenzji ani wskazanych kompetentnych recenzentów.
- Plan wymaga niezależnego przeglądu językowego i wprost zabrania generowania niezweryfikowanych tłumaczeń.
- Niezależny briefing ocenił, że recenzja modelowa nie dowodzi kompetentnego przeglądu językowego. Model może przygotowywać propozycje i kontrole spójności, ale nie może sam nadać A2 statusu PASS.

## Wejście wymagane do odblokowania

Dla każdego z pięciu języków potrzebny jest kompetentny, niezależny recenzent albo uzgodniona profesjonalna usługa tłumaczeniowa. Pakiet odbiorowy musi identyfikować język i zakres, wersję źródła EN, recenzenta/proces, datę, wynik oraz rozstrzygnięcia terminologiczne. Nie umieszczać danych kontaktowych recenzenta w publicznym repo; wystarczy audytowalny identyfikator procesu lub prywatnego evidence.

## Zakres po odblokowaniu

- Utworzyć kompletne `src/locales/{de,fr,es,it,et}` dla wszystkich ośmiu namespace’ów.
- Zachować dokładny zestaw kluczy, typy wartości, interpolacje, znaczniki i pluralizacje źródła.
- Włączyć locale do runtime dopiero po kompletnym przeglądzie danego pakietu; brak częściowego lub cichego fallbacku.
- Dodać automatyczny parytet siedmiu locale oraz dowód niezależnego przeglądu per język.
- Nie obejmować w A2 zwykłych literałów poza locale (A3), formatowania/prezenterów (A4), Maestro (A5) ani prawdziwych wartości prawnych (B-VALUES).

## Kryteria zamknięcia

1. Pięć pakietów jest kompletnych i przechodzi parytet wszystkich 1 521 wartości.
2. Każdy pakiet ma niezależny, kompetentny przegląd językowy z audytowalnym wynikiem.
3. Interpolacje, tokeny, plurale, accessibility copy i terminologia są sprawdzone, nie tylko składnia JSON.
4. Runtime nie publikuje niekompletnego języka i nie korzysta z ukrytego fallbacku.
5. Raport A2 rozdziela wynik techniczny od jakości językowej; końcowe niezależne QA potwierdza oba.

## Następny niezależny slice

`PROFILE-02/C` jest oznaczony w planie jako READY i nie zależy od ODK-117. `ODK-117/A3` pozostaje za A2, ponieważ migracja kolejnych tekstów do niezweryfikowanych pakietów utrwaliłaby tę samą lukę jakościową.
