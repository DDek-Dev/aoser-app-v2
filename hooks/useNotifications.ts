import { useMutation, useQuery } from "@tanstack/react-query";
import { notificationApi } from "api/notificationApi";
import { useAuth } from "./useAuth";
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

import { Alert, PermissionsAndroid, Platform, } from 'react-native';
import { use, useEffect, useRef, useState } from "react";
import Constants from 'expo-constants';

export interface PushNotificationState {
    notification?: Notifications.Notification
    expoPushToken?: Notifications.ExpoPushToken
}

export const usePushNotifications = (): PushNotificationState => {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });

    const [expoPushToken, setExpoPushToken] = useState<Notifications.ExpoPushToken | undefined>();
    const [notification, setNotification] = useState<Notifications.Notification | undefined>();

    const notificationListener = useRef<Notifications.Subscription>(undefined);
    const responseListener = useRef<Notifications.Subscription>(undefined);
    const { tokens } = useAuth();
    async function registerForPushNotificationsAsync() {
        let token;

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        if (Device.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                Alert.alert('Error', 'Failed to get push token for push notification!');
                return;
            }

            token = await Notifications.getExpoPushTokenAsync({
                projectId: Constants.expoConfig?.extra?.eas?.projectId,
            });
            return token;
        } else {
            Alert.alert('Error', 'Must use physical device for Push Notifications');
        }
    }

    useEffect(() => {
        console.log('🔔 Setting up notifications...');

        registerForPushNotificationsAsync()
            .then(token => {
                if (token) {
                    setExpoPushToken(token);
                    console.log('✅ Token set:', token);
                    // TODO: Send token to your backend
                    // sendTokenToBackend(token);
                    try {

                        notificationApi.addUserNotificationToken(tokens?.accessToken|| '', token.data).then(() => {
                            console.log('✅ Notification token sent to backend');
                        }).catch((error) => {
                            console.log('❌ Error sending token to backend:', error);
                        });
                    } catch (e) {
                        console.log('❌ Exception sending token to backend:', e);
                    }
                }
            })
            .catch((error: any) => {
                console.log('❌ Registration error:', error);
            });

        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            console.log('📬 Notification received:', notification);
            setNotification(notification);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('👆 Notification tapped:', response);
        });

        return () => {
            // Proper cleanup using the remove() method on subscriptions
            if (notificationListener.current) {
                notificationListener.current.remove();
            }
            if (responseListener.current) {
                responseListener.current.remove();
            }
        };
    }, [tokens?.accessToken]);

    return {
        expoPushToken,
        notification,

    };
};


export const useNotifications = () => {
    const { tokens } = useAuth();
    return useQuery({
        queryKey: ['notifications'],
        queryFn: () => notificationApi.getAllnotifications(tokens?.accessToken || ''),
        enabled: !!tokens?.accessToken,
        staleTime: 10000 * 60,
    });
}
export const useReadNotification = () => {
    const { tokens } = useAuth();

    return useMutation({
        mutationFn: (notificationId: string) => notificationApi.readNotification(tokens?.accessToken || '', notificationId),

    })
}



