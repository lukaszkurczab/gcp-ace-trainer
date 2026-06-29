# ADR-001 — Local-first MVP

Status: **Accepted**  
Data: 2026-06-26

## Scope note

Decyzja `local-first/offline-first` pozostaje aktywna dla Patternly. Oryginalny kontekst GCP ACE poniżej jest historycznym kontekstem pierwszego tracka, a nie aktualnym zakresem całego produktu. Aktualny produkt jest wielotrackowy zgodnie z `docs/00-overview.md` i `docs/01-product-definition.md`.

## Kontekst

W momencie powstania tej decyzji Patternly było prowadzone jako prywatne narzędzie treningowe do przygotowania do egzaminu Google Cloud Associate Cloud Engineer.

Core MVP obejmuje:

- pytania,
- odpowiedzi,
- sesje,
- review,
- progress,
- ustawienia.

Żadna z tych funkcji nie wymaga backendu w pierwszej wersji.

## Decyzja

MVP aplikacji działa jako **local-first/offline-first**.

Nie dodajemy backendu, kont użytkownika ani synchronizacji w MVP.

## Uzasadnienie

Local-first zmniejsza:

- złożoność implementacji,
- liczbę decyzji infrastrukturalnych,
- koszt utrzymania,
- ryzyko błędów synchronizacji,
- powierzchnię problemów prywatności,
- zależność od internetu.

Dla prywatnej aplikacji treningowej lokalny storage wystarcza do obsługi core loopu.

## Konsekwencje pozytywne

- aplikacja działa offline,
- szybciej powstaje MVP,
- prostsza architektura,
- mniej zależności,
- łatwiejsze testowanie,
- brak auth flow,
- brak zdalnej bazy użytkowników.

## Konsekwencje negatywne

- brak synchronizacji między urządzeniami,
- brak backupu w chmurze,
- utrata danych po odinstalowaniu aplikacji,
- brak zdalnego zarządzania kontentem.

## Alternatywy

### Firebase od początku

Odrzucone dla MVP.

Powód:

- niepotrzebna złożoność,
- brak natychmiastowej wartości dla core loopu,
- wymaga decyzji auth/sync/security.

### Custom backend

Odrzucone.

Powód:

- całkowicie nadmiarowe dla MVP.

### Local-first z późniejszym export/import

Akceptowalne jako kolejny etap po MVP.

## Warunek zmiany decyzji

Decyzja może zostać ponownie otwarta, jeżeli pojawi się wymaganie:

- synchronizacji między urządzeniami,
- backupu,
- publicznego konta użytkownika,
- zdalnej aktualizacji pytań,
- płatności,
- web dashboardu.
