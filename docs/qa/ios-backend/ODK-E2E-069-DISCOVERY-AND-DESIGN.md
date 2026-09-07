# ODK-E2E-069 — decyzja zakresowa

Status: `SUPERSEDED_BY_PO_DECISION`

## Decyzja

Product owner zdecydował 2026-09-06, że usuwanie konta odbywa się wyłącznie z poziomu aplikacji. Odrzucono publiczny formularz, link email i ekran WWW usuwania. Nie powstaje nowe UI.

## Uzasadnienie

Aplikacja ma już kanoniczny przepływ: świeżą reautoryzację, świadome potwierdzenie przez przytrzymanie, operację backendową, lokalne czyszczenie, wznowienie po błędzie oraz dowód usunięcia. Drugi publiczny kanał zwiększałby powierzchnię ataku i złożoność destrukcyjnej operacji bez potrzeby produktowej.

## Zakres techniczny

- usunąć publiczne endpointy inicjowania i potwierdzania usunięcia oraz ich nieużywaną logikę domenową;
- usunąć publiczny link usuwania i `publicDeletionUrl` z aplikacji;
- zachować endpoint dowodu i statusu operacji, ponieważ aplikacja potrzebuje ich po usunięciu konta Firebase, gdy nie ma już tokenu uwierzytelniającego;
- poprawić Warunki i Politykę prywatności tak, aby wskazywały wyłącznie przepływ in-app;
- Google Workspace SMTP Relay podłączyć tylko do publicznych wniosków prywatności z ODK-E2E-077.

## Ocena

- Dopasowanie do celu i architektury: `0.95`.
- Prostota: `0.94`.
- Kontrola ryzyka: `0.93`.
- Utrzymywalność: `0.92`.

Minimalna ocena: `0.92`.
