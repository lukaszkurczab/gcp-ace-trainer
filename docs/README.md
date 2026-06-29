# Patternly — dokumentacja

Status: **draft v0.1**  
Zakres: **cała aplikacja**  
Kontekst: prywatne narzędzie treningowe do przygotowania do certyfikacji Google Cloud Associate Cloud Engineer.

## Cel dokumentacji

Ten folder jest głównym miejscem decyzji produktowych, architektonicznych i projektowych dla aplikacji **Patternly**.

Dokumentacja ma służyć jako:

- punkt odniesienia przy implementacji,
- baza dla decyzji architektonicznych,
- opis stylu wizualnego i komunikacji,
- kontrakt między produktem, UI i kodem,
- zabezpieczenie przed rozrostem zakresu MVP.

## Struktura

```txt
docs/
  00-overview.md
  01-product-definition.md
  02-architecture.md
  03-navigation-and-flows.md
  04-data-model.md
  05-design-system.md
  06-branding-and-style-direction.md
  07-content-guidelines.md
  08-storage-and-offline.md
  09-security-and-privacy.md
  10-roadmap.md
  11-implementation-guidelines.md
  12-testing-strategy.md
  13-risk-register.md

  adr/
    ADR-001-local-first-mvp.md
    ADR-002-question-data-json.md
    ADR-003-no-auth-in-mvp.md
    ADR-004-light-first-dark-ready-ui.md
```

## Główne decyzje

1. Aplikacja w MVP jest **local-first/offline-first**.
2. Nie ma backendu, kont użytkownika ani synchronizacji.
3. Stack aplikacji: **Expo / React Native / TypeScript**.
4. Pytania egzaminacyjne są dostarczane jako lokalne dane, preferencyjnie JSON.
5. UI ma być minimalistyczny, spokojny i techniczny: **calm exam simulator**.
6. Aplikacja nie może sugerować oficjalnej afiliacji z Google.
7. Wspólne style i komponenty powinny żyć w design systemie, nie w jednorazowych stylach ekranów.

## Najważniejsza zasada produktu

Aplikacja ma pomagać użytkownikowi lepiej przygotować się do egzaminu, nie budować pełną platformę e-learningową.

Każda funkcja powinna przejść przez pytanie:

> Czy ta funkcja realnie poprawia trening, diagnozę błędów albo gotowość egzaminacyjną?

Jeżeli nie, nie trafia do MVP.
