# BIZQ-01 — jednorazowa korekta Guest fixture

## Cel
Otworzyć zwykły osobny profil lokalnego konta Premium przy zachowaniu oryginalnej nauki, celów, planów i ustawień Guest. PO jawnie upoważnił zmianę Guest06.10.

## Ustalenia
Fresh canonical81/84 i7fields exact32; publicregistry/logout/profile/marker exact32. Marker adoption_pending/accountBoundfalse prowadzi w AccountSessionProvider657–665 do zachowania Guest i adoption. Po markerze guest kod zamyka Guest scope i przygotowuje osobny account. Canonical clearGuestAccountBinding zachowuje oba IDs, zmienia tylko accountIdnull/bindingStateguest. Nie ma nowego defektu produktu; nie dodajemy cancel UI. StandaloneAuth/backend registration31 nie ustawia markera, AppRegistration robi to ponownie.

## Podejście
Jednorazowy wersjonowany inspector helper tylko smoke/sandboxproject, initializedexports, activeGuest exacthash/no transition i exact installation IDs/adoptionpending/unbound. Wywołać istniejące clearGuestAccountBinding raz; nie rawstoragewrite/factory/bootstrap/migration. Przedcall freshsnapshot guards noactive/draft/journal/nodeletion. Readback IDs unchanged/accountnull/guest. Potem freshsnapshot exact7fields81/84 i separatepublicprojection exact oprócz marker.bindingState. Unknown result stop; freshread przed jakąkolwiek powtórką. Bez innych lifecycle/accounts/logout/settings zmian. Potem standalone account provisioning i ordinary UI login z31, bez transfer/discard.

Oceny root fit .95/simplicity .91/risk .85/maintainability .88, minimum .85. Review pierwszyFAIL błędnie zinterpretował branch; correctedexactsource facts resolved → PASS WITH GAPS. Nie native/Premium acceptance.
