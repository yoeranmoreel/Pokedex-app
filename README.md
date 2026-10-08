# AniDex 🐾

AniDex is een mobiele webapp waarmee je dieren fotografeert, met AI laat herkennen en verzamelt in je persoonlijke natuur-Dex.

## Opzet

AniDex v2 is bewust geen single-page scherm meer. De app heeft aparte pagina's voor **Home**, **Scannen**, **Mijn Dex**, **Badges** en **Profiel/account** met een vaste mobiele navigatie.

```
Browser
  ↓
Cloudflare Worker
  ├─ D1      accounts, sessies en waarnemingen
  ├─ R2      privé opgeslagen foto's
  └─ OpenAI  dierherkenning
```

Google Apps Script en de oude CORS-proxy zijn niet meer nodig.

## Accounts

Gebruikers kunnen registreren en inloggen. Wachtwoorden worden niet opgeslagen: de Worker gebruikt PBKDF2-SHA256 met een unieke salt. Inloggen maakt een willekeurige sessie aan waarvan alleen de SHA-256 hash in D1 staat. De browser ontvangt een `HttpOnly; Secure; SameSite=Lax` cookie.

Waarnemingen en foto's zijn aan het account gekoppeld. De media-endpoint controleert ook of de opgevraagde foto bij de ingelogde gebruiker hoort.

## Projectstructuur

- `public/index.html` — Home
- `public/scan.html` — dier scannen
- `public/dex.html` — verzameling
- `public/badges.html` — prestaties
- `public/account.html` — registreren/inloggen/profiel
- `public/*.js` — pagina-logica
- `public/shared.js` — gedeelde API/auth helpers
- `src/worker.js` — backend/API
- `migrations/` — D1 schema
- `wrangler.jsonc` — Cloudflare-config

## Cloudflare-resources

D1: `anidex-db`, EU jurisdiction.

R2: `anidex-photos`. R2 moet op het Cloudflare-account eerst geactiveerd zijn voordat de bucket aangemaakt kan worden.

Worker secret: `OPENAI_API_KEY`. Deze key hoort nooit in GitHub of frontendcode.

## Installatie / deploy

```bash
npm install
npx wrangler d1 migrations apply anidex-db --remote
npx wrangler secret put OPENAI_API_KEY
npm run deploy
```

Maak na het activeren van R2 de bucket `anidex-photos` aan.

## Database migrations

- `0001_initial.sql` — waarnemingen
- `0002_accounts.sql` — gebruikers en sessies

## API

Auth: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.

Dex: `POST /api/identify`, `GET /api/sightings`, `POST /api/sightings`, `GET /media/:key`.

## Roadmap

Na de stabiele kern: handmatige correctie van herkenning, kaart, uitgebreidere badges/statistieken, wachtwoord-reset/e-mailverificatie en echte PWA/offline-ondersteuning.

## Oude prototype

De eerste AniDex was één `index.html` op GitHub Pages → Cloudflare `pokedex-proxy` → Google Apps Script. De oude code blijft via Git-history beschikbaar; de oude Worker wordt pas verwijderd wanneer v2 goed draait.
