import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  useReducedMotion,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  className?: string;
  textClassName?: string;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  className = '',
  textClassName = '',
}: ButtonProps) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (disabled || loading || reducedMotion) return;
    scale.value = withTiming(0.97, { duration: 100 });
  };

  const handlePressOut = () => {
    if (disabled || loading || reducedMotion) return;
    scale.value = withSpring(1, { duration: 250, dampingRatio: 0.8 });
  };

  const getContainerStyle = () => {
    let base = 'flex-row items-center justify-center rounded-md';

    // Size
    if (size === 'sm') base += ' px-3 py-2';
    else if (size === 'lg') base += ' px-6 py-4';
    else base += ' px-5 py-3';

    // Variant
    if (variant === 'primary') {
      base += disabled
        ? ' bg-primary-disabled opacity-60'
        : ' bg-primary active:bg-primary-active';
    } else if (variant === 'secondary') {
      base += disabled
        ? ' bg-surface-dark-soft opacity-60'
        : ' bg-surface-dark-elevated active:bg-surface-dark-soft';
    } else if (variant === 'outline') {
      base += disabled
        ? ' border border-hairline opacity-50 bg-transparent'
        : ' border border-hairline active:bg-surface-soft dark:active:bg-surface-dark-soft bg-transparent';
    } else if (variant === 'ghost') {
      base += disabled
        ? ' opacity-40 bg-transparent'
        : ' bg-transparent active:bg-surface-soft dark:active:bg-surface-dark-soft';
    }

    return `${base} ${className}`;
  };

  const getTextStyle = () => {
    let base = 'font-sans-medium text-center';

    if (size === 'sm') base += ' text-sm';
    else if (size === 'lg') base += ' text-lg font-sans-semibold';
    else base += ' text-base';

    if (variant === 'primary') {
      base += ' text-white';
    } else if (variant === 'secondary') {
      base += ' text-on-dark';
    } else if (variant === 'outline') {
      base += ' text-ink dark:text-on-dark';
    } else if (variant === 'ghost') {
      base += ' text-primary';
    }

    return `${base} ${textClassName}`;
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={animatedStyle}
      className={getContainerStyle()}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#ffffff' : '#cc785c'}
        />
      ) : (
        <View className="flex-row items-center justify-center">
          {icon ? <View className="mr-2">{icon}</View> : null}
          <Text className={getTextStyle()}>{title}</Text>
        </View>
      )}
    </AnimatedPressable>
  );
}

export default Button;
