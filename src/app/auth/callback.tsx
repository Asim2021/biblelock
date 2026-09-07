import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, [user, isLoading, router]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#181715',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ActivityIndicator size="large" color="#cc785c" />
      <Text
        style={{
          marginTop: 16,
          color: '#e5e2da',
          fontSize: 14,
          fontFamily: 'Inter_500Medium',
        }}
      >
        Completing sign-in...
      </Text>
    </View>
  );
}
