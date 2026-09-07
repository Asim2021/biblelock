import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  useReducedMotion,
  Easing,
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

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
  const reducedMotion = useReducedMotion();
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  const animatedProgress = useSharedValue(clampedProgress);
  const lockScale = useSharedValue(1);

  useEffect(() => {
    animatedProgress.value = reducedMotion
      ? clampedProgress
      : withTiming(clampedProgress, {
          duration: 500,
          easing: Easing.bezier(0.23, 1, 0.32, 1),
        });
  }, [clampedProgress, reducedMotion]);

  useEffect(() => {
    if (isGoalMet) {
      lockScale.value = reducedMotion
        ? 1
        : withSequence(
            withTiming(1.35, { duration: 180, easing: Easing.out(Easing.quad) }),
            withSpring(1, { duration: 400, dampingRatio: 0.75 })
          );
    }
  }, [isGoalMet, reducedMotion]);

  const animatedCircleProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference - animatedProgress.value * circumference;
    return {
      strokeDashoffset,
    };
  });

  const lockAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: lockScale.value }],
  }));

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
          strokeOpacity={0.3}
        />
        {/* Animated Foreground Progress Circle */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={isGoalMet ? '#5db872' : '#cc785c'}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedCircleProps}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>

      {/* Center Metrics Content */}
      <View className="absolute items-center justify-center">
        <Animated.View style={lockAnimatedStyle}>
          <Text className="text-3xl mb-1">{isGoalMet ? '🔓' : '🔒'}</Text>
        </Animated.View>
        <Text className="text-4xl font-sans-bold text-on-dark tracking-tight">
          {timeText}
        </Text>
        <Text className="text-xs font-sans-medium text-on-dark-soft mt-1">
          {isGoalMet ? 'Goal Achieved!' : goalText}
        </Text>
      </View>
    </View>
  );
}

export default ProgressRing;
