import { Mixpanel } from 'mixpanel-react-native';

export type UserRole =
  | 'CUSTOMER'
  | 'FREELANCER'
  | 'TRANSPORT'
  | 'ACCOMMODATION'
  | 'COMPANY'
  | 'SHOP'
  | 'AOSER_ADMIN';

const TOKEN = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN ?? '';
const mixpanel = new Mixpanel(TOKEN, true);
mixpanel.init();

// ─────────────────────────────────────────
// ✅ IDENTITY
// ─────────────────────────────────────────
export const mixpanelIdentify = (
  userId: string,
  properties: {
    name: string;
    email?: string;
    phone?: string;
    businessType: UserRole | string;
    plan?: string;
    language?: string;
  }
) => {
  try {
    mixpanel.identify(userId);
    mixpanel.getPeople().set({
      $name: properties.name,
      $email: properties.email ?? '',
      $phone: properties.phone ?? '',
      business_type: properties.businessType,
      plan: properties.plan ?? 'free',
      language: properties.language ?? 'lo',
    });
  } catch (error) {
    console.log('[Mixpanel] Identity error:', error);
  }
};

export const mixpanelReset = () => {
  try {
    mixpanel.reset();
  } catch (error) {
    console.log('[Mixpanel] Reset error:', error);
  }
};

// ─────────────────────────────────────────
// ✅ AUTH EVENTS
// ─────────────────────────────────────────
export const trackLogin = (method: string, businessType: UserRole | string) =>
  safeTrack('login', { method, business_type: businessType });

export const trackSignUp = (method: string, businessType: UserRole | string) =>
  safeTrack('sign_up', { method, business_type: businessType });

export const trackLogout = () =>
  safeTrack('logout');

export const trackAccountDeleted = (businessType: UserRole | string) =>
  safeTrack('account_deleted', { business_type: businessType });

// ─────────────────────────────────────────
// ✅ PROVIDER EVENTS
// ─────────────────────────────────────────
export const trackViewProvider = (
  providerId: string,
  category: string,
  location?: string
) =>
  safeTrack('view_provider', {
    provider_id: providerId,
    category,
    location: location ?? 'unknown',
  });

// ─────────────────────────────────────────
// ✅ SERVICE / TASK EVENTS
// ─────────────────────────────────────────
export const trackRequestService = (params: {
  providerId: string;
  taskId: string;
  amount: number;
  category: string;
  location?: string;
}) =>
  safeTrack('request_service', {
    provider_id: params.providerId,
    task_id: params.taskId,
    amount: params.amount,
    category: params.category,
    location: params.location ?? 'unknown',
  });

export const trackCompleteTask = (params: {
  taskId: string;
  providerId: string;
  amount: number;
  category: string;
}) =>
  safeTrack('complete_task', {
    task_id: params.taskId,
    provider_id: params.providerId,
    amount: params.amount,
    category: params.category,
  });

export const trackCancelTask = (params: {
  taskId: string;
  reason?: string;
  cancelledBy: UserRole | string;
}) =>
  safeTrack('cancel_task', {
    task_id: params.taskId,
    reason: params.reason ?? 'unknown',
    cancelled_by: params.cancelledBy,
  });

// ─────────────────────────────────────────
// ✅ PAYMENT EVENTS
// ─────────────────────────────────────────
export const trackPaymentSuccess = (params: {
  taskId: string;
  providerId: string;
  amount: number;
  method: string;
  businessType: UserRole | string;
}) => {
  try {
    // ✅ trackCharge adds to GMV in Mixpanel dashboard
    mixpanel.getPeople().trackCharge(params.amount, {
      task_id: params.taskId,
      provider_id: params.providerId,
      payment_method: params.method,
    });
  } catch (error) {
    console.log('[Mixpanel] Charge tracking error:', error);
  }

  safeTrack('payment_success', {
    task_id: params.taskId,
    provider_id: params.providerId,
    amount: params.amount,
    payment_method: params.method,
    business_type: params.businessType,
  });
};

export const trackPaymentFailed = (params: {
  taskId: string;
  amount: number;
  reason: string;
}) =>
  safeTrack('payment_failed', {
    task_id: params.taskId,
    amount: params.amount,
    reason: params.reason,
  });

export const trackWithdrawRequest = (params: {
  amount: number;
  method: string;
}) =>
  safeTrack('withdraw_request', {
    amount: params.amount,
    method: params.method,
  });

// ─────────────────────────────────────────
// ✅ LANGUAGE
// ─────────────────────────────────────────
export const setMixpanelLanguage = (lang: string) => {
  try {
    mixpanel.getPeople().set({ language: lang });
  } catch (error) {
    console.log('[Mixpanel] Language setting error:', error);
  }
};

// Internal helper to avoid repetitive try-catches
const safeTrack = (name: string, properties?: any) => {
  try {
    mixpanel.track(name, properties);
  } catch (error) {
    console.log(`[Mixpanel] Error tracking event ${name}:`, error);
  }
};

export default mixpanel;