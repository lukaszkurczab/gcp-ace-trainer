# WEB WIP — odbiór, 12.10.2026

**Niezależny PASS WITH ISSUES, CODE_ONLY + rzeczywisty Chrome.** Odebrano istniejący public-site WIP i naprawiono potwierdzoną niedostępność widocznych sekcji przed intersection. Źródłowy commit `ba5f1607ac29e44831b9e22ecebae61ab36f78ac`, zwykły push, [PR1 MERGED](https://github.com/lukaszkurczab/patternly-web/pull/1). Primary main po FF `051fe5376d4781d3ec88ba0c41535b1d224ceb0b`, clean/origin0/0. Poprzedni safeguard77e1f4c był już zdalnie opublikowany; ta sesja nie przypisuje sobie jego pushu.

## Problem i zmiana

CSS `.reveal` wyświetlał treść, lecz useReveal ustawiał inert lub aria-hidden/tabindex-1 do intersection. Widoczna treść była niedostępna dla klawiatury i czytnika. Hook teraz steruje wyłącznie klasą animacji; usunięto martwe helpers i MutationObserver odpowiedzialne za blokadę focus. Zachowano no-JS, reduced-motion i layout. Dwa zmienione pliki: `src/hooks/useReveal.jsx`, `scripts/public-site.browser.test.mjs`.

Root projekt: cel0,95/prostota0,94/ryzyko0,90/utrzymanie0,92, min0,90. Independent persist_design LunaHigh: min0,95, accepted. Solewriter persist_writer LunaHigh, root testy/Git/dokumentacja, independent źródła i pełne logi, bez potomków.

## Kryteria i dowody

Wersjonowany test z rzeczywistym Chrome zatrzymuje IntersectionObserver, sprawdza nagłówek w AX tree i role lookup, Tab przed i po callbacku, brak inert/aria-hidden/tabindex suppression oraz Enter aktywujący demo. Matching actual tool EXIT0, browser3/3: `/private/tmp/patternly-web-wip-browser-final-02.log`. Zachowane testy no-JS,320/390/768/1440,legalPL,404/admin/privacy-request i nawigacja Escape.

11/11 lokalnych testów, canonical demo parity i Vite build local-test EXIT0: `/private/tmp/patternly-web-wip-check-final-02.log`. Verifier ograniczonego payloadu dwóch przykładów, braku starego SQL i pełnej puli EXIT0: `/private/tmp/patternly-web-wip-demo-bundle-final-02.log`. Świeży artefakt `/private/tmp/patternly-web-wip-build-final-20261012`; źródła nie zmienione między kontrolami a commitem. `git diff --check` PASS. Niezależny reviewer przeczytał źródła i pełne logi, nie wykonywał osobnego heavy rerun.

Pierwszy verifier EXIT1 wykrył dwa stare/current bundles w ponownie użytym prywatnym outDir, a nie defekt kodu. Zbudowano do nowego pustego katalogu; identyczny verifier i matching Chrome3/3 przeszły. Historyczne logi zachowane.

## Granice

WEB nie ma skonfigurowanego hosted CI. Wynik jest odbiorem lokalnego source WIP, nie deploymentem, R01/R02/legal/domain/Hosting/store readiness. Nie zmieniono credentials, danych profili, stashów ani środowisk zewnętrznych. Jedyna kolejka pozostaje w PATTERNLY-WORKING-PLAN.md.
