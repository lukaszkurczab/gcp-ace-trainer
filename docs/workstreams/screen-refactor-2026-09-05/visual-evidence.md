# Wizualna weryfikacja — zakończona
Model kontrolera: główne zadanie; worker/QA: Luna/max. Symulator iPhone 17 iOS 26.4, UDID C3477113-C193-4C0F-9125-FEC9E5A71181. Zastany content_size `large`, appearance `light`. Metro 8081, natywna aplikacja com.lkurczab.patternly. Nie wykonano resetu danych, zalogowania ani wysyłki wiadomości. Wejście przez Continue without an account i Start track (Coding Interview).

## Baseline
- `/tmp/patternly-screen-refactor/start-output/2026-09-05_084505/start/takeScreenshot/before-practice.png`: pełny Hub, duplikacja Custom Practice w hero i liście, widoczny stan unavailable review. Obecny design system zachować.
- `/tmp/patternly-screen-refactor/start-output/2026-09-05_084505/start/takeScreenshot/before-settings.png`: statyczny opis 20 items wygląda jak bieżąca preferencja, grupy to oddzielnie zaokrąglone wiersze z separatorami (do uporządkowania, bez zmiany tokenów globalnych).
- `/tmp/patternly-screen-refactor/details-output/2026-09-05_084624/details/takeScreenshot/before-appearance.png`: radio wybór System/Light/Dark.
- `/tmp/patternly-screen-refactor/details-output/2026-09-05_084624/details/takeScreenshot/before-notifications.png`: undetermined permission błędnie opisane Checking mimo przycisku Enable. Brak runtime exception na wejściu.

Maestro start.yaml PASS. details.yaml przeszedł Appearance/back/Notifications/captures, tap Daily reminder wymaga regex pełnej etykiety ListRow (title+detail); nie jest to dowód braku działającego elementu.

## Macierz do zakończenia
| Grupa | Wymagane dowody | Stan |
|---|---|---|
| Practice | Hub → Roadmap → wybór/powrót; setup → wybór długości/feedback → sesja; light/dark/duży tekst | partial baseline |
| Activity | empty, filter, completed row → result; local date + PL testy | planned |
| Settings | appearance save, notifications permission/editor/keyboard/errors, YourData topic sheet, Legal unavailable links; light/dark/duży tekst | partial baseline |

Screenshots są dowodem widoku, nie dowodem wszystkich stanów async. Error injection/concurrency w testach behawioralnych, native capture tam gdzie realnie dostępny. Końcowy raport ma przenieść użyteczne zrzuty do trwałych artifacts i uzupełnić rzeczywiste pokrycie.

Additional baseline: reminder sheet opens via `Daily reminder.*`. Its only Close action is the backdrop outside `accessibilityViewIsModal`; Maestro `tapOn: Close` cannot reach it. Shared sheet requires a visible accessible close control inside modal (P4). The screenshot after tapping time field does not show keyboard, so it is not evidence of keyboard-safe layout; simulator hardware keyboard state requires verification. A failed assertion in info.yaml used the wrong expected title Daily practice reminder instead of actual Daily reminder; corrected interpretation, not a product bug.

Baseline dark/large: simctl appearance dark, content_size accessibility-extra-extra-extra-large (app text cap 2x). large.yaml PASS dla Hub/Settings/Appearance. Widoki Appearance mieszczą radio + preview i pełne opisy; nie potrzeba przebudowy designu. Settings appearance value zajmuje prawą kolumnę kosztem wielowierszowego opisu — P4 preferować value przy copy dla dużego tekstu. Native screenshoty: `/tmp/patternly-screen-refactor/large-output/2026-09-05_085402/large/takeScreenshot/`.

Trwałe baseline zrzuty skopiowane do `artifacts/screen-refactor-2026-09-05/before/`, wykonane YAML do `artifacts/screen-refactor-2026-09-05/flows/` (artefakty ignorowane przez git zgodnie z repo). Błędne assertions/tap z pierwotnych prób zachowane jako diagnostyka, nie oznaczone PASS. Przywrócono zastane simctl `large` / `light` po baseline.

P1a native smoke: setup-retry run `2026-09-05_090214` PASS Hub tab → open-setup → setup root i screenshot. Jest to dowód integracji loaderów, jeszcze przed końcowymi P1b UX changes. Poprzednia próba zaczynała się Go back, ale Metro odświeżyło nawigację do Home; failure wynikała ze stanu startowego. Końcowe flow muszą zaczynać od sprawdzonego ekranu.

## Końcowe native runs — PASS
| Run | Dowód |
|---|---|
| practice-final-output/2026-09-05_093116 | Hub→Roadmap→Continue→Setup, długość10 i at-session-end |
| settings-final-output/2026-09-05_093341 | Settings, theme save, Notifications, reminder Close, YourData/Legal |
| reminder-keyboard-fixed-output/2026-09-05_093905 | realna klawiatura, invalid29:00, czytelny błąd i Save/Close |
| large-final-output/2026-09-05_094045 | Practice, Roadmap, Setup, Settings, Appearance, Notifications i reminder dark/200% |
| activity-empty-final-output/2026-09-05_094623 | empty Progress→Activity, filter, filtered empty, clear |
| completed-session-output | pełna sesja10 pytań, wynik i readonly review (brak Submit/Leave w review) |
| activity-completed-final-output/2026-09-05_095703 | completed row→kanoniczny wynik tej samej sessionId |
| data-final-output/2026-09-05_095856 | końcowy poprawiony optional-account copy + panel |
| activity-large-output/2026-09-05_100010 | completed Activity i filtr dark/200% |

Użyteczne końcowe screenshoty skopiowano do artifacts/screen-refactor-2026-09-05/after; manifest.json mapuje źródłowy run do pliku. Flows w sąsiednim flows/. Artefakty ignorowane zgodnie z repo; dokumentacja i log testów nie są ignorowane. Baseline before/ zachowane. Stare zrzuty YourData z 09:33 nie są finalną wersją copy i pominięto je w after/.

Nieudane próby zachowano w /tmp: reminder-invalid ujawnił prawdziwe zasłonięcie Save (naprawione KAV); pierwsze Activity-completed zakładało tab bar podczas readonly review, drugie szukało footer return przewijając UP. Ostateczny poprawiony flow PASS. Te błędy scenariusza nie były zmianą semantyki wyników.

Kontroler obejrzał screenshoty light/dark/200%: tekst zawija się i ekrany przewijają, sticky actions pozostają dostępne, modal Close działa; field/error/Save widoczne nad realną klawiaturą. To nie jest odsłuch VoiceOver ani Android QA. Native permission grant/save/disable nie wykonano; stan undetermined i formularz sprawdzone, application tests zachowane. Symulator przywrócony large/light po ostatnim capture.
