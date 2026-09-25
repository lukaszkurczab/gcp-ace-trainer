# ODK-117-A1 — runtime locale resolver

**Status:** `done` / niezależne QA `PASS WITH ISSUES`

**Data odbioru:** 25 września 2026

**Zakres:** lokalny runtime locale oraz ekran ustawień na istniejącym iPhonie 17; bez wdrożenia, zmiany profilu i zapisu preferencji podczas dowodu urządzeniowego.

## Kontrakt

- Jeden `resolveLocale(preference, systemLocale)` obsługuje targety `pl/en/de/fr/es/it/et`. Dostępne tłumaczenia aplikacji pozostają EN/PL; pozostałe targety zwracają jawny `translation_unavailable` i tymczasowy EN.
- Regionalne i różnie zapisane tagi są kanonizowane. Nieznane lub błędne tagi zwracają `system_locale_unrecognized` zamiast cichego fallbacku.
- Storage preferencji pozostaje `system|en|pl`; ekran oferuje tylko System, English i Polish.
- i18next ma `fallbackLng: false` oraz `fallbackNS: false`.

## Bezpieczny fixture odbiorowy

Stan `account-remote-revoke-pending` blokował zwykłą nawigację bez bezpiecznego sposobu przejścia do Home. Nie ponawiano revoke, nie wybierano Gościa i nie czyszczono stanu. Dodano dokładny deep link `com.lkurczab.patternly://audit/show-language-settings`, dostępny wyłącznie przy `__DEV__` i runtime `smoke`.

Komenda renderuje ten sam produkcyjny `LanguageSettingsScreen` w natywnym stacku. Event ustawia wyłącznie lokalny stan prezentacyjny nawigatora; nie wywołuje `setLanguage`, operacji konta, profilu ani storage. Parser odrzuca inne środowiska, ścieżki i dodatkowe parametry.

## Dowód urządzeniowy

- Urządzenie: istniejący iPhone 17 `7F315654-3175-4F3C-BB24-B0263F59360C`, 402×874, tekst `large`.
- Na czas dowodu system ustawiono odwracalnie na `de-DE / de_DE`. Nie dotknięto preferencji aplikacji; English pozostał zaznaczony.
- Końcowy flow Maestro `/tmp/patternly-odk117-a1.yaml` zakończył się terminalnym PASS: deep link oraz pięć asercji `COMPLETED`, w tym pełny komunikat „System, Your device language is DE. System will use English until its translation is available.” i selektory System/EN/PL.
- Prywatny screenshot i hierarchy z tego samego stanu zostały obejrzane. Treść nie jest ucięta; trzy opcje są widoczne, EN ma stan selected, a wiersze mają role radio.
- Po odbiorze przywrócono `pl-PL / pl_PL / large` i uruchomiono tę samą aplikację. Bez `clearState`, reinstalacji i drugiego urządzenia.
- Screenshot/logi pozostają poza repo i nie zawierają danych logowania.

## Weryfikacja

- `node --import tsx --test src/navigation/languageSettingsAuditCommand.test.ts src/preferences/localeResolver.test.ts src/preferences/settingsPresentation.test.ts src/i18n/i18nLocaleParity.test.ts` — PASS, 29/29.
- `npm run typecheck` — PASS.
- `git diff --check` — PASS.
- Niezależne QA: `PASS WITH ISSUES`. Hierarchy pokazuje role radio oraz selected, ale nie eksponuje osobnego węzła `radiogroup`; rola grupy jest przypięta w produkcyjnym JSX i teście źródłowym. To ograniczenie dowodu, nie blocker.

## Granice wyniku

A1 nie dodaje produkcyjnych tłumaczeń DE/FR/ES/IT/ET i nie odbiera A2–A5. Historyczny mieszany commit `9330fcef` zawierał też AUD-04-D i nie był sam w sobie dowodem PASS; bieżący osobny commit domyka fixture, device evidence, raport i plan bez przepisywania historii.

Briefing fixture’a: zgodność `0,92`, prostota `0,84`, ryzyko `0,86`, utrzymywalność `0,85`; minimum `0,84`.
