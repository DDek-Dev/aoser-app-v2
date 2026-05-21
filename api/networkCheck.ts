import axios from "axios";
import { EventEmitter } from "eventemitter3";


interface ApiEvents {
  'network_error': () => void;
  // ທ່ານສາມາດເພີ່ມ event ອື່ນໆໄດ້ໃນອະນາຄົດ ເຊັ່ນ 'auth_error'
  [key: string | symbol]: any;

}

export const apiEvents = new EventEmitter<ApiEvents>();
const EXPO_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const networkCheck = axios.create({ baseURL: EXPO_URL , timeout: 10000 });

networkCheck.interceptors.response.use(
    response => response,
    error => {
        if (!error.response || error.code === 'ECONNABORTED') {
            apiEvents.emit('network_error');
        }
        return Promise.reject(error);
    }
);
export default networkCheck;