# TEC Site — Astro Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the TEC single-file `index.html` to a professional Astro project with working Supabase form backends, Vitest unit tests, and performance optimizations — preserving the existing visual design exactly.

**Architecture:** Astro (hybrid output) serves all page sections as static HTML components. Two serverless API routes (`/api/signal`, `/api/apply`) validate submissions and write to Supabase. A rate-limiting middleware module (pure function, injectable KV client) protects both endpoints. All CSS lives in a single global stylesheet imported via the base layout. Self-hosted fonts via fontsource packages replace the Google Fonts external request.

**Tech Stack:** Astro 5, @astrojs/vercel adapter, @supabase/supabase-js, @vercel/kv, Vitest 2, fontsource (Space Mono + EB Garamond), TypeScript strict mode

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `package.json` | Create | Dependencies and scripts |
| `astro.config.mjs` | Create | Hybrid output, Vercel adapter |
| `tsconfig.json` | Create | TypeScript strict config |
| `vitest.config.ts` | Create | Vitest config |
| `.env.example` | Create | Required env vars documentation |
| `src/data/expedition.ts` | Create | Monthly expedition config — edit this each month |
| `src/styles/global.css` | Create | All CSS (ported from index.html) |
| `src/lib/validation.ts` | Create | Pure validator functions |
| `src/lib/supabase.ts` | Create | Thin Supabase client wrapper |
| `src/lib/ratelimit.ts` | Create | Pure rate limiting logic (injectable KV) |
| `src/middleware.ts` | Create | Astro middleware: rate limiting for API routes |
| `src/layouts/Base.astro` | Create | HTML shell: head, meta, fonts, global CSS |
| `src/components/Nav.astro` | Create | Top navigation bar |
| `src/components/Hero.astro` | Create | Hero section with optimized images |
| `src/components/MissionBrief.astro` | Create | Mission brief + specs section |
| `src/components/Protocol.astro` | Create | Protocol strip section |
| `src/components/ExpeditionCard.astro` | Create | Active expedition card |
| `src/components/Archive.astro` | Create | Expedition archive list |
| `src/components/Access.astro` | Create | Tabs + both forms with fetch-based submission |
| `src/components/Footer.astro` | Create | Footer |
| `src/pages/index.astro` | Create | Assembles all components |
| `src/pages/api/signal.ts` | Create | POST /api/signal handler |
| `src/pages/api/apply.ts` | Create | POST /api/apply handler |
| `tests/validation.test.ts` | Create | Unit tests for validation.ts |
| `tests/signal.test.ts` | Create | Unit tests for signal API route |
| `tests/apply.test.ts` | Create | Unit tests for apply API route |
| `tests/ratelimit.test.ts` | Create | Unit tests for ratelimit.ts |
| `src/assets/vol03-instrument.jpg` | Move | From `images/vol01-instrument.jpg` — in src/assets for Astro Image optimization |
| `src/assets/vol03-expeditionist.jpg` | Move | From `images/vol01-expeditionist.jpg` — in src/assets for Astro Image optimization |
| `supabase/migrations/001_initial.sql` | Create | DB schema to run in Supabase dashboard |
| `index.html` | Keep (do not delete) | Rollback reference in git history |

---

## Task 1: Scaffold Project

**Files:**
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `.env.example`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "tec-site",
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "astro": "^5.0.0",
    "@astrojs/vercel": "^8.0.0",
    "@supabase/supabase-js": "^2.45.0",
    "@vercel/kv": "^3.0.0",
    "@fontsource/space-mono": "^5.0.0",
    "@fontsource/eb-garamond": "^5.1.0"
  },
  "devDependencies": {
    "vitest": "^2.0.0",
    "@vitest/coverage-v8": "^2.0.0",
    "typescript": "^5.5.0"
  }
}
```

- [ ] **Step 2: Install dependencies**

```bash
cd /c/Users/Zach/Dev/tec-site
npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 3: Create astro.config.mjs**

```js
// astro.config.mjs
import { defineConfig } from 'astro/config'
import vercel from '@astrojs/vercel/serverless'

export default defineConfig({
  output: 'hybrid',
  adapter: vercel(),
})
```

- [ ] **Step 4: Create tsconfig.json**

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

- [ ] **Step 5: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
```

- [ ] **Step 6: Create .env.example**

```bash
# .env.example — copy to .env and fill in values
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
KV_REST_API_URL=
KV_REST_API_TOKEN=
```

- [ ] **Step 7: Move existing images into src/assets/**

Images used with Astro's `<Image>` component must live in `src/` (not `public/`) to enable optimization.

```bash
mkdir -p src/assets
cp images/vol01-instrument.jpg src/assets/vol03-instrument.jpg
cp images/vol01-expeditionist.jpg src/assets/vol03-expeditionist.jpg
```

- [ ] **Step 8: Commit**

```bash
git add package.json astro.config.mjs tsconfig.json vitest.config.ts .env.example public/
git commit -m "feat: scaffold Astro project"
```

---

## Task 2: Expedition Data + Global Styles

**Files:**
- Create: `src/data/expedition.ts`
- Create: `src/styles/global.css`

- [ ] **Step 1: Create src/data/expedition.ts**

```typescript
// src/data/expedition.ts
// Edit this file each month when a new expedition is announced.

export const currentExpedition = {
  volume: 3,
  name: 'Mar Vista Survey',
  location: 'Mar Vista, Los Angeles',
  coordinates: '34.0°N 118.4°W',
  departure: 'Solar descent — April 2025',
  clearancesRemaining: 7, // update manually after reviewing applications in Supabase
  status: 'Accepting applications',
} as const

// Hero images are imported directly in Hero.astro from src/assets/.
// When updating to a new volume, add new images to src/assets/ and update the imports in Hero.astro.

export const archive: Array<{
  volume: number
  date: string
  location: string
  active?: true
}> = [
  { volume: 1, date: 'Feb 2025', location: 'Private residence, Los Angeles' },
  { volume: 2, date: 'Mar 2025', location: 'Location undisclosed, Los Angeles' },
  { volume: 3, date: 'Apr 2025', location: 'Mar Vista, Los Angeles', active: true },
]
```

- [ ] **Step 2: Create src/styles/global.css**

Port all CSS from `index.html` verbatim. Remove the `<style>` tags — keep everything inside them. This preserves the exact visual design.

```css
/* src/styles/global.css */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:     #f0ede6;
  --bg2:    #e8e4db;
  --surface:#e0dbd0;
  --ink:    #1a1814;
  --mid:    rgba(26,24,20,0.5);
  --dim:    rgba(26,24,20,0.3);
  --line:   rgba(26,24,20,0.1);
  --line2:  rgba(26,24,20,0.18);
  --orange: #d44c0d;
  --orange2:#f26522;
  --blue:   #1a4f8a;
  --blue2:  #2563b0;
  --green:  #2a6b3c;
  --green2: #3a8c50;
  --mono:   'Space Mono',monospace;
  --ser:    'EB Garamond',Georgia,serif;
}
html{font-size:16px;scroll-behavior:smooth}
body{background:var(--bg);color:var(--ink);font-family:var(--mono);font-weight:400;min-height:100vh;overflow-x:hidden}

/* NAV */
nav{display:flex;align-items:stretch;height:48px;border-bottom:1px solid var(--line2);background:var(--bg);position:sticky;top:0;z-index:50;}
.nav-org{display:flex;align-items:center;padding:0 28px;border-right:1px solid var(--line2);font-size:9px;letter-spacing:0.3em;text-transform:uppercase;color:var(--orange);white-space:nowrap;}
.nav-center{flex:1;display:flex;align-items:center;padding:0 28px;font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:var(--dim);}
.nav-links{display:flex;gap:0;list-style:none;margin-left:auto}
.nav-links li{border-left:1px solid var(--line2)}
.nav-links a{display:flex;align-items:center;height:48px;padding:0 20px;font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:var(--mid);text-decoration:none;transition:color 0.12s,background 0.12s;}
.nav-links a:hover{color:var(--ink);background:rgba(26,24,20,0.03)}
.nav-links .cta a{color:#fff;background:var(--orange);border-right:1px solid var(--line2)}
.nav-links .cta a:hover{background:var(--orange2)}

/* HERO */
.hero{display:grid;grid-template-columns:1fr 400px;min-height:calc(100vh - 48px);border-bottom:1px solid var(--line2);}
.hero-l{padding:64px 56px 56px 48px;display:flex;flex-direction:column;justify-content:space-between;border-right:1px solid var(--line2);}
.doc-header{display:flex;align-items:center;gap:0;margin-bottom:52px;border:1px solid var(--line2);width:fit-content;}
.doc-tag{padding:6px 14px;font-size:8px;letter-spacing:0.25em;text-transform:uppercase;border-right:1px solid var(--line2);color:var(--dim);}
.doc-tag:last-child{border-right:none}
.doc-tag.orange{background:var(--orange);color:#fff}
.doc-tag.green{color:var(--green)}
.doc-tag.blue{color:var(--blue)}
h1{font-family:var(--ser);font-weight:400;font-size:clamp(48px,5.5vw,88px);line-height:0.9;letter-spacing:-0.02em;color:var(--ink);}
h1 .it{font-style:italic}
h1 .orange{color:var(--orange)}
h1 .blue{color:var(--blue)}
h1 .green{color:var(--green)}
.hero-lower{margin-top:52px}
.mission-statement{font-family:var(--ser);font-size:17px;line-height:1.7;color:var(--mid);max-width:520px;margin-bottom:40px;padding-left:20px;border-left:2px solid var(--line2);}
.data-row{display:flex;align-items:stretch;border-top:1px solid var(--line2);}
.data-cell{padding:16px 32px 16px 0;margin-right:32px;border-right:1px solid var(--line2);}
.data-cell:last-child{border-right:none;margin-right:0}
.dc-val{font-family:var(--ser);font-style:italic;font-size:32px;line-height:1;color:var(--ink);}
.dc-val.orange{color:var(--orange)}
.dc-val.blue{color:var(--blue)}
.dc-val.green{color:var(--green)}
.dc-label{font-size:8px;letter-spacing:0.2em;text-transform:uppercase;color:var(--dim);margin-top:6px}
.hero-r{background:var(--bg2);display:flex;flex-direction:column;overflow:hidden;}
.hero-photo-wrap{flex:1;position:relative;overflow:hidden}
.hero-photo-wrap+.hero-photo-wrap{border-top:1px solid var(--line2)}
.hero-photo-wrap img{width:100%;height:100%;object-fit:cover;display:block;filter:saturate(0.75) contrast(1.1) brightness(0.95);}
.photo-overlay{position:absolute;inset:0;background:linear-gradient(to bottom,transparent 45%,rgba(240,237,230,0.75) 100%);}
.photo-label{position:absolute;bottom:0;left:0;right:0;padding:14px 18px;display:flex;justify-content:space-between;align-items:flex-end;}
.photo-label-l{font-size:8px;letter-spacing:0.2em;text-transform:uppercase;color:var(--mid);line-height:1.5}
.photo-label-r{font-family:var(--ser);font-style:italic;font-size:11px;color:var(--dim)}

/* SECTIONS */
section{border-bottom:1px solid var(--line2)}
.mission-brief{display:grid;grid-template-columns:180px 1fr 1fr}
.brief-index{padding:56px 28px;border-right:1px solid var(--line2);display:flex;flex-direction:column;justify-content:space-between;}
.brief-num{font-family:var(--ser);font-style:italic;font-size:64px;color:var(--line2);line-height:1}
.brief-vert{font-size:8px;letter-spacing:0.25em;text-transform:uppercase;color:var(--dim);writing-mode:vertical-rl;transform:rotate(180deg);}
.brief-col{padding:56px 48px;border-right:1px solid var(--line2)}
.brief-col:last-child{border-right:none}
.col-head{font-size:8px;letter-spacing:0.25em;text-transform:uppercase;color:var(--dim);padding-bottom:14px;margin-bottom:22px;border-bottom:1px solid var(--line2);}
h2{font-family:var(--ser);font-weight:400;font-size:32px;line-height:1.05;color:var(--ink);margin-bottom:20px;letter-spacing:-0.01em}
h2 .it{font-style:italic}
.body-text{font-family:var(--ser);font-size:15px;line-height:1.8;color:var(--mid)}
.body-text p+p{margin-top:14px}
.body-text strong{color:var(--ink);font-weight:500}
.field-dispatch{font-family:var(--ser);font-style:italic;font-size:17px;line-height:1.7;color:var(--ink);padding:22px 24px;background:var(--surface);border:1px solid var(--line2);border-left:3px solid var(--orange);margin-top:28px;}
.dispatch-meta{font-family:var(--mono);font-style:normal;font-size:8px;letter-spacing:0.22em;text-transform:uppercase;color:var(--green);margin-top:16px;display:block;}
.spec-row{display:flex;justify-content:space-between;align-items:baseline;padding:10px 0;border-bottom:1px solid var(--line2);gap:12px;}
.spec-row:first-child{border-top:1px solid var(--line2)}
.sk{font-size:8px;letter-spacing:0.18em;text-transform:uppercase;color:var(--dim);flex-shrink:0}
.sv{font-family:var(--ser);font-size:14px;text-align:right;color:var(--ink);line-height:1.3}
.sv.orange{color:var(--orange)}
.sv.blue{color:var(--blue)}
.sv.green{color:var(--green)}

/* PROTOCOL */
.protocol-strip{display:flex;align-items:stretch;overflow:hidden}
.proto-cell{flex:1;padding:28px 32px;border-right:1px solid var(--line2)}
.proto-cell:last-child{border-right:none}
.proto-num{font-size:8px;letter-spacing:0.22em;text-transform:uppercase;color:var(--dim);margin-bottom:12px}
.proto-title{font-family:var(--ser);font-style:italic;font-size:18px;color:var(--ink);margin-bottom:8px;line-height:1.2}
.proto-desc{font-size:11px;line-height:1.75;color:var(--mid)}
.proto-cell:nth-child(1) .proto-title{color:var(--orange)}
.proto-cell:nth-child(2) .proto-title{color:var(--blue)}
.proto-cell:nth-child(3) .proto-title{color:var(--green)}
.proto-cell:nth-child(4) .proto-title{color:var(--orange)}

/* ACCESS */
.access-section{display:grid;grid-template-columns:1fr 1fr}
.acol{padding:56px 48px}
.acol+.acol{border-left:1px solid var(--line2)}
.sec-head{font-size:8px;letter-spacing:0.25em;text-transform:uppercase;color:var(--dim);padding-bottom:14px;margin-bottom:28px;border-bottom:1px solid var(--line2);display:flex;justify-content:space-between;align-items:center;}
.sec-head .open{color:var(--green)}
.tabs{display:flex;margin-bottom:28px;border-bottom:1px solid var(--line2)}
.ftab{font-family:var(--mono);font-size:8px;letter-spacing:0.18em;text-transform:uppercase;padding:9px 20px 9px 0;margin-right:24px;border:none;border-bottom:2px solid transparent;background:transparent;color:var(--dim);cursor:pointer;margin-bottom:-1px;transition:color 0.12s,border-color 0.12s;}
.ftab.on{color:var(--orange);border-bottom-color:var(--orange)}
.tpanel{display:none}
.tpanel.on{display:block}
.form-note{font-family:var(--ser);font-style:italic;font-size:14px;line-height:1.75;color:var(--mid);margin-bottom:28px}
.fg{margin-bottom:20px}
.fl{display:block;font-size:8px;letter-spacing:0.2em;text-transform:uppercase;color:var(--dim);margin-bottom:7px}
.fi,.fta{width:100%;background:transparent;border:none;border-bottom:1px solid var(--line2);padding:8px 0;font-family:var(--mono);font-size:11px;font-weight:400;color:var(--ink);outline:none;border-radius:0;-webkit-appearance:none;transition:border-color 0.12s;}
.fi:focus,.fta:focus{border-color:var(--blue)}
.fi::placeholder,.fta::placeholder{color:var(--dim)}
.fta{resize:none;height:52px}
.btn{display:inline-flex;align-items:center;gap:12px;background:var(--orange);color:#fff;border:none;padding:11px 22px;font-family:var(--mono);font-size:8px;letter-spacing:0.22em;text-transform:uppercase;cursor:pointer;font-weight:700;transition:background 0.12s;margin-top:8px;}
.btn:hover{background:var(--orange2)}
.btn:disabled{opacity:0.6;cursor:not-allowed}
.ok{display:none;padding:28px 0}
.ok.on{display:block}
.ok-tag{font-size:8px;letter-spacing:0.22em;text-transform:uppercase;color:var(--green);margin-bottom:10px}
.ok-msg{font-family:var(--ser);font-style:italic;font-size:22px;line-height:1.35;color:var(--ink)}
.err-msg{font-size:11px;color:var(--orange);margin-top:8px;display:none}
.err-msg.on{display:block}

/* EVENT CARD */
.ecard{border:1px solid var(--line2);margin-bottom:24px;overflow:hidden}
.ecard-head{padding:20px 24px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line2);background:var(--blue);}
.ev-num{font-family:var(--ser);font-style:italic;font-size:40px;color:#fff;line-height:1;font-weight:400}
.ev-title{font-family:var(--ser);font-size:14px;color:rgba(255,255,255,0.65)}
.ecard-status{font-size:8px;letter-spacing:0.2em;text-transform:uppercase;color:#fff;padding:4px 10px;border:1px solid rgba(255,255,255,0.3);}
.er{display:flex;justify-content:space-between;align-items:baseline;padding:10px 24px;border-bottom:1px solid var(--line2)}
.er:last-child{border-bottom:none}
.ek{font-size:8px;letter-spacing:0.15em;text-transform:uppercase;color:var(--dim)}
.ev-val{font-family:var(--ser);font-size:13px;color:var(--ink)}
.ev-val.alert{color:var(--orange)}
.ev-val.green{color:var(--green)}

/* ARCHIVE */
.arc{display:flex;justify-content:space-between;align-items:baseline;padding:10px 0;border-bottom:1px solid var(--line2)}
.arc:first-child{border-top:1px solid var(--line2)}
.arc-k{font-size:8px;letter-spacing:0.14em;text-transform:uppercase;color:var(--dim)}
.arc-v{font-family:var(--ser);font-style:italic;font-size:13px;color:var(--dim)}
.arc-v.cur{color:var(--ink);font-style:normal}

/* FOOTER */
footer{display:flex;align-items:stretch;height:44px;border-top:1px solid var(--line2)}
.foot-seg{display:flex;align-items:center;padding:0 24px;border-right:1px solid var(--line2);font-size:8px;letter-spacing:0.15em;text-transform:uppercase;color:var(--dim);text-decoration:none;transition:color 0.12s;}
.foot-seg:hover{color:var(--ink)}
.foot-seg:last-child{border-right:none;margin-left:auto}

/* MOBILE */
@media(max-width:768px){
  .nav-center{display:none}
  .hero{grid-template-columns:1fr}
  .hero-r{display:none}
  .hero-l{padding:40px 24px 48px}
  .mission-brief{grid-template-columns:1fr}
  .brief-index{display:none}
  .brief-col{padding:40px 24px;border-right:none;border-bottom:1px solid var(--line2)}
  .protocol-strip{flex-direction:column}
  .proto-cell{border-right:none;border-bottom:1px solid var(--line2)}
  .access-section{grid-template-columns:1fr}
  .acol+.acol{border-left:none;border-top:1px solid var(--line2)}
  .acol{padding:40px 24px}
  .data-row{flex-wrap:wrap}
  .data-cell{padding:12px 16px 12px 0;margin-right:16px}
  footer{flex-wrap:wrap;height:auto}
  .foot-seg{padding:12px 16px;border-bottom:1px solid var(--line2)}
  .foot-seg:last-child{margin-left:0}
  h1{font-size:clamp(44px,12vw,72px)}
}
```

- [ ] **Step 3: Commit**

```bash
git add src/data/expedition.ts src/styles/global.css
git commit -m "feat: add expedition data config and global styles"
```

---

## Task 3: Validation Library (TDD)

**Files:**
- Create: `tests/validation.test.ts`
- Create: `src/lib/validation.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/validation.test.ts
import { describe, it, expect } from 'vitest'
import { validatePhone, validateEmail, validateName } from '../src/lib/validation'

describe('validatePhone', () => {
  it('normalizes a valid US number', () => {
    expect(validatePhone('+1 (310) 555-0100')).toBe('13105550100')
  })
  it('normalizes an international number', () => {
    expect(validatePhone('+44 20 7946 0958')).toBe('442079460958')
  })
  it('handles number without country code', () => {
    expect(validatePhone('3105550100')).toBe('3105550100')
  })
  it('both representations of the same US number normalize identically', () => {
    expect(validatePhone('+13105550100')).toBe(validatePhone('13105550100'))
  })
  it('throws for a number that is too short', () => {
    expect(() => validatePhone('123456')).toThrow('Invalid phone number')
  })
  it('throws for a number that is too long', () => {
    expect(() => validatePhone('1234567890123456')).toThrow('Invalid phone number')
  })
  it('throws for a non-numeric string', () => {
    expect(() => validatePhone('not-a-phone')).toThrow('Invalid phone number')
  })
})

describe('validateEmail', () => {
  it('returns a lowercased trimmed email', () => {
    expect(validateEmail('  Hello@Example.COM  ')).toBe('hello@example.com')
  })
  it('returns null for empty string', () => {
    expect(validateEmail('')).toBeNull()
  })
  it('returns null for undefined', () => {
    expect(validateEmail(undefined)).toBeNull()
  })
  it('returns null for null', () => {
    expect(validateEmail(null)).toBeNull()
  })
  it('returns null for whitespace-only string', () => {
    expect(validateEmail('   ')).toBeNull()
  })
  it('throws for an invalid email format', () => {
    expect(() => validateEmail('bad@')).toThrow('Invalid email')
  })
  it('throws for missing @', () => {
    expect(() => validateEmail('notanemail.com')).toThrow('Invalid email')
  })
})

describe('validateName', () => {
  it('returns a trimmed name', () => {
    expect(validateName('  Ada Lovelace  ')).toBe('Ada Lovelace')
  })
  it('throws for an empty string', () => {
    expect(() => validateName('')).toThrow('Name is required')
  })
  it('throws for a whitespace-only string', () => {
    expect(() => validateName('   ')).toThrow('Name is required')
  })
  it('accepts a name of exactly 100 characters', () => {
    const name = 'a'.repeat(100)
    expect(validateName(name)).toBe(name)
  })
  it('throws for a name of 101 characters', () => {
    expect(() => validateName('a'.repeat(101))).toThrow('Name too long')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- tests/validation.test.ts
```

Expected: FAIL — `Cannot find module '../src/lib/validation'`

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/validation.ts

/**
 * Strips non-digits and validates length 7–15.
 * Returns the normalized digit string (e.g. "13105550100").
 * Note: does not enforce country code. "+13105550100" and "13105550100" both
 * normalize to "13105550100" — consistent for deduplication purposes.
 */
export const validatePhone = (raw: string): string => {
  const digits = raw.replace(/\D/g, '')
  if (digits.length < 7 || digits.length > 15) throw new Error('Invalid phone number')
  return digits
}

/**
 * Returns lowercased trimmed email, or null when not provided.
 * null is stored in the DB (not empty string).
 */
export const validateEmail = (raw: string | undefined | null): string | null => {
  if (!raw || !raw.trim()) return null
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) throw new Error('Invalid email')
  return raw.trim().toLowerCase()
}

/**
 * Returns trimmed name. Throws if blank or over 100 chars.
 */
export const validateName = (raw: string): string => {
  const name = raw.trim()
  if (!name) throw new Error('Name is required')
  if (name.length > 100) throw new Error('Name too long')
  return name
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- tests/validation.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/validation.ts tests/validation.test.ts
git commit -m "feat: add validation library with tests"
```

---

## Task 4: Supabase Client + DB Schema

**Files:**
- Create: `src/lib/supabase.ts`
- Create: `supabase/migrations/001_initial.sql`

- [ ] **Step 1: Create src/lib/supabase.ts**

```typescript
// src/lib/supabase.ts
// Thin wrapper — no business logic here.
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.SUPABASE_URL
const supabaseKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars')
}

export const supabase = createClient(supabaseUrl, supabaseKey)
```

- [ ] **Step 2: Create supabase/migrations/001_initial.sql**

```sql
-- Run this in the Supabase dashboard: SQL Editor → New query → paste → Run
-- Project: create a new project at supabase.com for TEC

-- Signal list: one entry per phone per volume
CREATE TABLE signal_list (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       text NOT NULL,
  name        text NOT NULL,
  email       text,                              -- NULL when not provided
  volume      int  NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (phone, volume)
);

-- Applications: one per phone per volume
CREATE TABLE applications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  phone       text NOT NULL,
  email       text,                              -- NULL when not provided
  referral    text,
  experience  text,
  volume      int  NOT NULL,
  status      text NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at  timestamptz DEFAULT now(),
  UNIQUE (phone, volume)
);

-- Enable RLS on both tables.
-- The service role key bypasses RLS by default — no policies needed.
-- The anon key has no access.
ALTER TABLE signal_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
```

- [ ] **Step 3: Run the migration**

Go to supabase.com → your TEC project → SQL Editor → paste the contents of `001_initial.sql` → Run.

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase.ts supabase/migrations/001_initial.sql
git commit -m "feat: add Supabase client and DB migration"
```

---

## Task 5: Rate Limiting Library (TDD)

**Files:**
- Create: `tests/ratelimit.test.ts`
- Create: `src/lib/ratelimit.ts`

The rate limiter is a pure function that accepts an injectable KV client (for testability). It uses KV's `incr` + `expire` — no time injection needed since window expiry is handled by KV TTL.

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/ratelimit.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkRateLimit, type KVClient } from '../src/lib/ratelimit'

const makeKV = (incrValues: number[], failGet = false): KVClient => {
  let call = 0
  return {
    incr: vi.fn(async () => {
      const val = incrValues[call] ?? incrValues[incrValues.length - 1]
      call++
      return val
    }),
    expire: vi.fn(async () => {}),
  }
}

const makeFailKV = (): KVClient => ({
  incr: vi.fn(async () => { throw new Error('KV unavailable') }),
  expire: vi.fn(async () => { throw new Error('KV unavailable') }),
})

describe('checkRateLimit', () => {
  it('allows the first request (count = 1)', async () => {
    const kv = makeKV([1])
    expect(await checkRateLimit(kv, 'signal', '1.2.3.4')).toBe(true)
  })

  it('allows the fifth request (count = 5)', async () => {
    const kv = makeKV([5])
    expect(await checkRateLimit(kv, 'signal', '1.2.3.4')).toBe(true)
  })

  it('blocks the sixth request (count = 6)', async () => {
    const kv = makeKV([6])
    expect(await checkRateLimit(kv, 'signal', '1.2.3.4')).toBe(false)
  })

  it('sets expiry on the first request', async () => {
    const kv = makeKV([1])
    await checkRateLimit(kv, 'signal', '1.2.3.4')
    expect(kv.expire).toHaveBeenCalledWith('ratelimit:signal:1.2.3.4', 3600)
  })

  it('does not set expiry on subsequent requests', async () => {
    const kv = makeKV([2])
    await checkRateLimit(kv, 'signal', '1.2.3.4')
    expect(kv.expire).not.toHaveBeenCalled()
  })

  it('uses independent buckets per endpoint', async () => {
    const kv = makeKV([6, 1]) // signal bucket exhausted, apply bucket fresh
    const signalBlocked = await checkRateLimit(kv, 'signal', '1.2.3.4')
    const applyAllowed = await checkRateLimit(kv, 'apply', '1.2.3.4')
    expect(signalBlocked).toBe(false)
    expect(applyAllowed).toBe(true)
    // Verify the keys are different
    expect((kv.incr as ReturnType<typeof vi.fn>).mock.calls[0][0]).toBe('ratelimit:signal:1.2.3.4')
    expect((kv.incr as ReturnType<typeof vi.fn>).mock.calls[1][0]).toBe('ratelimit:apply:1.2.3.4')
  })

  it('allows the request when KV is unavailable (fail open)', async () => {
    const kv = makeFailKV()
    expect(await checkRateLimit(kv, 'signal', '1.2.3.4')).toBe(true)
  })

  it('allows a previously-blocked IP after the window resets (simulated by count returning 1)', async () => {
    // Window reset is simulated by KV returning count=1 (key expired and re-created)
    const kv = makeKV([1])
    expect(await checkRateLimit(kv, 'signal', '1.2.3.4')).toBe(true)
    expect(kv.expire).toHaveBeenCalled() // confirms key was fresh
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- tests/ratelimit.test.ts
```

Expected: FAIL — `Cannot find module '../src/lib/ratelimit'`

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/ratelimit.ts

export interface KVClient {
  incr(key: string): Promise<number>
  expire(key: string, seconds: number): Promise<void>
}

const LIMIT = 5
const WINDOW_SECONDS = 3600

/**
 * Checks and increments the rate limit for a given endpoint + IP combination.
 * Uses KV TTL for window management — no time injection needed.
 * Fails open if KV is unavailable (throws).
 *
 * @param kv      - Injectable KV client (use @vercel/kv in production, mock in tests)
 * @param endpoint - Route name, e.g. 'signal' or 'apply'
 * @param ip      - Client IP address
 * @returns true if the request is allowed, false if rate limit exceeded
 */
export async function checkRateLimit(
  kv: KVClient,
  endpoint: string,
  ip: string,
): Promise<boolean> {
  try {
    const key = `ratelimit:${endpoint}:${ip}`
    const count = await kv.incr(key)
    if (count === 1) {
      // First request in window — set TTL
      await kv.expire(key, WINDOW_SECONDS)
    }
    return count <= LIMIT
  } catch {
    // KV unavailable — fail open (availability > security for a small club)
    return true
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- tests/ratelimit.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ratelimit.ts tests/ratelimit.test.ts
git commit -m "feat: add rate limiting library with tests"
```

---

## Task 6: Signal API Route (TDD)

**Files:**
- Create: `tests/signal.test.ts`
- Create: `src/pages/api/signal.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/signal.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies before importing the handler
vi.mock('../src/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

vi.mock('../src/lib/ratelimit', () => ({
  checkRateLimit: vi.fn(async () => true), // allow by default
}))

import { POST } from '../src/pages/api/signal'
import { supabase } from '../src/lib/supabase'
import { checkRateLimit } from '../src/lib/ratelimit'
import { currentExpedition } from '../src/data/expedition'

const makeRequest = (body: object, headers: Record<string, string> = {}) =>
  new Request('http://localhost/api/signal', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': '1.2.3.4',
      ...headers,
    },
  })

const mockInsertSuccess = () => {
  ;(supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
    insert: vi.fn().mockResolvedValue({ error: null }),
  })
}

const mockInsertDuplicate = () => {
  ;(supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
    insert: vi.fn().mockResolvedValue({ error: { code: '23505' } }),
  })
}

const mockInsertFailure = () => {
  ;(supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
    insert: vi.fn().mockResolvedValue({ error: { code: 'UNKNOWN', message: 'DB down' } }),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  ;(checkRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue(true)
})

describe('POST /api/signal', () => {
  it('returns 201 for a valid submission', async () => {
    mockInsertSuccess()
    const res = await POST({ request: makeRequest({ phone: '3105550100', name: 'Ada' }) } as any)
    expect(res.status).toBe(201)
  })

  it('returns 400 when phone is missing', async () => {
    const res = await POST({ request: makeRequest({ name: 'Ada' }) } as any)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBeTruthy()
  })

  it('returns 400 when phone is invalid format', async () => {
    const res = await POST({ request: makeRequest({ phone: 'abc', name: 'Ada' }) } as any)
    expect(res.status).toBe(400)
  })

  it('returns 400 when name is missing', async () => {
    const res = await POST({ request: makeRequest({ phone: '3105550100' }) } as any)
    expect(res.status).toBe(400)
  })

  it('returns 409 on duplicate phone+volume submission', async () => {
    mockInsertDuplicate()
    const res = await POST({ request: makeRequest({ phone: '3105550100', name: 'Ada' }) } as any)
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toContain('Already on signal list')
  })

  it('returns 500 on DB failure', async () => {
    mockInsertFailure()
    const res = await POST({ request: makeRequest({ phone: '3105550100', name: 'Ada' }) } as any)
    expect(res.status).toBe(500)
  })

  it('returns 403 when Origin is explicitly a non-matching value', async () => {
    const res = await POST({
      request: makeRequest({ phone: '3105550100', name: 'Ada' }, { Origin: 'https://evil.com' }),
    } as any)
    expect(res.status).toBe(403)
  })

  it('allows requests with no Origin header', async () => {
    mockInsertSuccess()
    const req = new Request('http://localhost/api/signal', {
      method: 'POST',
      body: JSON.stringify({ phone: '3105550100', name: 'Ada' }),
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
    })
    const res = await POST({ request: req } as any)
    expect(res.status).toBe(201)
  })

  it('stamps the current expedition volume regardless of request body', async () => {
    let insertedData: any
    ;(supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
      insert: vi.fn().mockImplementation((data) => {
        insertedData = data
        return Promise.resolve({ error: null })
      }),
    })
    await POST({ request: makeRequest({ phone: '3105550100', name: 'Ada', volume: 99 }) } as any)
    expect(insertedData.volume).toBe(currentExpedition.volume)
    expect(insertedData.volume).not.toBe(99)
  })

  it('returns 429 when rate limit is exceeded', async () => {
    ;(checkRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue(false)
    const res = await POST({ request: makeRequest({ phone: '3105550100', name: 'Ada' }) } as any)
    expect(res.status).toBe(429)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- tests/signal.test.ts
```

Expected: FAIL — `Cannot find module '../src/pages/api/signal'`

- [ ] **Step 3: Write the implementation**

```typescript
// src/pages/api/signal.ts
import type { APIRoute } from 'astro'
import { supabase } from '../../lib/supabase'
import { checkRateLimit } from '../../lib/ratelimit'
import { validatePhone, validateEmail, validateName } from '../../lib/validation'
import { currentExpedition } from '../../data/expedition'
import { kv } from '@vercel/kv'

const ALLOWED_ORIGIN = 'https://topologyexploration.club'

const json = (body: object, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

export const POST: APIRoute = async ({ request }) => {
  // Origin check (defense-in-depth — absent/null origin is allowed)
  const origin = request.headers.get('origin')
  if (origin && origin !== ALLOWED_ORIGIN) {
    return json({ error: 'Forbidden' }, 403)
  }

  // Rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  const allowed = await checkRateLimit(kv, 'signal', ip)
  if (!allowed) return json({ error: 'Too many requests' }, 429)

  // Parse + validate
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  let phone: string, name: string, email: string | null
  try {
    phone = validatePhone(String(body.phone ?? ''))
    name  = validateName(String(body.name ?? ''))
    email = validateEmail(body.email as string | undefined)
  } catch (err) {
    return json({ error: (err as Error).message }, 400)
  }

  // Insert — volume always from server config
  const { error } = await supabase.from('signal_list').insert({
    phone,
    name,
    email,
    volume: currentExpedition.volume,
  })

  if (error) {
    if (error.code === '23505') {
      return json({ error: 'Already on signal list for this expedition' }, 409)
    }
    return json({ error: 'Server error' }, 500)
  }

  return new Response(null, { status: 201 })
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- tests/signal.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/api/signal.ts tests/signal.test.ts
git commit -m "feat: add signal API route with tests"
```

---

## Task 7: Apply API Route (TDD)

**Files:**
- Create: `tests/apply.test.ts`
- Create: `src/pages/api/apply.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/apply.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../src/lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

vi.mock('../src/lib/ratelimit', () => ({
  checkRateLimit: vi.fn(async () => true),
}))

import { POST } from '../src/pages/api/apply'
import { supabase } from '../src/lib/supabase'
import { checkRateLimit } from '../src/lib/ratelimit'
import { currentExpedition } from '../src/data/expedition'

const makeRequest = (body: object, headers: Record<string, string> = {}) =>
  new Request('http://localhost/api/apply', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': '1.2.3.4',
      ...headers,
    },
  })

const mockInsertSuccess = () => {
  ;(supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
    insert: vi.fn().mockResolvedValue({ error: null }),
  })
}

const mockInsertDuplicate = () => {
  ;(supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
    insert: vi.fn().mockResolvedValue({ error: { code: '23505' } }),
  })
}

const mockInsertFailure = () => {
  ;(supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
    insert: vi.fn().mockResolvedValue({ error: { code: 'UNKNOWN' } }),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  ;(checkRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue(true)
})

describe('POST /api/apply', () => {
  it('returns 201 for a valid submission', async () => {
    mockInsertSuccess()
    const res = await POST({ request: makeRequest({ name: 'Ada', phone: '3105550100' }) } as any)
    expect(res.status).toBe(201)
  })

  it('returns 400 when name is missing', async () => {
    const res = await POST({ request: makeRequest({ phone: '3105550100' }) } as any)
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBeTruthy()
  })

  it('returns 400 when phone is missing', async () => {
    const res = await POST({ request: makeRequest({ name: 'Ada' }) } as any)
    expect(res.status).toBe(400)
  })

  it('returns 400 when phone format is invalid', async () => {
    const res = await POST({ request: makeRequest({ name: 'Ada', phone: 'abc' }) } as any)
    expect(res.status).toBe(400)
  })

  it('returns 409 on duplicate application', async () => {
    mockInsertDuplicate()
    const res = await POST({ request: makeRequest({ name: 'Ada', phone: '3105550100' }) } as any)
    expect(res.status).toBe(409)
    expect((await res.json()).error).toContain('Application already submitted')
  })

  it('returns 500 on DB failure', async () => {
    mockInsertFailure()
    const res = await POST({ request: makeRequest({ name: 'Ada', phone: '3105550100' }) } as any)
    expect(res.status).toBe(500)
  })

  it('returns 403 when Origin is explicitly non-matching', async () => {
    const res = await POST({
      request: makeRequest({ name: 'Ada', phone: '3105550100' }, { Origin: 'https://evil.com' }),
    } as any)
    expect(res.status).toBe(403)
  })

  it('allows requests with no Origin header', async () => {
    mockInsertSuccess()
    const req = new Request('http://localhost/api/apply', {
      method: 'POST',
      body: JSON.stringify({ name: 'Ada', phone: '3105550100' }),
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
    })
    const res = await POST({ request: req } as any)
    expect(res.status).toBe(201)
  })

  it('stamps the current expedition volume regardless of request body', async () => {
    let insertedData: any
    ;(supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
      insert: vi.fn().mockImplementation((data) => {
        insertedData = data
        return Promise.resolve({ error: null })
      }),
    })
    await POST({ request: makeRequest({ name: 'Ada', phone: '3105550100', volume: 99 }) } as any)
    expect(insertedData.volume).toBe(currentExpedition.volume)
  })

  it('returns 429 when rate limit is exceeded', async () => {
    ;(checkRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue(false)
    const res = await POST({ request: makeRequest({ name: 'Ada', phone: '3105550100' }) } as any)
    expect(res.status).toBe(429)
  })

  it('inserts status as pending', async () => {
    let insertedData: any
    ;(supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
      insert: vi.fn().mockImplementation((data) => {
        insertedData = data
        return Promise.resolve({ error: null })
      }),
    })
    await POST({ request: makeRequest({ name: 'Ada', phone: '3105550100' }) } as any)
    expect(insertedData.status).toBe('pending')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- tests/apply.test.ts
```

Expected: FAIL — `Cannot find module '../src/pages/api/apply'`

- [ ] **Step 3: Write the implementation**

```typescript
// src/pages/api/apply.ts
import type { APIRoute } from 'astro'
import { supabase } from '../../lib/supabase'
import { checkRateLimit } from '../../lib/ratelimit'
import { validatePhone, validateEmail, validateName } from '../../lib/validation'
import { currentExpedition } from '../../data/expedition'
import { kv } from '@vercel/kv'

const ALLOWED_ORIGIN = 'https://topologyexploration.club'

const json = (body: object, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

export const POST: APIRoute = async ({ request }) => {
  const origin = request.headers.get('origin')
  if (origin && origin !== ALLOWED_ORIGIN) {
    return json({ error: 'Forbidden' }, 403)
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  const allowed = await checkRateLimit(kv, 'apply', ip)
  if (!allowed) return json({ error: 'Too many requests' }, 429)

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  let name: string, phone: string, email: string | null
  try {
    name  = validateName(String(body.name ?? ''))
    phone = validatePhone(String(body.phone ?? ''))
    email = validateEmail(body.email as string | undefined)
  } catch (err) {
    return json({ error: (err as Error).message }, 400)
  }

  const { error } = await supabase.from('applications').insert({
    name,
    phone,
    email,
    referral:   body.referral   ? String(body.referral)   : null,
    experience: body.experience ? String(body.experience) : null,
    volume: currentExpedition.volume,
    status: 'pending',
  })

  if (error) {
    if (error.code === '23505') {
      return json({ error: 'Application already submitted for this expedition' }, 409)
    }
    return json({ error: 'Server error' }, 500)
  }

  return new Response(null, { status: 201 })
}
```

- [ ] **Step 4: Run all tests**

```bash
npm test
```

Expected: All tests PASS (validation, signal, apply, ratelimit).

- [ ] **Step 5: Commit**

```bash
git add src/pages/api/apply.ts tests/apply.test.ts
git commit -m "feat: add apply API route with tests"
```

---

## Task 8: Base Layout + Nav

**Files:**
- Create: `src/layouts/Base.astro`
- Create: `src/components/Nav.astro`

- [ ] **Step 1: Create src/layouts/Base.astro**

```astro
---
// src/layouts/Base.astro
import '../styles/global.css'
import '@fontsource/space-mono/400.css'
import '@fontsource/space-mono/700.css'
import '@fontsource/space-mono/400-italic.css'
import '@fontsource/eb-garamond/400.css'
import '@fontsource/eb-garamond/500.css'
import '@fontsource/eb-garamond/400-italic.css'
import '@fontsource/eb-garamond/500-italic.css'

interface Props {
  title?: string
  description?: string
}

const {
  title = 'Topology Exploration Club',
  description = 'Topology Exploration Club — An expedition organization conducting systematic surveys of vinyl topology. Monthly excursions. Los Angeles.',
} = Astro.props
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content={description} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content="Systematic surveys of vinyl topology. Monthly expeditions. Los Angeles." />
    <meta property="og:url" content="https://topologyexploration.club" />
    <title>{title}</title>
  </head>
  <body>
    <slot />
  </body>
</html>
```

- [ ] **Step 2: Create src/components/Nav.astro**

```astro
---
// src/components/Nav.astro
---

<nav>
  <div class="nav-org">T·E·C</div>
  <div class="nav-center">Topology Exploration Club — Est. 2025 — Los Angeles, CA</div>
  <ul class="nav-links">
    <li><a href="#brief">Mission brief</a></li>
    <li><a href="#protocol">Protocol</a></li>
    <li class="cta"><a href="#access">Vol. 03 — Apply</a></li>
  </ul>
</nav>
```

- [ ] **Step 3: Commit**

```bash
git add src/layouts/Base.astro src/components/Nav.astro
git commit -m "feat: add base layout and nav component"
```

---

## Task 9: Hero Component

**Files:**
- Create: `src/components/Hero.astro`

- [ ] **Step 1: Create src/components/Hero.astro**

```astro
---
// src/components/Hero.astro
// Images live in src/assets/ (not public/) so Astro's Image component can optimize them.
import { Image } from 'astro:assets'
import { currentExpedition } from '../data/expedition'
import instrumentImg from '../assets/vol03-instrument.jpg'
import expeditionistImg from '../assets/vol03-expeditionist.jpg'
---

<section class="hero">
  <div class="hero-l">
    <div>
      <div class="doc-header">
        <div class="doc-tag">Document type</div>
        <div class="doc-tag orange">Mission brief</div>
        <div class="doc-tag green">Vol. {currentExpedition.volume.toString().padStart(2, '0')} — Active</div>
        <div class="doc-tag blue">{currentExpedition.location.split(',')[0]}, CA</div>
      </div>
      <h1>
        Top<span class="it">ology</span><br />
        Explor<span class="it orange">ation</span><br />
        <span class="it blue">Club</span>
      </h1>
    </div>
    <div class="hero-lower">
      <div class="mission-statement">
        An expedition organization conducting systematic surveys of vinyl topology. Recruits undergo field training in sustained attentive listening, mess kit operation, and field report documentation. Monthly excursions. Los Angeles.
      </div>
      <div class="data-row">
        <div class="data-cell">
          <div class="dc-val orange" style="font-style:italic">{currentExpedition.volume.toString().padStart(2, '0')}</div>
          <div class="dc-label">Current volume</div>
        </div>
        <div class="data-cell">
          <div class="dc-val blue">{currentExpedition.clearancesRemaining.toString().padStart(2, '0')}</div>
          <div class="dc-label">Clearances remaining</div>
        </div>
        <div class="data-cell">
          <div class="dc-val green" style="font-size:18px;padding-top:8px">Monthly</div>
          <div class="dc-label">Expedition cadence</div>
        </div>
        <div class="data-cell">
          <div class="dc-val" style="font-size:18px;padding-top:8px">T−24h</div>
          <div class="dc-label">Coordinates via SMS</div>
        </div>
      </div>
    </div>
  </div>

  <div class="hero-r">
    <div class="hero-photo-wrap" style="flex:1">
      <Image src={instrumentImg} alt="Turntable cartridge — survey instrument" loading="eager" />
      <div class="photo-overlay"></div>
      <div class="photo-label">
        <div class="photo-label-l">Survey instrument<br /><span style="color:var(--orange);display:block">Stylus — specimen contact point</span></div>
        <div class="photo-label-r">Vol. {currentExpedition.volume.toString().padStart(2, '0')}</div>
      </div>
    </div>
    <div class="hero-photo-wrap" style="flex:1">
      <Image src={expeditionistImg} alt="Expeditionist at survey station" loading="lazy" />
      <div class="photo-overlay"></div>
      <div class="photo-label">
        <div class="photo-label-l">Expeditionist at survey station<br /><span style="color:var(--blue);display:block">Attire: gorpcore</span></div>
        <div class="photo-label-r">Vol. {currentExpedition.volume.toString().padStart(2, '0')}</div>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Hero.astro
git commit -m "feat: add hero component with optimized images"
```

---

## Task 10: MissionBrief Component

**Files:**
- Create: `src/components/MissionBrief.astro`

- [ ] **Step 1: Create src/components/MissionBrief.astro**

```astro
---
// src/components/MissionBrief.astro
---

<section id="brief" class="mission-brief">
  <div class="brief-index">
    <div class="brief-num">01</div>
    <div class="brief-vert">Mission brief</div>
  </div>
  <div class="brief-col">
    <div class="col-head">Organization / mandate</div>
    <h2>What<br /><span class="it">we do</span></h2>
    <div class="body-text">
      <p>TEC conducts monthly expeditions into the topography of recorded sound. The terrain is the vinyl groove — a physical landscape of peaks, valleys, and micro-structures that the stylus reads as signal.</p>
      <p>Expeditionists arrive equipped with a <strong>mess kit</strong> — plate, bowl, utensils, cup — for consuming field rations during the survey. Each member submits a <strong>field report</strong> documenting their sensory observations of the terrain traversed.</p>
      <p>This is not passive listening. This is fieldwork.</p>
    </div>
    <div class="field-dispatch">
      "We're going to explore some peaks and valleys on Saturday with the help of two really small and hard crystals. I'll make some food and drinks for the voyage. If you are so equipped, please bring a mess kit in which you may receive your rations. You'll eat and listen attentively, recording each perceptible sensation in your Field Report."
      <span class="dispatch-meta">Dispatch — Vol. 01 — Feb 2025 — Expedition Leader</span>
    </div>
  </div>
  <div class="brief-col">
    <div class="col-head">Expedition parameters</div>
    <div>
      <div class="spec-row"><span class="sk">Organization type</span><span class="sv">Expedition / field research</span></div>
      <div class="spec-row"><span class="sk">Survey subject</span><span class="sv blue">Vinyl groove topology</span></div>
      <div class="spec-row"><span class="sk">Instrument</span><span class="sv">Turntable · phono cartridge · stylus</span></div>
      <div class="spec-row"><span class="sk">Sonic register</span><span class="sv green">Brazilian · house · electronics</span></div>
      <div class="spec-row"><span class="sk">Departure condition</span><span class="sv">Solar descent (sunset)</span></div>
      <div class="spec-row"><span class="sk">Site type</span><span class="sv">Private location — undisclosed until T−24h</span></div>
      <div class="spec-row"><span class="sk">Required equipment</span><span class="sv orange">Mess kit (plate · bowl · utensils · cup)</span></div>
      <div class="spec-row"><span class="sk">Deliverable</span><span class="sv">Field report — sensory log</span></div>
      <div class="spec-row"><span class="sk">Attire</span><span class="sv">Gorpcore</span></div>
      <div class="spec-row"><span class="sk">Access</span><span class="sv orange">Reviewed · approval required</span></div>
      <div class="spec-row"><span class="sk">Cadence</span><span class="sv">Monthly</span></div>
      <div class="spec-row"><span class="sk">Cost</span><span class="sv">No charge</span></div>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/MissionBrief.astro
git commit -m "feat: add mission brief component"
```

---

## Task 11: Protocol Component

**Files:**
- Create: `src/components/Protocol.astro`

- [ ] **Step 1: Create src/components/Protocol.astro**

```astro
---
// src/components/Protocol.astro
---

<section id="protocol" class="protocol-strip">
  <div class="proto-cell">
    <div class="proto-num">Protocol — 01</div>
    <div class="proto-title">Arrival &amp; kit inspection</div>
    <div class="proto-desc">Expeditionists arrive with mess kit. Equipment verified. Rations issued at survey station. Gorpcore attire confirmed.</div>
  </div>
  <div class="proto-cell">
    <div class="proto-num">Protocol — 02</div>
    <div class="proto-title">Survey commencement</div>
    <div class="proto-desc">Stylus makes contact with terrain at solar descent. Two small hard crystals begin reading the groove topology. Active listening begins.</div>
  </div>
  <div class="proto-cell">
    <div class="proto-num">Protocol — 03</div>
    <div class="proto-title">Field documentation</div>
    <div class="proto-desc">Each expeditionist maintains a sensory log throughout the survey. Perceptible sensations recorded in real time. Cross-referencing permitted.</div>
  </div>
  <div class="proto-cell">
    <div class="proto-num">Protocol — 04</div>
    <div class="proto-title">Field report submission</div>
    <div class="proto-desc">Written report submitted post-expedition. Documents terrain encountered, sensory observations, and notable topological features. Due date assigned per expedition.</div>
  </div>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Protocol.astro
git commit -m "feat: add protocol component"
```

---

## Task 12: ExpeditionCard + Archive Components

**Files:**
- Create: `src/components/ExpeditionCard.astro`
- Create: `src/components/Archive.astro`

- [ ] **Step 1: Create src/components/ExpeditionCard.astro**

```astro
---
// src/components/ExpeditionCard.astro
import { currentExpedition } from '../data/expedition'

const vol = currentExpedition.volume.toString().padStart(2, '0')
---

<div class="ecard">
  <div class="ecard-head">
    <div>
      <div class="ev-num">{vol}</div>
      <div class="ev-title">{currentExpedition.name}</div>
    </div>
    <div class="ecard-status">{currentExpedition.status}</div>
  </div>
  <div>
    <div class="er"><span class="ek">Survey zone</span><span class="ev-val">{currentExpedition.location}</span></div>
    <div class="er"><span class="ek">Coordinates</span><span class="ev-val">{currentExpedition.coordinates} — disclosed T−24h</span></div>
    <div class="er"><span class="ek">Departure</span><span class="ev-val">{currentExpedition.departure}</span></div>
    <div class="er"><span class="ek">Clearances remaining</span><span class="ev-val alert">{currentExpedition.clearancesRemaining.toString().padStart(2, '0')}</span></div>
    <div class="er"><span class="ek">Required equipment</span><span class="ev-val">Mess kit</span></div>
    <div class="er"><span class="ek">Deliverable</span><span class="ev-val green">Field report</span></div>
    <div class="er"><span class="ek">Cost</span><span class="ev-val">No charge</span></div>
  </div>
</div>
```

- [ ] **Step 2: Create src/components/Archive.astro**

```astro
---
// src/components/Archive.astro
import { archive } from '../data/expedition'
---

{archive.map((entry) => (
  <div class="arc">
    <span class="arc-k">Vol. {entry.volume.toString().padStart(2, '0')}</span>
    <span class={`arc-v ${entry.active ? 'cur' : ''}`}>
      {entry.date} — {entry.location}{entry.active ? ' · active' : ''}
    </span>
  </div>
))}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ExpeditionCard.astro src/components/Archive.astro
git commit -m "feat: add expedition card and archive components"
```

---

## Task 13: Access Component (Forms)

**Files:**
- Create: `src/components/Access.astro`

This component contains the tabs and both forms. The `<script>` handles tab switching and fetch-based form submission. On success it shows the `.ok` confirmation state. On error it shows an inline `.err-msg`.

- [ ] **Step 1: Create src/components/Access.astro**

```astro
---
// src/components/Access.astro
import ExpeditionCard from './ExpeditionCard.astro'
import Archive from './Archive.astro'
import { currentExpedition } from '../data/expedition'

const vol = currentExpedition.volume.toString().padStart(2, '0')
---

<section class="access-section" id="access">
  <div class="acol">
    <div class="sec-head">
      <span>Recruitment — access protocol</span>
      <span class="open">Vol. {vol} open</span>
    </div>
    <div class="tabs">
      <button class="ftab on" data-tab="notify">Signal list</button>
      <button class="ftab" data-tab="apply">Apply for clearance</button>
    </div>

    <!-- Signal list panel -->
    <div class="tpanel on" id="tp-notify">
      <div id="nf">
        <p class="form-note">Receive advance notice of each expedition by SMS. No other correspondence.</p>
        <div class="fg"><label class="fl">Phone number</label><input class="fi" type="tel" id="n-ph" placeholder="+1 000 000 0000" /></div>
        <div class="fg"><label class="fl">Name</label><input class="fi" type="text" id="n-nm" placeholder="—" /></div>
        <div class="fg"><label class="fl">Email — optional, backup only</label><input class="fi" type="email" id="n-em" placeholder="—" /></div>
        <button class="btn" id="n-btn">Add to signal list →</button>
        <div class="err-msg" id="n-err"></div>
      </div>
      <div class="ok" id="n-ok">
        <div class="ok-tag">Signal logged</div>
        <div class="ok-msg">You'll receive SMS<br />before next departure.</div>
      </div>
    </div>

    <!-- Application panel -->
    <div class="tpanel" id="tp-apply">
      <div id="rf">
        <p class="form-note">TEC recruits experienced expeditionists. All applications reviewed by expedition leadership. Approval is not guaranteed. Accepted recruits notified by SMS.</p>
        <div class="fg"><label class="fl">Full name</label><input class="fi" type="text" id="r-nm" placeholder="—" /></div>
        <div class="fg"><label class="fl">Phone number</label><input class="fi" type="tel" id="r-ph" placeholder="+1 000 000 0000" /></div>
        <div class="fg"><label class="fl">Email — optional</label><input class="fi" type="email" id="r-em" placeholder="—" /></div>
        <div class="fg"><label class="fl">How you located TEC</label><input class="fi" type="text" id="r-ref" placeholder="—" /></div>
        <div class="fg"><label class="fl">Relevant field experience</label><textarea class="fta" id="r-nt" placeholder="—"></textarea></div>
        <button class="btn" id="r-btn">Submit application →</button>
        <div class="err-msg" id="r-err"></div>
      </div>
      <div class="ok" id="r-ok">
        <div class="ok-tag">Application received — Vol. {vol}</div>
        <div class="ok-msg">Under review.<br />Clearance confirmed by SMS<br />if accepted.</div>
      </div>
    </div>
  </div>

  <div class="acol">
    <div class="sec-head"><span>Active expedition</span></div>
    <ExpeditionCard />
    <p style="font-family:var(--ser);font-style:italic;font-size:13px;color:var(--dim);line-height:1.7;margin-bottom:36px">
      Application does not confirm clearance. Location transmitted by SMS only, T−24h before departure.
    </p>
    <div class="sec-head"><span>Expedition archive</span></div>
    <Archive />
  </div>
</section>

<script>
  // Tab switching
  document.querySelectorAll<HTMLButtonElement>('.ftab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ftab').forEach(t => t.classList.remove('on'))
      document.querySelectorAll('.tpanel').forEach(p => p.classList.remove('on'))
      btn.classList.add('on')
      const panel = document.getElementById('tp-' + btn.dataset.tab)
      if (panel) panel.classList.add('on')
    })
  })

  // Helper: show error message
  function showErr(el: HTMLElement, msg: string) {
    el.textContent = msg
    el.classList.add('on')
  }

  // Helper: reset error
  function clearErr(el: HTMLElement) {
    el.textContent = ''
    el.classList.remove('on')
  }

  // Signal list submission
  const nBtn = document.getElementById('n-btn') as HTMLButtonElement
  nBtn.addEventListener('click', async () => {
    const phone = (document.getElementById('n-ph') as HTMLInputElement).value
    const name  = (document.getElementById('n-nm') as HTMLInputElement).value
    const email = (document.getElementById('n-em') as HTMLInputElement).value
    const errEl = document.getElementById('n-err')!

    clearErr(errEl)
    nBtn.disabled = true

    try {
      const res = await fetch('/api/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name, email }),
      })

      if (res.status === 201) {
        document.getElementById('nf')!.style.display = 'none'
        document.getElementById('n-ok')!.classList.add('on')
        return
      }

      const data = await res.json()
      showErr(errEl, data.error ?? 'Something went wrong. Please try again.')
    } catch {
      showErr(errEl, 'Connection error. Please try again.')
    } finally {
      nBtn.disabled = false
    }
  })

  // Application submission
  const rBtn = document.getElementById('r-btn') as HTMLButtonElement
  rBtn.addEventListener('click', async () => {
    const name     = (document.getElementById('r-nm') as HTMLInputElement).value
    const phone    = (document.getElementById('r-ph') as HTMLInputElement).value
    const email    = (document.getElementById('r-em') as HTMLInputElement).value
    const referral = (document.getElementById('r-ref') as HTMLInputElement).value
    const experience = (document.getElementById('r-nt') as HTMLTextAreaElement).value
    const errEl = document.getElementById('r-err')!

    clearErr(errEl)
    rBtn.disabled = true

    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, referral, experience }),
      })

      if (res.status === 201) {
        document.getElementById('rf')!.style.display = 'none'
        document.getElementById('r-ok')!.classList.add('on')
        return
      }

      const data = await res.json()
      showErr(errEl, data.error ?? 'Something went wrong. Please try again.')
    } catch {
      showErr(errEl, 'Connection error. Please try again.')
    } finally {
      rBtn.disabled = false
    }
  })
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Access.astro
git commit -m "feat: add access component with working form submission"
```

---

## Task 14: Footer + Index Page

**Files:**
- Create: `src/components/Footer.astro`
- Create: `src/pages/index.astro`

- [ ] **Step 1: Create src/components/Footer.astro**

```astro
---
// src/components/Footer.astro
---

<footer>
  <div class="foot-seg">Topology Exploration Club © 2025</div>
  <div class="foot-seg">topologyexploration.club</div>
  <a class="foot-seg" href="https://www.instagram.com/topologyexplorationclub" target="_blank" rel="noopener noreferrer">@topologyexplorationclub</a>
  <a class="foot-seg" href="mailto:hello@topologyexploration.club">Contact expedition leadership</a>
</footer>
```

- [ ] **Step 2: Create src/pages/index.astro**

```astro
---
// src/pages/index.astro
import Base from '../layouts/Base.astro'
import Nav from '../components/Nav.astro'
import Hero from '../components/Hero.astro'
import MissionBrief from '../components/MissionBrief.astro'
import Protocol from '../components/Protocol.astro'
import Access from '../components/Access.astro'
import Footer from '../components/Footer.astro'
---

<Base>
  <Nav />
  <Hero />
  <MissionBrief />
  <Protocol />
  <Access />
  <Footer />
</Base>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Footer.astro src/pages/index.astro
git commit -m "feat: add footer and assemble index page"
```

---

## Task 15: Middleware (Wire Up Rate Limiting)

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Create src/middleware.ts**

```typescript
// src/middleware.ts
import { defineMiddleware } from 'astro:middleware'
import { kv } from '@vercel/kv'
import { checkRateLimit } from './lib/ratelimit'

export const onRequest = defineMiddleware(async ({ request }, next) => {
  const url = new URL(request.url)

  if (url.pathname.startsWith('/api/')) {
    // Extract endpoint name from path, e.g. '/api/signal' → 'signal'
    const endpoint = url.pathname.replace('/api/', '').split('/')[0]
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'

    const allowed = await checkRateLimit(kv, endpoint, ip)
    if (!allowed) {
      return new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }

  return next()
})
```

**Note:** The API routes also call `checkRateLimit` directly (for testability without middleware). This means rate limit `incr` is called twice per request in production. To avoid double-counting, remove the `checkRateLimit` calls from the API route handlers themselves, keeping rate limiting only in middleware. Update `signal.ts` and `apply.ts` to remove the rate limit check and the `kv` import — the middleware handles it.

- [ ] **Step 2: Remove rate limit calls from API routes**

In `src/pages/api/signal.ts`, remove:
```typescript
import { kv } from '@vercel/kv'
// and the rate limit block:
const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
const allowed = await checkRateLimit(kv, 'signal', ip)
if (!allowed) return json({ error: 'Too many requests' }, 429)
```

In `src/pages/api/apply.ts`, remove the same lines (with `'apply'`).

Update the tests (`signal.test.ts`, `apply.test.ts`) to remove the `checkRateLimit` mock and the 429 test case (rate limiting is now tested separately in `ratelimit.test.ts` and `middleware.ts` is not unit-tested).

- [ ] **Step 3: Run all tests**

```bash
npm test
```

Expected: All tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/middleware.ts src/pages/api/signal.ts src/pages/api/apply.ts tests/signal.test.ts tests/apply.test.ts
git commit -m "feat: add middleware, move rate limiting out of route handlers"
```

---

## Task 16: Local Dev + Visual Parity Check

- [ ] **Step 1: Set up local env**

Copy `.env.example` to `.env` and fill in your Supabase and Vercel KV credentials.

```bash
cp .env.example .env
# Edit .env with real values from:
# - supabase.com → your project → Settings → API
# - vercel.com → your project → Storage → KV → .env.local
```

- [ ] **Step 2: Start dev server**

```bash
npm run dev
```

Expected: Astro dev server running at `http://localhost:4321`

- [ ] **Step 3: Visual parity check**

Open `http://localhost:4321` alongside the live site at `https://topologyexploration.club`. Verify:
- [ ] Nav bar layout and links match
- [ ] Hero typography and images match
- [ ] Mission brief section matches (left column text, right column spec rows)
- [ ] Protocol strip matches (4 cells)
- [ ] Access section: both tabs visible, forms render correctly
- [ ] Expedition card data populated from `expedition.ts`
- [ ] Archive list renders from `expedition.ts`
- [ ] Footer links match
- [ ] Mobile layout: resize to 375px wide, verify mobile styles apply

- [ ] **Step 4: Smoke test form submissions**

With the dev server running and `.env` populated:
- Submit the signal list form with a test phone number → verify row appears in Supabase `signal_list` table
- Submit a duplicate → verify "Already on signal list" message appears inline
- Submit the application form → verify row appears in Supabase `applications` table with `status = 'pending'`

- [ ] **Step 5: Run full test suite one final time**

```bash
npm test
```

Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add .env.example  # only commit the example, never .env
git commit -m "feat: complete Astro migration — all tests passing"
```

---

## Task 17: Deploy to Production

- [ ] **Step 1: Add Vercel environment variables**

In the Vercel dashboard → your `topologyexplorationclub` project → Settings → Environment Variables, add:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

Or link the Vercel KV store directly via Vercel dashboard → Storage → connect to project (this auto-populates the KV env vars).

- [ ] **Step 2: Push to main**

```bash
git push origin main
```

Vercel auto-deploys. Monitor the build in the Vercel dashboard.

Expected build output: Astro hybrid build with serverless functions for `/api/signal` and `/api/apply`.

- [ ] **Step 3: Smoke test production**

Visit `https://topologyexploration.club` and verify:
- [ ] Page loads correctly
- [ ] Fonts load (Space Mono, EB Garamond) — no flash of fallback font
- [ ] Images load (hero photos)
- [ ] Signal list form submits successfully → new row in Supabase
- [ ] Application form submits successfully → new row in Supabase

- [ ] **Step 4: Rollback if needed**

If anything is broken: `vercel rollback` from the CLI, or Vercel dashboard → Deployments → select the previous build → Promote to Production.
