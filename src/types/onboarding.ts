export type LanguageCode = 'en' | 'es' | 'pt' | 'fr' | 'de';

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  translations: string;
}

export interface OnboardingData {
  language: LanguageCode;
  userName: string;
  readingFrequency: string[];
  biggestChallenges: string[];
  readingTimes: string[]; // e.g. ["07:00 AM", "08:00 PM"]
  durationMinutes: number; // 5, 10, 15, 30
  blockedApps: string[]; // list of package names e.g. ["com.instagram.android"]
  isCompleted: boolean;
}

export interface HabitDay {
  date: string; // YYYY-MM-DD
  dayLabel: string; // "Thu"
  dayNumber: number; // 3
  completed: boolean;
  isToday: boolean;
}

export interface ImpactStats {
  minutesRead: number;
  hoursSaved: number;
  sessions: number;
}

export interface BadgeItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  unlocked: boolean;
  requirement: string;
}
