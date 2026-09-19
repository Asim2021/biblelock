import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import {
  getReadingProgress,
  getDailyGoalMinutes,
  getLastScreenTimeNotificationDate,
  setLastScreenTimeNotificationDate,
  getTodayDateKey,
  getBibleTranslation,
} from './mmkv';
import { resolveVerseItem } from './bible';

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

/**
 * Calculate daytime distribution hours strictly between 7:00 AM and 10:00 PM (15 hours / 900 min).
 * Guarantees zero notifications between 10:01 PM and 6:59 AM.
 */
export function calculateDaytimeHours(count: number): { hour: number; minute: number }[] {
  if (count <= 0) return [];
  if (count === 1) return [{ hour: 8, minute: 0 }]; // 8:00 AM morning devotion

  const startMins = 7 * 60; // 7:00 AM
  const endMins = 22 * 60;  // 10:00 PM
  const totalMinutes = endMins - startMins; // 900 minutes
  const step = totalMinutes / (count - 1);

  return Array.from({ length: count }, (_, i) => {
    const mins = Math.round(startMins + i * step);
    return {
      hour: Math.floor(mins / 60),
      minute: mins % 60,
    };
  });
}

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
          data: { url: 'bibleunlock://reader', type: 'screen_time_reminder' },
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
   * Cancel existing daily devotional verse notifications
   */
  cancelDailyVerseNotifications: async (): Promise<void> => {
    if (Platform.OS === 'web') return;
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const notif of scheduled) {
        if (notif.content.data?.type === 'verse_devotional') {
          await Notifications.cancelScheduledNotificationAsync(notif.identifier);
        }
      }
    } catch (e) {
      console.warn('[ScriptureShield] Failed to cancel verse notifications:', e);
    }
  },

  /**
   * Schedule curated devotional verses strictly within daytime waking hours (7:00 AM – 10:00 PM).
   * 100% quiet night guarantee (10:01 PM - 6:59 AM silent).
   */
  scheduleDailyVerseNotifications: async (
    count: number,
    translation: 'WEB' | 'KJV' = getBibleTranslation()
  ): Promise<boolean> => {
    if (Platform.OS === 'web') return false;

    try {
      await ScriptureShield.cancelDailyVerseNotifications();

      if (count <= 0) return true;

      const hasPermission = await ScriptureShield.requestPermissions();
      if (!hasPermission) return false;

      const slots = calculateDaytimeHours(count);

      for (let i = 0; i < slots.length; i++) {
        const slot = slots[i];
        const verse = resolveVerseItem(translation, i);

        await Notifications.scheduleNotificationAsync({
          content: {
            title: `📖 ${verse.bookName} ${verse.chapter}:${verse.verseNum} (${translation})`,
            body: `"${verse.text}"`,
            data: {
              type: 'verse_devotional',
              book: verse.bookName,
              chapter: verse.chapter.toString(),
              verse: verse.verseNum.toString(),
            },
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: slot.hour,
            minute: slot.minute,
          },
        });
      }

      return true;
    } catch (e) {
      console.warn('[ScriptureShield] Failed to schedule verse notifications:', e);
      return false;
    }
  },

  /**
   * Schedule evening reminder if goal remains unmet by 8 PM
   */
  scheduleEveningReminder: async (): Promise<void> => {
    if (Platform.OS === 'web') return;

    try {
      const hasPermission = await ScriptureShield.requestPermissions();
      if (!hasPermission) return;

      // Cancel only existing evening reminders to preserve verse notifications
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const notif of scheduled) {
        if (notif.content.data?.type === 'evening_reminder') {
          await Notifications.cancelScheduledNotificationAsync(notif.identifier);
        }
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '✝️ Evening Scripture Pause',
          body: 'Your daily reading goal is waiting for you. Close distracting apps and end your day in peace.',
          data: { url: 'bibleunlock://reader', type: 'evening_reminder' },
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

