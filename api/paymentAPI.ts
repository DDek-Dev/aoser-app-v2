import axios from 'axios';
import { Payment } from 'types/payment';
import networkCheck from './networkCheck';

const PAYMENT_API_BASE_URL = process.env.EXPO_PUBLIC_BCEL_URL;
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export const payment = {
    onepayQRcode: async (data: Payment , token: string) => {
        try {
             const res = await networkCheck.post(`${API_BASE_URL}/payment/bcel/onepay-qrcode`,data, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Aoser ${token}`,
            },
        });

  
        return res.data.data;
        } catch (error) {
            console.log("ERROR : ", error);
        }
       
    },
    becelPayment: async (data: Payment , token: string) => {
        const res = await networkCheck.post(`${PAYMENT_API_BASE_URL}/payment/payment-to-admin`, data, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Aoser ${token}`,
            },
        });
        
        return res.data.data;
    },
    checkOnepayqr: async (data: Payment , token: string) => {
        const res = await networkCheck.post(`${PAYMENT_API_BASE_URL}/onepayservice/checkonepayqr`, data, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Aoser ${token}`,
            },
        });
        
        return res.data.data;
    },
    getBillData: async (workId: string , token: string) => {
        console.log("workId in API: ", workId);
        const res = await networkCheck.get(`${API_BASE_URL}/payment/payment-history/workId/${workId}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Aoser ${token}`,
            },
        });
        
        return res.data.data;
    },
}

