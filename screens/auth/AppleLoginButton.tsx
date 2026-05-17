import React, { useEffect, useState } from 'react';
import { StyleSheet, Alert } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';

// สมมติว่าคุณนำเข้า appleUrlMutation มาจาก hook ของคุณ
// import { useAppleLoginMutation
import { useAuth } from 'hooks/useAuth'

export default function AppleLoginButton({ appleUrlMutation }: any) {
    const {
        appleLogin,
        appleleloading,
        appleError,
    } = useAuth();

   
    const [isAvailable, setIsAvailable] = useState(false);

    useEffect(() => {
        AppleAuthentication.isAvailableAsync().then(setIsAvailable);
    }, []);

   
    if (!isAvailable) return null; // ← silently hides if not supported

    const handleAppleLogin = async () => {
        try {
            await appleLogin();


        } catch (err) {
            console.log('❌ Apple login failed:', err);
        }
    };

    return (
        <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={16} // ปรับให้โค้งมนเข้ากับ rounded-2xl
            style={styles.button}
            onPress={handleAppleLogin}
        />
    );
}

const styles = StyleSheet.create({
    button: {
        width: '100%', // ใช้ความกว้างเต็มเพื่อให้เข้ากับ Layout ของคุณ
        height: 52,    // ความสูงที่ใกล้เคียงกับ py-6
        marginBottom: 16, // แทนที่ mb-4
    },
});