import { getApp } from '@react-native-firebase/app';
import {
  getAnalytics,
  logEvent as firebaseLogEvent,
  setUserId,
  setUserProperty,
  logScreenView as firebaseLogScreenView,
} from '@react-native-firebase/analytics';
import {
  getCrashlytics,
  setUserId as setCrashlyticsUserId,
  setAttribute,
  log,
  recordError,
  setCrashlyticsCollectionEnabled,
} from '@react-native-firebase/crashlytics';
import {
  getPerformance,
  httpMetric,
} from '@react-native-firebase/perf';

const analyticsInstance = getAnalytics(getApp());
const crashlyticsInstance = getCrashlytics();
const perfInstance = getPerformance(getApp());

// ─────────────────────────────────────────
// ✅ USER IDENTITY
// ─────────────────────────────────────────
export const setFirebaseUser = async (userId: string, plan?: string) => {
  try {
    await setUserId(analyticsInstance, userId);
    await setCrashlyticsUserId(crashlyticsInstance, userId);
    if (plan) {
      await setUserProperty(analyticsInstance, 'plan', plan);
      await setAttribute(crashlyticsInstance, 'plan', plan);
    }
  } catch (error) {
    console.log('[Firebase] Error setting user identity:', error);
  }
};

export const clearFirebaseUser = async () => {
  try {
    await setUserId(analyticsInstance, null);
    await setCrashlyticsUserId(crashlyticsInstance, '');
  } catch (error) {
    console.log('[Firebase] Error clearing user identity:', error);
  }
};

// ─────────────────────────────────────────
// ✅ ANALYTICS
// ─────────────────────────────────────────
export const logEvent = async (name: string, params?: Record<string, any>) => {
  try {
    await firebaseLogEvent(analyticsInstance, name, params);
  } catch (error) {
    console.log(`[Firebase] Error logging event ${name}:`, error);
  }
};

export const logScreenView = async (screenName: string) => {
  try {
    await firebaseLogScreenView(analyticsInstance, {
      screen_name: screenName,
      screen_class: screenName,
    });
  } catch (error) {
    console.log(`[Firebase] Error logging screen view ${screenName}:`, error);
  }
};

export const logLogin = async (method: string) =>
  await logEvent('login', { method });

export const logButtonPress = async (buttonName: string, screen: string) =>
  await logEvent('button_press', {
    button_name: buttonName,
    screen,
  });

export const setUserLanguage = async (lang: string) => {
  try {
    await setUserProperty(analyticsInstance, 'app_language', lang);
  } catch (error) {
    console.log('[Firebase] Error setting user language:', error);
  }
};

// ─────────────────────────────────────────
// ✅ CRASHLYTICS
// ─────────────────────────────────────────
export const logError = (error: Error, context?: string) => {
  try {
    if (context) log(crashlyticsInstance, context);
    recordError(crashlyticsInstance, error);
  } catch (err) {
    console.log('[Firebase] Error reporting to Crashlytics:', err);
  }
};

export const enableCrashlytics = async () => {
  try {
    await setCrashlyticsCollectionEnabled(crashlyticsInstance, true);
  } catch (error) {
    console.log('[Firebase] Error enabling Crashlytics:', error);
  }
};

// ─────────────────────────────────────────
// ✅ PERFORMANCE
// ─────────────────────────────────────────
export const measureTrace = async (traceName: string, fn: () => Promise<void>) => {
  const trace = await perfInstance.newTrace(traceName);
  await trace.start();
  try {
    await fn();
  } finally {
    await trace.stop();
  }
};

export { perfInstance };