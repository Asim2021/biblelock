import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Svg, { Path, Rect, Circle, Defs, LinearGradient, Stop, G } from 'react-native-svg';

export interface AppIconProps {
  packageName?: string;
  label?: string;
  iconUri?: string;
  size?: number;
  borderRadius?: number;
}

export const AppIcon: React.FC<AppIconProps> = ({
  packageName = '',
  label = '',
  iconUri,
  size = 36,
  borderRadius = 8,
}) => {
  const pkg = packageName.toLowerCase();
  const name = label.toLowerCase();

  // 1. Instagram
  if (pkg.includes('instagram') || name.includes('instagram')) {
    const r = borderRadius;
    return (
      <View style={{ width: size, height: size, borderRadius: r, overflow: 'hidden' }}>
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Defs>
            <LinearGradient id="igGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#f09433" />
              <Stop offset="30%" stopColor="#e6683c" />
              <Stop offset="60%" stopColor="#dc2743" />
              <Stop offset="85%" stopColor="#cc2366" />
              <Stop offset="100%" stopColor="#bc1888" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="24" height="24" rx="5" fill="url(#igGrad)" />
          <Rect x="5" y="5" width="14" height="14" rx="4" stroke="#ffffff" strokeWidth="1.8" fill="none" />
          <Circle cx="12" cy="12" r="3.2" stroke="#ffffff" strokeWidth="1.8" fill="none" />
          <Circle cx="15.8" cy="8.2" r="0.9" fill="#ffffff" />
        </Svg>
      </View>
    );
  }

  // 2. TikTok
  if (pkg.includes('musically') || pkg.includes('tiktok') || name.includes('tiktok')) {
    return (
      <View style={{ width: size, height: size, borderRadius, overflow: 'hidden' }}>
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x="0" y="0" width="24" height="24" rx="5" fill="#010101" />
          {/* Cyan layer */}
          <Path
            fill="#25F4EE"
            opacity={0.85}
            d="M16.5 4.5c.3 1.5 1.5 2.6 3 2.8v2.2c-1.3 0-2.5-.5-3.4-1.3v5.6c0 2.4-2 4.4-4.4 4.4-2.4 0-4.4-2-4.4-4.4 0-2.2 1.6-4.1 3.8-4.4v2.3c-1 .2-1.7 1-1.7 2.1 0 1.2 1 2.2 2.2 2.2s2.2-1 2.2-2.2V3h2.7z"
            transform="translate(-0.8, -0.6)"
          />
          {/* Magenta layer */}
          <Path
            fill="#FE2C55"
            opacity={0.85}
            d="M16.5 4.5c.3 1.5 1.5 2.6 3 2.8v2.2c-1.3 0-2.5-.5-3.4-1.3v5.6c0 2.4-2 4.4-4.4 4.4-2.4 0-4.4-2-4.4-4.4 0-2.2 1.6-4.1 3.8-4.4v2.3c-1 .2-1.7 1-1.7 2.1 0 1.2 1 2.2 2.2 2.2s2.2-1 2.2-2.2V3h2.7z"
            transform="translate(0.8, 0.6)"
          />
          {/* Main White Note */}
          <Path
            fill="#FFFFFF"
            d="M16.5 4.5c.3 1.5 1.5 2.6 3 2.8v2.2c-1.3 0-2.5-.5-3.4-1.3v5.6c0 2.4-2 4.4-4.4 4.4-2.4 0-4.4-2-4.4-4.4 0-2.2 1.6-4.1 3.8-4.4v2.3c-1 .2-1.7 1-1.7 2.1 0 1.2 1 2.2 2.2 2.2s2.2-1 2.2-2.2V3h2.7z"
          />
        </Svg>
      </View>
    );
  }

  // 3. YouTube
  if (pkg.includes('youtube') || name.includes('youtube')) {
    return (
      <View style={{ width: size, height: size, borderRadius, overflow: 'hidden' }}>
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x="0" y="0" width="24" height="24" rx="5" fill="#FF0000" />
          <Path fill="#FFFFFF" d="M10 8.5v7l5.5-3.5-5.5-3.5z" />
        </Svg>
      </View>
    );
  }

  // 4. X (Twitter)
  if (pkg.includes('twitter') || name === 'x' || name.includes('x (') || name.includes('twitter')) {
    return (
      <View style={{ width: size, height: size, borderRadius, overflow: 'hidden' }}>
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x="0" y="0" width="24" height="24" rx="5" fill="#000000" />
          <Path
            fill="#FFFFFF"
            d="M17.5 4h2.5l-5.5 6.3 6.5 8.7h-5l-3.9-5.1-4.5 5.1H5.1l5.9-6.7L4.7 4h5.1l3.5 4.7zm-.9 13.5h1.4L9.5 5.4H8z"
          />
        </Svg>
      </View>
    );
  }

  // 5. Reddit
  if (pkg.includes('reddit') || name.includes('reddit')) {
    return (
      <View style={{ width: size, height: size, borderRadius, overflow: 'hidden' }}>
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x="0" y="0" width="24" height="24" rx="5" fill="#FF4500" />
          {/* Antenna */}
          <Path stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" fill="none" d="M12 7.5V5.2l2.2-.7" />
          <Circle cx="14.8" cy="4.5" r="1.1" fill="#FFFFFF" />
          {/* Ears */}
          <Circle cx="5.8" cy="11.5" r="1.8" fill="#FFFFFF" />
          <Circle cx="18.2" cy="11.5" r="1.8" fill="#FFFFFF" />
          {/* Face */}
          <Circle cx="12" cy="12.5" r="5.5" fill="#FFFFFF" />
          {/* Eyes */}
          <Circle cx="9.8" cy="11.8" r="1" fill="#FF4500" />
          <Circle cx="14.2" cy="11.8" r="1" fill="#FF4500" />
          {/* Smile */}
          <Path stroke="#FF4500" strokeWidth="1.1" strokeLinecap="round" fill="none" d="M10.2 14.5c.8.9 2.8.9 3.6 0" />
        </Svg>
      </View>
    );
  }

  // 6. Facebook
  if (pkg.includes('facebook') || name.includes('facebook')) {
    return (
      <View style={{ width: size, height: size, borderRadius, overflow: 'hidden' }}>
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x="0" y="0" width="24" height="24" rx="5" fill="#1877F2" />
          <Path
            fill="#FFFFFF"
            d="M13.5 8h2.5V4.5H13c-3 0-4 1.8-4 4.2V11H6.5v3.5H9V21h3.5v-6.5h2.8l.7-3.5H12.5V9c0-.8.4-1 1-1z"
          />
        </Svg>
      </View>
    );
  }

  // 7. Snapchat
  if (pkg.includes('snapchat') || name.includes('snapchat')) {
    return (
      <View style={{ width: size, height: size, borderRadius, overflow: 'hidden' }}>
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x="0" y="0" width="24" height="24" rx="5" fill="#FFFC00" />
          <Path
            fill="#FFFFFF"
            stroke="#000000"
            strokeWidth="0.8"
            d="M12 5.5c-2.3 0-3.8 1.6-3.8 3.5 0 .5.2 1 .3 1.3-.3.1-.9.4-1.2.7-.2.2-.1.5.1.5.7.2 1.4.1 1.7 0 .3.8 1 1.5 2.1 1.7-.6.3-1.4.7-1.4 1.3 0 .4.4.6.9.6.7 0 1.2-.3 1.3-.4.2.1.5.1.8.1s.6 0 .8-.1c.1.1.6.4 1.3.4.5 0 .9-.2.9-.6 0-.6-.8-1-1.4-1.3 1.1-.2 1.8-.9 2.1-1.7.3.1 1 .2 1.7 0 .2 0 .3-.3.1-.5-.3-.3-.9-.6-1.2-.7.1-.3.3-.8.3-1.3 0-1.9-1.5-3.5-3.8-3.5z"
          />
        </Svg>
      </View>
    );
  }

  // 8. Netflix
  if (pkg.includes('netflix') || name.includes('netflix')) {
    return (
      <View style={{ width: size, height: size, borderRadius, overflow: 'hidden' }}>
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x="0" y="0" width="24" height="24" rx="5" fill="#000000" />
          <Path
            fill="#E50914"
            d="M6.5 4.5h2.6v9.2l4.8-9.2h2.6v15h-2.6v-9.2l-4.8 9.2H6.5z"
          />
        </Svg>
      </View>
    );
  }

  // 9. Discord
  if (pkg.includes('discord') || name.includes('discord')) {
    return (
      <View style={{ width: size, height: size, borderRadius, overflow: 'hidden' }}>
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x="0" y="0" width="24" height="24" rx="5" fill="#5865F2" />
          <Path
            fill="#FFFFFF"
            d="M18.8 6.5c-1.2-.6-2.5-.9-3.8-1-.2.3-.4.7-.5 1.1-1.4-.2-2.8-.2-4.2 0-.2-.4-.4-.8-.5-1.1-1.3.1-2.6.4-3.8 1C4.2 9.2 3.7 12 3.9 14.7c1.6 1.2 3.1 1.9 4.6 2.4.4-.5.7-1.1 1-1.7-.5-.2-1-.5-1.5-.8.1-.1.2-.2.4-.3 3 .1.4 6.1.4 9.1 0 .2.1.3.2.4.3-.5.3-1 .6-1.5.8.3.6.6 1.2 1 1.7 1.5-.5 3-1.2 4.6-2.4.2-2.7-.3-5.5-2.1-8.2zM9.5 13.5c-.8 0-1.5-.7-1.5-1.6s.7-1.6 1.5-1.6 1.5.7 1.5 1.6-.7 1.6-1.5 1.6zm5 0c-.8 0-1.5-.7-1.5-1.6s.7-1.6 1.5-1.6 1.5.7 1.5 1.6-.7 1.6-1.5 1.6z"
          />
        </Svg>
      </View>
    );
  }

  // 10. WhatsApp
  if (pkg.includes('whatsapp') || name.includes('whatsapp')) {
    return (
      <View style={{ width: size, height: size, borderRadius, overflow: 'hidden' }}>
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x="0" y="0" width="24" height="24" rx="5" fill="#25D366" />
          <Path
            fill="#FFFFFF"
            d="M12 4.5A7.5 7.5 0 0 0 5.5 15.7L4.5 19.5l3.9-1a7.5 7.5 0 1 0 3.6-14zm0 13.7c-1.3 0-2.5-.3-3.6-1l-.3-.2-2.3.6.6-2.2-.2-.3a6.2 6.2 0 1 1 5.8 3.1zm3.4-4.6c-.2-.1-1.1-.5-1.3-.6-.2-.1-.3-.1-.4.1-.1.2-.5.6-.6.8-.1.1-.2.2-.4.1-.2-.1-.8-.3-1.6-1-.6-.5-1-.1.2-1.2-.2-.1-.2-.2 0-.3.1-.1.2-.2.3-.4.1-.1.1-.2.2-.3 0-.1 0-.3-.1-.4s-.4-1-.6-1.4c-.2-.4-.3-.3-.4-.3h-.4c-.1 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3.9 2.5c.1.2 1.6 2.5 4 3.4.6.2 1 .4 1.4.5.6.2 1.1.2 1.6.1.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2 0-.1-.2-.2-.4-.3z"
          />
        </Svg>
      </View>
    );
  }

  // 11. Native installed app icon from Android PackageManager
  if (iconUri) {
    return (
      <Image
        source={{ uri: iconUri }}
        style={{ width: size, height: size, borderRadius }}
        resizeMode="contain"
      />
    );
  }

  // 12. Elegant Fallback Initial Badge
  const initial = (label || packageName.split('.').pop() || '?').charAt(0).toUpperCase();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius,
        backgroundColor: '#1c2430',
        borderWidth: 1,
        borderColor: '#2d3748',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontSize: Math.max(10, Math.floor(size * 0.42)),
          fontWeight: '700',
          color: '#f5b800',
        }}
      >
        {initial}
      </Text>
    </View>
  );
};
