import { Platform, TextStyle, ViewStyle } from 'react-native';

/**
 * =============================================================================
 * RAW COLOR PALETTE (From DESIGN.md)
 * =============================================================================
 * Warm-canvas editorial aesthetic: tinted cream canvas, slab-serif headlines,
 * warm coral primary CTAs, and dark navy product surfaces.
 */
export const palette = {
  // Brand & Accent (Coral is the signature Anthropic/warm-editorial color)
  primary: '#cc785c',
  primaryActive: '#a9583e',
  primaryDisabled: '#e6dfd8',
  onPrimary: '#ffffff',

  // Ink & Body Text
  ink: '#141413',
  bodyStrong: '#252523',
  body: '#3d3d3a',
  muted: '#6c6a64',
  mutedSoft: '#8e8b82',

  // Cream Canvas & Surfaces (Light)
  canvas: '#faf9f5',
  surfaceSoft: '#f5f0e8',
  surfaceCard: '#efe9de',
  surfaceCreamStrong: '#e8e0d2',

  // Dark Navy Product Surfaces (Mockups, Terminal, Code, Dark Mode)
  surfaceDark: '#181715',
  surfaceDarkElevated: '#252320',
  surfaceDarkSoft: '#1f1e1b',
  onDark: '#faf9f5',
  onDarkSoft: '#a09d96',

  // Hairlines & Borders
  hairline: '#e6dfd8',
  hairlineSoft: '#ebe6df',

  // Semantic
  accentTeal: '#5db8a6',
  accentAmber: '#e8a55a',
  success: '#5db872',
  warning: '#d4a017',
  error: '#c64545',
} as const;

/**
 * =============================================================================
 * LIGHT & DARK SEMANTIC THEMES
 * =============================================================================
 */
export const lightPalette = {
  // Surfaces & Backgrounds
  background: palette.canvas,
  surface: palette.surfaceSoft,
  surfaceCard: palette.surfaceCard,
  surfaceElevated: palette.surfaceCreamStrong,
  surfaceSecondary: palette.surfaceSoft,
  
  // High-contrast dark surface for code blocks/mockups even within light mode
  surfaceCode: palette.surfaceDark,
  surfaceCodeInner: palette.surfaceDarkSoft,
  textOnCode: palette.onDark,

  // Text Hierarchy
  text: palette.ink,
  textStrong: palette.bodyStrong,
  textBody: palette.body,
  textMuted: palette.muted,
  textMutedSoft: palette.mutedSoft,

  // Hairlines & Borders
  border: palette.hairline,
  borderSoft: palette.hairlineSoft,

  // Brand / Interactive
  primary: palette.primary,
  primaryActive: palette.primaryActive,
  primaryDisabled: palette.primaryDisabled,
  onPrimary: palette.onPrimary,

  // Accents & Semantics
  accentTeal: palette.accentTeal,
  accentAmber: palette.accentAmber,
  success: palette.success,
  warning: palette.warning,
  error: palette.error,
} as const;

export const darkPalette = {
  // Surfaces & Backgrounds
  background: palette.surfaceDark,
  surface: palette.surfaceDarkSoft,
  surfaceCard: palette.surfaceDarkElevated,
  surfaceElevated: '#2c2925',
  surfaceSecondary: palette.surfaceDarkSoft,

  // Code blocks remain consistent with the dark surface palette
  surfaceCode: '#131210',
  surfaceCodeInner: '#1c1b18',
  textOnCode: palette.onDark,

  // Text Hierarchy
  text: palette.onDark,
  textStrong: '#f5f2eb',
  textBody: '#ded9cf',
  textMuted: palette.onDarkSoft,
  textMutedSoft: '#73706a',

  // Hairlines & Borders
  border: '#2e2c28',
  borderSoft: '#242320',

  // Brand / Interactive
  primary: palette.primary,
  primaryActive: palette.primaryActive,
  primaryDisabled: '#383530',
  onPrimary: palette.onPrimary,

  // Accents & Semantics
  accentTeal: palette.accentTeal,
  accentAmber: palette.accentAmber,
  success: palette.success,
  warning: palette.warning,
  error: palette.error,
} as const;

export type ThemeColors = typeof lightPalette;

export const colors = {
  raw: palette,
  light: lightPalette,
  dark: darkPalette,
} as const;

/**
 * =============================================================================
 * 8PT SPACING SCALE (Base unit 8pt, half-step 4pt)
 * =============================================================================
 * Covers tokens from DESIGN.md: xxs(4), xs(8), sm(12), md(16), lg(24),
 * xl(32), xxl(48), section(96).
 */
export const spacing = {
  0: 0,
  xxs: 4,     // 0.5 * 8pt
  xs: 8,      // 1 * 8pt
  sm: 12,     // 1.5 * 8pt
  md: 16,     // 2 * 8pt (Standard layout & screen padding)
  lg: 24,     // 3 * 8pt (Card internal padding small)
  xl: 32,     // 4 * 8pt (Card internal padding generous)
  xxl: 48,    // 6 * 8pt (Callout padding)
  section: 96,// 12 * 8pt (Major section vertical rhythm)

  // Explicit multiplier helpers
  1: 8,
  2: 16,
  3: 24,
  4: 32,
  5: 40,
  6: 48,
  8: 64,
  12: 96,
} as const;

export type Spacing = typeof spacing;

/**
 * =============================================================================
 * BORDER RADII SCALE
 * =============================================================================
 * Hierarchical radii: 8px for buttons/inputs, 12px for cards, 16px for hero,
 * 9999px for pills/badges.
 */
export const radii = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,      // Buttons, inputs, category tabs
  lg: 12,     // Content cards, feature cards, code window
  xl: 16,     // Hero containers, modal cards
  pill: 9999, // Badges, tags
  full: 9999, // Circular avatars, icon buttons
} as const;

export type Radii = typeof radii;

/**
 * =============================================================================
 * SHADOWS (Cross-platform React Native: iOS shadow props + Android elevation)
 * =============================================================================
 * Converted from CSS box-shadows:
 * - subtle: 0 1px 3px rgba(20, 20, 19, 0.08)
 * - card:   0 1px 2px rgba(0, 0, 0, 0.05)
 * - raised: 0 4px 12px rgba(0, 0, 0, 0.10)
 * - overlay:0 8px 24px rgba(0, 0, 0, 0.18)
 */
export interface ShadowToken extends ViewStyle {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export const shadows: Record<'none' | 'subtle' | 'card' | 'raised' | 'overlay', ShadowToken> = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  subtle: {
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  raised: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  overlay: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

export const darkShadows: Record<'none' | 'subtle' | 'card' | 'raised' | 'overlay', ShadowToken> = {
  none: shadows.none,
  subtle: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 1,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  raised: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 5,
  },
  overlay: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
    elevation: 10,
  },
} as const;

export type Shadows = typeof shadows;

/**
 * =============================================================================
 * TYPOGRAPHY & EXPO-FONT LOAD CONFIGURATION
 * =============================================================================
 * Equivalents:
 * - Editorial Serif / Scripture: Lora (primary) or Source Serif 4 (alternative)
 * - Humanist Sans / UI: Inter
 * - Code / Monospace: JetBrains Mono
 */

export const fontNames = {
  // Scripture & Display Serif (Equivalents to Copernicus / Tiempos)
  serifRegular: 'Lora_400Regular',
  serifItalic: 'Lora_400Regular_Italic',
  serifSemiBold: 'Lora_600SemiBold',
  serifBold: 'Lora_700Bold',

  // Alternate Scripture Serif (Source Serif 4)
  sourceSerifRegular: 'SourceSerif4_400Regular',
  sourceSerifItalic: 'SourceSerif4_400Italic',
  sourceSerifSemiBold: 'SourceSerif4_600SemiBold',
  sourceSerifBold: 'SourceSerif4_700Bold',

  // Humanist Sans UI (Equivalents to StyreneB)
  sansRegular: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemiBold: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',

  // Monospace
  monoRegular: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
} as const;

/**
 * Font definitions map for expo-font (use with Font.loadAsync or useFonts hook).
 * When installing Google font packages:
 *   npx expo install @expo-google-fonts/lora @expo-google-fonts/inter @expo-google-fonts/source-serif-4 @expo-google-fonts/jetbrains-mono
 * Or bundle custom TTF/OTF files under assets/fonts/
 */
export const fontFallbacks = {
  serif: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'serif',
  }),
  sans: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'sans-serif',
  }),
  mono: Platform.select({
    ios: 'Courier',
    android: 'monospace',
    default: 'monospace',
  }),
} as const;

/**
 * Typography hierarchy tokens from DESIGN.md converted to React Native TextStyle.
 */
export const typography = {
  // Display Serif (Editorial Headlines - Copernicus / Lora equivalent)
  displayXl: {
    fontFamily: fontNames.serifRegular,
    fontSize: 64,
    lineHeight: 67, // 1.05 * 64
    letterSpacing: -1.5,
    fontWeight: '400',
  } as TextStyle,

  displayLg: {
    fontFamily: fontNames.serifRegular,
    fontSize: 48,
    lineHeight: 53, // 1.1 * 48
    letterSpacing: -1,
    fontWeight: '400',
  } as TextStyle,

  displayMd: {
    fontFamily: fontNames.serifRegular,
    fontSize: 36,
    lineHeight: 41, // 1.15 * 36
    letterSpacing: -0.5,
    fontWeight: '400',
  } as TextStyle,

  displaySm: {
    fontFamily: fontNames.serifRegular,
    fontSize: 28,
    lineHeight: 34, // 1.2 * 28
    letterSpacing: -0.3,
    fontWeight: '400',
  } as TextStyle,

  // Scripture Reading (Serif optimized for long-form biblical text)
  scriptureVerse: {
    fontFamily: fontNames.serifRegular,
    fontSize: 18,
    lineHeight: 30,
    letterSpacing: 0,
    fontWeight: '400',
  } as TextStyle,

  scriptureVerseAlt: {
    fontFamily: fontNames.sourceSerifRegular,
    fontSize: 18,
    lineHeight: 30,
    letterSpacing: 0,
    fontWeight: '400',
  } as TextStyle,

  // UI Titles (Humanist Sans - StyreneB / Inter equivalent)
  titleLg: {
    fontFamily: fontNames.sansMedium,
    fontSize: 22,
    lineHeight: 29, // 1.3 * 22
    letterSpacing: 0,
    fontWeight: '500',
  } as TextStyle,

  titleMd: {
    fontFamily: fontNames.sansMedium,
    fontSize: 18,
    lineHeight: 25, // 1.4 * 18
    letterSpacing: 0,
    fontWeight: '500',
  } as TextStyle,

  titleSm: {
    fontFamily: fontNames.sansMedium,
    fontSize: 16,
    lineHeight: 22, // 1.4 * 16
    letterSpacing: 0,
    fontWeight: '500',
  } as TextStyle,

  // Body Text
  bodyMd: {
    fontFamily: fontNames.sansRegular,
    fontSize: 16,
    lineHeight: 25, // 1.55 * 16
    letterSpacing: 0,
    fontWeight: '400',
  } as TextStyle,

  bodySm: {
    fontFamily: fontNames.sansRegular,
    fontSize: 14,
    lineHeight: 22, // 1.55 * 14
    letterSpacing: 0,
    fontWeight: '400',
  } as TextStyle,

  // Captions & Badges
  caption: {
    fontFamily: fontNames.sansMedium,
    fontSize: 13,
    lineHeight: 18, // 1.4 * 13
    letterSpacing: 0,
    fontWeight: '500',
  } as TextStyle,

  captionUppercase: {
    fontFamily: fontNames.sansMedium,
    fontSize: 12,
    lineHeight: 17, // 1.4 * 12
    letterSpacing: 1.5,
    fontWeight: '500',
    textTransform: 'uppercase',
  } as TextStyle,

  // Code / Monospace
  code: {
    fontFamily: fontNames.monoRegular,
    fontSize: 14,
    lineHeight: 22, // 1.6 * 14
    letterSpacing: 0,
    fontWeight: '400',
  } as TextStyle,

  // Button & Navigation
  button: {
    fontFamily: fontNames.sansMedium,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0,
    fontWeight: '500',
  } as TextStyle,

  navLink: {
    fontFamily: fontNames.sansMedium,
    fontSize: 14,
    lineHeight: 20, // 1.4 * 14
    letterSpacing: 0,
    fontWeight: '500',
  } as TextStyle,
} as const;

export type Typography = typeof typography;

/**
 * =============================================================================
 * COMPONENT CONTRACTS & METRICS
 * =============================================================================
 * Fixed heights, touch targets, and continuous squircle borderCurves per Expo HIG.
 */
export const componentMetrics = {
  button: {
    height: 40,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: radii.md,
    borderCurve: 'continuous' as const,
  },
  iconButtonCircular: {
    size: 36,
    borderRadius: radii.full,
  },
  textInput: {
    height: 40,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderCurve: 'continuous' as const,
  },
  card: {
    padding: spacing.xl, // 32px
    borderRadius: radii.lg,
    borderCurve: 'continuous' as const,
  },
  cardCompact: {
    padding: spacing.lg, // 24px
    borderRadius: radii.lg,
    borderCurve: 'continuous' as const,
  },
  topNav: {
    height: 64,
  },
} as const;

/**
 * =============================================================================
 * COMPLETE THEME FACTORY
 * =============================================================================
 */
export function createTheme(mode: 'light' | 'dark' = 'light') {
  const isDark = mode === 'dark';
  return {
    isDark,
    mode,
    colors: isDark ? darkPalette : lightPalette,
    rawColors: palette,
    spacing,
    radii,
    shadows: isDark ? darkShadows : shadows,
    typography,
    fontNames,
    fontFallbacks,
    componentMetrics,
  } as const;
}

export type Theme = ReturnType<typeof createTheme>;

// Default light theme export
export const theme = createTheme('light');
export default theme;
