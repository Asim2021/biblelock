import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, Image, ImageSourcePropType } from 'react-native';
import { ScrollVerseItem } from '../lib/bible';
import { ScrollFont } from '../lib/mmkv';

interface ScrollVerseCardProps {
  verse: ScrollVerseItem;
  bgSource: ImageSourcePropType;
  font: ScrollFont;
  cardHeight: number;
  cardWidth: number;
  topInset: number;
  bottomInset: number;
}

const FONT_MAP: Record<ScrollFont, string> = {
  garamond: 'EBGaramond_400Regular',
  inter: 'Inter_400Regular',
  playfair: 'PlayfairDisplay_700Bold',
};

function getAdaptiveFontSize(len: number): number {
  if (len <= 60) return 32;
  if (len <= 120) return 26;
  if (len <= 200) return 22;
  if (len <= 300) return 19;
  if (len <= 450) return 17;
  return 15;
}

export const ScrollVerseCard = React.memo(
  forwardRef<View, ScrollVerseCardProps>(
    ({ verse, bgSource, font, cardHeight, cardWidth, topInset, bottomInset }, ref) => {
      const fontSize = getAdaptiveFontSize(verse.text.length);
      const lineHeight = Math.round(fontSize * 1.55);

      return (
        <View
          ref={ref}
          collapsable={false}
          style={[styles.container, { height: cardHeight, width: cardWidth }]}
        >
          {/* Background Image */}
          <Image
            source={bgSource}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />

          {/* Top Vignette (for mood chips readability) */}
          <View style={[styles.topVignette, { height: topInset + 80 }]} />

          {/* Full-bleed dark tint */}
          <View style={[StyleSheet.absoluteFill, styles.darkTint]} />

          {/* Bottom Gradient Stack */}
          <View style={[StyleSheet.absoluteFill, styles.bottomGradientContainer]}>
            <View style={styles.gradientStop1} />
            <View style={styles.gradientStop2} />
            <View style={[styles.gradientStop3, { height: bottomInset + 80 }]} />
          </View>

          {/* Verse Text & Citation */}
          <View
            style={[
              StyleSheet.absoluteFill,
              styles.contentContainer,
              {
                paddingTop: topInset + 60,
                paddingBottom: bottomInset + 70,
              },
            ]}
          >
            <Text
              style={[
                styles.verseText,
                {
                  fontFamily: FONT_MAP[font] || FONT_MAP.garamond,
                  fontSize,
                  lineHeight,
                },
              ]}
            >
              "{verse.text.trim()}"
            </Text>

            <View style={styles.citationContainer}>
              <View style={styles.goldDivider} />
              <Text style={styles.citationText}>
                {verse.bookName} {verse.chapter}:{verse.verse}
              </Text>
            </View>
          </View>
        </View>
      );
    }
  )
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  topVignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  darkTint: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  bottomGradientContainer: {
    justifyContent: 'flex-end',
  },
  gradientStop1: {
    height: 90,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  gradientStop2: {
    height: 90,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  gradientStop3: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  contentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  verseText: {
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  citationContainer: {
    marginTop: 22,
    alignItems: 'center',
  },
  goldDivider: {
    width: 32,
    height: 2,
    backgroundColor: 'rgba(245, 184, 0, 0.8)',
    borderRadius: 1,
    marginBottom: 12,
  },
  citationText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
