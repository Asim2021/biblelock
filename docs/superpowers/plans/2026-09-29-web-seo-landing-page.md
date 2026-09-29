# Web Landing Page & Search Engine Optimization (SEO) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete, ultra-fast, high-converting static web landing page and search engine optimization infrastructure for `bibleunlock.in` with full Schema.org JSON-LD, legal compliance pages, and technical crawler artifacts.

**Architecture:** A lightweight, zero-dependency static HTML5/CSS3/JSON-LD architecture in `web/` that achieves 100/100 Core Web Vitals, sub-0.5s First Contentful Paint, rich Google SERP snippet eligibility (`SoftwareApplication`, `FAQPage`, `Organization`), and automated schema verification via Node.js native test runner.

**Tech Stack:** Semantic HTML5, Vanilla CSS3 (Celestial Dark `#070b09` + Sacred Gold `#f5b800`), Minimal Vanilla JS (<5KB), Schema.org JSON-LD, Node.js `node:test`.

**Spec:** [`docs/superpowers/specs/2026-09-29-web-seo-landing-page-design.md`](file:///d:/My%20Projects/bibleunlock.app/docs/superpowers/specs/2026-09-29-web-seo-landing-page-design.md)

## Global Constraints

- **Canonical Domain:** `https://bibleunlock.in` (all canonical tags, og:url, schema IDs, and sitemap entries must use `https://bibleunlock.in`).
- **Support & Legal Email:** `support@bibleunlock.in`.
- **Search Engine Guidelines:** Exactly one `<h1>` per page, descriptive image `alt` attributes, valid Schema.org JSON-LD format.
- **Design Tokens (1:1 with `src/lib/themeContext.tsx`):**
  - **Celestial Dark (Default):** `--bg-canvas: #0d120f`, `--bg-surface: #141e17`, `--border-main: #202e25`, `--accent-gold: #f5b800`, `--color-success: #5db872`, `--text-primary: #faf9f5`, `--text-secondary: #78a898`.
  - **Parchment Light:** `[data-theme="light"]` `--bg-canvas: #f8f6f0`, `--bg-surface: #ffffff`, `--border-main: #e4dfd3`, `--accent-gold: #d49400`, `--color-success: #2e8c45`, `--text-primary: #1a1f1b`.
  - **Typography:** `EB Garamond` (headlines/scripture) and `Inter` (HUD/UI/body).
- **Core Web Vitals:** Zero client-side framework bloat, non-blocking fonts (`display=swap`), responsive mobile-first layout.

---

### Task 1: Web Assets Infrastructure & Dual-Theme CSS Tokens

**Files:**
- Create: `web/assets/css/styles.css`
- Create: `web/assets/js/main.js`
- Test: `tests/web-assets.test.mjs`

**Interfaces:**
- Consumes: Brand palette tokens from `src/lib/themeContext.tsx` and video assets from `brag-output/` and `assets/`.
- Produces: Responsive dual-theme styling, theme toggle listener, video modal controls, and FAQ accordion interactivity.

- [ ] **Step 1: Write test for web assets and dual-theme CSS variables**

Create `tests/web-assets.test.mjs`:
```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Web assets exist and define 1:1 dual-theme tokens', () => {
  assert.ok(fs.existsSync('web/assets/css/styles.css'), 'styles.css must exist');
  assert.ok(fs.existsSync('web/assets/js/main.js'), 'main.js must exist');

  const css = fs.readFileSync('web/assets/css/styles.css', 'utf8');
  assert.ok(css.includes('--bg-canvas'), 'Defines canvas background variable');
  assert.ok(css.includes('--accent-gold'), 'Defines gold accent variable');
  assert.ok(css.includes('#0d120f'), 'Uses Celestial Dark base from themeContext.tsx');
  assert.ok(css.includes('#f5b800'), 'Uses Sacred Gold accent from themeContext.tsx');
  assert.ok(css.includes('#f8f6f0'), 'Uses Parchment Light base from themeContext.tsx');
  assert.ok(css.includes('data-theme="light"'), 'Defines light theme override selector');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/web-assets.test.mjs`
Expected: FAIL with "styles.css must exist"

- [ ] **Step 3: Implement `web/assets/css/styles.css`, `web/assets/js/main.js`, and copy media assets**

Create `web/assets/css/styles.css` containing:
- Complete dual-theme tokens (`:root` for Celestial Dark, `[data-theme="light"]` for Parchment Light).
- Responsive grid, modern card surfaces, phone mockup frame, typography scales, buttons, FAQ accordion styling, theme toggle styling, and legal page styles.

Create `web/assets/js/main.js` containing:
- Lightweight FAQ accordion toggle (`details` fallback or animated height toggle).
- Video play/pause overlay trigger for `brag.mp4`.
- Smooth anchor scrolling.

Copy `brag-output/brag.mp4` to `web/assets/brag.mp4`, `brag-output/brag.jpg` to `web/assets/brag-poster.jpg`, and `assets/images/icon.png` to `web/assets/icon.png`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/web-assets.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add web/assets/ tests/web-assets.test.mjs
git commit -m "feat(web): initialize web asset pipeline and celestial dark styling"
```

---

### Task 2: High-Converting Homepage (`web/index.html`) with JSON-LD Schema

**Files:**
- Create: `web/index.html`
- Create: `tests/web-seo.test.mjs`

**Interfaces:**
- Consumes: Spec sections 1, 2, 4.
- Produces: Complete semantic landing page with embedded Schema.org JSON-LD scripts.

- [ ] **Step 1: Write test for homepage SEO and Schema.org markup**

Create `tests/web-seo.test.mjs`:
```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Homepage contains exact SEO meta tags and Schema.org JSON-LD', () => {
  const html = fs.readFileSync('web/index.html', 'utf8');

  // Verify single H1
  const h1Matches = html.match(/<h1[^>]*>[\s\S]*?<\/h1>/gi) || [];
  assert.equal(h1Matches.length, 1, 'Must have exactly one H1 tag');

  // Verify canonical URL
  assert.ok(html.includes('<link rel="canonical" href="https://bibleunlock.in"'));

  // Verify OpenGraph
  assert.ok(html.includes('property="og:title"'));
  assert.ok(html.includes('property="og:image"'));

  // Verify JSON-LD Schema
  const schemaMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi) || [];
  assert.ok(schemaMatches.length >= 3, 'Must contain at least 3 JSON-LD blocks (SoftwareApplication, FAQPage, Organization)');

  // Verify JSON-LD parsability
  for (const block of schemaMatches) {
    const jsonStr = block.replace(/<script type="application\/ld\+json">/i, '').replace(/<\/script>/i, '').trim();
    const parsed = JSON.parse(jsonStr);
    assert.ok(parsed['@context'], 'Valid Schema.org context');
  }

  // Verify FAQ questions in Schema match page copy
  assert.ok(html.includes('How does Bible Unlock block distracting apps?'));
  assert.ok(html.includes('Is my reading data and phone activity private?'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/web-seo.test.mjs`
Expected: FAIL with "no such file or directory, open 'web/index.html'"

- [ ] **Step 3: Implement `web/index.html`**

Create `web/index.html` with:
- `<head>`: Canonical link, OpenGraph, Twitter Cards, Google Fonts (`EB Garamond` and `Inter`), 4 JSON-LD Schema scripts (`SoftwareApplication`, `FAQPage`, `Organization`, `WebSite`).
- Sticky Header: Brand logo + "Bible Unlock", nav links, "Get App" CTA button.
- Hero: `<h1>Stop Doomscrolling. Unlock Your Phone With Scripture.</h1>`, dual App Store & Google Play download badges, titanium phone mockup housing the 18s brand video.
- 4-Step Mechanism: Pick apps → Set reading goal → Phone shields → Read to unlock.
- Key Capabilities Grid: 336 visual cards, 92 translations, streak grace protection, 30-day focus telemetry.
- Pricing Matrix: Free Covenant vs Annual Sanctuary ($29.99/yr, 7-day trial).
- FAQ Accordion: 6 Google-indexed questions.
- Footer: Terms (`/terms`), Privacy (`/privacy`), Support email, Copyright.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/web-seo.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add web/index.html tests/web-seo.test.mjs
git commit -m "feat(web): build homepage with rich schema json-ld and conversion sections"
```

---

### Task 3: Canonical Legal Pages (`web/privacy.html` and `web/terms.html`)

**Files:**
- Create: `web/privacy.html`
- Create: `web/terms.html`
- Create: `tests/web-legal.test.mjs`

**Interfaces:**
- Consumes: Spec section 5, Apple Guideline 5.1.1, Google Play User Data Policy.
- Produces: Clean, accessible legal policies hosted at `https://bibleunlock.in/privacy` and `https://bibleunlock.in/terms`.

- [ ] **Step 1: Write test for legal compliance pages**

Create `tests/web-legal.test.mjs`:
```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Privacy policy satisfies App Store and Google Play criteria', () => {
  const html = fs.readFileSync('web/privacy.html', 'utf8');
  assert.ok(html.includes('https://bibleunlock.in/privacy'));
  assert.ok(html.includes('support@bibleunlock.in'));
  assert.ok(html.includes('Screen Time') || html.includes('Family Controls'));
  assert.ok(html.includes('Accessibility'));
  assert.ok(html.includes('zero data collection') || html.includes('local device') || html.includes('offline'));
});

test('Terms of service satisfies subscription and trial disclosure criteria', () => {
  const html = fs.readFileSync('web/terms.html', 'utf8');
  assert.ok(html.includes('https://bibleunlock.in/terms'));
  assert.ok(html.includes('support@bibleunlock.in'));
  assert.ok(html.includes('7-day free trial') || html.includes('trial'));
  assert.ok(html.includes('24 hours') || html.includes('auto-renew'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/web-legal.test.mjs`
Expected: FAIL with "no such file or directory, open 'web/privacy.html'"

- [ ] **Step 3: Implement `web/privacy.html` and `web/terms.html`**

Create `web/privacy.html`:
- Clean editorial reading layout in Celestial Dark.
- Transparent disclosures: 100% on-device local storage (MMKV), zero data sold/tracked, Screen Time and Accessibility permissions strictly for local app shielding, anonymous RevenueCat billing identifiers.
- Canonical URL: `<link rel="canonical" href="https://bibleunlock.in/privacy">`.

Create `web/terms.html`:
- Terms of service, auto-renewing subscription rules, 7-day free trial terms, cancellation procedures via Apple ID / Google Play Account Settings.
- Canonical URL: `<link rel="canonical" href="https://bibleunlock.in/terms">`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/web-legal.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add web/privacy.html web/terms.html tests/web-legal.test.mjs
git commit -m "feat(web): add canonical privacy policy and terms of service pages"
```

---

### Task 4: Technical Search Engine Artifacts (`sitemap.xml`, `robots.txt`, and Node Validator)

**Files:**
- Create: `web/sitemap.xml`
- Create: `web/robots.txt`
- Create: `scripts/validate-web-seo.mjs`
- Create: `tests/web-sitemap.test.mjs`

**Interfaces:**
- Consumes: Spec section 3.
- Produces: Valid XML sitemap, robots crawler instructions, and automated CI SEO verification script.

- [ ] **Step 1: Write test for sitemap and crawler files**

Create `tests/web-sitemap.test.mjs`:
```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Sitemap contains canonical URLs with valid XML structure', () => {
  const xml = fs.readFileSync('web/sitemap.xml', 'utf8');
  assert.ok(xml.includes('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.ok(xml.includes('<loc>https://bibleunlock.in/</loc>') || xml.includes('<loc>https://bibleunlock.in</loc>'));
  assert.ok(xml.includes('<loc>https://bibleunlock.in/privacy</loc>'));
  assert.ok(xml.includes('<loc>https://bibleunlock.in/terms</loc>'));
});

test('Robots.txt allows indexing and links sitemap', () => {
  const robots = fs.readFileSync('web/robots.txt', 'utf8');
  assert.ok(robots.includes('User-agent: *'));
  assert.ok(robots.includes('Allow: /'));
  assert.ok(robots.includes('Sitemap: https://bibleunlock.in/sitemap.xml'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/web-sitemap.test.mjs`
Expected: FAIL with "no such file or directory, open 'web/sitemap.xml'"

- [ ] **Step 3: Implement `web/sitemap.xml`, `web/robots.txt`, and `scripts/validate-web-seo.mjs`**

Implement:
- `web/sitemap.xml`: Complete standard XML sitemap covering `/`, `/privacy`, and `/terms`.
- `web/robots.txt`: Global allow with sitemap URL.
- `scripts/validate-web-seo.mjs`: Node.js CLI script that validates all HTML files in `web/` for canonical links, single H1, valid JSON-LD schemas, image alt tags, and sitemap synchronization.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/web-sitemap.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add web/sitemap.xml web/robots.txt scripts/validate-web-seo.mjs tests/web-sitemap.test.mjs
git commit -m "feat(web): add sitemap.xml, robots.txt, and automated web seo validator"
```

---

### Task 5: NPM Integration, Full Suite Verification, and Handoff

**Files:**
- Modify: `package.json` (add `"web:validate": "node scripts/validate-web-seo.mjs"`, `"test:web": "node --test tests/web-*.test.mjs"`)
- Modify: `docs/STATUS.md`

- [ ] **Step 1: Add web scripts to `package.json`**

Update `scripts` in `package.json`:
```json
"web:validate": "node scripts/validate-web-seo.mjs",
"test:web": "node --test tests/web-*.test.mjs"
```

- [ ] **Step 2: Run full web test suite and validator**

Run: `npm run test:web; npm run web:validate`
Expected: All tests pass with zero errors.

- [ ] **Step 3: Update `docs/STATUS.md`**

Append `TASK-062` to `docs/STATUS.md` tracking web landing page and SEO deliverables.

- [ ] **Step 4: Commit**

```bash
git add package.json docs/STATUS.md
git commit -m "chore(web): register web npm scripts and update project status"
```
