import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  PurchasesOfferings,
  PurchasesPackage,
  LOG_LEVEL,
} from 'react-native-purchases';
import { storage } from './mmkv';

const DEV_PREMIUM_KEY = 'dev_premium_override';

export interface PurchasesState {
  isPremium: boolean;
  isLoading: boolean;
  offerings: PurchasesOfferings | null;
  customerInfo: CustomerInfo | null;
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  toggleDevPremium: () => void;
}

let isConfigured = false;

export function initRevenueCat() {
  if (isConfigured || Platform.OS === 'web') return;

  const apiKey = Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY || 'appl_placeholder_key',
    android: process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY || 'goog_placeholder_key',
    default: '',
  });

  if (!apiKey || apiKey.includes('placeholder')) {
    console.info('[Purchases] Using mock revenuecat environment (placeholder key)');
    return;
  }

  if (apiKey.startsWith('sk_')) {
    console.warn(
      '[Purchases] Configuration skipped: Secret API key (sk_...) detected in client env. RevenueCat SDK requires the Public SDK key (goog_... for Android, appl_... for iOS, or test_... for Test Store). Please update EXPO_PUBLIC_REVENUECAT_*_KEY in .env.'
    );
    return;
  }

  try {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    Purchases.configure({ apiKey });
    isConfigured = true;
    console.info('[Purchases] RevenueCat configured successfully with public key');
  } catch (e) {
    console.warn('[Purchases] RevenueCat configuration skipped:', e);
  }
}

export function usePurchases(): PurchasesState {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [devPremium, setDevPremium] = useState(() => storage.getBoolean(DEV_PREMIUM_KEY) ?? false);

  const checkEntitlements = useCallback((info: CustomerInfo | null) => {
    if (devPremium) return true;
    if (!info) return false;
    const active = info.entitlements.active;
    return (
      typeof active['premium'] !== 'undefined' ||
      typeof active['pro'] !== 'undefined' ||
      Object.keys(active).length > 0
    );
  }, [devPremium]);

  useEffect(() => {
    initRevenueCat();

    if (!isConfigured) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function loadData() {
      try {
        const info = await Purchases.getCustomerInfo();
        if (isMounted) setCustomerInfo(info);

        const currentOfferings = await Purchases.getOfferings();
        if (isMounted) setOfferings(currentOfferings);
      } catch (e) {
        console.warn('[Purchases] Error loading customer info/offerings:', e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    const listener = (info: CustomerInfo) => {
      if (isMounted) setCustomerInfo(info);
    };

    Purchases.addCustomerInfoUpdateListener(listener);

    return () => {
      isMounted = false;
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, []);

  const purchasePackage = useCallback(async (pkg: PurchasesPackage): Promise<boolean> => {
    if (!isConfigured) {
      // Simulate purchase in dev/mock environment
      storage.set(DEV_PREMIUM_KEY, true);
      setDevPremium(true);
      return true;
    }

    try {
      const { customerInfo: updatedInfo } = await Purchases.purchasePackage(pkg);
      setCustomerInfo(updatedInfo);
      return checkEntitlements(updatedInfo);
    } catch (e: any) {
      if (!e.userCancelled) {
        console.warn('[Purchases] Purchase failed:', e.message);
      }
      return false;
    }
  }, [checkEntitlements]);

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (!isConfigured) {
      return devPremium;
    }

    try {
      const restoredInfo = await Purchases.restorePurchases();
      setCustomerInfo(restoredInfo);
      return checkEntitlements(restoredInfo);
    } catch (e: any) {
      console.warn('[Purchases] Restore failed:', e.message);
      return false;
    }
  }, [checkEntitlements, devPremium]);

  const toggleDevPremium = useCallback(() => {
    const next = !devPremium;
    storage.set(DEV_PREMIUM_KEY, next);
    setDevPremium(next);
  }, [devPremium]);

  return {
    isPremium: checkEntitlements(customerInfo),
    isLoading,
    offerings,
    customerInfo,
    purchasePackage,
    restorePurchases,
    toggleDevPremium,
  };
}
