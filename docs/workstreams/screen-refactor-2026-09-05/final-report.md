# Refaktor ekranów — raport końcowy

Aktualizacja użytkownika po P0–P5: zakończono korektę Recent activity i konta/języka w Settings. Bieżący stan i nowe wyniki: [followup-progress-account.md](followup-progress-account.md). Poniższe wyniki opisują wcześniejszy etap P0–P5.

## Rezultat i zakres
W głównym checkout `patternly`, od HEAD d4509b4, bez commitów i nowych zależności. Plan i niezależny briefing poprzedziły implementację. P0 minimum .82 (approval). Refaktor nie zmienia curriculum, progresji, kontraktów pytań, persystencji sesji ani synchronizacji konta.

- PracticeHub/TopicRoadmap/PracticeSetup: jeden czysty reader `src/application/practiceReadModels.ts` i feature hook, tylko potrzebne odczyty, jawne błędy zamiast partial-as-empty, retry/cleanup, track/topic/mode guardy, reset formularza przy zmianie route. Hub ma jedno wejście Custom Practice, aktywny temat prowadzi do roadmap, Continue jest sticky; znany locked topic w route jest odrzucany.
- Activity: bezpieczny owner generacji odczytu/retry/focus, błędy storage, terminalna historia i canonical result reads zachowane, lokalny dzień/tydzień oraz EN/PL daty. Jeden filtr i clear. Pusty Progress zachowuje Open Practice i pozwala wejść do historii wszystkich ścieżek.
- Settings: wspólne grupy, prawdziwa wersja package, uczciwy opis setup, typed Appearance z busy/error i synchronicznym single-flight, Notifications loading/error/foreground/single-flight, dostępne Close, KeyboardAvoidingView sprawdzony z rzeczywistą klawiaturą i błędem godziny, opt-in alerty. Dane/Legal zachowują wspólną prezentację i bezpieczne unavailable links; copy konta opcjonalnego odpowiada bieżącemu flow preview/confirm.

## Usunięte ścieżki
Usunięto `PreferenceSelectionScreen.tsx` (jedyny runtime consumer), trzy duplikaty loaderów practice, powielony Custom Practice row, martwy scenario setup scaffolding i skeleton, mapę labeli Appearance, fałszywe metadane i nieużywane odczyty locale. Czysty reader przeniesiono z tymczasowej lokalizacji features do application; nie ma dwóch implementacji. Lista plików: changed-files.txt.

## Faktyczna weryfikacja
- `npm run qa:static` **PASS**: recovery:check, `tsc --noEmit`, **743/743**, content boundary, runtime privacy boundary. Pełny log final-qa.log.
- `git diff --check` PASS.
- Ostatni narrow: `node --import tsx --test src/application/practiceReadModels.test.ts src/features/practice/practiceRouteGuards.test.ts src/navigation/loadingStateOwnership.test.ts scripts/mutationArchitecture.test.ts` **46/46**.
- `node --import tsx --test src/content/contentPackageRuntimeCutover.test.ts` **4/4**, w tym porównanie primary mode z profilem każdej bieżącej ścieżki.
- P2 daty: Warszawa 21/21, Nowy Jork 15/15 po korektach, w tym granica tygodnia i DST. Szczegóły i komendy w P2-QA-corrections.md.
- Native iPhone 17/iOS26.4: Practice selection/setup, settings/theme/info, real keyboard + invalid time, light/dark/200%, Activity empty/filter/clear, pełna sesja10pytań + readonly answer review, completed Activity row → canonical result **PASS**. Dokładne runs i ograniczenia: visual-evidence.md.

## Korekty wynikające z QA
Naprawiono zastane dwa testy baseline (712/714), zachowując aktualny kontrakt exam owner i kolejność rzeczywistego nested Maestro flow. Integracyjne bramki wykryły surowy issue.message i nieprawidłowe ownership importu; reader przeniesiono do application i użyto StorageReadError. Stara asercja inline default-mode została zastąpiona wiring + realnym sprawdzeniem profili. Niezależny QA znalazł brak primary CTA pustego Progress, locked route oraz accessibility uwagi; przyjęte poprawki i ich testy są w repo.

## Ograniczenia i kolejne ryzyka
- Native evidence dotyczy iOS. Android i ręczny odsłuch VoiceOver/TalkBack nie zostały wykonane; semantyka accessibility sprawdzona w kodzie/testach i dostępność kontrolek przez Maestro.
- Powiadomienia: native sprawdzono stan undetermined, edycję, invalid input i zamknięcie. Nie nadano systemowego uprawnienia ani nie zapisano realnego reminder; scheduler/permission/save/disable sprawdzają istniejące testy application/guard. Nie ma pełnego renderer testu hooka dla wszystkich zdarzeń AppState.
- Native wynik: Algorithms. Generic/simulation route mapping niezmieniony i pokryty testami downstream, bez nowego bezpośredniego renderer testu trzech tras.
- Przyszłe nieznane tryby pakietów nie dostają automatycznej prezentacji UI. Bieżące typowane tryby i profile sprawdzone; rozszerzenie katalogu wymaga świadomej integracji UI.
- Zastana prezentacja HomeTab poza trzema grupami nie została rozszerzona o refaktor wszystkich liczników/tłumaczeń.
- Zapisano jedną zakończoną sesję testową gościa na symulatorze; bez resetu istniejących danych, konta i zmian backendu. Ustawienia systemowe motywu/fontu po capture przywrócono do large/light.

## Odbiór
P0–P5 zakończone. Niezależny P1/P2 QA PASS min .88; uwagi settings accessibility wdrożone i sprawdzone. Końcowa ocena kontrolera: architektura .93, prostota .90, bezpieczeństwo .86 (jawne native coverage limits), utrzymywalność .90; minimum .86.
