# Niezależny przegląd dwóch failures baseline
Agent brief_validation, gpt-5.6-luna/max. Read-only; po ukończeniu walidacji briefingu dostał osobne zadanie repo inspection. Komenda: `node --import tsx --test --test-name-pattern 'Certification route handoffs|RC Algorithms bootstrap resets' scripts/mutationArchitecture.test.ts src/tracks/coding-interview/rcAlgorithmsBootstrap.test.ts`. Obie wskazane failures odtworzone, runner test pass.

1. mutationArchitecture: stale assertion. ExamScreen przekazuje resumeExpected/start do examReadOwner i wywołuje load(token, route.params?.expectedSessionId). Testować wiring w screen, expected branch w ownerze i brak start w niej; dodać behavioral rejected resume → no start jeśli niepokryte. Bez potwierdzonego production bug.
2. rcAlgorithmsBootstrap: stale assertion. YAML ma guest branch, guarded change-track branch z nested runFlow, wybór + Continue, final wait/assert. Stary test oczekuje płaskiego flow i pojedynczego runFlow. Test ma sprawdzać nową semantyczną kolejność/guardy bez fałszywego wymagania starych wcięć. Runner iOS test pass. Bez potrzeby zmian runtime.

Decyzja kontrolera: uzasadnione korekty w P5, osobny single-writer test-only slice po implementacji; zachować kontrakty i testy async, nie zmieniać produkcji egzaminu.
