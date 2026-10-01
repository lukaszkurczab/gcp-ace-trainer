# OPS-B3 — niezależny odbiór

Model `gpt-6-luna`, reasoning `high`; agent `/root/ui11_qa`. Końcowy wynik **PASS** dla zamrożonego CLI, lokalnych syntetycznych HTTPS/PTY i kontraktów. Własny command: `node --import tsx --test --test-concurrency=1 tests/operatorCli.test.ts tests/operatorCli.tty.test.ts tests/operatorOidcVerifier.test.ts tests/openapiContracts.test.ts`;54PASS/0FAIL/zeroSKIP, zatwierdzone wykonanie poza sandboxem dla /dev/tty. TAP został zwrócony w narzędziu, nie zachowano osobnego logfile.

Sprawdzono TLS/certyfikat, brak forward credentials przy redirect, expiry/lifetime/futureiat, deniedorigin bez HTTP,500/malformed200 po mutacji z jednym PATCH i jednym reconciliation GET, CAS, stableID, opis skutków przed confirm i brak payload/token echo. Native pokrywa FD3 oraz pipedstdin z osobnym terminalem. Finalny cleanup zamyka tylko własny /dev/tty, nie standardstdin. Brak pozostałego defektu w badanym zakresie. Wcześniejsze PASS WITH ISSUES dotyczyło brakujących testów negatywnych, które zostały dodane; następny actualnative test wykrył dwa błędy stdin, oba naprawione przed końcowym PASS.

Domyślny sandbox:53/54, wyłącznie EPERM dostępu terminala w pipedstdin. Zatwierdzony rerun54/54 potwierdza działanie kandydata. Brak weryfikacji realOIDC/provider/deploy. Sourcepins i finalne rootgates: `evidence/`.
