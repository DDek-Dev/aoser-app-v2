import { Freelancer, UserProfile } from "types/profile";
import { useInfiniteQuery, useMutation, UseMutationResult, useQuery, useQueryClient } from '@tanstack/react-query';
import { CategoryOption, CreateReview, Job, Favorite, Review, GetFavorite, JobpopularData, ServiceType } from "types";
import { useAuth } from "./useAuth";
import { workerApi } from "api/workerApi";

import axios from "axios";


const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;


export const useCreateFreelancer = (): UseMutationResult<UserProfile, Error, any> => {
  const { tokens } = useAuth();
  return useMutation<UserProfile, Error, any>({
    mutationKey: ['createFreelancer'],
    mutationFn: (data: UserProfile) => workerApi.createFreelancer(data, tokens?.accessToken || ''),
  });
};


export const useFreeLancers = () => {
  const { tokens } = useAuth();

  return useQuery<UserProfile[]>({
    queryKey: ['all-freelancers'],
    queryFn: () => workerApi.getAllfreelancers(tokens?.accessToken || ''),
    // Aggressive caching for search data
    staleTime: 1000 * 60 * 5, // Fresh for 5 minutes
    gcTime: 1000 * 60 * 15, // Cache for 15 minutes
    refetchOnWindowFocus: false, // Don't refetch on focus (search is read-only)
    refetchOnMount: false, // Use cache on mount
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
  });
};

/**
 * Hook for searching freelancers with client-side filtering
 * This version doesn't make API calls, it uses cached data from useFreeLancers
 */
export const useSearchFreelancers = (searchTerm: string) => {
  const { data: allFreelancers, isLoading, error } = useFreeLancers();
  const { data: serviceTypes } = useGetServiceTypes();

  // This is just a convenience wrapper
  // The actual filtering happens in the component for better control
  return {
    freelancers: allFreelancers || [],
    serviceTypes: serviceTypes || [],
    isLoading,
    error,
  };
};

export const useFreelancerById = (userId: string) => {

  return useQuery<UserProfile | null>({
    queryKey: ['freelancer', userId],
    queryFn: async () => {
      if (!userId) return null;
      const response = await axios.get(`${API_BASE_URL}/worker/freelancer/${userId}`, {
        // headers: {
        //   'Content-Type': 'application/json',
        //   'Authorization': `Aoser ${tokens.accessToken}`,
        // },
      }); 

      if (Array.isArray(response.data.data)) {
        return response.data.data[0] || null;
      }
      return response.data.data || null;
    },
    enabled: !!userId,
  });
};


// update freelancer profile 
export const useUpdateFreelancerProfile = () => {
  const queryClient = useQueryClient();
  const { tokens } = useAuth();

  return useMutation<Freelancer | null, Error, UserProfile>({
    mutationFn: async (data: UserProfile) => {
      if (!tokens?.accessToken) {
        throw new Error('No access token available');
      }

      console.log('Updating freelancer profile with data:', JSON.stringify(data, null, 2));

      try {
        const response = await axios.put(`${API_BASE_URL}/worker/freelancer-kyc-profile`, data, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Aoser ${tokens.accessToken}`,
          },
        });

        console.log("API Response:", response.data);

        // Handle different response structures
        let updatedProfile = null;

        if (response.data) {
          // Check for common API response patterns
          if (response.data.data) {
            // If data is wrapped in a data property
            updatedProfile = Array.isArray(response.data.data)
              ? response.data.data[0]
              : response.data.data;
          } else if (response.data.freelancer) {
            // If response has freelancer property
            updatedProfile = response.data.freelancer;
          } else if (response.data._id) {
            // If the response data itself is the freelancer object
            updatedProfile = response.data;
          }
        }

        if (!updatedProfile) {
          console.warn('No profile data returned from API');
        }

        return updatedProfile;

      } catch (error) {
        console.log('API call failed:', error);
        // Re-throw other errors
        throw error;
      }
    },

    onSuccess: (updatedData, variables) => {
    

      // More specific cache invalidation
      queryClient.invalidateQueries({
        queryKey: ['freelancer'],
        exact: false // This will invalidate all queries starting with 'freelancer'
      });

      // If you know the user ID, invalidate more specifically
      if (updatedData?._id) {
        queryClient.invalidateQueries({
          queryKey: ['freelancer', updatedData._id]
        });

        // Update the specific query cache
        queryClient.setQueryData(['freelancer', updatedData._id], updatedData);
      }

      // Also invalidate user profile if it contains freelancer data
      queryClient.invalidateQueries({
        queryKey: ['profile']
      });
    },

    onError: (error, variables) => {
      console.log('Profile update failed:', {
        error: error.message,
        variables,
      });


    }
  });
};


export const useGetFlHistory = () => {
  const { tokens } = useAuth();
  console.log("tokens = ", tokens);
  console.log("tokens?.accessToken = ", API_BASE_URL);

  return useQuery<Job[]>({
    queryKey: ['freelancer-history'],
    queryFn: async () => {
      try {
        const respone = await axios.get(`${API_BASE_URL}/worker/freelancer-works-history`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Aoser ${tokens?.accessToken}`,
            // 'Authorization': `Aoser eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OWY0YjlhM2E2YmRjY2VhYTIyNTUzOSIsInJvbGUiOiJXT1JLRVIiLCJpYXQiOjE3NjUwNDA1NjgsImV4cCI6MTc2NzYzMjU2OH0.YXEYVTVKz_RGoiZ53DBZfssGyVT3-dttY3XBARudljE`,
          }
        })

        return respone.data.data

      } catch (error) {
        console.log("error in APIL = ", error);
        throw error;

      }
    },
    enabled: !!tokens?.accessToken
  })
}


export const useCreateReview = () => {
  const { tokens } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReview) => workerApi.createReview(data, tokens?.accessToken || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['createReview'] });

    },
    onError: (error) => {
      console.log("error in APIL = ", error);
    }
  })
}
export const useCreateFavorite = () => {
  const { tokens } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Favorite) => workerApi.createFavorite(data, tokens?.accessToken || ''),
    onSuccess: (respone, variables) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      if (variables.likedItemType === 'UserProfile') {
        queryClient.invalidateQueries({
          queryKey: ['freelancer', variables.likedItem]
        });
      }
    },
    onError: (error) => {
      console.log("Error creating favorite:", error);
    }
  });
};

export const useDeleteFavorite = () => {
  const { tokens } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (favoriteId: string) => workerApi.deleteFavorite(favoriteId, tokens?.accessToken || ''),
    onSuccess: () => {
      console.log("Successfully deleted favorite");
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['freelancer'] });
    },
    onError: (error) => {
      console.log("Error deleting favorite:", error);
    }
  });
};


export const useGetAllFavorites = () => {
  const { tokens } = useAuth();
  return useQuery<GetFavorite[]>({
    queryKey: ['favorites'],
    queryFn: () => workerApi.getAllFavorites(tokens?.accessToken || ''),
    enabled: !!tokens?.accessToken
  });
};


// ------------------------------------------------------------------------


// get user id Array
const getFreelancersByIds = async (userIds: string[]): Promise<Freelancer[]> => {
  // return freelancers.filter((f) => userIds.includes(f._id));
  return []
};


// get user id Array
export const useJobInterestFreelancers = (userIds: string[]) => {
  return useQuery<Freelancer[]>({
    queryKey: ['job-interest-freelancers', userIds],
    queryFn: () => getFreelancersByIds(userIds),
    enabled: userIds.length > 0,
  });
};


/**
 * Hook for fetching top freelancers
 * Implements aggressive caching for static content
 */
export const useGetTopfreelancers = () => {
  const { tokens } = useAuth();

  return useQuery<Freelancer[]>({
    queryKey: ['top-freelancers'],
    queryFn: () => workerApi.getTopFreelancers(tokens?.accessToken || ''),
    staleTime: 1000 * 60 * 5, // Fresh for 5 minutes
    gcTime: 1000 * 60 * 15, // Cache for 15 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: false, // Don't always refetch, use cache first
    retry: 2,
    placeholderData: (previousData) => previousData,
  });
};

/**
 * Hook for fetching recommended freelancers with infinite scroll
 * Implements automatic background refetching and cache management
 */
export const useRecommendedFreelancers = (serviceTypeId: string) => {
  const { tokens } = useAuth();

  return useInfiniteQuery<Freelancer[]>({
    queryKey: ['recommended-freelancers', serviceTypeId],
    queryFn: ({ pageParam = 0 }) =>
      workerApi.getRecommandFreelancers(
        tokens?.accessToken || '',
        serviceTypeId,
        pageParam as number,
        10
      ),
    getNextPageParam: (lastPage, allPages) => {
      // Continue fetching if last page is full
      if (lastPage.length === 10) {
        return allPages.length * 10;
      }
      return undefined; // No more pages
    },
    initialPageParam: 0,
    // Cache and refetch configuration
    staleTime: 1000 * 60 * 2, // Data is fresh for 2 minutes
    gcTime: 1000 * 60 * 10, // Cache persists for 10 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to app
    refetchOnMount: 'always', // Always check for new data on mount
    retry: 2, // Retry failed requests twice
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    placeholderData: (previousData) => previousData,
  });
};
export const usePopularJobs = () => {
  const { tokens } = useAuth();
  return useQuery<JobpopularData[]>({
    queryKey: ['popular-jobs'],
    queryFn: () => workerApi.getPopularJob(tokens?.accessToken || ''),
  })
}




// -------------  my profile -------------


// get my profile
// export function useMyProfile() {
//   const { tokens } = useAuth();
//   return useQuery({
//     queryKey: ['myProfile'],
//     queryFn: () => workerApi.getMyProfile(tokens?.accessToken || ''),
//     enabled: !!tokens,
//   });
// }

export function useMyProfile() {
  const { tokens } = useAuth();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['myProfile'],
    queryFn: () => workerApi.getMyProfile(tokens?.accessToken || ''),
    enabled: !!tokens,
    // Add staleTime to control when data is considered stale
    staleTime: 0, // Always consider data stale so it refetches on focus
    // Optionally add cacheTime if you want to keep data in cache longer
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes (gcTime replaces cacheTime in React Query v5)
  });
}

export function useAdminID() {
  const { tokens } = useAuth();

  return useQuery({
    queryKey: ['adminId'],
    queryFn: () => workerApi.getAdminId(tokens?.accessToken || ''),
    enabled: !!tokens,
    // Add staleTime to control when data is considered stale
    staleTime: 0, // Always consider data stale so it refetches on focus
    // Optionally add cacheTime if you want to keep data in cache longer
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes (gcTime replaces cacheTime in React Query v5)
  });
}

// Export a hook to invalidate the profile cache
export function useInvalidateProfile() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ['myProfile'] });
  };
}

// Export a hook to manually refetch profile
export function useRefreshProfile() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.refetchQueries({ queryKey: ['myProfile'] });
  };
}

// update my profile
export function useUpdateMyProfile(): UseMutationResult<UserProfile, Error, any> {
  const { tokens } = useAuth();
  return useMutation<UserProfile, Error, any>({
    mutationFn: (profileData: any) => workerApi.updateMyProfile(tokens?.accessToken || '', profileData),

  });
}


// get all Service type 
export function useGetServiceTypes() {
  return useQuery({
    queryKey: ['serviceTypes'],
    queryFn: () => workerApi.getServiceTypeApi(),
    staleTime: 1000 * 60 * 30, // Fresh for 30 minutes (service types rarely change)
    gcTime: 1000 * 60 * 60, // Cache for 1 hour
    refetchOnWindowFocus: false, // Don't refetch on focus
    refetchOnMount: false, // Use cache on mount
    retry: 3,
  });
}


/**
 * Hook for fetching service types
 * Implements long-term caching for rarely changing data
 */
// export const useGetServiceTypes = () => {
//   return useQuery<ServiceType[]>({
//     queryKey: ['serviceTypes'],
//     queryFn: () => workerApi.getServiceTypeApi(),
//     staleTime: 1000 * 60 * 30, // Fresh for 30 minutes (service types rarely change)
//     gcTime: 1000 * 60 * 60, // Cache for 1 hour
//     refetchOnWindowFocus: false, // Don't refetch on focus
//     refetchOnMount: false, // Use cache on mount
//     retry: 3,
//   });
// };
export function useGetJobsByServiceType(serviceTypeId: string) {
  return useQuery({
    queryKey: ['jobs', serviceTypeId],
    queryFn: () => workerApi.getJobsByServiceType(serviceTypeId),
    enabled: !!serviceTypeId, // Only fetch when serviceTypeId is available
  });
}

export function useFreelancerReviews(freelancerId: string) {
  

  return useQuery<Review[]>({
    queryKey: ['reviews', freelancerId],
    queryFn: () => workerApi.getReviews(freelancerId),
    enabled: !!freelancerId,
    initialData: [],

  });
}
// Category mockdata

export const categories: CategoryOption[] = [
  {
    name: 'Technology',
    icon: 'hardware-chip-outline',
    children: ['Web', 'IT', 'Cybersecurity', 'DevOps', 'Database', 'Testing', 'Blockchain'],
  },
  {
    name: 'Content',
    icon: 'document-text-outline',
    children: ['Editing', 'Translation', 'Copywriting', 'Proofreading', 'Transcription'],
  },
  {
    name: 'Design & Creative',
    icon: 'color-palette-outline',
    children: ['Animation', 'Video', 'Photography', 'Architecture', 'Fashion', 'Illustration'],
  },
  {
    name: 'Marketing',
    icon: 'megaphone-outline',
    children: ['SEO', 'Branding', 'Advertising', 'Sales', 'Support', 'Leadgen'],
  },
  {
    name: 'Finance',
    icon: 'cash-outline',
    children: ['Finance', 'Consulting', 'Auditing', 'Analysis', 'Planning'],
  },
  {
    name: 'Education',
    icon: 'school-outline',
    children: ['Teaching', 'Training', 'Coaching', 'Curriculum'],
  },
  {
    name: 'Legal',
    icon: 'hammer-outline',
    children: ['Compliance', 'Recruiting', 'Assistant', 'Data', 'Management'],
  },
  {
    name: 'Admin',
    icon: 'briefcase-outline',
    children: [],
  },
  {
    name: 'Wellness',
    icon: 'heart-outline',
    children: ['Nursing', 'Fitness', 'Therapy', 'Nutrition', 'Counseling'],
  },
  {
    name: 'Transport',
    icon: 'bus-outline',
    children: ['Trucking', 'Logistics', 'Moving', 'Warehousing'],
  },
  {
    name: 'Lifestyle',
    icon: 'sunny-outline',
    children: ['Catering', 'Cleaning', 'Childcare', 'Petcare', 'Beauty', 'Events'],
  },
  {
    name: 'Entertainment',
    icon: 'film-outline',
    children: ['Music', 'Voice', 'Modeling', 'Hosting', 'Podcasting'],
  },
  {
    name: 'Culinary',
    icon: 'restaurant-outline',
    children: [],
  },
  {
    name: 'Technician',
    icon: 'build-outline',
    children: ['Electrical', 'Plumbing', 'Painting', 'Landscaping', 'HVAC', 'Welding', 'Handyman', 'Roofing', 'Masonry'],
  },
] as const;

export const getCategories = () => categories;
