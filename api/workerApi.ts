// workerApi.ts

import { Freelancer, UserProfile } from "types/profile";


import { CreateReview, ServiceType, SubService, Favorite, Review, GetFavorite, JobpopularData, WalletData, ReportType } from "types";
import axios from "axios";
import networkCheck from "./networkCheck";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;


const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000, // 15 second timeout
    headers: {
        'Content-Type': 'application/json',
    },
});

export const workerApi = {
    /**
      * Fetch recommended freelancers with pagination
      * @param token - Authorization token
      * @param serviceTypeId - Filter by service type (empty string for all)
      * @param skip - Pagination offset
      * @param limit - Number of items per page
      */
    // get my profile
    getMyProfile: async (token: string): Promise<UserProfile> => {
        try {

            const response = await networkCheck.get(`${API_BASE_URL}/worker/freelancer-profile`, {
                method: 'GET',
                headers: {
                    'Authorization': `Aoser ${token}`,
                },
            });


            if (!response) {
                throw new Error(response || 'Failed to fetch profile');
            }

            return response.data.data;
        } catch (error) {
            console.log('Error fetching profile:', error);
            throw error;
        }
    },
    getAdminId: async (token: string): Promise<UserProfile> => {
        try {

            const response = await networkCheck.get(`${API_BASE_URL}/auth/admin-user`, {
                method: 'GET',
                headers: {
                    'Authorization': `Aoser ${token}`,
                },
            });


            if (!response) {
                throw new Error(response || 'Failed to fetch Admin');
            }

            return response.data.data;
        } catch (error) {
            console.log('Error fetching Admin profile:', error);
            throw error;
        }
    },

    // update my profile
    updateMyProfile: async (token: string, data: any): Promise<UserProfile> => {

        try {

            const response = await fetch(`${API_BASE_URL}/worker/freelancer-profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Aoser ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const updatedProfile = await response.json();

            if (!response.ok) {
                throw new Error(updatedProfile.message || 'Failed to update profile');
            }

            return updatedProfile.data;
        } catch (error) {
            console.log('Error updating profile:', error);
            throw error;
        }


    },
    
    getAllfreelancers: async (token: string): Promise<UserProfile[]> => {
        try {
            const response = await networkCheck.get('/worker/freelancers', {
                headers: {
                    // Authorization: `Aoser ${token}`,
                },
            });

            return response.data.data || [];
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.log('Error fetching all freelancers:', {
                    message: error.message,
                    status: error.response?.status,
                    data: error.response?.data,
                });
            }
            throw error;
        }
    },
    getAllFreelancersPaginated: async (token: string): Promise<UserProfile[]> => {
        try {
            const allFreelancers: UserProfile[] = [];
            let skip = 0;
            const limit = 100; // Large batch size
            let hasMore = true;

            while (hasMore) {
                const response = await apiClient.get(
                    `/worker/freelancers?skip=${skip}&limit=${limit}`,
                    {
                        headers: {
                            Authorization: `Aoser ${token}`,
                        },
                    }
                );

                const freelancers = response.data.data || [];
                allFreelancers.push(...freelancers);

                // Check if there are more pages
                hasMore = freelancers.length === limit;
                skip += limit;

                // Safety check to prevent infinite loops
                if (skip > 10000) {
                    console.warn('Reached maximum pagination limit');
                    break;
                }
            }

            return allFreelancers;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.log('Error fetching paginated freelancers:', {
                    message: error.message,
                    status: error.response?.status,
                });
            }
            throw error;
        }
    },

    // create freelancer
    createFreelancer: async (data: UserProfile, token: string): Promise<UserProfile> => {
        console.log("Data to create freelancer: ", JSON.stringify(data, null, 2));
        const response = await fetch(`${API_BASE_URL}/worker/freelancer-kyc`, {
            method: 'POST',
            headers: {
                'Authorization': `Aoser ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const createdFreelancer = await response.json();
        // console.log("in api error: ", createdFreelancer);


        if (!response.ok) {
            console.log("in api error: ", createdFreelancer.message);
            throw new Error(createdFreelancer.message || 'Failed to create freelancer');
        }

        return createdFreelancer.data;
    },


    /**
       * Fetch all service types
       * No authentication required for public data
       */
    getServiceTypeApi: async (): Promise<ServiceType[]> => {
        try {
            const response = await networkCheck.get('/worker/service-types');
            return response.data.data.serviceType || [];
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.log('Error fetching service types:', {
                    message: error.message,
                    status: error.response?.status,
                });
            }
            throw error;
        }
    },

    // Get jobs by service type ID
    getJobsByServiceType: async (serviceTypeId: string): Promise<SubService[]> => {
        const response = await networkCheck.get(`${API_BASE_URL}/worker/service-type-job/${serviceTypeId}`, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        return response.data.data.serviceTypeJob[0]?.jobs || [];
    },
    createReview: async (data: CreateReview, token: string) => {
        try {
            const res = await networkCheck.post(`${API_BASE_URL}/worker/review`, data, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Aoser ${token}`,
                },
            })
            return res.data.data
        } catch (error) {
            console.log("ERROR : ", error);
        }
    },

    getReviews: async (freelancerId: string): Promise<Review[]> => {
        console.log(freelancerId)
        try {
            // Construct query parameters
            const queryParams: Record<string, string> = {};

            // console.log(`${API_BASE_URL}/worker/reviews?reviewTo=${freelancerId}`);
            const response = await networkCheck.get(`${API_BASE_URL}/worker/reviews?reviewTo=${freelancerId}`, {
                params: queryParams,
                // headers: {
                //     'Content-Type': 'application/json',
                //     'Authorization': `Aoser ${token}`,
                // },
            });

            return response.data?.data || [];
        } catch (error) {
            console.log('Error fetching reviews:', error);
            throw error;
        }
    },

    createFavorite: async (data: Favorite, token: string) => {

        const res = await networkCheck.post(`${API_BASE_URL}/worker/favorite/`, data, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Aoser ${token}`,
            },
        });
        // console.log("CREATE respone in APIL = ", res.data.data);
        return res.data.data;
    },

    deleteFavorite: async (favoriteId: string, token: string) => {
        try {
            //   console.log("favoriteId to delete: ", favoriteId);
            const res = await networkCheck.delete(`${API_BASE_URL}/worker/favorite/${favoriteId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Aoser ${token}`,
                },
            });

            //   console.log ("DELETE response: ", res.status);

            // DELETE requests typically return nothing - this is correct
            return res.status; // or return res.status if you need it
        } catch (error) {
            console.log("Error deleting favorite: ", error);
            throw error;
        }
    }
    ,

    getAllFavorites: async (token: string): Promise<GetFavorite[]> => {


        try {
            const response = await networkCheck.get(`${API_BASE_URL}/worker/favorites`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Aoser ${token}`,
                },
            });

            return response.data.data || [];
        } catch (error) {
            console.log('Error fetching favorites:', error);
            throw error;
        }
    },
    /**
      * Fetch top freelancers
      * @param token - Authorization token
      */
    getTopFreelancers: async (token: string): Promise<Freelancer[]> => {
        try {
            const response = await networkCheck.get('/worker/top-freelancers', {
                headers: {
                    Authorization: `Aoser ${token}`,
                },
            });

            const payload = response.data?.data;
            if (!Array.isArray(payload)) {
                throw new Error('Invalid top freelancers response format');
            }

            return payload;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.log('Error fetching top freelancers:', {
                    message: error.message,
                    status: error.response?.status,
                });
            }
            throw error;
        }
    },
    getRecommandFreelancers: async (
        token: string,
        serviceTypeId: string,
        // exceptedIds: string,
        skip: number = 0,
        limit: number = 10
    ): Promise<Freelancer[]> => {
        try {
            const params = new URLSearchParams({
                skip: skip.toString(),
                limit: limit.toString(),
            });

            // Only add serviceType if it's not empty
            if (serviceTypeId && serviceTypeId.trim() !== '') {
                params.append('serviceType', serviceTypeId);
            }

            console.log('', params.toString())
            // console.log('exceptedIds', exceptedIds)
            const response = await networkCheck.get(`/worker/freelancers?${params.toString()}`, {
                headers: {
                    // Authorization: `Aoser ${token}`,
                },
            });

            console.log('Recommended Freelancers API response:', {
                status: response.status,
                data: response.data,
            });

            const payload = response.data?.data;
            if (!Array.isArray(payload)) {
                throw new Error('Invalid recommended freelancers response format');
            }

            return payload;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.log('Error fetching recommended freelancers:', {
                    message: error.message,
                    status: error.response?.status,
                    data: error.response?.data,
                });
            } else {
                console.log('Unexpected error:', error);
            }
            throw error;
        }

    },

    getPopularJob: async (token: string): Promise<JobpopularData[]> => {
        try {
            const response = await networkCheck.get(`${API_BASE_URL}/worker/popular-job`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Aoser ${token}`,
                },
            });
            return response.data.data || [];
        } catch (error) {
            console.log('Error fetching popular jobs:', error);
            throw error;
        }
    },

    getHiredFreelancers: async (token: string): Promise<Freelancer[]> => {
        try {
            const response = await networkCheck.get(`${API_BASE_URL}/worker/hired-freelancers`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Aoser ${token}`,
                },
            });
            // Safely access nested freelancers array with fallback
            return response?.data?.data?.[0]?.freelancers || [];
        } catch (error) {
            console.log('Error fetching hired freelancers:', error);
            throw error;
        }
    },
    getWallet: async (userId: string, token: string): Promise<WalletData> => {
        console.log(userId)
        try {
            // console.log(`${API_BASE_URL}/worker/reviews?reviewTo=${freelancerId}`);
            const response = await networkCheck.get(`${API_BASE_URL}/worker/freelancer-work-payment-report/${userId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Aoser ${token}`,
                },
            });
            const empty: WalletData = {
                earnings: {
                    LAK: {
                        currency: "LAK",
                        totalWorkCost: 0,
                        totalAppendWorkCost: 0,
                        totalAwaitingClaimWorkCost: 0,
                        totalAwaitingClaimAppendWorkCost: 0,
                        totalClaimCompleteWorkCost: 0,
                        totalClaimCompleteAppendWorkCost: 0,
                        totalRevenue: 0,
                        totalAwaitingClaimCost: 0,
                        totalClaimCompleteCost: 0,
                        totalProcessingWorkCost: 0,
                    },
                    USD: {
                        currency: "USD",
                        totalWorkCost: 0,
                        totalAppendWorkCost: 0,
                        totalAwaitingClaimWorkCost: 0,
                        totalAwaitingClaimAppendWorkCost: 0,
                        totalClaimCompleteWorkCost: 0,
                        totalClaimCompleteAppendWorkCost: 0,
                        totalRevenue: 0,
                        totalAwaitingClaimCost: 0,
                        totalClaimCompleteCost: 0,
                            totalProcessingWorkCost: 0,
                    },
                },
                totalWorks: 0,
                totalCompletedWork: 0,
                totalProcessingWork: 0,
                totalAwaitingClaimWork: 0,
                totalClaimCompleteWork: 0,
            };

            const payload = response.data?.data as Partial<WalletData> | undefined;
            if (!payload || typeof payload !== "object") return empty;

            return {
                ...empty,
                ...payload,
                earnings: {
                    ...empty.earnings,
                    ...(payload.earnings as any),
                    LAK: { ...empty.earnings.LAK, ...(payload.earnings as any)?.LAK },
                    USD: { ...empty.earnings.USD, ...(payload.earnings as any)?.USD },
                },
            };
        } catch (error) {
            console.log('Error fetching reviews:', error);
            throw error;
        }
    },
    
    report: async (data: ReportType, token: string) => {

        const res = await networkCheck.post(`${API_BASE_URL}/worker/problem-report`, data, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Aoser ${token}`,
            },
        });
        // console.log("CREATE respone in APIL = ", res.data.data);
        return res.data.data;
    },





};
