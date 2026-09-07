import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  useReducedMotion,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface ShieldBadgeProps {
  isShielded: boolean;
  onPress?: () => void;
  className?: string;
}

export function ShieldBadge({ isShielded, onPress, className = '' }: ShieldBadgeProps) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion) return;
    scale.value = withSequence(
      withTiming(1.12, { duration: 120 }),
      withSpring(1, { duration: 300, dampingRatio: 0.7 })
    );
  }, [isShielded, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const content = (
    <Animated.View
      style={animatedStyle}
      className={`flex-row items-center px-3 py-1.5 rounded-pill border ${
        isShielded
          ? 'bg-primary/10 border-primary/40'
          : 'bg-success/10 border-success/40'
      } ${className}`}
    >
      <View
        className={`w-2 h-2 rounded-full mr-2 ${
          isShielded ? 'bg-primary' : 'bg-success'
        }`}
      />
      <Text
        className={`text-xs font-sans-medium ${
          isShielded ? 'text-primary' : 'text-success'
        }`}
      >
        {isShielded ? '🔒 Apps Shielded' : '🔓 Apps Unlocked'}
      </Text>
    </Animated.View>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => {
          if (!reducedMotion) scale.value = withTiming(0.94, { duration: 100 });
        }}
        onPressOut={() => {
          if (!reducedMotion) scale.value = withSpring(1, { duration: 250, dampingRatio: 0.8 });
        }}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return content;
}

export default ShieldBadge;
