import React from 'react';
import { View, Text, StyleSheet, Image, Pressable, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sparkles, Heart, Compass, Type, Share2, BookmarkCheck, ArrowRight } from 'lucide-react-native';
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
      {/* Background preview image */}
      <Image
        source={SCROLL_BACKGROUNDS[7]} // Starry night Bethlehem
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        blurRadius={Platform.OS === 'android' ? 6 : 12}
      />

      {/* Dark gradient overlay layers */}
      <View style={[StyleSheet.absoluteFill, styles.overlay]}>
        <View style={{ flex: 1, backgroundColor: 'rgba(13, 18, 15, 0.75)' }} />
        <View style={{ height: '40%', backgroundColor: 'rgba(13, 18, 15, 0.95)' }} />
      </View>

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
  },
  overlay: {
    justifyContent: 'space-between',
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
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  featureList: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
    color: 'rgba(255, 255, 255, 0.65)',
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
    color: 'rgba(255, 255, 255, 0.45)',
    marginTop: 14,
    textAlign: 'center',
  },
});
