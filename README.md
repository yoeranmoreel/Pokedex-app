# AniDex 🐾

AniDex is een mobiele webapp waarmee je dieren fotografeert, met AI laat herkennen en verzamelt in je persoonlijke natuur-Dex.

## Huidige opzet

AniDex v2 bestaat uit losse pagina's voor **Home**, **Scannen**, **Mijn Dex**, **Badges** en **Profiel**. De vormgeving is geïnspireerd op de binnenkant van een klassieke Pokédex: rode behuizing, scannerlens, LCD-schermen en fysieke bedieningsknoppen.

```text
Browser / PWA
  ↓
Cloudflare Worker
  ├─ D1      accounts, sessies, soorten en encounter-tellers
  └─ OpenAI  dierherkenning
```

Foto's worden in de huidige versie **niet opgeslagen**. Ze worden verkleind in de browser, tijdelijk naar de herkennings-API gestuurd en daarna niet bewaard. Daardoor is R2 voor de MVP niet nodig.

## Functionaliteit

- Registreren, inloggen en sessies via veilige HttpOnly-cookie.
- Dier scannen met AI-herkenning.
- Herkenning handmatig corrigeren voordat je hem opslaat.
- Elke soort staat één keer in de Dex; opnieuw zien verhoogt de encounter-teller.
- Soortafbeeldingen worden als gedeelde referentieafbeelding opgehaald.
- Dex zoeken, filteren op diergroep en sorteren.
- Home-dashboard met soorten, encounters en recente ontdekkingen.
- Badges met echte voortgang.
- Trainer-profiel met statistieken en ontdekte diergroepen.
- Web app manifest en offline app-shell.

## Projectstructuur

- `public/index.html` + `index.js` — dashboard
- `public/scan.html` + `scan.js` — herkenning en correctie
- `public/dex.html` + `dex.js` — verzameling
- `public/badges.html` + `badges.js` — prestaties
- `public/account.html` + `account.js` — account/profiel
- `public/styles.css` — Pokédex-behuizing en basislayout
- `public/ui.css` — schermen, statistieken, scanner en controls
- `public/shared.js` — API/auth helpers
- `public/manifest.webmanifest`, `icon.svg`, `sw.js` — PWA-shell
- `src/worker.js` — backend/API
- `migrations/` — D1-schema
- `wrangler.jsonc` — Cloudflare-config

## Cloudflare

D1: `anidex-db` (EU).

Worker secret: `OPENAI_API_KEY`. Deze sleutel hoort nooit in GitHub of frontendcode.

## API

- Auth: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- Data: `GET /api/stats`, `GET /api/sightings`, `POST /api/sightings`
- Herkenning: `POST /api/identify`
- Referentieafbeelding: `GET /api/species-image?name=...`

## Roadmap

Nog logisch voor volgende rondes: een vaste Nederlandse soorten-catalogus met ook **onontdekte silhouetten**, betere bron/licentie voor referentieafbeeldingen, wachtwoord-reset/e-mailverificatie en optioneel later één persoonlijke foto per gebruiker per soort via R2.

## Oude prototype

De eerste AniDex was één `index.html` op GitHub Pages → Cloudflare `pokedex-proxy` → Google Apps Script. De oude Worker blijft voorlopig ongemoeid totdat v2 volledig stabiel is.
