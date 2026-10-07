# Utrzymanie banków — zachowane zadania naprawcze

Priorytet i status określa wyłącznie [plan główny](../../PATTERNLY-WORKING-PLAN.md). Porównanie z 07.10.2026 obejmuje źródła contentu `8bb27fa2bd4f1af58fb8c1b49e5314a1691bbb03` i wersję audytowaną `78ba999098ea12704b74fe9de2eecdf89578e885`.

Zachowano 158 zakresów napraw obejmujących 2 129 aktualnych pytań. Pełna treść każdego wskazanego pytania jest identyczna z treścią ocenianą podczas audytu. Dokumenty poniżej zawierają konkretne problemy, identyfikatory i skróty plików. Pozwalają rozpocząć poprawę wybranej partii bez odtwarzania całego audytu. Przed zmianą sprawdź jednak, czy pliki nadal odpowiadają tym skrótom.

## Zakresy już rozwiązane

Pytania OOD zostały zastąpione i odebrane w pakiecie 24. Zastąpiono też 34 dawne pytania BESD z N02-B01 i N04-B01: w N02 identyfikatory i001–i016 zastępują i017–i032, a w N04 identyfikatory i001–i018 zastępują i019–i036. Zastępstwa odebrano w slice 01 i cohort 14.

Dawne 16 grup problemów Claude zastąpił przegląd 845 aktualnych pytań z wydania `ccarp-2026.10.07`. Rekordy niezależnego przeglądu, porównań pytań i sprawdzenia faktów w źródłach pierwotnych są zachowane w Git pod `4b0f1ff`. Rozwiązanie problemów wynika z tych ocen, a nie ze zwiększenia banku. Zadanie FCA-SCORE-01 jest wykonane; poprawną punktację chronią testy korzystające z rzeczywistych pytań.

Nie przywracaj tych rozwiązanych zadań. Werdykty dawnych pytań nie przechodzą jednak automatycznie na ich zastępstwa w pełnym audycie.

## Warunki wykonania pozostałych napraw

Dawny audyt nie obejmował wszystkich dziewięciu banków. Zweryfikowany rejestr zawiera 4 236 ocen spośród 16 077 ówczesnych pytań; wcześniejsze podsumowanie z liczbą 3 703 było nieaktualne. Ta lista napraw nie potwierdza pełnego odbioru banków i nie ustanawia dodatkowej automatycznej bramki wydania. [Dokończenie oceny wszystkich pytań](content-audit.md) pozostaje osobnym zadaniem.

W wybranej partii popraw treść zgodnie z opisanymi problemami. Zachowaj jasny cel nauki, realistyczne błędne odpowiedzi, objaśnienie mechanizmu w `Details` i informację zwrotną dla każdej opcji. Zmieniane fakty potwierdź w źródłach pierwotnych. Zachowaj schemat wykonania i granice węzłów; nie ukrywaj słabych pytań przez filtrowanie metadanych.

Doprowadź spójnie zmianę źródeł, wersję i migrację, zatwierdzenie i dopuszczenie pakietu oraz przypięcie wersji w aplikacji. Wszystkie zmienione pytania muszą przejść niezależny przegląd. Nie przywracaj dawnych katalogów raportów.

## Szczegóły według banku

- [aws-certified-solutions-architect-associate](content-maintenance/aws-certified-solutions-architect-associate.md): 1 zakres.
- [backend-system-design-interview](content-maintenance/backend-system-design-interview.md): 34 zakresy.
- [coding-interview-dsa-problem-solving](content-maintenance/coding-interview-dsa-problem-solving.md): 18 zakresów.
- [google-cloud-associate-cloud-engineer](content-maintenance/google-cloud-associate-cloud-engineer.md): 23 zakresy.
- [microsoft-azure-administrator-associate-az-104](content-maintenance/microsoft-azure-administrator-associate-az-104.md): 18 zakresów.
- [microsoft-azure-ai-fundamentals-ai-901](content-maintenance/microsoft-azure-ai-fundamentals-ai-901.md): 64 zakresy.
