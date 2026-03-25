# TEC Site Architecture Design

**Date:** 2026-03-25
**Project:** Topology Exploration Club — topologyexploration.club
**Repo:** zachback64/tec-site

---

## Overview

Migrate the existing single-file `index.html` to a professional Astro project with working form backends, a Supabase database, unit tests, and performance optimizations. The visual design is unchanged — only the architecture changes.

**Stack:**
- **Astro** — framework and templating
- **Vercel** — hosting and serverless API routes (already in use)
- **Supabase** — Postgres database for signal list and applications
- **Vitest** — unit test runner
- **Vercel KV** — rate limiting

---

## Project Structure

```
tec-site/
├── src/
│   ├── components/
│   │   ├── Nav.astro
│   │   ├── Hero.astro
│   │   ├── MissionBrief.astro
│   │   ├── Protocol.astro
│   │   ├── Access.astro
│   │   ├── ExpeditionCard.astro
│   │   ├── Archive.astro
│   │   └── Footer.astro
│   ├── layouts/
│   │   └── Base.astro
│   ├── pages/
│   │   ├── index.astro
│   │   └── api/
│   │       ├── signal.ts
│   │       └── apply.ts
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── validation.ts
│   ├── data/
│   │   └── expedition.ts
│   └── styles/
│       └── tokens.css
├── tests/
│   ├── validation.test.ts
│   ├── signal.test.ts
│   └── apply.test.ts
├── public/
│   ├── fonts/                  ← self-hosted Space Mono + EB Garamond
│   └── images/
│       ├── vol01-instrument.jpg
│       └── vol01-expeditionist.jpg
├── astro.config.mjs
├── tsconfig.json
├── vitest.config.ts
├── .env.example
└── package.json
```

---

## Data Layer

### Expedition Config

`src/data/expedition.ts` is the single file edited each month to update expedition details. All components source their data from here.

```typescript
export const currentExpedition = {
  volume: 3,
  name: 'Mar Vista Survey',
  location: 'Mar Vista, Los Angeles',
  coordinates: '34.0°N 118.4°W',
  departure: 'Solar descent — April 2025',
  clearancesRemaining: 7,
  status: 'Accepting applications',
} as const

export const archive = [
  { volume: 1, date: 'Feb 2025', location: 'Private residence, Los Angeles' },
  { volume: 2, date: 'Mar 2025', location: 'Location undisclosed, Los Angeles' },
  { volume: 3, date: 'Apr 2025', location: 'Mar Vista, Los Angeles', active: true },
]
```

### Supabase Schema

```sql
CREATE TABLE signal_list (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       text NOT NULL,
  name        text NOT NULL,
  email       text,
  volume      int  NOT NULL,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE applications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  phone       text NOT NULL,
  email       text,
  referral    text,
  experience  text,
  volume      int  NOT NULL,
  status      text NOT NULL DEFAULT 'pending',
  created_at  timestamptz DEFAULT now()
);
```

Row-level security is enabled. The API writes via a server-only service role key. No public read access.

The `volume` field is stamped automatically from `currentExpedition.volume` at submission time.

---

## API Routes

### `POST /api/signal`

Accepts: `{ phone, name, email? }`

1. Validate all fields via `src/lib/validation.ts`
2. Insert into `signal_list` with current volume
3. Return `201` on success, `400` on validation failure, `500` on DB error

### `POST /api/apply`

Accepts: `{ name, phone, email?, referral?, experience? }`

1. Validate required fields
2. Insert into `applications` with current volume and `status: 'pending'`
3. Return `201` on success, `400` on validation failure, `500` on DB error

### Rate Limiting

Vercel Edge middleware caps form submissions at 5 per IP per hour using Vercel KV. Applied to both `/api/signal` and `/api/apply`. Blocks spam before it reaches the database.

---

## Validation

`src/lib/validation.ts` — pure functions, no side effects, fully unit-testable.

```typescript
export const validatePhone = (raw: string): string => {
  const digits = raw.replace(/\D/g, '')
  if (digits.length < 7 || digits.length > 15) throw new Error('Invalid phone number')
  return digits
}

export const validateEmail = (raw: string): string => {
  if (!raw) return ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) throw new Error('Invalid email')
  return raw.trim().toLowerCase()
}

export const validateName = (raw: string): string => {
  const name = raw.trim()
  if (!name) throw new Error('Name is required')
  if (name.length > 100) throw new Error('Name too long')
  return name
}
```

---

## Testing

**Runner:** Vitest

### `tests/validation.test.ts`
Tests all validator functions with valid inputs, invalid inputs, and edge cases. No mocks needed — pure functions.

### `tests/signal.test.ts`
Tests the signal API route handler. Supabase client is mocked. Covers:
- Valid submission → 201
- Missing phone → 400
- Missing name → 400
- DB insert failure → 500

### `tests/apply.test.ts`
Tests the apply API route handler. Supabase client is mocked. Covers:
- Valid submission → 201
- Missing name → 400
- Missing phone → 400
- DB insert failure → 500

---

## Performance

### Self-hosted Fonts
Space Mono and EB Garamond are downloaded and served from `/public/fonts/`. The external Google Fonts request is removed. This eliminates a render-blocking third-party request and removes Google's ability to track site visitors via font loads.

### Image Optimization
Hero images (`vol01-instrument.jpg`, `vol01-expeditionist.jpg`) are served via Astro's built-in `<Image>` component: automatically resized, converted to WebP, and lazy-loaded.

### Zero JavaScript by Default
Astro ships no JavaScript unless explicitly opted in. The tab-switching behavior in the Access section stays as a minimal inline `<script>` tag. All other components are pure HTML+CSS.

---

## Environment Variables

```bash
# .env.example
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
KV_REST_API_URL=
KV_REST_API_TOKEN=
```

Service role key is server-only. Never referenced in client-side code.

---

## Deployment

No change to the existing Vercel project or domain configuration. Astro's Vercel adapter handles serverless function deployment automatically. Push to `main` → auto-deploy.
