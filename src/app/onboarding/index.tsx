import React, { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { OnboardingData } from '../../types/onboarding';
import {
  getOnboardingData,
  setOnboardingData,
  setOnboardingCompleted,
  DEFAULT_BLOCKED_APPS,
} from '../../lib/mmkv';
import { usePurchases } from '../../lib/purchases';

// LanguageStep hidden — English-only for now
import { CarouselStep } from '../../components/onboarding/CarouselStep';
import { SurveyStep } from '../../components/onboarding/SurveyStep';
import { PlanStep } from '../../components/onboarding/PlanStep';
import { AppPickerStep } from '../../components/onboarding/AppPickerStep';
import { PaywallStep } from '../../components/onboarding/PaywallStep';
import { PermissionStep } from '../../components/onboarding/PermissionStep';

export default function OnboardingScreen() {
  const router = useRouter();
  const initialData = getOnboardingData();
  const { isPremium } = usePurchases();

  const [step, setStep] = useState<number>(2); // Start at carousel (language step hidden)
  const language = 'en'; // English-only for now
  const [userName, setUserName] = useState<string>(initialData.userName || 'Disciple');
  const [readingFrequency, setReadingFrequency] = useState<string[]>(initialData.readingFrequency || []);
  const [biggestChallenges, setBiggestChallenges] = useState<string[]>(initialData.biggestChallenges || []);
  const [readingTimes, setReadingTimes] = useState<string[]>(initialData.readingTimes || ['7:00 AM']);
  const [durationMinutes, setDurationMinutes] = useState<number>(initialData.durationMinutes || 10);
  const [blockedApps, setBlockedApps] = useState<string[]>(
    initialData.blockedApps && initialData.blockedApps.length > 0
      ? initialData.blockedApps
      : DEFAULT_BLOCKED_APPS
  );

  const saveCurrentProgress = () => {
    const effectiveDuration = (!isPremium && durationMinutes === 30) ? 15 : durationMinutes;
    setOnboardingData({
      language,
      userName,
      readingFrequency,
      biggestChallenges,
      readingTimes,
      durationMinutes: effectiveDuration,
      blockedApps,
    });
  };

  const handleFinishOnboarding = () => {
    const effectiveDuration = (!isPremium && durationMinutes === 30) ? 15 : durationMinutes;
    setOnboardingData({
      language,
      userName: userName.trim() || 'Disciple',
      readingFrequency,
      biggestChallenges,
      readingTimes,
      durationMinutes: effectiveDuration,
      blockedApps,
      isCompleted: true,
    });
    setOnboardingCompleted(true);
    router.replace('/(tabs)' as any);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0d2e24' }} edges={['top', 'bottom']}>
      <View style={{ flex: 1 }}>
        {/* LanguageStep hidden — English-only for now */}

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
