# PROFILE-02 — jeden bieżący Gość i izolacja zakresów

**Data:** 24.09.2026
**Status:** `partial` — [PROFILE-02/A](A-REPORT.md) wykonane; B anulowane wiążącą decyzją właściciela z 25.09.2026; C jest następne.
**Wejście:** [plan główny](../../PATTERNLY-WORKING-PLAN.md), [PROFILE-01/D](../PROFILE-01/D-REPORT.md), obecny router i testy storage.

## Potwierdzone fakty i rozbieżności

Rejestr profili jest jedynym źródłem ID, rodzaju i wybranego zakresu. Dane nowoczesnych profili mają klucze z prefiksem ID; dawne `legacy_guest` i `legacy_owner` wciąż chronią wcześniejsze niezagnieżdżone dane, więc nie można ich usunąć bez migracji. Konto jest dobierane według potwierdzonego backendowego account ID po Auth; konto A i B otrzymują odrębne scope. `selectPreparedGuestProfile()` wybiera aktywnego albo jedynego zachowanego Gościa; przy wielu nie wyznacza zwycięzcy. Natomiast bezpośrednie `profileStorageRouter.selectGuest()` zawsze tworzy i dopisuje nowy profil. Korzysta z niego także rozwojowy oracle zachowania `legacy_owner`; jego usunięcie należy do `PROFILE-05`.

Urządzeniowy przebieg `PROFILE-01/D` potwierdził powrót widocznego Gościa i restart na tym samym iPhonie 17, ale nie porównał całych danych bajtowo. Patternly nie ma realnych użytkowników ani danych produkcyjnych wymagających kompatybilności wstecznej. Właściciel zdecydował 25.09.2026, że aplikacja nie wybiera i nie odzyskuje wielu historycznych profili Gościa. Nie tworzyć selektora, migracji ani UI dla tego syntetycznego przypadku; kanoniczny stan utrzymuje najwyżej jednego bieżącego Gościa, a stary oracle i zgodność ze sztucznymi profilami usuwa PROFILE-05.

## Zadania wykonawcze

| Slice | Cel i zakres | Kryteria i dowód |
| --- | --- | --- |
| `PROFILE-02/A` — done | Router `selectGuest()` ponownie używa wybranego Gościa, inaczej jedynego istniejącego, tworzy profil tylko przy zerze; przy wielu pozostaje zamknięty i zachowuje wszystkie profile. Zachować dual-slot commit, marker instalacji, legacy mapping oraz dokładne ID kont. Zaktualizować wrapper i testy, których oczekiwanie wielokrotnego tworzenia było historyczne. | Powtórne wejście Guest→account A→Guest→account B→Guest i restart zachowuje guest ID/dane oraz odrębne dane A/B. Błąd zapisu rejestru albo weryfikacji markera nie aktywuje obcego scope. Testy router/MMKV/koordynacji, typecheck, privacy/content boundary, Maestro na jednym iPhonie 17 bez resetu; raport, niezależne QA i push `main`. |
| `PROFILE-02/B` — cancelled by owner | Brak implementacji. Nie ma realnych użytkowników, więc nie obowiązuje kompatybilność z syntetycznymi instalacjami zawierającymi wielu historycznych Gości. Aplikacja nie wybiera, nie scala i nie odzyskuje takich profili. | Brak selektora, migracji i fixture wieloprofilowego jako wymagania produktu. Nie przywracać zadania bez nowej decyzji właściciela. |
| `PROFILE-02/C` — READY | Potwierdzić kanoniczny stan najwyżej jednego bieżącego Gościa oraz końcową macierz izolacji i restartu dla Guest/account A/account B. Testować na czystym środowisku; pozostałości starego oracle i syntetycznej kompatybilności kierować do PROFILE-05, po kontroli referencji. | Restart zachowuje właściwego bieżącego Gościa, konta pozostają izolowane, a kod nie zawiera aktywnej ścieżki tworzącej kolejnych Gości dla zgodności historycznej. Testy kontraktowe, bezpieczny dowód Maestro i raport QA. |

**Poza A:** adopcja postępów (`PROFILE-04`), zdalny revoke/sync (`PROFILE-03`) i usunięcie oracle oraz syntetycznej kompatybilności (`PROFILE-05`). Nie powstaje migracja ani odzyskiwanie wielu historycznych Gości.

**Ocena podejścia A przed niezależną walidacją:** zgodność/architektura 0,91; prostota 0,87; ryzyko 0,84; utrzymywalność 0,88; minimum **0,84**. Niezależna walidacja `gpt-6-luna/high` (wyłącznie briefing `Cel / Ustalenia / Podejście`) zaakceptowała wariant: zgodność 0,93; prostota 0,88; ryzyko 0,84; utrzymywalność 0,90; minimum **0,84**. Późniejsza decyzja właściciela usuwa wymaganie kompatybilności z wieloma syntetycznymi profilami; nie zmienia dowodów historycznych A.
