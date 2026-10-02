import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Check, Flame } from 'lucide-react-native';
import { useTheme } from '../../lib/themeContext';
import { PulsingView } from '../ui/PulsingView';

interface CircularProgressRingProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0.0 to 1.0+
  isGoalMet: boolean;
}

export const CircularProgressRing: React.FC<CircularProgressRingProps> = React.memo(({
  size = 96,
  strokeWidth = 8,
  progress,
  isGoalMet,
}) => {
  const { colors, isDark } = useTheme();

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const strokeDashoffset = circumference - clampedProgress * circumference;
  const percentText = Math.round(progress * 100);

  const strokeColor = isGoalMet ? colors.success : colors.accent;
  const trackColor = isDark ? '#1a231d' : colors.surfaceSubtle;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          {/* Background Track */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Active Progress Arc */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </G>
      </Svg>

      {/* Center Feedback Content */}
      <View
        style={{
          position: 'absolute',
          width: size - strokeWidth * 2 - 8,
          height: size - strokeWidth * 2 - 8,
          borderRadius: (size - strokeWidth * 2 - 8) / 2,
          backgroundColor: isGoalMet ? (isDark ? '#1a3324' : '#eaf7ee') : colors.surfaceSubtle,
          borderWidth: 1,
          borderColor: isGoalMet ? colors.success : colors.borderSubtle,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <PulsingView
          active={true}
          duration={isGoalMet ? 2000 : 2600}
          minScale={0.94}
          maxScale={1.06}
          minOpacity={0.82}
          maxOpacity={1.0}
        >
          {isGoalMet ? (
            <Check size={26} color={colors.success} strokeWidth={2.8} />
          ) : progress > 0 ? (
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 13, fontFamily: 'Inter_700Bold', color: colors.accent }}>
                {percentText}%
              </Text>
            </View>
          ) : (
            <Flame size={22} color={colors.accent} />
          )}
        </PulsingView>
      </View>
    </View>
  );
});
