# ODK-E2E-070 — raport wdrożenia szyfrowanego MMKV

Data: 2026-09-06
Status: `FIXED_PENDING_RETEST`

## Ocena rozwiązania przed wdrożeniem

- dopasowanie celu/architektury: 0,88;
- prostota: 0,82;
- kontrola ryzyka: 0,83;
- utrzymywalność: 0,85.

Niezależna walidacja briefu: `APPROVE`, model `gpt-5.6-luna`, reasoning effort `max`. Minimalna ocena 0,82.

Końcowe niezależne QA po poprawkach: `PASS`, model `gpt-5.6-luna`, reasoning effort `max`; poprawność 0,88, spójność architektury 0,86, kontrola ryzyka 0,82, utrzymywalność 0,84. Brak otwartych P1/P2 w implementacji; osobno pozostaje jawny device-E2E gap.

## Zmiany

### 070-A — klucz i manifest

- Klucz AES-256 jest generowany z kryptograficznie losowych 24 bajtów i zapisywany wyłącznie w SecureStore z `WHEN_UNLOCKED_THIS_DEVICE_ONLY`.
- Dwa naprzemienne manifesty mają generację, checksum i obowiązkowy read-back.
- Brak klucza, awaria SecureStore, uszkodzony manifest, niepełna migracja i błąd cleanupu są typowanymi błędami fail-closed.

### 070-B — migracja legacy

- Pełny plaintextowy store `patternly` jest kopiowany do szyfrowanego slotu, weryfikowany, aktywowany i zaszyfrowany in-place jako kwarantanna przed `ready`.
- Kwarantanna jest usuwana dopiero po kolejnym cold start i sprawdzeniu markera transferu.
- Przerwane zapisy manifestu wznawiają migrację bez utraty legacy.

### 070-C — rotacja

- Żądanie rotacji uruchamia przy następnym bootstrapie migrację A/B z nowym kluczem.
- Stary slot i klucz pozostają do następnego cold start, po czym są usuwane dopiero po weryfikacji nowego aktywnego slotu.

### 070-D — utrata klucza

- Bootstrap przekazuje typowany kod utraty klucza do istniejącego `ContentPreparationGate`.
- Bezpieczne `Spróbuj ponownie` niczego nie zapisuje ani nie usuwa.
- Usunięcie niedostępnych danych wymaga osobnego potwierdzenia z informacją o bezpowrotnej utracie niewysłanych sesji i postępu gościa.
- Operacja usuwa oba sloty, legacy/kwarantannę, manifesty i klucze magazynu; nie usuwa osobnej sesji Firebase Auth.

### 070-E — backup

- Zachowano istniejącą politykę wykluczającą cały katalog MMKV z backupu i transferu urządzenia na iOS oraz Androidzie.
- SecureStore używa klucza tylko dla tego urządzenia.

## Pliki ODK-070

- `src/infrastructure/storage/encryptedStorageBootstrap.ts`
- `src/infrastructure/storage/encryptedStorageNative.ts`
- `src/infrastructure/storage/mmkvClient.ts`
- `src/storage/repositories/canonicalRepositories.ts`
- `src/application/bootstrap/applicationBootstrap.ts`
- `src/content/application/ContentPreparationGate.tsx`
- `src/locales/en/common.json`
- `src/locales/pl/common.json`
- `src/infrastructure/storage/encryptedStorageBootstrap.test.ts`
- `src/content/application/contentPreparationRecovery.test.ts`
- `src/storage/repositories/storageCutover.test.ts`
- `scripts/checkRecoveryBaseline.mjs`

## Weryfikacja

- `npm run qa:static`: PASS — 460 testów, typecheck, recovery baseline, content boundary i runtime privacy boundary.
- Testy szyfrowanego bootstrapu: PASS 7/7 — fresh install, migracja, przerwania, rotacja, utrata klucza/corrupt manifest, marker końcowy i reset.
- Testy storage/recovery/backup: PASS 11/11.
- `git diff --check`: PASS.
- Natywna kompilacja iOS poza sandboxem poprawnie zbudowała m.in. `MMKVCore`, `ExpoSecureStore` i zależności; pełny cold build został przerwany po kilku minutach bez błędu ODK-070, aby nie blokować kolejnych zadań. Nie jest liczony jako PASS.

## Ryzyka i retest

- Na fizycznym iOS trzeba potwierdzić migrację rzeczywistego legacy, cold restart, zmianę klucza, utratę wpisu Keychain oraz świadome usunięcie.
- Reinstall/restore należy sprawdzić na urządzeniu, ponieważ zachowanie wpisów Keychain po reinstalacji jest kontrolowane przez system; kod nie wykonuje ukrytego resetu przy niejednoznacznym braku artefaktów.
- Pełna natywna kompilacja pozostaje do powtórzenia jako istniejący release gate.

## Następne zadanie

`ODK-E2E-068` zgodnie z kolejnością realizacji.
