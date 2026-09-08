# ODK-E2E-007 — Recovery codes bez kontekstu tożsamości

Data: 2026-09-07. Status: `VERIFIED_CLOSED`.

## Stan wejściowy i walidacja

Czysty `main`, po fetch równy `origin/main`: `05e61bade20e5d128d36c3e224bfbc851b8367f1`. Brak istniejących zmian użytkownika. Przeczytano rejestr i repozytoryjne AGENTS.md.

Niezależny walidator briefu, bez narzędzi i inspekcji: **gpt-5.6-luna / max**. Zgodność celu/architektury 0,99; prostota 0,99; ryzyko 0,95; utrzymywalność 0,96; minimum **0,95 — zatwierdzono**.

## Zakres i kod

Sprawdzono AccountSecurityScreen, SettingsTab, settingsAccountPresentation, AccountSessionProvider, Firebase auth client, settingsPresentation.test.ts, accountCommandGuards.test.ts, recoveryCodeClipboard.test.ts, locale EN/PL, package.json, konfigurację Expo/Metro, istniejące flows Maestro i raporty 003.1/004/006.

`src/features/account/AccountSecurityScreen.tsx`: warunek prezentacji tożsamości pomija tryb recovery. Pozostałe tryby pozostają do ODK-E2E-012 zgodnie z kolejnością. Główne Settings zachowuje własną prezentację. Nie usunięto importów ani kluczy locale: user nadal obsługuje uid/providers, a wspólne klucze są używane w innych trybach. Generowanie kodów i autoryzacja pozostają bez zmian.

## Potwierdzona historyczna regresja testu

Pierwszy przebieg: **31/32 pass**. Test dodany/wzmocniony w 05e61ba oczekiwał `Systemowy`, podczas gdy istniejący polski słownik zawiera `System`. Zakres 004 nie wymagał zmiany tej etykiety. Poprawiono oczekiwanie w `src/preferences/settingsPresentation.test.ts`, zachowując macierz opisów i brak opisów EN/PL.

Osobna niezależna walidacja **gpt-5.6-luna / max**: zgodność 0,98; prostota 0,99; ryzyko 0,97; utrzymywalność 0,98. Minimum wyliczone przez kontrolera **0,97** (walidator omyłkowo nazwał 0,98 oceną łączną). Zatwierdzono.

## Weryfikacja

Node z `/opt/homebrew/opt/node@22/bin`:

- `node --import tsx --test src/preferences/settingsPresentation.test.ts src/application/account/accountCommandGuards.test.ts src/infrastructure/security/recoveryCodeClipboard.test.ts`: po korekcie **32/32 pass**, zero skipped.
- `npm run typecheck`: **pass**, exit 0.
- Retest iOS/Maestro: **pass**, exit 0, flow `007-recovery-point.yaml`, run `2026-09-07_224930`, 11 komend, 2 screenshoty. EN/dark, standardowy tekst, iPhone 17/iOS 26.4. Kontroler obejrzał oba pełne zrzuty: Settings z tożsamością, Recovery bez tożsamości, z opisem, polem hasła i przyciskiem generowania. Pierwsze przejście zatrzymane przy logowaniu, przed Recovery. Ustalono, że debug build używał innego Metro na 8081; skonfigurowano izolowane Metro 28083. Nie zaliczono tego przebiegu jako retestu poprawki.

Dowody tymczasowe: `/private/tmp/patternly-path03`, do usunięcia po zakończeniu i pushu ścieżki 007–012. Testowe Firebase Auth 29199, Firestore 38181, backend 28084; bez SMTP/providerów produkcyjnych. Istniejący emulator na 28181 pozostawiono nienaruszony.

## Ryzyka i blokery

Brak decyzji PO wymaganej dla tej zmiany; licznik próśb PO: 0. Po udanym retescie usunięto zadanie z aktywnej tabeli. Brama regresji całej ścieżki i push jeszcze niewykonane. VoiceOver pominięty na polecenie właściciela.

## Uwagi wykonawcze retestu

Nowy debug bundle potwierdzony w Metro 28083 (1671 modułów). Wymagany start `xcrun simctl launch <UDID> com.lkurczab.patternly -RCT_jsLocation localhost:28083`; serwer nasłuchuje IPv6 localhost. Stary flow oczekiwał nieaktualnego `account-entry-continue`, podczas gdy zdrowe konto ma `account-open-settings`. iOS nie udostępnił etykiety systemowego „Not Now” Maestro: zamknięto widoczny alert po współrzędnych 32%,62%. Próba z 62.5% została odrzucona przez parser Maestro; poprawiono wyłącznie format flow. Żadnej z nieudanych prób przygotowawczych nie zaliczono jako dowodu poprawki. Nie generowano nowych kodów — zakres 007 dotyczy wyłącznie usunięcia informacji z prezentacji.
