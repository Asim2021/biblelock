import { useEffect, useState, useRef, useCallback } from 'react';
import {
  getReadingProgress,
  setReadingProgress,
  addReadingSeconds,
  getDailyGoalMinutes,
  setDailyGoalMinutes as saveGoalMinutes,
  getStreak,
  updateStreakOnGoalMet,
} from './mmkv';
import { AppBlocker } from './appBlocker';
import { supabase } from './supabase';
import { SyncService } from './sync';

export interface ReadingTimerState {
  secondsRead: number;
  goalMinutes: number;
  goalSeconds: number;
  isGoalMet: boolean;
  progress: number;
  formattedTime: string;
  formattedGoal: string;
  streak: number;
  setGoalMinutes: (minutes: number) => void;
  resetToday: () => void;
  triggerUnshield: () => Promise<void>;
  triggerShield: () => Promise<void>;
}

export function formatSeconds(totalSecs: number): string {
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function useReadingTimer(isScreenFocused: boolean = true): ReadingTimerState {
  const [secondsRead, setSecondsRead] = useState(() => getReadingProgress());
  const [goalMinutes, setGoalMinutesState] = useState(() => getDailyGoalMinutes());
  const [streak, setStreak] = useState(() => getStreak().currentStreak);

  const goalSeconds = goalMinutes * 60;
  const isGoalMet = secondsRead >= goalSeconds;
  const progress = Math.min(1, goalSeconds > 0 ? secondsRead / goalSeconds : 0);

  const prevGoalMetRef = useRef(isGoalMet);

  // Sync goal met transition
  useEffect(() => {
    if (isGoalMet && !prevGoalMetRef.current) {
      // Transitioned to completed goal!
      const { currentStreak } = updateStreakOnGoalMet();
      setStreak(currentStreak);
      AppBlocker.unshieldApps();

      // Push completed streak to Supabase
      supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user?.id) {
          SyncService.syncReadingProgress(
            data.session.user.id,
            secondsRead,
            goalMinutes,
            true
          );
        }
      });
    }
    prevGoalMetRef.current = isGoalMet;
  }, [isGoalMet, secondsRead, goalMinutes]);

  // Tick reading timer when reader screen is actively focused
  useEffect(() => {
    if (!isScreenFocused) return;

    const interval = setInterval(() => {
      setSecondsRead((prev) => {
        const next = prev + 1;
        setReadingProgress(next);

        // Sync progress debounced in background
        supabase.auth.getSession().then(({ data }) => {
          if (data.session?.user?.id) {
            SyncService.syncReadingProgress(
              data.session.user.id,
              next,
              goalMinutes,
              next >= goalMinutes * 60
            );
          }
        });

        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isScreenFocused, goalMinutes]);

  const setGoalMinutes = useCallback((minutes: number) => {
    saveGoalMinutes(minutes);
    setGoalMinutesState(minutes);
  }, []);

  const resetToday = useCallback(() => {
    setReadingProgress(0);
    setSecondsRead(0);
    AppBlocker.shieldApps();
  }, []);

  const triggerUnshield = useCallback(async () => {
    await AppBlocker.unshieldApps();
  }, []);

  const triggerShield = useCallback(async () => {
    await AppBlocker.shieldApps();
  }, []);

  return {
    secondsRead,
    goalMinutes,
    goalSeconds,
    isGoalMet,
    progress,
    formattedTime: formatSeconds(secondsRead),
    formattedGoal: `${goalMinutes} min`,
    streak,
    setGoalMinutes,
    resetToday,
    triggerUnshield,
    triggerShield,
  };
}
