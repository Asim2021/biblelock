# Bible Unlock — Complete Setup & Deployment Guide

Refer to [frontend/SETUP.md](frontend/SETUP.md) for detailed configuration, or read below:

## 1. Fast Start
1. Ensure `.env` is configured in `frontend/` (see `frontend/.env.example`).
2. Run `npm install` in `frontend/`.
3. Start the app:
   ```bash
   cd frontend
   npm run start
   ```

## 2. Key Modules & Implementations
- **Bible Reader**: `frontend/src/app/(tabs)/reader.tsx` + `frontend/src/lib/bible.ts` (100% offline WEB & KJV bundled).
- **Home & Progress**: `frontend/src/app/(tabs)/index.tsx` (Reanimated/SVG circular progress ring, streaks, daily verses).
- **Settings & Block Manager**: `frontend/src/app/(tabs)/settings.tsx` (goals, preset apps, translation).
- **Paywall**: `frontend/src/app/paywall.tsx` + `frontend/src/lib/purchases.ts` (RevenueCat integration).
- **App Blocker (iOS)**: `react-native-device-activity` (Screen Time & FamilyControls).
- **App Blocker (Android)**: `frontend/modules/android-blocker/` (AccessibilityService detecting `TYPE_WINDOW_STATE_CHANGED`).
- **Scripture Shield**: `frontend/src/lib/scriptureShield.ts` (local notification reminder).
