# BIZQ-01 — CI workspace inputs06

## Cel
Restore the actual sibling backend input required by existing full app QA, without weakening or skipping any gate.

## Ustalenia
Home1a run37096108113 inputs/candidate/prebuild/inventory/typecheck and cross-repository job pass. Fullnpmtest has16 failures:3 runner config cases fail at the statically imported missing backend module,13 release-manifest cases share a missing backend clone setup. Existing manifest fixtures use actual backend OpenAPI owner and symlink backend dependencies. Web is a synthetic Git fixture; no real web input is needed. Actual public backend defaultmain/current019e48e confirmed; freshfourrepo refs0/0/stashes6/4/2/0 unchanged. Root isolated actual clones reproduce missingbackend RED, supplied realbackend+existing lockeddependencies GREEN16/16. This local reuse does not claim a fresh npmci: CI installs from lock. No emulator starts in the fail-fast config tests.

## Podejście
Only qa-static receives checkout lukaszkurczab/patternly-backend refmain/pathpatternly-backend/fullhistory, resolved40hexHEAD recorded inlog/output; its package-lock joins existing Node cache inputs; locked npmci precedes unchanged baseline. Nativeprebuild, candidate/content/source guards, all full tests and crossrepo job unchanged. No services/backendsource/web/device/process/runtime/deploy/purchases. Existing docs12 input contract recorded beforeworkflow. Root actual16tests and structural YAML/exact unchangedotherjob checks, independent Luna High QA, scopedstage/ordinarypush and actualCI observation. No custom verification product/tooling or new gating rule.

Root fit.96/simplicity.96/risk.90/maintenance.94 min.90. Independent NO-TOOLS Luna High PASS fit.96/simplicity.95/risk.90/maintenance.93 min.90 beforecode. Conditions: correct siblingpath, actualresolvedSHA, lockeddependencies beforebaseline, keepallgates; main acceptable for currentupstream QA only, not immutable release pin. Existing unrelated queueappend/auditWIP preserved.
