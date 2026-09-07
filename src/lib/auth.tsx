import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Session, User } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase, UserProfile } from './supabase';
import { storage } from './mmkv';

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfile(data as UserProfile);
      } else {
        // Fallback local profile if table does not exist or network is offline
        setProfile({
          id: userId,
          display_name: 'Bible Reader',
          is_premium: false,
          daily_goal_minutes: 10,
        });
      }
    } catch {
      setProfile({
        id: userId,
        display_name: 'Bible Reader',
        is_premium: false,
        daily_goal_minutes: 10,
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
        display_name: 'Guest Disciple',
        is_premium: false,
        daily_goal_minutes: 10,
      });
      setIsLoading(false);
      return;
    }

    // 2. Fetch Supabase session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      if (!isMounted) return;
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      if (existingSession?.user) {
        fetchProfile(existingSession.user.id);
      }
      setIsLoading(false);
    }).catch(() => {
      if (isMounted) setIsLoading(false);
    });

    // 3. Listen to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!isMounted) return;
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          await fetchProfile(newSession.user.id);
        } else if (!storage.getBoolean(GUEST_SESSION_KEY)) {
          setProfile(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signInWithOAuthProvider = async (provider: 'google' | 'apple') => {
    try {
      const redirectUrl = Linking.createURL('/auth/callback');
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
          const params = Linking.parse(res.url).queryParams;
          if (params?.access_token && params?.refresh_token) {
            await supabase.auth.setSession({
              access_token: params.access_token as string,
              refresh_token: params.refresh_token as string,
            });
          }
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
      display_name: 'Guest Disciple',
      is_premium: false,
      daily_goal_minutes: 10,
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
      await fetchProfile(user.id);
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
