import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import {
  getReadingProgress,
  getDailyGoalMinutes,
  getLastScreenTimeNotificationDate,
  setLastScreenTimeNotificationDate,
  getTodayDateKey,
} from './mmkv';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const ScriptureShield = {
  /**
   * Request notification permissions
   */
  requestPermissions: async (): Promise<boolean> => {
    if (Platform.OS === 'web') return false;
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      return finalStatus === 'granted';
    } catch (e) {
      console.warn('[ScriptureShield] Notification permissions error:', e);
      return false;
    }
  },

  /**
   * Check screen time / reading goal and prompt Scripture reflection
   */
  checkAndTriggerNotification: async (): Promise<boolean> => {
    if (Platform.OS === 'web') return false;

    const today = getTodayDateKey();
    const lastNotified = getLastScreenTimeNotificationDate();

    // Only notify at most once per day
    if (lastNotified === today) {
      return false;
    }

    const progressSeconds = getReadingProgress(today);
    const goalSeconds = getDailyGoalMinutes() * 60;

    // If goal not met, schedule friendly prompt
    if (progressSeconds < goalSeconds) {
      const hasPermission = await ScriptureShield.requestPermissions();
      if (!hasPermission) return false;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📖 Scripture Shield Reminder',
          body: 'Take a restorative pause from social apps. Read a chapter of Scripture to unlock your day!',
          data: { url: 'bibleunlock://reader' },
          sound: true,
        },
        trigger: null, // deliver immediately
      });

      setLastScreenTimeNotificationDate(today);
      return true;
    }

    return false;
  },

  /**
   * Schedule evening reminder if goal remains unmet by 8 PM
   */
  scheduleEveningReminder: async (): Promise<void> => {
    if (Platform.OS === 'web') return;

    try {
      const hasPermission = await ScriptureShield.requestPermissions();
      if (!hasPermission) return;

      // Cancel existing daily reminders to avoid duplicates
      await Notifications.cancelAllScheduledNotificationsAsync();

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '✝️ Evening Scripture Pause',
          body: 'Your daily reading goal is waiting for you. Close distracting apps and end your day in peace.',
          data: { url: 'bibleunlock://reader' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 20, // 8:00 PM
          minute: 0,
        },
      });
    } catch (e) {
      console.warn('[ScriptureShield] Failed to schedule evening reminder:', e);
    }
  },
};

export default ScriptureShield;
