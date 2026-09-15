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
import { useTheme } from '../lib/themeContext';
import { Card } from '../components/Card';
import { X, Crown, Check } from 'lucide-react-native';

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
  const { colors, isDark } = useTheme();
  const { offerings, purchasePackage, restorePurchases, isPremium } = usePurchases();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual' | 'lifetime'>('annual');
  const [isProcessing, setIsProcessing] = useState(false);

  const currentPackages = offerings?.current?.availablePackages || [];
  const annualPkg = currentPackages.find(
    (p) => p.identifier.toLowerCase().includes('annual') || (p.packageType as string) === 'ANNUAL'
  );
  const monthlyPkg = currentPackages.find(
    (p) => p.identifier.toLowerCase().includes('monthly') || (p.packageType as string) === 'MONTHLY'
  );
  const lifetimePkg = currentPackages.find(
    (p) => p.identifier.toLowerCase().includes('lifetime') || (p.packageType as string) === 'LIFETIME'
  );

  const handleSubscribe = async () => {
    setIsProcessing(true);
    let targetPackage = null;
    if (selectedPlan === 'annual') targetPackage = annualPkg;
    else if (selectedPlan === 'monthly') targetPackage = monthlyPkg;
    else if (selectedPlan === 'lifetime') targetPackage = lifetimePkg;
    if (!targetPackage) targetPackage = currentPackages[0];

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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Modal Close Header */}
      <View
        style={{ borderBottomColor: colors.borderSubtle, borderBottomWidth: 1 }}
        className="px-5 py-3 flex-row justify-between items-center"
      >
        <View className="w-8" />
        <Text
          style={{ color: colors.accent }}
          className="text-xs font-sans-bold uppercase tracking-widest"
        >
          PREMIUM PASS
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={{
            backgroundColor: colors.surfaceElevated,
            borderColor: colors.borderSubtle,
            borderWidth: 1,
          }}
          className="w-8 h-8 items-center justify-center rounded-full active:opacity-70"
        >
          <X size={16} color={colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Title */}
        <View className="items-center my-6">
          <View
            style={{
              backgroundColor: colors.accentBg,
              borderColor: colors.accent,
              borderWidth: 1,
            }}
            className="w-16 h-16 rounded-full items-center justify-center mb-3"
          >
            <Crown size={32} color={colors.accent} strokeWidth={2} />
          </View>
          <Text
            style={{
              fontFamily: 'EBGaramond_700Bold',
              color: colors.textPrimary,
            }}
            className="text-3xl text-center"
          >
            Bible Unlock Pro
          </Text>
          <Text
            style={{ color: colors.textSecondary }}
            className="text-sm text-center mt-2 px-6 leading-relaxed"
          >
            Reclaim your attention and deepen your Scripture walk with unrestricted app blocking.
          </Text>
        </View>

        {/* Comparison Feature Table */}
        <Card
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
            padding: 16,
            marginBottom: 24,
            borderRadius: 16,
          }}
        >
          <Text
            style={{ color: colors.accent }}
            className="text-xs font-sans-bold uppercase tracking-wider mb-3"
          >
            What You Get
          </Text>
          {FEATURES.map((feat, idx) => (
            <View
              key={feat.title}
              style={{
                borderTopColor: colors.borderSubtle,
                borderTopWidth: idx !== 0 ? 1 : 0,
                paddingVertical: 10,
              }}
            >
              <Text
                style={{ color: colors.textPrimary }}
                className="text-sm font-sans-semibold mb-1"
              >
                {feat.title}
              </Text>
              <View className="flex-row justify-between items-center">
                <Text style={{ color: colors.textSecondary }} className="text-xs">
                  Free: {feat.free}
                </Text>
                <View className="flex-row items-center">
                  <Check size={13} color={colors.accent} strokeWidth={2.5} />
                  <Text
                    style={{ color: colors.accent }}
                    className="text-xs font-sans-medium ml-1"
                  >
                    {feat.pro}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </Card>

        {/* Pricing Plan Selector */}
        <View className="mb-6">
          {/* Annual Card (Best Value) */}
          <Pressable
            onPress={() => setSelectedPlan('annual')}
            style={{
              backgroundColor: selectedPlan === 'annual' ? colors.accentBg : colors.surface,
              borderColor: selectedPlan === 'annual' ? colors.accent : colors.border,
              borderWidth: 1,
              borderRadius: 14,
              padding: 16,
              marginBottom: 12,
            }}
            className="flex-row items-center justify-between"
          >
            <View className="flex-1 mr-3">
              <View className="flex-row items-center">
                <Text
                  style={{ color: colors.textPrimary }}
                  className="text-base font-sans-bold"
                >
                  Annual Pass
                </Text>
                <View
                  style={{ backgroundColor: colors.accent }}
                  className="ml-2.5 px-2 py-0.5 rounded-full"
                >
                  <Text
                    style={{ color: colors.accentText }}
                    className="text-[10px] font-sans-bold uppercase"
                  >
                    Save 50%
                  </Text>
                </View>
              </View>
              <Text
                style={{ color: colors.textSecondary }}
                className="text-xs mt-1"
              >
                {annualPkg?.product?.priceString
                  ? `${annualPkg.product.priceString} billed yearly`
                  : '$2.49 / month ($29.99 billed yearly)'}
              </Text>
            </View>
            <View
              style={{
                borderColor: selectedPlan === 'annual' ? colors.accent : colors.borderSubtle,
                backgroundColor: selectedPlan === 'annual' ? colors.accent : 'transparent',
                borderWidth: 1.5,
              }}
              className="w-5 h-5 rounded-full items-center justify-center"
            >
              {selectedPlan === 'annual' && (
                <View
                  style={{ backgroundColor: colors.accentText }}
                  className="w-2 h-2 rounded-full"
                />
              )}
            </View>
          </Pressable>

          {/* Monthly Card */}
          <Pressable
            onPress={() => setSelectedPlan('monthly')}
            style={{
              backgroundColor: selectedPlan === 'monthly' ? colors.accentBg : colors.surface,
              borderColor: selectedPlan === 'monthly' ? colors.accent : colors.border,
              borderWidth: 1,
              borderRadius: 14,
              padding: 16,
              marginBottom: 12,
            }}
            className="flex-row items-center justify-between"
          >
            <View className="flex-1 mr-3">
              <Text
                style={{ color: colors.textPrimary }}
                className="text-base font-sans-bold"
              >
                Monthly Pass
              </Text>
              <Text
                style={{ color: colors.textSecondary }}
                className="text-xs mt-1"
              >
                {monthlyPkg?.product?.priceString
                  ? `${monthlyPkg.product.priceString} / month (cancel anytime)`
                  : '$4.99 / month (cancel anytime)'}
              </Text>
            </View>
            <View
              style={{
                borderColor: selectedPlan === 'monthly' ? colors.accent : colors.borderSubtle,
                backgroundColor: selectedPlan === 'monthly' ? colors.accent : 'transparent',
                borderWidth: 1.5,
              }}
              className="w-5 h-5 rounded-full items-center justify-center"
            >
              {selectedPlan === 'monthly' && (
                <View
                  style={{ backgroundColor: colors.accentText }}
                  className="w-2 h-2 rounded-full"
                />
              )}
            </View>
          </Pressable>

          {/* Lifetime Card */}
          <Pressable
            onPress={() => setSelectedPlan('lifetime')}
            style={{
              backgroundColor: selectedPlan === 'lifetime' ? colors.accentBg : colors.surface,
              borderColor: selectedPlan === 'lifetime' ? colors.accent : colors.border,
              borderWidth: 1,
              borderRadius: 14,
              padding: 16,
            }}
            className="flex-row items-center justify-between"
          >
            <View className="flex-1 mr-3">
              <Text
                style={{ color: colors.textPrimary }}
                className="text-base font-sans-bold"
              >
                Lifetime Access
              </Text>
              <Text
                style={{ color: colors.textSecondary }}
                className="text-xs mt-1"
              >
                {lifetimePkg?.product?.priceString
                  ? `${lifetimePkg.product.priceString} one-time payment forever`
                  : '$49.99 one-time payment forever'}
              </Text>
            </View>
            <View
              style={{
                borderColor: selectedPlan === 'lifetime' ? colors.accent : colors.borderSubtle,
                backgroundColor: selectedPlan === 'lifetime' ? colors.accent : 'transparent',
                borderWidth: 1.5,
              }}
              className="w-5 h-5 rounded-full items-center justify-center"
            >
              {selectedPlan === 'lifetime' && (
                <View
                  style={{ backgroundColor: colors.accentText }}
                  className="w-2 h-2 rounded-full"
                />
              )}
            </View>
          </Pressable>
        </View>

        {/* Primary CTA Button */}
        <Pressable
          onPress={handleSubscribe}
          disabled={isProcessing}
          style={({ pressed }) => [
            {
              backgroundColor: colors.accent,
              opacity: isProcessing ? 0.7 : pressed ? 0.9 : 1,
              transform: [{ scale: pressed && !isProcessing ? 0.98 : 1 }],
            },
          ]}
          className="w-full py-4 rounded-xl items-center justify-center mb-4 shadow-sm"
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color={colors.accentText} />
          ) : (
            <Text
              style={{
                color: colors.accentText,
                fontSize: 16,
                fontFamily: 'Inter_700Bold',
              }}
            >
              {selectedPlan === 'annual' ? 'Start 7-Day Free Trial' : 'Upgrade Now'}
            </Text>
          )}
        </Pressable>

        {/* Restore Purchases */}
        <Pressable onPress={handleRestore} className="py-2 items-center">
          <Text
            style={{ color: colors.textSecondary }}
            className="text-xs font-sans-medium"
          >
            Restore Purchases
          </Text>
        </Pressable>

        <Text
          style={{ color: colors.textMuted }}
          className="text-[11px] text-center mt-4 leading-relaxed px-2"
        >
          Subscription automatically renews unless auto-renew is turned off at least 24 hours before the end of the current period.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
