# CH-06 — bieżący format przypomnień i odczyt bez zapisu

## Zakres i projekt

Źródło wymagań: [CH-06](../specs/engineering/code-health.md). Stan: implementacja zamrożona; niezależny bounded source/runtime odbiór zakończony, pełna lokalna bramka PASS, niezależny final local QA PASS WITH ISSUES. Jedyny writer: persist_writer, Luna High, checkout `.qa-private/persist0408-exact/patternly` na199d8398400c0d4f0cae33a1006a1efc46ca6a7f. Root odpowiada za dokumentację/Git; persist_design Luna High za niezależny przegląd i QA. Bez dalszych subagentów.

Cel: current-only/read-only repository settings/journal, jawne odrzucenie starszych formatów bez zmiany danych; zachowanie bieżącej obsługi accepted plan i recovery. Usunięcie migratorów i martwych dawnych helpers, current-only export/inventory; coordinator bez efektów po błędzie rekordu. Pole `legacyNotificationIds` pozostaje bieżącym backlogiem niepewnych anulowań. Bez zmiany schematu, UI, polityki planowania, profili lub SDK.

Root: cel0,95/architektura0,92/prostota0,93/ryzyko0,90/utrzymanie0,94; minimum0,90. Niezależny design PASS: cel0,96/architektura0,92/prostota0,93/ryzyko0,85/utrzymanie0,92; minimum0,85. Krytyczne ryzyko: odróżnić obsolete compatibility od bieżących cancellation IDs i pending recovery.

## Kryteria odbioru

1. Absent/current/old/malformed settings i journal: każdy odczyt zero write/remove; absence=null, starszy format jawnie unsupported, dokładne zapisane bytes zachowane.
2. Bieżący canonical roundtrip, envelope revision i CAS bez zmian. Save/clear nie nadpisują ani nie usuwają nieobsługiwanego rekordu.
3. Bieżący cancellation backlog/pending/retry zachowuje native notification IDs także przy niepewnym anulowaniu.
4. Operacje przypomnień reconcile/enable/disable/retry na starszych danych fail closed: zero schedule/cancel i zero write/remove w rekordach przypomnień. Zapis kanonicznego planu/celu i wyboru ścieżki zachowuje dotychczasową niezależność od nieblokującego reconcile przypomnień. Brak fake success/default fallback.
5. Export/inventory obsługują wyłącznie bieżący format; jawne odrzucenie starego bez ujawniania raw IDs.
6. Tożsamość accepted plan/slot i bieżące pending recovery bez zmian.
7. Narrow behavior suites, typecheck/boundaries, niezależne QA i wymagany full gate; po odbiorze spójny commit/push i exact CI. Native UI/device nie są zmieniane i nie są dowodem tych testów.

## Weryfikacja

Pierwszy zamrożony diff SHA25611acf14e63dbed53e988e7cac4b02453cf0109ba9df8dac428e5c9a693fb4e34,5files. Worker: repository9/9PASS, runtime21/21PASS, Guest export19/19PASS, typecheckexit0,diffcheckPASS; niezależne QA trwa. Root potwierdził hash, prześledził catches useNotificationSettings/account/learningPlan runtime/GoalCadence/SelectTrack. To przegląd źródeł, nie native wykonanie. P11 diagnostic CI38186436155 jest dowodem osobnego pakietu, nie CH-06. Zachować12profili, jednego Gościa, obce zmiany/stashe/procesy; bez resetu/reinstalacji/newGuest/forcepush.

Niezależny persist_design Luna High: repository9/9, reminder runtime21/21, Guest export19/19, notification presentation10/10, GoalCadence/SelectTrack23/23, learningPlanMutationRuntime4/4, deletion-pending-until-disabled1/1 PASS. Własna malformed settings/journal ×4operations matrix8/8: typed rejection, exact bytes retained, zero reminder writes/removes i source/permission/list/schedule/cancel. Werdykt bounded PASS WITH ISSUES wskazywał tylko dwa nieużywane importy; usunięto je. Macierz utrwalono w istniejącym teście; production source byte-identical z niezależnym QA. Reviewer odczytał finalną korektę i potwierdził zgodność z własnym probe. Final diff SHA256d1df347009fd8420780c3764152b21f849b813ca96b733eacafca9c7a6eaa9a1, runtime rerun21/21PASS,diffcheckPASS. Nie sumować narrow counts z full gate.

Root full qa:static na final freeze exit0, session39560:2457total/2452PASS/0FAIL/5SKIP, recovery488source/364testfiles/2343cases, Stage1/TC/content/privacyPASS. Log0600 zachowany w ignored `artifacts/private/ch06-20261012/fullgate.log`. Wejścia: APP199d8398+frozen5file diff, clean content e57f32a743f8b8afbdf7fbddb215322239bceffa, historicalcc3efca88be7e01137f10ac69a0643f06b61a350,backend4d8efbd6cab8f8fc31d39970fd8e6abb1a0c45eb. Nie uruchamiano device/native; zmiana nie obejmuje UI/native adaptera.

Final local niezależny odbiór: PASS WITH ISSUES. Pozostałe5SKIP to cztery HTTP recovery wymagające środowiska i jeden opcjonalny CC04 artifact. Nie są zaliczone jako PASS. Brak pozostałego defektu CH06; Dostarczono zwykłym push commit108ed921d6a7e1c471f1016df2eb63fabede3974 (9files:5source/test+4own docs). Hosted exact CI38188409170 SUCCESS obu jobs dla dokładnego108ed921d6a7e1c471f1016df2eb63fabede3974; niezależny persist_design Luna High potwierdził pełny log, piny i PASS WITH ISSUES:2457total/2452PASS/0FAIL/5SKIP,contracts3/3,recovery488/364/2343,Stage1/TC/content/privacyPASS. Wejścia content e57f32a7,historicalcc3efca8,backend4d8efbd6. Finalmetadata przenoszone z następnym spójnym pakietem źródłowym, bez metadata-only push; source checkout clean poza niestage node_modules symlink.
