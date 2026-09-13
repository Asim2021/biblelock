import React, { createContext, useContext, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import {
  getUserName,
  getDailyGoalMinutes,
  getBibleTranslation,
  getBlockedApps,
  getStreak,
} from './mmkv';
import { UserProfile } from '../types/database';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithApple: () => Promise<{ error: Error | null }>;
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const createLocalUser = (): User => ({
  id: 'local-user',
  app_metadata: {},
  user_metadata: { full_name: getUserName() },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
});

const createLocalProfile = (): UserProfile => ({
  id: 'local-user',
  email: null,
  display_name: getUserName(),
  avatar_url: null,
  is_premium: false,
  daily_goal_minutes: getDailyGoalMinutes(),
  translation: getBibleTranslation(),
  blocked_apps: getBlockedApps(),
  current_streak: getStreak().currentStreak,
  last_read_date: getStreak().lastReadDate,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: createLocalUser(),
  profile: createLocalProfile(),
  isLoading: false,
  signInWithGoogle: async () => ({ error: null }),
  signInWithApple: async () => ({ error: null }),
  signInAsGuest: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
});

// ponytail: 100% offline local user session — no network latency or login prompts
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(() => createLocalUser());
  const [profile, setProfile] = useState<UserProfile | null>(() => createLocalProfile());
  const [isLoading] = useState(false);

  const refreshProfile = async () => {
    setUser(createLocalUser());
    setProfile(createLocalProfile());
  };

  const signInWithGoogle = async () => ({ error: null });
  const signInWithApple = async () => ({ error: null });
  const signInAsGuest = async () => refreshProfile();
  const signOut = async () => refreshProfile();

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isLoading,
        signInWithGoogle,
        signInWithApple,
        signInAsGuest,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
