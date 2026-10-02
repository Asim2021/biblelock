import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle, Easing } from 'react-native';

export interface PulsingViewProps {
  children?: React.ReactNode;
  minOpacity?: number;
  maxOpacity?: number;
  minScale?: number;
  maxScale?: number;
  duration?: number;
  active?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const PulsingView: React.FC<PulsingViewProps> = React.memo(({
  children,
  minOpacity = 0.75,
  maxOpacity = 1.0,
  minScale = 0.96,
  maxScale = 1.04,
  duration = 2400,
  active = true,
  style,
}) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      pulseAnim.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: duration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: duration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [active, duration, pulseAnim]);

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [minOpacity, maxOpacity],
  });

  const scale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [minScale, maxScale],
  });

  return (
    <Animated.View
      style={[
        style,
        active ? { opacity, transform: [{ scale }] } : undefined,
      ]}
    >
      {children}
    </Animated.View>
  );
});
