import { useEffect, useState, useRef, useCallback } from 'react';
import {
  getReadingProgress,
  setReadingProgress,
  addReadingSeconds,
  getDailyGoalMinutes,
  setDailyGoalMinutes as saveGoalMinutes,
  getStreak,
  updateStreakOnGoalMet,
  subscribeToGoalChanges,
  subscribeToProgressChanges,
  getTodayDateKey,
} from './mmkv';
import { AppBlocker } from './appBlocker';

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

  // Re-sync immediately when screen focus state changes
  useEffect(() => {
    if (isScreenFocused) {
      setSecondsRead(getReadingProgress());
      setGoalMinutesState(getDailyGoalMinutes());
      setStreak(getStreak().currentStreak);
    }
  }, [isScreenFocused]);

  // Subscribe to MMKV goal and progress changes across mounted screens
  useEffect(() => {
    const unsubGoal = subscribeToGoalChanges((newGoal) => {
      setGoalMinutesState(newGoal);
    });
    // Only subscribe to continuous 1-second progress ticks if this screen is actively focused
    // Background screens will resync immediately on focus via the isScreenFocused effect
    const unsubProgress = subscribeToProgressChanges((newSeconds, dateKey) => {
      if (isScreenFocused && dateKey === getTodayDateKey()) {
        setSecondsRead(newSeconds);
      }
    });

    return () => {
      unsubGoal();
      unsubProgress();
    };
  }, [isScreenFocused]);

  // Sync goal met transition: unshield if completed, re-shield if goal increased above progress
  useEffect(() => {
    if (isGoalMet && !prevGoalMetRef.current) {
      // Transitioned to completed goal!
      const { currentStreak } = updateStreakOnGoalMet();
      setStreak(currentStreak);
      AppBlocker.unshieldApps();
    } else if (!isGoalMet && prevGoalMetRef.current) {
      // Goal was increased above current reading seconds: re-shield apps!
      AppBlocker.shieldApps();
    }
    prevGoalMetRef.current = isGoalMet;
  }, [isGoalMet]);

  // Tick reading timer when reader screen is actively focused
  useEffect(() => {
    if (!isScreenFocused) return;

    const interval = setInterval(() => {
      const next = getReadingProgress() + 1;
      setReadingProgress(next);
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
