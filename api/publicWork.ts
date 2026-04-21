// api/publiceWorkApi.ts
import axios from 'axios';
import { AppendWork, BookingFormData, Job, SubWorkDetail, WorkApplies, WorkById } from 'types';
import networkCheck from './networkCheck';


const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

let myWorksPaginationSupported: boolean | null = null;
let myWorksCache: Job[] | null = null;
let myWorksCacheToken: string | null = null;

export const publiceWorkApi = {
    getPublicWork: async (token: string): Promise<Job[]> => {



        try {
            const res = await networkCheck.get(`${API_BASE_URL}/worker/works`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Aoser ${token}`,
                },
            });
            return res.data.data;

        } catch (error) {
            console.log("ERROR : ", error);
            throw error;
        }

    },
    getAllMyWork: async (token: string) => {

        try {
            const res = await networkCheck.get(`${API_BASE_URL}/worker/my-works`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Aoser ${token}`,
                },
            });
            return res.data.data;

        } catch (error) {
            console.log("ERROR : ", error);
            throw error;
        }
    },

    getMyWorkPage: async (token: string, skip: number, limit: number): Promise<Job[]> => {
        if (myWorksPaginationSupported === false && myWorksCacheToken === token && Array.isArray(myWorksCache)) {
            return myWorksCache.slice(skip, skip + limit);
        }

        try {
            const res = await networkCheck.get(
                `${API_BASE_URL}/worker/my-works?skip=${skip}&limit=${limit}`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Aoser ${token}`,
                    },
                }
            );
            const items: Job[] = res.data.data || [];

            // If backend ignores skip/limit and returns a big list, fallback to cached slicing.
            if (items.length > limit) {
                myWorksPaginationSupported = false;
                myWorksCache = items;
                myWorksCacheToken = token;
                return items.slice(skip, skip + limit);
            }

            myWorksPaginationSupported = true;
            return items;
        } catch (error) {
            // Fallback: fetch all once, then slice client-side.
            myWorksPaginationSupported = false;

            if (!myWorksCache || myWorksCacheToken !== token) {
                const res = await networkCheck.get(`${API_BASE_URL}/worker/my-works`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Aoser ${token}`,
                    },
                });
                myWorksCache = res.data.data || [];
                myWorksCacheToken = token;
            }

            return (myWorksCache || []).slice(skip, skip + limit);
        }
    },

    // Add these methods if you need them
    getPublicWorkById: async (id: string): Promise<WorkById> => {
        try {
            const res = await networkCheck.get(`${API_BASE_URL}/worker/work/${id}`, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            return res.data.data;

        } catch (error) {
            console.log("ERROR : ", error);
            throw error;
        }

    },
    updateWorkById: async (id: string, data: any, token: string): Promise<Job> => {

        // console.log("API called with id:", id, "and data:", JSON.stringify(data, null, 2));  

        try {

            const res = await networkCheck.put(`${API_BASE_URL}/worker/work/${id}`, data, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Aoser ${token}`,
                },
            });


            return res.data.data.work;

        } catch (error) {
            console.log("ERROR : ", error);
            throw error;
        }
    },
    updateAppendWorkById: async (id: string, data: any, token: string): Promise<Job> => {


        try {

            const res = await networkCheck.put(`${API_BASE_URL}/worker/freelancer-append-sub-work/${id}`, data, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Aoser ${token}`,
                },
            });

      
            return res.data.data.work;

        } catch (error) {
            console.log("ERROR : ", error);
            throw error;
        }
    },
    appendOwnerWork: async (id: string, data: any, token: string): Promise<Job> => {
        try {

            const res = await networkCheck.post(`${API_BASE_URL}/worker/work-appending/${id}`, data, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Aoser ${token}`,
                },
            });


            return res.data.data.work;

        } catch (error) {
            console.log("ERROR : ", error);
            throw error;
        }
    },

    acceptAppendWork: async (id: string, data: any, token: string): Promise<AppendWork> => {
      
        try {

            const res = await networkCheck.put(`${API_BASE_URL}/worker/freelancer-except-append-work/${id}`, data, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Aoser ${token}`,
                },
            });


            return res.data.data.work;

        } catch (error) {
            console.log("ERROR : ", error);
            throw error;
        }
    },
    // API - Add status parameter
    updateSubworkStatus: async (id: string, data: SubWorkDetail[], token: string): Promise<SubWorkDetail[]> => {

        try {
            const res = await networkCheck.put(`${API_BASE_URL}/worker/freelancer-work/${id}`,
                data, 
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Aoser ${token}`,
                    },
                }
            );

            return res.data.data;

        } catch (error) {
            console.log("ERROR : ", error);
            throw error;
        }
    },
    acceptWork: async (id: string, data: any, token: string) => {
        try {
            const res = await networkCheck.put(
                `${API_BASE_URL}/worker/freelancer-work-exception/${id}`, data, {
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
    submitWork: async (id: string, token: string): Promise<SubWorkDetail[]> => {

        try {
            const res = await networkCheck.put(
                `${API_BASE_URL}/worker/freelancer-work-submit/${id}`,
                {},
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Aoser ${token}`,
                    },
                }
            );


            return res.data.data;

        } catch (error) {
            console.log("ERROR : ", error);
            throw error;
        }
    },

    completetWork: async (id: string, data: any, token: string) => {
        try {
            const res = await networkCheck.put(
                `${API_BASE_URL}/worker/work-confirm-complete/${id}`, data, {
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


    createPublicWork: async (data: BookingFormData, token: string) => {
        // Transform data to match backend format with safety checks
        // const requestData = {
        //     workTitle: data.workTitle,
        //     description: data.description,
        //     budget: data.budget || 0, // Ensure budget is never null
        //     kindOfWork: data.kindOfWork,
        //     deadLine: data.deadLine ? new Date(data.deadLine) : undefined,
        //     startDate: data.startDate ? new Date(data.startDate) : undefined,
        //     subWorkDetails: data.subWorkDetails || [], // Ensure array exists
        //     currency: data.currency,
        //     budgetType: data.budgetType,
        //     serviceType: data.serviceType,
        //     jobs: data.jobs || [],
        //     exampleWork: undefined,
        //     assignedTo: data.assignedTo,
        //     address: {
        //         country: data?.address?.country || "Laos",
        //         province: data?.address?.province || '',
        //         district: data?.address?.district || '',
        //         village: data?.address?.village || '',
        //     }
        // };

       

        // Remove undefined values to avoid sending empty fields
        // const cleanData = Object.fromEntries(
        //     Object.entries(requestData).filter(([_, value]) => value !== undefined)
        // );

        console.log("DATA in API", JSON.stringify(data, null, 2))

        const res = await networkCheck.post(`${API_BASE_URL}/worker/work`, data, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Aoser ${token}`,
            },
        });

        return res.data.data;
    },

    deletePublicWork: async (id: string) => {
        const res = await networkCheck.delete(`${API_BASE_URL}/worker/work/${id}`, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return res.data.data;
    },

    freelancerApplyWork: async (workId: string, token: string) => {

        const res = await networkCheck.post(`${API_BASE_URL}/worker/freelancer-work-apply/${workId}`, {}, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Aoser ${token}`,
            },
        });
        return res.data.data;
    },
    getAllApplyWork: async (token: string): Promise<WorkApplies[]> => {

        try {

            const res = await networkCheck.get(`${API_BASE_URL}/worker/freelancer-work-applies`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Aoser ${token}`,
                },
            });



            return res.data.data;
        } catch (error) {
            console.log("ERROR : ", error);
            throw error;
        }
    },
    getAllsingleCustomerWork: async (token: string, customerId: string, workStatus: string): Promise<Job[]> => {
        try {
            const res = await networkCheck.get(
                `${API_BASE_URL}/worker/freelancer-works/customerId/${customerId}?workStatus=${workStatus}`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Aoser ${token}`,
                    },
                }
            );
            return res.data.data;
        } catch (error) {
            console.log("ERROR getAllsingleCustomerWork: ", error);
            throw error;
        }

    },
    freeLRequestUpdateW: async (id: string, data: any, token: string): Promise<any> => {

        console.log("API called with id:", id, "and data:", data);
        try {
            const res = await networkCheck.put(`${API_BASE_URL}/worker/freelancer-request-update-work/${id}`, data , {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Aoser ${token}`,
                },
            });
            return res.data.data;
        } catch (error) {
            console.log("ERROR : ", error);
            throw error;
        }
    }


};
