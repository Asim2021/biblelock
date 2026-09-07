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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lock, AlertTriangle, Check, Search, ShieldAlert, Sparkles } from 'lucide-react-native';
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

const COMMON_DISTRACTIONS = [
  { label: 'Instagram', packageName: 'com.instagram.android' },
  { label: 'TikTok', packageName: 'com.zhiliaoapp.musically' },
  { label: 'YouTube', packageName: 'com.google.android.youtube' },
  { label: 'X / Twitter', packageName: 'com.twitter.android' },
  { label: 'Reddit', packageName: 'com.reddit.frontpage' },
];

export const AppPickerStep: React.FC<AppPickerStepProps> = ({
  blockedApps,
  setBlockedApps,
  onBack,
  onNext,
}) => {
  const insets = useSafeAreaInsets();
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

  const toggleQuickApp = (pkg: string) => {
    if (blockedApps.includes(pkg)) {
      setBlockedApps(blockedApps.filter((p) => p !== pkg));
    } else {
      setBlockedApps([...blockedApps, pkg]);
    }
  };

  const filteredApps = installedApps.filter((app) =>
    app.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.packageName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View
      className="flex-1 justify-between px-6 py-4 bg-[#0d2e24]"
      style={{ paddingBottom: Math.max(16, insets.bottom + 8) }}
    >
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
          Choose which apps to shield until you complete your daily Bible reading.
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
          <View className="w-16 h-16 rounded-2xl bg-[#1d5242] items-center justify-center mb-3">
            <Lock size={32} color="#f5b800" strokeWidth={2} />
          </View>

          <Text className="text-xl font-sans-bold text-[#faf9f5] mb-1">
            {blockedApps.length > 0
              ? `${blockedApps.length} ${blockedApps.length === 1 ? 'app' : 'apps'} guarded`
              : 'Select Apps to Block'}
          </Text>
          <Text className="text-xs font-sans text-[#78a898]">
            {blockedApps.length > 0
              ? 'Tap to adjust your selected apps'
              : 'Tap to browse all installed apps'}
          </Text>
        </Pressable>

        {/* Quick Suggestion Chips */}
        <View className="mb-5">
          <Text className="text-xs font-sans-bold text-[#78a898] mb-2.5">
            Quick Add Distractions:
          </Text>
          <View className="flex-row flex-wrap">
            {COMMON_DISTRACTIONS.map((c) => {
              const isSelected = blockedApps.includes(c.packageName);
              return (
                <Pressable
                  key={c.packageName}
                  onPress={() => toggleQuickApp(c.packageName)}
                  className={`flex-row items-center px-3 py-2 rounded-xl mr-2 mb-2 border ${
                    isSelected
                      ? 'border-[#f5b800] bg-[#1d4c3d]'
                      : 'border-[#205243] bg-[#143e32]'
                  }`}
                >
                  {isSelected ? (
                    <Check size={14} color="#f5b800" style={{ marginRight: 6 }} />
                  ) : null}
                  <Text
                    className={`text-xs font-sans-bold ${
                      isSelected ? 'text-[#f5b800]' : 'text-[#faf9f5]'
                    }`}
                  >
                    {c.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Selected Apps Confirmation Badge */}
        {blockedApps.length > 0 && (
          <View className="p-4 rounded-2xl bg-[#134032] border border-[#2b725c] flex-row items-center mb-5">
            <Check size={18} color="#5db872" style={{ marginRight: 10 }} />
            <Text className="text-xs font-sans text-[#aee2d1] flex-1 leading-relaxed">
              Selected apps will be shielded until you fulfill your daily reading goal.
            </Text>
          </View>
        )}

        {/* Warning Card */}
        <View className="p-4 rounded-2xl bg-[#3d1a1f] border border-[#692932] mb-5">
          <View className="flex-row items-center mb-1">
            <AlertTriangle size={16} color="#ff7575" style={{ marginRight: 8 }} />
            <Text className="text-xs font-sans-bold text-[#ff7575] uppercase tracking-wider">
              Safety First
            </Text>
          </View>
          <Text className="text-xs font-sans text-[#ff9999] leading-relaxed">
            Do not block system utilities like Phone, Messages, or Google Play Store.
          </Text>
        </View>

        {/* Instructions Card */}
        <View className="p-4 rounded-2xl bg-[#143e32] border border-[#205243] mb-6">
          <View className="flex-row items-center mb-2">
            <Sparkles size={16} color="#f5b800" style={{ marginRight: 8 }} />
            <Text className="text-xs font-sans-bold text-[#f5b800]">
              How App Shielding Works:
            </Text>
          </View>
          <Text className="text-xs font-sans text-[#c8ded6] leading-relaxed mb-1">
            • Whenever you open shielded apps during reading times, Bible Unlock opens instead.
          </Text>
          <Text className="text-xs font-sans text-[#c8ded6] leading-relaxed">
            • After finishing your daily minutes in Scripture, all apps unlock automatically.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
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

      {/* Fullscreen Selection Modal (Safe Area Aware) */}
      <Modal visible={showModal} animationType="slide">
        <View
          className="flex-1 bg-[#12161f] px-5"
          style={{
            paddingTop: Math.max(24, insets.top + 16),
            paddingBottom: Math.max(20, insets.bottom + 12),
          }}
        >
          <Text
            className="text-2xl font-serif-bold text-[#faf9f5] mb-1 tracking-tight"
            style={{ fontFamily: 'EBGaramond_700Bold' }}
          >
            Select Apps to Block
          </Text>
          <Text className="text-xs font-sans text-[#a09d96] mb-4">
            Choose which apps to guard until your daily reading is done
          </Text>

          {/* Search bar */}
          <View className="flex-row items-center px-4 py-3 rounded-xl bg-[#1e232d] border border-[#303642] mb-4">
            <Search size={18} color="#6c6a64" style={{ marginRight: 10 }} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search installed apps..."
              placeholderTextColor="#6c6a64"
              className="flex-1 text-[#faf9f5] font-sans text-sm p-0"
            />
          </View>

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
                        <Check size={14} color="#141413" strokeWidth={3} />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {/* Modal bottom actions (Cleared above Android Navigation Bar) */}
          <View className="flex-row space-x-3 pt-3 border-t border-[#262c38]">
            <Pressable
              onPress={() => setShowModal(false)}
              className="flex-1 py-3.5 mr-2 rounded-xl bg-[#212631] items-center justify-center"
            >
              <Text className="text-sm font-sans-bold text-[#a09d96]">Cancel</Text>
            </Pressable>

            <Pressable
              onPress={handleSave}
              className="flex-1 py-3.5 ml-2 rounded-xl bg-[#f5b800] items-center justify-center shadow-md"
            >
              <Text className="text-sm font-sans-bold text-[#141413]">
                Save & Continue ({tempSelected.length})
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};
