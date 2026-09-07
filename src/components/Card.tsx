import React from 'react';
import { View, Pressable, ViewProps } from 'react-native';
import { useTheme } from '../lib/themeContext';

export interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'surface' | 'elevated' | 'outline' | 'dark';
  className?: string;
  onPress?: () => void;
  style?: any;
}

export function Card({
  children,
  variant = 'surface',
  className = '',
  onPress,
  style,
  ...props
}: CardProps) {
  const { colors } = useTheme();

  const cardStyle = {
    backgroundColor: variant === 'outline' ? 'transparent' : colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={[cardStyle, style]}
        className={`p-4 border ${className} active:opacity-90`}
        {...props}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={[cardStyle, style]} className={`p-4 border ${className}`} {...props}>
      {children}
    </View>
  );
}

export default Card;
