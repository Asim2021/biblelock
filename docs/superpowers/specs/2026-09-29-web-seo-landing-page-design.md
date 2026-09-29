# Bible Unlock — Web Landing Page & Search Engine Optimization (SEO) Specification

> **Status:** Approved Design  
> **Target Domain:** `https://bibleunlock.in`  
> **Date:** September 29, 2026  
> **Architecture:** Standalone Semantic Static HTML5 / CSS3 / JSON-LD in `web/` (Zero JS overhead, 100/100 Core Web Vitals)  
> **Source Strategy:** Track 2 — Landing Page & Web Search Engine Optimization

---

## 1. Search Engine Strategy & Keyword Targeting

### High-Intent Search Clusters
Search engines index pages based on user intent, entity relationships, and topical authority. Bible Unlock targets three distinct search intent clusters:

1. **Category Definer (Commercial & Transactional):**
   - `Christian app blocker`
   - `Bible reading app blocker`
   - `screen time app blocker christian`
   - `block apps until bible reading`
2. **Habit & Problem-Aware (Informational & Pain-Driven):**
   - `how to stop doomscrolling as a christian`
   - `replace screen time with bible`
   - `daily scripture habit app`
   - `christian phone addiction`
3. **Alternative & Comparison Queries:**
   - `opal christian alternative`
   - `one sec christian version`
   - `quran unlock for christians`

### Core Web Vitals & Technical SEO Targets
- **First Contentful Paint (FCP):** < 0.6s
- **Largest Contentful Paint (LCP):** < 1.0s
- **Cumulative Layout Shift (CLS):** 0.00
- **Interaction to Next Paint (INP):** < 50ms
- **Semantic Structure:** Exactly one `<h1>` on homepage, logical `<h2>` and `<h3>` tags, zero layout-shift font loading, descriptive `alt` tags on all visuals.

---

## 2. Structured Data Specification (JSON-LD)

To dominate Google Rich Results (knowledge graph, star ratings, software app snippets, expandable FAQ cards), `web/index.html` embeds 4 Schema.org JSON-LD scripts in `<head>`.

### 2.1 SoftwareApplication & MobileApplication Schema
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Bible Unlock",
  "operatingSystem": "iOS, Android",
  "applicationCategory": "ProductivityApplication",
  "offers": [
    {
      "@type": "Offer",
      "price": "0.00",
      "priceCurrency": "USD",
      "name": "Free Covenant Plan"
    },
    {
      "@type": "Offer",
      "price": "29.99",
      "priceCurrency": "USD",
      "priceValidUntil": "2028-12-31",
      "name": "Annual Sanctuary Plan"
    }
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "ratingCount": "128"
  },
  "description": "Smart app blocker for Christians. Distracting apps remain shielded until you complete your daily Bible reading goal.",
  "image": "https://bibleunlock.in/assets/og-image.jpg",
  "url": "https://bibleunlock.in"
}
```

### 2.2 FAQPage Schema (Expandable Google Search Snippets)
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How does Bible Unlock block distracting apps?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Bible Unlock uses Apple Screen Time (Family Controls) on iOS and native accessibility controls on Android to reliably shield distracting apps like Instagram, TikTok, and YouTube until you finish your daily Scripture reading."
      }
    },
    {
      "@type": "Question",
      "name": "Is my reading data and phone activity private?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, 100%. Bible Unlock operates offline-first. All reading history, bookmarks, blocked app preferences, and prayer entries stay encrypted on your local device. We never sell, track, or upload your browsing or reading habits."
      }
    },
    {
      "@type": "Question",
      "name": "Can I use Bible Unlock for free?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. The Free Covenant tier allows you to block up to 5 distracting apps, choose 5, 10, or 15-minute daily reading goals, and access offline Bible reading with zero ads."
      }
    },
    {
      "@type": "Question",
      "name": "What Bible translations are supported?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Bible Unlock supports 92 Bible translations across 35 languages, including King James Version (KJV), World English Bible (WEB), ESV, NIV, Reina Valera (Spanish), and French Louis Segond."
      }
    },
    {
      "@type": "Question",
      "name": "What happens if I miss a day of reading?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sanctuary subscribers receive monthly Streak Grace Days so an unexpected travel day or family emergency never wipes out your hard-earned spiritual momentum."
      }
    },
    {
      "@type": "Question",
      "name": "How is Bible Unlock different from standard app blockers like Opal or Screen Time?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Standard app blockers use punitive friction that users easily bypass when willpower is depleted. Bible Unlock provides an inspiring spiritual alternative: rather than just locking you out, it transforms Scripture reading into the literal key that unlocks your phone."
      }
    }
  ]
}
```

### 2.3 Organization & WebSite Schema
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Bible Unlock",
  "url": "https://bibleunlock.in",
  "logo": "https://bibleunlock.in/assets/icon.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "support@bibleunlock.in",
    "contactType": "Customer Support"
  }
}
```

---

## 3. Web Site Structure & Asset Topology

```text
web/
├── index.html           # High-converting landing page & primary SEO hub
├── privacy.html         # Official App Store & Google Play canonical privacy policy
├── terms.html           # Official App Store & Google Play canonical terms of service
├── sitemap.xml          # XML sitemap for Google Search Console & Bing Webmaster
├── robots.txt           # Crawler indexing directives & sitemap link
└── assets/
    ├── css/
    │   └── styles.css   # Lightweight, minified vanilla CSS (<15KB) in Celestial Dark
    ├── js/
    │   └── main.js      # Minimal vanilla JS for video modal, FAQ accordion & smooth scroll (<5KB)
    ├── icon.png         # High-resolution brand shield logo
    ├── og-image.jpg     # 1200x630 Social sharing card
    └── brag-poster.jpg  # Poster frame for brand video
```

---

## 4. Visual Design System & Conversion Architecture

### 4.1 Dual-Theme Colorway & Typography Tokens (1:1 with `src/lib/themeContext.tsx`)

The website implements the app's dual-theme design system using CSS variables controlled via `data-theme="dark"` (default) and `data-theme="light"`, with system `prefers-color-scheme` detection and `localStorage` persistence:

| Token Name | CSS Variable | Celestial Dark (Default) | Parchment Light |
|---|---|---|---|
| **Background** | `--bg-canvas` | `#0d120f` (Celestial Pine) | `#f8f6f0` (Parchment Cream) |
| **Card / Surface** | `--bg-surface` | `#141e17` | `#ffffff` |
| **Surface Subtle** | `--bg-surface-subtle` | `#18231c` | `#f0ede4` |
| **Surface Elevated** | `--bg-surface-elevated` | `#1a261f` | `#ffffff` |
| **Border** | `--border-main` | `#202e25` | `#e4dfd3` |
| **Border Subtle** | `--border-subtle` | `#1c2820` | `#ebe7de` |
| **Text Primary** | `--text-primary` | `#faf9f5` | `#1a1f1b` |
| **Text Secondary** | `--text-secondary` | `#78a898` | `#5a6d62` |
| **Text Muted** | `--text-muted` | `#5c7a6e` | `#88988d` |
| **Accent Primary** | `--accent-gold` | `#f5b800` (Sacred Gold) | `#d49400` (Deep Amber Gold) |
| **Accent Background** | `--accent-bg` | `#22251a` | `#fef7e6` |
| **Success** | `--color-success` | `#5db872` (Emerald Green) | `#2e8c45` |
| **Success Background** | `--success-bg` | `#18261e` | `#edf8f0` |

- **Typography System:**
  - Headlines, Pull Quotes & Scripture: `EB Garamond` (Google Fonts, weights 400, 600, 700, italics, `display=swap`)
  - UI Labels, Technical Badges, Navigation & Body: `Inter` (Google Fonts, weights 400, 500, 600, 700, 800, `display=swap`)
- **Theme Toggle Interaction:**
  - Header features a tactile `[ 🌙 / ☀️ ]` theme button.
  - Clicking toggles between `dark` and `light` themes, updates `document.documentElement.setAttribute('data-theme', theme)`, and persists preference to `localStorage.getItem('bu_theme')`.
  - Inline head script executes synchronously to prevent light/dark theme flash on initial page load.

### 4.2 Page Sections on `index.html`
1. **Header / Navigation:**
   - Brand logo + "Bible Unlock"
   - Links: `#how-it-works`, `#features`, `#pricing`, `#faq`
   - CTA: "Download App" (smooth scrolls to store download section)
2. **Hero Section:**
   - Pill: `🛡️ THE SMART APP BLOCKER FOR CHRISTIANS`
   - `<h1>`: `Stop Doomscrolling. Unlock Your Phone With Scripture.`
   - Subhead: `Bible Unlock shields your distracting apps until you spend meaningful quiet time in God’s Word.`
   - Dual Store Badges: Apple App Store & Google Play download badges
   - Visual Centerpiece: 18-second 1080p Brand Video preview inside an iPhone titanium mockup frame with custom play overlay
3. **The 4-Step Mechanism:**
   - Step 1: **Pick Your Distractions** (Instagram, TikTok, YouTube)
   - Step 2: **Set Your Daily Goal** (5 to 120 minutes)
   - Step 3: **Phone Shields Automatically** (OS-level Family Controls / Accessibility)
   - Step 4: **Read Scripture to Unlock** (Daily Bible reading becomes the key)
4. **Key Capabilities Grid:**
   - Card 1: **336 Sacred Visual Cards** (Bible Scroll reels-style visual feed)
   - Card 2: **92 Verified Translations** (KJV, ESV, WEB, Spanish, 35 languages)
   - Card 3: **Streak Grace Protection** (Never lose momentum over an emergency)
   - Card 4: **30-Day Spiritual Telemetry** (Focus heatmaps & hours reclaimed)
5. **Freemium Pricing Matrix:**
   - **Free Covenant:** $0 forever. Up to 5 apps, 5-15m goals, 3 daily scroll cards, offline reader, zero ads.
   - **Annual Sanctuary (Featured):** $29.99/year (~$2.49/mo, Save 50%). Includes 7-day free trial, unlimited apps, custom 1-120m goals, full Bible Scroll, streak grace days, 30-day telemetry, and liturgical prayers.
   - **Lifetime Sanctuary:** $79.99 one-time payment.
6. **SEO FAQ Section:**
   - 6 semantic accordion items matching JSON-LD `FAQPage`.
7. **Footer:**
   - Privacy Policy link (`/privacy`)
   - Terms of Service link (`/terms`)
   - Support mailto (`support@bibleunlock.in`)
   - Copyright notice

---

## 5. Legal Pages (`privacy.html` and `terms.html`)

Both pages are required by Apple App Store Review Guidelines (Guideline 5.1.1) and Google Play Developer Policies.

### Privacy Policy (`privacy.html`)
- Declares **zero data collection**: 100% on-device local storage (MMKV).
- Clarifies Screen Time (iOS) and Accessibility Services (Android) permissions are used strictly to detect and shield selected apps locally, with zero telemetry transmitted.
- Discloses RevenueCat anonymous purchase handling without selling user data.
- Contact: `support@bibleunlock.in`.

### Terms of Service (`terms.html`)
- Standard mobile software license for personal spiritual growth.
- Auto-renewing subscription terms (7-day free trial on Annual Sanctuary plan, cancel at least 24 hours before renewal via Apple/Google account settings).
- Refund policy aligned with Apple App Store and Google Play billing.

---

## 6. Verification Criteria
- [ ] Valid Schema.org JSON-LD (passes Google Rich Results Test validator).
- [ ] 0 broken links; all internal anchors navigate smoothly.
- [ ] Exact meta tags (`title`, `description`, `canonical`, `og:image`, `twitter:card`).
- [ ] Sub-1.0s First Contentful Paint with static HTML/CSS.
- [ ] Complete coverage of legal requirements (`/privacy`, `/terms`).
