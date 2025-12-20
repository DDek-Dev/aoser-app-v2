import { useQuery } from "@tanstack/react-query";
import { selectAddressApi } from "api/selectAddress";
import { AddressInfo } from "types";

export const useSelectAddress = () => {
    return useQuery<AddressInfo[]>({
        queryKey: ['selectAddress'],
        queryFn: selectAddressApi.getSelectAddress, 
        });
        
}