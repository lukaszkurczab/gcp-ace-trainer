# ADR-003 — No Auth in MVP

Status: **Superseded for public launch by PO-036 and PO-040 (2026-08-08)**
Data: 2026-06-26

> Historical decision for the earlier MVP scope. The current repository still
> implements much of this historical local-only model. The target is guest-first:
> registration does not block first learning value, but verified identity is
> required for Premium, sync, restore and cross-device continuity. The replacement
> account/data architecture is now normative in
> [`../canonical-product-contract.yaml`](../canonical-product-contract.yaml)
> and reflected by the implemented account/data architecture. This ADR must
> not be used to omit account work or to describe the historical local-only
> scope as the public-launch target or to add an account wall before first value.

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
