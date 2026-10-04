# Aktualizacja powiązań historycznego audytu 18 — N07/23

[Odtworzone powiązania216](ROOT-REVIEW18-CURRENT.json) sprawdzają aktualne źródła i wszystkie dziewięć artefaktów aplikacji. [Dokładny odbiór zmienionych obiektów](ROOT-REVIEW18-CURRENT-ACCEPTANCE.json) zachowuje pięć wcześniejszych, nadal identycznych odbiorów i wiąże cztery naprawione pozycje N07 z ich przyjętymi pełnymi obiektami oraz niezależnymi raportami semantycznymi.

W próbce pozostają79 exact PASS i123 exact historyczne DEFECT:50 critical,72 material sample defect i1 minor explanation error. Osiem nadal istniejących obiektów zmieniło się względem próbki; pięć dawnych ID jest wycofanych. Jedno dokładnie zgodne pytanie N08 ma historyczny finding przypisany do innego przypadku i pozostaje wyłączone z ponownego użycia. Te rozłączne kategorie sumują się do216.

Dziewięć obiektów ma własne, dokładnie powiązane dowody semantic PASS: pięć wcześniejszych i cztery N07. Liczba dziewięć obejmuje osiem zmienionych obiektów oraz replacement wycofanego N07-B05-i003 na i021; nie należy jej ponownie dodawać do pięciu retired IDs. Pozostałe historyczne retired IDs i ich wcześniejsze proofy nie są ponownie oceniane przez samą zmianę wersji.

Nowe powiązania: N07-B01-i004, B02-i004 i B07-i018 zachowują ID; B05-i003 jest zastąpione ocenionym i021. Każdy raport, frozen input i pełny obecny/przedni obiekt mają sprawdzone hashe. To uzgodnienie nie jest miarą jakości całego banku, nową certyfikacją niezmienionych pytań ani pełnym odbiorem BIZQ-01.
