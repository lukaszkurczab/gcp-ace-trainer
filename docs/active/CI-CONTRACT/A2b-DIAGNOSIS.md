# CI-CONTRACT/A2b — diagnoza zależności bramek

**Data:** 24.09.2026

**Status:** `WAIT: AWS-02/CANDIDATE`; A2b nie jest wykonane.

Po A2a hostowany content workflow przechodzi testy, build i scoring kanonicznych źródeł, po czym zatrzymuje się na nieistniejącym `generate:candidate-readiness` ([run 35973400014](https://github.com/lukaszkurczab/patternly-content/actions/runs/35973400014)). Dalej pozostały brakujące generowanie review packets i release gate. Ręczny `real-content-release.yml` również wywołuje nieistniejące walidator i release gate.

Obecny `candidate-draft-v2.mjs` tworzy dziewięć artefaktów, lecz jego manifest ma `draft_not_admitted`, `not_granted` dla decyzji i admission oraz `appReleaseLockUpdated: false`. Historyczny walidator readiness w `candidate-manifest.mjs` odnosi się do manifestu v1 i `humanApproval`. Aktywny plan wymaga aktualnej delegowanej decyzji Codex oraz readiness dla nowego kandydata w `AWS-02/CANDIDATE`; nie wolno podstawić historycznej zgody ani nazwać draftu wydaniem.

Brief rozważył zastąpienie brakujących poleceń testem integralności draftu w obu workflow. Ocena niezależnej walidacji dla tego podejścia jako realizacji A2b: **0,68**, poniżej progu 0,8; zakres odrzucono. Niezależna walidacja `gpt-6-luna` high potwierdziła, że byłby to tylko osobny, niewydawniczy slice (0,91), a nie zachowanie ochrony readiness/release wymaganej przez [przegląd repo](../../PATTERNLY-REPO-PLAN-ADDITIONS.md#add-ci-contract--zgodność-pipelineu-z-rzeczywistymi-komendami-repo).

**Dalszy kontrakt:** `AWS-02/CANDIDATE` ustala exact manifest, delegowaną decyzję i aktualne readiness/review. Następnie A2b wiąże workflow z tymi rzeczywistymi kontrolami, a ręczny workflow zachowuje semantykę release i wymaga właściwego admission. Negatywne przypadki muszą odrzucać stare lub zmienione powiązania i brak decyzji. Do tego czasu cały content workflow pozostaje czerwony; A2a jest jedynie potwierdzonym podzbiorem. Zgodnie z regułą kolejki następne dostępne zadanie to `AUD-FIXTURE/A`.
