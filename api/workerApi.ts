// workerApi.ts

import { Freelancer, UserProfile } from "types/profile";


import { CreateReview,  ServiceType, SubService, Favorite, Review, GetFavorite, JobpopularData } from "types";
import axios from "axios";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;


console.log("API_BASE_URL: ", API_BASE_URL);
export const workerApi = {

    // get my profile
    getMyProfile: async (token: string): Promise<UserProfile> => {
        try {

            const response = await axios.get(`${API_BASE_URL}/worker/freelancer-profile`, {
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
    // get All freelancers

    getAllfreelancers: async (token: string): Promise<UserProfile[]> => {
        try {

            const response = await fetch(`${API_BASE_URL}/worker/freelancers`, {
                method: 'GET',
                headers: {
                    'Authorization': `Aoser ${token}`, // I fixed "Aoser" -> "Bearer"
                },
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch freelancers');
            }

            return data.data;
        } catch (error) {
            console.log('Error fetching freelancers:', error);
            throw error;
        }
    },


    // create freelancer
    createFreelancer: async (data: UserProfile, token: string): Promise<UserProfile> => {
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


    // Get all service types
    getServiceTypeApi: async (): Promise<ServiceType[] | undefined> => {
        const response = await axios.get(`${API_BASE_URL}/worker/service-types`, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        // console.log(response.data.data.serviceType);
        return response.data.data.serviceType;
    },

    // Get jobs by service type ID
    getJobsByServiceType: async (serviceTypeId: string): Promise<SubService[]> => {
        const response = await axios.get(`${API_BASE_URL}/worker/service-type-job/${serviceTypeId}`, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        return response.data.data.serviceTypeJob[0]?.jobs || [];
    },
    createReview: async (data: CreateReview, token: string) => {
        try {
            const res = await axios.post(`${API_BASE_URL}/worker/review`, data, {
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

    getReviews: async (freelancerId: string, token: string): Promise<Review[]> => {
        try {
            // Construct query parameters
            const queryParams: Record<string, string> = {};

            // console.log(`${API_BASE_URL}/worker/reviews?reviewTo=${freelancerId}`);
            const response = await axios.get(`${API_BASE_URL}/worker/reviews?reviewTo=${freelancerId}`, {
                params: queryParams,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Aoser ${token}`,
                },
            });

            return response.data?.data || [];
        } catch (error) {
            console.log('Error fetching reviews:', error);
            throw error;
        }
    },

    createFavorite: async (data: Favorite, token: string) => {
        const res = await axios.post(`${API_BASE_URL}/worker/favorite/`, data, {
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
      const res = await axios.delete(`${API_BASE_URL}/worker/favorite/${favoriteId}`, {
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
            const response = await axios.get(`${API_BASE_URL}/worker/favorites`, {
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

    getTopFreelancers:async (token: string): Promise<Freelancer[]> => {
        try {
            const response = await axios.get(`${API_BASE_URL}/worker/top-freelancers`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Aoser ${token}`,
                },
            });
            return response.data.data || [];
        } catch (error) {
            console.log('Error fetching top freelancers:', error);
            throw error;
        }
    },

    getRecommandFreelancers: async (token: string, queryParams: string, skip: number = 0, limit: number = 10): Promise<Freelancer[]> => {
    try {
        const response = await axios.get(
            `${API_BASE_URL}/worker/freelancers?skip=${skip}&limit=${limit}&serviceType=${queryParams}&sortBy=recommendStar`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Aoser ${token}`,
                },
            }
        );

        return response.data.data || [];
    } catch (error) {
        console.log('Error fetching recommend freelancers:', error);
        throw error;
    }
},
    // getRecommandFreelancers: async (token: string , queryParams: string): Promise<Freelancer[]> => {
    //     try {
    //         // const response = await axios.get(`${API_BASE_URL}/worker/recommend-freelancers`, {
    //         const response = await axios.get(`${API_BASE_URL}/worker/freelancers?skip=0&serviceType=${queryParams}&sortBy=recommendStar`, {
    //             headers: {
    //                 'Content-Type': 'application/json',
    //                 'Authorization': `Aoser ${token}`,
    //             },
    //         });

    //         return response.data.data || [];
    //     } catch (error) {
    //         console.log('Error fetching recommand freelancers:', error);
    //         throw error;
    //     }
    // },
    getPopularJob:async (token: string): Promise<JobpopularData[]> => {
        try {
            const response = await axios.get(`${API_BASE_URL}/worker/popular-job`, {
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

    getHiredFreelancers:async (token: string): Promise<Freelancer[]> => {
        try {
            const response = await axios.get(`${API_BASE_URL}/worker/hired-freelancers`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Aoser ${token}`,
                },
            });
            return response.data.data[0].freelancers || [];
        } catch (error) {
            console.log('Error fetching hired freelancers:', error);
            throw error;
        }
    },
};
