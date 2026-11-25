# Changelog – DC Participant Importer

Přehled změn s dopadem na uživatele. Nejnovější verze nahoře.

## 1.14.2
- worldfootball: osoba s „Matches as referee“ se zakládá jako rozhodčí i tehdy, když má i hráčskou kariéru.

## 1.14.1
- Ženské rozhodčí: do Names se automaticky doplní „(W)“ (např. „Heidenreich Anna-Lena (W)“).

## 1.14.0
- Nový zdroj: Soccerdonna – rozhodčí (anglická i německá verze).

## 1.13.0
- Nový zdroj: BeSoccer – rozhodčí. Země se bere ze země narození (jinou stránka neuvádí).

## 1.12.0
- Nový zdroj: Sofascore – rozhodčí.

## 1.11.1
- Nový zdroj: worldfootball – rozhodčí (podle odkazu „Matches as referee“).

## 1.11.0
- Nový zdroj: zerozero a oGol – rozhodčí. Rozhodčí žena se pozná podle „Árbitra“.
- Lepší rozdělení jména (např. Gabriel Jesus z „Gabriel Fernando de Jesus“ → Gabriel | de Jesus).

## 1.10.1
- Transfermarkt rozhodčí: opraveno chybějící datum narození.

## 1.10.0
- Nový zdroj: Transfermarkt – rozhodčí. Vyplní se typ Referee, jméno, datum narození a země.

## 1.9.4
- Opta: „Copy source URL“ vždy ve tvaru opta.lsoffice.cz (i z opta-data.lsoffice.cz).

## 1.9.3
- „Check duplicates in DC“ používá stejnou úpravu znaků jako formulář (ß → ss, Þ → Th, ð → d, arabská jména bez pomlček). Hledá se vždy celé jméno.

## 1.9.2
- UEFA: u hráčů se dvěma pozicemi se vyplní „Club position“.

## 1.9.1
- Republic of Ireland se v DC vyplní jako Ireland.

## 1.9.0
- Nový zdroj: zerozero.pt (stejné jako oGol). Ženský fotbal → Women.

## 1.8.1
- Transfermarkt trenéři: opraveno chybějící křestní jméno.
- Transfermarkt: celé jméno („Full name“ / „Name in home country“) se vyplní do Full Name.

## 1.8.0
- Tlačítko „Copy source URL“ v DC panelu – odkaz na zdroj pro vyplnění v P.

## 1.7.2
- Opraveno rozpoznání zemí: Hongkong → Hong Kong, Macau → Macao, Myanmar (Burma) → Myanmar.

## 1.7.1
- Asijští hráči: místo automatického kopírování upozornění a tlačítko „Copy Full Name → Short Name“, které použije uživatel.

## 1.7.0
- Jména podle manuálu: do Surname a First Name jedno jméno, celé jméno do Full Name.
- Automaticky: ß → ss, Þ/þ → Th/th, Ð/ð → D/d, arabská jména bez pomlček, otcovská jména (-vich, -ovna…) jen do Full Name.

## 1.6.1
- Oranžové upozornění při datu narození 1. 1. (zdroj často zná jen rok) – na zdroji, v DC panelu i u pole data.

## 1.6.0
- Nový zdroj: BeSoccer – hráči.

## 1.5.1
- Soccerdonna: na německé verzi stránky se země vyplní anglicky (dřív např. „Vereinigte Staaten“).

## 1.5.0
- Nový zdroj: Soccerdonna – hráčky. Pohlaví vždy Women.

## 1.4.1
- Baseball: vyplní se skupina i konkrétní pozice (např. Infielder + First baseman), případně více pozic.

## 1.4.0
- Nový zdroj: Baseball-Reference. Nový sport Baseball.

## 1.3.0
- Nový zdroj: Opta (interní, opta.lsoffice.cz a opta-data.lsoffice.cz).

## 1.2.0
- Nový zdroj: Sofascore – hráči (fotbal i hokej).

## 1.1.0 – 1.1.1
- Nový zdroj: UEFA.com (všechny soutěže včetně ženských).

## 1.0.5
- Distribuce přes GitHub – Tampermonkey stahuje nové verze automaticky.

## 1.0.0 – 1.0.4
- První verze pro provoz: Transfermarkt (všechny jazykové verze), oGol, worldfootball, EliteProspects (hokej).
- Tlačítka „Create participant in DC“ a „Check duplicates in DC“, box pro rozdělení jména, skrytí a přesun panelu.
- Google vyhledávání v data-checkingu (participant-incident).
- Předvyplnění „South American nickname“, převod portugalských názvů zemí.
