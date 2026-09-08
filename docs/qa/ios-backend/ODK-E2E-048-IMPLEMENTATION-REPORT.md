# ODK-E2E-048 — raport discovery i weryfikacji

Status: VERIFIED_CLOSED

## Wynik

Zweryfikowano cały ekran Your data względem frontendowego storage, synchronizacji, backendowego eksportu, adopcji, resetu, usunięcia konta i polityki retencji. Szczegóły są w [ODK-E2E-048-DATA-TRUTH-INVENTORY.md](./ODK-E2E-048-DATA-TRUTH-INVENTORY.md).

Potwierdzono cztery grupy rozbieżności. Każda ma osobne zadanie 105–108. ODK104 pozostaje osobnym błędem lokalizacji. W ramach 048 nie zmieniono copy ani UI.

## Walidacja briefu

Niezależny `gpt-5.6-luna / max`, bez narzędzi:

- zgodność celu i architektury: 0,98;
- prostota: 0,96;
- ryzyko: 0,95;
- utrzymywalność: 0,97;
- minimum: 0,95;
- werdykt: APPROVE.

## Sprawdzone pliki i przepływy

Sprawdzono `YourDataScreen`, locale data EN/PL, `accountDataRepository`, `accountDataService`, account export service i DTO, API adapter, reset lokalny, account deletion, backend data export i account lifecycle oraz Privacy Policy.

## E2E i dowód wizualny

- authenticated: `evidence046-current/2026-09-08_060938`, ekran Your data z aktualnym copy przed zmianą samego headera 047;
- guest: `evidence046-data-final/2026-09-08_063323`, 12/12 `COMPLETED`;
- guest EN/PL po zmianie headera: `evidence047/2026-09-08_063845`, 28/28 `COMPLETED`;
- obejrzano zrzuty Settings, Your data, szczegółów oraz wariant EN/PL.

Dowody potwierdzają treść boxa, brak lokalnej akcji resetu i osobny problem surowych kluczy ODK104.

## Testy i ograniczenia

048 jest zadaniem odczytowym. Nie dodano kodu produktu. Wspólna brama po zmianach 045/047: `qa:static` 885/885 PASS przed zmianą 047; test 047 17/17 PASS i typecheck PASS po zmianie.

Nie wykonano eksportu ani usunięcia danych na urządzeniu, ponieważ discovery sprawdzało kontrakty bez mutacji. Nie wykonano VoiceOver. Główne urządzenie konta wymaga ponownego logowania; użyto zachowanego dowodu authenticated oraz osobnego symulatora gościa.
