// utils/kycStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

// All KYC step keys (unscoped)
export const KYC_KEYS = [
  '@aoser_profile',
  '@freelancer_step1',
  '@freelancer_step2',
  '@freelancer_step3',
  '@freelancer_step4',
  '@freelancer_step5',
  '@freelancer_step6',
  '@freelancer_step7',
] as const;

export type KycKey = typeof KYC_KEYS[number];

/** Returns a user-scoped key, e.g. "@freelancer_step1" → "user_abc123:@freelancer_step1" */
export const scopedKey = (userId: string, key: KycKey): string => {
  if (!userId) throw new Error('userId is required to scope KYC storage keys');
  return `${userId}:${key}`;
};

/** Save a step with the user-scoped key */
export const saveScopedStep = async (
  userId: string,
  key: KycKey,
  data: object
): Promise<void> => {
  await AsyncStorage.setItem(scopedKey(userId, key), JSON.stringify(data));
};

/** Get a step with the user-scoped key */
export const getScopedStep = async <T>(
  userId: string,
  key: KycKey
): Promise<T | null> => {
  const raw = await AsyncStorage.getItem(scopedKey(userId, key));
  if (!raw) return null;
  return JSON.parse(raw) as T;
};

/** Get ALL scoped step data at once (used at submit time) */
export const getAllScopedStepData = async (userId: string) => {
  const pairs = await AsyncStorage.multiGet(
    KYC_KEYS.map((k) => scopedKey(userId, k))
  );
  const result: Record<string, any> = {};
  pairs.forEach(([scopedK, value]) => {
    // Strip the userId prefix back to the original key for downstream compat
    const originalKey = scopedK.replace(`${userId}:`, '') as KycKey;
    result[originalKey] = value ? JSON.parse(value) : null;
  });
  return result;
};

/** Clear ALL KYC data for a specific user (call after successful submit or on logout) */
export const clearScopedKycData = async (userId: string): Promise<void> => {
  await AsyncStorage.multiRemove(KYC_KEYS.map((k) => scopedKey(userId, k)));
};

/** 
 * Call this on LOGIN / before starting KYC.
 * If a different user's data exists on this device for ANY of the KYC keys,
 * clears it so the new user starts fresh.
 */
export const clearStaleKycDataForOtherUsers = async (
  currentUserId: string
): Promise<void> => {
  // Find all keys in AsyncStorage
  const allKeys = await AsyncStorage.getAllKeys();

  // Legacy (old app versions) stored these keys without user scoping.
  // These are unsafe because they can leak drafts across accounts on the same device.
  const legacyUnscopedKeys = allKeys.filter((key) =>
    (KYC_KEYS as readonly string[]).includes(key)
  );

  // Find KYC keys that belong to a DIFFERENT user
  const staleKeys = allKeys.filter((key) => {
    const isKycKey = KYC_KEYS.some((k) => key.endsWith(`:${k}`));
    if (!isKycKey) return false;
    const keyUserId = key.split(':')[0];
    return keyUserId !== currentUserId;
  });

  const keysToRemove = Array.from(new Set([...legacyUnscopedKeys, ...staleKeys]));

  if (keysToRemove.length > 0) {
    console.log(`🧹 Clearing ${staleKeys.length} stale KYC keys from previous user`);
    await AsyncStorage.multiRemove(keysToRemove);
  }
};
