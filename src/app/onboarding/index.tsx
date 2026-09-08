import React, { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LanguageCode, OnboardingData } from '../../types/onboarding';
import {
  getOnboardingData,
  setOnboardingData,
  setOnboardingCompleted,
} from '../../lib/mmkv';

import { LanguageStep } from './steps/LanguageStep';
import { CarouselStep } from './steps/CarouselStep';
import { SurveyStep } from './steps/SurveyStep';
import { PlanStep } from './steps/PlanStep';
import { AppPickerStep } from './steps/AppPickerStep';
import { PaywallStep } from './steps/PaywallStep';
import { PermissionStep } from './steps/PermissionStep';

export default function OnboardingScreen() {
  const router = useRouter();
  const initialData = getOnboardingData();

  const [step, setStep] = useState<number>(1);
  const [language, setLanguage] = useState<LanguageCode>(initialData.language || 'en');
  const [userName, setUserName] = useState<string>(initialData.userName || '');
  const [readingFrequency, setReadingFrequency] = useState<string[]>(initialData.readingFrequency || []);
  const [biggestChallenges, setBiggestChallenges] = useState<string[]>(initialData.biggestChallenges || []);
  const [readingTimes, setReadingTimes] = useState<string[]>(initialData.readingTimes || ['7:00 AM']);
  const [durationMinutes, setDurationMinutes] = useState<number>(initialData.durationMinutes || 10);
  const [blockedApps, setBlockedApps] = useState<string[]>(initialData.blockedApps || []);

  const saveCurrentProgress = () => {
    setOnboardingData({
      language,
      userName,
      readingFrequency,
      biggestChallenges,
      readingTimes,
      durationMinutes,
      blockedApps,
    });
  };

  const handleFinishOnboarding = () => {
    setOnboardingData({
      language,
      userName: userName.trim() || 'Disciple',
      readingFrequency,
      biggestChallenges,
      readingTimes,
      durationMinutes,
      blockedApps,
      isCompleted: true,
    });
    setOnboardingCompleted(true);
    router.replace('/(tabs)' as any);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0d2e24' }} edges={['top', 'bottom']}>
      <View style={{ flex: 1 }}>
        {step === 1 && (
          <LanguageStep
            selectedLanguage={language}
            onSelectLanguage={setLanguage}
            onContinue={() => {
              saveCurrentProgress();
              setStep(2);
            }}
          />
        )}

        {step === 2 && (
          <CarouselStep
            onComplete={() => {
              saveCurrentProgress();
              setStep(3);
            }}
          />
        )}

        {step === 3 && (
          <SurveyStep
            userName={userName}
            setUserName={setUserName}
            readingFrequency={readingFrequency}
            setReadingFrequency={setReadingFrequency}
            biggestChallenges={biggestChallenges}
            setBiggestChallenges={setBiggestChallenges}
            onComplete={() => {
              saveCurrentProgress();
              setStep(4);
            }}
          />
        )}

        {step === 4 && (
          <PlanStep
            userName={userName || 'Disciple'}
            readingTimes={readingTimes}
            setReadingTimes={setReadingTimes}
            durationMinutes={durationMinutes}
            setDurationMinutes={setDurationMinutes}
            onBack={() => setStep(3)}
            onNext={() => {
              saveCurrentProgress();
              setStep(5);
            }}
          />
        )}

        {step === 5 && (
          <AppPickerStep
            blockedApps={blockedApps}
            setBlockedApps={setBlockedApps}
            onBack={() => setStep(4)}
            onNext={() => {
              saveCurrentProgress();
              setStep(6);
            }}
          />
        )}

        {step === 6 && (
          <PaywallStep
            onBack={() => setStep(5)}
            onNext={() => {
              saveCurrentProgress();
              setStep(7);
            }}
          />
        )}

        {step === 7 && (
          <PermissionStep
            onBack={() => setStep(6)}
            onComplete={handleFinishOnboarding}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
