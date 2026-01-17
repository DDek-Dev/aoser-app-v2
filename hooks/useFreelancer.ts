import { Freelancer, UserProfile } from "types/profile";
import { useInfiniteQuery, useMutation, UseMutationResult, useQuery, useQueryClient } from '@tanstack/react-query';
import { CategoryOption, CreateReview, Job, Favorite, Review, GetFavorite, JobpopularData } from "types";
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

  return useQuery({
    queryKey: ['freelancers'],
    queryFn: () => workerApi.getAllfreelancers(tokens?.accessToken || ''),
    enabled: !!tokens?.accessToken,
  });
};

export const useFreelancerById = (userId: string) => {
  const { tokens } = useAuth();

  return useQuery<Freelancer | null>({
    queryKey: ['freelancer', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      if (!tokens?.accessToken) {
        throw new Error('No access token available');
      }
      
      const response = await axios.get(`${API_BASE_URL}/worker/freelancer/${userId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Aoser ${tokens.accessToken}`,
        },
      });

      if (Array.isArray(response.data.data)) {
        return response.data.data[0] || null;
      }
      return response.data.data || null;
    },
    enabled: !!userId && !!tokens?.accessToken,
  });
};


// update freelancer profile 
export const useUpdateFreelancerProfile = () => {
  const queryClient = useQueryClient();
  const { tokens } = useAuth();

  return useMutation<Freelancer | null, Error, Freelancer>({
    mutationFn: async (data: Freelancer) => {
      if (!tokens?.accessToken) {
        throw new Error('No access token available');
      }

      console.log('Updating freelancer profile with data:', data);

      try {
        const response = await axios.put(`${API_BASE_URL}/worker/freelancer-profile`, data, {
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

export const useGetTopfreelancers = () => {
  const { tokens } = useAuth();
  return useQuery<Freelancer[]>({
    queryKey: ['top-freelancers'],
    queryFn: () => workerApi.getTopFreelancers(tokens?.accessToken || ''),
  });
};


// get recommended freelancers
// export const useRecommendedFreelancers = (queryParams: any) => {
//       // const sort = `skip=0&serviceType=${queryParams}`

//   const { tokens } = useAuth();
//   return useQuery<Freelancer[]>({
//     queryKey: ['recommended-freelancers'],
//     queryFn: () => workerApi.getRecommandFreelancers(tokens?.accessToken || '' ,queryParams),
//   });
// };  

export const useRecommendedFreelancers = (queryParams: any) => {
  const { tokens } = useAuth();

  return useInfiniteQuery<Freelancer[]>({
    queryKey: ['recommended-freelancers', queryParams],
    queryFn: ({ pageParam = 0 }) =>
      workerApi.getRecommandFreelancers(
        tokens?.accessToken || '',
        queryParams,
        pageParam as number,  // ✅ MUST include this - it's the skip value (0, 10, 20, etc.)
        10          // This is the limit
      ),
    getNextPageParam: (lastPage, allPages) => {
      // If last page has data, return next page number
      if (lastPage.length === 10) {
        return allPages.length * 10;
      }
      return undefined; // No more pages
    },
    initialPageParam: 0,
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
export function useMyProfile() {
  const { tokens } = useAuth();
  return useQuery({
    queryKey: ['myProfile'],
    queryFn: () => workerApi.getMyProfile(tokens?.accessToken || ''),
    enabled: !!tokens,
  });
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
  });
}

export function useGetJobsByServiceType(serviceTypeId: string) {
  return useQuery({
    queryKey: ['jobs', serviceTypeId],
    queryFn: () => workerApi.getJobsByServiceType(serviceTypeId),
    enabled: !!serviceTypeId, // Only fetch when serviceTypeId is available
  });
}

export function useFreelancerReviews(freelancerId: string) {
  const { tokens } = useAuth();

  return useQuery<Review[]>({
    queryKey: ['reviews', freelancerId],
    queryFn: () => workerApi.getReviews(freelancerId, tokens?.accessToken || ''),
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
