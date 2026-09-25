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

Kohalikke õpiandmeid kaitsevad Patternly kasutatavad seadme salvestusruumi turvakontrollid. Sinu palvel kopeeritud taastamiskood kustutatakse, kui operatsioonisüsteem seda võimaldab, ja ainult juhul, kui lõikelaud sisaldab endiselt seda koodi. Ainult seadmesse jäävaid andmeid vastutavale töötlejale ei saadeta, välja arvatud juhul, kui lood konto ja sünkroonid lubatud kirje, saadad teate või kasutad muud võrgufunktsiooni.

4. Konto- ja autentimisandmed

Konto puhul töötleb Patternly Firebase’i ja Patternly kasutajatunnuseid, e-posti aadressi, kinnitamise olekut, autentimisteenuse pakkujat ning turvasündmuste ajatemplid, et kontot luua ja kaitsta, päringuid autentida, toetatud andmeid sünkroonida, juurdepääsu taastada ja väärkasutust ennetada. Õiguslik alus on teenuselepinguga seotud teenuse osutamine ning vastutava töötleja õigustatud huvi teenuse turvalisuse vastu; säilitamisele kuuluvate kirjete suhtes kohaldatakse seadusest tulenevaid kohustusi.

Apple, Google ja Firebase võivad töödelda autentimis- ja seadme tõendamise andmeid enda tingimuste alusel. GDPR-i artikli 14 tähenduses on nad ka allikad, kellelt Patternly võib saada identiteedi- ja teenusepakkuja tunnuseid, tagastamise korral e-posti aadressi ja nime ning seadme tõendamise või turvasignaale. Apple’iga sisselogimisel küsib Patternly e-posti ja nime õigusi ning piirab nende kasutamist autentimiseks ja konto haldamiseks tagastatud väljadega.

5. Õppimise ja sünkroonimise andmed

Kui sünkroonimine on lubatud, saadab Patternly taustateenusele valitud õpitee ja lõpetatud õpikirjed, näiteks seansside kokkuvõtted, tulemused, vastused, kordamise oleku, versioonid, ajatemplid ning seadme või andmestiku tunnused. Aktiivsed mustandid, taimerid, eelistused ja teavituste seaded ei kuulu praegusesse sünkroonimise lubatud loendisse. Eesmärk ja õiguslik alus on konto sünkroonimisteenuse osutamine ja selle terviklikkuse säilitamine.

Õppimise edenemist säilitatakse konto olemasolu ajal ning see eemaldatakse konto kustutamise käigus, arvestades allpool kirjeldatud piiratud kustutamistõendeid. Lõpetatud sünkroonimistoimingute metaandmeid säilitatakse pärast lõpetamist {{privacy.completedSyncOperationRetentionDays}} päeva.

6. Sisuteated ja suhtlus

Sisuteade võib sisaldada kategooriat, valikulist vabas vormis kirjeldust, juhuslikku esitamise tunnust, sisu ja paketi tunnuseid, vaadet, keelt, rakenduse järku, platvormi, aega ning App Checki või seadme tõendamise tokenit. Praegune mobiilivorm ei lisa tahtlikult kontot ega kontaktmeili, kuigi taustateenuse skeem toetab neid välju heakskiidetud kanalite jaoks. Server saab ühenduse IP-aadressi ja muudab selle ühesuunaliseks piirangutunnuseks, mida kasutatakse ainult korduvate teadete piiramiseks. Ära lisa paroole ega tarbetuid tundlikke andmeid.

Teateid töödeldakse sisu parandamiseks, soovitud vastamiseks, teenuse kaitsmiseks ja nõuete esitamiseks või kaitsmiseks. Nende eesmärkide õiguslik alus on vastutava töötleja õigustatud huvi GDPR-i artikli 6 lõike 1 punkti f alusel: hoida sisu täpne, vastata soovitud kontaktile, kaitsta teavitamiskanalit ja kaitsta õigusnõuete eest; sul on õigus GDPR-i artikli 21 alusel vastuväide esitada. Kontoga või kontaktiga sidumata teateid säilitatakse {{privacy.anonymousReportRetentionDays}} päeva ning kontoga või kontaktiga seotud teateid {{privacy.linkedReportRetentionDays}} päeva. Ühesuunalist IP piirangutunnust hoitakse ainult aktiivse piiranguaja jooksul, mis kestab {{privacy.reportRateLimitIdentifierRetentionSeconds}} sekundit. Kohalikult vastu võetud teade eemaldatakse pärast serveri kättesaamiskinnitust. Kohalikus saatmata teadete järjekorras olev kinnitamata teade eemaldatakse automaatselt {{privacy.localReportOutboxRetentionDays}} päeva pärast.

7. Turvalisus ja tehnilised andmed

Patternly kasutab kontode kaitsmiseks, rikete uurimiseks ja väärkasutuse ennetamiseks autentimistokeneid, App Checki või seadme tõendamise signaale, päringute metaandmeid, võrgu- või e-posti andmete räsimisel saadud piirangutunnuseid, tegevuslogisid ja turvasündmuste kirjeid. Patternly ei kasuta reklaami- ega rakendusteülest jälgimistarkvara, üldotstarbelist välist tootepõhise analüütika tarkvara ega välist krahhide raporteerimise tarkvara. RevenueCat töötleb ostuajalugu tellimusfunktsioonide ja allpool kirjeldatud ostuanalüütika jaoks.

Tegevuslogisid säilitatakse {{privacy.operationalLogRetentionDays}} päeva ja turvalogisid {{privacy.securityLogRetentionDays}} päeva. Patternly eemaldab tootmislogidest mandaadid ja päringute sisu. Sinu palvel kopeeritud taastamiskoodid võivad jääda süsteemi lõikelauale; Patternly püüab need {{privacy.clipboardRecoveryCodeRetentionMinutes}} minuti pärast eemaldada, kui operatsioonisüsteem seda võimaldab, ega kustuta hiljem sinu kopeeritud sisu.

8. Volitatud töötlejad, saajad ja edastused

Kontrollitud aktiivsed pilveteenuse volitatud töötlejad ja nende eesmärgid: {{privacy.activeCloudProcessors}}. Aktiivsed iseseisvad vastutavad töötlejad ja saajad: {{privacy.activeIndependentRecipients}}. E-kirjade edastamise teenusepakkuja: {{privacy.emailDeliveryProvider}}. Teenusepakkujate piirkonnad: {{privacy.hostingRegions}}. Väljapoole EMP-d tehtavate edastuste kaitsemeetmed: {{privacy.internationalTransferSafeguards}}.

RevenueCati olek: {{privacy.revenueCatStatus}}. Apple võib App Store’i tehingu- ja tellimuskirjeid iseseisvalt säilitada. Patternly konto kustutamine ei tühista App Store’i tellimust ega eemalda Apple’i iseseisva vastutuse all olevaid kirjeid. Patternly vaatab oma volitatud töötlejad, saajad ja edastuskorrad üle iga kord, kui teenusepakkujad või nende töötlemiskohad muutuvad.

9. Säilitamine ja konto kustutamine

Konto ja sünkroonitud õpiandmeid hoitakse konto aktiivsuse ajal, välja arvatud juhul, kui kehtib lühem tähtaeg või varasem kehtiv taotlus. Konto kustutamisel eemaldatakse konto andmete alampuu, identiteediseosed ja autentimiskonto ning kontoga seotud sisuteated muudetakse isikustamatuks. See ei tühista iseenesest poest ostetud tellimust.

Pärast kustutamist säilitab Patternly võtmega HMAC-pseudonüümi ainult konto juhusliku taasloomise vältimiseks {{privacy.deletionTombstoneRetentionDays}} päeva. See on endiselt isikuandmestik, mitte anonüümne teave, kuid teenusepakkuja algset UID-d ei säilitata. Õiguslik alus on vastutava töötleja õigustatud huvi GDPR-i artikli 6 lõike 1 punkti f alusel; võid töötlemisele GDPR-i artikli 21 alusel vastu vaielda, võttes ühendust aadressil {{privacy.privacyEmail}}. Minimaalset ja kontoga seostamatut kustutamise lõpuleviimise tõendit võib säilitada kuni {{privacy.deletionEvidenceRetentionYears}} aastat GDPR-i artikli 6 lõike 1 punkti c alusel koos vastutuse ja andmesubjekti õiguste raamistikuga, mis tuleneb artiklitest 5 lõige 2, 12 lõige 2, 17 ja 24. Patternly ei säilita pärast kustutamist üldist pettustevastast kirjet: konkreetse sündmusega seotud pettustevastane säilitamine vajab eraldi dokumenteeritud ohumudelit ning vajalikkuse ja õigustatud huvi hinnangut. Varukoopiate ja ajapunkti taastamise kustutamine: {{privacy.backupPurgeDisclosure}}.

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

Kontoteenuse leping sõlmitakse tähtajatult ja kehtib seni, kuni sina või operaator selle nende tingimuste kohaselt lõpetab. Patternly konto kustutamine lõpetab kontoteenuse, kuid ei tühista iseenesest eraldi App Store’i tellimust.

Saad konto kustutada rakenduses oleva kustutamisvoo kaudu. Privaatsuspoliitika selgitab, milliseid andmeid see mõjutab, millised säilitamisreeglid kehtivad ja millised on kustutamise piirid.

5. Rakenduse ja sisu litsents

Operaator annab sulle piiratud, isikliku, mitteainuõigusliku, üleandmatu ja tühistatava õiguse kasutada teenust ning selle sisu isiklikuks õppimiseks nende tingimuste ja kohaldatava õiguse järgi. Patternly ja selle algupärane sisu jäävad intellektuaalomandi õigusega kaitstuks.

Apple’i kaudu saadud rakenduse puhul kohaldatakse rakenduse litsentsile eraldi Apple’i standardset litsentsitud rakenduse lõppkasutaja litsentsilepingut, välja arvatud juhul, kui App Store Connectis on esitatud kohandatud EULA. Need tingimused reguleerivad Patternly teenust ega asenda Apple’i kohustuslikke tingimusi.

6. Lubatud kasutamine

Ära kasuta teenust vääralt, sega selle turvalisust või toimimist, sisene teise inimese kontole, automatiseeri ligipääsu väljaspool toetatud funktsioone, möödu juurdepääsukontrollidest, eralda ega levita edasi olulist osa sisust või kasuta Patternlyt seaduse või kolmandate isikute õiguste vastaselt.

Võid seadusega lubatud ulatuses tsiteerida piiratud osi, kuid ilma kirjaliku loata ei tohi küsimustepanka uuesti avaldada ega Patternly sisule juurdepääsu müüa.

7. Premium ja tellimused

Patternly Premium on igakuine automaatselt uuenev digiteenus, mida müüakse Apple App Store’i kaudu Poolas ja teistes Euroopa Liidu riikides, kus pakkumine on saadaval. Pakkumine on {{terms.premiumProductName}} (toote tunnus {{terms.premiumProductIdentifier}}). See sisaldab: {{terms.premiumServiceScope}}. Arveldusperiood on {{terms.premiumBillingPeriod}}. Prooviperioodi pole. Esialgne koguhind koos kohaldatavate maksudega on {{terms.premiumPriceIncludingTaxes}}; uuendamise hind koos kohaldatavate maksudega on {{terms.premiumRenewalPriceIncludingTaxes}} iga {{terms.premiumBillingPeriod}} eest. Enne tellimist kuvatakse ostuekraanil kehtivad hinnad, uuendamise periood, Premiumi ulatus, makseviis ja -aeg, teenuse algus ning maksekohustus.

Tehingu müüja kokkulepe on järgmine: {{terms.merchantOfRecord}}. Apple pakub makse- ja tellimuse haldamise kanalit, kuid see ei vabasta operaatorit vastutusest Patternly vastavuse ega sinu seaduslike nõuete eest vastutava ettevõtja vastu.

Tellimus uueneb automaatselt ainult enne ostu selgelt kuvatud tingimustel. Tulevased uuendamised saad peatada Apple’i konto seadetes. Rakenduse või Patternly konto kustutamine ei tühista App Store’i tellimust. Olulist hinnatõusu ei loeta kunagi vastuvõetuks üksnes Patternly kasutamise jätkamise tõttu; selleks on vaja kohaldatavat jaatava nõusoleku, uuesti ostmise või uuendamise korda.

Apple võib platvormi kaudu tehingute tagasimakseid menetleda. Võid siiski esitada operaatorile kaebusi Patternly teenuse, selle vastavuse või seadusest tulenevate tarbijakaitsevahendite kohta.

Premiumi juurdepääs algab kohe pärast ostu ainult siis, kui oled eraldi ja sõnaselgelt taotlenud teenuse alustamist enne 14-päevase taganemistähtaja lõppu. Ühtegi valikut ei tohi olla ette märgitud. Kui taganed pärast teenuse algust, võidakse kohustusliku õiguse lubatud juhul nõuda proportsionaalset tasu kuni taganemiseni osutatud teenuse eest. Premiumi ei pakuta eraldi ühekordse digitaalse infosisu tarne vormis, seega ei palu Patternly sul sel alusel taganemisõigusest ilmajäämist kinnitada. Muud seadusest tulenevad taganemisõigused jäävad kehtima. Kaebuse esitamine ei piirdu 14 päevaga.

8. Kättesaadavus ja muudatused

Operaator püüab Patternlyt kättesaadavana hoida, kuid ei taga katkematut ega veatut juurdepääsu. Hooldus, turvaintsidendid, teenusepakkujate katkestused, seadme piirangud või õigusnõuded võivad funktsioone katkestada. Võrguühenduseta ja sünkroonitud andmed ei pruugi alati olla samal määral kättesaadavad.

Kui tasuline funktsioon lõpetatakse olulisel määral, pakub operaator kohaldatava tarbijakaitseõiguse ja ostuplatvormi reeglitega nõutud õiguskaitsevahendeid.

9. Teated ja suhtlus

Sisuteate või tugisõnumi esitamisel kinnitad, et see on seaduslik ega sisalda teadlikult materjali, mida sul pole õigust jagada. Sulle jäävad sõnumi õigused ning lubad operaatoril seda kasutada üksnes teate läbivaatamiseks, sinu toetamiseks, teenuse kaitsmiseks ja seadusest tulenevate kohustuste täitmiseks vajalikul määral. Privaatsuspoliitika kirjeldab seotud andmetöötlust.

10. Peatamine ja lõpetamine

Võid Patternly kasutamise lõpetada ja konto igal ajal kustutada, kuid platvormi tellimus tuleb eraldi tühistada. Operaator võib juurdepääsu proportsionaalselt piirata üksnes olulise rikkumise, kinnitatud turvaohu, ebaseadusliku kasutuse, maksmata jätmise või siduva õigusnõude tõttu.

Kui kahju vältimiseks või seaduse täitmiseks pole vaja kohe tegutseda, selgitab operaator põhjust, teatab sellest mõistliku aja ette ja annab võimaluse rikkumine kõrvaldada. Võid esitada apellatsiooni aadressil {{terms.complaintEmail}}. Kui piirangu alus lõpeb, taastatakse juurdepääs. Peatamine ei kõrvalda seadusest tulenevaid vastavuse, tagasimakse, andmete tagastamise, kaebuse või tühistamise õigusi ega tühista iseenesest Apple’i tulevasi uuendamisi.

11. Vastutus ja seadusest tulenevad õigused

Patternly pakub õppimise tuge, mitte kutse-, töö-, eksami-, õigus-, finants- ega muud reguleeritud nõu. Vastutad teenuse abil tehtud otsuste eest ja pead nõudeid kontrollima vastavalt asjaomaselt ametlikult asutuselt.

Operaator ei välista ega piira üldjuhul kohustusliku õiguse alusel vastutust. Miski nendes tingimustes ei piira digiteenuse vastavuse, nõutavate uuenduste, hinna alandamise, taganemise, lõpetamise, tagasimakse, kaebuste menetlemise, tervisekahju, tahtluse, raske hooletuse ega muu seaduse järgi piiramatu vastutusega seotud õigusi.

12. Kolmandate isikute teenused

Patternly võib kasutada Apple’i ning autentimise, majutuse, teavituste ja arvelduse teenusepakkujaid. Nende enda tingimused võivad reguleerida sinu suhet nendega. Viited sertifitseerimisasutustele ja tehnoloogiaomanikele tähistavad õppeteemasid ega tähenda sponsorlust või heakskiitu.

13. Kohaldatav õigus ja vaidlused

Nendele tingimustele kohaldub {{terms.governingLaw}}. Pädevad on kohtud, mida kirjeldatakse järgmiselt: {{terms.competentCourts}}, ilma et see võtaks sinult kohustusliku tarbijakaitse või õiguse pöörduda kohaldatava õiguse järgi sinu elukohas kättesaadava kohtu poole.

Enne ametliku nõude esitamist võid ühendust võtta operaatoriga, et ta saaks küsimuse läbi vaadata. See ei piira seadusest tulenevaid kaebuse, järelevalveasutuse, kohtuvälise vaidluste lahendamise ega kohtusse pöördumise õigusi.

14. Teenuse, hinna ja tingimuste muudatused

Operaator võib digiteenust lisatasuta muuta ainult siin nimetatud mõjuval põhjusel: õigusnõuete täitmine, turvalisus, koostalitlusvõime, vigade parandamine või funktsioonide täiustamine, vähendamata kokkulepitud tasulise teenuse ulatust. Ebasoodsast muudatusest selgitatakse püsival andmekandjal vähemalt 30 päeva ette, välja arvatud juhul, kui kohene muudatus on rangelt vajalik seaduse või kiireloomulise turvaohu tõttu.

Kui kohaldub kohustuslik õigus, võid lepingu lõpetada 30 päeva jooksul teate saamisest või muudatuse jõustumisest, olenevalt sellest, kumb kuupäev on hilisem, välja arvatud juhul, kui operaator jätab muutmata ja nõuetele vastava versiooni lisatasuta kättesaadavaks. Olulised hinnamuudatused eeldavad kohaldatavat jaatava nõusoleku, uuesti ostmise või uuendamise korda; kasutamise jätkamine ei ole vaikiv nõusolek.

Uues tingimuste versioonis märgitakse jõustumiskuupäev ja muudatused. Uuesti nõustumist küsitakse, kui seadus seda nõuab. Sinu vastu võetud versiooni muutumatu koopia jääb püsival andmekandjal kättesaadavaks.

15. Lepingu sõlmimine ja püsiv tõend

Enne konto loomist või ostu peab Patternly tegema need tingimused ja kogu nõutava lepingueelse teabe tasuta kättesaadavaks kujul, mille saad salvestada. Leping sõlmitakse alles pärast ühemõttelist toimingut, millega nõustud kindlaksmääratud versiooniga. Tasulise tellimuse nupp peab ütlema, et tellimuse esitamine toob kaasa maksekohustuse.

Operaator peab esitama kinnituse püsival andmekandjal ja säilitama auditeeritava kirje tingimuste versiooni, pakkumise, hinna, uuendamise tingimuste, ajatempli, keele ja tehinguga seotud nõusolekute kohta.

16. Tehnilised nõuded

Tehnilised nõuded ja ühilduvus: {{terms.technicalRequirements}}. Konto autentimiseks, sünkroonimiseks, ostudeks, ostude taastamiseks ja operaatoriga suhtlemiseks on vaja internetiühendust. Toetatud võrguühenduseta funktsioonid võivad piirduda seadmes juba olevate andmetega.

Toe ja uuenduste lubadus: {{terms.supportCommitment}}. Vajalikud turva- ja vastavusuuendused tarnitakse lepingu ja kohustusliku õiguse järgi nõutud perioodi jooksul.

17. Tarbija taganemisõigus

Kui oled selleks õigustatud tarbija, on sul üldjuhul õigus kauglepingust 14 päeva jooksul põhjuseta taganeda. Saada enne tähtaja lõppu ühemõtteline avaldus aadressile {{terms.withdrawalEmail}} või operaatori postiaadressile. Võid kirjutada: „Taganen käesolevaga [teenus] lepingust, mis telliti [kuupäev], nimi, aadress, kuupäev ja allkiri, kui avaldus saadetakse paberil.” Näidis on vabatahtlik.

18. Digiteenuse vastavus

Patternly peab vastama kirjeldusele, kokkulepitud tasulise teenuse ulatusele, funktsionaalsusele, ühilduvusele, ligipääsetavusele, järjepidevusele, turvalisusele ja uuendustele, mida võid lepingu ja kohustusliku õiguse alusel mõistlikult oodata. Kui teenus ei vasta neile nõuetele, teavita aadressil {{terms.complaintEmail}}. Võid nõuda vastavuse taastamist mõistliku aja jooksul ja olulise ebamugavuseta.

Kui seaduses sätestatud tingimused on täidetud, võid nõuda proportsionaalset hinna alandamist või lepingu lõpetada ning saada asjakohase tagasimakse. Need õiguskaitsevahendid on suunatud vastutava ettevõtja vastu ning Apple’i tehingutööriistad neid ei asenda.

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
