import { useRouter } from 'expo-router';
import { usePurchases } from './purchases';

/**
 * Simple premium feature gate.
 * Returns isPremium status and a requirePremium() guard
 * that navigates to the paywall if the user is on the free tier.
 */
export function useFeatureGate() {
  const { isPremium } = usePurchases();
  const router = useRouter();

  /** Returns true if premium. If not, pushes to paywall and returns false. */
  function requirePremium(_featureLabel?: string): boolean {
    if (isPremium) return true;
    router.push('/paywall');
    return false;
  }

  return { isPremium, requirePremium };
}
