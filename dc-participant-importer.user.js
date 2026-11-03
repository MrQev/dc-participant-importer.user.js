// ==UserScript==
// @name         DC Participant Importer
// @namespace    dc-ogol-fill
// @version      1.0.5
// @author       DKode
// @homepageURL  https://github.com/MrQev/dc-participant-importer.user.js
// @supportURL   https://github.com/MrQev/dc-participant-importer.user.js/issues
// @updateURL    https://raw.githubusercontent.com/MrQev/dc-participant-importer.user.js/main/dc-participant-importer.user.js
// @downloadURL  https://raw.githubusercontent.com/MrQev/dc-participant-importer.user.js/main/dc-participant-importer.user.js
// @description  Creates DC participants from Transfermarkt, oGol, worldfootball.net and EliteProspects, checks duplicates in DC and adds Google search to data-checking.
// @match        https://dc.livesport.eu/jsx/data/participant/detail/new*
// @match        https://dc.livesport.eu/data/data-checking/participant-incident*
// @match        https://www.ogol.com.br/jogador/*
// @match        https://www.eliteprospects.com/player/*
// @match        https://www.worldfootball.net/person/*
// @match        https://www.worldfootball.net/player_summary/*
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
// ==/UserScript==

(function () {
  'use strict';

  const STORAGE_KEY = 'dcOgolCapturedData';
  const DC_NEW_PARTICIPANT_URL = 'https://dc.livesport.eu/jsx/data/participant/detail/new';
  const DC_ES_PARTICIPANT_URL = 'https://dc.livesport.eu/jsx/data/es_participant';
  // "Create participant in DC" data older than this is not auto-filled
  // (e.g. the DC tab was closed before it loaded).
  const AUTO_RUN_MAX_AGE_MS = 2 * 60 * 1000;

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
      box.querySelector('.result').innerHTML =
        `First name: <b>${tokens.slice(0, NAME.split).join(' ') || '—'}</b><br>` +
        `Surname: <b>${tokens.slice(NAME.split).join(' ') || '—'}</b>`;
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
      const sportCandidates = data.sport === 'Hockey' ? ['Hockey', 'Ice Hockey'] : ['Soccer'];
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

      if (mainType === 'Player' && data.position) {
        log(`Adding participant type row for position: ${data.position}`);
        const typeField = clickAddNewItem('jonas-field-participant-participantHasParticipantTypes');
        await sleep(300);
        if (typeField) {
          const rows = typeField.querySelectorAll('[data-test-id="jonas-attr-relation-participantType-container"]');
          const newRowContainer = rows[rows.length - 1];
          if (newRowContainer) await setReactSelect(newRowContainer, data.position);
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
          if (birthdayInput) setNativeValue(birthdayInput, dateStr);
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
      <div class="dc-ogol-title"><span class="dot"></span>DC ⟵ oGol/Transfermarkt fill</div>
      <div id="dc-ogol-status">No data captured yet. Open a player/coach profile in another tab and click "Capture" or "Create participant in DC" there.</div>
      <button id="dc-ogol-run" class="primary">Load captured data &amp; fill form</button>
      <button id="dc-ogol-clear" class="secondary">Clear captured data</button>
      <hr>
      <label class="dc-ogol-label">South American nickname (overwrites Names, Short Name, Nickname)</label>
      <input type="text" id="dc-ogol-nickname" placeholder="e.g. Railson">
      <button id="dc-ogol-apply-nickname" class="secondary">Apply nickname</button>
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
      if (!raw) return;
      const data = JSON.parse(raw);
      const typeLabel = data.participantType === 'Coach' ? 'Coach' : 'Player';
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
