import React, { useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  Platform,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Minus, Plus, Check, Lock, X, Palette, Type, RotateCcw } from 'lucide-react-native';
import { useTheme } from '../../lib/themeContext';
import { useFeatureGate } from '../../lib/useFeatureGate';
import {
  ReaderPreferences,
  DEFAULT_READER_PREFERENCES,
  MIN_FONT_SIZE,
  MAX_FONT_SIZE,
  setReaderPreferences,
  resetReaderPreferences,
} from '../../lib/readerPreferences';

const FONT_SIZE_STEPS = [14, 16, 18, 20, 22, 24, 26];

interface ReaderAppearanceModalProps {
  visible: boolean;
  preferences: ReaderPreferences;
  onClose: () => void;
}

export function ReaderAppearanceModal({
  visible,
  preferences,
  onClose,
}: ReaderAppearanceModalProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { requirePremium, isPremium } = useFeatureGate();

  const preferencesRef = useRef(preferences);
  preferencesRef.current = preferences;

  const trackRef = useRef<View>(null);
  const trackLayoutRef = useRef<{ pageX: number; width: number }>({ pageX: 0, width: 0 });

  const updateFontSizeFromPageX = (touchPageX: number) => {
    const { pageX, width } = trackLayoutRef.current;
    if (width <= 0) return;
    const clampedX = Math.max(0, Math.min(touchPageX - pageX, width));
    const ratio = clampedX / width;
    const rawSize = MIN_FONT_SIZE + ratio * (MAX_FONT_SIZE - MIN_FONT_SIZE);
    const steppedSize = Math.round(rawSize / 2) * 2;
    const clampedSize = Math.max(MIN_FONT_SIZE, Math.min(steppedSize, MAX_FONT_SIZE));
    if (clampedSize !== preferencesRef.current.fontSize) {
      setReaderPreferences({ fontSize: clampedSize });
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt) => {
        const pageX = evt.nativeEvent.pageX;
        trackRef.current?.measure((_x, _y, width, _height, winPageX) => {
          trackLayoutRef.current = { pageX: winPageX, width };
          const clampedX = Math.max(0, Math.min(pageX - winPageX, width));
          const ratio = clampedX / width;
          const rawSize = MIN_FONT_SIZE + ratio * (MAX_FONT_SIZE - MIN_FONT_SIZE);
          const steppedSize = Math.round(rawSize / 2) * 2;
          const clampedSize = Math.max(MIN_FONT_SIZE, Math.min(steppedSize, MAX_FONT_SIZE));
          if (clampedSize !== preferencesRef.current.fontSize) {
            setReaderPreferences({ fontSize: clampedSize });
          }
        });
      },
      onPanResponderMove: (evt) => {
        updateFontSizeFromPageX(evt.nativeEvent.pageX);
      },
    })
  ).current;

  if (!visible) return null;

  const fontRatio = Math.max(
    0,
    Math.min(1, (preferences.fontSize - MIN_FONT_SIZE) / (MAX_FONT_SIZE - MIN_FONT_SIZE))
  );

  const isCustomized =
    preferences.fontSize !== DEFAULT_READER_PREFERENCES.fontSize ||
    preferences.fontFamily !== DEFAULT_READER_PREFERENCES.fontFamily ||
    preferences.readerTheme !== DEFAULT_READER_PREFERENCES.readerTheme;

  const handleDecreaseFont = () => {
    if (preferences.fontSize > MIN_FONT_SIZE) {
      setReaderPreferences({ fontSize: preferences.fontSize - 2 });
    }
  };

  const handleIncreaseFont = () => {
    if (preferences.fontSize < MAX_FONT_SIZE) {
      setReaderPreferences({ fontSize: preferences.fontSize + 2 });
    }
  };

  const handleSelectFontFamily = (family: 'serif' | 'sans') => {
    setReaderPreferences({ fontFamily: family });
  };

  const handleSelectTheme = (theme: 'system' | 'sepia' | 'midnight') => {
    if (theme !== 'system' && !isPremium) {
      const allowed = requirePremium(
        theme === 'sepia' ? 'Warm Sepia Reading Theme' : 'Midnight OLED Reading Theme'
      );
      if (!allowed) return;
    }
    setReaderPreferences({ readerTheme: theme });
  };

  const handleReset = () => {
    resetReaderPreferences();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: colors.surfaceElevated || colors.surface,
              borderColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.header,
              { borderBottomColor: colors.borderSubtle },
            ]}
          >
            <View style={styles.headerTitleRow}>
              <Type size={18} color={colors.accent} style={{ marginRight: 8 }} />
              <Text
                style={[
                  styles.headerTitle,
                  { color: colors.textPrimary },
                ]}
              >
                Reading Appearance
              </Text>
            </View>

            <View style={styles.headerActions}>
              <Pressable
                onPress={handleReset}
                disabled={!isCustomized}
                hitSlop={10}
                style={[
                  styles.resetButton,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    opacity: isCustomized ? 1 : 0.4,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Reset reading appearance to defaults"
              >
                <RotateCcw size={15} color={isCustomized ? colors.accent : colors.textMuted} />
              </Pressable>

              <Pressable
                onPress={onClose}
                hitSlop={12}
                style={[
                  styles.closeButton,
                  { backgroundColor: colors.surfaceSubtle },
                ]}
              >
                <X size={16} color={colors.textSecondary} />
              </Pressable>
            </View>
          </View>


          {/* Section 1: Font Sizing Stepper */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                TEXT SIZE
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Inter_700Bold',
                  color: colors.accent,
                }}
              >
                {preferences.fontSize} px
              </Text>
            </View>

            <View
              style={[
                styles.stepperContainer,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.border,
                },
              ]}
            >
              <Pressable
                onPress={handleDecreaseFont}
                disabled={preferences.fontSize <= MIN_FONT_SIZE}
                style={({ pressed }) => [
                  styles.stepperBtn,
                  {
                    opacity: preferences.fontSize <= MIN_FONT_SIZE ? 0.4 : pressed ? 0.7 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Decrease font size"
              >
                <Minus size={18} color={colors.textPrimary} />
                <Text style={[styles.stepperSubtext, { color: colors.textMuted }]}>A-</Text>
              </Pressable>

              {/* Interactive Font Size Slider */}
              <View
                ref={trackRef}
                style={styles.sliderInteractiveArea}
                onLayout={(e) => {
                  const { width } = e.nativeEvent.layout;
                  trackRef.current?.measure((_x, _y, _w, _h, winPageX) => {
                    trackLayoutRef.current = { pageX: winPageX, width };
                  });
                }}
                {...panResponder.panHandlers}
                accessible={true}
                accessibilityRole="adjustable"
                accessibilityLabel="Font size"
                accessibilityValue={{
                  min: MIN_FONT_SIZE,
                  max: MAX_FONT_SIZE,
                  now: preferences.fontSize,
                  text: `${preferences.fontSize} pixels`,
                }}
              >
                {/* Background track line */}
                <View
                  style={[
                    styles.sliderTrackBg,
                    { backgroundColor: colors.borderSubtle || 'rgba(150, 150, 150, 0.2)' },
                  ]}
                />

                {/* Active fill track */}
                <View
                  style={[
                    styles.sliderTrackFill,
                    {
                      width: `${fontRatio * 100}%`,
                      backgroundColor: colors.accent,
                    },
                  ]}
                />

                {/* Discrete step tick notches */}
                {FONT_SIZE_STEPS.map((step) => {
                  const stepRatio = (step - MIN_FONT_SIZE) / (MAX_FONT_SIZE - MIN_FONT_SIZE);
                  const isPassed = preferences.fontSize >= step;
                  return (
                    <View
                      key={step}
                      pointerEvents="none"
                      style={[
                        styles.sliderTick,
                        {
                          left: `${stepRatio * 100}%`,
                          backgroundColor: isPassed ? colors.accent : colors.border,
                        },
                      ]}
                    />
                  );
                })}

                {/* Tactile Thumb Knob */}
                <View
                  pointerEvents="none"
                  style={[
                    styles.sliderThumb,
                    {
                      left: `${fontRatio * 100}%`,
                      borderColor: colors.accent,
                      backgroundColor: '#FFFFFF',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.sliderThumbInnerDot,
                      { backgroundColor: colors.accent },
                    ]}
                  />
                </View>
              </View>

              <Pressable
                onPress={handleIncreaseFont}
                disabled={preferences.fontSize >= MAX_FONT_SIZE}
                style={({ pressed }) => [
                  styles.stepperBtn,
                  {
                    opacity: preferences.fontSize >= MAX_FONT_SIZE ? 0.4 : pressed ? 0.7 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Increase font size"
              >
                <Plus size={18} color={colors.textPrimary} />
                <Text style={[styles.stepperSubtext, { color: colors.textMuted }]}>A+</Text>
              </Pressable>
            </View>
          </View>

          {/* Section 2: Typeface Selection */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              TYPEFACE
            </Text>

            <View style={styles.row}>
              <Pressable
                onPress={() => handleSelectFontFamily('serif')}
                style={[
                  styles.choiceCard,
                  {
                    backgroundColor: preferences.fontFamily === 'serif' ? colors.accentBg : colors.surfaceSubtle,
                    borderColor: preferences.fontFamily === 'serif' ? colors.accent : colors.borderSubtle,
                  },
                ]}
              >
                <Text
                  style={{
                    fontFamily: 'EBGaramond_700Bold',
                    fontSize: 18,
                    color: preferences.fontFamily === 'serif' ? colors.accent : colors.textPrimary,
                    marginBottom: 2,
                  }}
                >
                  EB Garamond
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: 'Inter_500Medium',
                    color: colors.textMuted,
                  }}
                >
                  Classical Serif
                </Text>
                {preferences.fontFamily === 'serif' && (
                  <View style={[styles.checkBadge, { backgroundColor: colors.accent }]}>
                    <Check size={11} color="#000" />
                  </View>
                )}
              </Pressable>

              <Pressable
                onPress={() => handleSelectFontFamily('sans')}
                style={[
                  styles.choiceCard,
                  {
                    backgroundColor: preferences.fontFamily === 'sans' ? colors.accentBg : colors.surfaceSubtle,
                    borderColor: preferences.fontFamily === 'sans' ? colors.accent : colors.borderSubtle,
                  },
                ]}
              >
                <Text
                  style={{
                    fontFamily: 'Inter_700Bold',
                    fontSize: 16,
                    color: preferences.fontFamily === 'sans' ? colors.accent : colors.textPrimary,
                    marginBottom: 2,
                  }}
                >
                  Inter
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: 'Inter_500Medium',
                    color: colors.textMuted,
                  }}
                >
                  Modern Sans
                </Text>
                {preferences.fontFamily === 'sans' && (
                  <View style={[styles.checkBadge, { backgroundColor: colors.accent }]}>
                    <Check size={11} color="#000" />
                  </View>
                )}
              </Pressable>
            </View>
          </View>

          {/* Section 3: Reading Atmosphere */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                READING ATMOSPHERE
              </Text>
              {!isPremium && (
                <View style={styles.sanctuaryPill}>
                  <Lock size={10} color={colors.accent} style={{ marginRight: 4 }} />
                  <Text style={[styles.sanctuaryPillText, { color: colors.accent }]}>Sanctuary</Text>
                </View>
              )}
            </View>

            <View style={styles.themeGrid}>
              {/* System */}
              <Pressable
                onPress={() => handleSelectTheme('system')}
                style={[
                  styles.themeCard,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: preferences.readerTheme === 'system' ? colors.accent : colors.borderSubtle,
                    borderWidth: preferences.readerTheme === 'system' ? 2 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.themePreviewDot,
                    {
                      backgroundColor: isDark ? '#0D120F' : '#F8F6F0',
                      borderColor: colors.border,
                      borderWidth: 1,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.themeLabel,
                    {
                      color: preferences.readerTheme === 'system' ? colors.accent : colors.textPrimary,
                      fontFamily: preferences.readerTheme === 'system' ? 'Inter_700Bold' : 'Inter_500Medium',
                    },
                  ]}
                >
                  System
                </Text>
              </Pressable>

              {/* Warm Sepia */}
              <Pressable
                onPress={() => handleSelectTheme('sepia')}
                style={[
                  styles.themeCard,
                  {
                    backgroundColor: '#F4EBD9',
                    borderColor: preferences.readerTheme === 'sepia' ? colors.accent : '#D8C6A5',
                    borderWidth: preferences.readerTheme === 'sepia' ? 2 : 1,
                  },
                ]}
              >
                <View style={[styles.themePreviewDot, { backgroundColor: '#382E25' }]} />
                <View style={styles.themeLabelWithLock}>
                  <Text
                    style={[
                      styles.themeLabel,
                      {
                        color: '#382E25',
                        fontFamily: preferences.readerTheme === 'sepia' ? 'Inter_700Bold' : 'Inter_500Medium',
                      },
                    ]}
                  >
                    Sepia
                  </Text>
                  {!isPremium && <Lock size={10} color="#786650" style={{ marginLeft: 3 }} />}
                </View>
              </Pressable>

              {/* Midnight OLED */}
              <Pressable
                onPress={() => handleSelectTheme('midnight')}
                style={[
                  styles.themeCard,
                  {
                    backgroundColor: '#000000',
                    borderColor: preferences.readerTheme === 'midnight' ? colors.accent : '#27272A',
                    borderWidth: preferences.readerTheme === 'midnight' ? 2 : 1,
                  },
                ]}
              >
                <View style={[styles.themePreviewDot, { backgroundColor: '#E5E7EB' }]} />
                <View style={styles.themeLabelWithLock}>
                  <Text
                    style={[
                      styles.themeLabel,
                      {
                        color: '#E5E7EB',
                        fontFamily: preferences.readerTheme === 'midnight' ? 'Inter_700Bold' : 'Inter_500Medium',
                      },
                    ]}
                  >
                    Midnight
                  </Text>
                  {!isPremium && <Lock size={10} color="#A1A1AA" style={{ marginLeft: 3 }} />}
                </View>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingTop: 18,
    paddingHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resetButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  stepperBtn: {
    width: 48,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperSubtext: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 2,
  },
  sliderInteractiveArea: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    marginHorizontal: 12,
    position: 'relative',
  },
  sliderTrackBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 6,
    borderRadius: 3,
  },
  sliderTrackFill: {
    position: 'absolute',
    left: 0,
    height: 6,
    borderRadius: 3,
  },
  sliderTick: {
    position: 'absolute',
    width: 2,
    height: 8,
    borderRadius: 1,
    top: '50%',
    marginTop: -4,
    marginLeft: -1,
  },
  sliderThumb: {
    position: 'absolute',
    top: '50%',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    marginTop: -11,
    marginLeft: -11,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  sliderThumbInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  choiceCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    position: 'relative',
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  themeCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themePreviewDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginBottom: 6,
  },
  themeLabelWithLock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeLabel: {
    fontSize: 12,
  },
  sanctuaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sanctuaryPillText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
});
