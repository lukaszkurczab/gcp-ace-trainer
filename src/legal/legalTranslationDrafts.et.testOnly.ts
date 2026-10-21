/** Täielik eestikeelne tõlkekavand. Ainult testimiseks; väljalaskeks kinnitamata. */
export const estonianLegalTranslationDraftTestOnly = {
  privacyPolicy: String.raw`Patternly privaatsuspoliitika

Kehtib alates {{privacy.effectiveDate}}. Versioon {{documentVersion}}. Käesolev poliitika selgitab, kuidas {{privacy.controllerLegalName}}, {{privacy.controllerBusinessForm}}, aadressil {{privacy.controllerAddress}} (vastutav töötleja), töötleb Patternlys isikuandmeid.

1. Vastutav töötleja ja kontakt

Vastutav töötleja: {{privacy.controllerLegalName}}, {{privacy.controllerBusinessForm}}, {{privacy.controllerAddress}}. Privaatsuskontakt: {{privacy.privacyEmail}}; telefon: {{privacy.controllerPhone}}. Andmekaitsespetsialist või määratud privaatsuskontakt: {{privacy.dpoContact}}.

2. Kohaldamisala ja vanusepiirang

Poliitika hõlmab mobiilirakendust, kontot ja sünkroonimisteenuseid, avalikke õigusteabe lehti ning toe ja sisust teatamise kanaleid. Kontota külalisena õppimine võib olla kättesaadav ka noorematele kasutajatele. Konto iseseisev loomine ja pilvesünkroonimine on lubatud vähemalt 18-aastastele; Patternly ei paku vanema või eestkostja nõusoleku töövoogu.

3. Seadmesse salvestatavad andmed

Külalisena või kontoga kasutamisel võidakse seadmesse salvestada paigalduse tunnus, kohaliku andmestiku tunnus, valitud õpitee, eesmärgid, seaded, õppeseansid, vastused, tulemused, kordamisjärjekord, taastamise olek, teavituste ajakava ja sisuteadete saatmata teadete järjekord. Kohalikud meeldetuletused ajastatakse seadmes; Patternly ei registreeri praegu serveri tõuketeavituste tokenit.

Kohalikke õpiandmeid kaitsevad Patternly kasutatavad seadme salvestusruumi turvakontrollid. Ainult seadmesse jäävaid andmeid vastutavale töötlejale ei saadeta, välja arvatud juhul, kui lood konto ja sünkroonid lubatud kirje, saadad teate või kasutad muud võrgufunktsiooni.

4. Konto- ja autentimisandmed

Konto puhul töötleb Patternly Firebase’i ja Patternly kasutajatunnuseid, e-posti aadressi, kinnitamise olekut, autentimisteenuse pakkujat ning turvasündmuste ajatemplid, et kontot luua ja kaitsta, päringuid autentida, toetatud andmeid sünkroonida, juurdepääsu taastada ja väärkasutust ennetada. Õiguslik alus on teenuselepinguga seotud teenuse osutamine ning vastutava töötleja õigustatud huvi teenuse turvalisuse vastu; säilitamisele kuuluvate kirjete suhtes kohaldatakse seadusest tulenevaid kohustusi.

Google ja Firebase töötlevad autentimis- ja seadme tõendamise andmeid enda tingimuste alusel. Kui Apple’iga sisselogimine muutub kättesaadavaks iOS-i hilisemas versioonis ja valid selle meetodi, võib Apple samuti töödelda autentimisandmeid enda tingimuste alusel. GDPR-i artikli 14 tähenduses võivad need teenusepakkujad olla allikad, kellelt Patternly saab identiteedi- ja teenusepakkuja tunnuseid, tagastamise korral e-posti aadressi ja nime ning seadme tõendamise või turvasignaale. Kui valid Apple’iga sisselogimise, küsib Patternly e-posti ja nime õigusi ning piirab nende kasutamist autentimiseks ja konto haldamiseks tagastatud väljadega.

5. Õppimise ja sünkroonimise andmed

Kui sünkroonimine on lubatud, saadab Patternly taustateenusele valitud õpitee ja lõpetatud õpikirjed, näiteks seansside kokkuvõtted, tulemused, vastused, kordamise oleku, versioonid, ajatemplid ning seadme või andmestiku tunnused. Aktiivsed mustandid, taimerid, eelistused ja teavituste seaded ei kuulu praegusesse sünkroonimise lubatud loendisse. Eesmärk ja õiguslik alus on konto sünkroonimisteenuse osutamine ja selle terviklikkuse säilitamine.

Õppimise edenemist säilitatakse konto olemasolu ajal ning see eemaldatakse konto kustutamise käigus, arvestades allpool kirjeldatud piiratud kustutamistõendeid. Lõpetatud sünkroonimistoimingute metaandmeid säilitatakse pärast lõpetamist {{privacy.completedSyncOperationRetentionDays}} päeva.

6. Sisuteated ja suhtlus

Sisuteade võib sisaldada kategooriat, valikulist vabas vormis kirjeldust, juhuslikku esitamise tunnust, sisu ja paketi tunnuseid, vaadet, keelt, rakenduse järku, platvormi, aega ning App Checki või seadme tõendamise tokenit. Sisuteate vorm ei lisa kontot ega kontaktmeili. Vabas vormis kirjeldus võib siiski sisaldada isikuandmeid. Server saab ühenduse IP-aadressi ja muudab selle ühesuunaliseks piirangutunnuseks, mida kasutatakse ainult korduvate teadete piiramiseks. Ära lisa paroole ega tarbetuid tundlikke andmeid.

Teateid töödeldakse sisu parandamiseks ja sisuteadete kanali kaitsmiseks. Õiguslik alus on vastutava töötleja õigustatud huvi GDPR-i artikli 6 lõike 1 punkti f alusel hoida sisu täpne ja kaitsta sisuteadete kanalit; võid töötlemisele GDPR-i artikli 21 alusel vastu vaielda. Kõiki sisuteateid säilitatakse alates nende saamisest {{privacy.contentReportRetentionDays}} päeva. Ühesuunalist IP-tunnust kasutatakse {{privacy.reportRateLimitIdentifierRetentionSeconds}} sekundi pikkuse päringupiirangu akna jõustamiseks. Iga uus vastu võetud teade, mis ei ole duplikaat, määrab tunnuse aegumisajaks {{privacy.reportRateLimitIdentifierRetentionSeconds}} sekundit pärast teate kättesaamist. Firestore TTL eemaldab aegunud kirjed asünkroonselt, mistõttu füüsiline kustutamine võib toimuda hiljem. Kohapeal vastu võetud teade eemaldatakse pärast seda, kui server kinnitab selle kättesaamist. Kohalikus järjekorras olev kinnitamata teade eemaldatakse automaatselt {{privacy.localReportOutboxRetentionDays}} päeva pärast.

7. Turvalisus ja tehnilised andmed

Patternly kasutab kontode kaitsmiseks, rikete uurimiseks ja väärkasutuse ennetamiseks autentimistokeneid, App Checki või seadme tõendamise signaale, päringute metaandmeid, võrgu- või e-posti andmete räsimisel saadud piirangutunnuseid, tegevuslogisid ja turvasündmuste kirjeid. Patternly ei kasuta reklaami- ega rakendusteülest jälgimistarkvara, üldotstarbelist välist tootepõhise analüütika tarkvara ega välist krahhide raporteerimise tarkvara. RevenueCat töötleb ostuajalugu tellimusfunktsioonide ja allpool kirjeldatud ostuanalüütika jaoks.

Tegevuslogisid säilitatakse {{privacy.operationalLogRetentionDays}} päeva ja turvalogisid {{privacy.securityLogRetentionDays}} päeva. Patternly eemaldab tootmislogidest mandaadid ja päringute sisu. See versioon ei loo ega kopeeri enam konto taastamiskoode. Varasema versiooni kopeeritud kood võib jääda süsteemi lõikelauale. Kui selle puhastusmarker on alles, püüab Patternly sobiva koodi kustutada salvestatud aegumisajal, {{privacy.clipboardRecoveryCodeRetentionMinutes}} minutit pärast kopeerimist, kui operatsioonisüsteem seda võimaldab. Hiljem kopeeritud sisu ei eemaldata; see ei taga iga ajaloolise koopia kustutamist.

8. Volitatud töötlejad, saajad ja edastused

Kontrollitud aktiivsed pilveteenuse volitatud töötlejad ja nende eesmärgid: {{privacy.activeCloudProcessors}}. Aktiivsed iseseisvad vastutavad töötlejad ja saajad: {{privacy.activeIndependentRecipients}}. E-kirjade edastamise teenusepakkuja: {{privacy.emailDeliveryProvider}}. Teenusepakkujate piirkonnad: {{privacy.hostingRegions}}. Väljapoole EMP-d tehtavate edastuste kaitsemeetmed: {{privacy.internationalTransferSafeguards}}.

RevenueCati olek: {{privacy.revenueCatStatus}}. Kui saad hiljem Google Play kaudu tellimuse, võib Google tehingu- ja tellimuskirjeid iseseisvalt säilitada. Patternly konto kustutamine ei tühista seda Google Play tellimust ega eemalda Google’i iseseisva vastutuse all olevaid kirjeid. Patternly vaatab oma volitatud töötlejad, saajad ja edastuskorrad üle iga kord, kui teenusepakkujad või nende töötlemiskohad muutuvad.

9. Säilitamine ja konto kustutamine

Konto ja sünkroonitud õpiandmeid hoitakse konto aktiivsuse ajal, välja arvatud juhul, kui kehtib lühem tähtaeg või varasem kehtiv taotlus. Konto kustutamisel eemaldatakse konto andmete alampuu, identiteediseosed ja autentimiskonto. Kustutamisel lahutatakse vanad kontoga seotud sisuteated kontoseosest. Kui saad hiljem tellimuse rakenduste poe kaudu, ei tühista konto kustutamine seda tellimust iseenesest.

Pärast kustutamist kasutab Patternly võtmega HMAC-pseudonüümi ainult konto juhusliku taasloomise vältimiseks {{privacy.deletionTombstoneRetentionDays}} päeva alates algsest kustutamisajast, ilma seda aega uuendamata. See on endiselt isikuandmestik, mitte anonüümne teave, kuid teenusepakkuja algset UID-d ei säilitata. Õiguslik alus on vastutava töötleja õigustatud huvi GDPR-i artikli 6 lõike 1 punkti f alusel; võid töötlemisele GDPR-i artikli 21 alusel vastu vaielda, võttes ühendust aadressil {{privacy.privacyEmail}}. Minimaalne kustutamise lõpuleviimise tõend sisaldab läbipaistmatut toimingu tunnust ja kinnitusnumbrit, kuupäeva ning tulemust. Seda võib pärast lõpetamist säilitada {{privacy.deletionEvidenceRetentionMonths}} kalendrikuud, et kontrollida toimingut kasutaja esitatud kinnitusnumbri alusel. See ei sisalda õpiandmeid. Piiratud dokumentatsiooni säilitatakse GDPR-i artikli 6 lõike 1 punkti c ning artiklites 5 lõige 2, 12 lõige 2, 17 ja 24 sätestatud vastutuse ja õiguste kohustuste raamistiku alusel; see ei kehtesta kindlat seadusest tulenevat säilitustähtaega. Patternly ei säilita pärast kustutamist üldist pettustevastast kirjet: konkreetse sündmusega seotud pettustevastane säilitamine vajab eraldi dokumenteeritud ohumudelit ning vajalikkuse ja õigustatud huvi hinnangut. Varukoopiate ja ajapunkti taastamise kustutamine: {{privacy.backupPurgeDisclosure}}.

10. Sinu õigused

Kohaldatava õiguse piires võid taotleda juurdepääsu ja GDPR-i artiklis 15 nõutud teavet, andmete parandamist, kustutamist, töötlemise piiramist või ülekandmist ning esitada õigustatud huvil põhineva töötlemise suhtes vastuväite. Võid nõusoleku tagasi võtta, ilma et see mõjutaks varasema töötlemise seaduslikkust. Kontakt: {{privacy.privacyEmail}}. Taotlused on tavaliselt tasuta. Patternly võib sinu isikut kontrollida ja peab vastama ühe kuu jooksul; kui seadus lubab, võib tähtaega pikendada kuni kahe kuu võrra, teatades sellest esimese kuu jooksul ja selgitades põhjust. Keeldumine peab olema põhjendatud ning selgitama kaebuse ja kohtusse pöördumise võimalusi.

Patternly käsitleb privaatsustaotlusi nende vastuvõtmise, vajaduse korral isiku tuvastamise, hindamise, täitmise või põhjendatud keeldumise ning lõpetamise kaudu. See kehtib ka siis, kui Patternly ei saa külalist lisateabeta tuvastada. Võid esitada kaebuse aadressil {{privacy.supervisoryAuthority}} või muule pädevale asutusele ning taotleda kohtulikku õiguskaitset. Patternly ei tee üksnes automatiseeritud töötlemisel põhinevaid otsuseid, millel on õiguslik või samaväärselt oluline mõju.

11. Muudatused ja versiooni tõendid

Igal avaldatud poliitikal on jõustumiskuupäev ja muutumatu versioon. Olulistest muudatustest teatatakse seaduses nõutud viisil. Kui õiguslik alus on nõusolek, küsitakse vajaduse korral uus nõusolek. Patternly säilitab auditeeritava kirje konto kasutaja poolt vastuvõetud või kinnitatud keele, versiooni, aja ja ulatuse kohta.

12. Vastutava töötleja andmed

Registrinumber: {{privacy.registrationNumber}}. Maksutunnus: {{privacy.taxIdentifier}}. Piirkonnad: {{privacy.distributionTerritories}}.

13. Töötlemise eesmärgid ja õiguslikud alused

{{privacy.processingRegisterDisclosure}}

14. Üksikasjalikud säilitustähtajad

{{privacy.retentionRegisterDisclosure}}`,
  termsOfService: String.raw`Patternly kasutustingimused

Kehtivad alates {{terms.effectiveDate}}. Versioon {{documentVersion}}. Need tingimused moodustavad lepingu sinu ja {{terms.operatorLegalName}}, {{terms.operatorBusinessForm}}, aadressil {{terms.operatorRegisteredAddress}} (operaator), vahel Patternly kasutamiseks.

1. Tingimustega nõustumine

Konto loomisel või Patternly kontopõhiste teenuste muul viisil kasutamisel nõustud nende tingimustega ja kinnitad, et oled tutvunud eraldi privaatsuspoliitikaga. Kui sa tingimustega ei nõustu, ära kontot loo. Külaliskasutusele, mille puhul pole nõustumist vaja, kehtivad siiski kohaldatav õigus ja rakenduse turvaliseks toimimiseks vajalikud reeglid.

2. Õigus teenust kasutada

Patternly nõuab konto iseseisvaks loomiseks vähemalt {{terms.minimumUserAge}} aasta vanust. See on toote reegel, mitte väide, et kõigil noorematel oleks õppimine seadusega keelatud. Kontota külalisõpe võib noorematele kasutajatele endiselt kättesaadav olla. Patternly ei paku vanema või eestkostja nõusoleku töövoogu, seega ei saa nooremad kasutajad kontot luua. Reegli kohaldamisala: {{terms.minimumUserAgeScope}}. Esita konto kohta täpsed andmed ja hoia juurdepääsuandmeid turvaliselt.

3. Teenus

Patternly on sõltumatu õppevahend tehniliste töövestluste ja sertifitseerimisega seotud teemade harjutamiseks. See ei ole ametlik sertifitseerimisasutus, eksamiasutus, värbaja ega kool ning ei taga töökohta, eksamitulemusi ega kutsealast pädevust.

Teenuse täiustamisel võivad funktsioonid ja sisu muutuda. Olulistest muudatustest, mis mõjutavad aktiivset tasulist teenust või sinu seaduslikke õigusi, teatatakse kohaldatava õiguse järgi.

4. Külalisena kasutamine ja kontod

Mõnda funktsiooni saab kasutada külalisena, salvestades andmed seadmesse. Konto võib võimaldada toetatud andmete taastamist ja sünkroonimist. Vastutad oma konto kaudu tehtud tegevuse eest, välja arvatud juhul, kui teatad volitamata juurdepääsust viivitamata.

Kontoteenuse leping sõlmitakse tähtajatult ja kehtib seni, kuni sina või operaator selle nende tingimuste kohaselt lõpetab. Patternly konto kustutamine lõpetab kontoteenuse. Kui ostad hiljem Google Play kaudu tellimuse, ei tühista konto kustutamine seda iseenesest.

Saad konto kustutada rakenduses oleva kustutamisvoo kaudu. Privaatsuspoliitika selgitab, milliseid andmeid see mõjutab, millised säilitamisreeglid kehtivad ja millised on kustutamise piirid.

5. Rakenduse ja sisu litsents

Operaator annab sulle piiratud, isikliku, mitteainuõigusliku, üleandmatu ja tühistatava õiguse kasutada teenust ning selle sisu isiklikuks õppimiseks nende tingimuste ja kohaldatava õiguse järgi. Patternly ja selle algupärane sisu jäävad intellektuaalomandi õigusega kaitstuks.

Apple’i kaudu saadud rakenduse puhul kohaldatakse rakenduse litsentsile eraldi Apple’i standardset litsentsitud rakenduse lõppkasutaja litsentsilepingut, välja arvatud juhul, kui App Store Connectis on esitatud kohandatud EULA. Need tingimused reguleerivad Patternly teenust ega asenda Apple’i kohustuslikke tingimusi.

6. Lubatud kasutamine

Ära kasuta teenust vääralt, sega selle turvalisust või toimimist, sisene teise inimese kontole, automatiseeri ligipääsu väljaspool toetatud funktsioone, möödu juurdepääsukontrollidest, eralda ega levita edasi olulist osa sisust või kasuta Patternlyt seaduse või kolmandate isikute õiguste vastaselt.

Võid seadusega lubatud ulatuses tsiteerida piiratud osi, kuid ilma kirjaliku loata ei tohi küsimustepanka uuesti avaldada ega Patternly sisule juurdepääsu müüa.

7. Premium ja tellimused

Uued Premiumi ostud on praegu keelatud, seega kehtivat tasulist pakkumist ei ole. Kui ostud hiljem lubatakse, on kavandatud pakkumine {{terms.premiumProductName}} (toote tunnus {{terms.premiumProductIdentifier}}), igakuine automaatselt uuenev digiteenus ilma prooviperioodita. Kavandatud hind koos kohaldatavate maksudega Poolas on {{terms.premiumPriceIncludingTaxes}}; kavandatud pikendamise hind on {{terms.premiumRenewalPriceIncludingTaxes}} iga {{terms.premiumBillingPeriod}} kohta. Need on Poola kavandatud hinnad, mitte praegune pakkumine; teiste riikide hinnad pole kinnitatud. Enne ostude lubamist tuleb selle pakkumise kohta esitada asjakohane müüja, kehtiv hind, pikendamisperiood, Premiumi ulatus, makseviis ja -aeg, teenuse algus ning maksekohustus.

Praegune müüja kokkulepe on järgmine: {{terms.merchantOfRecord}}. Tulevase poe-põhise pakkumise müüja ja maksekorraldus pole kinnitatud. Kui tellimus tehakse tulevikus kättesaadavaks ja ostad selle Google Play kaudu, pakub Google selle poe makse- ja tellimuse haldamise kanalit; see ei vabasta operaatorit vastutusest Patternly vastavuse ega sinu seaduslike nõuete eest vastutava müüja vastu.

Tellimus uueneb ainult enne ostu selgelt näidatud tingimustel. Kui ostad selle hiljem Google Play kaudu, saad tulevased pikendamised peatada Google Play tellimuste seadetes ning rakenduse või Patternly konto kustutamine ei tühista seda Google Play tellimust. Olulist hinnatõusu ei loeta kunagi vastuvõetuks üksnes Patternly kasutamise jätkamise tõttu; selleks on vaja kohaldatavat jaatava nõusoleku, uuesti ostmise või uuendamise korda.

Kui ostad hiljem tellimuse Google Play kaudu, võib Google tehingute tagasimakseid oma platvormil hallata. Patternly teenust, selle vastavust või sinu seaduslikke tarbijaõigusi puudutavad kaebused saad esitada ka operaatorile.

Premiumi juurdepääs algab kohe pärast ostu ainult siis, kui oled eraldi ja sõnaselgelt taotlenud teenuse alustamist enne 14-päevase taganemistähtaja lõppu. Ühtegi valikut ei tohi olla ette märgitud. Kui taganed pärast teenuse algust, võidakse kohustusliku õiguse lubatud juhul nõuda proportsionaalset tasu kuni taganemiseni osutatud teenuse eest. Premiumi ei pakuta eraldi ühekordse digitaalse infosisu tarne vormis, seega ei palu Patternly sul sel alusel taganemisõigusest ilmajäämist kinnitada. Muud seadusest tulenevad taganemisõigused jäävad kehtima. Kaebuse esitamine ei piirdu 14 päevaga.

8. Kättesaadavus ja muudatused

Operaator püüab Patternlyt kättesaadavana hoida, kuid ei taga katkematut ega veatut juurdepääsu. Hooldus, turvaintsidendid, teenusepakkujate katkestused, seadme piirangud või õigusnõuded võivad funktsioone katkestada. Võrguühenduseta ja sünkroonitud andmed ei pruugi alati olla samal määral kättesaadavad.

Kui tasuline funktsioon lõpetatakse olulisel määral, pakub operaator kohaldatava tarbijakaitseõiguse ja ostuplatvormi reeglitega nõutud õiguskaitsevahendeid.

9. Teated ja suhtlus

Sisuteate või tugisõnumi esitamisel kinnitad, et see on seaduslik ega sisalda teadlikult materjali, mida sul pole õigust jagada. Sulle jäävad sõnumi õigused ning lubad operaatoril seda kasutada üksnes teate läbivaatamiseks, sinu toetamiseks, teenuse kaitsmiseks ja seadusest tulenevate kohustuste täitmiseks vajalikul määral. Privaatsuspoliitika kirjeldab seotud andmetöötlust.

10. Peatamine ja lõpetamine

Võid Patternly kasutamise igal ajal lõpetada ja konto kustutada. Kui platvormi tellimus muutub hiljem kättesaadavaks, võib olla vaja see platvormi kaudu eraldi tühistada. Operaator võib juurdepääsu proportsionaalselt piirata ainult olulise rikkumise, kinnitatud turvaohu, ebaseadusliku kasutuse, maksmata jätmise või siduva õigusnõude tõttu.

Kui kahju vältimiseks või seaduse täitmiseks pole vaja kohe tegutseda, selgitab operaator põhjust, teatab sellest mõistliku aja ette ja annab võimaluse rikkumine kõrvaldada. Võid esitada apellatsiooni aadressil {{terms.complaintEmail}}. Kui piirangu alus lõpeb, taastatakse juurdepääs. Peatamine ei kõrvalda seadusest tulenevaid vastavuse, tagasimakse, andmete tagastamise, kaebuse või tühistamise õigusi. Kui ostad hiljem tellimuse Google Play kaudu, ei peata juurdepääsu piiramine iseenesest selle tulevasi pikendamisi.

11. Vastutus ja seadusest tulenevad õigused

Patternly pakub õppimise tuge, mitte kutse-, töö-, eksami-, õigus-, finants- ega muud reguleeritud nõu. Vastutad teenuse abil tehtud otsuste eest ja pead nõudeid kontrollima vastavalt asjaomaselt ametlikult asutuselt.

Operaator ei välista ega piira üldjuhul kohustusliku õiguse alusel vastutust. Miski nendes tingimustes ei piira digiteenuse vastavuse, nõutavate uuenduste, hinna alandamise, taganemise, lõpetamise, tagasimakse, kaebuste menetlemise, tervisekahju, tahtluse, raske hooletuse ega muu seaduse järgi piiramatu vastutusega seotud õigusi.

12. Kolmandate isikute teenused

Patternly võib kasutada Google’i ning autentimise, majutuse, teavituste ja arvelduse teenusepakkujaid. Nende enda tingimused võivad reguleerida sinu suhet nendega. Viited sertifitseerimisasutustele ja tehnoloogiaomanikele tähistavad õppeteemasid ega tähenda sponsorlust või heakskiitu.

13. Kohaldatav õigus ja vaidlused

Nendele tingimustele kohaldub {{terms.governingLaw}}. Kohtualluvus määratakse järgmiste eeskirjade alusel: {{terms.competentCourts}}, ilma et see võtaks sinult kohustusliku tarbijakaitse või õiguse pöörduda kohaldatava õiguse järgi sinu elukohas kättesaadava kohtu poole.

Enne ametliku nõude esitamist võid ühendust võtta operaatoriga, et ta saaks küsimuse läbi vaadata. See ei piira seadusest tulenevaid kaebuse, järelevalveasutuse, kohtuvälise vaidluste lahendamise ega kohtusse pöördumise õigusi.

14. Teenuse, hinna ja tingimuste muudatused

Operaator võib digiteenust lisatasuta muuta ainult siin nimetatud mõjuval põhjusel: õigusnõuete täitmine, turvalisus, koostalitlusvõime, vigade parandamine või funktsioonide täiustamine, vähendamata kokkulepitud tasulise teenuse ulatust. Ebasoodsast muudatusest selgitatakse püsival andmekandjal vähemalt 30 päeva ette, välja arvatud juhul, kui kohene muudatus on rangelt vajalik seaduse või kiireloomulise turvaohu tõttu.

Kui kohaldub kohustuslik õigus, võid lepingu lõpetada 30 päeva jooksul teate saamisest või muudatuse jõustumisest, olenevalt sellest, kumb kuupäev on hilisem, välja arvatud juhul, kui operaator jätab muutmata ja nõuetele vastava versiooni lisatasuta kättesaadavaks. Olulised hinnamuudatused eeldavad kohaldatavat jaatava nõusoleku, uuesti ostmise või uuendamise korda; kasutamise jätkamine ei ole vaikiv nõusolek.

Uues tingimuste versioonis märgitakse jõustumiskuupäev ja muudatused. Uuesti nõustumist küsitakse, kui seadus seda nõuab. Sinu vastu võetud versiooni muutumatu koopia jääb püsival andmekandjal kättesaadavaks.

15. Lepingu sõlmimine ja püsiv tõend

Enne konto loomist või ostu peab Patternly tegema need tingimused ja kogu nõutava lepingueelse teabe tasuta kättesaadavaks kujul, mille saad salvestada. Leping sõlmitakse alles pärast ühemõttelist toimingut, millega nõustud kindlaksmääratud versiooniga. Tasulise tellimuse nupp peab ütlema, et tellimuse esitamine toob kaasa maksekohustuse.

Operaator peab esitama kinnituse püsival andmekandjal ja säilitama auditeeritava kirje tingimuste versiooni, pakkumise, hinna, uuendamise tingimuste, ajatempli, keele ja tehinguga seotud nõusolekute kohta.

16. Tehnilised nõuded

Tehnilised nõuded ja ühilduvus: {{terms.technicalRequirements}}. Konto autentimiseks, sünkroonimiseks ja operaatoriga suhtlemiseks on vaja internetiühendust. Kui poeostud lubatakse, on nende ostmiseks või taastamiseks vaja samuti internetiühendust. Toetatavad võrguühenduseta funktsioonid võivad piirduda seadmes juba olemasolevate andmetega.

Toe ja uuenduste lubadus: {{terms.supportCommitment}}. Vajalikud turva- ja vastavusuuendused tarnitakse lepingu ja kohustusliku õiguse järgi nõutud perioodi jooksul.

17. Tarbija taganemisõigus

Kui oled selleks õigustatud tarbija, on sul üldjuhul õigus kauglepingust 14 päeva jooksul põhjuseta taganeda. Saada enne tähtaja lõppu ühemõtteline avaldus aadressile {{terms.withdrawalEmail}} või operaatori postiaadressile. Võid kirjutada: „Taganen käesolevaga [teenus] lepingust, mis telliti [kuupäev], nimi, aadress, kuupäev ja allkiri, kui avaldus saadetakse paberil.” Näidis on vabatahtlik.

18. Digiteenuse vastavus

Patternly peab vastama kirjeldusele, kokkulepitud tasulise teenuse ulatusele, funktsionaalsusele, ühilduvusele, ligipääsetavusele, järjepidevusele, turvalisusele ja uuendustele, mida võid lepingu ja kohustusliku õiguse alusel mõistlikult oodata. Kui teenus ei vasta neile nõuetele, teavita aadressil {{terms.complaintEmail}}. Võid nõuda vastavuse taastamist mõistliku aja jooksul ja olulise ebamugavuseta.

Kui seaduses sätestatud tingimused on täidetud, võid nõuda vastutavalt müüjalt proportsionaalset hinnaalandust või lepingu lõpetada ja saada kohaldatava tagasimakse. Kui ostsid Google Play kaudu, ei asenda selle tehingutööriistad neid õiguskaitsevahendeid.

19. Kaebused

Esita kaebus aadressile {{terms.complaintEmail}} või operaatori postiaadressile. Võimaluse korral märgi konto või tehing, kirjelda probleemi ja soovitud lahendust ning ära saada paroole. Operaator kinnitab kättesaamist püsival andmekandjal ja vastab 14 päeva jooksul, kui kohustuslik õigus ei näe ette lühemat tähtaega. 14-päevane vastamistähtaeg ei ole kaebuse esitamise tähtaeg.

20. Andmed pärast lepingu lõppemist

Kui kohaldatav õigus annab sulle õiguse enda esitatud või loodud mitteisiklik sisu kätte saada, taotle seda aadressil {{terms.complaintEmail}}. Operaator annab kohaldatava sisu tasuta, takistusteta, mõistliku aja jooksul ja tavapärases masinloetavas vormingus, arvestades seadusest tulenevaid erandeid.

21. Kohtuväline vaidluste lahendamine

Operaatori seisukoht tarbijate kohtuvälises vaidluste lahendamises osalemise kohta: {{terms.adrPosition}}. Asjakohane asutus või teabepunkt: {{terms.adrEntity}}. See jaotis ei viita suletud ELi ODR-platvormile ega piira õigust pöörduda tarbijakaitseasutuse või kohtu poole.

22. Operaator ja kontakt

Operaator: {{terms.operatorLegalName}}, {{terms.operatorBusinessForm}}. Aadress: {{terms.operatorRegisteredAddress}}. E-post: {{terms.operatorEmail}}. Telefon: {{terms.operatorPhone}}.

Patternly on saadaval järgmistes piirkondades: {{terms.distributionTerritories}}. Registrinumber: {{terms.operatorRegistrationNumber}}. Maksutunnus: {{terms.operatorTaxIdentifier}}.`,
} as const;
