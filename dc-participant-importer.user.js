// ==UserScript==
// @name         DC Participant Importer
// @namespace    dc-ogol-fill
// @version      1.8.1
// @author       DKode
// @homepageURL  https://github.com/MrQev/dc-participant-importer.user.js
// @supportURL   https://github.com/MrQev/dc-participant-importer.user.js/issues
// @updateURL    https://raw.githubusercontent.com/MrQev/dc-participant-importer.user.js/main/dc-participant-importer.user.js
// @downloadURL  https://raw.githubusercontent.com/MrQev/dc-participant-importer.user.js/main/dc-participant-importer.user.js
// @description  Creates DC participants from Transfermarkt, oGol, worldfootball.net, Soccerdonna, BeSoccer, UEFA.com, Sofascore, Opta (internal), EliteProspects and Baseball-Reference, checks duplicates in DC and adds Google search to data-checking.
// @match        https://dc.livesport.eu/jsx/data/participant/detail/new*
// @match        https://dc.livesport.eu/data/data-checking/participant-incident*
// @match        https://www.ogol.com.br/jogador/*
// @match        https://www.eliteprospects.com/player/*
// @match        https://www.worldfootball.net/person/*
// @match        https://www.worldfootball.net/player_summary/*
// @match        https://www.uefa.com/*/players/*
// @match        https://en.uefa.com/*/players/*
// @match        https://www.sofascore.com/*player/*
// @match        https://opta.lsoffice.cz/opta/opta-player-detail.php*
// @match        https://opta-data.lsoffice.cz/opta/opta-player-detail.php*
// @match        https://www.baseball-reference.com/players/*
// @match        https://www.soccerdonna.de/*/profil/spieler_*
// @match        https://www.besoccer.com/player/*
// @match        https://www.transfermarkt.com/*/profil/spieler/*
// @match        https://www.transfermarkt.de/*/profil/spieler/*
// @match        https://www.transfermarkt.at/*/profil/spieler/*
// @match        https://www.transfermarkt.ch/*/profil/spieler/*
// @match        https://www.transfermarkt.co.uk/*/profil/spieler/*
// @match        https://www.transfermarkt.us/*/profil/spieler/*
// @match        https://www.transfermarkt.world/*/profil/spieler/*
// @match        https://www.transfermarkt.es/*/profil/spieler/*
// @match        https://www.transfermarkt.it/*/profil/spieler/*
// @match        https://www.transfermarkt.fr/*/profil/spieler/*
// @match        https://www.transfermarkt.pt/*/profil/spieler/*
// @match        https://www.transfermarkt.com.br/*/profil/spieler/*
// @match        https://www.transfermarkt.com.tr/*/profil/spieler/*
// @match        https://www.transfermarkt.nl/*/profil/spieler/*
// @match        https://www.transfermarkt.be/*/profil/spieler/*
// @match        https://www.transfermarkt.pl/*/profil/spieler/*
// @match        https://www.transfermarkt.gr/*/profil/spieler/*
// @match        https://www.transfermarkt.ro/*/profil/spieler/*
// @match        https://www.transfermarkt.jp/*/profil/spieler/*
// @match        https://www.transfermarkt.co.kr/*/profil/spieler/*
// @match        https://www.transfermarkt.co.id/*/profil/spieler/*
// @match        https://www.transfermarkt.co.in/*/profil/spieler/*
// @match        https://www.transfermarkt.my/*/profil/spieler/*
// @match        https://www.transfermarkt.com.ar/*/profil/spieler/*
// @match        https://www.transfermarkt.mx/*/profil/spieler/*
// @match        https://www.transfermarkt.co/*/profil/spieler/*
// @match        https://www.transfermarkt.com/*/profil/trainer/*
// @match        https://www.transfermarkt.de/*/profil/trainer/*
// @match        https://www.transfermarkt.at/*/profil/trainer/*
// @match        https://www.transfermarkt.ch/*/profil/trainer/*
// @match        https://www.transfermarkt.co.uk/*/profil/trainer/*
// @match        https://www.transfermarkt.us/*/profil/trainer/*
// @match        https://www.transfermarkt.world/*/profil/trainer/*
// @match        https://www.transfermarkt.es/*/profil/trainer/*
// @match        https://www.transfermarkt.it/*/profil/trainer/*
// @match        https://www.transfermarkt.fr/*/profil/trainer/*
// @match        https://www.transfermarkt.pt/*/profil/trainer/*
// @match        https://www.transfermarkt.com.br/*/profil/trainer/*
// @match        https://www.transfermarkt.com.tr/*/profil/trainer/*
// @match        https://www.transfermarkt.nl/*/profil/trainer/*
// @match        https://www.transfermarkt.be/*/profil/trainer/*
// @match        https://www.transfermarkt.pl/*/profil/trainer/*
// @match        https://www.transfermarkt.gr/*/profil/trainer/*
// @match        https://www.transfermarkt.ro/*/profil/trainer/*
// @match        https://www.transfermarkt.jp/*/profil/trainer/*
// @match        https://www.transfermarkt.co.kr/*/profil/trainer/*
// @match        https://www.transfermarkt.co.id/*/profil/trainer/*
// @match        https://www.transfermarkt.co.in/*/profil/trainer/*
// @match        https://www.transfermarkt.my/*/profil/trainer/*
// @match        https://www.transfermarkt.com.ar/*/profil/trainer/*
// @match        https://www.transfermarkt.mx/*/profil/trainer/*
// @match        https://www.transfermarkt.co/*/profil/trainer/*
// @connect      www.transfermarkt.com
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_addValueChangeListener
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_setClipboard
// ==/UserScript==

(function () {
  'use strict';

  const STORAGE_KEY = 'dcOgolCapturedData';
  const DC_NEW_PARTICIPANT_URL = 'https://dc.livesport.eu/jsx/data/participant/detail/new';
  const DC_ES_PARTICIPANT_URL = 'https://dc.livesport.eu/jsx/data/es_participant';
  // "Create participant in DC" data older than this is not auto-filled
  // (e.g. the DC tab was closed before it loaded).
  const AUTO_RUN_MAX_AGE_MS = 2 * 60 * 1000;

  // Sources often use 1 January when only the birth YEAR is known.
  function isJan1(data) {
    return !!(data && data.birthYear && data.birthDay === '01' && data.birthMonth === '01');
  }
  function jan1Message(data) {
    return `⚠ Birth date is 1 January ${data.birthYear} — sources often use this when only the year is known. Please verify the date before saving.`;
  }

  // Builds the DC participant-search URL: active participants (status 1)
  // whose name is _like "FirstName Surname". Diacritics are stripped because
  // participants are stored in DC without them.
  function buildDuplicateSearchUrl(data) {
    const name = [data.firstName, data.surname].filter(Boolean).join(' ')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
    const state = {
      activeRowIds: [],
      activeFilters: [
        { attributePath: 'status', value: [1], operator: '_in' },
        { attributePath: 'name', value: name, operator: '_like' },
      ],
    };
    const params = new URLSearchParams({ es_participant: JSON.stringify(state), urlFirstLoadEnabled: 'true' });
    return `${DC_ES_PARTICIPANT_URL}?${params.toString()}`;
  }

  // ---------------------------------------------------------------------
  // Config you may need to tweak while testing
  // ---------------------------------------------------------------------
  const CONFIG = {
    // Guess for the DC datepicker text format. If dates land wrong after
    // filling, change this to 'mm/dd/yyyy' or whatever format DC expects
    // and re-run.
    dateFormat: 'dd.mm.yyyy',
    defaultGender: 'Men', // used when the source doesn't expose gender (Transfermarkt, oGol)
    // TESTING ONLY: true = pretend the transfermarkt.com fetch failed, so the
    // fallback (flag cache + multilingual position map) is used on .de/.es/...
    debugSkipTmEnglish: false,
  };

  // PT (Brazilian, as used by oGol) country name -> EN / DC country name.
  // DC-specific forms (USA, South Korea, Ivory Coast, DR Congo, ...) follow
  // the same naming as DC_COUNTRY_ALIASES. Countries whose name is the same in
  // both languages (Argentina, Chile, Portugal, ...) need no entry.
  const COUNTRY_MAP = {
    // South & Central America, Caribbean
    'Brasil': 'Brazil', 'Uruguai': 'Uruguay', 'Paraguai': 'Paraguay', 'Colômbia': 'Colombia',
    'Equador': 'Ecuador', 'Peru': 'Peru', 'Bolívia': 'Bolivia', 'Venezuela': 'Venezuela',
    'México': 'Mexico', 'Estados Unidos': 'USA', 'EUA': 'USA', 'Canadá': 'Canada',
    'Costa Rica': 'Costa Rica', 'Panamá': 'Panama', 'Honduras': 'Honduras', 'Guatemala': 'Guatemala',
    'El Salvador': 'El Salvador', 'Nicarágua': 'Nicaragua', 'Belize': 'Belize', 'Cuba': 'Cuba',
    'Haiti': 'Haiti', 'Jamaica': 'Jamaica', 'República Dominicana': 'Dominican Republic',
    'Porto Rico': 'Puerto Rico', 'Trinidad e Tobago': 'Trinidad and Tobago', 'Guiana': 'Guyana',
    'Suriname': 'Suriname', 'Guiana Francesa': 'French Guiana', 'Curaçao': 'Curacao',
    'Granada': 'Grenada', 'Barbados': 'Barbados', 'Bahamas': 'Bahamas', 'Bermudas': 'Bermuda',
    'Martinica': 'Martinique', 'Guadalupe': 'Guadeloupe', 'Aruba': 'Aruba',
    'São Cristóvão e Névis': 'Saint Kitts and Nevis', 'Santa Lúcia': 'Saint Lucia',
    'São Vicente e Granadinas': 'Saint Vincent and the Grenadines', 'Antígua e Barbuda': 'Antigua and Barbuda',
    'Dominica': 'Dominica',
    // Europe
    'Espanha': 'Spain', 'França': 'France', 'Itália': 'Italy', 'Alemanha': 'Germany',
    'Inglaterra': 'England', 'Escócia': 'Scotland', 'País de Gales': 'Wales', 'Gales': 'Wales',
    'Irlanda do Norte': 'Northern Ireland', 'Irlanda': 'Ireland', 'República da Irlanda': 'Ireland',
    'Reino Unido': 'United Kingdom', 'Holanda': 'Netherlands', 'Países Baixos': 'Netherlands',
    'Bélgica': 'Belgium', 'Luxemburgo': 'Luxembourg', 'Suíça': 'Switzerland', 'Áustria': 'Austria',
    'Dinamarca': 'Denmark', 'Suécia': 'Sweden', 'Noruega': 'Norway', 'Finlândia': 'Finland',
    'Islândia': 'Iceland', 'Ilhas Faroé': 'Faroe Islands', 'Ilhas Feroé': 'Faroe Islands',
    'Polônia': 'Poland', 'Polónia': 'Poland', 'República Tcheca': 'Czech Republic', 'Tchéquia': 'Czech Republic',
    'Chéquia': 'Czech Republic', 'Eslováquia': 'Slovakia', 'Hungria': 'Hungary', 'Romênia': 'Romania',
    'Roménia': 'Romania', 'Bulgária': 'Bulgaria', 'Grécia': 'Greece', 'Chipre': 'Cyprus', 'Malta': 'Malta',
    'Sérvia': 'Serbia', 'Croácia': 'Croatia', 'Eslovênia': 'Slovenia', 'Eslovénia': 'Slovenia',
    'Bósnia e Herzegovina': 'Bosnia and Herzegovina', 'Bósnia-Herzegovina': 'Bosnia and Herzegovina',
    'Montenegro': 'Montenegro', 'Macedônia do Norte': 'North Macedonia', 'Macedónia do Norte': 'North Macedonia',
    'Macedônia': 'North Macedonia', 'Albânia': 'Albania', 'Kosovo': 'Kosovo', 'Turquia': 'Turkey',
    'Rússia': 'Russia', 'Ucrânia': 'Ukraine', 'Bielorrússia': 'Belarus', 'Moldávia': 'Moldova',
    'Lituânia': 'Lithuania', 'Letônia': 'Latvia', 'Letónia': 'Latvia', 'Estônia': 'Estonia', 'Estónia': 'Estonia',
    'Geórgia': 'Georgia', 'Armênia': 'Armenia', 'Arménia': 'Armenia', 'Azerbaijão': 'Azerbaijan',
    'Cazaquistão': 'Kazakhstan', 'Andorra': 'Andorra', 'San Marino': 'San Marino', 'Mônaco': 'Monaco',
    'Mónaco': 'Monaco', 'Liechtenstein': 'Liechtenstein', 'Gibraltar': 'Gibraltar',
    // Africa
    'Angola': 'Angola', 'Moçambique': 'Mozambique', 'Cabo Verde': 'Cape Verde', 'Guiné-Bissau': 'Guinea-Bissau',
    'São Tomé e Príncipe': 'Sao Tome and Principe', 'Guiné': 'Guinea', 'Guiné Equatorial': 'Equatorial Guinea',
    'África do Sul': 'South Africa', 'Nigéria': 'Nigeria', 'Gana': 'Ghana', 'Costa do Marfim': 'Ivory Coast',
    'Senegal': 'Senegal', 'Camarões': 'Cameroon', 'Mali': 'Mali', 'Marrocos': 'Morocco', 'Argélia': 'Algeria',
    'Tunísia': 'Tunisia', 'Egito': 'Egypt', 'Líbia': 'Libya', 'Sudão': 'Sudan', 'Sudão do Sul': 'South Sudan',
    'Etiópia': 'Ethiopia', 'Quênia': 'Kenya', 'Quénia': 'Kenya', 'Tanzânia': 'Tanzania', 'Uganda': 'Uganda',
    'Ruanda': 'Rwanda', 'Burundi': 'Burundi', 'RD Congo': 'DR Congo', 'República Democrática do Congo': 'DR Congo',
    'Congo': 'Congo', 'República do Congo': 'Congo', 'Gabão': 'Gabon', 'Zâmbia': 'Zambia', 'Zimbábue': 'Zimbabwe',
    'Zimbabué': 'Zimbabwe', 'Malawi': 'Malawi', 'Malaui': 'Malawi', 'Botsuana': 'Botswana', 'Namíbia': 'Namibia',
    'Madagáscar': 'Madagascar', 'Madagascar': 'Madagascar', 'Maurícia': 'Mauritius', 'Maurício': 'Mauritius',
    'Burkina Faso': 'Burkina Faso', 'Níger': 'Niger', 'Chade': 'Chad', 'Benin': 'Benin', 'Benim': 'Benin',
    'Togo': 'Togo', 'Serra Leoa': 'Sierra Leone', 'Libéria': 'Liberia', 'Gâmbia': 'Gambia',
    'Mauritânia': 'Mauritania', 'República Centro-Africana': 'Central African Republic', 'Comores': 'Comoros',
    'Eritreia': 'Eritrea', 'Somália': 'Somalia', 'Djibuti': 'Djibouti', 'Lesoto': 'Lesotho',
    'Essuatíni': 'Eswatini', 'Suazilândia': 'Eswatini', 'Seicheles': 'Seychelles',
    // Asia & Middle East
    'Japão': 'Japan', 'Coreia do Sul': 'South Korea', 'Coréia do Sul': 'South Korea', 'Coreia do Norte': 'North Korea',
    'China': 'China', 'Taiwan': 'Taiwan', 'Hong Kong': 'Hong Kong', 'Macau': 'Macao', 'Mongólia': 'Mongolia',
    'Índia': 'India', 'Paquistão': 'Pakistan', 'Bangladesh': 'Bangladesh', 'Nepal': 'Nepal', 'Sri Lanka': 'Sri Lanka',
    'Tailândia': 'Thailand', 'Vietnã': 'Vietnam', 'Vietname': 'Vietnam', 'Indonésia': 'Indonesia',
    'Malásia': 'Malaysia', 'Singapura': 'Singapore', 'Filipinas': 'Philippines', 'Camboja': 'Cambodia',
    'Laos': 'Laos', 'Mianmar': 'Myanmar', 'Timor-Leste': 'East Timor', 'Uzbequistão': 'Uzbekistan',
    'Tajiquistão': 'Tajikistan', 'Turcomenistão': 'Turkmenistan', 'Quirguistão': 'Kyrgyzstan',
    'Afeganistão': 'Afghanistan', 'Irã': 'Iran', 'Irão': 'Iran', 'Iraque': 'Iraq', 'Síria': 'Syria',
    'Líbano': 'Lebanon', 'Jordânia': 'Jordan', 'Israel': 'Israel', 'Palestina': 'Palestine',
    'Arábia Saudita': 'Saudi Arabia', 'Emirados Árabes Unidos': 'United Arab Emirates', 'Catar': 'Qatar',
    'Qatar': 'Qatar', 'Barein': 'Bahrain', 'Bahrein': 'Bahrain', 'Kuwait': 'Kuwait', 'Omã': 'Oman',
    'Iêmen': 'Yemen', 'Iémen': 'Yemen',
    // Oceania
    'Austrália': 'Australia', 'Nova Zelândia': 'New Zealand', 'Fiji': 'Fiji', 'Papua-Nova Guiné': 'Papua New Guinea',
    'Nova Caledônia': 'New Caledonia', 'Nova Caledónia': 'New Caledonia', 'Taiti': 'Tahiti',
    'Ilhas Salomão': 'Solomon Islands', 'Vanuatu': 'Vanuatu', 'Samoa': 'Samoa', 'Tonga': 'Tonga',
  };

  // Source country name -> DC country name. Applied on the DC side for every
  // source (EliteProspects, Transfermarkt, oGol). Keys are lowercase.
  // Confirmed in DC: "Czech Republic". The rest are best guesses — if DC
  // rejects one, the original name is tried next and the log shows it.
  const DC_COUNTRY_ALIASES = {
    'czechia': 'Czech Republic',
    'czech rep.': 'Czech Republic',
    'usa': 'USA',
    'united states': 'USA',
    'united states of america': 'USA',
    'korea, south': 'South Korea',
    'korea': 'South Korea',
    'korea, north': 'North Korea',
    'türkiye': 'Turkey',
    'turkiye': 'Turkey',
    'bosnia-herzegovina': 'Bosnia and Herzegovina',
    'bosnia & herzegovina': 'Bosnia and Herzegovina',
    "cote d'ivoire": 'Ivory Coast',
    'congo dr': 'DR Congo',
    'côte d’ivoire': 'Ivory Coast',
    "côte d'ivoire": 'Ivory Coast',
    'congo - kinshasa': 'DR Congo',
    'hongkong': 'Hong Kong',
    'hong kong sar china': 'Hong Kong',
    'hong kong, china': 'Hong Kong',
    'macao sar china': 'Macao',
    'macau': 'Macao',
    'myanmar (burma)': 'Myanmar',
    'congo - brazzaville': 'Congo',
  };

  function toDcCountry(name) {
    const n = (name || '').trim();
    return DC_COUNTRY_ALIASES[n.toLowerCase()] || n;
  }

  // PT broad position -> DC participant type label
  function mapPosition(posText) {
    const t = (posText || '').toLowerCase();
    if (t.includes('gol')) return 'Goalkeeper';
    if (t.includes('zagueiro') || t.includes('lateral') || t.includes('defesa') || t.includes('defensor')) return 'Defender';
    if (t.includes('meia') || t.includes('meio') || t.includes('volante')) return 'Midfielder';
    if (t.includes('atacante') || t.includes('ponta')) return 'Forward';
    // European Portuguese / other variants (Médio, Guarda-redes, Avançado…)
    return mapPositionAny(posText);
  }

  // Multilingual position keywords -> DC participant type label.
  // Checked in this order: midfield goes before defender/forward so that
  // "Defensive Midfield", "Attacking Midfield", "Mediapunta", "Ön Libero" etc.
  // land in Midfielder. Matching is a lowercase substring test.
  const POSITION_KEYWORDS = [
    ['Goalkeeper', ['goalkeeper', 'keeper', 'torwart', 'portero', 'portiere', 'gardien', 'goleiro', 'guarda-redes',
      'bramkarz', 'kaleci', 'doelman', 'τερματοφύλακας', 'portar', 'kiper', 'ゴールキーパー', '골키퍼']],
    ['Midfielder', ['midfield', 'mittelfeld', 'medio', 'mediocentro', 'mediapunta', 'pivote', 'interior', 'centrocampista',
      'mediano', 'trequartista', 'mezzala', 'regista', 'milieu', 'meia', 'meio-campo', 'médio', 'volante', 'pomocnik',
      'orta saha', 'ön libero', 'middenvelder', 'μέσος', 'mijlocaș', 'gelandang', 'ミッドフィールダー', 'ボランチ', '미드필더']],
    ['Defender', ['back', 'defence', 'defender', 'sweeper', 'verteidiger', 'abwehr', 'libero', 'defensa', 'lateral',
      'difensore', 'terzino', 'défenseur', 'défense', 'arrière', 'zagueiro', 'defesa', 'obrońca', 'obrona', 'stoper',
      'defans', 'bek', 'verdediger', 'αμυντικός', 'fundaș', 'apărare', 'bek', 'ディフェンダー', 'サイドバック', '수비수']],
    ['Forward', ['forward', 'striker', 'winger', 'attack', 'stürmer', 'sturm', 'flügel', 'angriff', 'delantero', 'extremo',
      'ataque', 'avançado', 'attaccante', 'punta', 'ala ', 'attaquant', 'ailier', 'avant-centre', 'atacante', 'ponta', 'centroavante',
      'napastnik', 'skrzydłowy', 'atak', 'außen', 'forvet', 'santrafor', 'kanat', 'aanvaller', 'spits', 'vleugel',
      'επιθετικός', 'εξτρέμ', 'atacant', 'extremă', 'penyerang', 'sayap', 'フォワード', 'ウイング', '공격수', '윙어']],
  ];

  function mapPositionAny(posText) {
    const t = ` ${(posText || '').toLowerCase()} `;
    for (const [label, words] of POSITION_KEYWORDS) {
      if (words.some((w) => t.includes(w))) return label;
    }
    return null;
  }

  function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

  async function waitFor(fn, timeoutMs = 2000, stepMs = 50) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const val = fn();
      if (val) return val;
      await sleep(stepMs);
    }
    return null;
  }

  // Builds the small floating panel on source pages (oGol / Transfermarkt)
  // with two actions:
  //  - "Capture" — just stores the parsed data locally (old behaviour,
  //    useful if you already have a DC tab open and want to hit
  //    "Load captured data & fill form" there yourself).
  //  - "Create participant in DC" — captures AND opens a fresh DC
  //    "new participant" tab, which then auto-fills itself once loaded.
  function makeSourcePanel(labelText, onCapture) {
    GM_addStyle(`
      #dc-ogol-source-panel {
        position: fixed; top: 8px; left: 8px; z-index: 99999;
        display: flex; flex-direction: row; align-items: flex-start; gap: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      #dc-ogol-source-panel.on-right { left: auto; right: 8px; flex-direction: row-reverse; }
      #dc-ogol-source-panel.on-right .dc-panel-content { align-items: flex-end; }
      #dc-ogol-source-panel .dc-panel-content { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; }
      #dc-ogol-source-panel.collapsed .dc-panel-content,
      #dc-ogol-source-panel.collapsed .dc-ctrl-side { display: none; }
      /* Small square controls: eye (hide/show) and arrows (switch side). */
      #dc-ogol-source-panel .dc-panel-ctrl { display: flex; flex-direction: column; gap: 4px; }
      #dc-ogol-source-panel .dc-panel-ctrl button {
        width: 24px; height: 24px; padding: 0; border-radius: 5px; justify-content: center; gap: 0;
        background: rgba(30,30,40,.55); box-shadow: 0 2px 8px rgba(0,0,0,.3); opacity: .7;
      }
      #dc-ogol-source-panel .dc-panel-ctrl button:hover { background: rgba(30,30,40,.85); opacity: 1; }
      #dc-ogol-source-panel .dc-panel-content button { opacity: .75; }
      #dc-ogol-source-panel .dc-panel-content button:hover { opacity: 1; }
      #dc-ogol-source-panel button {
        display: flex; align-items: center; gap: 8px;
        border: none; border-radius: 8px; padding: 12px 18px;
        font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;
        box-shadow: 0 4px 16px rgba(0,0,0,.35); cursor: pointer; color: #FFFFFF;
        transition: background .15s ease, transform .1s ease, box-shadow .15s ease;
      }
      #dc-ogol-source-panel button:active { transform: scale(0.97); }
      #dc-ogol-source-panel button.create-btn { background: #0a7a3d; }
      #dc-ogol-source-panel button.create-btn:hover { background: #0e9a4d; }
      #dc-ogol-source-panel .dc-date-warning {
        display: none; max-width: 300px; padding: 8px 10px; border-radius: 8px;
        background: #f5a623; color: #1a1a1a; font-size: 12px; font-weight: 600; line-height: 1.4;
        box-shadow: 0 4px 16px rgba(0,0,0,.35);
      }
      #dc-ogol-source-panel button.dup-btn { background: #1f5fa8; }
      #dc-ogol-source-panel button.dup-btn:hover { background: #2a74c8; }
    `);

    const wrap = document.createElement('div');
    wrap.id = 'dc-ogol-source-panel';
    wrap.innerHTML = `
      <div class="dc-panel-ctrl">
        <button type="button" class="dc-ctrl-eye" title="Hide / show buttons"></button>
        <button type="button" class="dc-ctrl-side" title="Move to the other side"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3l4 4-4 4"/><path d="M3 7h18"/><path d="M7 21l-4-4 4-4"/><path d="M21 17H3"/></svg></button>
      </div>
      <div class="dc-panel-content">
      <button type="button" class="create-btn" id="dc-ogol-create-btn" title="${labelText}">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
        <span>Create participant in DC</span>
      </button>
      <button type="button" class="dup-btn" id="dc-ogol-dup-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
        <span>Check duplicates in DC</span>
      </button>
      </div>
    `;
    document.body.appendChild(wrap);
    const content = wrap.querySelector('.dc-panel-content');

    // Panel state (hidden / side) is remembered across pages and sources.
    const PANEL_HIDDEN_KEY = 'dcPanelHidden';
    const PANEL_SIDE_KEY = 'dcPanelSide';
    const EYE_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
    const EYE_OFF_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><path d="M1 1l22 22"/></svg>';
    const eyeBtn = wrap.querySelector('.dc-ctrl-eye');
    const sideBtn = wrap.querySelector('.dc-ctrl-side');

    const applyPanelState = () => {
      const hidden = GM_getValue(PANEL_HIDDEN_KEY, false);
      const onRight = GM_getValue(PANEL_SIDE_KEY, 'left') === 'right';
      wrap.classList.toggle('collapsed', hidden);
      wrap.classList.toggle('on-right', onRight);
      eyeBtn.innerHTML = hidden ? EYE_OFF_ICON : EYE_ICON;
      eyeBtn.title = hidden ? 'Show buttons' : 'Hide buttons';
    };
    eyeBtn.addEventListener('click', () => {
      GM_setValue(PANEL_HIDDEN_KEY, !GM_getValue(PANEL_HIDDEN_KEY, false));
      applyPanelState();
    });
    sideBtn.addEventListener('click', () => {
      GM_setValue(PANEL_SIDE_KEY, GM_getValue(PANEL_SIDE_KEY, 'left') === 'right' ? 'left' : 'right');
      applyPanelState();
    });
    applyPanelState();

    const createBtn = wrap.querySelector('#dc-ogol-create-btn');
    const dupBtn = wrap.querySelector('#dc-ogol-dup-btn');

    // "Check duplicates in DC" — capture (so the name split is current), then
    // open the DC participant search filtered by "FirstName Surname".
    // The tab is opened synchronously inside the click (popup blockers).
    dupBtn.addEventListener('click', async () => {
      const tab = window.open('about:blank', '_blank');
      const data = await doCapture();
      const url = buildDuplicateSearchUrl(data);
      console.log('[dc-ogol-fill] duplicate search', url);
      if (tab && !tab.closed) tab.location.href = url;
      else window.open(url, '_blank');
    });

    // Parses the page and stores the data for the DC tab. Runs ONLY on user
    // action ("Create participant in DC", "Check duplicates in DC", name-split
    // click) — never on page load, so merely browsing profiles doesn't
    // overwrite data another DC tab may be about to use, and Transfermarkt
    // isn't fetched in the background on every page view.
    // onCapture may be sync (oGol) or async (Transfermarkt fetches the EN page).
    const doCapture = async () => {
      const data = await Promise.resolve(onCapture());
      // Visible 1 January warning right under the buttons.
      let warn = content.querySelector('.dc-date-warning');
      if (!warn) {
        warn = document.createElement('div');
        warn.className = 'dc-date-warning';
        content.insertBefore(warn, content.querySelector('#dc-ogol-name-split'));
      }
      warn.textContent = isJan1(data) ? jan1Message(data) : '';
      warn.style.display = isJan1(data) ? 'block' : 'none';
      GM_setValue(STORAGE_KEY, JSON.stringify(data));
      console.log('[dc-ogol-fill] captured', data);
      return data;
    };


    // "Create participant in DC" — capture, flag for auto-run, then open
    // a new tab straight to the DC "new participant" form. The DC-side
    // code below picks up the flagged data once that tab finishes loading
    // and fills the form on its own (nothing is ever saved automatically).
    createBtn.addEventListener('click', async () => {
      // Open the tab synchronously inside the click (popup blockers), then
      // point it at DC once the (possibly async) capture is done, so the DC
      // page never loads before the data is stored.
      const tab = window.open('about:blank', '_blank');
      const originalLabel = createBtn.querySelector('span').textContent;
      createBtn.querySelector('span').textContent = 'Capturing…';
      const data = await doCapture();
      data.autoRun = true;
      data.autoRunAt = Date.now(); // DC auto-fills only if it loads within AUTO_RUN_MAX_AGE_MS
      GM_setValue(STORAGE_KEY, JSON.stringify(data));
      createBtn.querySelector('span').textContent = 'Opening DC…';
      if (tab && !tab.closed) tab.location.href = DC_NEW_PARTICIPANT_URL;
      else window.open(DC_NEW_PARTICIPANT_URL, '_blank');
      setTimeout(() => { createBtn.querySelector('span').textContent = originalLabel; }, 3000);
    });

    return { wrap: content, doCapture };
  }

  // ---------------------------------------------------------------------
  // Name split (shared by sources that don't mark the surname: oGol, EP)
  // ---------------------------------------------------------------------
  // Index of the first surname token in the full name. null = not decided yet.
  const NAME = { split: null };

  // Particles always belong to the surname that follows them ("da Silva").
  const NAME_PARTICLES = ['da', 'de', 'do', 'das', 'dos', 'del', 'della', 'di', 'du', 'la', 'le', 'los', 'las',
    'van', 'von', 'der', 'den', 'y', 'e'];
  const isParticle = (t) => NAME_PARTICLES.includes(t.toLowerCase());
  const normTok = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  function nameTokens(fullName, commonName) {
    return (fullName || commonName || '').split(/\s+/).filter(Boolean);
  }

  // Default split:
  //  - common name (h1) equal to the END of the full name -> it's the surname
  //    ("Nicolás Meriano" + "Meriano" -> Nicolás | Meriano)
  //  - one-word common name equal to the START of the full name -> first name
  //    ("Railson Gomes da Silva" + "Railson" -> Railson | Gomes da Silva)
  //  - otherwise first token = first name, rest = surname(s)
  //    (Hispanic double surnames stay together: "Juan Pérez García" -> Juan | Pérez García)
  //  Then never leave a particle at the end of the first name.
  // opts.allowMultiHead: also treat a multi-word common name matching the
  // START of the full name as the first name(s). Right for Portuguese-style
  // names ("Yuri Alberto" of "Yuri Alberto Monteiro da Silva"), wrong for
  // Hispanic ones ("Juan Pérez" of "Juan Pérez García"), so callers enable it
  // per nationality.
  function guessNameSplit(tokens, commonName, opts = {}) {
    if (tokens.length <= 1) return 0; // single word -> surname only
    const full = tokens.map(normTok);
    const common = (commonName || '').split(/\s+/).filter(Boolean).map(normTok);
    let split = 1;
    if (common.length && common.length < full.length) {
      const tail = full.slice(full.length - common.length).join(' ');
      const head = full.slice(0, common.length).join(' ');
      if (tail === common.join(' ')) split = full.length - common.length;
      // A ONE-word head match is always safe; a multi-word head like "Juan Pérez"
      // (of "Juan Pérez García") is usually first name + first surname, so
      // multi-word heads count only with opts.allowMultiHead.
      else if (head === common.join(' ') && (common.length === 1 || opts.allowMultiHead)) split = common.length;
    }
    while (split > 1 && isParticle(tokens[split - 1])) split--;
    return split;
  }

  // Clickable chips under the panel buttons: click the word where the
  // surname starts. Every change re-captures.
  // ---------------------------------------------------------------------
  // DC naming rules (from the participant-creation manual)
  // ---------------------------------------------------------------------
  //  - Surname and First Name get ONE name each (short names on the web);
  //    the complete name goes to Full Name ("Surnames FirstNames", DC order).
  //  - ß -> ss, Þ/þ -> Th/th, Ð/ð -> D/d (all languages).
  //  - Arabic names without hyphens: Al-Habsi -> Al Habsi.
  //  - Russian/Ukrainian patronymics (-vich, -vic, -ovna, ...) only in Full Name.
  //  - Asian players: Full Name is copied into Short Name (done on the DC form).
  const ARAB_COUNTRIES = ['Algeria', 'Bahrain', 'Comoros', 'Djibouti', 'Egypt', 'Iraq', 'Jordan', 'Kuwait', 'Lebanon',
    'Libya', 'Mauritania', 'Morocco', 'Oman', 'Palestine', 'Qatar', 'Saudi Arabia', 'Somalia', 'Sudan', 'Syria',
    'Tunisia', 'United Arab Emirates', 'Yemen'];
  const PATRONYMIC_COUNTRIES = ['Russia', 'Ukraine', 'Belarus', 'Kazakhstan', 'Kyrgyzstan', 'Tajikistan', 'Uzbekistan',
    'Turkmenistan', 'Moldova', 'Armenia', 'Azerbaijan', 'Georgia'];
  const ASIAN_COUNTRIES = ['South Korea', 'North Korea', 'Korea Republic', 'Japan', 'China', 'China PR', 'Taiwan',
    'Chinese Taipei', 'Hong Kong', 'Macao', 'Mongolia', 'Vietnam', 'Thailand', 'Cambodia', 'Laos', 'Myanmar',
    'Malaysia', 'Singapore', 'Indonesia', 'Philippines', 'Brunei', 'East Timor', 'Timor-Leste'];
  // Spelling-tolerant: "Hongkong" / "Hong Kong" / "Hong Kong SAR China" all match.
  const countryKey = (c) => (c || '').toLowerCase().replace(/\bsar\b.*$/, '').replace(/[^a-z]/g, '');
  const ASIAN_KEYS = new Set(ASIAN_COUNTRIES.map(countryKey));
  const isAsianCountry = (c) => ASIAN_KEYS.has(countryKey(c)) || ASIAN_KEYS.has(countryKey(toDcCountry(c)));
  const PATRONYMIC_RE = /(ovich|evich|ovych|evych|ovič|evič|ovic|evic|yich|ovna|evna|ivna|ichna)$/i;
  // Name prefixes that belong to the surname that follows (in addition to NAME_PARTICLES).
  const SURNAME_PREFIXES = ['al', 'el', 'bin', 'ben', 'ibn', 'abu', 'abd', 'abdel', 'abdul', 'ould', 'bou', 'van', 'von', 'der', 'den', 'ter', 'mc', 'mac', 'st', 'st.'];
  const ARAB_HYPHEN_PREFIX_RE = /\b(Al|El|Abd|Abdel|Abdul|Abu|Bin|Ben|Ibn|Ould|Bou)-(?=\S)/gi;

  function normalizeNameChars(s) {
    return (s || '')
      .replace(/ß/g, 'ss').replace(/ẞ/g, 'SS')
      .replace(/Þ/g, 'Th').replace(/þ/g, 'th')
      .replace(/Ð/g, 'D').replace(/ð/g, 'd');
  }

  // Arab nationality: no hyphens at all; otherwise only Arabic prefixes
  // ("Al-Habsi") lose the hyphen — "Jean-Pierre" stays.
  function removeArabHyphens(s, isArab) {
    const t = s || '';
    return (isArab ? t.replace(/-/g, ' ') : t.replace(ARAB_HYPHEN_PREFIX_RE, '$1 ')).replace(/\s+/g, ' ').trim();
  }

  // { firstName, surname, fullName } as DC wants them. fullName is null when
  // it would be the same as the short "Surname FirstName".
  function finalizeNames(data) {
    const country = toDcCountry(data.country || '');
    const isArab = ARAB_COUNTRIES.includes(country);
    const patron = PATRONYMIC_COUNTRIES.includes(country);
    const prep = (s) => removeArabHyphens(normalizeNameChars(s), isArab);
    const firstTok = prep(data.firstName).split(' ').filter(Boolean);
    const surTok = prep(data.surname).split(' ').filter(Boolean);
    const isPatronymic = (t) => patron && PATRONYMIC_RE.test(t);

    const firstShort = firstTok.find((t) => !isPatronymic(t)) || firstTok[0] || '';

    // Surname: leading particles/prefixes + the first real surname word.
    let surShort = '';
    const lead = [];
    for (const t of surTok) {
      if (isPatronymic(t)) continue;
      const low = t.toLowerCase();
      if (NAME_PARTICLES.includes(low) || SURNAME_PREFIXES.includes(low)) { lead.push(t); continue; }
      surShort = [...lead, t].join(' ');
      break;
    }
    if (!surShort) surShort = surTok.join(' ');

    const full = [...surTok, ...firstTok].join(' ');
    const short = [surShort, firstShort].filter(Boolean).join(' ');
    return {
      firstName: firstShort || null,
      surname: surShort || null,
      fullName: full && full !== short ? full : null,
      isAsian: isAsianCountry(data.country),
    };
  }

  function mountNameSplitWidget(panel, tokens) {
    if (!tokens.length) return;
    GM_addStyle(`
      #dc-ogol-name-split {
        background: rgba(20,20,28,.92); border-radius: 8px; padding: 8px 10px; max-width: 340px;
        box-shadow: 0 4px 16px rgba(0,0,0,.35); color: #ddd; font-size: 11px;
      }
      #dc-ogol-name-split .hint { margin-bottom: 6px; }
      #dc-ogol-name-split .chips { display: flex; flex-wrap: wrap; gap: 4px; }
      #dc-ogol-name-split .chip {
        border: 1px solid #555; border-radius: 4px; padding: 3px 7px; cursor: pointer;
        font-size: 12px; font-weight: 600; user-select: none;
      }
      #dc-ogol-name-split .chip.first { background: #1f4f8a; border-color: #3d7fd1; color: #fff; }
      #dc-ogol-name-split .chip.sur { background: #6b1030; border-color: #FF0046; color: #fff; }
      #dc-ogol-name-split .result { margin-top: 6px; line-height: 1.5; }
      #dc-ogol-name-split .result b { color: #fff; }
    `);
    const box = document.createElement('div');
    box.id = 'dc-ogol-name-split';
    box.innerHTML = `
      <div class="hint">Click the word where the <b style="color:#ff6b8f">surname</b> starts:</div>
      <div class="chips"></div>
      <div class="result"></div>`;
    panel.wrap.appendChild(box);

    const render = () => {
      const chips = box.querySelector('.chips');
      chips.innerHTML = '';
      tokens.forEach((t, i) => {
        const chip = document.createElement('span');
        chip.className = `chip ${i < NAME.split ? 'first' : 'sur'}`;
        chip.textContent = t;
        chip.title = i === 0 ? 'Whole name as surname (no first name)' : 'Surname starts here';
        chip.addEventListener('click', () => {
          NAME.split = i;
          render();
          panel.doCapture();
        });
        chips.appendChild(chip);
      });
      const fin = finalizeNames({ firstName: tokens.slice(0, NAME.split).join(' '), surname: tokens.slice(NAME.split).join(' ') });
      box.querySelector('.result').innerHTML =
        `First name: <b>${tokens.slice(0, NAME.split).join(' ') || '—'}</b><br>` +
        `Surname: <b>${tokens.slice(NAME.split).join(' ') || '—'}</b><br>` +
        `<span style="opacity:.8">→ DC: <b>${fin.firstName || '—'}</b> | <b>${fin.surname || '—'}</b>` +
        `${fin.fullName ? `<br>Full Name: ${fin.fullName}` : ''}</span>`;
    };
    render();
  }

  // =======================================================================
  // PART 1: runs on the oGol player page — parses the live DOM and stores it
  // =======================================================================
  if (location.hostname.includes('ogol.com.br')) {
    // Labels vary ("Nacionalidade" vs "Nacionalidade / Dupla Nacionalidade"),
    // so an exact match wins, otherwise the first label starting with it.
    function getRow(label) {
      const rows = Array.from(document.querySelectorAll('.card-data__row'));
      const labelOf = (r) => (r.querySelector('.card-data__label')?.textContent || '').trim();
      const row = rows.find((r) => labelOf(r) === label) || rows.find((r) => labelOf(r).startsWith(label));
      return row ? row.querySelector('.card-data__value')?.textContent.trim() : null;
    }

    // Common name from the h1, without a shirt number prefix ("9.Yuri Alberto").
    function ogolCommonName() {
      const nameEl = document.querySelector('h1 .name');
      if (!nameEl) return null;
      const text = Array.from(nameEl.childNodes)
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent.trim()).join(' ').trim() || nameEl.textContent.trim();
      return text.replace(/^\d+\s*\.\s*/, '').trim() || null;
    }

    // First nationality only ("Brasil / Itália" -> "Brasil").
    function ogolNationality() {
      const raw = getRow('Nacionalidade');
      return raw ? raw.split(/\s*[\/,]\s*/)[0].trim() || null : null;
    }

    const LUSOPHONE = ['Brasil', 'Portugal', 'Angola', 'Moçambique', 'Cabo Verde', 'Guiné-Bissau', 'São Tomé e Príncipe', 'Timor-Leste'];

    function ogolSplit(tokens, commonName) {
      return guessNameSplit(tokens, commonName, { allowMultiHead: LUSOPHONE.includes(ogolNationality()) });
    }

    function parseOgolLive() {
      const commonName = ogolCommonName();
      const fullName = getRow('Nome');
      const dobRaw = getRow('Data de Nascimento'); // e.g. "1991-12-15 (34 anos)"
      const dobMatch = dobRaw && dobRaw.match(/(\d{4})-(\d{2})-(\d{2})/);
      const nationality = ogolNationality();

      const heightWeightRaw = getRow('Altura / Peso'); // e.g. "170 cm / 72 kg"
      const heightMatch = heightWeightRaw && heightWeightRaw.match(/(\d+)\s*cm/);

      const headerInfo = document.querySelector('.zz-enthdr-info .info')?.textContent || '';
      // format: "•34 anos•Meia•Futebol"
      const parts = headerInfo.split('•').map((s) => s.trim()).filter(Boolean);
      // Prefer the "Posição" row; the header info ("•25 anos•Defensor•Futebol") is the fallback.
      const positionText = getRow('Posição') || (parts.length >= 2 ? parts[1] : '');

      // oGol doesn't mark which part is the surname, so the split comes from
      // NAME.split (heuristic default, user can correct it in the panel).
      const tokens = nameTokens(fullName, commonName);
      if (NAME.split === null) NAME.split = ogolSplit(tokens, commonName);
      const firstName = tokens.slice(0, NAME.split).join(' ') || null;
      const surname = tokens.slice(NAME.split).join(' ') || null;

      // The h1 "common" name ("Yuri Alberto") vs the full "Nome"
      // ("Yuri Alberto Monteiro da Silva"): when they differ, it's offered as
      // the South American nickname on the DC form (prefilled, not applied).
      const norm = (x) => (x || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
      const nickname = commonName && fullName && norm(commonName) !== norm(fullName) ? commonName : null;

      return {
        participantType: 'Player',
        surname,
        firstName,
        nickname,
        birthYear: dobMatch ? dobMatch[1] : null,
        birthMonth: dobMatch ? dobMatch[2] : null,
        birthDay: dobMatch ? dobMatch[3] : null,
        country: nationality ? (COUNTRY_MAP[nationality] || nationality) : null,
        heightCm: heightMatch ? heightMatch[1] : null,
        position: mapPosition(positionText),
        sourceUrl: location.origin + location.pathname, // drop tracking query (?adobe_mc=…) and hash
        capturedAt: new Date().toISOString(),
      };
    }

    const ogolPanel = makeSourcePanel('Capture player data for DC (oGol)', parseOgolLive);
    {
      const commonName = ogolCommonName();
      const tokens = nameTokens(getRow('Nome'), commonName);
      if (NAME.split === null) NAME.split = ogolSplit(tokens, commonName);
      mountNameSplitWidget(ogolPanel, tokens);
    }
  }

  // =======================================================================
  // PART 1b: runs on Transfermarkt player/coach pages (any language domain)
  // =======================================================================
  // Strategy:
  //  1. Parse the live page structurally — ISO date from the birth-date link,
  //     itemprop attributes, flag image IDs — so it works on any language.
  //  2. On a non-English domain, also fetch the same page from
  //     transfermarkt.com and prefer its values (English country + position
  //     names, which is what DC expects).
  //  3. If that fetch fails, fall back to the local values: country via the
  //     learned flag-ID -> English name cache, position via the multilingual
  //     keyword map.
  if (/(^|\.)transfermarkt\.[a-z.]+$/.test(location.hostname)) {
    const isCoachPage = location.pathname.includes('/profil/trainer/');
    const TM_ENGLISH_HOSTS = ['www.transfermarkt.com', 'www.transfermarkt.co.uk', 'www.transfermarkt.us', 'www.transfermarkt.world'];
    const isEnglishHost = TM_ENGLISH_HOSTS.includes(location.hostname);
    const FLAG_CACHE_KEY = 'dcTmFlagNames'; // { "<flagId>": "English country name" }

    // Localized labels, used only as fallbacks when structural selectors miss.
    const CITIZENSHIP_LABELS = ['Citizenship', 'Staatsbürgerschaft', 'Nacionalidad', 'Nazionalità', 'Nationalité',
      'Nacionalidade', 'Obywatelstwo', 'Vatandaşlık', 'Nationaliteit', 'Υπηκοότητα', 'Cetățenie', '国籍', '국적', 'Kewarganegaraan'];
    const POSITION_LABELS = ['Position', 'Posición', 'Posizione', 'Poste', 'Posição', 'Pozycja', 'Mevki', 'Positie',
      'Θέση', 'Poziție', 'ポジション', '포지션', 'Posisi'];

    const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const pad2 = (n) => String(n).padStart(2, '0');

    // ---- date of birth -------------------------------------------------
    const EN_MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

    function parseDateText(text, host) {
      const t = clean(text).replace(/\(.*?\)/g, ' ');
      let m = t.match(/(\d{4})\D{1,3}(\d{1,2})\D{1,3}(\d{1,2})/); // 2004-05-24, 2004/05/24, 2004年5月24日, 2004. 5. 24.
      if (m) return { y: m[1], m: pad2(m[2]), d: pad2(m[3]) };
      m = t.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{4})/); // 24.05.2004, 24/05/2004, 05/24/2004
      if (m) {
        let a = +m[1], b = +m[2];
        const monthFirst = a <= 12 && (b > 12 || /transfermarkt\.us$/.test(host));
        if (monthFirst) [a, b] = [b, a];
        return { y: m[3], m: pad2(b), d: pad2(a) };
      }
      m = t.match(/([A-Za-z]{3})[a-z]*\.? (\d{1,2}), (\d{4})/) || null; // May 24, 2004
      if (m && EN_MONTHS[m[1].toLowerCase()]) return { y: m[3], m: pad2(EN_MONTHS[m[1].toLowerCase()]), d: pad2(m[2]) };
      m = t.match(/(\d{1,2}) ([A-Za-z]{3})[a-z]*\.? (\d{4})/); // 24 May 2004
      if (m && EN_MONTHS[m[2].toLowerCase()]) return { y: m[3], m: pad2(EN_MONTHS[m[2].toLowerCase()]), d: pad2(m[1]) };
      return null;
    }

    function extractDob(doc, host) {
      // 1) The birth date links to "what happened on this day" with an ISO date in the URL.
      const link = doc.querySelector('[itemprop="birthDate"] a[href*="/datum/"], .data-header a[href*="/datum/"]');
      let m = link && link.getAttribute('href').match(/\/datum\/(\d{4})-(\d{2})-(\d{2})/);
      if (m) return { y: m[1], m: m[2], d: m[3] };
      // 2) JSON-LD, if the page ships it.
      for (const s of doc.querySelectorAll('script[type="application/ld+json"]')) {
        try {
          const j = JSON.parse(s.textContent);
          for (const o of (Array.isArray(j) ? j : [j])) {
            const bd = o?.birthDate || o?.mainEntity?.birthDate;
            m = bd && String(bd).match(/(\d{4})-(\d{2})-(\d{2})/);
            if (m) return { y: m[1], m: m[2], d: m[3] };
          }
        } catch (e) { /* ignore malformed JSON-LD */ }
      }
      // 3) Visible text in whatever local format.
      const el = doc.querySelector('[itemprop="birthDate"]');
      return el ? parseDateText(el.textContent, host) : null;
    }

    // ---- citizenship (flag) --------------------------------------------
    function findLabeledItem(doc, labels) {
      const items = Array.from(doc.querySelectorAll('.data-header__items .data-header__label, .info-table__content--regular'));
      return items.find((el) => labels.some((l) => clean(el.textContent).startsWith(l))) || null;
    }

    function extractFlags(doc) {
      let container = doc.querySelector('.data-header [itemprop="nationality"]');
      if (!container) {
        const label = findLabeledItem(doc, CITIZENSHIP_LABELS);
        // info-table: the value sits in the next sibling cell
        container = label && label.classList.contains('info-table__content--regular') ? label.nextElementSibling : label;
      }
      if (!container) return [];
      return Array.from(container.querySelectorAll('img.flaggenrahmen')).map((img) => {
        const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
        const idMatch = src.match(/\/flagge\/[^/]+\/(\d+)\.png/);
        return { id: idMatch ? idMatch[1] : null, name: clean(img.getAttribute('title') || img.getAttribute('alt')) };
      });
    }

    function loadFlagCache() {
      try { return JSON.parse(GM_getValue(FLAG_CACHE_KEY, '{}')) || {}; } catch (e) { return {}; }
    }

    // Remembers flag ID -> English name every time an English page is parsed,
    // so non-English pages can resolve countries even if the .com fetch fails.
    function learnFlags(flags) {
      const known = flags.filter((f) => f.id && f.name);
      if (!known.length) return;
      const cache = loadFlagCache();
      let changed = false;
      known.forEach((f) => { if (cache[f.id] !== f.name) { cache[f.id] = f.name; changed = true; } });
      if (changed) GM_setValue(FLAG_CACHE_KEY, JSON.stringify(cache));
    }

    // ---- height & position ---------------------------------------------
    function extractHeight(doc) {
      const candidates = [doc.querySelector('.data-header [itemprop="height"]'), doc.querySelector('[itemprop="height"]')];
      for (const el of candidates) {
        const m = el && el.textContent.match(/(\d)[.,](\d{2})/);
        if (m) return String(Math.round(parseFloat(`${m[1]}.${m[2]}`) * 100));
      }
      return null;
    }

    function extractPositionText(doc) {
      const detail = doc.querySelector('.detail-position__position');
      if (detail && clean(detail.textContent)) return clean(detail.textContent);
      const label = findLabeledItem(doc, POSITION_LABELS);
      if (!label) return null;
      const value = label.classList.contains('info-table__content--regular')
        ? label.nextElementSibling
        : label.querySelector('.data-header__content');
      return clean(value ? value.textContent : label.textContent);
    }

    // ---- full structural parse of one document --------------------------
    // Full legal name from the details table (players: .info-table, coaches:
    // table.auflistung). Only Latin-script values are used ("Name in home
    // country" can be Cyrillic, Arabic, ...).
    const FULL_NAME_LABELS = ['full name', 'name in home country', 'vollständiger name', 'name im heimatland',
      'nombre completo', 'nome completo', 'nom complet', 'nome completo', 'pełne imię i nazwisko', 'tam adı'];
    function extractFullName(doc) {
      const cells = [
        ...Array.from(doc.querySelectorAll('.info-table__content--regular')).map((el) => [el, el.nextElementSibling]),
        ...Array.from(doc.querySelectorAll('table.auflistung th')).map((th) => [th, th.nextElementSibling]),
      ];
      for (const [labelEl, valueEl] of cells) {
        const label = clean(labelEl.textContent).replace(/:$/, '').toLowerCase();
        const value = clean(valueEl?.textContent);
        if (FULL_NAME_LABELS.includes(label) && value && /^[\p{Script=Latin}\s.'’-]+$/u.test(value)) return value;
      }
      return null;
    }

    function parseTmDoc(doc, host) {
      const headlineWrapper = doc.querySelector('.data-header .data-header__headline-wrapper');
      let firstName = null;
      let surname = null;
      if (headlineWrapper) {
        const strongEl = headlineWrapper.querySelector('strong');
        surname = strongEl ? clean(strongEl.textContent) : null;
        firstName = Array.from(headlineWrapper.childNodes)
          .filter((n) => n.nodeType === Node.TEXT_NODE)
          .map((n) => n.textContent.trim()).join(' ').trim() || null;
        // Coach pages put the whole name in <strong> ("Hugo Chacon"):
        // first word = first name, the rest = surname.
        if (!firstName && surname && surname.includes(' ')) {
          const parts = surname.split(' ');
          firstName = parts[0];
          surname = parts.slice(1).join(' ');
        }
      }
      // Complete name ("Hugo Emanuel Barros Chacon"): split it right before the
      // headline surname, so DC gets short names + the complete Full Name.
      const full = extractFullName(doc);
      if (full && surname) {
        const tokens = full.split(' ');
        const norm = tokens.map(normTok);
        const sur = surname.split(' ').map(normTok);
        for (let i = 1; i <= norm.length - sur.length; i++) {
          if (sur.every((t, k) => norm[i + k] === t)) {
            firstName = tokens.slice(0, i).join(' ');
            surname = tokens.slice(i).join(' ');
            break;
          }
        }
      }
      return {
        firstName,
        surname,
        dob: extractDob(doc, host),
        flags: extractFlags(doc),
        heightCm: extractHeight(doc),
        positionText: isCoachPage ? null : extractPositionText(doc),
      };
    }

    // ---- English page fetch (memoized per page load) --------------------
    let englishDocPromise = null;
    function fetchEnglishDoc() {
      if (englishDocPromise) return englishDocPromise;
      if (CONFIG.debugSkipTmEnglish) {
        console.log('[dc-ogol-fill] debugSkipTmEnglish = true — skipping the EN fetch (testing fallback)');
        englishDocPromise = Promise.resolve(null);
        return englishDocPromise;
      }
      const url = 'https://www.transfermarkt.com' + location.pathname;
      englishDocPromise = new Promise((resolve) => {
        GM_xmlhttpRequest({
          method: 'GET',
          url,
          timeout: 10000,
          onload: (res) => {
            if (res.status !== 200) { console.log('[dc-ogol-fill] EN fetch status', res.status); resolve(null); return; }
            const doc = new DOMParser().parseFromString(res.responseText, 'text/html');
            // A bot challenge / consent wall won't have the player header.
            resolve(doc.querySelector('.data-header__headline-wrapper') ? doc : null);
          },
          onerror: (e) => { console.log('[dc-ogol-fill] EN fetch error', e); resolve(null); },
          ontimeout: () => { console.log('[dc-ogol-fill] EN fetch timeout'); resolve(null); },
        });
      });
      return englishDocPromise;
    }

    async function parseTransfermarkt() {
      const local = parseTmDoc(document, location.hostname);
      let en = null;
      if (isEnglishHost) {
        en = local;
      } else {
        const enDoc = await fetchEnglishDoc();
        if (enDoc) en = parseTmDoc(enDoc, 'www.transfermarkt.com');
      }
      if (en) learnFlags(en.flags);
      if (!isEnglishHost) {
        console.log(en
          ? '[dc-ogol-fill] Transfermarkt: using EN page data'
          : '[dc-ogol-fill] Transfermarkt: EN page unavailable — FALLBACK (flag cache + position map)');
      }

      const pick = (key) => (en && en[key]) || local[key] || null;
      const dob = pick('dob');

      // Country: English page > learned flag cache > local (possibly translated) title.
      const localFlag = local.flags[0] || null;
      const cache = loadFlagCache();
      const country = (en && en.flags[0]?.name)
        || (localFlag && localFlag.id && cache[localFlag.id])
        || (localFlag && localFlag.name)
        || null;
      const allFlags = (en && en.flags.length ? en.flags : local.flags).map((f) => (f.id && cache[f.id]) || f.name);
      if (allFlags.length > 1) console.log('[dc-ogol-fill] multiple citizenships found, using first:', allFlags);
      if (!en && localFlag && !(localFlag.id && cache[localFlag.id])) {
        console.log(`[dc-ogol-fill] country "${localFlag.name}" not translated (EN page unavailable, flag ${localFlag.id} not in cache) — check it in DC.`);
      }

      const positionText = pick('positionText');
      const position = isCoachPage ? null : mapPositionAny(positionText);
      if (!isCoachPage && positionText && !position) {
        console.log(`[dc-ogol-fill] unrecognized position "${positionText}" — extend POSITION_KEYWORDS.`);
      }

      return {
        participantType: isCoachPage ? 'Coach' : 'Player',
        surname: pick('surname'),
        firstName: pick('firstName'),
        birthYear: dob ? dob.y : null,
        birthMonth: dob ? dob.m : null,
        birthDay: dob ? dob.d : null,
        country,
        heightCm: pick('heightCm'), // usually null on coach pages, fillForm skips if absent
        position,
        sourceUrl: location.origin + location.pathname, // drop tracking query (?adobe_mc=…) and hash
        enrichedFromEnglish: !isEnglishHost && !!en,
        capturedAt: new Date().toISOString(),
      };
    }

    makeSourcePanel(
      `Capture ${isCoachPage ? 'coach' : 'player'} data for DC (Transfermarkt)`,
      parseTransfermarkt,
    );
  }

  // =======================================================================
  // PART 1c: runs on EliteProspects player pages (ice hockey)
  // =======================================================================
  // EP is a Next.js app with hashed CSS class names, so everything is found
  // by the visible fact labels ("Date of Birth", "Nation", ...) instead of
  // classes. EP is English-only, so the labels are stable.
  if (location.hostname.endsWith('eliteprospects.com')) {
    const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const pad2 = (n) => String(n).padStart(2, '0');
    const EN_MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

    // Finds the fact row for a label: the element whose OWN text is exactly
    // the label, then its <li> (or parent). Returns { row, valueText }.
    function epFact(label) {
      const candidates = Array.from(document.querySelectorAll('main li *, main dt, main span, main div, li *'));
      const labelEl = candidates.find((el) => el.children.length === 0 && clean(el.textContent) === label);
      if (!labelEl) return null;
      const row = labelEl.closest('li') || labelEl.parentElement;
      const full = clean(row.textContent);
      const valueText = full.startsWith(label) ? clean(full.slice(label.length)) : full;
      return { row, valueText };
    }

    function parseEpDate(text) {
      const t = clean(text);
      let m = t.match(/([A-Za-z]{3})[a-z]*\.? (\d{1,2}),? (\d{4})/); // Apr 14, 2006
      if (m && EN_MONTHS[m[1].toLowerCase()]) return { y: m[3], m: pad2(EN_MONTHS[m[1].toLowerCase()]), d: pad2(m[2]) };
      m = t.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (m) return { y: m[1], m: m[2], d: m[3] };
      return null;
    }

    // Nation is usually a flag + link to /nation/<slug>; dual nationality = several.
    function epNations() {
      const fact = epFact('Nation');
      if (!fact) return [];
      const links = Array.from(fact.row.querySelectorAll('a[href*="/nation/"]'));
      const names = links.map((a) => {
        const text = clean(a.textContent);
        if (text) return text;
        const img = a.querySelector('img');
        const alt = img && clean(img.getAttribute('title') || img.getAttribute('alt'));
        if (alt) return alt;
        const slug = (a.getAttribute('href').match(/\/nation\/([^/?#]+)/) || [])[1] || '';
        return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }).filter(Boolean);
      if (!names.length && fact.valueText) names.push(fact.valueText);
      return [...new Set(names)];
    }

    // EP positions: G, D, C, LW, RW, F, combos like "C/LW". First one wins.
    function mapHockeyPosition(posText) {
      const first = clean(posText).split(/[\/,\s]+/)[0].toUpperCase();
      if (first === 'G') return 'Goalkeeper';
      if (first === 'D' || first === 'LD' || first === 'RD') return 'Defender';
      if (['C', 'LW', 'RW', 'W', 'F'].includes(first)) return 'Forward';
      return null;
    }

    // EP marks women's competitions with "(W)" (e.g. "NCAA (W)"). Look at the
    // league links on the page (stats tables, current team). Returns 'Women'
    // when any is found, otherwise null (DC default applies).
    function epGender() {
      const leagueTexts = Array.from(document.querySelectorAll('a[href*="/league/"]'))
        .map((a) => clean(a.textContent));
      const womens = leagueTexts.find((t) => /\(W\)/.test(t));
      if (womens) {
        console.log(`[dc-ogol-fill] women's league found ("${womens}") — gender = Women`);
        return 'Women';
      }
      return null;
    }

    function epFullName() {
      const h1 = document.querySelector('main h1') || document.querySelector('h1');
      let name = h1
        ? clean(Array.from(h1.childNodes).filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent).join(' '))
        : '';
      if (!name && h1) name = clean(h1.textContent);
      if (!name) name = clean(document.title.split(' - ')[0]);
      return name.replace(/#\d+/g, '').trim();
    }

    async function parseEliteProspects() {
      // The facts block can render a moment after load.
      await waitFor(() => epFact('Date of Birth'), 5000, 100);

      const fullName = epFullName();
      const tokens = nameTokens(fullName, null);
      if (NAME.split === null) NAME.split = guessNameSplit(tokens, null);

      const dob = parseEpDate(epFact('Date of Birth')?.valueText);
      const heightMatch = (epFact('Height')?.valueText || '').match(/(\d{3})\s*cm/);
      const nations = epNations();
      if (nations.length > 1) console.log('[dc-ogol-fill] multiple nations found, using first:', nations);
      const positionText = epFact('Position')?.valueText || '';
      const position = mapHockeyPosition(positionText);
      if (positionText && !position) console.log(`[dc-ogol-fill] unrecognized hockey position "${positionText}"`);

      return {
        participantType: 'Player',
        sport: 'Hockey',
        gender: epGender(),
        surname: tokens.slice(NAME.split).join(' ') || null,
        firstName: tokens.slice(0, NAME.split).join(' ') || null,
        birthYear: dob ? dob.y : null,
        birthMonth: dob ? dob.m : null,
        birthDay: dob ? dob.d : null,
        country: nations[0] || null,
        heightCm: heightMatch ? heightMatch[1] : null,
        position,
        sourceUrl: location.origin + location.pathname,
        capturedAt: new Date().toISOString(),
      };
    }

    const epPanel = makeSourcePanel('Capture player data for DC (EliteProspects)', parseEliteProspects);
    waitFor(() => epFact('Date of Birth'), 5000, 100).then(() => {
      const tokens = nameTokens(epFullName(), null);
      if (NAME.split === null) NAME.split = guessNameSplit(tokens, null);
      mountNameSplitWidget(epPanel, tokens);
    });
  }

  // =======================================================================
  // PART 1d: runs on worldfootball.net person pages (soccer)
  // =======================================================================
  // Page structure (2026 layout):
  //  - header:  .person-firstname / .person-lastname, flag in .person_country-flag
  //  - sidebar facts (dl): dd.person-fullname, dd.person-birthday ("18.05.1999 | 27 Years"),
  //    dd.person_country-name (flag img + name), dd.person-height ("175 cm"),
  //    dd.person-position ("Central Midfielder")
  //  - "Career as a player" / "Career as a manager" blocks (.hs-career)
  // The header first/last name settles the surname split exactly; the full
  // name ("Lenin Camacho Flores") is split right before the header last name.
  if (location.hostname.endsWith('worldfootball.net')) {
    const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const pad2 = (n) => String(n).padStart(2, '0');
    const txt = (selector) => clean(document.querySelector(selector)?.textContent);

    function parseWfDate(text) {
      const t = clean(text);
      let m = t.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/); // 18.05.1999
      if (m) return { y: m[3], m: pad2(m[2]), d: pad2(m[1]) };
      m = t.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (m) return { y: m[1], m: m[2], d: m[3] };
      return null;
    }

    function wfCountry() {
      const dd = document.querySelector('.hs-profile dd.person_country-name, dd.person_country-name');
      const img = dd?.querySelector('img[title], img[alt]')
        || document.querySelector('.hs-page-header .person_country-flag img');
      return clean(img?.getAttribute('title') || img?.getAttribute('alt')) || clean(dd?.textContent) || null;
    }

    // Coach if the page only has a manager/coach career block.
    function wfIsCoach() {
      const headers = Array.from(document.querySelectorAll('.hs-career .hs-block-header'))
        .map((h) => clean(h.textContent).toLowerCase());
      const asPlayer = headers.some((h) => h.includes('player'));
      const asCoach = headers.some((h) => /manager|coach|trainer/.test(h));
      return asCoach && !asPlayer;
    }

    // Career rows carry data-gender="male"/"female".
    function wfGender() {
      const g = document.querySelector('.hs-career tbody tr[data-gender]')?.getAttribute('data-gender');
      if (g === 'female') return 'Women';
      if (g === 'male') return 'Men';
      return null;
    }

    function wfCareerPosition() {
      const cell = document.querySelector('.hs-career tbody tr td.role-name');
      return clean(cell?.textContent) || null;
    }

    function wfPrepareName() {
      const first = txt('.hs-page-header .person-firstname');
      const last = txt('.hs-page-header .person-lastname');
      const full = txt('.hs-profile dd.person-fullname') || clean(`${first} ${last}`)
        || clean(document.querySelector('.person-image img')?.getAttribute('title'));
      const tokens = nameTokens(full, null);
      if (NAME.split === null) {
        // Split before the first occurrence of the header last name (after index 0).
        let split = null;
        if (last) {
          const lastTok = last.split(' ').map(normTok);
          const norm = tokens.map(normTok);
          for (let i = 1; i <= norm.length - lastTok.length; i++) {
            if (lastTok.every((t, k) => norm[i + k] === t)) { split = i; break; }
          }
          if (split === null && first) {
            // Last name not found in the full name: use the header split as-is.
            const firstLen = first.split(' ').length;
            if (firstLen < tokens.length) split = firstLen;
          }
        }
        NAME.split = split ?? guessNameSplit(tokens, null);
      }
      return { tokens };
    }

    function parseWorldfootball() {
      const { tokens } = wfPrepareName();
      const isCoach = wfIsCoach();
      const dob = parseWfDate(txt('.hs-profile dd.person-birthday') || txt('dd.person-birthday'));

      const heightText = txt('.hs-profile dd.person-height') || txt('dd.person-height');
      const cm = heightText.match(/(\d{3})\s*cm/);
      const m = heightText.match(/(\d)[.,](\d{2})\s*m/);
      const heightCm = cm ? cm[1] : (m ? String(Math.round(parseFloat(`${m[1]}.${m[2]}`) * 100)) : null);

      let position = null;
      if (!isCoach) {
        const positionText = txt('.hs-profile dd.person-position') || wfCareerPosition() || '';
        // "Position(s)" can list several ("Central Midfielder, Right Winger"): first wins.
        position = mapPositionAny(positionText.split(/[,/]/)[0]) || mapPositionAny(positionText);
        if (positionText && !position) console.log(`[dc-ogol-fill] unrecognized position "${positionText}"`);
      }

      return {
        participantType: isCoach ? 'Coach' : 'Player',
        gender: wfGender(),
        surname: tokens.slice(NAME.split).join(' ') || null,
        firstName: tokens.slice(0, NAME.split).join(' ') || null,
        birthYear: dob ? dob.y : null,
        birthMonth: dob ? dob.m : null,
        birthDay: dob ? dob.d : null,
        country: wfCountry(),
        heightCm,
        position,
        sourceUrl: location.origin + location.pathname,
        capturedAt: new Date().toISOString(),
      };
    }

    const wfPanel = makeSourcePanel(
      `Capture ${wfIsCoach() ? 'coach' : 'player'} data for DC (worldfootball)`,
      parseWorldfootball,
    );
    mountNameSplitWidget(wfPanel, wfPrepareName().tokens);
  }

  // =======================================================================
  // PART 1e: runs on UEFA.com player pages (soccer)
  // =======================================================================
  // e.g. /uefayouthleague/clubs/players/250226846--mark-csikos/
  //      /uefachampionsleague/clubs/players/..., /uefaeuro/teams/players/...
  // Page structure:
  //  - schema.org microdata in the header: meta[itemprop=name|birthdate|
  //    nationality|height] ("2007-05-06", "Hungary", height "0" = unknown)
  //  - header name: .player-header__name--first / .player-header__name--last
  //  - profile: .player-profile-category / .player-profile-value
  //    (Position, Club number, Country, Date of birth "06/5/2007 (19)")
  //  - [data-name="related-players"] data-options JSON with gender "MALE"/"FEMALE"
  if (/^(www|en)\.uefa\.com$/.test(location.hostname) && /\/players\/\d+/.test(location.pathname)) {
    const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const pad2 = (n) => String(n).padStart(2, '0');
    const micro = (prop) => clean(document.querySelector(`.player-header meta[itemprop="${prop}"], meta[itemprop="${prop}"]`)?.getAttribute('content'));

    function uefaProfile(label) {
      const cat = Array.from(document.querySelectorAll('.player-profile-category'))
        .find((el) => clean(el.textContent).toLowerCase() === label.toLowerCase());
      const value = cat && (cat.parentElement.querySelector('.player-profile-value') || cat.nextElementSibling);
      return clean(value?.textContent) || null;
    }

    function uefaDob() {
      // Machine-readable first ("2007-05-06"), then the visible "06/5/2007 (19)" as day/month/year.
      let m = micro('birthdate').match(/(\d{4})-(\d{2})-(\d{2})/);
      if (m) return { y: m[1], m: m[2], d: m[3] };
      m = (uefaProfile('Date of birth') || '').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      return m ? { y: m[3], m: pad2(m[2]), d: pad2(m[1]) } : null;
    }

    function uefaGender() {
      try {
        const opts = JSON.parse(document.querySelector('[data-name="related-players"]')?.getAttribute('data-options') || '{}');
        if (/^female$/i.test(opts.gender)) return 'Women';
        if (/^male$/i.test(opts.gender)) return 'Men';
      } catch (e) { /* ignore */ }
      return /women/i.test(location.pathname) ? 'Women' : null;
    }

    function uefaPrepareName() {
      const first = clean(document.querySelector('.player-header__name--first')?.textContent);
      const last = clean(document.querySelector('.player-header__name--last')?.textContent);
      const full = clean(`${first} ${last}`) || micro('name')
        || clean((document.querySelector('meta[property="og:title"]')?.getAttribute('content') || document.title).split('|')[0]);
      const tokens = nameTokens(full, null);
      if (NAME.split === null) {
        // The header separates first and last name — split exactly there.
        const firstLen = first ? first.split(' ').length : 0;
        NAME.split = first && last && firstLen < tokens.length ? firstLen : guessNameSplit(tokens, null);
      }
      return { tokens };
    }

    async function parseUefa() {
      // Parts of the page are rendered client-side; wait for the profile.
      await waitFor(() => document.querySelector('.player-profile-category') || micro('birthdate'), 8000, 150);
      const { tokens } = uefaPrepareName();
      const dob = uefaDob();
      const positionText = uefaProfile('Position') || '';
      const position = mapPositionAny(positionText);
      if (positionText && !position) console.log(`[dc-ogol-fill] unrecognized position "${positionText}"`);
      const h = parseInt(micro('height'), 10); // "0" = not known

      return {
        participantType: 'Player',
        gender: uefaGender(),
        surname: tokens.slice(NAME.split).join(' ') || null,
        firstName: tokens.slice(0, NAME.split).join(' ') || null,
        birthYear: dob ? dob.y : null,
        birthMonth: dob ? dob.m : null,
        birthDay: dob ? dob.d : null,
        country: micro('nationality') || uefaProfile('Country'),
        heightCm: h > 100 ? String(h) : null,
        position,
        sourceUrl: location.origin + location.pathname,
        capturedAt: new Date().toISOString(),
      };
    }

    const uefaPanel = makeSourcePanel('Capture player data for DC (UEFA)', parseUefa);
    waitFor(() => document.querySelector('.player-header__name--last') || micro('name'), 8000, 150).then(() => {
      mountNameSplitWidget(uefaPanel, uefaPrepareName().tokens);
    });
  }

  // =======================================================================
  // PART 1f: runs on Sofascore player pages (football + ice hockey)
  // =======================================================================
  // e.g. /football/player/enzo-fernandez/974505, /ice-hockey/player/.../ID
  // Primary source: Sofascore's own JSON API, same origin as the page
  // (/api/v1/player/{id}): English country name, height, birth timestamp,
  // position code, gender, sport. Fallback: the profile chips in the page
  // header (flag img + country, "17 January 2001 (25)", "Midfielder", "177 cm").
  // Sofascore is a Next.js SPA: after navigating to another player inside
  // the site, reload the page (F5) so the panel picks up the new player.
  if (location.hostname === 'www.sofascore.com' && /\/player\/[^/]+\/\d+/.test(location.pathname)) {
    const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const pad2 = (n) => String(n).padStart(2, '0');
    const EN_MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
    const currentId = () => (location.pathname.match(/\/player\/[^/]+\/(\d+)/) || [])[1];
    const isHockeyUrl = () => /ice-hockey|hokej|eishockey/i.test(location.pathname);

    async function fetchSofaPlayer(id) {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 8000);
        const res = await fetch(`/api/v1/player/${id}`, { credentials: 'include', signal: ctrl.signal });
        clearTimeout(timer);
        if (!res.ok) { console.log('[dc-ogol-fill] Sofascore API status', res.status); return null; }
        return (await res.json()).player || null;
      } catch (e) {
        console.log('[dc-ogol-fill] Sofascore API error', e);
        return null;
      }
    }

    // Header chips: every "img/svg + span" item under the profile card.
    function sofaChips() {
      return Array.from(document.querySelectorAll('.card-component span[class*="textStyle_display.micro"]'))
        .map((span) => ({ span, text: clean(span.textContent), flag: span.parentElement?.querySelector('img[src*="/country/"]') }));
    }

    function domFacts() {
      const chips = sofaChips();
      const countryChip = chips.find((c) => c.flag);
      const dobText = chips.map((c) => c.text).find((t) => /\d{1,2} [A-Za-z]+ \d{4}/.test(t)) || '';
      const heightText = chips.map((c) => c.text).find((t) => /\d{3}\s*cm/.test(t)) || '';
      const positionText = chips.map((c) => c.text).find((t) => mapPositionAny(t)) || '';
      let dob = null;
      const m = dobText.match(/(\d{1,2}) ([A-Za-z]{3})[a-z]* (\d{4})/);
      if (m && EN_MONTHS[m[2].toLowerCase()]) dob = { y: m[3], m: pad2(EN_MONTHS[m[2].toLowerCase()]), d: pad2(m[1]) };
      const alpha2 = countryChip?.flag.getAttribute('alt') || (countryChip?.flag.getAttribute('src').match(/\/country\/([A-Z]{2})\//) || [])[1];
      let countryFromCode = null;
      try { if (alpha2) countryFromCode = new Intl.DisplayNames(['en'], { type: 'region' }).of(alpha2); } catch (e) { /* not ISO */ }
      return {
        name: clean(document.querySelector('.card-component h2')?.textContent) || clean(document.title.split(/[:|-]/)[0]),
        country: countryChip?.text || (countryFromCode !== alpha2 ? countryFromCode : null),
        dob,
        heightCm: (heightText.match(/(\d{3})/) || [])[1] || null,
        positionText,
      };
    }

    // API position codes: G / D / M / F (football), G / D / F, C, LW, RW (hockey).
    function mapSofaPosition(code) {
      const c = String(code || '').toUpperCase();
      if (c === 'G') return 'Goalkeeper';
      if (c === 'D') return 'Defender';
      if (c === 'M') return 'Midfielder';
      if (['F', 'C', 'LW', 'RW', 'W'].includes(c)) return 'Forward';
      return null;
    }

    function sofaPrepareName(api) {
      const dom = domFacts();
      const full = clean(api?.name) || dom.name;
      const tokens = nameTokens(full, null);
      if (NAME.split === null) {
        const first = clean(api?.firstName);
        const firstLen = first ? first.split(' ').length : 0;
        NAME.split = first && api?.lastName && firstLen < tokens.length ? firstLen : guessNameSplit(tokens, null);
      }
      return { tokens };
    }

    let apiPromise = null;
    const getApi = () => (apiPromise = apiPromise || fetchSofaPlayer(currentId()));

    async function parseSofascore() {
      await waitFor(() => document.querySelector('.card-component h2'), 8000, 150);
      const api = await getApi();
      const dom = domFacts();
      const { tokens } = sofaPrepareName(api);

      let dob = dom.dob;
      if (api && Number.isFinite(api.dateOfBirthTimestamp)) {
        const d = new Date(api.dateOfBirthTimestamp * 1000); // midnight UTC
        dob = { y: String(d.getUTCFullYear()), m: pad2(d.getUTCMonth() + 1), d: pad2(d.getUTCDate()) };
      }
      const sportSlug = api?.team?.sport?.slug || (isHockeyUrl() ? 'ice-hockey' : 'football');
      const isHockey = sportSlug === 'ice-hockey';
      const position = mapSofaPosition(api?.position) || mapPositionAny(dom.positionText);
      const height = api?.height > 100 ? String(api.height) : dom.heightCm;
      const gender = api?.gender === 'F' ? 'Women' : (api?.gender === 'M' ? 'Men' : null);
      if (!api) console.log('[dc-ogol-fill] Sofascore: API unavailable — using page data');

      return {
        participantType: 'Player',
        sport: isHockey ? 'Hockey' : undefined,
        gender,
        surname: tokens.slice(NAME.split).join(' ') || null,
        firstName: tokens.slice(0, NAME.split).join(' ') || null,
        birthYear: dob ? dob.y : null,
        birthMonth: dob ? dob.m : null,
        birthDay: dob ? dob.d : null,
        country: clean(api?.country?.name) || dom.country || null,
        heightCm: height || null,
        position,
        sourceUrl: location.origin + location.pathname,
        capturedAt: new Date().toISOString(),
      };
    }

    const sofaPanel = makeSourcePanel('Capture player data for DC (Sofascore)', parseSofascore);
    waitFor(() => document.querySelector('.card-component h2'), 8000, 150).then(async () => {
      const api = await getApi();
      mountNameSplitWidget(sofaPanel, sofaPrepareName(api).tokens);
    });
  }

  // =======================================================================
  // PART 1g: runs on the internal Opta player detail (opta / opta-data.lsoffice.cz)
  // =======================================================================
  // #playerHeaderDiv rows (the .col-6 cells):
  //   "G. Varela"                                  display name (+ Career Stats link)
  //   "Defender, CR Flamengo"                      position, club
  //   "Varela Olivera Guillermo, Uruguay"          SURNAME(S) FIRST NAME(S), country
  //   "Born: 1993-03-24, Montevideo, Uruguay"
  //   "Gender: Male | Height: 173 cm | Weight: 73 kg | Foot: right"
  // The match block title "Player Match Stats of Guillermo Varela Olivera"
  // gives the same name in first-name-first order, which tells exactly where
  // the surname ends. Without it, the display name initial ("G.") is used.
  if (/^opta(-data)?\.lsoffice\.cz$/.test(location.hostname) && location.pathname.includes('opta-player-detail')) {
    const clean = (s) => (s || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
    const normTokens = (s) => clean(s).split(' ').filter(Boolean).map(normTok);

    function optaCells() {
      return Array.from(document.querySelectorAll('#playerHeaderDiv .row > .col-6'))
        .map((el) => clean(el.textContent)).filter(Boolean);
    }

    function optaHeader() {
      const cells = optaCells();
      const bornCell = cells.find((c) => /^Born:/i.test(c)) || '';
      const genderCell = cells.find((c) => /Gender:/i.test(c)) || '';
      const rest = cells.filter((c) => c !== bornCell && c !== genderCell);
      const displayName = clean((rest[0] || '').replace(/Career Stats.*$/i, ''));
      const posCell = rest[1] || '';
      const nameCell = rest[2] || '';
      const cut = nameCell.lastIndexOf(',');
      return {
        displayName,
        positionText: clean(posCell.split(',')[0]),
        nameLastFirst: clean(cut >= 0 ? nameCell.slice(0, cut) : nameCell),
        country: cut >= 0 ? clean(nameCell.slice(cut + 1)) : null,
        bornCell,
        genderCell,
      };
    }

    // "Varela Olivera Guillermo" -> { first: ["Guillermo"], last: ["Varela","Olivera"] }
    function optaSplitName(h) {
      const lf = clean(h.nameLastFirst).split(' ').filter(Boolean);
      if (lf.length < 2) return { first: [], last: lf };
      const lfNorm = lf.map(normTok);
      // 1) Match title "Player Match Stats of <First Last>": find the rotation.
      const title = clean(document.querySelector('#playerMatchRecordDiv .col-6')?.childNodes[0]?.textContent);
      const titleName = (title.match(/Player Match Stats of (.+)$/i) || [])[1];
      if (titleName) {
        const t = normTokens(titleName);
        for (let k = 1; k < lf.length; k++) {
          const rotated = [...lfNorm.slice(k), ...lfNorm.slice(0, k)];
          if (rotated.join(' ') === t.join(' ')) return { first: lf.slice(k), last: lf.slice(0, k) };
        }
      }
      // 2) Display name "G. Varela": surname starts the string, the first name
      //    starts with the initial — take the last token(s) from that initial on.
      const dm = h.displayName.match(/^([A-Za-zÀ-ž])\.\s*(.+)$/);
      if (dm) {
        const initial = normTok(dm[1]);
        for (let k = 1; k < lf.length; k++) {
          if (lfNorm[k].startsWith(initial)) return { first: lf.slice(k), last: lf.slice(0, k) };
        }
      }
      // 3) Fallback: last token is the first name.
      return { first: lf.slice(-1), last: lf.slice(0, -1) };
    }

    function optaPrepareName() {
      const { first, last } = optaSplitName(optaHeader());
      const tokens = [...first, ...last];
      if (NAME.split === null) NAME.split = first.length;
      return { tokens };
    }

    function parseOpta() {
      const h = optaHeader();
      const { tokens } = optaPrepareName();
      const dm = h.bornCell.match(/(\d{4})-(\d{2})-(\d{2})/);
      const gender = (h.genderCell.match(/Gender:\s*(\w+)/i) || [])[1] || '';
      const height = (h.genderCell.match(/Height:\s*(\d{3})\s*cm/i) || [])[1] || null;
      const position = mapPositionAny(h.positionText);
      if (h.positionText && !position) console.log(`[dc-ogol-fill] unrecognized position "${h.positionText}"`);

      return {
        participantType: 'Player',
        gender: /^female$/i.test(gender) ? 'Women' : (/^male$/i.test(gender) ? 'Men' : null),
        surname: tokens.slice(NAME.split).join(' ') || null,
        firstName: tokens.slice(0, NAME.split).join(' ') || null,
        birthYear: dm ? dm[1] : null,
        birthMonth: dm ? dm[2] : null,
        birthDay: dm ? dm[3] : null,
        country: h.country,
        heightCm: height,
        position,
        // keep the player id, drop the match id
        sourceUrl: `${location.origin}${location.pathname}?optaPlayerId=${new URLSearchParams(location.search).get('optaPlayerId') || ''}`,
        capturedAt: new Date().toISOString(),
      };
    }

    const optaPanel = makeSourcePanel('Capture player data for DC (Opta)', parseOpta);
    waitFor(() => optaHeader().nameLastFirst, 5000, 100).then(() => {
      mountNameSplitWidget(optaPanel, optaPrepareName().tokens);
    });
  }

  // =======================================================================
  // PART 1h: runs on Baseball-Reference player pages (baseball)
  // =======================================================================
  // e.g. /players/t/teixema01.shtml — #meta block:
  //   h1 span "Mark Teixeira", "Position: First Baseman",
  //   "6-3, 225lb (190cm, 102kg)", span#necro-birth[data-birth="1980-04-11"],
  //   flags as <span class="f-i f-us">us</span> (birthplace, National Team),
  //   "Full Name: Mark Charles Teixeira".
  if (location.hostname === 'www.baseball-reference.com' && /^\/players\/[a-z]\/[^/]+\.shtml/.test(location.pathname)) {
    const clean = (s) => (s || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();

    // Text after a <strong>Label:</strong> inside #meta paragraphs.
    function brFact(label) {
      const strong = Array.from(document.querySelectorAll('#meta p strong'))
        .find((s) => clean(s.textContent).replace(/:$/, '').toLowerCase() === label.toLowerCase());
      if (!strong) return null;
      const p = strong.closest('p');
      return clean(p.textContent.slice(p.textContent.indexOf(strong.textContent) + strong.textContent.length)).replace(/^:\s*/, '');
    }

    // Country from the flag code: National Team first, then birthplace.
    function brCountry() {
      const paras = Array.from(document.querySelectorAll('#meta p'));
      const natP = paras.find((p) => /National Team/i.test(p.querySelector('strong')?.textContent || ''));
      const bornP = document.querySelector('#necro-birth')?.closest('p');
      const flag = natP?.querySelector('span.f-i') || bornP?.querySelector('span.f-i');
      const code = flag ? (Array.from(flag.classList).find((c) => /^f-[a-z]{2}$/.test(c)) || '').slice(2) : '';
      if (!code) return null;
      try {
        const name = new Intl.DisplayNames(['en'], { type: 'region' }).of(code.toUpperCase());
        return name && name !== code.toUpperCase() ? name : null;
      } catch (e) { return null; }
    }

    // B-R position(s) -> DC participant types. DC uses a group type plus the
    // specific one for infield/outfield:
    //   Pitcher | Catcher | Designated Hitter
    //   Infielder + First baseman / Second baseman / Third baseman / Shortstop
    //   Outfielder + Left fielder / Center fielder / Right fielder
    // "Shortstop, Second Baseman and Third Baseman" ->
    //   [Infielder, Shortstop, Second baseman, Third baseman]
    const BASEBALL_POSITIONS = [
      [/pitcher/, null, 'Pitcher'],
      [/catcher/, null, 'Catcher'],
      [/designated hitter/, null, 'Designated Hitter'],
      [/first base/, 'Infielder', 'First baseman'],
      [/second base/, 'Infielder', 'Second baseman'],
      [/third base/, 'Infielder', 'Third baseman'],
      [/shortstop/, 'Infielder', 'Shortstop'],
      [/infield/, 'Infielder', null],
      [/left ?field/, 'Outfielder', 'Left fielder'],
      [/cent(er|re) ?field/, 'Outfielder', 'Center fielder'],
      [/right ?field/, 'Outfielder', 'Right fielder'],
      [/outfield/, 'Outfielder', null],
    ];

    function mapBaseballPositions(text) {
      const out = [];
      const add = (p) => { if (p && !out.includes(p)) out.push(p); };
      for (const part of (text || '').toLowerCase().split(/,|\band\b|\//).map((x) => x.trim()).filter(Boolean)) {
        const hit = BASEBALL_POSITIONS.find(([re]) => re.test(part));
        if (hit) { add(hit[1]); add(hit[2]); }
      }
      return out;
    }

    // Full name "Mark Charles Teixeira" split right before the surname of
    // the display name "Mark Teixeira" (everything after its first word).
    function brPrepareName() {
      const display = clean(document.querySelector('#meta h1 span')?.textContent || document.querySelector('#meta h1')?.textContent);
      const full = brFact('Full Name') || display;
      const tokens = nameTokens(full, null);
      if (NAME.split === null) {
        const dispTok = display.split(' ').filter(Boolean);
        const lastTok = dispTok.slice(1).map(normTok);
        const norm = tokens.map(normTok);
        let split = null;
        if (lastTok.length) {
          for (let i = 1; i <= norm.length - lastTok.length; i++) {
            if (lastTok.every((t, k) => norm[i + k] === t)) { split = i; break; }
          }
        }
        NAME.split = split ?? guessNameSplit(tokens, null);
      }
      return { tokens };
    }

    function parseBaseballRef() {
      const { tokens } = brPrepareName();
      const birth = document.querySelector('#necro-birth')?.getAttribute('data-birth') || '';
      const dm = birth.match(/(\d{4})-(\d{2})-(\d{2})/);
      const metaText = clean(document.querySelector('#meta')?.textContent);
      const cm = (metaText.match(/\((\d{3})\s*cm/) || [])[1] || null;
      const positionText = brFact('Position') || brFact('Positions') || '';
      const positions = mapBaseballPositions(positionText);
      if (positionText && !positions.length) console.log(`[dc-ogol-fill] unrecognized position "${positionText}"`);

      return {
        participantType: 'Player',
        sport: 'Baseball',
        surname: tokens.slice(NAME.split).join(' ') || null,
        firstName: tokens.slice(0, NAME.split).join(' ') || null,
        birthYear: dm ? dm[1] : null,
        birthMonth: dm ? dm[2] : null,
        birthDay: dm ? dm[3] : null,
        country: brCountry(),
        heightCm: cm,
        position: positions[0] || null,
        positions,
        sourceUrl: location.origin + location.pathname,
        capturedAt: new Date().toISOString(),
      };
    }

    const brPanel = makeSourcePanel('Capture player data for DC (Baseball-Reference)', parseBaseballRef);
    mountNameSplitWidget(brPanel, brPrepareName().tokens);
  }

  // =======================================================================
  // PART 1i: runs on Soccerdonna player pages (women's football)
  // =======================================================================
  // e.g. /en/olivia-wingate/profil/spieler_82410.html (also /de/...).
  // Header h1 "29 Olivia Wingate" (shirt number first); profile table
  // .tabelle_spieler with label/value rows: Date of birth "20.02.2000",
  // Name in native country "Olivia Ann Wingate", Height "1,70",
  // Nationality (flag img title + text), Position "Striker - Left Wing".
  // Soccerdonna is Transfermarkt's women's site: flag image IDs are the same,
  // so the TM flag cache (ID -> English name) translates /de/ pages too.
  // Gender is always Women.
  if (location.hostname.endsWith('soccerdonna.de') && /\/profil\/spieler_\d+/.test(location.pathname)) {
    const clean = (s) => (s || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
    const pad2 = (n) => String(n).padStart(2, '0');
    const isEnglish = location.pathname.startsWith('/en/');
    const SD_LABELS = {
      born: ['Date of birth', 'Geburtsdatum'],
      nativeName: ['Name in native country', 'Name im Heimatland', 'Vollständiger Name', 'Full name'],
      height: ['Height', 'Größe'],
      nationality: ['Nationality', 'Nationalität'],
      position: ['Position'],
    };
    const FLAG_CACHE_KEY = 'dcTmFlagNames'; // shared with the Transfermarkt part

    function sdRow(labels) {
      const wanted = labels.map((l) => l.toLowerCase());
      const row = Array.from(document.querySelectorAll('table.tabelle_spieler tr')).find((tr) => {
        const first = tr.querySelector('td');
        return first && wanted.includes(clean(first.textContent).replace(/:$/, '').toLowerCase());
      });
      const cell = row?.querySelectorAll('td')[1];
      return cell ? { cell, text: clean(cell.textContent) } : null;
    }

    const flagId = (img) => ((img?.getAttribute('src') || '').match(/\/flaggen\/(\d+)\./) || [])[1] || null;
    const loadFlagCache = () => { try { return JSON.parse(GM_getValue(FLAG_CACHE_KEY, '{}')) || {}; } catch (e) { return {}; } };

    // Nationality flag in a document: { id, title }.
    function sdNationalityFlag(doc) {
      const wanted = SD_LABELS.nationality.map((l) => l.toLowerCase());
      const row = Array.from(doc.querySelectorAll('table.tabelle_spieler tr')).find((tr) => {
        const first = tr.querySelector('td');
        return first && wanted.includes(clean(first.textContent).replace(/:$/, '').toLowerCase());
      });
      const cell = row?.querySelectorAll('td')[1];
      const img = cell?.querySelector('img[title]');
      return { id: flagId(img), title: clean(img?.getAttribute('title')) || clean(cell?.textContent) || null };
    }

    function learnFlag(id, englishTitle) {
      if (!id || !englishTitle) return;
      const cache = loadFlagCache();
      if (cache[id] !== englishTitle) {
        cache[id] = englishTitle;
        GM_setValue(FLAG_CACHE_KEY, JSON.stringify(cache));
      }
    }

    // Same page in English (/de/... -> /en/...), same origin.
    async function fetchEnglishDoc() {
      const enPath = location.pathname.replace(/^\/[a-z]{2}\//, '/en/');
      try {
        const res = await fetch(enPath, { credentials: 'include' });
        if (!res.ok) { console.log('[dc-ogol-fill] Soccerdonna EN page status', res.status); return null; }
        return new DOMParser().parseFromString(await res.text(), 'text/html');
      } catch (e) {
        console.log('[dc-ogol-fill] Soccerdonna EN page error', e);
        return null;
      }
    }

    // English country name: this page if it's /en/, else the flag cache,
    // else the /en/ version of the page; the local (German) name is last resort.
    async function sdCountry() {
      const local = sdNationalityFlag(document);
      if (isEnglish) { learnFlag(local.id, local.title); return local.title; }
      const cached = local.id && loadFlagCache()[local.id];
      if (cached) return cached;
      const enDoc = await fetchEnglishDoc();
      const en = enDoc ? sdNationalityFlag(enDoc) : null;
      if (en?.title) { learnFlag(en.id || local.id, en.title); return en.title; }
      console.log(`[dc-ogol-fill] country "${local.title}" not translated — check it in DC`);
      return local.title;
    }

    function sdPrepareName() {
      const display = clean(document.querySelector('h1')?.textContent).replace(/^\d+\s+/, ''); // "29 Olivia Wingate"
      const full = sdRow(SD_LABELS.nativeName)?.text || display;
      const tokens = nameTokens(full, null);
      if (NAME.split === null) {
        // Split before the surname of the display name (everything after its first word).
        const lastTok = display.split(' ').filter(Boolean).slice(1).map(normTok);
        const norm = tokens.map(normTok);
        let split = null;
        if (lastTok.length) {
          for (let i = 1; i <= norm.length - lastTok.length; i++) {
            if (lastTok.every((t, k) => norm[i + k] === t)) { split = i; break; }
          }
        }
        NAME.split = split ?? guessNameSplit(tokens, null);
      }
      return { tokens };
    }

    async function parseSoccerdonna() {
      const { tokens } = sdPrepareName();
      const dm = (sdRow(SD_LABELS.born)?.text || '').match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
      const hm = (sdRow(SD_LABELS.height)?.text || '').match(/(\d)[,.](\d{2})/);
      // "Striker - Left Wing" -> main position "Striker"
      const positionText = sdRow(SD_LABELS.position)?.text || '';
      const position = mapPositionAny(positionText.split(' - ')[0]) || mapPositionAny(positionText);
      if (positionText && !position) console.log(`[dc-ogol-fill] unrecognized position "${positionText}"`);

      return {
        participantType: 'Player',
        gender: 'Women',
        surname: tokens.slice(NAME.split).join(' ') || null,
        firstName: tokens.slice(0, NAME.split).join(' ') || null,
        birthYear: dm ? dm[3] : null,
        birthMonth: dm ? pad2(dm[2]) : null,
        birthDay: dm ? pad2(dm[1]) : null,
        country: await sdCountry(),
        heightCm: hm ? String(Math.round(parseFloat(`${hm[1]}.${hm[2]}`) * 100)) : null,
        position,
        sourceUrl: location.origin + location.pathname,
        capturedAt: new Date().toISOString(),
      };
    }

    const sdPanel = makeSourcePanel('Capture player data for DC (Soccerdonna)', parseSoccerdonna);
    mountNameSplitWidget(sdPanel, sdPrepareName().tokens);
  }

  // =======================================================================
  // PART 1j: runs on BeSoccer player pages (football)
  // =======================================================================
  // e.g. /player/w-saliba-726141 — #mod_player_stats panel:
  //   h2.panel-title "W. Saliba" (short), .panel-subtitle "William Alain André Gabriel Saliba"
  //   .stat blocks, identified by their unit labels (layout varies):
  //     "years" block: age + flag + country name ("France")
  //     "kgs" block:   weight + role badge (.bg-role.rol1-4, "GK/DEF/MID/FWD") + "position"
  //     "cms" block:   height ("192" or "-")
  //   "Born on 24 March 2001 in Bondy"
  if (location.hostname === 'www.besoccer.com' && /^\/player\//.test(location.pathname)) {
    const clean = (s) => (s || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
    const pad2 = (n) => String(n).padStart(2, '0');
    const EN_MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
    const panel = () => document.querySelector('#mod_player_stats') || document;

    // The .stat block whose small-row labels include the given unit.
    function bsStat(unit) {
      return Array.from(panel().querySelectorAll('.stat')).find((st) =>
        Array.from(st.querySelectorAll('.small-row')).some((r) => clean(r.textContent).toLowerCase() === unit));
    }

    function bsCountry() {
      const st = bsStat('years');
      if (st) {
        const rows = Array.from(st.querySelectorAll('.small-row')).map((r) => clean(r.textContent)).filter((t) => t && t.toLowerCase() !== 'years');
        if (rows.length) return rows[rows.length - 1];
      }
      // Fallback: "Nationality" / "Country of birth" rows.
      const row = Array.from(panel().querySelectorAll('.table-row')).find((r) =>
        /^(nationality|country of birth)$/i.test(clean(r.firstElementChild?.textContent)));
      return clean(row?.querySelector('img[alt]')?.getAttribute('alt')) || clean(row?.lastElementChild?.textContent) || null;
    }

    // Role badge: class rol1..rol4 or its text (GK/POR, DEF, MID, FWD/ATT/DEL).
    function bsPosition() {
      const badge = panel().querySelector('.bg-role');
      const cls = (badge?.className.match(/\brol(\d)\b/) || [])[1];
      const byClass = { 1: 'Goalkeeper', 2: 'Defender', 3: 'Midfielder', 4: 'Forward' }[cls];
      if (byClass) return byClass;
      const t = clean(badge?.textContent).toUpperCase();
      if (/^(GK|POR)$/.test(t)) return 'Goalkeeper';
      if (/^DEF$/.test(t)) return 'Defender';
      if (/^(MID|MED)$/.test(t)) return 'Midfielder';
      if (/^(FWD|ATT|DEL|FOR)$/.test(t)) return 'Forward';
      return null;
    }

    function bsHeight() {
      const big = clean(bsStat('cms')?.querySelector('.big-row')?.textContent);
      return /^\d{3}$/.test(big) ? big : null;
    }

    function bsDob() {
      const p = Array.from(panel().querySelectorAll('p')).map((x) => clean(x.textContent)).find((t) => /^Born on/i.test(t)) || '';
      const m = p.match(/(\d{1,2}) ([A-Za-z]{3})[a-z]* (\d{4})/);
      if (!m || !EN_MONTHS[m[2].toLowerCase()]) return null;
      const dob = { y: m[3], m: pad2(EN_MONTHS[m[2].toLowerCase()]), d: pad2(m[1]) };
      return dob;
    }

    // Full name "William Alain André Gabriel Saliba" split before the surname
    // of the short title "W. Saliba" (or everything after the first word).
    function bsPrepareName() {
      const short = clean(panel().querySelector('.panel-title')?.textContent);
      const full = clean(panel().querySelector('.panel-subtitle')?.textContent) || short;
      const tokens = nameTokens(full, null);
      if (NAME.split === null) {
        const shortTok = short.split(' ').filter(Boolean);
        const lastTok = (/^[^\s.]{1,3}\.$/.test(shortTok[0] || '') ? shortTok.slice(1) : shortTok.slice(1)).map(normTok);
        const norm = tokens.map(normTok);
        let split = null;
        if (lastTok.length) {
          for (let i = 1; i <= norm.length - lastTok.length; i++) {
            if (lastTok.every((t, k) => norm[i + k] === t)) { split = i; break; }
          }
        }
        NAME.split = split ?? guessNameSplit(tokens, null);
      }
      return { tokens };
    }

    async function parseBeSoccer() {
      await waitFor(() => panel().querySelector('.panel-title'), 5000, 100);
      const { tokens } = bsPrepareName();
      const dob = bsDob();
      return {
        participantType: 'Player',
        surname: tokens.slice(NAME.split).join(' ') || null,
        firstName: tokens.slice(0, NAME.split).join(' ') || null,
        birthYear: dob ? dob.y : null,
        birthMonth: dob ? dob.m : null,
        birthDay: dob ? dob.d : null,
        country: bsCountry(),
        heightCm: bsHeight(),
        position: bsPosition(),
        sourceUrl: location.origin + location.pathname,
        capturedAt: new Date().toISOString(),
      };
    }

    const bsPanel = makeSourcePanel('Capture player data for DC (BeSoccer)', parseBeSoccer);
    waitFor(() => panel().querySelector('.panel-title'), 5000, 100).then(() => {
      mountNameSplitWidget(bsPanel, bsPrepareName().tokens);
    });
  }

  // =======================================================================
  // PART 2: runs on the DC "new participant" page — fills the form
  // =======================================================================
  if (location.hostname.includes('dc.livesport.eu')
      && location.pathname.startsWith('/jsx/data/participant/detail/new')) {
    function stripDiacritics(str) {
      return (str || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
    }

    function setNativeValue(el, value) {
      const proto = el instanceof HTMLTextAreaElement
        ? window.HTMLTextAreaElement.prototype
        : window.HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
      setter.call(el, value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function setSelectValue(selectEl, valueOrLabel) {
      const opt = Array.from(selectEl.options).find(
        (o) => o.value === valueOrLabel || o.textContent.trim() === valueOrLabel
      );
      if (!opt) { log(`Select option not found: ${valueOrLabel}`); return false; }
      selectEl.value = opt.value;
      selectEl.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }

    function fireMouseEvent(el, type) {
      el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true }));
    }

    // Single attempt at opening a react-select and picking an option.
    // Returns false (without logging) on failure so the retrying wrapper
    // below can decide whether to log/retry.
    async function setReactSelectAttempt(container, text) {
      const control = container.querySelector('.react-select__control');
      if (!control) return false;

      fireMouseEvent(control, 'mousedown');
      fireMouseEvent(control, 'mouseup');
      control.click();
      await sleep(100);

      const input = await waitFor(() => container.querySelector('input.react-select__input'));
      if (!input) return false;
      input.focus();
      setNativeValue(input, text);

      const menu = await waitFor(() => document.querySelector('.react-select__menu'), 2000);
      if (!menu) return false;

      const match = await waitFor(() => {
        const options = Array.from(menu.querySelectorAll('.react-select__option'));
        return options.find((o) => o.textContent.trim().toLowerCase() === text.toLowerCase())
          || options.find((o) => o.textContent.trim().toLowerCase().includes(text.toLowerCase()));
      }, 1500);
      if (!match) return false;

      fireMouseEvent(match, 'mousedown');
      fireMouseEvent(match, 'mouseup');
      match.click();
      await sleep(150);
      return true;
    }

    // Right after the "new participant" page mounts, the very first
    // react-select (usually Sport, especially on auto-run) can be a bit
    // laggy — the control exists but the menu doesn't open on the first
    // click yet. Retry once after a short pause before giving up.
    async function setReactSelect(container, text) {
      const control = container.querySelector('.react-select__control');
      if (!control) { log('react-select control not found'); return false; }

      let ok = await setReactSelectAttempt(container, text);
      if (!ok) {
        await sleep(400);
        ok = await setReactSelectAttempt(container, text);
      }
      if (!ok) {
        log(`react-select: could not select "${text}" after retry.`);
      }
      return ok;
    }

    // Opens a react-select WITHOUT typing a filter (so the full,
    // unfiltered option list shows up) and tries a list of candidate
    // labels in order. Use this when we're not 100% sure what the exact
    // label is called in DC (e.g. "Soccer" vs "Football"). On failure it
    // logs every option it actually saw, for easy diagnosis.
    // Opens a react-select, waits for its OPTIONS (not just the menu) to
    // actually render — some lists (like Sport) load asynchronously right
    // after the page mounts, so the menu can appear empty for a moment —
    // and tries a list of candidate labels. Retries a few times with
    // growing backoff if the list simply isn't populated yet; only gives
    // up early if options ARE loaded but none of them match. Logs every
    // option it actually saw on final failure, for easy diagnosis.
    async function setReactSelectFromCandidates(container, candidates, maxAttempts = 4) {
      const control = container.querySelector('.react-select__control');
      if (!control) { log('react-select control not found'); return false; }

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        fireMouseEvent(control, 'mousedown');
        fireMouseEvent(control, 'mouseup');
        control.click();

        const menu = await waitFor(() => document.querySelector('.react-select__menu'), 2000);
        let options = [];
        if (menu) {
          options = await waitFor(() => {
            const opts = Array.from(menu.querySelectorAll('.react-select__option'));
            return opts.length > 0 ? opts : null;
          }, 1500) || [];
        }

        if (options.length > 0) {
          let match = null;
          for (const cand of candidates) {
            match = options.find((o) => o.textContent.trim().toLowerCase() === cand.toLowerCase());
            if (match) break;
          }
          if (!match) {
            for (const cand of candidates) {
              match = options.find((o) => o.textContent.trim().toLowerCase().includes(cand.toLowerCase()));
              if (match) break;
            }
          }
          if (match) {
            fireMouseEvent(match, 'mousedown');
            fireMouseEvent(match, 'mouseup');
            match.click();
            await sleep(150);
            return true;
          }
          const allOpts = options.map((o) => o.textContent.trim());
          log(`None of [${candidates.join(', ')}] found in the list. Available options: ${allOpts.join(', ')}`);
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
          return false; // real mismatch, not a timing issue — no point retrying
        }

        // Menu didn't open, or opened with no options yet (still loading).
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        if (attempt < maxAttempts) {
          log(`Sport/options list not ready yet (attempt ${attempt}/${maxAttempts}), retrying...`);
          await sleep(500 * attempt);
        }
      }

      log('react-select menu never showed any options — giving up. Please select it manually.');
      return false;
    }

    function clickAddNewItem(fieldTestId) {
      const field = document.querySelector(`[data-test-id="${fieldTestId}"]`);
      if (!field) { log(`Field container not found: ${fieldTestId}`); return null; }
      const addIcon = field.querySelector('[data-test-id$="-add-new-ref-icon"]');
      if (!addIcon) { log(`Add-new-item icon not found in ${fieldTestId}`); return null; }
      addIcon.click();
      return field;
    }

    function formatDate(y, m, d) {
      if (!y) return '';
      if (CONFIG.dateFormat === 'mm/dd/yyyy') return `${m}/${d}/${y}`;
      return `${d}.${m}.${y}`; // dd.mm.yyyy default
    }

    // Polls for the form's Sport select to exist, i.e. the React app has
    // finished mounting the "new participant" page.
    async function waitForFormReady(timeoutMs = 15000) {
      return waitFor(
        () => document.querySelector('[data-test-id="jonas-attr-select-sport-container"] .react-select__control'),
        timeoutMs,
        200
      );
    }

    async function fillForm(data) {
      const mainType = data.participantType === 'Coach' ? 'Coach' : 'Player';

      // Sources set data.sport ('Hockey' from EliteProspects); default is soccer.
      const SPORT_CANDIDATES = { Hockey: ['Hockey', 'Ice Hockey'], Baseball: ['Baseball'] };
      const sportCandidates = SPORT_CANDIDATES[data.sport] || ['Soccer'];
      log(`Setting Sport = ${sportCandidates[0]}...`);
      const sportField = document.querySelector('[data-test-id="jonas-field-participant-participantHasSport"]');
      const sportSelectContainer = sportField?.querySelector('[data-test-id="jonas-attr-select-sport-container"]');
      if (sportSelectContainer) {
        const sportOk = await setReactSelectFromCandidates(sportSelectContainer, sportCandidates);
        if (!sportOk) log('Could not set Sport automatically — please pick it manually from the dropdown.');
      } else {
        log('Sport field container not found.');
      }
      await sleep(200);

      log(`Setting Participant type = ${mainType}...`);
      const typeFieldForPlayer = document.querySelector('[data-test-id="jonas-field-participant-participantHasParticipantTypes"]');
      const firstTypeRow = typeFieldForPlayer?.querySelector('[data-test-id="jonas-attr-relation-participantType-container"]');
      if (firstTypeRow) await setReactSelect(firstTypeRow, mainType);
      await sleep(200);

      // One participant-type row per position. Most sources give a single
      // position; baseball gives a group + specific ones
      // (e.g. Infielder + First baseman + Third baseman).
      const positions = (Array.isArray(data.positions) && data.positions.length) ? data.positions
        : (data.position ? [data.position] : []);
      if (mainType === 'Player' && positions.length) {
        for (const pos of positions) {
          log(`Adding participant type row for position: ${pos}`);
          const typeField = clickAddNewItem('jonas-field-participant-participantHasParticipantTypes');
          await sleep(300);
          if (typeField) {
            const rows = typeField.querySelectorAll('[data-test-id="jonas-attr-relation-participantType-container"]');
            const newRowContainer = rows[rows.length - 1];
            if (newRowContainer) await setReactSelect(newRowContainer, pos);
          }
          await sleep(200);
        }
      } else if (mainType === 'Player') {
        log('No recognizable position found — skipping.');
      } else {
        log('Coach — skipping position row.');
      }
      await sleep(200);

      if (data.country) {
        log(`Setting Country = ${data.country}...`);
        const countryField = document.querySelector('[data-test-id="jonas-field-participant-participantHasCountries"]');
        const countrySelectContainer = countryField?.querySelector('[data-test-id="jonas-attr-select-country-container"]');
        if (countrySelectContainer) {
          // Try the DC alias first, then the name exactly as the source had it.
          const countryCandidates = [...new Set([toDcCountry(data.country), data.country])];
          let countryOk = false;
          for (const c of countryCandidates) {
            if (c !== data.country || countryCandidates.length === 1) log(`  trying "${c}"`);
            countryOk = await setReactSelect(countrySelectContainer, c);
            if (countryOk) break;
          }
          if (!countryOk) log(`Country "${data.country}" not found in DC — add it to DC_COUNTRY_ALIASES.`);
        }
      }
      await sleep(200);

      const getPropsBlock = () => document.querySelector('[data-test-id="jonas-field-participant-propertyData"]');
      if (getPropsBlock()) {
        // Manual rules: one surname + one first name, the rest in Full Name;
        // ß/Þ/ð replacements, no Arabic hyphens, no patronymics.
        const names = finalizeNames(data);
        data = { ...data, surname: names.surname, firstName: names.firstName };
        if (data.surname) {
          const surnameClean = stripDiacritics(data.surname);
          log(`Setting Surname = ${surnameClean}`);
          const surnameInput = getPropsBlock().querySelector('input[id$="_p_9_name_data_name_0"]');
          if (surnameInput) setNativeValue(surnameInput, surnameClean);
        }
        await sleep(500);

        if (data.firstName) {
          const firstNameClean = stripDiacritics(data.firstName);
          log(`Setting First Name = ${firstNameClean}`);
          const firstNameInput = getPropsBlock()?.querySelector('input[id$="_p_8_name_data_name_0"]');
          if (firstNameInput) setNativeValue(firstNameInput, firstNameClean);
          else log('First Name input not found.');
        }
        await sleep(500);

        // Full Name (DC regenerates it from Surname + First Name, so set it after).
        if (names.fullName) {
          const fullClean = stripDiacritics(names.fullName);
          log(`Setting Full Name = ${fullClean}`);
          const fullInput = getPropsBlock()?.querySelector('input[id$="_p_1_name_data_name_0"]');
          if (fullInput) setNativeValue(fullInput, fullClean);
          else log('Full Name input not found.');
          await sleep(500);
        }

        // Asian players: Short Name = Full Name only after the user confirms
        // (nationality alone isn't enough — e.g. Hong Kong: "Chun-Lok Tan" yes,
        // "Raphaël Merkies" no). The panel shows a hint + button.
        if (names.isAsian) log(`${toDcCountry(data.country)} — if the name is Asian, use "Copy Full Name → Short Name" in this panel.`);

        // Sources set data.gender only when they know it (worldfootball,
        // EliteProspects "(W)" leagues); otherwise the default applies.
        const gender = data.gender || CONFIG.defaultGender;
        log(`Setting Gender = ${gender}${data.gender ? '' : ' (default)'}`);
        const genderSelect = getPropsBlock()?.querySelector('select[id$="_poa_2_i"]');
        if (genderSelect) {
          const candidates = [gender];
          if (!candidates.some((g) => setSelectValue(genderSelect, g))) {
            log(`Gender "${gender}" not found. Options: ${Array.from(genderSelect.options).map((o) => o.textContent.trim()).join(', ')}`);
          }
        } else log('Gender select not found.');
        await sleep(500);

        if (data.birthYear) {
          const dateStr = formatDate(data.birthYear, data.birthMonth, data.birthDay);
          log(`Setting Birthday = ${dateStr} (adjust CONFIG.dateFormat if this looks wrong)`);
          const birthdayInput = getPropsBlock()?.querySelector('input[id$="_cal_10_dp"]');
          if (birthdayInput) {
            setNativeValue(birthdayInput, dateStr);
            if (isJan1(data)) {
              birthdayInput.style.outline = '3px solid #f5a623';
              birthdayInput.style.outlineOffset = '1px';
              birthdayInput.title = 'Birth date is 1 January — verify it (often a placeholder when only the year is known)';
              log(jan1Message(data));
            }
          }
          else log('Birthday input not found.');
        }
        await sleep(500);

        if (data.heightCm) {
          log(`Setting Height [cm] = ${data.heightCm}`);
          const heightInput = getPropsBlock()?.querySelector('input[id$="_poa_11_i"]');
          if (heightInput) setNativeValue(heightInput, data.heightCm);
          else log('Height input not found.');
        }
      } else {
        log('Properties block not found.');
      }

      log('Done. Nothing was saved — review the form before clicking Save.');
    }

    GM_addStyle(`
      #dc-ogol-panel {
        position: fixed; top: 80px; right: 20px; z-index: 99999;
        background: #002a3a; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px;
        padding: 14px; width: 320px; box-shadow: 0 6px 24px rgba(0,0,0,.4);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 12px; color: #FFFFFF;
      }
      #dc-ogol-panel .dc-ogol-title {
        font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
        color: #8a9ba3; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;
      }
      #dc-ogol-panel .dc-ogol-title .dot { width: 6px; height: 6px; border-radius: 50%; background: #FF0046; display: inline-block; }
      #dc-ogol-panel button {
        width: 100%; padding: 9px; cursor: pointer; margin-bottom: 8px;
        border: none; border-radius: 6px; font-weight: 700; font-size: 11px;
        text-transform: uppercase; letter-spacing: 0.04em;
        transition: background .15s ease, transform .1s ease;
      }
      #dc-ogol-panel button:active { transform: scale(0.98); }
      #dc-ogol-panel button.primary { background: #FF0046; color: #FFFFFF; }
      #dc-ogol-panel button.primary:hover { background: #ff2d63; }
      #dc-ogol-panel button.secondary { background: rgba(255,255,255,0.08); color: #c8d6dc; }
      #dc-ogol-panel button.secondary:hover { background: rgba(255,255,255,0.14); }
      #dc-ogol-status {
        margin-bottom: 10px; color: #8a9ba3; line-height: 1.5;
        background: rgba(255,255,255,0.03); border-radius: 6px; padding: 8px 10px;
        border: 1px solid rgba(255,255,255,0.05);
      }
      #dc-ogol-date-warning {
        display: none; margin-bottom: 10px; padding: 8px 10px; border-radius: 6px;
        background: #f5a623; color: #1a1a1a; font-weight: 600; line-height: 1.4;
      }
      #dc-ogol-asian-hint {
        display: none; margin-bottom: 8px; padding: 8px 10px; border-radius: 6px;
        background: #1f5fa8; color: #FFFFFF; line-height: 1.4;
      }
      #dc-ogol-panel hr { margin: 10px 0; border: none; border-top: 1px solid rgba(255,255,255,0.08); }
      #dc-ogol-panel label.dc-ogol-label { display: block; margin-bottom: 6px; color: #8a9ba3; }
      #dc-ogol-panel input[type="text"] {
        width: 100%; box-sizing: border-box; padding: 8px; margin-bottom: 8px;
        background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
        border-radius: 6px; color: #FFFFFF; font-size: 12px;
      }
      #dc-ogol-panel input[type="text"]::placeholder { color: #5a6c73; }
      #dc-ogol-panel input[type="text"]:focus { outline: none; border-color: #FF0046; }
      #dc-ogol-log {
        max-height: 150px; overflow-y: auto; margin-top: 6px; white-space: pre-wrap;
        color: #8a9ba3; font-size: 11px; font-family: 'SFMono-Regular', Consolas, monospace;
        background: rgba(0,0,0,0.2); border-radius: 6px; padding: 8px;
      }
    `);

    const panel = document.createElement('div');
    panel.id = 'dc-ogol-panel';
    panel.innerHTML = `
      <div class="dc-ogol-title"><span class="dot"></span>DC Participant Importer</div>
      <div id="dc-ogol-status">No data captured yet. Open a player/coach profile in another tab and click "Create participant in DC" there.</div>
      <div id="dc-ogol-date-warning"></div>
      <button id="dc-ogol-run" class="primary">Load captured data &amp; fill form</button>
      <button id="dc-ogol-copy-source" class="secondary" title="Source link for the participant's P record (fill it in after saving)">Copy source URL</button>
      <button id="dc-ogol-clear" class="secondary">Clear captured data</button>
      <hr>
      <label class="dc-ogol-label">South American nickname (overwrites Names, Short Name, Nickname)</label>
      <input type="text" id="dc-ogol-nickname" placeholder="e.g. Railson">
      <button id="dc-ogol-apply-nickname" class="secondary">Apply nickname</button>
      <hr>
      <div id="dc-ogol-asian-hint"></div>
      <button id="dc-ogol-asian-shortname" class="secondary" title="Asian names: copy the generated Full Name into Short Name (avoids many identical short names like 'Lee K.')">Copy Full Name → Short Name</button>
      <div id="dc-ogol-log"></div>
    `;
    document.body.appendChild(panel);

    function log(msg) {
      const el = document.getElementById('dc-ogol-log');
      el.textContent += msg + '\n';
      el.scrollTop = el.scrollHeight;
      console.log('[dc-ogol-fill]', msg);
    }

    function refreshStatus() {
      const raw = GM_getValue(STORAGE_KEY, null);
      const statusEl = document.getElementById('dc-ogol-status');
      if (!raw) {
        const w = document.getElementById('dc-ogol-date-warning');
        if (w) w.style.display = 'none';
        return;
      }
      const data = JSON.parse(raw);
      const typeLabel = data.participantType === 'Coach' ? 'Coach' : 'Player';
      const asianHint = document.getElementById('dc-ogol-asian-hint');
      if (asianHint) {
        const asian = finalizeNames(data).isAsian;
        asianHint.textContent = asian
          ? `${toDcCountry(data.country)} player — if the name is Asian (e.g. "Chun-Lok Tan", not "Raphaël Merkies"), copy Full Name to Short Name with the button below.`
          : '';
        asianHint.style.display = asian ? 'block' : 'none';
      }
      const dateWarn = document.getElementById('dc-ogol-date-warning');
      if (dateWarn) {
        dateWarn.textContent = isJan1(data) ? jan1Message(data) : '';
        dateWarn.style.display = isJan1(data) ? 'block' : 'none';
      }
      statusEl.textContent = `Captured (${typeLabel}): ${data.surname || ''} ${data.firstName || ''} — ${data.sourceUrl} (${data.capturedAt})`;

      // Prefill the South American nickname from the source (oGol common
      // name). Only replaces a value we set ourselves, never what the user typed.
      const nickInput = document.getElementById('dc-ogol-nickname');
      if (nickInput && (nickInput.value === '' || nickInput.value === nickInput.dataset.autoValue)) {
        nickInput.value = data.nickname || '';
        nickInput.dataset.autoValue = nickInput.value;
      }
    }
    refreshStatus();
    GM_addValueChangeListener(STORAGE_KEY, refreshStatus);

    document.getElementById('dc-ogol-run').addEventListener('click', async () => {
      document.getElementById('dc-ogol-log').textContent = '';
      const raw = GM_getValue(STORAGE_KEY, null);
      if (!raw) { log('No captured data found. Open the source tab first.'); return; }
      const data = JSON.parse(raw);
      log('Using captured data: ' + JSON.stringify(data, null, 2));
      await fillForm(data);
    });

    document.getElementById('dc-ogol-clear').addEventListener('click', () => {
      GM_deleteValue(STORAGE_KEY);
      document.getElementById('dc-ogol-status').textContent =
        'No data captured yet. Open a player/coach profile in another tab and click "Capture" or "Create participant in DC" there.';
      document.getElementById('dc-ogol-log').textContent = '';
      log('Captured data cleared.');
    });

    async function applyNickname(nickname) {
      const clean = stripDiacritics(nickname).trim();
      if (!clean) { log('Enter a nickname first.'); return; }

      log(`Applying nickname "${clean}" to Names, Short Name and Nickname...`);

      const namesInput = document.querySelector('input[id^="dc_name_data_"][id$="_name_0"]');
      if (namesInput) setNativeValue(namesInput, clean);
      else log('Names input not found.');
      await sleep(400);

      const shortNameInput = document.querySelector('[data-test-id="jonas-field-participant-propertyData"] input[id$="_p_19_name_data_name_0"]');
      if (shortNameInput) setNativeValue(shortNameInput, clean);
      else log('Short Name input not found.');
      await sleep(400);

      const nicknameInput = document.querySelector('[data-test-id="jonas-field-participant-propertyData"] input[id$="_p_88_name_data_name_0"]');
      if (nicknameInput) setNativeValue(nicknameInput, clean);
      else log('Nickname input not found.');

      log('Nickname applied.');
    }

    // Source URL for "P" (filled in only after the participant is saved).
    document.getElementById('dc-ogol-copy-source').addEventListener('click', async () => {
      const btn = document.getElementById('dc-ogol-copy-source');
      const raw = GM_getValue(STORAGE_KEY, null);
      const url = raw ? JSON.parse(raw).sourceUrl : null;
      if (!url) { log('No captured data — nothing to copy.'); return; }
      try {
        if (typeof GM_setClipboard === 'function') GM_setClipboard(url, 'text');
        else await navigator.clipboard.writeText(url);
        log(`Copied source URL: ${url}`);
        btn.textContent = 'Copied ✓';
        setTimeout(() => { btn.textContent = 'Copy source URL'; }, 2000);
      } catch (e) {
        log(`Copy failed — copy it manually: ${url}`);
      }
    });

    document.getElementById('dc-ogol-asian-shortname').addEventListener('click', () => {
      const props = document.querySelector('[data-test-id="jonas-field-participant-propertyData"]');
      const fullInput = props?.querySelector('input[id$="_p_1_name_data_name_0"]');
      const shortInput = props?.querySelector('input[id$="_p_19_name_data_name_0"]');
      if (!fullInput || !shortInput) { log('Full Name / Short Name input not found.'); return; }
      if (!fullInput.value.trim()) { log('Full Name is empty — fill the names first.'); return; }
      setNativeValue(shortInput, fullInput.value.trim());
      log(`Short Name = Full Name (${fullInput.value.trim()})`);
    });

    document.getElementById('dc-ogol-apply-nickname').addEventListener('click', () => {
      document.getElementById('dc-ogol-log').textContent = '';
      const nickname = document.getElementById('dc-ogol-nickname').value;
      applyNickname(nickname);
    });

    // ---------------------------------------------------------------------
    // Auto-run: if a source page flagged captured data with autoRun=true
    // (via the "Create participant in DC" button), wait for the form to
    // finish mounting and fill it automatically — no click needed here.
    // The flag is cleared afterwards so a page refresh won't re-trigger it.
    // ---------------------------------------------------------------------
    async function maybeAutoRun() {
      const raw = GM_getValue(STORAGE_KEY, null);
      if (!raw) return;
      let data;
      try { data = JSON.parse(raw); } catch (e) { return; }
      if (!data.autoRun) return;

      // Consume the flag right away: whatever happens next (fill, timeout,
      // tab closed), a later visit to this form must not auto-fill again.
      const age = Date.now() - (data.autoRunAt || 0);
      data.autoRun = false;
      GM_setValue(STORAGE_KEY, JSON.stringify(data));
      if (age > AUTO_RUN_MAX_AGE_MS) {
        log(`Captured data is ${Math.round(age / 1000)} s old — not auto-filling. Use "Load captured data & fill form" if it's the right participant.`);
        return;
      }

      document.getElementById('dc-ogol-status').textContent = `Auto-filling from ${data.sourceUrl}…`;
      const ready = await waitForFormReady();
      if (!ready) {
        log('Timed out waiting for the DC form to load — click "Load captured data & fill form" manually once it appears.');
        return;
      }
      await sleep(800);
      log('Auto-filling from captured source data: ' + JSON.stringify(data, null, 2));
      await fillForm(data);
    }
    maybeAutoRun();
  }

  // =======================================================================
  // PART 3: DC data-checking list (participant-incident) — Google search
  // =======================================================================
  // Adds a small "G" button next to every row's Name that searches
  // "<Name> <Item parent>" in a new tab. The list re-renders on filtering /
  // paging, so a MutationObserver keeps adding buttons to new rows.
  if (location.hostname.includes('dc.livesport.eu')
      && location.pathname.startsWith('/data/data-checking/participant-incident')) {
    const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();

    GM_addStyle(`
      a.dc-gsearch-btn {
        display: inline-flex; align-items: center; justify-content: center;
        width: 18px; height: 18px; margin-left: 6px; vertical-align: middle;
        border: 1px solid #c8c8c8; border-radius: 4px; background: #fff;
        font: 700 12px/1 Arial, sans-serif; color: #4285F4 !important;
        text-decoration: none !important; cursor: pointer;
      }
      a.dc-gsearch-btn:hover { background: #e8f0fe; border-color: #4285F4; }
    `);

    // Name = the bold cell (without our own button), Item parent = all
    // .rh-participant-name in the row.
    function getName(row) {
      const cell = row.querySelector(':scope > td.bold');
      if (!cell) return '';
      return clean(Array.from(cell.childNodes)
        .filter((n) => !(n.nodeType === Node.ELEMENT_NODE && n.classList.contains('dc-gsearch-btn')))
        .map((n) => n.textContent).join(' '));
    }

    function buildQuery(row) {
      const name = getName(row);
      const parents = Array.from(row.querySelectorAll('.rh-participant-name'))
        .map((el) => clean(el.textContent)).filter(Boolean);
      return clean([name, ...parents].join(' '));
    }

    const googleUrl = (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;

    function addButton(row) {
      const nameCell = row.querySelector(':scope > td.bold');
      if (!nameCell || nameCell.querySelector('.dc-gsearch-btn')) return;
      const query = buildQuery(row);
      if (!query) return;

      const btn = document.createElement('a');
      btn.className = 'dc-gsearch-btn';
      btn.href = googleUrl(query);
      btn.target = '_blank';
      btn.rel = 'noopener noreferrer';
      btn.title = `Google: ${query}`;
      btn.textContent = 'G';
      // Recompute right before opening (row content may have been updated)
      // and keep the click from reaching the list's own row handlers.
      btn.addEventListener('mousedown', () => { btn.href = googleUrl(buildQuery(row) || query); });
      btn.addEventListener('click', (e) => e.stopPropagation());
      nameCell.appendChild(btn);
    }

    function scan() {
      document.querySelectorAll('#dlist_table_tbody > tr[id^="dlist_table_row_"]').forEach(addButton);
    }

    scan();
    let pending = false;
    new MutationObserver(() => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => { pending = false; scan(); });
    }).observe(document.body, { childList: true, subtree: true });
  }
})();
