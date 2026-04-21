# dkPlus ERP Dashboard

React dashboard sem sækir gögn beint úr dkPlus REST API og sýnir helstu lykilupplýsingar fyrirtækisins í rauntíma.

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
| `GET /general/employee` | Starfsmenn — nafn, númer, staða |
| `GET /TimeClock/entries` | Tímaskráningar — upphaf, lok, heildartímar, verkefni |
| `GET /project` | Verkefni — heiti, viðskiptavinur, staða, stofndagur |

Öll köll eru gerð samhliða með `Promise.allSettled` — ef einn endpoint bregst mun dashboardið birtast með þeim gögnum sem eru til.

## Forsendur

- **Virkur starfsmaður**: `Status === 0`
- **Virkt verkefni**: `JobStatus === 0`
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
| Grunsamlegar skráningar | TotalHours > 24h í einni færslu | Athugið |

## Næstu skref

1. **Sjálfvirk vöktun** — cron-job sem keyrir daglega og sendir Slack/email ef stöðumat versnar
2. **Backend proxy** — fjarlægja hardcoded API token, geyma í environment variables
3. **Fleiri endpoints** — reikningar, launakeyrsla, birgðir
4. **Samanburður** — þróun tímaskráninga milli mánaða
5. **Auth** — innskráning í stað hardcoded tokens