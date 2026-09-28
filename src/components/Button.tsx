import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  View,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../lib/themeContext';

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
  style?: StyleProp<ViewStyle>;
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
  style,
}: ButtonProps) {
  const { colors } = useTheme();

  const getPadding = () => {
    if (size === 'sm') return { paddingHorizontal: 12, paddingVertical: 8 };
    if (size === 'lg') return { paddingHorizontal: 24, paddingVertical: 16 };
    return { paddingHorizontal: 18, paddingVertical: 12 };
  };

  const getFontSize = () => {
    if (size === 'sm') return 13;
    if (size === 'lg') return 16;
    return 14;
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => {
        const padding = getPadding();
        let bg = colors.accent;
        let border = 'transparent';
        let borderWidth = 0;

        if (variant === 'primary') {
          bg = disabled ? colors.border : colors.accent;
        } else if (variant === 'secondary') {
          bg = disabled ? colors.surfaceSubtle : (pressed ? colors.surfaceElevated : colors.surfaceSubtle);
          border = colors.border;
          borderWidth = 1;
        } else if (variant === 'outline') {
          bg = pressed ? colors.surfaceSubtle : 'transparent';
          border = colors.border;
          borderWidth = 1;
        } else if (variant === 'ghost') {
          bg = pressed ? colors.surfaceSubtle : 'transparent';
        }

        return [
          {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 12,
            ...padding,
          },
          style,
          {
            backgroundColor: bg,
            borderColor: border,
            borderWidth,
            opacity: disabled ? 0.6 : 1,
            transform: [{ scale: pressed && !disabled && !loading ? 0.97 : 1 }],
          },
        ];
      }}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? (colors.accentText || '#141413') : colors.accent}
        />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          {icon ? <View style={{ marginRight: 8 }}>{icon}</View> : null}
          <Text
            style={{
              fontSize: getFontSize(),
              fontFamily: 'Inter_600SemiBold',
              textAlign: 'center',
              color:
                variant === 'primary'
                  ? (colors.accentText || '#141413')
                  : variant === 'ghost'
                  ? colors.accent
                  : colors.textPrimary,
            }}
            className={textClassName}
          >
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export default Button;
