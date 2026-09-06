import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export interface ProgressRingProps {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  timeText?: string;
  goalText?: string;
  isGoalMet?: boolean;
}

export function ProgressRing({
  progress = 0,
  size = 220,
  strokeWidth = 14,
  timeText = '00:00',
  goalText = 'Goal: 10m',
  isGoalMet = false,
}: ProgressRingProps) {
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const strokeDashoffset = circumference - clampedProgress * circumference;

  return (
    <View className="items-center justify-center" style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        {/* Background Track Circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#3d3a35"
          strokeWidth={strokeWidth}
          fill="none"
          strokeOpacity={0.4}
        />
        {/* Animated Foreground Progress Circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={isGoalMet ? '#5db872' : '#cc785c'}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>

      {/* Center Metrics Content */}
      <View className="absolute items-center justify-center">
        <Text className="text-3xl mb-1">{isGoalMet ? '🔓' : '🔒'}</Text>
        <Text className="text-4xl font-sans-bold text-ink dark:text-on-dark tracking-tight">
          {timeText}
        </Text>
        <Text className="text-xs font-sans-medium text-muted-soft dark:text-on-dark-soft mt-1">
          {isGoalMet ? 'Goal Achieved!' : goalText}
        </Text>
      </View>
    </View>
  );
}

export default ProgressRing;
