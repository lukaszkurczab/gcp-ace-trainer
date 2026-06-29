# 08 — Storage and Offline

## Status dokumentu

Ten dokument opisuje lokalne przechowywanie danych i założenia offline-first dla **wielotrackowej aplikacji treningowej**.

Po zmianie zakresu aplikacji storage nie może być projektowany pod pojedynczy bank pytań GCP ani pod jeden tryb egzaminacyjny. Warstwa danych lokalnych musi wspierać model:

```txt
app → track → session mode → training item → attempt → feedback/result → progress
```

Najważniejsza decyzja: w MVP aplikacja działa bez backendu, bez konta użytkownika i bez synchronizacji. Wszystkie dane użytkownika są lokalne, a content jest dostarczany jako statyczne, wersjonowane paczki per track.

## Cele storage

Storage ma zapewnić:

- szybkie uruchomienie aplikacji offline,
- kontynuację przerwanej sesji,
- lokalną historię sesji,
- lokalną historię attemptów,
- progress per track,
- review queue per track,
- ustawienia użytkownika,
- wersjonowanie schematu danych,
- wersjonowanie contentu, na którym opiera się historia użytkownika,
- bezpieczny reset danych,
- możliwość późniejszej migracji do synchronizacji bez przebudowy modelu.

Storage nie ma być źródłem prawdy dla statycznego contentu. Źródłem prawdy dla contentu są lokalne paczki `data/tracks/*` oraz ich manifesty.

## Założenia MVP

MVP zakłada:

- local-first,
- offline-first,
- brak backendu,
- brak logowania,
- brak kont użytkowników,
- brak synchronizacji między urządzeniami,
- brak płatności,
- brak zdalnego content managementu,
- statyczne content packi dostarczane razem z aplikacją,
- lokalny zapis progresu i historii.

Aplikacja powinna działać w pełni po pierwszym uruchomieniu bez sieci.

## Podział danych

Dane należy rozdzielić na dwie kategorie:

```txt
Static content data
  ↓
wersjonowane paczki treningowe dostarczone z aplikacją

User learning data
  ↓
lokalny stan użytkownika, sesje, attempty, progress, review, ustawienia
```

Nie należy mieszać tych kategorii w jednym modelu storage.

## Static content data

Static content data obejmuje:

- listę tracków,
- definicje trybów sesji,
- taksonomie tracków,
- training itemy,
- wyjaśnienia,
- referencje,
- manifesty contentu,
- informacje o wersji contentu.

Przykładowa struktura:

```txt
data/
  tracks/
    cloud-certification/
      manifest.ts
      taxonomy.ts
      items.json
      references.ts

    algorithms/
      manifest.ts
      taxonomy.ts
      patterns.ts
      items.json
      references.ts
```

Content pack nie powinien być zapisywany ponownie w AsyncStorage/MMKV, jeżeli jest bundlowany z aplikacją. W storage zapisujemy tylko metadane oraz dane użytkownika odnoszące się do stabilnych `itemId`.

## User learning data

Przechowywane lokalnie:

- aktywny track,
- ustawienia aplikacji,
- domyślne ustawienia sesji per track,
- aktywna sesja w toku,
- historia zakończonych i porzuconych sesji,
- attempty użytkownika,
- stan itemów użytkownika,
- review queue,
- progress per track,
- cache agregatów progressu,
- metadata storage,
- informacja o wersjach contentu użytych w historii.

Nie przechowywać w MVP:

- e-maila,
- konta Google,
- tokenów,
- danych płatniczych,
- identyfikatorów reklamowych,
- danych osobowych niepotrzebnych do nauki,
- nazw użytkownika z zewnętrznych platform,
- skopiowanych treści z platform zewnętrznych,
- prawdziwych pytań egzaminacyjnych albo dumpów,
- danych telemetrycznych pozwalających identyfikować użytkownika.

## Storage engine

### AsyncStorage

Zalety:

- prosty,
- popularny,
- wystarczający dla bardzo wczesnego MVP,
- łatwy do debugowania,
- dobrze pasuje do małych payloadów JSON.

Wady:

- wolniejszy przy częstych odczytach,
- wymaga ostrożności przy większych payloadach,
- łatwo doprowadzić do dużych blobów trudnych do migrowania,
- operacje są asynchroniczne.

### MMKV

Zalety:

- szybki,
- dobry dla częstych odczytów,
- wygodny dla key-value,
- dobry do ustawień, aktywnej sesji i cache progressu,
- zwykle lepszy UX przy częstym zapisie małych porcji danych.

Wady:

- dodatkowa zależność,
- może komplikować setup,
- nadal wymaga sensownego modelu kluczy i migracji.

### SQLite / WatermelonDB

Nie rekomendować dla MVP, chyba że aplikacja szybko urośnie w stronę dużych lokalnych zbiorów, rozbudowanej analityki, filtrowania historii albo synchronizacji.

Zalety:

- lepsze zapytania,
- lepsza obsługa dużych zbiorów,
- łatwiejsza normalizacja danych,
- mocniejsza baza pod synchronizację.

Wady:

- większy koszt implementacyjny,
- większy koszt migracji,
- większe ryzyko overengineeringu na starcie.

## Rekomendacja

Dla MVP:

```txt
MMKV albo AsyncStorage za adapterem
```

Preferencja techniczna:

```txt
MMKV, jeżeli nie komplikuje setupu Expo / React Native.
AsyncStorage, jeżeli priorytetem jest maksymalna prostota startu.
```

Ważniejsze od wyboru konkretnego engine'u jest to, żeby ekrany i logika domenowa nie zależały bezpośrednio od implementacji storage.

Źle:

```ts
await AsyncStorage.setItem('gcpAceTrainer:sessions', JSON.stringify(sessions));
```

Dobrze:

```ts
await sessionStorage.saveSession(session);
```

## Adapter storage

Bazowy adapter:

```ts
type StorageClient = {
  getItem<T>(key: string): Promise<T | null>;
  setItem<T>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
  getMany?<T>(keys: string[]): Promise<Record<string, T | null>>;
  setMany?<T>(entries: Record<string, T>): Promise<void>;
};
```

UI nie powinien importować `AsyncStorage`, `MMKV` ani przyszłego klienta synchronizacji.

## Repozytoria storage

Rekomendowana struktura:

```txt
storage/
  storageClient.ts
  storageKeys.ts
  storageMetadata.ts
  migrations.ts

  repositories/
    settingsStorage.ts
    sessionStorage.ts
    attemptStorage.ts
    itemStateStorage.ts
    reviewStorage.ts
    progressStorage.ts
    contentMetadataStorage.ts
```

Każde repozytorium powinno mieć odpowiedzialność ograniczoną do jednego typu danych.

## Klucze storage

Nie używać już prefixu `gcpAceTrainer`. Aplikacja ma mieć neutralny namespace.

Prefix powinien być stałą konfiguracyjną, np.:

```ts
const STORAGE_NAMESPACE = 'practiceTrainer';
const STORAGE_SCHEMA_VERSION = 1;
```

Proponowane klucze:

```txt
practiceTrainer:v1:metadata
practiceTrainer:v1:settings
practiceTrainer:v1:activeTrack
practiceTrainer:v1:activeSession
practiceTrainer:v1:sessions
practiceTrainer:v1:attempts
practiceTrainer:v1:itemStates
practiceTrainer:v1:reviewQueue
practiceTrainer:v1:progress
practiceTrainer:v1:contentMetadata
```

Dla danych per track można stosować klucze segmentowane:

```txt
practiceTrainer:v1:tracks:{trackId}:settings
practiceTrainer:v1:tracks:{trackId}:sessions
practiceTrainer:v1:tracks:{trackId}:attempts
practiceTrainer:v1:tracks:{trackId}:itemStates
practiceTrainer:v1:tracks:{trackId}:reviewQueue
practiceTrainer:v1:tracks:{trackId}:progress
```

Dla MVP prostsze może być przechowywanie jednego obiektu per kategoria. Jeżeli liczba attemptów szybko rośnie, należy przejść na segmentację per track i/lub per session.

## Metadata

```ts
type LocalMetadata = {
  schemaVersion: number;
  storageNamespace: string;

  installedAt: string;
  createdAt: string;
  updatedAt: string;

  appDataVersion?: string;

  contentVersionsByTrack: Record<TrackId, ContentVersion>;

  migrations: CompletedMigration[];
};

type CompletedMigration = {
  id: string;
  fromSchemaVersion: number;
  toSchemaVersion: number;
  completedAt: string;
};
```

Metadata musi pozwalać stwierdzić, z jaką wersją contentu powstały zapisane wyniki.

## Content metadata

```ts
type LocalContentMetadata = {
  tracks: Record<TrackId, LocalTrackContentMetadata>;
};

type LocalTrackContentMetadata = {
  trackId: TrackId;
  contentVersion: ContentVersion;
  schemaVersion: number;
  itemCount: number;
  taxonomyVersion?: string;
  loadedAt: string;
  lastValidatedAt?: string;
};
```

Content metadata nie zastępuje manifestu contentu. To tylko lokalny zapis informacji, z jaką wersją contentu pracował użytkownik.

## Schema version

Lokalne dane powinny mieć jawny `schemaVersion`.

```ts
const CURRENT_STORAGE_SCHEMA_VERSION = 1;
```

Każda zmiana struktury local storage wymaga decyzji:

- czy potrzebna jest migracja,
- czy można przebudować cache,
- czy dane można bezpiecznie odrzucić,
- czy trzeba pokazać użytkownikowi komunikat o resecie.

W MVP lepiej przechowywać mniejszą liczbę stabilnych struktur niż dużo rozproszonych, przypadkowych kluczy.

## Content version

Content jest wersjonowany per track.

```ts
type ContentVersion = string;
```

Przykład:

```txt
cloud-gcp-ace@2026.06.01
algorithms-core@2026.06.01
```

Każda sesja i attempt powinny zapisywać `contentVersion`.

```ts
type TrainingAttempt = {
  id: AttemptId;
  trackId: TrackId;
  itemId: TrainingItemId;
  sessionId: SessionId;
  contentVersion: ContentVersion;
  submittedAt: string;
  // ...
};
```

To pozwala później obsłużyć sytuację, w której item został poprawiony, zdeprecjonowany albo usunięty z paczki contentu.

## Stabilność ID

ID contentu musi być stabilne.

Nie zmieniać `itemId`, jeżeli zmienia się tylko:

- literówka,
- wyjaśnienie,
- tag,
- drobna korekta dystraktora,
- doprecyzowanie promptu bez zmiany sensu.

Zmienić `itemId` albo oznaczyć item jako nowy, jeżeli zmienia się:

- poprawna odpowiedź,
- główny koncept,
- oczekiwany pattern,
- scoring,
- sens problemu,
- poziom trudności w sposób wpływający na progress.

Jeżeli item zostaje wycofany, powinien trafić do `deprecatedItemIds` w manifestach, a historia użytkownika powinna nadal dać się odczytać.

## Aktywna sesja

Sesja w toku powinna być zapisywana po każdym istotnym kroku:

- utworzenie sesji,
- przejście do kolejnego itemu,
- submit attemptu,
- oznaczenie itemu do review,
- pauza albo wyjście z aplikacji,
- zakończenie sesji.

Stan sesji:

```txt
not_started
in_progress
completed
abandoned
```

Aktywna sesja powinna zawierać:

- `sessionId`,
- `trackId`,
- `modeId`,
- `modeType`,
- `status`,
- `itemIds`,
- `currentItemIndex`,
- `attemptIds`,
- `settings`,
- `startedAt`,
- `contentVersion`.

Nie należy zapisywać pełnych training itemów w sesji. Zapisywać tylko `itemIds` i wersję contentu.

## Abandoned session

Jeżeli użytkownik przerwie sesję, aplikacja może:

- zaproponować kontynuację,
- oznaczyć sesję jako `abandoned`,
- zachować częściowe attempty,
- nie liczyć jej do głównej statystyki wynikowej,
- użyć jej do lekkiego sygnału progresu, jeżeli użytkownik realnie odpowiedział na część itemów.

Decyzja dla MVP:

```txt
Practice / Pattern Drill mogą być łatwo porzucane.
Exam Simulation powinien pytać o potwierdzenie wyjścia.
```

Dla tracka algorytmicznego `abandoned` nie powinno być traktowane tak samo jak porażka. Użytkownik mógł przerwać analizę problemu bez finalnej odpowiedzi.

## Attempts

Attepty są najważniejszym źródłem prawdy o historii nauki użytkownika.

Przechowywać:

- `attemptId`,
- `sessionId`,
- `trackId`,
- `itemId`,
- `itemType`,
- `submittedAt`,
- `timeSpentMs`,
- `response`,
- `result`,
- `confidence`,
- `markedForReview`,
- `contentVersion`.

Nie przechowywać pełnej treści itemu, jeżeli jest dostępna w content packu.

## Item states

`UserItemState` powinien przechowywać skondensowany stan użytkownika dla itemu.

Przykład:

```ts
type StoredUserItemState = {
  trackId: TrackId;
  itemId: TrainingItemId;

  attemptsCount: number;
  lastAttemptId?: AttemptId;
  lastAttemptAt?: string;

  lastStatus?: AttemptStatus;
  bestScore?: number;
  averageScore?: number;

  markedForReview: boolean;
  reviewDueAt?: string;

  mistakeTypes?: MistakeType[];
  affectedTaxonomyRefs?: TaxonomyRef[];

  contentVersion: ContentVersion;
  updatedAt: string;
};
```

To jest stan pomocniczy do szybkiego wyboru itemów i review. W razie potrzeby można go odbudować z attempts.

## Review queue

Review queue musi działać per track, ale powinna używać wspólnego modelu.

```ts
type StoredReviewQueueItem = {
  trackId: TrackId;
  itemId: TrainingItemId;

  reason:
    | 'incorrect'
    | 'partial'
    | 'marked_by_user'
    | 'low_confidence'
    | 'weak_taxonomy'
    | 'wrong_pattern'
    | 'complexity_misjudgment';

  priority: number;
  dueAt?: string;
  createdAt: string;
  updatedAt: string;

  lastAttemptId?: AttemptId;
  contentVersion: ContentVersion;
};
```

Dla Cloud Certification review może bazować głównie na błędnych odpowiedziach i słabych domenach.

Dla Algorithms review powinno mocno uwzględniać:

- błędnie rozpoznany pattern,
- zły dobór struktury danych,
- błąd w złożoności,
- overengineering,
- niską pewność odpowiedzi.

## Progress

Progress może być wyliczany z attempts, ale dla UX warto trzymać cache agregatów.

```ts
type StoredProgress = {
  global: StoredGlobalProgress;
  tracks: Record<TrackId, StoredTrackProgress>;
  updatedAt: string;
};

type StoredGlobalProgress = {
  activeTrackId?: TrackId;
  totalSessionsCompleted: number;
  totalAttempts: number;
  lastSessionAt?: string;
};

type StoredTrackProgress = {
  trackId: TrackId;
  sessionsCompleted: number;
  attemptsCount: number;
  accuracy?: number;
  averageScore?: number;
  byTaxonomy: Record<string, StoredTaxonomyProgress>;
  weakAreas: TaxonomyRef[];
  updatedAt: string;
  contentVersion: ContentVersion;
};

type StoredTaxonomyProgress = {
  attemptsCount: number;
  averageScore: number;
  lastAttemptAt?: string;
  weaknessScore?: number;
};
```

Cache progressu musi być traktowany jako dane odtwarzalne. Jeżeli jest uszkodzony, aplikacja powinna spróbować odbudować go z historii attempts.

## Settings

Settings powinny być neutralne względem tracków.

```ts
type LocalSettings = {
  activeTrackId?: TrackId;
  theme: 'system' | 'light' | 'dark';
  reduceMotion?: boolean;

  defaultSessionSettingsByTrack: Record<TrackId, Partial<SessionSettings>>;

  hasSeenOnboarding?: boolean;
  hasAcceptedContentDisclaimer?: boolean;

  updatedAt: string;
};
```

Nie zapisywać ustawień jako `gcpSettings` albo `examSettings`, chyba że są faktycznie specyficzne dla jednego tracka i schowane pod `defaultSessionSettingsByTrack[trackId]`.

## Walidacja po odczycie

Każdy odczyt ze storage powinien mieć walidację minimalną:

- czy JSON da się sparsować,
- czy `schemaVersion` jest wspierany,
- czy wymagane pola istnieją,
- czy `trackId` istnieje w registry,
- czy `itemId` istnieje w aktualnym albo zdeprecjonowanym content packu,
- czy `contentVersion` jest zgodny albo możliwy do obsłużenia,
- czy wartości enumów są znane.

Przy błędzie aplikacja powinna:

1. spróbować migracji,
2. spróbować odbudować cache,
3. odizolować uszkodzony fragment,
4. dopiero na końcu zaproponować reset danych.

Nie należy resetować całej aplikacji przy pojedynczym błędzie cache progressu.

## Migracje

Migracje powinny być jawne i idempotentne.

```ts
type StorageMigration = {
  id: string;
  fromVersion: number;
  toVersion: number;
  run: (client: StorageClient) => Promise<void>;
};
```

Przykładowe migracje, które mogą się pojawić:

- zmiana prefixu z `gcpAceTrainer` na neutralny namespace,
- przeniesienie `questionStates` do `itemStates`,
- przeniesienie `domainProgress` do `progress.tracks[trackId].byTaxonomy`,
- dodanie `contentVersion` do attempts,
- rozdzielenie historii sesji per track,
- odbudowanie review queue po zmianie reguł review.

Migracja nie powinna usuwać danych użytkownika bez wyraźnej potrzeby.

## Reset danych

Settings powinien zawierać akcję resetu danych lokalnych.

Reset może mieć dwa poziomy:

### Reset learning data

Usuwa:

- aktywną sesję,
- historię sesji,
- attempty,
- item states,
- review queue,
- progress.

Zostawia:

- theme,
- onboarding flags,
- zaakceptowane disclaimery,
- ewentualnie aktywny track.

### Reset all local data

Usuwa:

- wszystkie dane nauki,
- ustawienia,
- metadata,
- onboarding flags,
- zaakceptowane disclaimery.

Po pełnym resecie aplikacja powinna zachowywać się jak po pierwszym uruchomieniu.

Reset musi wymagać potwierdzenia.

## Export/import

Poza MVP, ale sensowny etap po local-first.

Możliwy zakres:

- export JSON,
- import JSON,
- backup lokalny,
- migracja między urządzeniami bez konta,
- debug export dla developmentu.

Export powinien zawierać:

- `schemaVersion`,
- `exportedAt`,
- `contentVersionsByTrack`,
- settings,
- sessions,
- attempts,
- item states,
- review queue,
- progress.

Export nie powinien zawierać danych, których aplikacja nie potrzebuje do nauki.

Import musi walidować wersję schematu i contentu przed nadpisaniem lokalnych danych.

## Synchronizacja

Synchronizacja nie jest częścią MVP.

Jeżeli pojawi się później, trzeba rozstrzygnąć:

- user identity,
- login albo anonymous account,
- conflict resolution,
- merge attempts,
- merge active session,
- content version conflicts,
- backup,
- prywatność,
- koszty,
- usuwanie danych,
- migrację z danych lokalnych.

Dane lokalne należy projektować tak, żeby późniejsza synchronizacja była możliwa, ale nie należy implementować pseudo-syncu w MVP.

Minimalne przygotowanie pod sync:

- stabilne ID,
- `createdAt`, `updatedAt`,
- `contentVersion`,
- `schemaVersion`,
- brak zależności UI od storage engine,
- repozytoria zamiast bezpośrednich wywołań storage.

## Privacy by design

Ponieważ MVP jest lokalny, aplikacja ma dobrą pozycję prywatnościową, ale tylko pod warunkiem, że nie zacznie zbierać zbędnych danych.

Zasady:

- przechowywać tylko dane potrzebne do nauki,
- nie zapisywać tożsamości użytkownika,
- nie zapisywać danych zewnętrznych kont,
- nie zapisywać surowych tekstów z chronionych źródeł,
- nie wysyłać historii nauki bez wyraźnej funkcji synchronizacji lub exportu,
- reset danych musi być łatwy do znalezienia.

## Ryzyka

### Utrata danych

Dane lokalne mogą zostać utracone po odinstalowaniu aplikacji, wyczyszczeniu danych aplikacji albo zmianie urządzenia.

Mitigacja MVP:

- jasna informacja w Settings,
- reset zamiast ukrytych operacji,
- późniejszy export/import.

### Brak multi-device

Użytkownik nie ma synchronizacji między telefonem a tabletem.

Mitigacja MVP:

- świadome ograniczenie zakresu,
- nie obiecywać backupu,
- przygotować model danych pod późniejszy sync.

### Migracje

Zmiany w modelu danych mogą uszkodzić zapis, jeżeli nie będzie wersjonowania.

Mitigacja:

- `schemaVersion`,
- migracje idempotentne,
- walidacja po odczycie,
- testy migracji,
- cache progressu możliwy do odbudowy.

### Nieaktualny content

Lokalny content pack może być przestarzały po zmianie egzaminu, usług cloud albo korekcie itemów.

Mitigacja:

- `contentVersion` per track,
- manifest contentu,
- `deprecatedItemIds`,
- referencje do źródeł,
- release notes contentu.

### Zbyt duże bloby JSON

Przechowywanie całej historii w jednym kluczu może pogorszyć wydajność i utrudnić migracje.

Mitigacja:

- na MVP można zacząć prosto,
- przy wzroście danych segmentować per track i per session,
- cache progressu traktować jako odtwarzalny.

### Powrót do modelu GCP-only

Stare klucze typu `gcpAceTrainer:*`, `questionStates`, `examProgress` będą utrwalać błędny model produktu.

Mitigacja:

- neutralny namespace,
- `TrainingItem` zamiast `Question`,
- `TrackId` w każdym rekordzie użytkownika,
- `taxonomyRefs` zamiast `domainId` jako pola globalnego.

## Minimalne zabezpieczenia

MVP musi mieć:

- adapter storage,
- neutralny namespace storage,
- `schemaVersion`,
- `contentVersion` per track,
- stabilne ID contentu,
- zapis aktywnej sesji,
- zapis attemptów,
- progress per track,
- review queue per track,
- walidację po odczycie,
- graceful fallback przy błędnym storage,
- reset danych,
- brak zapisu danych osobowych.

## Antywzorce

Unikać:

- `gcpAceTrainer:*` jako prefixu storage,
- `questions` jako jedynego modelu danych lokalnych,
- `questionStates` jako centralnej tabeli stanu aplikacji,
- `examProgress` jako globalnego progressu,
- zapisywania pełnego contentu w storage, jeżeli content jest bundlowany,
- braku `contentVersion` w attemptach,
- braku `trackId` w sesjach i attemptach,
- jednego wielkiego JSON-a bez migracji,
- resetowania całych danych przy błędzie jednego cache,
- projektowania pseudo-synchronizacji bez tożsamości użytkownika,
- przechowywania danych osobowych „na przyszłość”.

## Kryteria gotowości pliku dla implementacji

Implementacja storage jest zgodna z dokumentem, jeżeli:

- aplikacja działa offline po pierwszym uruchomieniu,
- użytkownik może rozpocząć sesję w każdym aktywnym tracku,
- aktywna sesja przetrwa restart aplikacji,
- attempty zapisują `trackId`, `itemId`, `itemType` i `contentVersion`,
- progress jest liczony osobno per track,
- review queue działa osobno per track,
- Settings pozwala zresetować dane,
- UI nie importuje bezpośrednio storage engine'u,
- stare pojęcia `Question/Quiz/Exam` nie są używane jako globalny model storage,
- błędny cache progressu nie niszczy historii attemptów.
