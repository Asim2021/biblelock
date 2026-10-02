import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  EBGaramond_400Regular,
  EBGaramond_400Regular_Italic,
  EBGaramond_600SemiBold,
  EBGaramond_700Bold,
} from '@expo-google-fonts/eb-garamond';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';

import '../../global.css';
import * as Notifications from 'expo-notifications';
import { ScriptureShield } from '../lib/scriptureShield';
import {
  isOnboardingCompleted,
  getDailyVerseNotificationsEnabled,
  getDailyVerseNotificationCount,
  getBibleTranslation,
} from '../lib/mmkv';
import { initRevenueCat } from '../lib/purchases';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider as NavigationThemeProvider, DarkTheme, DefaultTheme } from 'expo-router/react-navigation';
import { ThemeProvider as AppThemeProvider, useTheme } from '../lib/themeContext';

// Keep splash screen visible while loading resources
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigation() {
  const segments = useSegments();
  const router = useRouter();

  // Listen for notification taps and direct deep linking to the exact verse
  useEffect(() => {
    const handleNotificationData = (data: any) => {
      const book = typeof data?.book === 'string' ? data.book : undefined;
      const chapter = Number(data?.chapter);
      const verse = Number(data?.verse);
      if (book && !isNaN(chapter) && chapter > 0 && !isNaN(verse) && verse > 0) {
        router.push({
          pathname: '/reader',
          params: {
            book,
            chapter: String(chapter),
            verse: String(verse),
          },
        } as any);
      } else if (data?.url === 'bibleunlock://reader') {
        router.push('/reader' as any);
      }
    };

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      handleNotificationData(data);
    });

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        handleNotificationData(response.notification.request.content.data);
      }
    });

    return () => sub.remove();
  }, [router]);

  // Route protection
  useEffect(() => {
    const inTabsGroup = segments[0] === '(tabs)';
    const inOnboarding = segments[0] === 'onboarding';

    if (!isOnboardingCompleted() && inTabsGroup) {
      router.replace('/onboarding' as any);
    } else if (isOnboardingCompleted() && inOnboarding) {
      router.replace('/(tabs)' as any);
    }
  }, [segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="stats-detail" options={{ headerShown: false }} />
      <Stack.Screen
        name="paywall"
        options={{
          presentation: 'modal',
          headerShown: false,
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}

function ThemedNavigationWrapper() {
  const { isDark } = useTheme();
  return (
    <NavigationThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <RootNavigation />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    EBGaramond_400Regular,
    EBGaramond_400Regular_Italic,
    EBGaramond_600SemiBold,
    EBGaramond_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    PlayfairDisplay_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
      ScriptureShield.scheduleEveningReminder().catch(() => {});
      ScriptureShield.checkAndTriggerNotification().catch(() => {});
      if (getDailyVerseNotificationsEnabled()) {
        ScriptureShield.scheduleDailyVerseNotifications(
          getDailyVerseNotificationCount(),
          getBibleTranslation()
        ).catch(() => {});
      }
      initRevenueCat();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <ThemedNavigationWrapper />
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#0d120f',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
      }}
    >
      <Text
        style={{
          fontSize: 26,
          fontFamily: 'EBGaramond_700Bold',
          color: '#f5b800',
          marginBottom: 12,
          textAlign: 'center',
        }}
      >
        Peace Be With You
      </Text>
      <Text
        style={{
          fontSize: 14,
          fontFamily: 'Inter_400Regular',
          color: '#c8ded6',
          textAlign: 'center',
          marginBottom: 28,
          lineHeight: 22,
          maxWidth: 320,
        }}
      >
        An unexpected interruption occurred. Let's return to your quiet time in God's Word.
      </Text>
      <Pressable
        onPress={retry}
        style={{
          backgroundColor: '#f5b800',
          paddingHorizontal: 28,
          paddingVertical: 14,
          borderRadius: 14,
          shadowColor: '#f5b800',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <Text style={{ color: '#141413', fontFamily: 'Inter_700Bold', fontSize: 16 }}>
          Resume Bible Walk
        </Text>
      </Pressable>
    </View>
  );
}

