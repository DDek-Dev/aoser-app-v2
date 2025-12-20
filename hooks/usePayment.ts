import { useMutation } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { payment } from "api/paymentAPI";
import { Payment } from "types/payment";


export const useGenerateOnepayQRcode = () => {
    const { tokens } = useAuth();
    return useMutation({
        mutationFn: ({ data }: { data: Payment; }) => {
            
            return payment.onepayQRcode(data, tokens?.accessToken || '');
        }
    });
};
export const usePayment = () => {
    const { tokens } = useAuth();
    return useMutation({
        mutationFn: ({ data }: { data: Payment; }) => {
            return payment.becelPayment(data, tokens?.accessToken || '');
        }
    });
};
export const useCheckOnepayqr = () => {
    const { tokens } = useAuth();
    return useMutation({
        mutationFn: ({ data }: { data: Payment; }) => {
            return payment.checkOnepayqr(data, tokens?.accessToken || '');
        }
    });
};

export const useGetBillData = (workId:string)=>{
    const {tokens} = useAuth();
    return useMutation({
        mutationFn: (workId:string ) => {
            return payment.getBillData(workId, tokens?.accessToken || '');
        }
    });
}