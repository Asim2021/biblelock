import { supabase } from './supabase';
import {
  getTodayDateKey,
  getDailyGoalMinutes,
  setDailyGoalMinutes,
  getBibleTranslation,
  setBibleTranslation,
  getBlockedApps,
  setBlockedApps,
  getStreak,
  getReadingProgress,
  setReadingProgress,
  storage,
  STORAGE_KEYS,
} from './mmkv';
import { UserProfile } from '../types/database';

let _syncDebounceTimer: any = null;

export const SyncService = {
  /**
   * Pulls profile and reading state from Supabase on login and reconciles with local MMKV.
   */
  async syncOnLogin(userId: string): Promise<UserProfile | null> {
    try {
      const today = getTodayDateKey();

      // 1. Fetch remote profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.warn('[Sync] Profile fetch error:', profileError.message);
      }

      const localStreak = getStreak();
      const localGoal = getDailyGoalMinutes();
      const localTranslation = getBibleTranslation();
      const localBlocked = getBlockedApps();

      if (profile) {
        // Reconcile settings: remote takes precedence if present
        if (profile.daily_goal_minutes) {
          setDailyGoalMinutes(profile.daily_goal_minutes);
        }
        if (profile.translation) {
          setBibleTranslation(profile.translation as 'WEB' | 'KJV');
        }
        if (Array.isArray(profile.blocked_apps) && profile.blocked_apps.length > 0) {
          setBlockedApps(profile.blocked_apps);
        }

        // Reconcile streaks (keep highest)
        const remoteStreak = profile.current_streak ?? 0;
        if (remoteStreak > localStreak.currentStreak) {
          storage.set(STORAGE_KEYS.CURRENT_STREAK, remoteStreak);
          if (profile.last_read_date) {
            storage.set(STORAGE_KEYS.LAST_READ_DATE, profile.last_read_date);
          }
        } else if (localStreak.currentStreak > remoteStreak) {
          // Push local streak to remote
          await supabase
            .from('profiles')
            .update({
              current_streak: localStreak.currentStreak,
              last_read_date: localStreak.lastReadDate,
            })
            .eq('id', userId);
        }
      } else {
        // No profile found yet: provision profile from local MMKV defaults
        const newProfile = {
          id: userId,
          daily_goal_minutes: localGoal,
          translation: localTranslation,
          blocked_apps: localBlocked,
          current_streak: localStreak.currentStreak,
          last_read_date: localStreak.lastReadDate,
        };
        await supabase.from('profiles').upsert(newProfile);
      }

      // 2. Fetch today's reading session
      const { data: sessionData } = await supabase
        .from('reading_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle();

      const localSeconds = getReadingProgress(today);
      if (sessionData) {
        if (sessionData.seconds_read > localSeconds) {
          setReadingProgress(sessionData.seconds_read, today);
        } else if (localSeconds > sessionData.seconds_read) {
          await supabase.from('reading_sessions').upsert({
            user_id: userId,
            date: today,
            seconds_read: localSeconds,
            goal_minutes: localGoal,
            is_goal_met: localSeconds >= localGoal * 60,
          });
        }
      }

      return profile;
    } catch (e: any) {
      console.warn('[Sync] syncOnLogin non-fatal error:', e.message);
      return null;
    }
  },

  /**
   * Pushes daily reading progress to Supabase asynchronously with debouncing.
   */
  async syncReadingProgress(
    userId: string,
    secondsRead: number,
    goalMinutes: number,
    isGoalMet: boolean
  ): Promise<void> {
    if (!userId || userId === 'guest-user') return;

    if (_syncDebounceTimer) {
      clearTimeout(_syncDebounceTimer);
    }

    _syncDebounceTimer = setTimeout(async () => {
      try {
        const today = getTodayDateKey();
        const streak = getStreak();

        // 1. Upsert reading session
        await supabase.from('reading_sessions').upsert(
          {
            user_id: userId,
            date: today,
            seconds_read: secondsRead,
            goal_minutes: goalMinutes,
            is_goal_met: isGoalMet,
          },
          { onConflict: 'user_id,date' }
        );

        // 2. Update profile streak if goal met
        if (isGoalMet) {
          await supabase
            .from('profiles')
            .update({
              current_streak: streak.currentStreak,
              last_read_date: today,
            })
            .eq('id', userId);
        }
      } catch (err: any) {
        // Non-fatal: offline progress persists in local MMKV
        console.warn('[Sync] Reading progress sync skipped (offline):', err.message);
      }
    }, 2000); // 2-second debounce to avoid excessive network calls
  },

  /**
   * Pushes updated user settings (goal, translation, blocked apps) to Supabase.
   */
  async syncSettings(
    userId: string,
    settings: {
      daily_goal_minutes?: number;
      translation?: 'WEB' | 'KJV';
      blocked_apps?: string[];
    }
  ): Promise<void> {
    if (!userId || userId === 'guest-user') return;

    try {
      await supabase
        .from('profiles')
        .update(settings)
        .eq('id', userId);
    } catch (e: any) {
      console.warn('[Sync] Settings sync notice:', e.message);
    }
  },
};
