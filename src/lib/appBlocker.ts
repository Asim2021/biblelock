import { Platform } from 'react-native';
import * as DeviceActivity from 'react-native-device-activity';
import { AndroidBlocker } from '../../modules/android-blocker';
import {
  getBlockedApps,
  getIsShielded,
  setIsShielded,
  setBlockedApps as saveBlockedAppsToStorage,
} from './mmkv';

export interface BlockerStatus {
  isShielded: boolean;
  hasPermission: boolean;
  platform: 'ios' | 'android' | 'web';
}

export const AppBlocker = {
  /**
   * Request system permission (Screen Time on iOS, Accessibility on Android)
   */
  requestPermissions: async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      try {
        await DeviceActivity.requestAuthorization('individual');
        return true;
      } catch (e) {
        console.warn('[AppBlocker] iOS Screen Time authorization error:', e);
        return false;
      }
    } else if (Platform.OS === 'android') {
      try {
        await AndroidBlocker.requestAccessibilityPermission();
        return true;
      } catch (e) {
        console.warn('[AppBlocker] Android Accessibility permission error:', e);
        return false;
      }
    }
    return true;
  },

  /**
   * Check if permissions are currently granted
   */
  hasPermissions: async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      try {
        const status = DeviceActivity.getAuthorizationStatus();
        return (status as any) === 2 || (status as any) === 'approved';
      } catch {
        return false;
      }
    } else if (Platform.OS === 'android') {
      try {
        return await AndroidBlocker.isAccessibilityEnabled();
      } catch {
        return false;
      }
    }
    return true;
  },

  /**
   * Enable shielding on the configured apps
   */
  shieldApps: async (appsToBlock?: string[]): Promise<void> => {
    const list = appsToBlock || getBlockedApps();
    saveBlockedAppsToStorage(list);
    setIsShielded(true);

    if (Platform.OS === 'ios') {
      try {
        DeviceActivity.enableBlockAllMode('bibleunlock_reading_goal');
      } catch (e) {
        console.warn('[AppBlocker] iOS Shield failed:', e);
      }
    } else if (Platform.OS === 'android') {
      try {
        await AndroidBlocker.setBlockedApps(list);
        await AndroidBlocker.setGoalMet(false);
        await AndroidBlocker.setShieldActive(true);
      } catch (e) {
        console.warn('[AppBlocker] Android Shield failed:', e);
      }
    }
  },

  /**
   * Remove shields when reading goal is achieved
   */
  unshieldApps: async (): Promise<void> => {
    setIsShielded(false);

    if (Platform.OS === 'ios') {
      try {
        DeviceActivity.disableBlockAllMode('bibleunlock_reading_goal');
        DeviceActivity.resetBlocks('bibleunlock_reading_goal');
      } catch (e) {
        console.warn('[AppBlocker] iOS Unshield failed:', e);
      }
    } else if (Platform.OS === 'android') {
      try {
        await AndroidBlocker.setGoalMet(true);
      } catch (e) {
        console.warn('[AppBlocker] Android Unshield failed:', e);
      }
    }
  },

  /**
   * Query the unified status
   */
  getStatus: async (): Promise<BlockerStatus> => {
    const hasPermission = await AppBlocker.hasPermissions();
    const isShielded = getIsShielded();
    return {
      isShielded,
      hasPermission,
      platform: Platform.OS as 'ios' | 'android' | 'web',
    };
  },
};

export default AppBlocker;
