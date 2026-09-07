import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from './supabase';
import {
  storage,
  getDailyGoalMinutes,
  getBibleTranslation,
  getBlockedApps,
  getStreak,
} from './mmkv';
import { UserProfile } from '../types/database';
import { SyncService } from './sync';

WebBrowser.maybeCompleteAuthSession();

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

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  signInWithGoogle: async () => ({ error: null }),
  signInWithApple: async () => ({ error: null }),
  signInAsGuest: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
});

const GUEST_SESSION_KEY = 'guest_mode_enabled';

/**
 * Handles incoming auth redirect URL, supporting PKCE code exchange,
 * query parameter tokens, and hash fragment tokens.
 */
async function handleAuthRedirectUrl(url: string): Promise<{ session: Session | null; error: Error | null }> {
  try {
    const parsed = Linking.parse(url);

    // 1. PKCE Flow: exchange Authorization code for session
    const code = parsed.queryParams?.code as string | undefined;
    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
      return { session: data.session, error: null };
    }

    // 2. Query param tokens (Direct callback)
    const accessToken = parsed.queryParams?.access_token as string | undefined;
    const refreshToken = parsed.queryParams?.refresh_token as string | undefined;
    if (accessToken && refreshToken) {
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) throw error;
      return { session: data.session, error: null };
    }

    // 3. Hash fragment tokens (Implicit OAuth fallback)
    const hash = url.split('#')[1];
    if (hash) {
      const hashParams = new URLSearchParams(hash);
      const hashAccess = hashParams.get('access_token');
      const hashRefresh = hashParams.get('refresh_token');
      if (hashAccess && hashRefresh) {
        const { data, error } = await supabase.auth.setSession({
          access_token: hashAccess,
          refresh_token: hashRefresh,
        });
        if (error) throw error;
        return { session: data.session, error: null };
      }
    }

    return { session: null, error: null };
  } catch (err: any) {
    console.warn('[Auth] Redirect URL exchange notice:', err.message);
    return { session: null, error: err as Error };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string, currentUser?: User | null) => {
    try {
      const activeUser = currentUser || user;
      const synced = await SyncService.syncOnLogin(userId);
      if (synced) {
        setProfile(synced);
      } else {
        // Fallback local profile if table does not exist or offline
        const fallback: UserProfile = {
          id: userId,
          email: activeUser?.email || null,
          display_name:
            activeUser?.user_metadata?.full_name ||
            activeUser?.user_metadata?.name ||
            activeUser?.email?.split('@')[0] ||
            'Bible Reader',
          avatar_url: activeUser?.user_metadata?.avatar_url || activeUser?.user_metadata?.picture || null,
          is_premium: false,
          daily_goal_minutes: getDailyGoalMinutes(),
          translation: getBibleTranslation(),
          blocked_apps: getBlockedApps(),
          current_streak: getStreak().currentStreak,
          last_read_date: getStreak().lastReadDate,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setProfile(fallback);
      }
    } catch {
      setProfile({
        id: userId,
        email: null,
        display_name: 'Bible Reader',
        avatar_url: null,
        is_premium: false,
        daily_goal_minutes: 10,
        translation: 'WEB',
        blocked_apps: getBlockedApps(),
        current_streak: 0,
        last_read_date: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  };

  useEffect(() => {
    let isMounted = true;

    // 1. Check guest session first
    const isGuest = storage.getBoolean(GUEST_SESSION_KEY);
    if (isGuest) {
      const guestUser: User = {
        id: 'guest-user',
        app_metadata: {},
        user_metadata: { full_name: 'Guest Disciple' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      };
      setUser(guestUser);
      setProfile({
        id: 'guest-user',
        email: null,
        display_name: 'Guest Disciple',
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
      setIsLoading(false);
      return;
    }

    // 2. Fetch Supabase session
    supabase.auth
      .getSession()
      .then(({ data: { session: existingSession } }) => {
        if (!isMounted) return;
        setSession(existingSession);
        setUser(existingSession?.user ?? null);
        if (existingSession?.user) {
          fetchProfile(existingSession.user.id, existingSession.user);
        }
        setIsLoading(false);
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });

    // 3. Deep link event listener for OAuth redirects
    const linkingSub = Linking.addEventListener('url', async (event) => {
      if (event.url && (event.url.includes('auth/callback') || event.url.includes('code='))) {
        const { session: newSession } = await handleAuthRedirectUrl(event.url);
        if (newSession && isMounted) {
          setSession(newSession);
          setUser(newSession.user);
          await fetchProfile(newSession.user.id, newSession.user);
        }
      }
    });

    // 4. Check initial deep link on cold launch
    Linking.getInitialURL().then(async (initialUrl) => {
      if (initialUrl && (initialUrl.includes('auth/callback') || initialUrl.includes('code='))) {
        const { session: newSession } = await handleAuthRedirectUrl(initialUrl);
        if (newSession && isMounted) {
          setSession(newSession);
          setUser(newSession.user);
          await fetchProfile(newSession.user.id, newSession.user);
        }
      }
    });

    // 5. Listen to Supabase auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!isMounted) return;
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          await fetchProfile(newSession.user.id, newSession.user);
        } else if (!storage.getBoolean(GUEST_SESSION_KEY)) {
          setProfile(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      isMounted = false;
      linkingSub.remove();
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signInWithOAuthProvider = async (provider: 'google' | 'apple') => {
    try {
      const redirectUrl = Linking.createURL('auth/callback');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (data?.url) {
        const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
        if (res.type === 'success' && res.url) {
          const { error: redirectError } = await handleAuthRedirectUrl(res.url);
          if (redirectError) return { error: redirectError };
        }
      }
      return { error: null };
    } catch (e: any) {
      console.warn(`[Auth] ${provider} sign-in notice:`, e.message);
      return { error: e as Error };
    }
  };

  const signInWithGoogle = async () => signInWithOAuthProvider('google');
  const signInWithApple = async () => signInWithOAuthProvider('apple');

  const signInAsGuest = async () => {
    storage.set(GUEST_SESSION_KEY, true);
    const guestUser: User = {
      id: 'guest-user',
      app_metadata: {},
      user_metadata: { full_name: 'Guest Disciple' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };
    setUser(guestUser);
    setProfile({
      id: 'guest-user',
      email: null,
      display_name: 'Guest Disciple',
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
  };

  const signOut = async () => {
    storage.delete(GUEST_SESSION_KEY);
    await supabase.auth.signOut().catch(() => {});
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, user);
    }
  };

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
