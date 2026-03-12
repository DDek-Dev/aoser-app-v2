

import { UreadNotification } from 'types';
import networkCheck from './networkCheck';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;


export const notificationApi = {

    addUserNotificationToken: async (token: string, notificationToken: string) => {
        try {
            const response = await networkCheck.put(
                `${API_BASE_URL}/notification/fcm-token`,
                {
                    notificationToken: notificationToken,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Aoser ${token}`,
                    }
                }
            );

            return response.data.data || [];
        } catch (error) {
            console.log('Error adding user notification token:', error);
            throw error;
        }
    },
    getAllnotifications: async (token: string): Promise<Notification[]> => {
        try {
            const response = await networkCheck.get(`${API_BASE_URL}/notification/notifications`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Aoser ${token}`,
                },
            });
            return response.data.data || [];
        } catch (error) {
            console.log('Error fetching notifications:', error);
            throw error;
        }
    },
    readNotification: async (token: string, notificationId: string): Promise<Notification[]> => {

        try {
            const response = await networkCheck.put(`${API_BASE_URL}/notification/read/${notificationId}`, {}, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Aoser ${token}`,
                },
            });
            return response.data.data || [];
        } catch (error) {
            console.log('Error reading notification:', error);
            throw error;
        }
    },
    unreadCount: async (token: string): Promise<UreadNotification> => {


        try {
            const response = await networkCheck.get(`${API_BASE_URL}/notification/notification-unread-count`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Aoser ${token}`,
                },
            });
            return response.data.data || [];
        } catch (error) {
            console.log('Error reading notification:', error);
            throw error;
        }
    },
    markNotificationsAsReadAPI: async (token: string): Promise<UreadNotification> => {
    try {
        const response = await networkCheck.put(
            `${API_BASE_URL}/notification/notification-viewed?viewed=true`, 
            { isViewed: true }, 
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Aoser ${token}`,
                },
            }
        );
        return response.data.data || [];
    } catch (error) {
        console.log('Error reading notification:', error);
        throw error;
    }
},

};