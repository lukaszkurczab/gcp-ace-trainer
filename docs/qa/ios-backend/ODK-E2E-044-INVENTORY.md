# ODK-E2E-044 — inwentarz górnej nawigacji

Status: VERIFIED_CLOSED

Repozytorium: `patternly`, baza `f0c4867`.

Model i effort: `gpt-5.6-luna / max`.

Zakres tego dokumentu jest odczytowy. Nie zmieniono kodu, konfiguracji ani rejestru. Kod źródłowy jest źródłem prawdy; ryzyka opisane niżej są hipotezami wynikającymi ze stylów i ścieżek runtime, a nie potwierdzonymi defektami wizualnymi.

## Status dowodów

| Obszar | Status | Dowód lub ograniczenie |
|---|---|---|
| Inwentarz komponentów, użyć i rout | done | Aktualne pliki źródłowe, linie poniżej |
| Typografia i skalowanie | done | `src/theme/tokens.ts`, komponenty nagłówków i testy shell |
| iOS standardowy tekst | done | `2026-09-08_051857`, 20/20 `COMPLETED`; Track, Activity, Practice Setup |
| iOS największy tekst | done | `2026-09-08_052106`, 24/24 `COMPLETED`; te same trzy ekrany |
| Oglądanie zrzutów | done | Kontroler obejrzał wszystkie 6 zrzutów; brak potwierdzonego nachodzenia nagłówków |
| EN, dark, Coding | done | Ustawienia przebiegów dowodowych |
| Wszystkie języki | unknown / needs evidence | Nie wykonano pełnego przeglądu locale |
| Loading, error i aktywne sesje | unknown / needs evidence | Nie były częścią tych sześciu zrzutów |
| Standardowy rozmiar tekstu po próbie | done | Przywrócono standardowy rozmiar |

## Kanoniczne komponenty i użycia

Wszystkie ścieżki są absolutne względem `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/`.

### `ScreenHeader`

Komponent: `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/src/components/ScreenHeader.tsx`.

Użycia JSX:

- `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/src/features/account/AccountEmailChangePendingScreen.tsx:37`
- `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/src/features/account/AccountEntryScreen.tsx:359,382,394,746,865,1052,1244`
- `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/src/features/account/AccountSecurityScreen.tsx:158`
- `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/src/features/home/ActivityScreen.tsx:68`
- `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/src/features/home/AppearanceSettingsScreen.tsx:54`
- `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/src/features/home/LanguageSettingsScreen.tsx:50`
- `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/src/features/home/LegalRequestsScreen.tsx:92`
- `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/src/features/home/NotificationSettingsScreen.tsx:191`
- `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/src/features/home/PrivacyPolicyScreen.tsx:19`
- `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/src/features/home/PrivacyRequestsScreen.tsx:81,86`
- `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/src/features/home/SettingsInformationScreen.tsx:46`
- `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/src/features/home/TermsOfServiceScreen.tsx:19`
- `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/src/features/home/YourDataScreen.tsx:103`
- `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/src/features/home/tabs/SettingsTab.tsx:53,213`
- `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/src/features/practice/PracticeSetupScreen.tsx:209,331`
- `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/src/features/premium/PremiumPurchaseScreen.tsx:102`

`LegalInformationScreen.tsx:92` przekazuje `screenHeader` do `SettingsInformationScreen`, więc jest pośrednim wejściem do tego samego komponentu.

### `AppShellHeader`

Komponent: `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/src/components/AppShellHeader.tsx`.

Użycia JSX:

- `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/src/navigation/RootNavigator.tsx:69`
- `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/src/features/home/HomeScreen.tsx:222`
- `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/src/features/home/SelectTrackScreen.tsx:142`
- `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/src/features/practice/AlgorithmsScopeSelectionScreen.tsx:43,45,50`
- `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/src/features/practice/CertificationPracticeSessionScreen.tsx:127,136,138,139`
- `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/src/features/practice/DesignInterviewPracticeScreen.tsx:151,162,338`
- `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/src/features/practice/PracticeHubScreen.tsx:140,151`
- `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/src/features/practice/PracticeSessionScreen.tsx:158,161,168,180`
- `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/src/features/practice/PracticeSetupScreen.tsx:216,229,338`
- `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/src/features/practice/TopicRoadmapScreen.tsx:122,133,174`

W `HomeScreen` jest to branch błędu shell. W `RootNavigator` jest to globalny renderer stack headera.

### `SessionShell`

Komponent: `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/src/features/coding-interview/session/SessionShell.tsx`.

Użycia:

- `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/src/features/practice/AlgorithmsPracticeReviewScreen.tsx:88,104`
- `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/src/features/practice/PracticeSessionSurface.tsx:102`
- `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/src/features/simulation/SimulationSessionSurface.tsx:42`

### Review headery

- `ReviewShell`: `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/src/features/review/AnswerReviewScreen.tsx:97`; `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/src/features/simulation/AlgorithmsInterviewSimulationResultScreen.tsx:159,192`.
- `ReviewLoadingSkeleton`: `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/src/features/review/AnswerReviewScreen.tsx:93`; `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/src/features/simulation/AlgorithmsInterviewSimulationResultScreen.tsx:129`.

### Lokalne nagłówki Goal i Account

- Goal ready header: `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/src/features/home/GoalCadenceScreen.tsx:274-285`.
- Goal loading header: `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/src/features/home/GoalCadenceScreen.tsx:74-83`.
- Account status branches: `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/src/features/account/AccountEntryScreen.tsx:359,382,394,746,865,1052,1244`.
- Account entry form and welcome branches use local `Screen` content without a separate shared top header: `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/src/features/account/AccountEntryScreen.tsx:468,589,1171`.

## Typografia i skalowanie

Źródło tokenów: `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/src/theme/tokens.ts:278-354`.

| Token | Rozmiar / lineHeight / weight |
|---|---|
| `display` | 34 / 40 / 700 |
| `title` | 28 / 34 / 700 |
| `heading` | 20 / 28 / 700 |
| `body` | 14 / 22 / 400 |
| `bodyStrong` | 14 / 18 / 600 |
| `button` | 15 / 18 / 600 |
| `small` | 14 / 22 / 400 |
| `caption` | 11 / 15 / 500 |
| `navigationLabel` | 11 / 15 / 400 |
| `processingTitle` | 22 / 28 / 600 |
| `processingDescription` | 14 / 22 / 400 |
| `statusTitle` | 14 / 17 / 600 |
| `statusDescription` | 14 / 22 / 400 |

Lokalne wyjątki:

- `ScreenHeader`: tytuł `title` 28/34/700; activity 24/30/600; practice setup ma kontekst 14/17/500 i opis 13.5/19/400.
- `AppShellHeader`: marka 20/28/700, meta 11/15/500; brand copy ma `flexShrink` i `minWidth: 0`.
- `AppShellHeader placement="back"`: etykieta 14/18/500, `minHeight: 36`; chevron ma 36×36, a pressable ma `hitSlop={4}` (`src/components/AppShellHeader.tsx:47-60,115-137`). To osobny hitbox/layout contract, bez potwierdzonego defektu.
- Goal: tytuł 22/27/700, kontekst i track label 14/22/500, status badge 11/14/700.
- Account auth: lokalny status title 38/44/700, welcome title 30/38/700, welcome brand 36/44/700.
- `SessionShell`: standardowy pasek 11/15/500; simulation 12/16/600; saved/confirmation 13/16/700.
- `ReviewShell`: tytuł 15/18/600 (`src/components/ReviewShell.tsx:113-114`), kontekst 13/18/500 (`:101-102`), navigator 12/16/600.
- Loading: `LoadingState` 22/28/600 + 14/22/400; review loading header 15/19/600.

Nagłówkowe teksty mają zazwyczaj `maxFontSizeMultiplier={2}`. Account stosuje dodatkowo layout large text przy `fontScale >= 1.3`; review/session skeletony używają skali ograniczonej do 2, a układ review przełącza się przy większym `fontScale`.

## Loading i modale

| Surface | Typografia | Plik i użycia |
|---|---|---|
| `LoadingState` | 22/28/600; opis 14/22/400 | `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/src/components/LoadingState.tsx`; globalne odtwarzanie sesji w `RootNavigator.tsx:55-58` |
| Goal loading | Jak lokalny Goal header | `GoalCadenceScreen.tsx:65,74-83,243` |
| Review loading | Header 15/19/600 | `ReviewLoadingSkeleton.tsx:15-38`; użycia wymienione wyżej |
| Practice/Activity loading | Typografia nagłówka rodzica | Rodzic zachowuje odpowiednio `AppShellHeader` lub `ScreenHeader`; `ActivityScreen.tsx:78`, `PracticeHubScreen.tsx:139,150`, `PracticeSetupScreen.tsx:208-229,321-338` |
| `SettingsBottomSheet` | Standard 20/28/700; reminder 22/28/600; intro 14/22/400 | `src/components/SettingsBottomSheet.tsx:20-39,72-75`; użycia: Activity 138, LegalInformation 92, LegalRequests 100/108, NotificationSettings 237, PrivacyRequests 96/103, SettingsInformation 70, YourData 121 |
| `SettingsDialog` | Tytuł 20/28/700; komunikat 14/22/400 | `src/components/SettingsDialog.tsx:28-52`; Exam 212 |
| `ReviewNavigator` | Tytuł 16/20/600; podsumowanie 12/16/500 | `src/components/ReviewNavigator.tsx:20-86`; AnswerReview 126, SimulationResult 181/236 |
| `ContentReportSheet` | Tytuł 28/34/700; opis 14/22/400 | `src/features/reports/ContentReportSheet.tsx:27,95-99,181,199`; ReviewFeedbackBlock 33, PracticeFeedbackBlock 31 |
| `SimulationQuestionNavigator` | Tytuł 16/20/600; podsumowanie 12/16/500 | `src/features/simulation/navigator/SimulationQuestionNavigator.tsx:23,45-68,138-140`; SimulationSessionSurface 64, ExamScreen 211 |
| Sesyjne sheets | Tytuły 20/28/700 lub 22/28/600 zależnie od surface | `PracticeSessionSurface.tsx:124,208,214` oraz `SimulationSessionSurface.tsx:65,187,192,243,262` |

## Wszystkie routy i właściciel nagłówka

Źródło: `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/src/navigation/RootNavigator.tsx:79-226`.

| Route | Linie `Stack.Screen` | Właściciel |
|---|---:|---|
| `HOME` | 79-83 | Brak route-level; Home/tab branches, błąd shell `AppShellHeader` |
| `ACTIVITY` | 84-88 | `ScreenHeader` |
| `ACCOUNT_SECURITY` | 89 | `ScreenHeader` |
| `ACCOUNT_EMAIL_CHANGE_PENDING` | 90 | `ScreenHeader` |
| `APPEARANCE_SETTINGS` | 91-95 | `ScreenHeader` |
| `LANGUAGE_SETTINGS` | 96-100 | `ScreenHeader` |
| `YOUR_DATA` | 101-105 | `ScreenHeader` |
| `PRIVACY_REQUESTS` | 106 | `ScreenHeader` |
| `LEGAL_REQUESTS` | 107 | `ScreenHeader` |
| `BACKEND_DIAGNOSTICS` | 108-112 | Globalny stack header → `AppShellHeader` |
| `LEGAL_INFORMATION` | 113-117 | `SettingsInformationScreen` → `ScreenHeader` |
| `PREMIUM_PURCHASE` | 118 | `ScreenHeader` |
| `NOTIFICATION_SETTINGS` | 119-123 | `ScreenHeader` |
| `SELECT_TRACK` | 124-128 | `AppShellHeader` |
| `GOAL_CADENCE` | 129-133 | Lokalny Goal header; loading `GoalLoadingSkeleton` |
| `PRACTICE_HUB` | 134-138 | `AppShellHeader` |
| `ALGORITHMS_SCOPE_SELECTION` | 139-143 | `AppShellHeader` |
| `TOPIC_ROADMAP` | 144-148 | `AppShellHeader` |
| `EXAM` | 149-153 | Globalny stack header → `AppShellHeader` |
| `EXAM_REVIEW` | 154-158 | Globalny stack header → `AppShellHeader`; skeleton bez własnego headera |
| `RESULT` | 159-163 | Globalny stack header → `AppShellHeader`; skeleton bez własnego headera |
| `ANSWER_REVIEW` | 164-168 | `ReviewLoadingSkeleton` / `ReviewShell` |
| `PRACTICE_SETUP` | 169-173 | Compact: `ScreenHeader`; pozostałe warianty: `AppShellHeader` |
| `PRACTICE_SESSION` | 174-178 | Error/conflict: `AppShellHeader`; aktywna/preparing sesja: `SessionShell` |
| `ALGORITHMS_PRACTICE_REVIEW` | 179-183 | `SessionShell`; error używa `Screen.header` z akcją powrotu |
| `ALGORITHMS_PRACTICE_SUMMARY` | 184-188 | Brak lokalnego nagłówka |
| `ALGORITHMS_INTERVIEW_SIMULATION` | 189-193 | `SimulationSessionSurface` → `SessionShell` |
| `ALGORITHMS_INTERVIEW_SIMULATION_SUMMARY` | 194-198 | Globalny stack header → `AppShellHeader` |
| `ALGORITHMS_INTERVIEW_SIMULATION_REVIEW` | 199-203 | `ReviewLoadingSkeleton` / `ReviewShell` |
| `MISTAKES_REVIEW` | 204-208 | Globalny stack header → `AppShellHeader` |
| `ACCOUNT_ENTRY` | 211-216 | `ScreenHeader` zależny od stanu auth |
| `TERMS_OF_SERVICE` | 217-221 | `ScreenHeader` |
| `PRIVACY_POLICY` | 222-226 | `ScreenHeader` |

Warianty oznaczone jako zależne od stanu są hipotezą ownershipu wynikającą z branchy komponentów; nie wszystkie zostały sprawdzone na urządzeniu.

## Hipotezy ryzyka do 042/043

- `ScreenHeader` nie ustawia jawnie `flexShrink`, `minWidth` ani `numberOfLines` dla tytułu, kontekstu i opisu. Długie nazwy przy dużym font scale mogą zwiększać wysokość lub ograniczać miejsce dla przycisku back.
- Goal context i track label mają analogiczny brak jawnego shrink/min-width. Długie nazwy tracków są osobnym przypadkiem względem wspólnego `ScreenHeader`.
- `AppShellHeader` ma bezpieczniejsze `flexShrink/minWidth` dla brand copy, ale meta/context nie ma `numberOfLines`; długie tytuły mogą zawijać globalny stack header.
- Account status title 38/44 oraz duży font scale mogą zwiększyć pionowy koszt lokalnego nagłówka.
- `SessionShell` jest zaprojektowany jako zwarty pasek z kilkoma slotami; długie etykiety mogą ściskać timer lub pozycję.
- Tytuły `ReviewNavigator`, `SimulationQuestionNavigator`, sesyjnych sheets i niektóre dialogi nie mają własnego mechanizmu ograniczenia liczby linii.

Nie ma potwierdzonego nakładania nagłówków w sześciu obejrzanych zrzutach. Loading/error, aktywne sesje, inne locale i wszystkie routy wymagają osobnego retestu przed zmianą wspólnych komponentów.

## Zakres dla 042 i 043

- `ODK-E2E-042` powinien zaprojektować docelową typografię i zachowanie dla grup: `ScreenHeader`, `AppShellHeader`, lokalny Goal/Account, Practice/`SessionShell`, Review/loading oraz modal/sheet headers. Projekt musi jawnie rozstrzygnąć długie nazwy, `fontScale`, zawijanie, odstępy i zachowanie hitboxa back.
- `ODK-E2E-043` powinien wdrożyć zaakceptowany projekt w tych grupach, zachowując wskazane lokalne wyjątki i warianty runtime. Przed zmianą wymaga retestu niezweryfikowanych loading/error/session branches oraz pełnej tabeli routów.
- `044` nie proponuje globalnej zmiany tokenów, nie zmienia kodu i nie zastępuje decyzji projektowej 042.
