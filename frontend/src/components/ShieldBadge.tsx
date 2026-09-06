import React from 'react';
import { View, Text, Pressable } from 'react-native';

export interface ShieldBadgeProps {
  isShielded: boolean;
  onPress?: () => void;
  className?: string;
}

export function ShieldBadge({ isShielded, onPress, className = '' }: ShieldBadgeProps) {
  const content = (
    <View
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
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }

  return content;
}

export default ShieldBadge;
