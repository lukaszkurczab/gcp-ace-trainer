# Patternly — skrócony stan pracy

Kanoniczna kolejka, decyzje właściciela i acceptance contracts są w [`docs/PATTERNLY-WORKING-PLAN.md`](../docs/PATTERNLY-WORKING-PLAN.md). Zawsze sprawdź bieżący HEAD, working tree, testy i konfigurację przed wznowieniem zadania.

## Aktywne zadania

- Pętla 2026-09-30: cel aktywny; wejścia po fetch: app `534c380c`, backend `4f714e5`, content `0174e42`, web `9585919`; trzy repo poza app pozostają czyste. Wszystkie stashe zachowane, odtworzono wyłącznie tracked diff aktywnego UI-26-11.
- `UI-26-11`: implementacja i świeża macierz runtime PASS: 7 locale, standard/2×, light/dark, 1/3/7 dni, target absent/present, wszystkie stany, błędy i rapid tap Edit/Accept (1 wywołanie), realny guest edit/back/accept/restart/persisted oraz platformowy gest Back. Duże warningi i platformowy Back PASS. Niezależne QA: PASS WITH ISSUES, tylko nieblokujące łamanie wyrazu FR 2×. Zadanie odebrane; wymagane commit/push app main. Evidence: `docs/active/UI-26-11/REPORT.md`. Fit minimum .84; fixture i poprawka niezależnej nawigacji .82, zwalidowane Luna High. Testy końcowe 17/17 + regresja13/13, typecheck/content/privacy/diff-check PASS.
- Środowisko: jeden istniejący iPhone17 `7F315654-3175-4F3C-BB24-B0263F59360C`, Node22.22.3, Metro localhost8081, backend smoke8080/Auth19099 nad istniejącym Firestore18081. Probe `/ready`/Auth/local AppCheck PASS; brak dowodu realnych providerów. Datastore backendu nie resetowano. Izolowany lokalny Gość ma już zaakceptowany plan; real-guest flow wymaga startowego braku planu, więc nie uruchamiać ponownie bez jawnego przygotowania izolacji.
- Następne `UI-26-12`: rozpoznano aktualny kod i minimalny zakres; native header + SessionShell dublują nagłówek, poprzednie pytanie ma etykietę Back, Unanswered omija kanoniczne linki. Przed edycją nowy briefing/fit/QA i checkpoint środowiska. Nie uruchamiać historycznego exam runnera bez sprawdzenia resetu i tożsamości testowej.
- `AUD-15`: partial; potrzebny odseparowany fixture dla multi/partial oraz pełny duży tekst bez zapisu do chronionego profilu. Raport częściowy: [`docs/active/AUD-15/REPORT.md`](../docs/active/AUD-15/REPORT.md). VoiceOver nie jest kryterium.
- Android sandbox: email/hasło działa na Redmi Note 11 po naprawie konfiguracji i promocji backendu sandbox. W bieżącym źródle poprawiono początkowy stan automatycznego unieważniania sesji z `signOutPending` na istniejący ekran ładowania; `signOutPending` zostaje przy rzeczywistym błędzie. Testy powiązane i typecheck przeszły, izolowany eksport Android zakończył się powodzeniem. Zachowanie na telefonie nie jest zweryfikowane, bo urządzenie było odłączone. Ta poprawka nie została opublikowana przez EAS; nie publikować w ramach porządków.

## Ochrona pracy

- Zachować wszystkie istniejące zmiany working tree, konta/testy auth, niepowiązane zmiany `AccountEntryScreen` i lokalne stashes. Nie resetować konta, danych profilu ani emulatorowego datastore.
- Zachować stashes: `UI-26-02B`, `UI-26-11`, `UI-26-09`, `UI-26-08`, `UI-26-07`, `I18N01`. Są niezależnymi wersjami zmian i nie zastępują aktualnego diffu.
- Przed testem runtime użyć istniejącego iPhone'a 17 zgodnie z kanonicznym planem. W tym porządkowaniu nie tworzyć urządzeń, nie publikować buildów i nie wykonywać deployów.
