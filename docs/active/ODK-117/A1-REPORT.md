# ODK-117-A1 — runtime locale resolver

**Status:** `WAIT/DEVICE`; niezależne QA `BLOCKED` wyłącznie na wymaganym dowodzie Maestro ekranu ustawień. Nie oznaczać jako PASS. Kod i raport zostały omyłkowo wypchnięte w mieszanym commicie `9330fcef`; ten commit nie jest odbiorem A1.
**Zakres:** jeden kontrakt runtime locale, rozpoznawanie locale systemowego i jawna prezentacja tymczasowego EN. Bez zmian storage, legal, backendu ani A2–A5.  
**Model implementacji:** GPT-6 Luna Medium.

## Zmiana

- Dodano czysty `resolveLocale(preference, systemLocale)` oraz listę targetów `pl/en/de/fr/es/it/et`. Kontrakt zwraca `requestedLocale`, `effectiveLocale` i `reason` (`translation_available`, `translation_unavailable` lub `system_locale_unrecognized`). Locale regionalne i wielkość liter są kanonizowane; malformed i nieznane tagi dają jawny wynik `system_locale_unrecognized` i efektywne `en`.
- `AppPreferencesProvider` korzysta z resolvera zarówno dla wybranej preferencji, jak i dla opcji System w ustawieniach. `deviceLocale` nadal oznacza dostępny język EN/PL; `localeResolution` opisuje aktualny wybór, a `systemLocaleResolution` działanie opcji System.
- Magazyn preferencji pozostaje `system|en|pl`, a domyślną wartością pozostaje `en`. Ekran nadal oferuje wyłącznie System, English i Polish. Dla targetu bez tłumaczenia System pokazuje jawnie, że tymczasowo użyje English; nierozpoznany tag ma osobny tekst.
- i18next ma `fallbackLng: false` i `fallbackNS: false`; brak klucza nie jest po cichu uzupełniany innym locale/namespace.

## Weryfikacja

- `node --import tsx --test src/preferences/localeResolver.test.ts src/preferences/settingsPresentation.test.ts src/i18n/i18nLocaleParity.test.ts` — PASS, 27/27.
- `npm run typecheck` — PASS.
- `git diff --check` — PASS.
- Testy obejmują siedem targetów, regionalne/case warianty, błędne i nieznane tagi, ręczne EN/PL, dostępne opcje ustawień oraz brak cichego fallbacku klucza.

## Ograniczenia

Nie wykonano Maestro ani ręcznego sprawdzenia renderu. Jedyny iPhone 17 pozostaje na `account-remote-revoke-pending`, który blokuje dojście do Home/Language settings; tego stanu nie usuwano ani nie przejmowano. QA potwierdził 27/27, typecheck, diff check, storage compatibility i brak ukrytego fallbacku, lecz wymaga rzeczywistego zrzutu widocznego komunikatu System przed akceptacją A1. Nie tworzono zrzutów ani nie wykonywano wdrożenia. Wspólny commit `9330fcef` zawiera również AUD-04-D i narusza pierwotną granicę selektywnego commitu; historii `main` nie przepisywano, a oba zadania pozostają nieodebrane.
