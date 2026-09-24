# PROFILE-02 — jeden bieżący Gość i izolacja zakresów

**Data:** 24.09.2026
**Status:** `partial` — [PROFILE-02/A](A-REPORT.md) wykonane; B czeka na decyzję PO, C na B.
**Wejście:** [plan główny](../../PATTERNLY-WORKING-PLAN.md), [PROFILE-01/D](../PROFILE-01/D-REPORT.md), obecny router i testy storage.

## Potwierdzone fakty i rozbieżności

Rejestr profili jest jedynym źródłem ID, rodzaju i wybranego zakresu. Dane nowoczesnych profili mają klucze z prefiksem ID; dawne `legacy_guest` i `legacy_owner` wciąż chronią wcześniejsze niezagnieżdżone dane, więc nie można ich usunąć bez migracji. Konto jest dobierane według potwierdzonego backendowego account ID po Auth; konto A i B otrzymują odrębne scope. `selectPreparedGuestProfile()` wybiera aktywnego albo jedynego zachowanego Gościa; przy wielu nie wyznacza zwycięzcy. Natomiast bezpośrednie `profileStorageRouter.selectGuest()` zawsze tworzy i dopisuje nowy profil. Korzysta z niego także rozwojowy oracle zachowania `legacy_owner`; jego usunięcie należy do `PROFILE-05`.

Urządzeniowy przebieg `PROFILE-01/D` potwierdził powrót widocznego Gościa i restart na tym samym iPhonie 17, ale nie porównał całych danych bajtowo. Nie dostarczył dowodu, czy rejestr na urządzeniu zawiera jednego czy kilku historycznych Gości. Zachowanie wielu nieaktywnych Gości bez ich automatycznego wyboru jest bezpieczne dla danych; decyzja o interfejsie wyboru pozostaje otwarta u PO.

## Zadania wykonawcze

| Slice | Cel i zakres | Kryteria i dowód |
| --- | --- | --- |
| `PROFILE-02/A` — done | Router `selectGuest()` ponownie używa wybranego Gościa, inaczej jedynego istniejącego, tworzy profil tylko przy zerze; przy wielu pozostaje zamknięty i zachowuje wszystkie profile. Zachować dual-slot commit, marker instalacji, legacy mapping oraz dokładne ID kont. Zaktualizować wrapper i testy, których oczekiwanie wielokrotnego tworzenia było historyczne. | Powtórne wejście Guest→account A→Guest→account B→Guest i restart zachowuje guest ID/dane oraz odrębne dane A/B. Błąd zapisu rejestru albo weryfikacji markera nie aktywuje obcego scope. Testy router/MMKV/koordynacji, typecheck, privacy/content boundary, Maestro na jednym iPhonie 17 bez resetu; raport, niezależne QA i push `main`. |
| `PROFILE-02/B` — WAIT: decyzja PO | Dla istniejących instalacji z więcej niż jednym nieaktywnym Gościem ustalić dostępny sposób odzyskania właściwego profilu bez cichego wyboru i bez kasowania danych. Nie odczytywać treści konta ani nie scalać postępów różnych profili w tle. | Każdy istniejący Guest pozostaje osiągalny zgodnie z decyzją, a wybór jest jawny i przetestowany na fixture wieloprofilowym. Nie tworzyć specjalnie drugiego profilu na zachowanym iPhonie. |
| `PROFILE-02/C` — WAIT: A/B | Końcowa macierz izolacji i restartu dla guest, konta A i konta B; usunąć tylko naprawdę martwe gałęzie po kontroli referencji. | Testy kontraktowe i bezpieczny dowód urządzeniowy, raport QA. Legacy dane pozostają czytelne w ich własnym scope. |

**Poza A:** fizyczne kasowanie historycznych profili, migracja danych Gości, adopcja postępów (`PROFILE-04`), zdalny revoke/sync (`PROFILE-03`) i usunięcie oracle (`PROFILE-05`). Jeśli decyzja PO o wielu Gościach nie nadejdzie, A może zostać zamknięte osobno, a praca przechodzi do następnego niezależnego zadania z planu.

**Ocena podejścia A przed niezależną walidacją:** zgodność/architektura 0,91; prostota 0,87; ryzyko 0,84; utrzymywalność 0,88; minimum **0,84**. Niezależna walidacja `gpt-6-luna/high` (wyłącznie briefing `Cel / Ustalenia / Podejście`) zaakceptowała wariant: zgodność 0,93; prostota 0,88; ryzyko 0,84; utrzymywalność 0,90; minimum **0,84**. Kluczowe ograniczenie ryzyka: nie wybierać arbitralnie spośród wielu historycznych profili i nie usuwać żadnego zakresu danych.
