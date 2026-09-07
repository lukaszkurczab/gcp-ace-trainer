# ODK-E2E-004 — Settings: Language

Data raportu: 2026-09-07
Status: `VERIFIED_CLOSED`.

## Ocena i zakres

- Walidator briefu: `gpt-5.6-luna`, effort `max`; oceny cel/architektura **0,93**, prostota **0,82**, ryzyko **0,81**, utrzymywalność **0,84**; minimum **0,81 — APPROVE**.
- Sprawdzono `AppPreferencesProvider`, repozytorium ustawień, model i ekran Language, `ChoiceRow`, locale EN/PL oraz testy prezentacji/persystencji.

## Zmiana

Provider udostępnia teraz osobny, tylko do odczytu `deviceLocale`. Wybrany język aplikacji nadal steruje `locale`, a wybór `system` nadal używa locale urządzenia. Jedynie opis opcji System jest tłumaczony z `deviceLocale`; English i Polish nie renderują opisu. Usunięto również nieużywane klucze `languageEnglishDetail` i `languagePolishDetail`. Kontrakt zapisu `LanguagePreference` nie zmienił się.

## Retest i wyniki

Na izolowanym iPhone 17 / iOS 26.4 zweryfikowano cztery kombinacje: urządzenie PL + aplikacja EN/PL daje `Użyj języka urządzenia.`, urządzenie EN (`AppleLanguages=en-US`, `AppleLocale=en_US`) + aplikacja PL/EN daje `Follow your device language.`. W obu językach brak redundantnych opisów. Kill/launch po wyborze EN zachował wybór i poprawny opis System. Pierwsza próba zmiany samego `AppleLanguages` wykazała, że faktycznym locale pozostawało `AppleLocale=pl_PL`; po ustawieniu obu faktów i restarcie macierz przeszła.

- Testy celowane wspólne dla ścieżki: **46/46**.
- `npm run qa:static`: **pass**; recovery **352 source / 159 tests / 845 cases**, pełny zestaw **850/850**, oba boundary checks **pass**.
- Regresje/blokery: brak.
