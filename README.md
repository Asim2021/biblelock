# Bible Unlock App (Frontend)

Bible Unlock is a cross-platform React Native / Expo application built on the React Native New Architecture, inspired by QuranUnlock. It helps users replace mindless phone doom-scrolling with mindful Scripture reading by blocking distracting apps until daily Scripture reading goals are met.

---

## 📋 Prerequisites

Before running the project locally or building the native Android app, ensure your workstation has:

1. **Node.js**: Version 20.x or 22.x LTS (Recommended).
2. **Java Development Kit (JDK)**: **JDK 21 (LTS)** is **strictly required**.
   > ⚠️ **IMPORTANT**: Do **NOT** use Java 25 or Gradle auto-downloaded JVMs. Newer preview JVMs (like Java 25) output restricted native access warnings to `stderr` that break CMake and Prefab builds for New Architecture native modules (`react-native-nitro-modules`, `react-native-reanimated`, `react-native-mmkv`).
3. **Android Studio**: Android SDK Build-Tools 36.0.0 (or 35.0.0), NDK 27.x, and Android Platform SDK 36 installed.
4. **Android Device**: Connected via USB or **Wireless Debugging** (`adb connect <ip>:<port>`).

---

## 🚀 Daily Development Workflow

### Step 1: Verify Wireless ADB Connection
If you are developing over Wi-Fi, verify that your Android phone is recognized:

```bash
adb devices
```
*You should see your device listed, e.g.: `192.168.0.x:xxxx device`.*

### Step 2: Start the Metro Dev Server
Run Metro with cache clearing:

```bash
cd frontend
npx expo start --clear
```

- Press `a` in the terminal to launch the app on your connected Android device.
- Alternatively, if the development build APK is already installed on your device, just open the **Bible Unlock** app from your phone's home screen. It will automatically connect to your Metro server.

---

## 🛠️ Native Android Build Procedures

If you update native modules, add native dependencies, or need to rebuild the APK from scratch:

### Procedure A: Full Clean Build via Gradle (Recommended for debugging)

1. Open a terminal in `frontend/android`:
   ```bash
   cd frontend/android
   ```
2. Verify `gradle.properties` has the pinned JDK 21 path:
   ```properties
   org.gradle.java.home=C:/Program Files/Java/jdk-21.0.12
   org.gradle.java.installations.auto-download=false
   ```
3. Run the assemble task:
   ```bash
   ./gradlew app:assembleDebug
   ```
4. Install the newly generated APK onto your phone:
   ```bash
   adb install -r app/build/outputs/apk/debug/app-debug.apk
   ```
5. Launch the app on your device:
   ```bash
   adb shell am start -n com.bibleunlock.app/.MainActivity
   ```

### Procedure B: Standard Expo Run Command

From the `frontend` folder:

```bash
cd frontend
npm run android
# Or: npx expo run:android
```

---

## 🔍 Common Errors & How They Are Resolved

### 1. "Tried to access storage on the server... Node.js"
- **Why it happens**: Expo Router evaluates route files on Node.js during Metro startup/SSR. If native-only libraries (such as `react-native-mmkv` JSI bindings) are instantiated at the root of a file (`import time`), Node.js crashes because the native module doesn't exist on the host machine.
- **Solution**: Native storage modules in `src/lib/mmkv.ts` use **lazy initialization** (`getInstance()`). Never call `createMMKV()` in module global scope.

### 2. CMake / Prefab Native Compilation Failure with Java 25
- **Why it happens**: Gradle daemon running on Java 25 causes AGP / CMake to fail during `:react-native-nitro-modules:configureCMakeDebug` due to stderr warnings treated as errors.
- **Solution**: Keep `org.gradle.java.home` pinned to JDK 21 in `frontend/android/gradle.properties` and do not allow Gradle to auto-provision Java 25.

### 3. Route Collision in Expo Router
- **Why it happens**: Having both `src/app/index.tsx` and `src/app/(tabs)/index.tsx` causes Expo Router to attempt registering `/` twice, crashing the navigation tree in React Fabric.
- **Solution**: The single canonical home screen is located at `src/app/(tabs)/index.tsx`. Do not add an un-nested `src/app/index.tsx`.

---

## 📂 Project Architecture

- **`src/app/`**: Expo Router file-based routes (`(auth)`, `(tabs)`, and `paywall.tsx`).
- **`src/lib/`**:
  - `mmkv.ts`: High-performance local storage (with memory fallback and lazy initialization).
  - `auth.tsx`: Supabase OAuth & Guest session provider.
  - `bible.ts`: Offline Scripture parsing for WEB & KJV translations.
  - `readingTimer.ts`: Session tracking and daily goal progression.
  - `appBlocker.ts`: Cross-platform app blocking abstraction (Screen Time API on iOS, Accessibility Service on Android).
  - `purchases.ts`: RevenueCat integration for In-App Purchases.
- **`modules/android-blocker/`**: Native Android Expo Module implementing the Accessibility Service redirect overlay.

