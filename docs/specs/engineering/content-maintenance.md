# Utrzymanie banków — zachowane zadania naprawcze

Priorytet i status określa wyłącznie [plan główny](../../PATTERNLY-WORKING-PLAN.md). Porównanie z 07.10.2026 obejmuje źródła contentu `8bb27fa2bd4f1af58fb8c1b49e5314a1691bbb03` i wersję audytowaną `78ba999098ea12704b74fe9de2eecdf89578e885`.

Historyczna lista zachowuje 158 zakresów napraw obejmujących 2 129 pytań z porównania 07.10. Treść niezmienionych zakresów odpowiada ocenianym źródłom; naprawy i ich aktualny status wskazano przy istniejących zadaniach. Dokumenty poniżej zawierają konkretne problemy, identyfikatory i skróty plików. Pozwalają rozpocząć poprawę wybranej partii bez odtwarzania całego audytu. Przed zmianą sprawdź jednak, czy pliki nadal odpowiadają tym skrótom.

## Zakresy już rozwiązane

Pytania OOD zostały zastąpione i odebrane w pakiecie 24. Zastąpiono też 34 dawne pytania BESD z N02-B01 i N04-B01: w N02 identyfikatory i001–i016 zastępują i017–i032, a w N04 identyfikatory i001–i018 zastępują i019–i036. Zastępstwa odebrano w slice 01 i cohort 14.

Dawne 16 grup problemów Claude zastąpił przegląd 845 aktualnych pytań z wydania `ccarp-2026.10.07`. Rekordy niezależnego przeglądu, porównań pytań i sprawdzenia faktów w źródłach pierwotnych są zachowane w Git pod `4b0f1ff`. Rozwiązanie problemów wynika z tych ocen, a nie ze zwiększenia banku. Zadanie FCA-SCORE-01 jest wykonane; poprawną punktację chronią testy korzystające z rzeczywistych pytań.

Nie przywracaj tych rozwiązanych zadań. Werdykty dawnych pytań nie przechodzą jednak automatycznie na ich zastępstwa w pełnym audycie.

## Warunki wykonania pozostałych napraw

Dawny audyt nie obejmował wszystkich dziewięciu banków. Zweryfikowany rejestr zawiera 4 236 ocen spośród 16 077 ówczesnych pytań; wcześniejsze podsumowanie z liczbą 3 703 było nieaktualne. Ta lista napraw nie potwierdza pełnego odbioru banków i nie ustanawia dodatkowej automatycznej bramki wydania. [Dokończenie oceny wszystkich pytań](content-audit.md) pozostaje osobnym zadaniem.

W wybranej partii popraw treść zgodnie z opisanymi problemami. Zachowaj jasny cel nauki, realistyczne błędne odpowiedzi, objaśnienie mechanizmu w `Details` i informację zwrotną dla każdej opcji. Zmieniane fakty potwierdź w źródłach pierwotnych. Zachowaj schemat wykonania i granice węzłów; nie ukrywaj słabych pytań przez filtrowanie metadanych.

Doprowadź spójnie zmianę źródeł, wersję i migrację, zatwierdzenie i dopuszczenie pakietu oraz przypięcie wersji w aplikacji. Wszystkie zmienione pytania muszą przejść niezależny przegląd. Nie przywracaj dawnych katalogów raportów.

## Szczegóły według banku

- [aws-certified-solutions-architect-associate](content-maintenance/aws-certified-solutions-architect-associate.md): 1 zachowany zakres; `FCA-EDIT-658fa75523` rozwiązany 11.10.2026 (PASS).
- [backend-system-design-interview](content-maintenance/backend-system-design-interview.md): 34 zakresy.
- [coding-interview-dsa-problem-solving](content-maintenance/coding-interview-dsa-problem-solving.md): 18 zakresów.
- [google-cloud-associate-cloud-engineer](content-maintenance/google-cloud-associate-cloud-engineer.md): 23 zakresy.
- [microsoft-azure-administrator-associate-az-104](content-maintenance/microsoft-azure-administrator-associate-az-104.md): 18 zakresów.
- [microsoft-azure-ai-fundamentals-ai-901](content-maintenance/microsoft-azure-ai-fundamentals-ai-901.md): 64 zakresy.

## Celowany zakres Claude — autoryzowany 11.10.2026

[Weryfikacja 37 kluczy P1 + korekta P2 Claude](content-maintenance/claude-certified-architect-professional-certification.md): PO autoryzował wykonanie i publikację przed iOS. Niezależne QA wykazało poprawność wszystkich 37 kluczy już w wskazanym source SHA; błędne były litery ID z raportu. W źródle zmieniono tylko P2, z testem regresji dokładnych 38 przypadków. Niezależne QA, runtime admission i release gate PASS; publikacja Git autoryzowana przez PO. Q13 bez zmian. Nie jest to pełny odbiór 845 pytań ani przywrócenie dawnych rozstrzygniętych findingów.

## Celowany zakres BESD — autoryzowany 11.10.2026

[134 naprawy N02-B02–B09 i dowód rodziny BESD-09-04](content-maintenance/backend-system-design-interview.md): osiem istniejących FCA-EDIT otrzymało nowe tożsamości pytań i opcji, pełny mapping before/after oraz niezależny semantic QA PASS 134/134. B01 N02/N04 pozostają niezmienione. Aktualny statyczny alert obejmuje 1401 pytań w 79 plikach, z dokładnym ledgerem ścieżek, ID i hashy w tej samej specyfikacji; to nie jest odbiór semantyczny pozostałego banku. Końcowy stan dopuszczenia i publikacji znajduje się w sekcji autoryzowanego wyjątku.

## Celowane naprawy AWS SAA — odebrane 11.10.2026

[Raport wykonania](../../reports/aws-saa-fixes-2026-10-11.md): PO autoryzował przed iOS dokładne SAA-20261010-01…12 oraz istniejące FCA-EDIT-658fa75523. Naprawiono 28 pytań w 12 plikach, z niezależnym semantic/integration QA PASS, nowym kandydatem, runtime admission i release gate. FCA jest zamknięte; dawne opisy poniżej linku służą jako BEFORE. Pozostały audyt banku jest PARTIAL. Q13 i równolegle opublikowane naprawy Claude zachowano.
