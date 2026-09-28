import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ShieldCheck, ShieldAlert, Pause, Play, Lock, ChevronRight } from 'lucide-react-native';
import { AppIcon } from './AppIcon';
import { useTheme } from '../lib/themeContext';

export interface ShieldedAppsStripProps {
  isShielded: boolean;
  isPaused: boolean;
  remainingMins: number;
  blockedApps: string[];
  onPressPause: () => void;
  onPressManage: () => void;
}

export const ShieldedAppsStrip: React.FC<ShieldedAppsStripProps> = ({
  isShielded,
  isPaused,
  remainingMins,
  blockedApps,
  onPressPause,
  onPressManage,
}) => {
  const { colors, isDark } = useTheme();

  const displayedApps = blockedApps.slice(0, 5);
  const remainingCount = Math.max(0, blockedApps.length - 5);

  return (
    <View
      style={{
        padding: 16,
        borderRadius: 20,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 14,
      }}
    >
      {/* Top Header Row: Status Badge + Pause/Resume Button */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        {/* Status Indicator */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {isPaused ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 20,
                backgroundColor: colors.accentBg,
                borderWidth: 1,
                borderColor: colors.accent,
              }}
            >
              <Pause size={12} color={colors.accent} style={{ marginRight: 5 }} />
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: 'Inter_700Bold',
                  color: colors.accent,
                  letterSpacing: 0.3,
                }}
              >
                Paused ({remainingMins}m)
              </Text>
            </View>
          ) : isShielded ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: '#385e48',
                backgroundColor: isDark ? '#18261e' : '#edf8f0',
              }}
            >
              <ShieldCheck size={12} color={colors.success} style={{ marginRight: 5 }} />
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: 'Inter_700Bold',
                  color: colors.success,
                  letterSpacing: 0.3,
                }}
              >
                {blockedApps.length} {blockedApps.length === 1 ? 'App' : 'Apps'} Guarded
              </Text>
            </View>
          ) : (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: '#5e3838',
                backgroundColor: isDark ? '#291b1b' : '#fdeeed',
              }}
            >
              <ShieldAlert size={12} color={colors.danger} style={{ marginRight: 5 }} />
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: 'Inter_700Bold',
                  color: colors.danger,
                  letterSpacing: 0.3,
                }}
              >
                All Apps Unlocked
              </Text>
            </View>
          )}
        </View>

        {/* Tactile Secondary Control Button */}
        <Pressable
          onPress={onPressPause}
          accessibilityRole="button"
          accessibilityLabel={isPaused ? 'Resume Blocking' : 'Pause Blocking'}
          hitSlop={8}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 10,
            backgroundColor: colors.surfaceSubtle,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
          }}
        >
          {isPaused ? (
            <>
              <Play size={11} color={colors.accent} style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 11, fontFamily: 'Inter_600SemiBold', color: colors.accent }}>
                Resume
              </Text>
            </>
          ) : (
            <>
              <Pause size={11} color={colors.textSecondary} style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 11, fontFamily: 'Inter_600SemiBold', color: colors.textSecondary }}>
                Pause
              </Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Bottom Row: Authentic App Avatars + Manage Navigation */}
      <Pressable
        onPress={onPressManage}
        accessibilityRole="button"
        accessibilityLabel="Manage Shielded Apps"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 6,
        }}
      >
        {displayedApps.length > 0 ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {displayedApps.map((pkg, idx) => (
              <View
                key={`${pkg}-${idx}`}
                style={{
                  position: 'relative',
                  marginRight: 10,
                  opacity: isPaused ? 0.6 : 1,
                }}
              >
                <AppIcon packageName={pkg} size={30} borderRadius={8} />
                {/* Micro Lock Overlay Badge */}
                {isShielded && !isPaused && (
                  <View
                    style={{
                      position: 'absolute',
                      bottom: -3,
                      right: -3,
                      width: 14,
                      height: 14,
                      borderRadius: 7,
                      backgroundColor: '#141413',
                      borderWidth: 1,
                      borderColor: colors.accent,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Lock size={8} color={colors.accent} />
                  </View>
                )}
              </View>
            ))}

            {remainingCount > 0 && (
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  backgroundColor: colors.surfaceSubtle,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontFamily: 'Inter_700Bold',
                    color: colors.textSecondary,
                  }}
                >
                  +{remainingCount}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <Text style={{ fontSize: 12, color: colors.textMuted }}>
            No apps guarded yet • Tap to configure
          </Text>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text
            style={{
              fontSize: 11,
              fontFamily: 'Inter_600SemiBold',
              color: colors.accent,
              marginRight: 2,
            }}
          >
            Manage
          </Text>
          <ChevronRight size={13} color={colors.accent} />
        </View>
      </Pressable>
    </View>
  );
};
