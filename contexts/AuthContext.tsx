// contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect } from 'react';
// import * as Notifications from 'expo-notifications';
import { useAuth } from 'hooks/useAuth';

const AuthContext = createContext<ReturnType<typeof useAuth> | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const auth = useAuth();
    // const user = auth.user; // adjust based on your useAuth return shape

    // useEffect(() => {
    //     const updateAppBadge = async () => {
    //         try {
    //             const { status } = await Notifications.getPermissionsAsync();
    //             if (status !== 'granted') {
    //                 await Notifications.requestPermissionsAsync();
    //             }

    //             const isCompleteKYC = user?.kycInfoStatus ?? true; // default true if unknown
    //             await Notifications.setBadgeCountAsync(isCompleteKYC ? 0 : 1);
    //         } catch (error) {
    //             console.log('Error updating app badge:', error);
    //         }
    //     };

    //     if (user) {
    //         updateAppBadge();
    //     } else {
    //         // No user logged in - clear badge
    //         Notifications.setBadgeCountAsync(0).catch(() => {});
    //     }
    // }, [user?.kycInfoStatus, user]);

    return (
        <AuthContext.Provider value={auth}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuthContext must be used within AuthProvider');
    }
    return context;
};