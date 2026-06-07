import { useMutation } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { payment } from "api/paymentAPI";
import { Payment } from "types/payment";
import { trackPaymentSuccess, trackPaymentFailed } from "utils/mixpanel";
import { logError, logEvent } from "utils/firebase";

export const useGenerateOnepayQRcode = () => {
  const { tokens } = useAuth();
  return useMutation({
    mutationFn: ({ data }: { data: Payment }) => {
      return payment.onepayQRcode(data, tokens?.accessToken || '');
    },
  });
};

export const usePayment = () => {
  const { tokens, user } = useAuth();
  return useMutation({
    mutationFn: ({ data }: { data: Payment }) => {
      return payment.becelPayment(data, tokens?.accessToken || '');
    },
    onSuccess: (result, variables) => {
      // ✅ BCEL direct payment success
      trackPaymentSuccess({
        taskId: variables.data.paymentFor ?? '',
        providerId: variables.data.payTo ?? '',
        amount: variables.data.amount ?? 0,
        method: variables.data.paymentMethod ?? 'bcel_direct',
        businessType: user?.businessType ?? 'CUSTOMER',
      });
      logEvent('payment_success', {
        task_id: variables.data.paymentFor ?? '',
        amount: variables.data.amount ?? 0,
        method: variables.data.paymentMethod ?? 'bcel_direct',
        currency: variables.data.currency ?? 'LAK',
      });
    },
    onError: (error: any, variables) => {
      // ✅ BCEL direct payment failed
      trackPaymentFailed({
        taskId: variables.data.paymentFor ?? '',
        amount: variables.data.amount ?? 0,
        reason: error?.response?.data?.message ?? 'unknown',
      });
      logError(
        new Error(error.message),
        `Payment Failed: ${variables.data.paymentFor}`
      );
    },
  });
};

export const useCheckOnepayqr = () => {
  const { tokens, user } = useAuth();
  return useMutation({
    mutationFn: ({ data }: { data: Payment }) => {
      return payment.checkOnepayqr(data, tokens?.accessToken || '');
    },
    onSuccess: (result, variables) => {
      // ✅ Check payment status from PaymentCallback
      const status = result?.status;
      const isSuccess = status === 'PAYMENT_COMPLETED';
      const isFailed =
        status === 'PAYMENT_FAILED' ||
        status === 'PAYMENT_CANCELLED';

      if (isSuccess) {
        trackPaymentSuccess({
          taskId: result?.invoiceid ?? variables.data.paymentFor ?? '',
          providerId: result?.payTo?._id ?? variables.data.payTo ?? '',
          amount: result?.amount ?? variables.data.amount ?? 0,
          method: 'onepay_qr',
          businessType: user?.businessType ?? 'CUSTOMER',
        });
        logEvent('payment_success', {
          task_id: result?.invoiceid ?? '',
          amount: result?.amount ?? 0,
          method: 'onepay_qr',
          currency: result?.currency ?? 'LAK',
        });
      } else if (isFailed) {
        trackPaymentFailed({
          taskId: result?.invoiceid ?? variables.data.paymentFor ?? '',
          amount: result?.amount ?? variables.data.amount ?? 0,
          reason: status ?? 'payment_not_completed',
        });
        logEvent('payment_failed', {
          task_id: result?.invoiceid ?? '',
          status,
          method: 'onepay_qr',
        });
      }
    },
    onError: (error: any, variables) => {
      // ✅ QR check API itself failed
      trackPaymentFailed({
        taskId: variables.data.paymentFor ?? '',
        amount: variables.data.amount ?? 0,
        reason: error?.response?.data?.message ?? 'unknown',
      });
      logError(
        new Error(error.message),
        `OnePay QR Check Failed: ${variables.data.paymentFor}`
      );
    },
  });
};

export const useGetBillData = (workId: string) => {
  const { tokens } = useAuth();
  return useMutation({
    mutationFn: (workId: string) => {
      return payment.getBillData(workId, tokens?.accessToken || '');
    },
  });
};