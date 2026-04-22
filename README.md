# dkPlus ERP Dashboard

React dashboard sem sækir gögn beint úr dkPlus REST API og sýnir helstu lykilupplýsingar fyrirtækisins í rauntíma á fjórum flipum.

## Keyrsla

```bash
npm install
npm start
```

Opnast á `http://localhost:3000`

## Tækniuppbygging

- **React 19** — UI framework
- **Create React App** — uppsetning og þróunarþjónn
- **Inline styles** — engar CSS dependencies
- **CRA Proxy** — `package.json` proxy vísar API köllum á `https://api.dkplus.is` til að komast hjá CORS

## Hönnunarákvarðanir

### Enginn bakendi
Verkefnið notar engan bakenda meðvitað. CRA proxy-inn í `package.json` sér um CORS og API köll fara beint frá vafranum á dkPlus API. Þetta var meðvituð ákvörðun til að:

- Halda kóðanum einföldum og læsilegum
- Einblína á business gildi frekar en tæknilega uppbyggingu
- Flýta fyrir þróun á demo umhverfi

**Í production** myndi ég bæta við léttum Node.js/Express bakenda til að:
- Fela API token (ætti aldrei að vera í frontend kóða)
- Gera mögulegar sjálfvirkar tilkynningar (Slack, email)
- Bæta við caching til að hraða svörum

## Endpoints sem eru notaðir

| Endpoint | Tilgangur |
|---|---|
| `GET /general/employee` | Starfsmenn — nafn, númer, staða (virk/óvirk) |
| `GET /TimeClock/entries` | Tímaskráningar — upphaf, lok, heildartímar, verkefni |
| `GET /project` | Verkefni — heiti, viðskiptavinur, staða, stofndagur |
| `GET /customer` | Viðskiptavinir — nafn, númer, staða (virk/óvirk) |

Öll köll eru gerð samhliða með `Promise.allSettled` — ef einn endpoint bregst mun dashboardið birtast með þeim gögnum sem eru til.

## Flipar

| Flipi | Innihald |
|---|---|
| **Yfirlit** | KPI kort, stöðumat, þátttaka-mælikvarði, virkustu starfsmenn, virkustu viðskiptavinir, nýjustu skráningar, viðskiptavinir án verkefna |
| **Starfsmenn** | Þátttakamælikvarði, tafla yfir alla starfsmenn með síðasta skráningartíma og virknilit |
| **Verkefni** | KPI kort, leit og síun, tafla yfir öll verkefni með skráða tíma og stöðumerki |
| **Viðskiptavinir** | KPI kort, leit og síun, tafla yfir alla viðskiptavini með stöðu og verkefnatengingu |

## Forsendur

- **Virkur starfsmaður**: `Status === 0`
- **Virkt verkefni**: `JobStatus === 0`
- **Virkur viðskiptavinur**: `Status === 0`
- **Nýleg tímaskráning**: `Start` dagsetning er innan 30 daga

## Business logic reglur

| Regla | Skilyrði | Niðurstaða |
|---|---|---|
| Tímaskráningavirkni | Síðasta skráning > 30 dagar | Engin virkni |
| Tímaskráningavirkni | Síðasta skráning 14–30 dagar | Lítil virkni |
| Þátttaka starfsmanna | ≥ 70% skrá tíma | Virkt |
| Þátttaka starfsmanna | 50–69% skrá tíma | Lítil virkni |
| Þátttaka starfsmanna | 30–49% skrá tíma | Möguleg vandamál |
| Þátttaka starfsmanna | < 30% skrá tíma | Engin virkni |
| Óvirkir starfsmenn | Virkur í kerfi en engar skráningar síðustu **90 daga** | Flaggaður með bleikum bakgrunni |
| Verkefnaheilsa | Virkt verkefni með 0 tíma skráða | „Engin virkni" — merkt með gulum bakgrunni |
| Óhóflegt hlutfall | Einn viðskiptavinur stendur fyrir > 50% allra skráðra tíma | „Áhætta" stöðukort í Stöðumat |
| Viðskiptavinur án verkefna | Enginn verkefni tengd viðskiptavini | Flaggaður í viðskiptavinaflipa |
| Grunsamlegar skráningar | TotalHours > 24h í einni færslu | Merkt með gulum bakgrunni í nýjustu skráningum |

## Þróun — mælikvarðar (src/api.js)

Öll viðmiðunarmörk eru skilgreind í `THRESHOLDS` hlutnum í `src/api.js` og eru lesnar í gegnum alla components — ekki harðkóðaðar víðs vegar.

| Mælikvarði | Sjálfgefið gildi |
|---|---|
| `activityWarningDays` | 14 dagar |
| `activityCriticalDays` | 30 dagar |
| `inactiveDays` | 90 dagar |
| `participationGoodPct` | 70% |
| `participationLowPct` | 50% |
| `participationIssuePct` | 30% |
| `suspiciousHours` | 24 tímar |

## Næstu skref

1. **Sjálfvirk vöktun** — cron-job sem keyrir daglega og sendir tilkynningu ef stöðumat versnar
2. **Backend proxy** — fjarlægja hardcoded API token, geyma í environment variables
3. **Fleiri endpoints** — reikningar, launakeyrsla, birgðir
4. **Samanburður** — þróun tímaskráninga milli mánaða
5. **Auth** — innskráning í stað hardcoded tokens
