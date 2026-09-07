import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { AppBlocker } from '../../../lib/appBlocker';

interface AppPickerStepProps {
  blockedApps: string[];
  setBlockedApps: (apps: string[]) => void;
  onBack: () => void;
  onNext: () => void;
}

interface AppItem {
  packageName: string;
  label: string;
  isSystemApp?: boolean;
}

export const AppPickerStep: React.FC<AppPickerStepProps> = ({
  blockedApps,
  setBlockedApps,
  onBack,
  onNext,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [installedApps, setInstalledApps] = useState<AppItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [tempSelected, setTempSelected] = useState<string[]>(blockedApps);

  useEffect(() => {
    AppBlocker.getInstalledApps().then((apps) => {
      setInstalledApps(apps);
    });
  }, []);

  const openPicker = async () => {
    setTempSelected(blockedApps);
    setShowModal(true);
    setLoading(true);
    const apps = await AppBlocker.getInstalledApps();
    setInstalledApps(apps);
    setLoading(false);
  };

  const toggleApp = (pkg: string) => {
    if (tempSelected.includes(pkg)) {
      setTempSelected(tempSelected.filter((p) => p !== pkg));
    } else {
      setTempSelected([...tempSelected, pkg]);
    }
  };

  const handleSave = () => {
    setBlockedApps(tempSelected);
    setShowModal(false);
  };

  const filteredApps = installedApps.filter((app) =>
    app.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.packageName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View className="flex-1 justify-between px-6 py-6 bg-[#0d2e24]">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 10, paddingBottom: 20 }}>
        {/* Top 5-segment Progress Bar */}
        <View className="flex-row space-x-1.5 pt-4 mb-4">
          {[1, 2, 3, 4, 5].map((idx) => (
            <View
              key={idx}
              className={`flex-1 h-1 rounded-full mr-1.5 ${
                idx <= 3 ? 'bg-[#f5b800]' : 'bg-[#1b4a3c]'
              }`}
            />
          ))}
        </View>

        <Text className="text-xs font-sans-bold text-[#f5b800] mb-3">
          3 of 5
        </Text>

        <Text
          className="text-3xl font-serif-bold text-[#faf9f5] mb-2 tracking-tight"
          style={{ fontFamily: 'EBGaramond_700Bold' }}
        >
          Now block the apps stealing your time
        </Text>

        <Text className="text-sm font-sans text-[#78a898] mb-6 leading-relaxed">
          Choose which apps to block until you complete your daily Bible reading.
        </Text>

        {/* Big Interactive Lock Card */}
        <Pressable
          onPress={openPicker}
          className={`p-6 rounded-3xl items-center justify-center mb-5 border ${
            blockedApps.length > 0
              ? 'border-[#f5b800] bg-[#143e32]'
              : 'border-[#265e4d] bg-[#12382d]'
          } active:opacity-90`}
        >
          <Text className="text-5xl mb-3">🔒</Text>
          <Text className="text-xl font-sans-bold text-[#faf9f5] mb-1">
            {blockedApps.length > 0
              ? `${blockedApps.length} apps picked`
              : 'Select Apps to Block'}
          </Text>
          <Text className="text-xs font-sans text-[#78a898]">
            {blockedApps.length > 0
              ? 'Tap to change selection'
              : 'Tap to choose apps'}
          </Text>
        </Pressable>

        {/* Selected Apps Confirmation Badge */}
        {blockedApps.length > 0 && (
          <View className="p-4 rounded-2xl bg-[#134032] border border-[#2b725c] flex-row items-center mb-5">
            <Text className="text-[#5db872] text-lg font-bold mr-3">✓</Text>
            <Text className="text-xs font-sans text-[#aee2d1] flex-1 leading-relaxed">
              Selected apps will be blocked until you complete your daily reading.
            </Text>
          </View>
        )}

        {/* Warning Card */}
        <View className="p-4 rounded-2xl bg-[#3d1a1f] border border-[#692932] mb-5">
          <View className="flex-row items-center mb-1">
            <Text className="text-sm mr-2">⚠️</Text>
            <Text className="text-xs font-sans-bold text-[#ff7575] uppercase tracking-wider">
              Important Warning
            </Text>
          </View>
          <Text className="text-xs font-sans text-[#ff9999] leading-relaxed">
            DO NOT block the Google Play Store or Phone. Blocking system apps can cause device issues.
          </Text>
        </View>

        {/* Instructions Card */}
        <View className="p-4 rounded-2xl bg-[#143e32] border border-[#205243] mb-6">
          <Text className="text-xs font-sans-bold text-[#f5b800] mb-2">
            💡 How to Select Apps:
          </Text>
          <Text className="text-xs font-sans text-[#c8ded6] leading-relaxed mb-1">
            • Tap "Select Apps to Block" to find Instagram, TikTok, YouTube, etc.
          </Text>
          <Text className="text-xs font-sans text-[#c8ded6] leading-relaxed mb-1">
            • Use the search bar to locate any installed app.
          </Text>
          <Text className="text-xs font-sans text-[#c8ded6] leading-relaxed">
            • Select your distracting apps and tap "Save & Continue".
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Nav */}
      <View className="flex-row space-x-3 pt-2">
        <Pressable
          onPress={onBack}
          className="flex-1 py-4 mr-2 rounded-2xl bg-[#163f33] border border-[#2b6955] items-center justify-center active:opacity-80"
        >
          <Text className="text-base font-sans-bold text-[#78a898]">Back</Text>
        </Pressable>

        <Pressable
          onPress={onNext}
          className="flex-1 py-4 ml-2 rounded-2xl bg-[#f5b800] items-center justify-center active:opacity-90 shadow-lg"
        >
          <Text className="text-base font-sans-bold text-[#141413]">Next</Text>
        </Pressable>
      </View>

      {/* Fullscreen Selection Modal */}
      <Modal visible={showModal} animationType="slide">
        <View className="flex-1 bg-[#12161f] pt-12 px-5 pb-6">
          <Text
            className="text-2xl font-serif-bold text-[#faf9f5] mb-1 tracking-tight"
            style={{ fontFamily: 'EBGaramond_700Bold' }}
          >
            Select Apps to Block
          </Text>
          <Text className="text-xs font-sans text-[#a09d96] mb-4">
            Choose which apps to block until you complete your Bible reading
          </Text>

          {/* Search bar */}
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search installed apps..."
            placeholderTextColor="#6c6a64"
            className="w-full px-4 py-3 rounded-xl bg-[#1e232d] border border-[#303642] text-[#faf9f5] font-sans mb-4"
          />

          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color="#f5b800" size="large" />
              <Text className="text-xs font-sans text-[#a09d96] mt-3">
                Scanning installed apps...
              </Text>
            </View>
          ) : (
            <ScrollView className="flex-1 mb-4" showsVerticalScrollIndicator={false}>
              {filteredApps.map((app) => {
                const isSelected = tempSelected.includes(app.packageName);
                return (
                  <Pressable
                    key={app.packageName}
                    onPress={() => toggleApp(app.packageName)}
                    className={`flex-row items-center justify-between p-3.5 rounded-xl mb-2 border ${
                      isSelected
                        ? 'border-[#f5b800] bg-[#242b1e]'
                        : 'border-[#212631] bg-[#161a23]'
                    }`}
                  >
                    <View className="flex-row items-center flex-1 mr-3">
                      <View className="w-10 h-10 rounded-xl bg-[#252d3d] items-center justify-center mr-3">
                        <Text className="text-base font-bold text-[#f5b800]">
                          {app.label.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-sans-bold text-[#faf9f5]" numberOfLines={1}>
                          {app.label}
                        </Text>
                        <Text className="text-[11px] font-sans text-[#8e8b82]" numberOfLines={1}>
                          {app.packageName}
                        </Text>
                      </View>
                    </View>

                    <View
                      className={`w-6 h-6 rounded-md border items-center justify-center ${
                        isSelected
                          ? 'border-[#f5b800] bg-[#f5b800]'
                          : 'border-[#4a5263]'
                      }`}
                    >
                      {isSelected && (
                        <Text className="text-xs font-bold text-black">✓</Text>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {/* Modal bottom actions */}
          <View className="flex-row space-x-3 pt-2 border-t border-[#262c38]">
            <Pressable
              onPress={() => setShowModal(false)}
              className="flex-1 py-3.5 mr-2 rounded-xl bg-[#212631] items-center justify-center"
            >
              <Text className="text-sm font-sans-bold text-[#a09d96]">Cancel</Text>
            </Pressable>

            <Pressable
              onPress={handleSave}
              className="flex-1 py-3.5 ml-2 rounded-xl bg-[#2f755e] items-center justify-center"
            >
              <Text className="text-sm font-sans-bold text-white">Save & Continue</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};
