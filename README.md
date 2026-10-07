# AniDex 🐾

AniDex is een mobiele webapp waarmee je dieren fotografeert, laat herkennen en verzamelt in je eigen digitale natuur-Dex.

## Architectuur v2

Browser → Cloudflare Worker → **D1** (metadata), **R2** (foto's) en **OpenAI** (dierherkenning).

De Worker serveert zowel de frontend als `/api/*`. Google Apps Script en de oude CORS-proxy zijn niet meer nodig.

## Projectstructuur

- `public/` — frontend
- `src/worker.js` — API/backend
- `migrations/` — D1-schema
- `wrangler.jsonc` — Cloudflare-configuratie
- `package.json` — scripts/dependencies

## Cloudflare

D1 `anidex-db` is aangemaakt in EU-jurisdiction. R2 bucket `anidex-photos` is geconfigureerd, maar **R2 moet op het account eerst via het Cloudflare-dashboard geactiveerd worden** voordat de bucket kan worden aangemaakt.

De AI-key hoort uitsluitend als Worker secret `OPENAI_API_KEY` te bestaan en nooit in GitHub/frontendcode.

## Installatie en deploy

```bash
npm install
npx wrangler d1 migrations apply anidex-db --remote
npx wrangler secret put OPENAI_API_KEY
npm run deploy
```

Na activeren van R2: maak eerst bucket `anidex-photos` aan.

## API

`GET /api/health`, `POST /api/identify`, `GET /api/sightings?userId=...`, `POST /api/sightings` en `GET /media/:key`.

## Privacy/data

Er is nog geen accountregistratie. Een willekeurige gebruiker-ID staat lokaal in de browser. GPS wordt alleen bij opslaan gevraagd en is optioneel. Foto's gaan naar R2; D1 bevat de metadata en fotoverwijzing.

## Roadmap

Eerst een stabiele flow: scannen → herkennen → bevestigen → opslaan → Dex. Daarna handmatig corrigeren, kaart, badges/statistieken, accounts/synchronisatie en PWA/offline.

## Oude prototype

De eerste AniDex was één `index.html` op GitHub Pages → Cloudflare `pokedex-proxy` → Google Apps Script. Die architectuur is bewust vervangen vanwege de extra trage/onbetrouwbare laag en CORS-problemen. De oude code blijft via Git-history beschikbaar.
