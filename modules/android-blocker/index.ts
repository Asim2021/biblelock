import { requireNativeModule, Platform } from 'expo-modules-core';

export interface InstalledAppInfo {
  packageName: string;
  label: string;
  isSystemApp: boolean;
  icon?: string;
}

interface AndroidBlockerModuleInterface {
  isAccessibilityEnabled(): Promise<boolean>;
  requestAccessibilityPermission(): Promise<void>;
  setBlockedApps(packageNames: string[]): Promise<void>;
  setGoalMet(met: boolean): Promise<void>;
  isShieldActive(): Promise<boolean>;
  setShieldActive(active: boolean): Promise<void>;
  getInstalledApps(): Promise<InstalledAppInfo[]>;
}

let nativeModule: AndroidBlockerModuleInterface | null = null;

if (Platform.OS === 'android') {
  try {
    nativeModule = requireNativeModule<AndroidBlockerModuleInterface>('android-blocker');
  } catch (e) {
    console.warn('[AndroidBlocker] Native module not loaded (expected in Expo Go/prebuild):', e);
  }
}

export const AndroidBlocker = {
  isAccessibilityEnabled: async (): Promise<boolean> => {
    if (Platform.OS !== 'android' || !nativeModule) return false;
    return nativeModule.isAccessibilityEnabled();
  },

  requestAccessibilityPermission: async (): Promise<void> => {
    if (Platform.OS !== 'android' || !nativeModule) return;
    return nativeModule.requestAccessibilityPermission();
  },

  setBlockedApps: async (packageNames: string[]): Promise<void> => {
    if (Platform.OS !== 'android' || !nativeModule) return;
    return nativeModule.setBlockedApps(packageNames);
  },

  setGoalMet: async (met: boolean): Promise<void> => {
    if (Platform.OS !== 'android' || !nativeModule) return;
    return nativeModule.setGoalMet(met);
  },

  isShieldActive: async (): Promise<boolean> => {
    if (Platform.OS !== 'android' || !nativeModule) return false;
    return nativeModule.isShieldActive();
  },

  setShieldActive: async (active: boolean): Promise<void> => {
    if (Platform.OS !== 'android' || !nativeModule) return;
    return nativeModule.setShieldActive(active);
  },

  getInstalledApps: async (): Promise<InstalledAppInfo[]> => {
    if (Platform.OS !== 'android' || !nativeModule?.getInstalledApps) return [];
    try {
      return await nativeModule.getInstalledApps();
    } catch (e) {
      console.warn('[AndroidBlocker] getInstalledApps error:', e);
      return [];
    }
  },
};

export default AndroidBlocker;
