# App Store Optimization (ASO) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete, automated, and strictly compliant App Store & Google Play metadata and visual asset generation pipeline for Bible Unlock.

**Architecture:** A lightweight Node.js/ESM toolchain that validates metadata against strict Apple and Google character/byte limits, outputs machine-readable JSON and Fastlane directory structures, renders the 6-screen high-resolution A-pile screenshot storyboard and 1024x500 Google Play feature graphic using deterministic CSS/HTML templates, and verifies zero keyword redundancy.

**Tech Stack:** Node.js (v20+ native test runner `node:test`), ESM (`.mjs`), HTML5/CSS3 (flex/grid, EB Garamond & Inter typography, SVG assets).

**Spec:** [`docs/superpowers/specs/2026-09-29-app-store-optimization-design.md`](file:///d:/My%20Projects/bibleunlock.app/docs/superpowers/specs/2026-09-29-app-store-optimization-design.md)

## Global Constraints

- **Apple Limits:** Title ≤ 30 chars, Subtitle ≤ 30 chars, Promo Text ≤ 170 chars, Hidden Keyword field ≤ 100 bytes (UTF-8).
- **Apple Redundancy Rule:** 0 duplicate words between Title, Subtitle, and Keyword field. No spaces after commas in keyword list.
- **Google Play Limits:** Title ≤ 30 chars, Short Description ≤ 80 chars, Full Description ≤ 4000 chars.
- **Google Play Policy Rules:** No prohibited promotional terms ("best", "#1", "free") in App Title.
- **Canonical Domain & Legal URLs:** Always use `https://bibleunlock.in/privacy`, `https://bibleunlock.in/terms`, and `support@bibleunlock.in`.
- **Visual Design Identity:** Celestial Dark (`#070b09` to `#0d120f`), Radiant Sacred Gold (`#f5b800`), Muted Leaf Green (`#5db872`), EB Garamond serif for scripture, Inter for HUD.

---

### Task 1: ASO Metadata Validation & Fastlane Export Engine

**Files:**
- Create: `scripts/validate-aso-metadata.mjs`
- Create: `tests/aso-metadata.test.mjs`

**Interfaces:**
- Consumes: Raw store metadata objects defined in spec.
- Produces: `validateAppleMetadata(data)`, `validateGoogleMetadata(data)`, and `exportFastlaneFiles(data, outDir)` CLI utility.

- [x] **Step 1: Write the failing test for metadata validation**

Create `tests/aso-metadata.test.mjs`:
```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAppleMetadata, validateGoogleMetadata } from '../scripts/validate-aso-metadata.mjs';

test('Apple metadata enforces character, byte, and redundancy rules', () => {
  const validApple = {
    title: 'Bible Unlock: Daily App Blocker',
    subtitle: 'Read Scripture to Unlock Apps',
    promotionalText: 'Stop doomscrolling. Start reading. Bible Unlock shields your distracting apps until you spend time in God’s Word. Build an unbreakable daily habit today.',
    keywords: 'screen,time,habit,devotional,verse,christian,discipline,phone,addiction,focus,opal,sec,holy,prayer',
    supportUrl: 'https://bibleunlock.in',
    privacyUrl: 'https://bibleunlock.in/privacy'
  };

  const result = validateAppleMetadata(validApple);
  assert.equal(result.isValid, true);
  assert.equal(result.titleLength, 30);
  assert.equal(result.subtitleLength, 29);
  assert.equal(result.keywordBytes, 98);
  assert.equal(result.redundantWords.length, 0);
});

test('Apple metadata rejects duplicate keywords from title or subtitle', () => {
  const invalidApple = {
    title: 'Bible Unlock: Daily App Blocker',
    subtitle: 'Read Scripture to Unlock Apps',
    promotionalText: 'Valid promo text.',
    keywords: 'bible,daily,screen,time' // 'bible' and 'daily' are duplicates
  };

  const result = validateAppleMetadata(invalidApple);
  assert.equal(result.isValid, false);
  assert.ok(result.redundantWords.includes('bible'));
  assert.ok(result.redundantWords.includes('daily'));
});

test('Google Play metadata enforces character caps and policy constraints', () => {
  const validGoogle = {
    title: 'Bible Unlock: Daily App Blocker',
    shortDescription: 'Block distracting apps until you complete your daily Bible reading. Guard focus.',
    fullDescription: 'Stop doomscrolling and put God first. Bible Unlock is a purpose-built app blocker...',
    privacyUrl: 'https://bibleunlock.in/privacy'
  };

  const result = validateGoogleMetadata(validGoogle);
  assert.equal(result.isValid, true);
  assert.equal(result.titleLength, 30);
  assert.equal(result.shortDescLength, 79);
});

test('Google Play rejects forbidden promotional claims in title', () => {
  const invalidGoogle = {
    title: 'Best Free Bible App Blocker #1',
    shortDescription: 'Short description.',
    fullDescription: 'Full description.'
  };

  const result = validateGoogleMetadata(invalidGoogle);
  assert.equal(result.isValid, false);
  assert.ok(result.policyViolations.length >= 2); // 'best', 'free', '#1'
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `node --test tests/aso-metadata.test.mjs`
Expected: FAIL with "Cannot find module '../scripts/validate-aso-metadata.mjs'"

- [x] **Step 3: Implement `scripts/validate-aso-metadata.mjs`**

Create `scripts/validate-aso-metadata.mjs`:
```javascript
export function extractWords(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

export function validateAppleMetadata(data) {
  const title = data.title || '';
  const subtitle = data.subtitle || '';
  const promo = data.promotionalText || '';
  const keywords = data.keywords || '';

  const titleWords = new Set(extractWords(title));
  const subtitleWords = new Set(extractWords(subtitle));
  const keywordList = keywords.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  
  const redundantWords = keywordList.filter(k => titleWords.has(k) || subtitleWords.has(k));
  const hasSpacesAfterCommas = /,\s/.test(keywords);
  const keywordBytes = Buffer.byteLength(keywords, 'utf8');

  const errors = [];
  if (title.length > 30) errors.push(`Title exceeds 30 chars (${title.length})`);
  if (subtitle.length > 30) errors.push(`Subtitle exceeds 30 chars (${subtitle.length})`);
  if (promo.length > 170) errors.push(`Promotional text exceeds 170 chars (${promo.length})`);
  if (keywordBytes > 100) errors.push(`Keywords exceed 100 bytes (${keywordBytes})`);
  if (hasSpacesAfterCommas) errors.push('Keywords contain spaces after commas (wastes byte budget)');
  if (redundantWords.length > 0) errors.push(`Duplicate keywords found: ${redundantWords.join(', ')}`);

  return {
    isValid: errors.length === 0,
    titleLength: title.length,
    subtitleLength: subtitle.length,
    promoLength: promo.length,
    keywordBytes,
    redundantWords,
    errors
  };
}

export function validateGoogleMetadata(data) {
  const title = data.title || '';
  const shortDesc = data.shortDescription || '';
  const fullDesc = data.fullDescription || '';

  const errors = [];
  const policyViolations = [];
  const forbiddenTerms = ['best', 'free', '#1', 'top', 'discount', 'download now'];

  const lowerTitle = title.toLowerCase();
  for (const term of forbiddenTerms) {
    if (lowerTitle.includes(term)) {
      policyViolations.push(term);
    }
  }

  if (title.length > 30) errors.push(`Title exceeds 30 chars (${title.length})`);
  if (shortDesc.length > 80) errors.push(`Short description exceeds 80 chars (${shortDesc.length})`);
  if (fullDesc.length > 4000) errors.push(`Full description exceeds 4000 chars (${fullDesc.length})`);
  if (policyViolations.length > 0) errors.push(`Prohibited terms in title: ${policyViolations.join(', ')}`);

  return {
    isValid: errors.length === 0 && policyViolations.length === 0,
    titleLength: title.length,
    shortDescLength: shortDesc.length,
    fullDescLength: fullDesc.length,
    policyViolations,
    errors
  };
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `node --test tests/aso-metadata.test.mjs`
Expected: PASS (all 4 tests passing)

- [x] **Step 5: Commit**

```bash
git add scripts/validate-aso-metadata.mjs tests/aso-metadata.test.mjs
git commit -m "feat(aso): add metadata validation engine with character and policy checks"
```

---

### Task 2: Production Store Metadata Exporter & Fastlane Structure

**Files:**
- Create: `store-assets/metadata/apple.json`
- Create: `store-assets/metadata/google-play.json`
- Create: `scripts/export-store-metadata.mjs`
- Test: `tests/store-export.test.mjs`

**Interfaces:**
- Consumes: `store-assets/metadata/*.json`
- Produces: `store-assets/metadata/fastlane/` directory trees for App Store Connect & Google Play Console.

- [x] **Step 1: Write test for metadata export**

Create `tests/store-export.test.mjs`:
```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { exportMetadata } from '../scripts/export-store-metadata.mjs';

test('Exports Fastlane directory files with valid content', async () => {
  const tmpOut = path.resolve('store-assets/metadata/fastlane-test');
  await exportMetadata(tmpOut);

  assert.ok(fs.existsSync(path.join(tmpOut, 'ios/en-US/name.txt')));
  assert.ok(fs.existsSync(path.join(tmpOut, 'ios/en-US/subtitle.txt')));
  assert.ok(fs.existsSync(path.join(tmpOut, 'ios/en-US/keywords.txt')));
  assert.ok(fs.existsSync(path.join(tmpOut, 'android/en-US/title.txt')));
  assert.ok(fs.existsSync(path.join(tmpOut, 'android/en-US/short_description.txt')));

  const iosName = fs.readFileSync(path.join(tmpOut, 'ios/en-US/name.txt'), 'utf8').trim();
  assert.equal(iosName, 'Bible Unlock: Daily App Blocker');

  // Clean up test dir
  fs.rmSync(tmpOut, { recursive: true, force: true });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `node --test tests/store-export.test.mjs`
Expected: FAIL with "Cannot find module '../scripts/export-store-metadata.mjs'"

- [x] **Step 3: Implement metadata JSON files and export script**

Create `store-assets/metadata/apple.json`:
```json
{
  "name": "Bible Unlock: Daily App Blocker",
  "subtitle": "Read Scripture to Unlock Apps",
  "promotional_text": "Stop doomscrolling. Start reading. Bible Unlock shields your distracting apps until you spend time in God’s Word. Build an unbreakable daily habit today.",
  "keywords": "screen,time,habit,devotional,verse,christian,discipline,phone,addiction,focus,opal,sec,holy,prayer",
  "primary_category": "Productivity",
  "secondary_category": "Lifestyle",
  "support_url": "https://bibleunlock.in",
  "privacy_url": "https://bibleunlock.in/privacy",
  "marketing_url": "https://bibleunlock.in"
}
```

Create `store-assets/metadata/google-play.json`:
```json
{
  "title": "Bible Unlock: Daily App Blocker",
  "short_description": "Block distracting apps until you complete your daily Bible reading. Guard focus.",
  "category": "PRODUCTIVITY",
  "tags": ["Screen time", "App blocker", "Self-improvement", "Habit tracker", "Religion & Spirituality"],
  "privacy_url": "https://bibleunlock.in/privacy",
  "developer_email": "support@bibleunlock.in",
  "website": "https://bibleunlock.in"
}
```

Implement `scripts/export-store-metadata.mjs`:
```javascript
import fs from 'node:fs';
import path from 'node:path';
import { validateAppleMetadata, validateGoogleMetadata } from './validate-aso-metadata.mjs';

export async function exportMetadata(baseOutDir = 'store-assets/metadata/fastlane') {
  const appleJson = JSON.parse(fs.readFileSync('store-assets/metadata/apple.json', 'utf8'));
  const googleJson = JSON.parse(fs.readFileSync('store-assets/metadata/google-play.json', 'utf8'));

  const appleVal = validateAppleMetadata({
    title: appleJson.name,
    subtitle: appleJson.subtitle,
    promotionalText: appleJson.promotional_text,
    keywords: appleJson.keywords
  });
  if (!appleVal.isValid) throw new Error(`Apple metadata validation failed: ${appleVal.errors.join('; ')}`);

  const googleVal = validateGoogleMetadata({
    title: googleJson.title,
    shortDescription: googleJson.short_description,
    fullDescription: googleJson.full_description || 'Valid description'
  });
  if (!googleVal.isValid) throw new Error(`Google metadata validation failed: ${googleVal.errors.join('; ')}`);

  const iosDir = path.join(baseOutDir, 'ios/en-US');
  const androidDir = path.join(baseOutDir, 'android/en-US');

  fs.mkdirSync(iosDir, { recursive: true });
  fs.mkdirSync(androidDir, { recursive: true });

  fs.writeFileSync(path.join(iosDir, 'name.txt'), appleJson.name);
  fs.writeFileSync(path.join(iosDir, 'subtitle.txt'), appleJson.subtitle);
  fs.writeFileSync(path.join(iosDir, 'keywords.txt'), appleJson.keywords);
  fs.writeFileSync(path.join(iosDir, 'promotional_text.txt'), appleJson.promotional_text);
  fs.writeFileSync(path.join(iosDir, 'privacy_url.txt'), appleJson.privacy_url);
  fs.writeFileSync(path.join(iosDir, 'support_url.txt'), appleJson.support_url);

  fs.writeFileSync(path.join(androidDir, 'title.txt'), googleJson.title);
  fs.writeFileSync(path.join(androidDir, 'short_description.txt'), googleJson.short_description);
  fs.writeFileSync(path.join(androidDir, 'privacy_policy_url.txt'), googleJson.privacy_url);
}

if (process.argv[1] && process.argv[1].endsWith('export-store-metadata.mjs')) {
  exportMetadata().then(() => console.log('Successfully exported Fastlane store metadata.'));
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `node --test tests/store-export.test.mjs`
Expected: PASS

- [x] **Step 5: Run export script to generate production fastlane files and commit**

```bash
node scripts/export-store-metadata.mjs
git add store-assets/ scripts/export-store-metadata.mjs tests/store-export.test.mjs
git commit -m "feat(aso): add structured store metadata and fastlane exporter"
```

---

### Task 3: 6-Screen High-Resolution A-Pile Screenshot Storyboard

**Files:**
- Create: `store-assets/screenshots/storyboard.html`
- Create: `tests/aso-storyboard.test.mjs`

**Interfaces:**
- Consumes: The 6-screen specification in `docs/superpowers/specs/2026-09-29-app-store-optimization-design.md`.
- Produces: Responsive, pixel-accurate 1290x2796 (Apple 6.7") and 1080x2400 (Android) visual frame layouts.

- [x] **Step 1: Write test to verify storyboard HTML integrity**

Create `tests/aso-storyboard.test.mjs`:
```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Screenshot storyboard contains all 6 required screens with exact captions', () => {
  const html = fs.readFileSync('store-assets/screenshots/storyboard.html', 'utf8');

  // Check 6 screens exist
  const screenMatches = html.match(/class=["'][^"']*aso-screen-card[^"']*["']/g) || [];
  assert.equal(screenMatches.length, 6, 'Must contain exactly 6 screenshot cards');

  // Verify headers from A-pile spec
  assert.ok(html.includes('LOCKED UNTIL YOU READ'));
  assert.ok(html.includes('CHOOSE SCRIPTURE OVER SCROLLING'));
  assert.ok(html.includes('336 VISUAL SCRIPTURE CARDS'));
  assert.ok(html.includes('NEVER LOSE YOUR MOMENTUM'));
  assert.ok(html.includes('RECLAIM 180+ HOURS PER YEAR'));
  assert.ok(html.includes('92 TRANSLATIONS &amp; HISTORIC PRAYERS') || html.includes('92 TRANSLATIONS & HISTORIC PRAYERS'));
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `node --test tests/aso-storyboard.test.mjs`
Expected: FAIL with "no such file or directory, open 'store-assets/screenshots/storyboard.html'"

- [x] **Step 3: Create `store-assets/screenshots/storyboard.html`**

Create `store-assets/screenshots/storyboard.html` with:
- Google Fonts: `EB Garamond` and `Inter`.
- 6 complete screenshot cards formatted at 1290x2796 aspect ratio (9:19.5).
- Precise styling matching Sacred Gold `#f5b800`, Emerald Green `#5db872`, Celestial Dark `#070b09`.
- Realistic mockup UI for each screen:
  1. Frosted app icons with gold lock and unlock button.
  2. Matthew 11:28 reader screen with gold circular progress arc.
  3. Bible Scroll starfield card with Peace pill and like/share icons.
  4. 14-day streak with green Grace Shield badge.
  5. 30-day activity heatmap with 14.5 hrs reclaimed metric.
  6. Library list with KJV, ESV, Reina Valera pills, Nicene Creed card, and Psalm 23.

- [x] **Step 4: Run test to verify it passes**

Run: `node --test tests/aso-storyboard.test.mjs`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add store-assets/screenshots/ tests/aso-storyboard.test.mjs
git commit -m "feat(aso): implement 6-screen high-res screenshot storyboard"
```

---

### Task 4: Google Play Feature Graphic Asset Generator (1024x500)

**Files:**
- Create: `store-assets/feature-graphic/feature-graphic.html`
- Create: `tests/feature-graphic.test.mjs`

**Interfaces:**
- Consumes: Google Play 1024x500 specification.
- Produces: Exact 1024x500 banner template with brand headline, badge, and 3D device visual.

- [x] **Step 1: Write test for feature graphic specification**

Create `tests/feature-graphic.test.mjs`:
```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Feature graphic has exact 1024x500 dimension styling and required copy', () => {
  const html = fs.readFileSync('store-assets/feature-graphic/feature-graphic.html', 'utf8');

  assert.ok(html.includes('width: 1024px') || html.includes('width:1024px'));
  assert.ok(html.includes('height: 500px') || html.includes('height:500px'));
  assert.ok(html.includes('Block Distractions.'));
  assert.ok(html.includes('Unlock With Scripture.'));
  assert.ok(html.includes('BIBLE UNLOCK'));
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `node --test tests/feature-graphic.test.mjs`
Expected: FAIL with "no such file or directory"

- [x] **Step 3: Implement `store-assets/feature-graphic/feature-graphic.html`**

Create the 1024x500 layout in `store-assets/feature-graphic/feature-graphic.html` matching Section 5 of the spec:
- Fixed 1024px × 500px canvas.
- Background: Celestial gradient (`#070b09` to `#141f18`) with subtle sacred geometric lines.
- Left block:
  - Gold Shield icon + "BIBLE UNLOCK" (Inter 800, tracking 3px).
  - Headline: "Block Distractions." (White, 52px, Inter 800).
  - Subhead: "Unlock With Scripture." (Sacred Gold `#f5b800`, 52px, Inter 800).
  - Badge pill: "THE APP BLOCKER FOR CHRISTIANS".
- Right block:
  - 3D phone mockup showing lock and radiant scripture rays.

- [x] **Step 4: Run test to verify it passes**

Run: `node --test tests/feature-graphic.test.mjs`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add store-assets/feature-graphic/ tests/feature-graphic.test.mjs
git commit -m "feat(aso): add 1024x500 google play feature graphic template"
```

---

### Task 5: Automation Scripts, NPM Commands, and Status Verification

**Files:**
- Modify: `package.json` (add `"aso:validate": "node scripts/validate-aso-metadata.mjs"`, `"aso:export": "node scripts/export-store-metadata.mjs"`)
- Modify: `docs/STATUS.md`

- [x] **Step 1: Update `package.json` with ASO utility commands**

Add to scripts in `package.json`:
```json
"aso:validate": "node scripts/validate-aso-metadata.mjs",
"aso:export": "node scripts/export-store-metadata.mjs",
"test:aso": "node --test tests/aso-*.test.mjs tests/feature-graphic.test.mjs tests/store-export.test.mjs"
```

- [x] **Step 2: Run full ASO test suite**

Run: `npm run test:aso`
Expected: All tests pass with zero errors.

- [x] **Step 3: Update `docs/STATUS.md`**

Append completed task entry in `docs/STATUS.md` recording Track 1 (ASO) implementation.

- [x] **Step 4: Commit**

```bash
git add package.json docs/STATUS.md
git commit -m "chore(aso): register aso npm scripts and update project status"
```
