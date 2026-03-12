

import { Chat, ChatRoom } from 'types';
import networkCheck from './networkCheck';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;


export const chatApi = {
    getChat_users: async (token: string): Promise<Chat[]> => {
        try {
            const response = await networkCheck.get(`${API_BASE_URL}/chat/chat-users`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Aoser ${token}`,
                },
            });
            return response.data.data || [];
        } catch (error) {
            console.log('Error fetching chat users:', error);
            throw error;
        }
    },
    getChatroom: async (token: string, roomId: string, skip = 0, limit = 20): Promise<ChatRoom> => {
        const url = `${API_BASE_URL}/chat/user-conversations/${roomId}?skip=${skip}&limit=${limit}`;
        try {
            const response = await networkCheck.get(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Aoser ${token}`,
                },
            });
            return response.data.data || [];
        } catch (error: any) {
            // Axios error handling
            if (error.response) {
                console.log('Error fetching chat room: status=', error.response.status, 'data=', error.response.data);
            } else if (error.request) {
                console.log('Error fetching chat room: no response, request sent', error.message);
            } else {
                console.log('Error fetching chat room:', error.message);
            }
            throw error;
        }
    },
    getUnreadChatcount: async (token: string): Promise<any> => {
        const url = `${API_BASE_URL}/chat/user-chat-unread-count`;
        try {
            const response = await networkCheck.get(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Aoser ${token}`,
                },
            });

            // console.log("API Response CHAT COUNT: ", response.data.data); 
            return response.data.data || [];
        } catch (error: any) {
            // Axios error handling
            if (error.response) {
                console.log('Error fetching chat room: status=', error.response.status, 'data=', error.response.data);
            } else if (error.request) {
                console.log('Error fetching chat room: no response, request sent', error.message);
            } else {
                console.log('Error fetching chat room:', error.message);
            }
            throw error;
        }
    },


};