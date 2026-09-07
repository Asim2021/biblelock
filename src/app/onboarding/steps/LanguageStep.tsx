import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { LanguageCode } from '../../../types/onboarding';

interface LanguageStepProps {
  selectedLanguage: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  onContinue: () => void;
}

const LANGUAGES: { code: LanguageCode; name: string; nativeName: string; flag: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
];

export const LanguageStep: React.FC<LanguageStepProps> = ({
  selectedLanguage,
  onSelectLanguage,
  onContinue,
}) => {
  return (
    <View className="flex-1 justify-between px-6 py-6 bg-[#0d1117]">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 40, paddingBottom: 20 }}>
        {/* Title & Subtitle */}
        <Text
          className="text-3xl font-serif-bold text-[#faf9f5] text-center mb-2 tracking-tight"
          style={{ fontFamily: 'EBGaramond_700Bold' }}
        >
          Choose your language
        </Text>
        <Text className="text-sm font-sans text-[#a09d96] text-center mb-8">
          Select the language you prefer for the app
        </Text>

        {/* Language Options */}
        <View className="space-y-3">
          {LANGUAGES.map((lang) => {
            const isSelected = selectedLanguage === lang.code;
            return (
              <Pressable
                key={lang.code}
                onPress={() => onSelectLanguage(lang.code)}
                className={`flex-row items-center justify-between p-4 rounded-2xl mb-3 border ${
                  isSelected
                    ? 'border-[#d4a359] bg-[#22251a]'
                    : 'border-[#2d3139] bg-[#161b22]'
                }`}
              >
                <View className="flex-row items-center">
                  <Text className="text-2xl mr-4">{lang.flag}</Text>
                  <View>
                    <Text className="text-base font-sans-semibold text-[#faf9f5]">
                      {lang.nativeName}
                    </Text>
                    {lang.name !== lang.nativeName && (
                      <Text className="text-xs text-[#a09d96]">{lang.name}</Text>
                    )}
                  </View>
                </View>

                {isSelected && (
                  <Text className="text-[#d4a359] text-lg font-bold">✓</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Continue CTA */}
      <Pressable
        onPress={onContinue}
        className="w-full py-4 rounded-2xl bg-[#f5b800] active:opacity-90 items-center justify-center shadow-lg"
      >
        <Text className="text-base font-sans-bold text-[#141413]">
          Continue
        </Text>
      </Pressable>
    </View>
  );
};
