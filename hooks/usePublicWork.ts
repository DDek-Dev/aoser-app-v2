import { BookingFormData, Job, SubWorkDetail, WorkById, WalletData } from "types";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { publiceWorkApi } from "api/publicWork";
import { useAuth } from "./useAuth";
import { ALERT_TYPE, Toast } from "react-native-alert-notification";
import { workerApi } from "api/workerApi";
import { useTranslation } from "react-i18next";
import {
  trackRequestService,
  trackCompleteTask,
  trackCancelTask,
} from "utils/mixpanel"; // ✅ add
import { logEvent, logError } from "utils/firebase"; // ✅ add

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export const publicWorkKeys = {
  all: ['publicWork'] as const,
  mywork: ['mywork'] as const,
  workinChat: ['workinChat'] as const,
  lists: () => [...publicWorkKeys.all, 'list'] as const,
  list: (filters: any) => [...publicWorkKeys.lists(), { filters }] as const,
  details: () => [...publicWorkKeys.all, 'detail'] as const,
  detail: (work: Job) => [...publicWorkKeys.details(), { work }] as const,
};

export const usePublicWork = (options?: {
  enabled?: boolean;
  refetchOnMount?: boolean;
  refetchOnWindowFocus?: boolean;
  staleTime?: number;
}) => {
  const { tokens } = useAuth();
  return useQuery({
    queryKey: publicWorkKeys.all,
    queryFn: () => publiceWorkApi.getPublicWork(tokens?.accessToken || ''),
    ...options,
  });
};

export const usegetAllMyWork = () => {
  const { tokens } = useAuth();
  return useQuery({
    queryKey: publicWorkKeys.mywork,
    queryFn: () => publiceWorkApi.getAllMyWork(tokens?.accessToken || ''),
  });
};

export const useGetAllMyWorkInfinite = (pageSize = 15) => {
  const { tokens } = useAuth();
  return useInfiniteQuery({
    queryKey: [...publicWorkKeys.mywork, 'infinite', { pageSize }] as const,
    initialPageParam: 0,
    enabled: !!tokens?.accessToken,
    queryFn: ({ pageParam }) =>
      publiceWorkApi.getMyWorkPage(tokens?.accessToken || '', pageParam, pageSize),
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (!Array.isArray(lastPage)) return undefined;
      return lastPage.length === pageSize ? lastPageParam + lastPage.length : undefined;
    },
  });
};

export const usePublicWorkById = (id: string) => {
  return useQuery<WorkById>({
    queryKey: publicWorkKeys.detail(id as any),
    queryFn: () => publiceWorkApi.getPublicWorkById(id),
    enabled: !!id,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });
};

export const useUpdateWorkById = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      publiceWorkApi.updateWorkById(id, data, tokens?.accessToken || ''),
    onSuccess: () => {
      Toast.show({
        type: ALERT_TYPE.SUCCESS,
        title: t('editWork.toast.success'),
        textBody: t('editWork.toast.text_success'),
      });
    },
    onError: (error) => {
      console.log('Update error:', error);
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: t('editWork.toast.error'),
        textBody: t('editWork.toast.text_error'),
      });
    },
  });
};

export const useUpdateAppendWorkById = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      publiceWorkApi.updateAppendWorkById(id, data, tokens?.accessToken || ''),
    onSuccess: () => {
      console.log(t('editWork.toast.success'));
    },
    onError: (error) => {
      console.log('Update error:', error);
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: t('editWork.toast.error'),
        textBody: t('editWork.toast.text_error'),
      });
    },
  });
};

export const useAppendOwnerWork = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      publiceWorkApi.appendOwnerWork(id, data, tokens?.accessToken || ''),
    onSuccess: () => {
      Toast.show({
        type: ALERT_TYPE.SUCCESS,
        title: t('editWork.toast.success'),
        textBody: t('editWork.toast.append_success'),
      });
    },
    onError: (error) => {
      console.log('Update error:', error);
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: t('editWork.toast.error'),
        textBody: t('editWork.toast.text_error'),
      });
    },
  });
};

export const useAcceptAppendWork = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      publiceWorkApi.acceptAppendWork(id, data, tokens?.accessToken || ''),
    onSuccess: () => {
      Toast.show({
        type: ALERT_TYPE.SUCCESS,
        title: t('editWork.toast.success'),
      });
    },
    onError: (error) => {
      console.log('Update error:', error);
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: t('editWork.toast.error'),
        textBody: t('editWork.toast.text_error'),
      });
    },
  });
};

export const useUpdateSubworkStatus = () => {
  const { tokens } = useAuth();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SubWorkDetail[] }) =>
      publiceWorkApi.updateSubworkStatus(id, data, tokens?.accessToken || ''),
  });
};

export const useAcceptWork = () => {
  const { tokens } = useAuth();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      publiceWorkApi.acceptWork(id, data, tokens?.accessToken || ''),
  });
};

// ✅ COMPLETE TASK — tracking added
export const useCompleteWork = () => {
  const { tokens, user } = useAuth();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      publiceWorkApi.completetWork(id, data, tokens?.accessToken || ''),
    onSuccess: (result, variables) => {
      // ✅ track complete task
      trackCompleteTask({
        taskId: variables.id,
        providerId: result?.providerId ?? result?.freelancerId ?? '',
        amount: result?.amount ?? result?.price ?? 0,
        category: result?.category ?? result?.serviceType ?? 'unknown',
      });
      logEvent('complete_task', {
        task_id: variables.id,
        business_type: user?.businessType ?? 'CUSTOMER',
      });
    },
    onError: (error: any, variables) => {
      logError(
        new Error(error.message),
        `Complete Task Failed: ${variables.id}`
      );
    },
  });
};

export const useSubmitWork = () => {
  const { tokens } = useAuth();
  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      publiceWorkApi.submitWork(id, tokens?.accessToken || ''),
  });
};

// ✅ CREATE PUBLIC WORK (request service) — tracking added
export const useCreatePublicWork = () => {
  const queryClient = useQueryClient();
  const { tokens, user } = useAuth();
  return useMutation({
    mutationFn: (data: BookingFormData) =>
      publiceWorkApi.createPublicWork(data, tokens?.accessToken || ''),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: publicWorkKeys.lists() });

      // ✅ track request service
      trackRequestService({
        providerId: (variables as any).providerId ?? (variables as any).freelancerId ?? '',
        taskId: result?._id ?? result?.id ?? '',
        amount: (variables as any).amount ?? (variables as any).budget ?? 0,
        category: (variables as any).category ?? (variables as any).serviceType ?? 'unknown',
        location: (variables as any).location ?? undefined,
      });
      logEvent('request_service', {
        task_id: result?._id ?? '',
        business_type: user?.businessType ?? 'CUSTOMER',
      });
    },
    onError: (error: any) => {
      logError(new Error(error.message), 'Create Public Work Failed');
    },
  });
};

export const useFreelancerApplyWork = () => {
  const queryClient = useQueryClient();
  const { tokens } = useAuth();
  return useMutation({
    mutationFn: ({ workId }: { workId: string }) =>
      publiceWorkApi.freelancerApplyWork(workId, tokens?.accessToken || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: publicWorkKeys.lists() });
    },
  });
};

export const useGetAllAppliedWork = () => {
  const { tokens } = useAuth();
  return useQuery({
    queryKey: publicWorkKeys.workinChat,
    queryFn: () => publiceWorkApi.getAllApplyWork(tokens?.accessToken || ''),
    enabled: !!tokens?.accessToken,
  });
};

export const useGetAllsingleCustomerWork = (workStatus: string, customerId: string) => {
  const { tokens } = useAuth();
  return useQuery({
    queryKey: ['singleCustomerWork', customerId, workStatus],
    queryFn: () => publiceWorkApi.getAllsingleCustomerWork(tokens?.accessToken || '', workStatus, customerId),
    enabled: !!tokens?.accessToken && !!customerId,
  });
};

export const useFreeLRequestUpdateW = () => {
  const { tokens } = useAuth();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      publiceWorkApi.freeLRequestUpdateW(id, data, tokens?.accessToken || ''),
    onError: (error) => {
      console.log('error in API = ', error);
    },
    onSuccess: () => {
      console.log('success');
    },
  });
};

export const useDeletePublicWork = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => publiceWorkApi.deletePublicWork(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: publicWorkKeys.lists() });
    },
  });
};

export const useGetHiredFreelancers = () => {
  const { tokens } = useAuth();
  return useQuery({
    queryKey: ['hiredFreelancers'],
    queryFn: () => workerApi.getHiredFreelancers(tokens?.accessToken || ''),
    enabled: !!tokens?.accessToken,
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });
};

export const useGetWallet = (userId?: string) => {
  const { tokens, user } = useAuth();
  const resolvedUserId = userId ?? user?._id;
  return useQuery<WalletData>({
    queryKey: ['wallet', resolvedUserId],
    queryFn: () => workerApi.getWallet(resolvedUserId!, tokens?.accessToken!),
    enabled: !!tokens?.accessToken && !!resolvedUserId,
  });
};