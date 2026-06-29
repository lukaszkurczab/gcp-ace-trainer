# ADR-004 — Light-first, Dark-ready UI

Status: **Accepted**  
Data: 2026-06-26

## Kontekst

Aplikacja ma być spokojnym narzędziem treningowym. Użytkownik będzie czytał dłuższe pytania i wyjaśnienia na ekranie mobilnym.

## Decyzja

UI będzie projektowany jako **light-first**, ale architektura theme będzie przygotowana pod dark mode.

## Uzasadnienie

Light-first jest dobrym kierunkiem dla aplikacji edukacyjnej i czytelniczej. Dłuższe treści, pytania i wyjaśnienia są łatwe do skanowania na jasnym tle.

Jednocześnie tokenizacja theme pozwoli dodać dark mode później bez przebudowy komponentów.

## Konsekwencje pozytywne

- szybka spójna implementacja,
- dobra czytelność,
- mniej decyzji wizualnych na starcie,
- możliwość dodania dark mode później,
- brak hardcoded color values w ekranach.

## Konsekwencje negatywne

- dark mode nie jest finalizowany w MVP,
- trzeba pilnować tokenów theme,
- komponenty muszą używać semantycznych kolorów.

## Zasady

Nie kodować kolorów bezpośrednio w ekranach.

Źle:

```tsx
color: '#2563EB'
```

Dobrze:

```tsx
color: colors.primary
```

Jeszcze lepiej, jeżeli zostanie dodana semantyka:

```tsx
color: theme.colors.actionPrimary
```

## Minimalna paleta

- background,
- surface,
- textPrimary,
- textSecondary,
- border,
- primary,
- success,
- warning,
- error.

## Warunek zmiany decyzji

Dark mode może wejść do MVP tylko wtedy, gdy podstawowy design system i flow aplikacji są już stabilne.
