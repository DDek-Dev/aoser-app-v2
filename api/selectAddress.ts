import { AddressInfo } from "types";
import axios from 'axios';



const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;


export const selectAddressApi = {
    getSelectAddress: async (): Promise<AddressInfo[]> => {
        try {
        

            const response = await axios.get(
                `${API_BASE_URL}/worker/country-locations/LA`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        // Add any other required headers
                    },
                }
            );


            return response.data.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
            
                throw new Error(
                    error.response?.data?.message || 
                    'Failed to fetch address data'
                );
            }
            throw new Error('Network error occurred');
        }
    },
}