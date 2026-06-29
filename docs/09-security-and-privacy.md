# 09 — Security and Privacy

## Status dokumentu

Ten dokument opisuje zasady bezpieczeństwa, prywatności i zgodności contentowej dla wielotrackowej aplikacji treningowej.

Aplikacja nie jest produktem Google, LeetCode ani żadnej innej platformy egzaminacyjnej lub coding-practice. W MVP działa lokalnie, bez kont użytkowników, backendu i synchronizacji.

Dokument jest spójny z modelem:

```txt
app → track → session mode → training item → attempt → feedback/result → progress
```

## Cel

Celem security/privacy w MVP jest ograniczenie powierzchni ryzyka, a nie budowanie ciężkiej infrastruktury bezpieczeństwa.

MVP powinno spełniać trzy zasady:

1. Dane użytkownika zostają lokalnie na urządzeniu.
2. Aplikacja nie zbiera danych, których nie potrzebuje do działania treningu.
3. Content nie narusza praw właścicieli platform, egzaminów ani baz zadań.

## Zakres tracków

W MVP dokumentacja zakłada co najmniej dwa tracki:

- `cloud-certification` — przygotowanie do certyfikacji technicznych, np. GCP ACE-style learning,
- `algorithms` — LeetCode-style / algorithmic problem-solving practice.

Tracki mogą mieć różne typy contentu, ale zasady prywatności i bezpieczeństwa są wspólne.

## Dane użytkownika w MVP

Aplikacja może przechowywać lokalnie:

- aktywny track,
- ustawienia aplikacji,
- ustawienia tracków,
- historię sesji,
- próby użytkownika,
- odpowiedzi / wybory użytkownika,
- wyniki sesji,
- statusy training itemów,
- review queue,
- progres globalny,
- progres per track,
- metadane content version użyte przy próbach.

Przykładowe dane lokalne:

```ts
{
  activeTrackId: 'algorithms',
  sessions: TrainingSession[],
  attempts: TrainingAttempt[],
  itemStates: UserItemState[],
  reviewQueue: ReviewQueueItem[],
  progress: UserProgress,
  contentMetadata: TrackContentMetadata[]
}
```

## Dane, których MVP nie potrzebuje

W MVP nie zbieramy:

- imienia,
- nazwiska,
- e-maila,
- konta Google,
- konta LeetCode,
- konta GitHub,
- lokalizacji,
- kontaktów,
- zdjęć,
- danych płatniczych,
- identyfikatorów reklamowych,
- tokenów OAuth,
- danych zawodowych użytkownika,
- historii przeglądania,
- clipboardu,
- treści zewnętrznych kont użytkownika.

## Dane szczególnie wrażliwe na nadmiarowe zbieranie

Aplikacja nie powinna zbierać pełnych freeform odpowiedzi użytkownika, jeżeli wystarcza zapis strukturalny.

Dla Algorithms zamiast zapisywać długie notatki użytkownika domyślnie, preferujemy:

```ts
{
  selectedStrategyId: 'two-pointers',
  selectedComplexity: 'O(n)',
  mistakeTypes: ['wrong_pattern', 'missed_edge_case'],
  confidence: 3
}
```

Freeform notes mogą być dodane później, ale powinny być lokalne i możliwe do usunięcia.

## Brak backendu w MVP

Brak backendu oznacza:

- brak centralnej bazy użytkowników,
- brak logowania,
- brak auth,
- brak synchronizacji,
- brak zdalnej analityki,
- brak serwerowego profilu użytkownika,
- brak serwerowego przechowywania prób,
- brak zdalnego pobierania prywatnych danych.

To ogranicza ryzyko wycieku danych, ale nie zwalnia z obowiązku lokalnego resetu danych i jasnej komunikacji prywatności.

## Podstawowa zasada prywatności

```txt
Your training data stays on this device.
```

W polskiej wersji:

```txt
Twoje dane treningowe zostają na tym urządzeniu.
```

Jeżeli później zostanie dodana synchronizacja, wymaga to osobnego ADR oraz aktualizacji polityki prywatności.

## Content data vs user data

Należy rozdzielać dwa typy danych.

### Static content data

Statyczny content to:

- training itemy,
- odpowiedzi,
- wyjaśnienia,
- taxonomy,
- track metadata,
- content version.

Content może być bundlowany z aplikacją albo dostarczany jako paczka contentowa.

### User learning data

Dane użytkownika to:

- próby,
- wyniki,
- błędy,
- statusy itemów,
- review queue,
- progress,
- ustawienia.

Storage użytkownika powinien przechowywać referencje do contentu, a nie kopiować cały content.

Przykład:

```ts
{
  trackId: 'cloud-certification',
  itemId: 'gcp-storage-iam-001',
  contentVersion: '2026.06.01',
  selectedOptionIds: ['a'],
  isCorrect: false,
  answeredAt: '2026-06-26T12:00:00Z'
}
```

## Content integrity

Aplikacja musi korzystać z oryginalnego contentu.

Zakazane jest:

- kopiowanie oficjalnych pytań egzaminacyjnych,
- używanie exam dumps,
- publikowanie realnych odpowiedzi z egzaminów,
- sugerowanie dostępu do prawdziwych pytań egzaminacyjnych,
- kopiowanie zadań z LeetCode lub innych platform coding-practice,
- przepisywanie cudzego problemu z minimalnymi zmianami,
- kopiowanie wyjaśnień, editoriali lub rozwiązań z platform zewnętrznych,
- sugerowanie afiliacji z Google, LeetCode lub innymi właścicielami marek.

Dozwolone jest:

- tworzenie oryginalnych pytań opartych o publicznie znane koncepcje,
- tworzenie oryginalnych problemów algorytmicznych,
- uczenie patternów i strategii bez kopiowania konkretnych zadań,
- używanie neutralnych nazw kategorii, np. `two pointers`, `binary search`, `dynamic programming`, `IAM`, `storage`, `networking`,
- linkowanie do oficjalnych materiałów tylko jako zewnętrznych źródeł nauki, jeżeli później produkt to przewidzi.

## Zasady dla Cloud Certification Track

Cloud certification content powinien:

- być niezależny od oficjalnych egzaminów,
- nie kopiować realnych pytań egzaminacyjnych,
- nie udawać oficjalnego symulatora,
- nie obiecywać zdania egzaminu,
- nie używać znaków, ikon lub stylów sugerujących afiliację z Google,
- używać neutralnego języka typu `cloud certification practice`.

Nie używać komunikatów:

```txt
Official Google exam simulator
Google-approved practice exam
Real GCP ACE exam questions
Actual certification answers
Guaranteed pass
```

Bezpieczniejsze komunikaty:

```txt
Independent cloud certification practice
Practice cloud concepts
Review missed items
Track readiness by topic
Prepare with original practice content
```

## Zasady dla Algorithms Track

Algorithms content powinien:

- uczyć rozpoznawania patternów,
- uczyć doboru strategii,
- uczyć analizy złożoności,
- uczyć rozpoznawania typowych błędów,
- nie kopiować problemów z LeetCode,
- nie używać nazwy LeetCode jako nazwy produktu, tracka ani feature’u,
- nie sugerować integracji lub afiliacji z LeetCode.

Nie używać komunikatów:

```txt
LeetCode trainer
LeetCode official prep
Real LeetCode questions
Copied interview problems
Online judge for LeetCode
```

Bezpieczniejsze komunikaty:

```txt
Algorithm practice
Pattern-based problem solving
Strategy drills
Complexity review
Interview-style algorithm practice
```

## Trademark and affiliation disclaimers

Aplikacja powinna mieć neutralny disclaimer obejmujący różne tracki.

Przykład:

```txt
This app is an independent technical training tool. It is not affiliated with, endorsed by, or sponsored by Google, LeetCode, or any certification provider or coding practice platform.
```

Jeżeli w UI pojawi się konkretny track certyfikacyjny, można dodać krótszy disclaimer kontekstowy:

```txt
Independent practice content. Not affiliated with or endorsed by Google.
```

Dla Algorithms:

```txt
Original algorithm practice content. Not affiliated with LeetCode or any coding practice platform.
```

## Permissions

Aplikacja nie powinna prosić o uprawnienia, których nie potrzebuje.

W MVP nie są potrzebne:

- lokalizacja,
- aparat,
- mikrofon,
- kontakty,
- zdjęcia,
- pliki,
- kalendarz,
- Bluetooth,
- Health / Fitness,
- clipboard access,
- powiadomienia push.

Powiadomienia mogą być dodane później jako przypomnienia do nauki, ale nie są częścią core MVP.

## Secrets and API keys

W MVP nie powinno być sekretów wymagających ochrony serwerowej.

Zakazane:

- prywatne API keys w kodzie aplikacji,
- tokeny usług zewnętrznych,
- klucze admina,
- credentiale do content CMS,
- sekrety w repozytorium.

Dozwolone:

- publiczne build-time config values,
- feature flags niewymagające tajności,
- lokalna konfiguracja development przez `.env.local`, jeżeli nie trafia do repo.

## Local storage security

Dane treningowe nie są szczególnie wrażliwe jak dane medyczne lub finansowe, ale nadal powinny być traktowane jako prywatne.

Zasady:

- dane powinny być przechowywane przez storage adapter,
- UI nie powinien zależeć bezpośrednio od `localStorage` / AsyncStorage,
- reset danych musi usuwać próby, sesje, progress i review queue,
- content data i user data muszą być rozdzielone,
- migracje nie powinny usuwać danych użytkownika bez jasnej intencji.

## Reset danych

Aplikacja powinna mieć opcję:

```txt
Reset learning data
```

Reset powinien usuwać:

- sessions,
- attempts,
- item states,
- review queue,
- progress,
- active session,
- track-specific learning state.

Reset nie musi usuwać:

- bundlowanego contentu,
- statycznych track definitions,
- domyślnych ustawień aplikacji, chyba że użytkownik wybierze pełny reset.

Opcjonalnie można dodać:

```txt
Reset all local data
```

## Analytics

Analytics nie jest częścią MVP.

Jeżeli analytics zostanie dodane później, musi spełniać zasady minimalizacji.

Nie zbierać domyślnie:

- treści odpowiedzi użytkownika,
- freeform notatek,
- pełnej historii sesji,
- identyfikatorów reklamowych,
- danych osobowych,
- danych umożliwiających odtworzenie prywatnego profilu nauki bez zgody.

Potencjalnie dopuszczalne zdarzenia anonimowe:

```ts
{
  event: 'session_completed',
  trackId: 'algorithms',
  sessionMode: 'pattern_drill',
  itemCountBucket: '5-10',
  durationBucket: '3-5min'
}
```

Nie wysyłać:

```ts
{
  itemId: 'specific-item-id',
  selectedAnswer: 'exact answer text',
  userNote: 'freeform private note'
}
```

Dodanie analytics wymaga:

- aktualizacji polityki prywatności,
- jasnego celu pomiaru,
- decyzji opt-in/opt-out,
- oddzielnego ADR.

## Crash reporting

Crash reporting nie jest wymagany w MVP, ale może być dodany wcześniej niż pełna analytics.

Jeżeli zostanie dodany:

- nie powinien wysyłać danych odpowiedzi użytkownika,
- nie powinien wysyłać zawartości training itemów,
- powinien maskować storage payloady,
- powinien być opisany w polityce prywatności.

## AI-generated content

Jeżeli content będzie generowany lub wspomagany przez AI:

- nie wolno promptować modelu o `real exam questions`, `exam dumps`, `actual LeetCode problems`,
- prompt powinien wymagać oryginalnego contentu,
- itemy muszą przejść review jakościowe,
- należy sprawdzić podobieństwo do znanych zadań, gdy item wygląda generycznie lub podejrzanie znajomo,
- wyjaśnienia muszą być merytorycznie sprawdzone.

Bezpieczny kierunek promptu:

```txt
Create an original training item that teaches the concept of binary search on a monotonic condition. Do not copy or paraphrase any existing coding platform problem.
```

Ryzykowny kierunek promptu:

```txt
Generate a LeetCode-style problem like problem 33 with the same structure.
```

## Export/import danych

Export/import nie jest częścią MVP.

Jeżeli zostanie dodany później:

- export powinien zawierać tylko user learning data,
- format powinien zawierać wersję schematu,
- import powinien walidować `trackId`, `itemId`, `contentVersion`,
- import nie powinien umożliwiać wstrzyknięcia skryptów, HTML lub niebezpiecznych payloadów.

## Threat model MVP

### Ryzyka niskie

- wyciek danych z backendu — brak backendu,
- przejęcie konta — brak kont,
- wyciek tokenów — brak tokenów.

### Ryzyka średnie

- przypadkowe zbieranie zbyt dużej ilości danych lokalnie,
- brak resetu danych,
- przechowywanie niepotrzebnych freeform notatek,
- przypadkowe dodanie analytics bez polityki prywatności,
- użycie znaków lub copy sugerujących afiliację.

### Ryzyka wysokie

- użycie oficjalnych pytań egzaminacyjnych,
- użycie exam dumps,
- kopiowanie zadań LeetCode lub editoriali,
- marketing sugerujący oficjalność lub gwarancję zdania,
- dodanie backendu/sync bez ADR i aktualizacji privacy modelu.

## Security checklist MVP

- brak niepotrzebnych permissions,
- brak backendu,
- brak auth,
- brak tokenów,
- brak prywatnych API keys w aplikacji,
- brak zdalnej analityki,
- brak identyfikatorów reklamowych,
- lokalne dane za storage adapterem,
- rozdział static content data i user learning data,
- progress i review queue możliwe do usunięcia,
- reset learning data dostępny w Settings,
- neutralne nazwy tracków,
- disclaimer o braku afiliacji,
- brak oficjalnych pytań egzaminacyjnych,
- brak exam dumps,
- brak kopiowania zadań z LeetCode,
- brak obietnicy zdania egzaminu,
- brak pełnego code judge / remote execution w MVP.

## Antywzorce

Nie robić:

```txt
Store everything in one userProfile object
Upload attempts to analytics by default
Use GCP or LeetCode as app-level brand
Copy official exam questions
Copy coding platform problems
Ask for Google login in MVP
Ask for GitHub login in MVP
Add sync without ADR
Add remote code execution in MVP
Treat local progress as public or non-private
```

## Decyzje bazowe

- MVP jest local-first.
- MVP nie wymaga konta.
- MVP nie wymaga backendu.
- MVP nie używa zdalnej analytics.
- Tracki mogą mieć różne typy contentu, ale prywatność jest wspólna.
- Content musi być oryginalny.
- Nazwy zewnętrznych marek nie mogą definiować marki aplikacji.
- Dodanie sync, kont, backendu, analytics lub AI-personalization wymaga osobnego ADR.
