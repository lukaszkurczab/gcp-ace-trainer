# Algorithm Session — Approach Primer item

## Do zmiany

### Utworzyć wariant itemu

Ten wariant służy do krótkiego wprowadzenia do podejścia / patternu przed właściwymi ćwiczeniami.

Nie powinien wyglądać jak ekran definicji z dokumentacji. Ma być kompaktowy, praktyczny i bez nadmiaru treści.

## Design

/Users/lukaszkurczab/Desktop/Projects/GCP/docs/designs/algorithm_session_approach_primer

## Finalny układ

Od góry:

Header - wspólny header ekranu Algorithm Session.

Progress - pojedynczy progress aktualnej sesji.

Item type label:

- `APPROACH PRIMER`

Title - nazwa podejścia, np.:

- `Hash Map Lookup`
- `Two Pointers`
- `Sliding Window`
- `Prefix Sums`
- `Stack for Nested Structures`

Key idea card - krótka definicja praktyczna, np.:

`Store what you have already seen so future lookups are fast.`

When it applies - sekcja z 2–4 sygnałami, np.:

- need fast lookup
- matching complements
- frequency counting
- seen before / duplicate detection

Core invariant - jedna krótka zasada, np.:

`At each step, the map contains values from earlier indices only.`

Common mistake - jedna karta ostrzegawcza, np.:

`Do not store the current value before checking the complement if the same index cannot be reused.`

Visual pattern card - mały schemat, np.:

`value → index`

Primary CTA:

- `Try a Quick Check`

## Uwagi UX

Approach Primer ma przygotować użytkownika do ćwiczenia, nie zastępować pełnej lekcji.

Wariant powinien być spokojny, premium i techniczny, ale nie gęsty jak dokumentacja.
