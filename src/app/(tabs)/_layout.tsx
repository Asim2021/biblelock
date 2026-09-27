import React from 'react';
import { Animated, Easing } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, BookOpen, Bookmark, ScrollText, Settings } from 'lucide-react-native';
import { useTheme } from '../../lib/themeContext';

/**
 * Tactical Industrial Snap Transition Spec (180ms)
 * Precision cubic bezier curve simulating high-speed mechanical telemetry indexing.
 */
const tacticalSnapTransitionSpec = {
  animation: 'timing' as const,
  config: {
    duration: 180,
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  },
};

/**
 * Direction-Aware Scene Style Interpolator
 * Translates ±40dp along the horizontal tab axis based on active index with synchronized opacity snap.
 */
const tacticalSnapSceneInterpolator = ({ current }: { current: { progress: Animated.AnimatedInterpolation<number> } }) => ({
  sceneStyle: {
    opacity: current.progress.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: [0, 1, 0],
    }),
    transform: [
      {
        translateX: current.progress.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: [-40, 0, 40],
        }),
      },
    ],
  },
});

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(8, insets.bottom);
  const { colors, isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'shift',
        transitionSpec: tacticalSnapTransitionSpec,
        sceneStyleInterpolator: tacticalSnapSceneInterpolator,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 56 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: isDark ? '#6b8277' : '#7b8c82',
        tabBarLabelStyle: {
          fontFamily: 'Inter_500Medium',
          fontSize: 11,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Home size={22} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ color, focused }) => (
            <Bookmark size={22} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="scroll"
        options={{
          title: 'Scroll',
          tabBarIcon: ({ color, focused }) => (
            <ScrollText size={22} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="reader"
        options={{
          title: 'Reader',
          tabBarIcon: ({ color, focused }) => (
            <BookOpen size={22} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <Settings size={22} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />
    </Tabs>
  );
}
