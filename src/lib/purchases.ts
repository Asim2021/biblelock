import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  PurchasesOfferings,
  PurchasesPackage,
  LOG_LEVEL,
} from 'react-native-purchases';
import { storage } from './mmkv';

const DEV_OVERRIDE_KEY = 'dev_premium_override_mode';
const LEGACY_DEV_KEY = 'dev_premium_override';

export type DevOverrideMode = 'free' | 'pro' | null;

let isConfigured = false;

export function isRevenueCatConfigured(): boolean {
  return isConfigured;
}

const overrideListeners = new Set<(override: DevOverrideMode) => void>();

export function getDevOverride(): DevOverrideMode {
  // Lock down dev override only in production release builds when real RevenueCat is configured
  if (typeof __DEV__ !== 'undefined' && !__DEV__ && isConfigured) return null;
  const val = storage.getString(DEV_OVERRIDE_KEY);
  if (val === 'free' || val === 'pro') return val;
  const legacy = storage.getBoolean(LEGACY_DEV_KEY);
  if (legacy === true) return 'pro';
  if (legacy === false) return 'free';
  return null;
}

export function setDevOverride(mode: DevOverrideMode): void {
  // Lock down dev override only in production release builds when real RevenueCat is configured
  if (typeof __DEV__ !== 'undefined' && !__DEV__ && isConfigured) return;
  if (mode === null) {
    storage.delete(DEV_OVERRIDE_KEY);
    storage.delete(LEGACY_DEV_KEY);
  } else {
    storage.set(DEV_OVERRIDE_KEY, mode);
    storage.set(LEGACY_DEV_KEY, mode === 'pro');
  }
  overrideListeners.forEach((fn) => fn(mode));
}

export interface PurchasesState {
  isPremium: boolean;
  isLoading: boolean;
  offerings: PurchasesOfferings | null;
  customerInfo: CustomerInfo | null;
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  toggleDevPremium: () => void;
}
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

  if (Platform.OS === 'android' && apiKey.startsWith('test_')) {
    console.warn(
      '[Purchases] Configuration skipped: Android native requires a Public Google Play key (goog_...). Test Store keys (test_...) cannot authenticate with Google Play on Android devices. Update EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY in .env to your goog_... key from RevenueCat Dashboard. Falling back to offline mock mode.'
    );
    return;
  }

  try {
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);
    Purchases.configure({
      apiKey,
      entitlementVerificationMode: Purchases.ENTITLEMENT_VERIFICATION_MODE.INFORMATIONAL,
    });
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
  const [devOverride, setDevOverrideState] = useState<DevOverrideMode>(() => getDevOverride());

  useEffect(() => {
    const handleOverride = (mode: DevOverrideMode) => {
      setDevOverrideState(mode);
    };
    overrideListeners.add(handleOverride);
    return () => {
      overrideListeners.delete(handleOverride);
    };
  }, []);

  const checkEntitlements = useCallback((info: CustomerInfo | null) => {
    // 1. Dev override has highest priority for QA/testing
    if (devOverride === 'free') return false;
    if (devOverride === 'pro') return true;

    // 2. Real RevenueCat entitlements
    if (!info) return false;
    const active = info.entitlements.active;
    return (
      typeof active['premium'] !== 'undefined' ||
      typeof active['pro'] !== 'undefined' ||
      Object.keys(active).length > 0
    );
  }, [devOverride]);

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
      setDevOverride('pro');
      return true;
    }

    if (!pkg || !pkg.identifier) {
      console.warn('[Purchases] Cannot purchase: package is undefined or missing an identifier');
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.info('[Purchases] DEV mode: granting pro dev override for missing package');
        setDevOverride('pro');
        return true;
      }
      return false;
    }

    try {
      setDevOverride(null);
      const { customerInfo: updatedInfo } = await Purchases.purchasePackage(pkg);
      setCustomerInfo(updatedInfo);
      return checkEntitlements(updatedInfo);
    } catch (e: any) {
      if (!e?.userCancelled) {
        console.warn('[Purchases] Purchase failed:', e?.message || e);
      }
      return false;
    }
  }, [checkEntitlements]);

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (!isConfigured) {
      return getDevOverride() === 'pro';
    }

    try {
      setDevOverride(null);
      const restoredInfo = await Purchases.restorePurchases();
      setCustomerInfo(restoredInfo);
      return checkEntitlements(restoredInfo);
    } catch (e: any) {
      console.warn('[Purchases] Restore failed:', e.message);
      return false;
    }
  }, [checkEntitlements]);

  const toggleDevPremium = useCallback(() => {
    const currentIsPremium = checkEntitlements(customerInfo);
    const next: DevOverrideMode = currentIsPremium ? 'free' : 'pro';
    setDevOverride(next);
  }, [customerInfo, checkEntitlements]);

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
