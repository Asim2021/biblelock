import React from 'react';
import { View, Text, StyleSheet, Image, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sparkles, Heart, Type, Share2, BookmarkCheck, ArrowRight } from 'lucide-react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useTheme } from '../lib/themeContext';
import { SCROLL_BACKGROUNDS } from '../../assets/scroll-backgrounds';

export function ScrollPaywallGate() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const features = [
    {
      icon: Sparkles,
      title: 'Full-Screen Scripture Feed',
      description: 'Swipe through inspiring verses paired with sacred, high-resolution biblical imagery.',
    },
    {
      icon: Heart,
      title: 'Heart & Mood Guidance',
      description: 'Filter verses by what your spirit needs right now—peace, strength, comfort, or joy.',
    },
    {
      icon: Type,
      title: '3 Sacred Typefaces',
      description: 'Custom typography tailored to verse length for effortless reading and meditation.',
    },
    {
      icon: Share2,
      title: 'Share as Sacred Art',
      description: 'Export and share any verse as a visual artwork directly to your stories or friends.',
    },
    {
      icon: BookmarkCheck,
      title: 'Daily Reading Credit',
      description: 'Time spent in Bible Scroll automatically counts toward your daily Scripture goal.',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: '#0d120f' }]}>
      {/* Background preview image - full screen cover */}
      <Image
        source={SCROLL_BACKGROUNDS[7] || SCROLL_BACKGROUNDS[0]} // Starry night Bethlehem
        style={[StyleSheet.absoluteFill, styles.bgImage]}
        resizeMode="cover"
      />

      {/* Smooth full-bleed dark gradient overlay */}
      <Svg
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
        width="100%"
        height="100%"
      >
        <Defs>
          <LinearGradient id="scrollGateOverlay" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#0d120f" stopOpacity="0.55" />
            <Stop offset="30%" stopColor="#0d120f" stopOpacity="0.68" />
            <Stop offset="70%" stopColor="#0d120f" stopOpacity="0.82" />
            <Stop offset="100%" stopColor="#0d120f" stopOpacity="0.94" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#scrollGateOverlay)" />
      </Svg>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Badge */}
        <View style={styles.badgeContainer}>
          <View style={styles.badge}>
            <Sparkles size={14} color="#f5b800" />
            <Text style={styles.badgeText}>SANCTUARY EXCLUSIVE</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Bible Scroll</Text>
        <Text style={styles.subtitle}>
          Immerse yourself in God's Word through an infinite, sacred visual experience.
        </Text>

        {/* Features List */}
        <View style={styles.featureList}>
          {features.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <View key={idx} style={styles.featureItem}>
                <View style={styles.featureIconBox}>
                  <IconComponent size={20} color="#f5b800" />
                </View>
                <View style={styles.featureTextBox}>
                  <Text style={styles.featureTitle}>{item.title}</Text>
                  <Text style={styles.featureDesc}>{item.description}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* CTA Button */}
        <Pressable
          onPress={() => router.push('/paywall')}
          style={({ pressed }) => [
            styles.ctaButton,
            {
              transform: [{ scale: pressed ? 0.98 : 1 }],
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <Text style={styles.ctaButtonText}>Enter the Sanctuary</Text>
          <ArrowRight size={18} color="#141413" strokeWidth={2.5} />
        </Pressable>

        <Text style={styles.footerNote}>
          Start your free trial or unlock with Sanctuary membership.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  bgImage: {
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  badgeContainer: {
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 184, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 184, 0, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: '#f5b800',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 32,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  featureList: {
    width: '100%',
    backgroundColor: 'rgba(13, 18, 15, 0.65)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    gap: 16,
    marginBottom: 28,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  featureIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 184, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextBox: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#ffffff',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 18,
  },
  ctaButton: {
    width: '100%',
    backgroundColor: '#f5b800',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#f5b800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  ctaButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#141413',
  },
  footerNote: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255, 255, 255, 0.55)',
    marginTop: 14,
    textAlign: 'center',
  },
});
