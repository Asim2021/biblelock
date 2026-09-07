import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';

interface SurveyStepProps {
  userName: string;
  setUserName: (name: string) => void;
  readingFrequency: string[];
  setReadingFrequency: (freq: string[]) => void;
  biggestChallenges: string[];
  setBiggestChallenges: (ch: string[]) => void;
  onComplete: () => void;
}

const FREQUENCY_OPTIONS = [
  { id: 'Every day', label: 'Every day', emoji: '✨' },
  { id: 'Few times a week', label: 'Few times a week', emoji: '📖' },
  { id: 'Rarely', label: 'Rarely', emoji: '🌙' },
  { id: 'I want to start', label: 'I want to start', emoji: '🌱' },
];

const CHALLENGE_OPTIONS = [
  { id: 'Finding time', label: 'Finding time', emoji: '⏰' },
  { id: 'Staying consistent', label: 'Staying consistent', emoji: '📅' },
  { id: 'Social media distractions', label: 'Social media distractions', emoji: '📱' },
  { id: 'Lack of motivation', label: 'Lack of motivation', emoji: '💭' },
];

export const SurveyStep: React.FC<SurveyStepProps> = ({
  userName,
  setUserName,
  readingFrequency,
  setReadingFrequency,
  biggestChallenges,
  setBiggestChallenges,
  onComplete,
}) => {
  const insets = useSafeAreaInsets();
  const [subStep, setSubStep] = useState<1 | 2 | 3>(1);

  const toggleFrequency = (item: string) => {
    if (readingFrequency.includes(item)) {
      setReadingFrequency(readingFrequency.filter((i) => i !== item));
    } else {
      setReadingFrequency([...readingFrequency, item]);
    }
  };

  const toggleChallenge = (item: string) => {
    if (biggestChallenges.includes(item)) {
      setBiggestChallenges(biggestChallenges.filter((i) => i !== item));
    } else {
      setBiggestChallenges([...biggestChallenges, item]);
    }
  };

  const handleNext = () => {
    if (subStep === 1) {
      const trimmed = userName.trim();
      setUserName(trimmed || 'Disciple');
      setSubStep(2);
    } else if (subStep === 2) {
      if (readingFrequency.length === 0) {
        setReadingFrequency(['Every day']);
      }
      setSubStep(3);
    } else {
      if (biggestChallenges.length === 0) {
        setBiggestChallenges(['Social media distractions']);
      }
      onComplete();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-[#0d2e24]"
    >
      <View
        className="flex-1 justify-between px-6 py-4"
        style={{ paddingBottom: Math.max(16, insets.bottom + 8) }}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 20 }}>
          {/* Substep indicator */}
          <Text className="text-xs font-sans-bold text-[#f5b800] mb-8">
            {subStep} of 3
          </Text>

          {/* SubStep 1: Name */}
          {subStep === 1 && (
            <View className="items-center mt-6">
              <Text className="text-7xl mb-8">👋</Text>
              <Text
                className="text-3xl font-serif-bold text-[#faf9f5] text-center mb-8 tracking-tight"
                style={{ fontFamily: 'EBGaramond_700Bold' }}
              >
                What's your name?
              </Text>

              <TextInput
                value={userName}
                onChangeText={setUserName}
                placeholder="Enter your name"
                placeholderTextColor="#5c8a7b"
                autoFocus
                className="w-full px-5 py-4 rounded-2xl bg-[#174637] border border-[#2b6b55] text-lg text-[#faf9f5] font-sans"
              />
            </View>
          )}

          {/* SubStep 2: Frequency */}
          {subStep === 2 && (
            <View>
              <Text
                className="text-3xl font-serif-bold text-[#faf9f5] mb-2 tracking-tight"
                style={{ fontFamily: 'EBGaramond_700Bold' }}
              >
                How often do you currently read Bible?
              </Text>
              <Text className="text-xs font-sans text-[#78a898] mb-6">
                Select all that apply
              </Text>

              <View className="space-y-3">
                {FREQUENCY_OPTIONS.map((opt) => {
                  const isChecked = readingFrequency.includes(opt.id);
                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() => toggleFrequency(opt.id)}
                      className={`flex-row items-center p-4 rounded-2xl mb-3 border ${
                        isChecked
                          ? 'border-[#f5b800] bg-[#1a4a3b]'
                          : 'border-[#245747] bg-[#153f32]'
                      }`}
                    >
                      <View
                        className={`w-6 h-6 rounded-md border items-center justify-center mr-4 ${
                          isChecked
                            ? 'border-[#f5b800] bg-[#f5b800]'
                            : 'border-[#427c69]'
                        }`}
                      >
                        {isChecked && (
                          <Check size={14} color="#141413" strokeWidth={3.5} />
                        )}
                      </View>
                      <Text className="text-xl mr-3">{opt.emoji}</Text>
                      <Text className="text-base font-sans-medium text-[#faf9f5]">
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* SubStep 3: Challenges */}
          {subStep === 3 && (
            <View>
              <Text
                className="text-3xl font-serif-bold text-[#faf9f5] mb-2 tracking-tight"
                style={{ fontFamily: 'EBGaramond_700Bold' }}
              >
                What's your biggest challenge?
              </Text>
              <Text className="text-xs font-sans text-[#78a898] mb-6">
                Select all that apply
              </Text>

              <View className="space-y-3">
                {CHALLENGE_OPTIONS.map((opt) => {
                  const isChecked = biggestChallenges.includes(opt.id);
                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() => toggleChallenge(opt.id)}
                      className={`flex-row items-center p-4 rounded-2xl mb-3 border ${
                        isChecked
                          ? 'border-[#f5b800] bg-[#1a4a3b]'
                          : 'border-[#245747] bg-[#153f32]'
                      }`}
                    >
                      <View
                        className={`w-6 h-6 rounded-md border items-center justify-center mr-4 ${
                          isChecked
                            ? 'border-[#f5b800] bg-[#f5b800]'
                            : 'border-[#427c69]'
                        }`}
                      >
                        {isChecked && (
                          <Check size={14} color="#141413" strokeWidth={3.5} />
                        )}
                      </View>
                      <Text className="text-xl mr-3">{opt.emoji}</Text>
                      <Text className="text-base font-sans-medium text-[#faf9f5]">
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Continue Button */}
        <Pressable
          onPress={handleNext}
          className="w-full py-4 rounded-2xl bg-[#286350] border border-[#3b846c] active:opacity-90 items-center justify-center shadow-md mb-2"
        >
          <Text className="text-base font-sans-bold text-[#f5b800]">
            Continue
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};
