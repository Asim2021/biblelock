import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { ShieldCheck, Zap, Clock, Shield } from 'lucide-react-native';
import { useTheme } from '../../lib/themeContext';
import { AppIcon } from '../AppIcon';

interface FreedomReclaimedCardProps {
  todayInterceptions: number;
  totalInterceptions: number;
  redeemedHours: number;
  blockedAppsCount: number;
  blockedApps: string[];
}

function getCleanAppName(pkg: string): string {
  const p = pkg.toLowerCase();
  if (p.includes('instagram')) return 'Instagram';
  if (p.includes('musically') || p.includes('tiktok')) return 'TikTok';
  if (p.includes('youtube')) return 'YouTube';
  if (p.includes('twitter')) return 'X (Twitter)';
  if (p.includes('reddit')) return 'Reddit';
  if (p.includes('facebook')) return 'Facebook';
  if (p.includes('snapchat')) return 'Snapchat';
  if (p.includes('netflix')) return 'Netflix';
  if (p.includes('discord')) return 'Discord';
  const parts = pkg.split('.');
  const last = parts[parts.length - 1];
  return last ? last.charAt(0).toUpperCase() + last.slice(1) : pkg;
}

export const FreedomReclaimedCard: React.FC<FreedomReclaimedCardProps> = React.memo(({
  todayInterceptions,
  totalInterceptions,
  redeemedHours,
  blockedAppsCount,
  blockedApps,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={{
        padding: 20,
        borderRadius: 24,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 16,
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <ShieldCheck size={20} color={colors.accent} style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.textPrimary }}>
            Freedom Reclaimed
          </Text>
        </View>
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 8,
            backgroundColor: isDark ? '#1a3324' : '#eaf7ee',
            borderWidth: 1,
            borderColor: colors.success,
          }}
        >
          <Text style={{ fontSize: 10, fontFamily: 'Inter_700Bold', color: colors.success }}>
            Active Shield
          </Text>
        </View>
      </View>

      <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 16 }}>
        Mindless distractions transformed into quiet time with God.
      </Text>

      {/* 3 Metrics Row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
        {/* Temptations Overcome */}
        <View
          style={{
            flex: 1,
            marginRight: 6,
            padding: 12,
            borderRadius: 14,
            backgroundColor: colors.surfaceSubtle,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            alignItems: 'center',
          }}
        >
          <Zap size={16} color={colors.accent} style={{ marginBottom: 4 }} />
          <Text style={{ fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary }}>
            {todayInterceptions}
          </Text>
          <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2, textAlign: 'center' }}>
            Today
          </Text>
          <Text style={{ fontSize: 9, color: colors.textMuted, marginTop: 2 }}>
            ({totalInterceptions} all-time)
          </Text>
        </View>

        {/* Screen Time Redeemed */}
        <View
          style={{
            flex: 1,
            marginHorizontal: 3,
            padding: 12,
            borderRadius: 14,
            backgroundColor: colors.surfaceSubtle,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            alignItems: 'center',
          }}
        >
          <Clock size={16} color={colors.accent} style={{ marginBottom: 4 }} />
          <Text style={{ fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary }}>
            {redeemedHours}h
          </Text>
          <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2, textAlign: 'center' }}>
            Time Saved
          </Text>
          <Text style={{ fontSize: 9, color: colors.textMuted, marginTop: 2 }}>
            from doomscroll
          </Text>
        </View>

        {/* Shielded Apps */}
        <View
          style={{
            flex: 1,
            marginLeft: 6,
            padding: 12,
            borderRadius: 14,
            backgroundColor: colors.surfaceSubtle,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            alignItems: 'center',
          }}
        >
          <Shield size={16} color={colors.accent} style={{ marginBottom: 4 }} />
          <Text style={{ fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary }}>
            {blockedAppsCount}
          </Text>
          <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2, textAlign: 'center' }}>
            Guarded Apps
          </Text>
          <Text style={{ fontSize: 9, color: colors.textMuted, marginTop: 2 }}>
            locked to goal
          </Text>
        </View>
      </View>

      {/* Guarded Apps Icon Strip */}
      {blockedApps.length > 0 && (
        <View style={{ borderTopWidth: 1, borderTopColor: colors.borderSubtle, paddingTop: 12 }}>
          <Text
            style={{
              fontSize: 10,
              fontFamily: 'Inter_700Bold',
              color: colors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            Guarded Applications
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {blockedApps.map((pkg) => (
              <View
                key={pkg}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 10,
                  backgroundColor: colors.surfaceSubtle,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  marginRight: 8,
                }}
              >
                <AppIcon packageName={pkg} size={16} />
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: 'Inter_500Medium',
                    color: colors.textPrimary,
                    marginLeft: 6,
                  }}
                  numberOfLines={1}
                >
                  {getCleanAppName(pkg)}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
});
