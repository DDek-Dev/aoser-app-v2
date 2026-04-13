

import { BookingFormData, Job, SubWorkDetail, WorkById, WalletData } from "types";
// hooks/usePublicWork.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { publiceWorkApi } from "api/publicWork";
import { useAuth } from "./useAuth";
import { ALERT_TYPE, Toast } from "react-native-alert-notification";
import { workerApi } from "api/workerApi";
import { useTranslation } from "react-i18next";


// Query keys
export const publicWorkKeys = {
  all: ['publicWork'] as const,
  mywork: ['mywork'] as const,
  workinChat: ['workinChat'] as const,
  lists: () => [...publicWorkKeys.all, 'list'] as const,
  list: (filters: any) => [...publicWorkKeys.lists(), { filters }] as const,
  details: () => [...publicWorkKeys.all, 'detail'] as const,
  detail: (work: Job) => [...publicWorkKeys.details(), { work }] as const,
};

// Hook to get all public works
export const usePublicWork = (options?: {
  enabled?: boolean;
  refetchOnMount?: boolean;
  refetchOnWindowFocus?: boolean;
  staleTime?: number;
}) => {
  const { tokens } = useAuth();

  return useQuery({
    queryKey: publicWorkKeys.all, // ✅ good for "all works"
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
}

// Hook to get a specific public work by ID
export const usePublicWorkById = (id: string) => {
  return useQuery<WorkById>({
    queryKey: publicWorkKeys.detail(id as any),
    queryFn: () => publiceWorkApi.getPublicWorkById(id),
    enabled: !!id,

    // ✅ CACHE FOREVER - Never refetch automatically
    staleTime: Infinity, // Data never becomes stale
    gcTime: Infinity, // Keep in cache forever (never garbage collect)

    // ✅ PREVENT ALL AUTO-REFETCHING
    refetchOnMount: false, // Don't refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch when app comes to foreground
    refetchOnReconnect: false, // Don't refetch when reconnecting
    retry: 1, // Only retry once on failure
  });
};

export const useUpdateWorkById = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => { // Change Job[] to any
      return publiceWorkApi.updateWorkById(id, data, tokens?.accessToken || '');
    },

    // Add onSuccess and onError handlers for better UX
    onSuccess: () => {
      // You can add success actions here
      Toast.show({
        type: ALERT_TYPE.SUCCESS,
        title: t('editWork.toast.success'),
        textBody: t('editWork.toast.text_success'),
      })
    },
    onError: (error) => {
      console.log('Update error:', error);
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: t('editWork.toast.error'),
        textBody: t('editWork.toast.text_error'),
      })
    }
  });
}
export const useUpdateAppendWorkById = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => { // Change Job[] to any
      return publiceWorkApi.updateAppendWorkById(id, data, tokens?.accessToken || '');
    },

    // Add onSuccess and onError handlers for better UX
    onSuccess: () => {
      // You can add success actions here
      // Toast.show({
      //   type: ALERT_TYPE.SUCCESS,
      //   title: t('editWork.toast.success'),
      //   textBody: t('editWork.toast.text_success'),
      // })
      console.log(t('editWork.toast.success'))
    },
    onError: (error) => {
      console.log('Update error:', error);
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: t('editWork.toast.error'),
        textBody: t('editWork.toast.text_error'),
      })
    }
  });
}
export const useAppendOwnerWork = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => { // Change Job[] to any
      return publiceWorkApi.appendOwnerWork(id, data, tokens?.accessToken || '');
    },

    // Add onSuccess and onError handlers for better UX
    onSuccess: () => {
      // You can add success actions here
      Toast.show({
        type: ALERT_TYPE.SUCCESS,
        title: t('editWork.toast.success'),
        textBody: t('editWork.toast.append_success'),
      })
    },
    onError: (error) => {
      console.log('Update error:', error);
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: t('editWork.toast.error'),
        textBody: t('editWork.toast.text_error'),
      })
    }
  });
}
export const useAcceptAppendWork = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => { // Change Job[] to any
      return publiceWorkApi.acceptAppendWork(id, data, tokens?.accessToken || '');
    },

    // Add onSuccess and onError handlers for better UX
    onSuccess: () => {
      // You can add success actions here
      Toast.show({
        type: ALERT_TYPE.SUCCESS,
        title: t('editWork.toast.success'),
        // textBody: t('editWork.toast.text_success'),
      })
    },
    onError: (error) => {
      console.log('Update error:', error);
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: t('editWork.toast.error'),
        textBody: t('editWork.toast.text_error'),
      })
    }
  });
}
// Hooks - Use useMutation instead of useQuery
export const useUpdateSubworkStatus = () => {
  const { tokens } = useAuth();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SubWorkDetail[] }) => {
      return publiceWorkApi.updateSubworkStatus(id, data, tokens?.accessToken || '');
    }
  });
};
export const useAcceptWork = () => {
  const { tokens } = useAuth();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => {
      return publiceWorkApi.acceptWork(id, data, tokens?.accessToken || '');
    }

  });
};
export const useCompleteWork = () => {
  const { tokens } = useAuth();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => {
      return publiceWorkApi.completetWork(id, data, tokens?.accessToken || '');
    }

  });
};



// Submit work 
export const useSubmitWork = () => {
  const { tokens } = useAuth();
  return useMutation({
    mutationFn: ({ id }: { id: string; }) => {
      return publiceWorkApi.submitWork(id, tokens?.accessToken || '');
    }
  });
};


// create public work

export const useCreatePublicWork = () => {
  const queryClient = useQueryClient();
  const { tokens } = useAuth();

  return useMutation({
    mutationFn: (data: BookingFormData) => {
      return publiceWorkApi.createPublicWork(data, tokens?.accessToken || '');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: publicWorkKeys.lists() });
    },
  });
};

export const useFreelancerApplyWork = () => {
  const queryClient = useQueryClient();
  const { tokens } = useAuth();
  return useMutation({
    mutationFn: ({ workId }: { workId: string }) => {
      return publiceWorkApi.freelancerApplyWork(workId, tokens?.accessToken || '');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: publicWorkKeys.lists() });
    }
  })

}


export const useGetAllAppliedWork = () => {
  const { tokens } = useAuth();

  return useQuery({
    queryKey: publicWorkKeys.workinChat,
    queryFn: () => publiceWorkApi.getAllApplyWork(tokens?.accessToken || ''),
    enabled: !!tokens?.accessToken
  });
}
export const useGetAllsingleCustomerWork = (workStatus: string, customerId: string) => {
  const { tokens } = useAuth();

  return useQuery({
    queryKey: ['singleCustomerWork', customerId, workStatus],
    queryFn: () => publiceWorkApi.getAllsingleCustomerWork(tokens?.accessToken || '', workStatus, customerId),
    enabled: !!tokens?.accessToken && !!customerId,
  });
}

export const useFreeLRequestUpdateW = () => {
  const { tokens } = useAuth();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => {
      return publiceWorkApi.freeLRequestUpdateW(id, data, tokens?.accessToken || '');
    },
    onError: (error) => {
      console.log("error in APIL = ", error);
    },
    onSuccess: () => {
      // Toast.show({
      //   type: ALERT_TYPE.SUCCESS,
      //   title: t('editWork.toast.success'),
      //   textBody: t('editWork.toast.text_success'),
      // })
      console.log("success");
    }
  });
};

export const useDeletePublicWork = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      // You'll need to implement this in your API
      return publiceWorkApi.deletePublicWork(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: publicWorkKeys.lists() });
    },
  });
};



export const useGetHiredFreelancers = () => {
  const { tokens } = useAuth();
  return useQuery({
    // use a dedicated query key to avoid colliding with public work queries
    queryKey: ['hiredFreelancers'],
    queryFn: () => workerApi.getHiredFreelancers(tokens?.accessToken || ''),
    enabled: !!tokens?.accessToken,
  });
}

export const useGetWallet = (userId?: string) => {
  const { tokens, user } = useAuth();
  const resolvedUserId = userId ?? user?._id;

  return useQuery<WalletData>({
    queryKey: ["wallet", resolvedUserId],
    queryFn: () => workerApi.getWallet(resolvedUserId!, tokens?.accessToken!),
    enabled: !!tokens?.accessToken && !!resolvedUserId,
  });
};


