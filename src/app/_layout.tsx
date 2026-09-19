import React, { useEffect } from 'react';
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

    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) {
          const data = response.notification.request.content.data;
          handleNotificationData(data);
        }
      })
      .catch(() => {});

    return () => {
      sub.remove();
    };
  }, [router]);

  useEffect(() => {
    const firstSegment = (segments as string[])[0];
    const inOnboarding = firstSegment === 'onboarding';
    const onboardingDone = isOnboardingCompleted();

    if (!onboardingDone) {
      if (!inOnboarding && firstSegment !== 'paywall') {
        router.replace('/onboarding' as any);
      }
    } else if (inOnboarding) {
      router.replace('/(tabs)' as any);
    }
  }, [segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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

