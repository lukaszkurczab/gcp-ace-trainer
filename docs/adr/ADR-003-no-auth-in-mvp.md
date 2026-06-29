# ADR-003 — No Auth in MVP

Status: **Accepted**  
Data: 2026-06-26

## Kontekst

Aplikacja jest prywatnym narzędziem treningowym. Core funkcje nie wymagają konta użytkownika.

## Decyzja

MVP nie zawiera logowania, rejestracji ani kont użytkownika.

## Uzasadnienie

Auth jest potrzebny, gdy aplikacja ma:

- synchronizację,
- backup,
- płatności,
- personalizację między urządzeniami,
- dane serwerowe,
- publiczny profil.

MVP nie wymaga tych funkcji.

## Konsekwencje pozytywne

- prostszy onboarding,
- mniej tarcia,
- szybszy start sesji,
- brak problemów z hasłami/tokenami,
- brak backendu auth,
- mniej ryzyk prywatności.

## Konsekwencje negatywne

- brak synchronizacji,
- brak backupu,
- brak kont użytkowników,
- brak łatwej migracji między urządzeniami.

## Alternatywy

### Firebase Auth

Odrzucone w MVP.

Powód:

- zależność infrastrukturalna,
- brak wartości dla core loopu,
- wymaga dodatkowej obsługi danych użytkownika.

### Anonymous auth

Odrzucone w MVP.

Powód:

- rozwiązuje problem, którego jeszcze nie mamy,
- nadal wprowadza złożoność.

## Warunek zmiany decyzji

Auth można rozważyć, gdy zostanie dodane:

- cloud sync,
- backup,
- płatności,
- publiczna wersja aplikacji,
- zdalna personalizacja.
