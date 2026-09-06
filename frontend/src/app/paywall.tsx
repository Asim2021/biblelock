import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePurchases } from '../lib/purchases';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

const FEATURES = [
  {
    title: 'Block Any App on Device',
    free: '5 Presets only',
    pro: 'Unlimited custom apps',
  },
  {
    title: 'Lent / Fasting Mode',
    free: '—',
    pro: '1 min reading = 1 min access',
  },
  {
    title: 'Multiple Daily Goals',
    free: '1 goal/day',
    pro: 'Morning & Evening goals',
  },
  {
    title: 'Lifetime Offline Sync',
    free: 'Basic storage',
    pro: 'Full history & streak sync',
  },
];

export default function PaywallScreen() {
  const router = useRouter();
  const { offerings, purchasePackage, restorePurchases, isPremium } = usePurchases();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual' | 'lifetime'>('annual');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubscribe = async () => {
    setIsProcessing(true);
    // Find matching package if available from RevenueCat, else simulate
    const currentPackages = offerings?.current?.availablePackages;
    const targetPackage = currentPackages?.find((p) =>
      p.identifier.toLowerCase().includes(selectedPlan)
    ) || currentPackages?.[0];

    let success = false;
    if (targetPackage) {
      success = await purchasePackage(targetPackage);
    } else {
      // Mock / Dev fallback
      success = await purchasePackage({} as any);
    }

    setIsProcessing(false);
    if (success) {
      Alert.alert('Welcome to Pro!', 'Your subscription is active. All premium features unlocked.', [
        { text: 'Continue', onPress: () => router.back() },
      ]);
    }
  };

  const handleRestore = async () => {
    setIsProcessing(true);
    const restored = await restorePurchases();
    setIsProcessing(false);
    if (restored) {
      Alert.alert('Purchases Restored', 'Your previous subscription has been restored.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else {
      Alert.alert('Restore', 'No active subscription found for this Apple/Google account.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-dark">
      {/* Modal Close Header */}
      <View className="px-5 py-3 flex-row justify-between items-center border-b border-hairline/10">
        <View className="w-8" />
        <Text className="text-xs font-sans-bold uppercase tracking-widest text-primary">
          PREMIUM PASS
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="w-8 h-8 items-center justify-center rounded-full bg-surface-dark-elevated"
        >
          <Text className="text-on-dark font-sans-bold text-sm">✕</Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Hero Title */}
        <View className="items-center my-6">
          <Text className="text-4xl mb-2">👑</Text>
          <Text
            className="text-3xl text-on-dark text-center font-serif"
            style={{ fontFamily: 'EBGaramond_700Bold' }}
          >
            Bible Unlock Pro
          </Text>
          <Text className="text-sm text-on-dark-soft text-center mt-2 px-6 leading-relaxed">
            Reclaim your attention and deepen your Scripture walk with unrestricted app blocking.
          </Text>
        </View>

        {/* Comparison Feature Table */}
        <Card variant="dark" className="p-4 mb-6 border border-hairline/20">
          <Text className="text-xs font-sans-bold uppercase tracking-wider text-accent-amber mb-3">
            What You Get
          </Text>
          {FEATURES.map((feat, idx) => (
            <View
              key={feat.title}
              className={`py-2.5 ${idx !== 0 ? 'border-t border-hairline/10' : ''}`}
            >
              <Text className="text-sm font-sans-semibold text-on-dark mb-1">
                {feat.title}
              </Text>
              <View className="flex-row justify-between">
                <Text className="text-xs text-on-dark-soft">Free: {feat.free}</Text>
                <Text className="text-xs text-primary font-sans-medium">
                  ✓ {feat.pro}
                </Text>
              </View>
            </View>
          ))}
        </Card>

        {/* Pricing Plan Selector */}
        <View className="space-y-3 mb-6">
          {/* Annual Card (Best Value) */}
          <Pressable
            onPress={() => setSelectedPlan('annual')}
            className={`p-4 rounded-lg border flex-row items-center justify-between mb-3 ${
              selectedPlan === 'annual'
                ? 'bg-primary/10 border-primary'
                : 'bg-surface-dark-elevated border-hairline/10'
            }`}
          >
            <View>
              <View className="flex-row items-center">
                <Text className="text-base font-sans-bold text-on-dark">
                  Annual Pass
                </Text>
                <View className="ml-2.5 bg-primary px-2 py-0.5 rounded-full">
                  <Text className="text-[10px] text-white font-sans-bold uppercase">
                    Save 50%
                  </Text>
                </View>
              </View>
              <Text className="text-xs text-on-dark-soft mt-0.5">
                $2.49 / month ($29.99 billed yearly)
              </Text>
            </View>
            <View
              className={`w-5 h-5 rounded-full border items-center justify-center ${
                selectedPlan === 'annual'
                  ? 'border-primary bg-primary'
                  : 'border-hairline/40'
              }`}
            >
              {selectedPlan === 'annual' && (
                <View className="w-2 h-2 rounded-full bg-white" />
              )}
            </View>
          </Pressable>

          {/* Monthly Card */}
          <Pressable
            onPress={() => setSelectedPlan('monthly')}
            className={`p-4 rounded-lg border flex-row items-center justify-between mb-3 ${
              selectedPlan === 'monthly'
                ? 'bg-primary/10 border-primary'
                : 'bg-surface-dark-elevated border-hairline/10'
            }`}
          >
            <View>
              <Text className="text-base font-sans-bold text-on-dark">
                Monthly Pass
              </Text>
              <Text className="text-xs text-on-dark-soft mt-0.5">
                $4.99 / month (cancel anytime)
              </Text>
            </View>
            <View
              className={`w-5 h-5 rounded-full border items-center justify-center ${
                selectedPlan === 'monthly'
                  ? 'border-primary bg-primary'
                  : 'border-hairline/40'
              }`}
            >
              {selectedPlan === 'monthly' && (
                <View className="w-2 h-2 rounded-full bg-white" />
              )}
            </View>
          </Pressable>

          {/* Lifetime Card */}
          <Pressable
            onPress={() => setSelectedPlan('lifetime')}
            className={`p-4 rounded-lg border flex-row items-center justify-between ${
              selectedPlan === 'lifetime'
                ? 'bg-primary/10 border-primary'
                : 'bg-surface-dark-elevated border-hairline/10'
            }`}
          >
            <View>
              <Text className="text-base font-sans-bold text-on-dark">
                Lifetime Access
              </Text>
              <Text className="text-xs text-on-dark-soft mt-0.5">
                $49.99 one-time payment forever
              </Text>
            </View>
            <View
              className={`w-5 h-5 rounded-full border items-center justify-center ${
                selectedPlan === 'lifetime'
                  ? 'border-primary bg-primary'
                  : 'border-hairline/40'
              }`}
            >
              {selectedPlan === 'lifetime' && (
                <View className="w-2 h-2 rounded-full bg-white" />
              )}
            </View>
          </Pressable>
        </View>

        {/* Primary CTA Button */}
        <Button
          title={
            isProcessing
              ? 'Processing...'
              : selectedPlan === 'annual'
              ? 'Start 7-Day Free Trial'
              : 'Upgrade Now'
          }
          variant="primary"
          size="lg"
          onPress={handleSubscribe}
          loading={isProcessing}
          className="w-full mb-4 shadow-md"
        />

        {/* Restore Purchases */}
        <Pressable onPress={handleRestore} className="py-2 items-center">
          <Text className="text-xs text-on-dark-soft font-sans-medium">
            Restore Purchases
          </Text>
        </Pressable>

        <Text className="text-[11px] text-center text-on-dark-soft/60 mt-4 leading-relaxed">
          Subscription automatically renews unless auto-renew is turned off at least 24 hours before the end of the current period.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
