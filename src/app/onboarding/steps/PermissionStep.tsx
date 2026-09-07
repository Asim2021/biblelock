import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
  AppState,
  AppStateStatus,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { AppBlocker } from '../../../lib/appBlocker';

interface PermissionStepProps {
  onBack: () => void;
  onComplete: () => void;
}

export const PermissionStep: React.FC<PermissionStepProps> = ({
  onBack,
  onComplete,
}) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Check permission on mount and when app regains focus from Android Settings
  const checkPermission = async () => {
    const granted = await AppBlocker.hasPermissions();
    setHasPermission(granted);
  };

  useEffect(() => {
    checkPermission();

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        checkPermission();
      }
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      sub.remove();
    };
  }, []);

  const handleOpenSettings = async () => {
    setShowPrivacyModal(false);
    await AppBlocker.requestPermissions();
  };

  const handleFinish = async () => {
    // Request Notifications permission
    try {
      await Notifications.requestPermissionsAsync();
    } catch {}

    // Activate shield if apps are configured
    await AppBlocker.shieldApps();
    onComplete();
  };

  return (
    <View className="flex-1 justify-between px-6 py-6 bg-[#0d2e24]">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 10, paddingBottom: 20 }}>
        {/* Top 5-segment Progress Bar */}
        <View className="flex-row space-x-1.5 pt-4 mb-4">
          {[1, 2, 3, 4, 5].map((idx) => (
            <View
              key={idx}
              className="flex-1 h-1 rounded-full mr-1.5 bg-[#f5b800]"
            />
          ))}
        </View>

        <Text className="text-xs font-sans-bold text-[#f5b800] mb-3">
          5 of 5
        </Text>

        <Text
          className="text-3xl font-serif-bold text-[#faf9f5] mb-2 tracking-tight"
          style={{ fontFamily: 'EBGaramond_700Bold' }}
        >
          Enable App Blocking
        </Text>

        <Text className="text-sm font-sans text-[#78a898] mb-6 leading-relaxed">
          Grant accessibility permission to block apps
        </Text>

        {/* Accessibility Status Card */}
        <View
          className={`p-6 rounded-3xl items-center justify-center mb-6 border ${
            hasPermission
              ? 'border-[#5db872] bg-[#143e32]'
              : 'border-[#265e4d] bg-[#12382d]'
          }`}
        >
          {hasPermission ? (
            <View className="items-center">
              <View className="w-16 h-16 rounded-2xl bg-[#5db872] items-center justify-center mb-4">
                <Text className="text-3xl font-bold text-white">✓</Text>
              </View>
              <Text className="text-xl font-sans-bold text-[#faf9f5] mb-2">
                Accessibility Service
              </Text>
              <Text className="text-xs font-sans text-[#aee2d1] text-center px-4 leading-relaxed">
                Accessibility service is enabled! Your apps will be blocked during reading time.
              </Text>
            </View>
          ) : (
            <View className="items-center w-full">
              <Text className="text-5xl mb-4">🔒</Text>
              <Text className="text-xl font-sans-bold text-[#faf9f5] mb-2">
                Accessibility Service
              </Text>
              <Text className="text-xs font-sans text-[#78a898] text-center px-4 leading-relaxed mb-6">
                Required to detect when you open blocked apps and redirect you to read Bible first.
              </Text>

              <Pressable
                onPress={() => setShowPrivacyModal(true)}
                className="w-full py-3.5 rounded-xl bg-[#f5b800] items-center active:opacity-90 shadow-md"
              >
                <Text className="text-sm font-sans-bold text-[#141413]">
                  Open Settings
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Step-by-step Instructions Box */}
        <View className="p-5 rounded-2xl bg-[#143e32] border border-[#205243] mb-6">
          <Text className="text-xs font-sans-bold text-[#f5b800] mb-3">
            📋 How to enable:
          </Text>
          <Text className="text-xs font-sans text-[#c8ded6] leading-relaxed mb-1.5">
            1. Tap "Open Settings" above
          </Text>
          <Text className="text-xs font-sans text-[#c8ded6] leading-relaxed mb-1.5">
            2. Search for <Text className="font-sans-bold text-white">Installed Apps</Text> or <Text className="font-sans-bold text-white">Downloaded Apps</Text>
          </Text>
          <Text className="text-xs font-sans text-[#c8ded6] leading-relaxed mb-1.5">
            3. Click on <Text className="font-sans-bold text-white">Bible Unlock Shield</Text>
          </Text>
          <Text className="text-xs font-sans text-[#c8ded6] leading-relaxed mb-1.5">
            4. Toggle it to <Text className="font-sans-bold text-[#5db872]">"On"</Text>
          </Text>
          <Text className="text-xs font-sans text-[#c8ded6] leading-relaxed">
            5. Return to this app
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Nav Actions */}
      <View className="flex-row space-x-3 pt-2">
        <Pressable
          onPress={onBack}
          className="flex-1 py-4 mr-2 rounded-2xl bg-[#163f33] border border-[#2b6955] items-center justify-center active:opacity-80"
        >
          <Text className="text-base font-sans-bold text-[#78a898]">Back</Text>
        </Pressable>

        <Pressable
          onPress={handleFinish}
          className={`flex-1 py-4 ml-2 rounded-2xl items-center justify-center active:opacity-90 shadow-lg ${
            hasPermission ? 'bg-[#f5b800]' : 'bg-[#3b5e50]'
          }`}
        >
          <Text
            className={`text-base font-sans-bold ${
              hasPermission ? 'text-[#141413]' : 'text-[#a0c4b6]'
            }`}
          >
            Complete Setup
          </Text>
        </Pressable>
      </View>

      {/* Why We Need Accessibility Privacy Modal (Screens 17a & 17b) */}
      <Modal visible={showPrivacyModal} transparent animationType="slide">
        <View className="flex-1 bg-black/80 justify-end">
          <View className="bg-[#0f2e24] border-t border-[#235846] rounded-t-3xl p-6 max-h-[85%]">
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text
                className="text-2xl font-serif-bold text-[#faf9f5] text-center mb-6 tracking-tight"
                style={{ fontFamily: 'EBGaramond_700Bold' }}
              >
                Why we need Accessibility
              </Text>

              <Text className="text-sm font-sans-bold text-[#f5b800] mb-3">
                How we use this permission:
              </Text>
              <Text className="text-xs font-sans text-[#c8ded6] leading-relaxed mb-3">
                Bible Unlock uses the Accessibility Service to help you maintain your daily Scripture reading habit by:
              </Text>

              <View className="space-y-3 mb-6">
                <View className="flex-row mb-2">
                  <Text className="text-[#f5b800] mr-2">•</Text>
                  <Text className="text-xs font-sans text-[#c8ded6] flex-1 leading-relaxed">
                    <Text className="font-sans-bold text-white">Detecting when you open blocked apps</Text> (like Instagram, TikTok, YouTube) during your scheduled reading times.
                  </Text>
                </View>
                <View className="flex-row mb-2">
                  <Text className="text-[#f5b800] mr-2">•</Text>
                  <Text className="text-xs font-sans text-[#c8ded6] flex-1 leading-relaxed">
                    <Text className="font-sans-bold text-white">Redirecting you back to Bible Unlock</Text> so you can complete your Bible reading first.
                  </Text>
                </View>
                <View className="flex-row mb-2">
                  <Text className="text-[#f5b800] mr-2">•</Text>
                  <Text className="text-xs font-sans text-[#c8ded6] flex-1 leading-relaxed">
                    <Text className="font-sans-bold text-white">Unblocking apps automatically</Text> after you complete your daily reading goal.
                  </Text>
                </View>
              </View>

              <Text className="text-sm font-sans-bold text-[#f5b800] mb-3">
                Your Privacy is Protected:
              </Text>
              <View className="space-y-2 mb-6">
                <View className="flex-row items-center mb-1.5">
                  <Text className="text-[#5db872] mr-2 font-bold">✓</Text>
                  <Text className="text-xs font-sans text-[#c8ded6]">
                    We only monitor apps YOU selected to block
                  </Text>
                </View>
                <View className="flex-row items-center mb-1.5">
                  <Text className="text-[#f26666] mr-2 font-bold">✗</Text>
                  <Text className="text-xs font-sans text-[#c8ded6]">
                    We do NOT collect, store, or share any personal data
                  </Text>
                </View>
                <View className="flex-row items-center mb-1.5">
                  <Text className="text-[#f26666] mr-2 font-bold">✗</Text>
                  <Text className="text-xs font-sans text-[#c8ded6]">
                    We do NOT read your screen content or app data
                  </Text>
                </View>
                <View className="flex-row items-center mb-1.5">
                  <Text className="text-[#f26666] mr-2 font-bold">✗</Text>
                  <Text className="text-xs font-sans text-[#c8ded6]">
                    We do NOT transmit any information to external servers
                  </Text>
                </View>
              </View>

              <View className="p-3.5 rounded-xl bg-[#143d31] border border-[#235846] mb-4">
                <Text className="text-xs font-sans text-[#aee2d1] text-center">
                  This permission works entirely offline on your device.
                </Text>
              </View>

              <View className="p-3.5 rounded-xl bg-[#281b1d] border border-[#4a2428] mb-6">
                <Text className="text-xs font-sans text-[#ff9999] leading-relaxed">
                  ⚠️ This permission is required for Bible Unlock to work. Without it, we cannot block apps during your reading times.
                </Text>
              </View>

              <View className="flex-row space-x-3 mb-4">
                <Pressable
                  onPress={() => setShowPrivacyModal(false)}
                  className="flex-1 py-3.5 mr-2 rounded-xl bg-[#163f33] items-center justify-center"
                >
                  <Text className="text-sm font-sans-bold text-[#78a898]">Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={handleOpenSettings}
                  className="flex-1 py-3.5 ml-2 rounded-xl bg-[#f5b800] items-center justify-center shadow-md"
                >
                  <Text className="text-sm font-sans-bold text-[#141413]">
                    Open Settings
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};
