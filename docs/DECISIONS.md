# Decision Log & Plan Pivots (ADR)

---

## [DEC-001] QuranUnlock Blocking Architecture Alignment

- **Date:** 2026-09-06
- **Status:** Validated
- **Related Task / Baseline:** CHARTER.md §3, implementation_plan.md

### 1. Problem / Trigger
Building a cross-platform app blocker that functions reliably and gets approved on both Apple App Store and Google Play Store requires matching proven platform-native capabilities.

### 2. Alternatives Evaluated
- **Option A (Custom Screen Time module + Android UsageStatsManager):** UsageStatsManager on Android requires drawing system overlays which modern Android versions heavily restrict and often kill in the background.
- **Option B (QuranUnlock Proven Architecture: Screen Time on iOS + AccessibilityService on Android):** iOS Screen Time (`FamilyControls` / `ManagedSettings`) operates entirely on-device with zero battery drain. Android `AccessibilityService` listens to `TYPE_WINDOW_STATE_CHANGED` and directly triggers the redirect activity.

### 3. Decision & Trade-offs
Selected **Option B**. For iOS, utilize `react-native-device-activity` rather than reinventing the wheel (`/ponytail`). For Android, build a dedicated Expo Module implementing `AccessibilityService` with `BIND_ACCESSIBILITY_SERVICE`.

### 4. Implementation Details
- iOS: `react-native-device-activity` integrated via config plugin.
- Android: Custom Expo Module in `modules/android-blocker/`.
- Cross-platform abstraction in `src/lib/appBlocker.ts`.

### 5. Proof of Improvement
- Verified via reverse engineering of QuranUnlock app store metadata and architecture.
- 100% offline capability without background battery drain.

### 6. Lessons & Downstream Impact
Entitlements (`FamilyControls` on iOS and Accessibility justification in Google Play Developer Console) must be clearly documented in `SETUP.md`.

---

## [DEC-002] EB Garamond Typography for Scripture & Editorial UI

- **Date:** 2026-09-06
- **Status:** Accepted
- **Related Task / Baseline:** TASK-001

### 1. Problem / Trigger
Initial DESIGN.md referenced Anthropic proprietary fonts (Copernicus & StyreneB). Need open-source, Google Fonts-compatible typography that feels majestic and readable for biblical scripture.

### 2. Alternatives Evaluated
- **Option A (Lora):** Good serif, but slightly less traditional for Bible presentation.
- **Option B (EB Garamond):** Classical humanist serif ideal for Biblical literature, paired with Inter for clear modern mobile UI.

### 3. Decision & Trade-offs
Selected **Option B** (EB Garamond + Inter + JetBrains Mono). Installed via `@expo-google-fonts/*`.
