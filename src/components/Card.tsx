import React from 'react';
import { View, Pressable, ViewProps } from 'react-native';

export interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'surface' | 'elevated' | 'outline' | 'dark';
  className?: string;
  onPress?: () => void;
}

export function Card({
  children,
  variant = 'surface',
  className = '',
  onPress,
  ...props
}: CardProps) {
  let baseStyle = 'rounded-lg p-4';

  if (variant === 'surface') {
    baseStyle += ' bg-surface-card dark:bg-surface-dark-elevated border border-hairline/60 dark:border-hairline/20';
  } else if (variant === 'elevated') {
    baseStyle += ' bg-surface-soft dark:bg-surface-dark-elevated shadow-sm';
  } else if (variant === 'outline') {
    baseStyle += ' bg-transparent border border-hairline dark:border-hairline/30';
  } else if (variant === 'dark') {
    baseStyle += ' bg-surface-dark-soft dark:bg-surface-dark-elevated border border-surface-dark-elevated';
  }

  const combinedClass = `${baseStyle} ${className}`;

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={`${combinedClass} active:opacity-90`}
        {...props}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View className={combinedClass} {...props}>
      {children}
    </View>
  );
}

export default Card;
