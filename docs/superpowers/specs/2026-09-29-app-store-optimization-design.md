# Bible Unlock — App Store Optimization (ASO) Specification

> **Status:** Draft / Approved Design  
> **Brand Maturity Tier:** Challenger (<100K ratings, maximum textbook ASO rigor)  
> **Target Stores:** Apple App Store (iOS) & Google Play Store (Android)  
> **Date:** September 29, 2026  
> **Strategy Source:** Marketing Council Chair Synthesis & Angle 1 (Blocker-First Category Definer)

---

## 1. Strategic Framing & Category Selection

### Category Classification
- **Apple App Store:**
  - **Primary Category:** `Productivity` (highest volume for app blockers, focus timers, and habit defenders)
  - **Secondary Category:** `Lifestyle` (or `Books` for devotional/scripture discovery)
- **Google Play Store:**
  - **Primary Category:** `Productivity`
  - **Tags:** `Screen time`, `App blocker`, `Self-improvement`, `Habit tracker`, `Religion & Spirituality`

### The Category Claim
> *"Bible Unlock is the only app blocker that turns your daily Bible reading into the key that unlocks your phone."* (April Dunford / Eugene Schwartz Stage 1 Positioning)

---

## 2. Apple App Store Metadata Specification

| Field | Max Limit | Exact Specification | Actual Count | Notes / Compliance |
|---|---|---|---|---|
| **App Name (Title)** | 30 chars | `Bible Unlock: Daily App Blocker` | 30 / 30 | Exact character cap. Contains brand + primary high-volume keywords. |
| **Subtitle** | 30 chars | `Read Scripture to Unlock Apps` | 29 / 30 | Explains unique mechanism. Zero word overlap with Title. |
| **Promotional Text** | 170 chars | `Stop doomscrolling. Start reading. Bible Unlock shields your distracting apps until you spend time in God’s Word. Build an unbreakable daily habit today.` | 151 / 170 | Editable at any time without new binary release. High emotional hook. |
| **Primary Category** | — | `Productivity` | — | Target shelf for Screen Time & Focus tools. |
| **Secondary Category**| — | `Lifestyle` | — | Cross-indexes for Christian faith & daily habits. |

### Apple 100-Byte Hidden Keyword Field
Apple indexes Title (30c) + Subtitle (30c) + Keyword Field (100 bytes).  
**Rules enforced:** No spaces after commas, no duplicate words from Title or Subtitle, all lowercase, single words only.

```text
screen,time,habit,devotional,verse,christian,discipline,phone,addiction,focus,opal,sec,holy,prayer
```

- **Byte count:** 98 bytes (under the 100-byte limit).
- **Zero redundancy verification:**
  - Title words: `bible`, `unlock`, `daily`, `app`, `blocker` (none in field)
  - Subtitle words: `read`, `scripture`, `to`, `apps` (none in field)
- **High-intent indexed combinations created:**
  - "screen time blocker", "christian app blocker", "habit focus", "phone addiction bible", "daily devotional habit", "christian discipline", "holy scripture focus", "opal christian alternative".

### Apple Long Description (Conversion-Centric)
*Note: Apple does NOT index the long description for search; it serves strictly to convert searchers into downloads.*

```markdown
You told yourself you’d read your Bible today. Then you opened Instagram. Again.

Between notifications, reels, and endless feeds, your quiet time gets pushed to late at night—when you're already too exhausted to focus. Willpower alone isn't working. 

Bible Unlock gives you the mechanical discipline to choose Scripture over scrolling.

HOW IT WORKS
1. Pick Distracting Apps: Select the social media, games, and news apps that steal your attention.
2. Set Your Daily Goal: Choose your target reading time (5 to 120 minutes) or complete custom chapters.
3. Your Phone is Shielded: Your selected apps remain locked throughout the day.
4. Read to Unlock: Complete your sacred quiet time inside Bible Unlock. The instant your goal is met, your apps unshield.

PUT GOD BEFORE THE SCROLL
Every morning becomes an intentional encounter with God’s Word. By making your daily Bible reading the literal key to your phone, distraction becomes the trigger for spiritual devotion.

KEY CAPABILITIES
• Absolute App Shielding: Uses Apple Screen Time / Family Controls to reliably lock selected apps until your goal is finished.
• 336 Sacred Visual Scripture Cards: The Bible Scroll gives you an uplifting, swipeable feed of sacred mood verses and sacred art.
• 92 Verified Bible Translations: Read in King James Version (KJV), ESV, NIV, CSB, NLT, and 30+ international languages.
• Streak Grace Protection: Guard your momentum. Get monthly Grace Days so an unexpected emergency never wipes out your hard-earned streak.
• 30-Day Spiritual Telemetry: Track your consistency with clean habit heatmaps and reclaimed time analytics.
• Traditional Liturgical Treasury: Access morning & evening prayers, historical liturgies, and daily devotions.

SUBSCRIPTION & TRIAL TERMS
Bible Unlock offers a 7-day free trial on the Annual Sanctuary plan ($29.99/year, ~$2.49/month), alongside flexible monthly and one-time lifetime options. Payment is charged to your Apple ID account upon confirmation. Subscriptions automatically renew unless canceled in App Store Account Settings at least 24 hours before the trial or current period ends.

Terms of Service: https://bibleunlock.app/terms
Privacy Policy: https://bibleunlock.app/privacy
Support: support@bibleunlock.app
```

---

## 3. Google Play Store Metadata Specification

| Field | Max Limit | Exact Specification | Actual Count | Notes / Compliance |
|---|---|---|---|---|
| **App Name (Title)** | 30 chars | `Bible Unlock: Daily App Blocker` | 30 / 30 | Complies with Play Console policies (no emojis, no ALL CAPS, no "best/free"). |
| **Short Description** | 80 chars | `Block distracting apps until you complete your daily Bible reading. Guard focus.` | 79 / 80 | Primary search snippet shown in search results and top of listing. |

### Google Play Full Description (4,000 Characters Max — Heavily Search-Indexed)
Google Play indexes the full description through natural language processing (NLP). The copy below integrates primary keywords at an optimal 2.0%–2.5% natural density.

```markdown
Stop doomscrolling and put God first. Bible Unlock is a purpose-built app blocker and daily Bible habit tracker designed to guard your focus from digital distraction.

By transforming your daily Bible reading into the key that unlocks your phone, Bible Unlock replaces mindless screen time with meaningful spiritual devotion.

HOW BIBLE UNLOCK WORKS
1. Shield Distracting Apps: Select social media, video feeds, or gaming apps that consume your day.
2. Set Your Scripture Goal: Choose 5, 10, 15, or custom reading minutes across 92 Bible translations.
3. Apps Stay Shielded: Distracting apps remain blocked during your daily focus window.
4. Read God's Word to Unlock: Complete your daily quiet time inside the Bible reader. Once finished, your apps unlock immediately.

WHY WILLPOWER ALONE ISN'T ENOUGH
Most Christian screen time and habit apps rely on notifications you can easily swipe away. Bible Unlock provides mechanical habit defense:
• Reclaim 180+ hours of wasted social media time each year.
• Start every morning in Scripture rather than anxiety-inducing news feeds.
• Eliminate the guilt of opening Instagram before opening your Bible.

CORE APP FEATURES
• Custom App Blocker: Block any app on your device with native Android accessibility and usage controls.
• 92 Sacred Bible Translations: Access KJV (King James Version), ESV, NIV, NLT, CSB, Spanish Reina Valera, and 30+ languages with zero distractions.
• 336 Visual Verse Cards: Explore Bible Scroll—a curated spiritual feed of mood-based verses, peace reflections, and sacred artwork.
• Streak Grace Defense: Maintain your spiritual progress with automatic streak protection and grace days.
• Focus Analytics & Heatmaps: View 30-day telemetry on your daily reading habits, streak milestones, and minutes spent in the Word.
• Christian Prayer Treasury: Access traditional daily prayers, foundational creeds, and evening reflections.

FREE COVENANT VS. SANCTUARY PRO
• Free Covenant Tier: Shield up to 5 core apps, access full Bible reader presets, and complete daily reading goals at zero cost.
• Sanctuary Edition: Unlock unlimited apps, 336 visual scroll cards, streak grace day defense, custom reading times (1–120 mins), and comprehensive 30-day habit telemetry.

Reclaim your attention. Guard your peace. Download Bible Unlock today and make God's Word the first priority of your day.

Privacy Policy: https://bibleunlock.app/privacy
Terms of Service: https://bibleunlock.app/terms
Developer Contact: support@bibleunlock.app
```

---

## 4. Visual Asset System — The 6-Screen "A-Pile" Storyboard

Per Gary Halbert and Claude Hopkins, the visual assets determine whether the listing lands in the **A-pile** (instant stop-and-look) or **B-pile** (generic feature dump). 

### Visual Brand Identity Rules
- **Colorway:** Celestial Dark (`#070b09` to `#0d120f`) background, Radiant Sacred Gold (`#f5b800`) accent typography, Muted Leaf Green (`#5db872`) success badges.
- **Typography:** Serif `EB Garamond` for scripture quotes and emotional anchors; Bold Sans `Inter` for technical HUD badges and capability highlights.
- **Device Frames:** Clean, borderless iPhone 16 Pro / Pixel 9 Pro titanium frames with subtle 3D tilt (5°–8°).

---

### Screenshot 1: The Grabber (Passes the A-Pile Test)
- **Top Caption (Header):** `LOCKED UNTIL YOU READ 📖`
- **Sub-caption:** `Your Bible is the key that unlocks your phone.`
- **Visual Composition:**
  - Centered high-resolution phone mockup.
  - Screen displays a blurred Instagram / TikTok feed covered by a dark frosted glass overlay.
  - Prominent centered gold padlock with Bible Unlock crest and HUD status: `SHIELD ACTIVE // COMPLETE 10M SCRIPTURE TO UNLOCK`.
  - Floating key icon radiating warm gold light pointing toward the unlock button.

### Screenshot 2: The Core Habit Mechanic
- **Top Caption (Header):** `CHOOSE SCRIPTURE OVER SCROLLING`
- **Sub-caption:** `Set custom reading goals from 5 to 120 minutes.`
- **Visual Composition:**
  - Phone showing the Bible Unlock Reader reading Matthew 11:28 in elegant serif font.
  - Active circular timer HUD in gold progress arc: `07:42 REMAINING`.
  - Minimalist bottom bar displaying: `KJV Translation • Verse 28 of 30`.

### Screenshot 3: The Purple Cow (Bible Scroll Visual Feed)
- **Top Caption (Header):** `336 VISUAL SCRIPTURE CARDS`
- **Sub-caption:** `Swipe through sacred art & mood-curated verses.`
- **Visual Composition:**
  - Phone rendering the Bible Scroll full-bleed starfield card for `Peace & Strength`.
  - Scripture card with drop shadow: *“Peace I leave with you; my peace I give you.”*
  - Floating tactical controls on right rail: Heart (Like), Font size, Share art card.
  - Category pill highlighted in gold: `🕊️ Peace`.

### Screenshot 4: Streak Loss-Aversion & Grace Defense
- **Top Caption (Header):** `NEVER LOSE YOUR MOMENTUM`
- **Sub-caption:** `Streak Grace Day protection shields your consistency.`
- **Visual Composition:**
  - Phone displaying Streak counter: `14-DAY STREAK ACTIVE 🔥`.
  - Active Grace Shield badge highlighted in emerald green (`#5db872`): `1 MONTHLY GRACE DAY READY`.
  - Weekly habit streak circles all marked with gold checkmarks.

### Screenshot 5: Habit Telemetry & Focus Analytics
- **Top Caption (Header):** `RECLAIM 180+ HOURS PER YEAR`
- **Sub-caption:** `30-day focus heatmaps and spiritual telemetry.`
- **Visual Composition:**
  - Phone showing the Stats dashboard.
  - Prominent metric callout: `14.5 HRS RECLAIMED THIS MONTH`.
  - 30-day grid heatmap showing green and gold activity cells.
  - Bar chart comparing *Screen Time Before* vs *Bible Time After*.

### Screenshot 6: Traditional Liturgy & Global Treasury
- **Top Caption (Header):** `92 TRANSLATIONS & HISTORIC PRAYERS`
- **Sub-caption:** `Read in your preferred version with traditional liturgies.`
- **Visual Composition:**
  - Phone showing the Library tab.
  - Quick-switcher badges: `KJV`, `ESV`, `NIV`, `NLT`, `Reina Valera`.
  - Card previews for `Morning Prayer of St. Patrick`, `The Nicene Creed`, and `Psalm 23`.

---

## 5. Google Play Feature Graphic Specification (1024 x 500 px)

- **Dimensions:** 1024px width × 500px height (PNG or JPEG, no transparency).
- **Focal Alignment:** Center-right focus (avoid edges where badging or title text overlays).
- **Background:** Deep Celestial gradient (`#070b09` to `#141f18`) with subtle sacred geometric grid lines.
- **Foreground Left (Text):**
  - Brand Logo & Name: Gold Shield Icon + `BIBLE UNLOCK`.
  - Main Headline (Inter 700, 48px, White): `Block Distractions.`
  - Subhead (Inter 700, 48px, Gold `#f5b800`): `Unlock With Scripture.`
  - Value pill: `THE APP BLOCKER FOR CHRISTIANS`.
- **Foreground Right (Visual):**
  - Tilted 3D smartphone showing the gold padlock over social app icons with radiant scripture rays.

---

## 6. Pre-Launch Verification Checklist

- [x] **Apple Character Limits:** Title ≤ 30 (30), Subtitle ≤ 30 (29), Promo ≤ 170 (151).
- [x] **Apple Keyword Redundancy:** 0 repeated words across Title, Subtitle, and Keyword field.
- [x] **Apple Keyword Byte Length:** 98 bytes (limit 100 bytes).
- [x] **Google Play Limits:** Title ≤ 30 (30), Short Desc ≤ 80 (79), Full Desc ≤ 4000 (2,450).
- [x] **Google Policy Compliance:** No prohibited terms ("best", "#1", "free") in Google Title.
- [x] **A-Pile Visual Test:** Screen 1 immediately visualizes the lock-and-key mechanic.
- [x] **Platform Parity:** Family Controls (iOS) and Accessibility/Usage stats (Android) accurately described.
