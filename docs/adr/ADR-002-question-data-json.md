# ADR-002 — Question Data as Local JSON

Status: **Accepted**  
Data: 2026-06-26

## Scope note

Ta decyzja pozostaje historycznie poprawna dla pierwszego contentu certyfikacyjnego. W aktualnym modelu Patternly `Question` jest tylko jednym wariantem `TrainingItem`, a lokalne dane powinny docelowo przyjąć postać wersjonowanych content packów per track zgodnie z `docs/04-data-model.md` i `docs/08-storage-and-offline.md`.

## Kontekst

W momencie powstania tej decyzji aplikacja potrzebowała lokalnej bazy pytań egzaminacyjnych dla pierwszego tracka certyfikacyjnego. W MVP nie było backendu ani panelu administracyjnego.

## Decyzja

Pytania w MVP będą przechowywane jako lokalne dane, preferencyjnie w formacie JSON.

## Uzasadnienie

JSON jest:

- prosty,
- łatwy do wersjonowania,
- łatwy do importu w aplikacji,
- czytelny,
- wystarczający dla MVP,
- kompatybilny z TypeScript po walidacji.

## Konsekwencje pozytywne

- szybka implementacja,
- brak backendu,
- łatwy review w repo,
- prosta dystrybucja z aplikacją,
- możliwość działania offline.

## Konsekwencje negatywne

- aktualizacja pytań wymaga aktualizacji aplikacji albo późniejszego mechanizmu remote content,
- brak panelu administracyjnego,
- ryzyko błędów ręcznej edycji JSON,
- potrzeba walidacji danych.

## Minimalne wymagania

Każde pytanie powinno mieć:

- stabilne `id`,
- `domainId`,
- `prompt`,
- `answers`,
- `correctAnswerIds`,
- `explanation.correct`,
- `version`.

## Walidacja

Dane powinny być walidowane przy starcie aplikacji albo na etapie build/test.

Walidacja powinna sprawdzić:

- unikalność ID,
- istnienie poprawnych odpowiedzi,
- poprawność `domainId`,
- brak pustych promptów,
- obecność wyjaśnienia.

## Alternatywy

### SQLite

Może być sensowne później, jeżeli baza pytań urośnie albo potrzebne będą bardziej złożone zapytania.

Niepotrzebne w MVP.

### Remote database

Odrzucone w MVP. Wymaga backendu, sync i decyzji security.

### Hardcoded TypeScript objects

Możliwe, ale JSON jest lepszy jako format contentowy.
