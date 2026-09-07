# Uproszczenie Terms of Service i Privacy Policy

Data: 2026-09-06

## Wynik

Zgodnie z decyzją product ownera usunięto rozbudowane profile, manifesty,
walidatory, hashe, atestacje i testy dokumentów. Implementacja składa się z
jednego pliku zmiennych, dwóch dokumentów oraz dwóch ekranów mobilnych.

## Zmiany

- `src/legal/legalVariables.ts` jest jedynym miejscem uzupełniania danych;
- `src/legal/termsOfService.ts` zawiera pełny tekst Terms EN/PL;
- `src/legal/privacyPolicy.ts` zawiera pełny tekst Privacy EN/PL;
- ekrany Terms i Privacy są dostępne z rejestracji oraz Settings;
- wsparcie i publiczne usuwanie konta nadal używają zewnętrznych adresów;
- usunięto legalne walidatory, release gate, hashe, atestacje, profile,
  manifesty i testy dokumentów;
- nie odtworzono plików usuniętych ręcznie przez product ownera.

## Weryfikacja

- niezależny QA implementacji: `PASS`;
- niezależny przegląd treści PL/UE: `APPROVE` 0,98;
- `npm run typecheck`: PASS;
- pełne istniejące testy: 801/801 PASS;
- `git diff --check`: PASS.

## Ryzyka i blokery

- znaczniki `[DO UZUPEŁNIENIA]` w `legalVariables.ts` muszą zostać zastąpione
  prawdziwymi danymi przed publikacją;
- zgodnie z decyzją PO repo nie blokuje automatycznie publikacji niepełnych
  dokumentów;
- prywatne RoPA, DPA, LIA, TIA, TOM i screening DPIA oraz rzeczywiste procesy
  retencji, praw użytkownika i bezpieczeństwa pozostają odrębnymi obowiązkami.

## Następne zadanie

Uzupełnienie finalnych zmiennych oraz minimalnych prywatnych dokumentów
governance w ODK-E2E-073, ODK-E2E-076 i ODK-E2E-079.
