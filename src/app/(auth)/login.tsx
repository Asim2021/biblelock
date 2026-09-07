import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';

export default function LoginScreen() {
  const { signInWithGoogle, signInWithApple, signInAsGuest } = useAuth();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleGoogle = async () => {
    setLoadingAction('google');
    const { error } = await signInWithGoogle();
    setLoadingAction(null);
    if (error) {
      Alert.alert('Sign In', error.message || 'Failed to sign in with Google');
    }
  };

  const handleApple = async () => {
    setLoadingAction('apple');
    const { error } = await signInWithApple();
    setLoadingAction(null);
    if (error) {
      Alert.alert('Sign In', error.message || 'Failed to sign in with Apple');
    }
  };

  const handleGuest = async () => {
    setLoadingAction('guest');
    await signInAsGuest();
    setLoadingAction(null);
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: '#181715' }}
      edges={['top', 'bottom', 'left', 'right']}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between' }}
        className="px-6 py-8"
      >
        {/* Header Branding */}
        <View className="items-center mt-6">
          <View className="w-20 h-20 rounded-2xl bg-surface-dark-elevated items-center justify-center border border-hairline/20 mb-6 shadow-md">
            <Text className="text-4xl">✝️</Text>
          </View>

          <Text
            className="text-4xl text-on-dark text-center mb-3 font-serif-semibold tracking-tight"
            style={{ fontFamily: 'EBGaramond_600SemiBold' }}
          >
            Bible Unlock
          </Text>

          <Text className="text-base text-on-dark-soft text-center max-w-xs leading-relaxed font-sans">
            Replace mindless doomscrolling with daily Scripture. Apps stay locked until your Bible goal is met.
          </Text>
        </View>

        {/* Value Prop Highlights */}
        <View className="my-8">
          <Card variant="dark" className="p-5 mb-4">
            <View className="flex-row items-center mb-3">
              <Text className="text-2xl mr-3">🔒</Text>
              <View className="flex-1">
                <Text className="text-sm font-sans-semibold text-on-dark">
                  Smart App Shields
                </Text>
                <Text className="text-xs text-on-dark-soft mt-0.5">
                  Block Instagram, TikTok, YouTube & games automatically.
                </Text>
              </View>
            </View>

            <View className="flex-row items-center mb-3">
              <Text className="text-2xl mr-3">📖</Text>
              <View className="flex-1">
                <Text className="text-sm font-sans-semibold text-on-dark">
                  100% Offline Scripture
                </Text>
                <Text className="text-xs text-on-dark-soft mt-0.5">
                  Complete World English Bible & King James Version reader.
                </Text>
              </View>
            </View>

            <View className="flex-row items-center">
              <Text className="text-2xl mr-3">🔓</Text>
              <View className="flex-1">
                <Text className="text-sm font-sans-semibold text-on-dark">
                  Daily Habit Unlocks
                </Text>
                <Text className="text-xs text-on-dark-soft mt-0.5">
                  Apps unlock immediately once today's reading goal is completed.
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Action Buttons */}
        <View className="space-y-3 mb-6">
          <Button
            title="Sign in with Google"
            variant="primary"
            size="lg"
            onPress={handleGoogle}
            loading={loadingAction === 'google'}
            className="w-full mb-3"
          />

          {Platform.OS === 'ios' && (
            <Button
              title="Sign in with Apple"
              variant="secondary"
              size="lg"
              onPress={handleApple}
              loading={loadingAction === 'apple'}
              className="w-full mb-3 border border-hairline/20"
            />
          )}

          <Button
            title="Continue as Guest (Offline Mode)"
            variant="outline"
            size="md"
            onPress={handleGuest}
            loading={loadingAction === 'guest'}
            className="w-full"
            textClassName="text-on-dark-soft"
          />

          <Text className="text-center text-xs text-on-dark-soft/60 mt-4">
            By continuing, you agree to cultivate positive digital habits.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
