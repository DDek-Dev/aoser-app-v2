import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';

interface Props {
    visible: boolean; // Add visible prop
    onRetry: () => Promise<void>;
}

export const NetworkErrorOverlay = ({ visible, onRetry }: Props) => {
    const [isRetrying, setIsRetrying] = useState(false);
    const { t } = useTranslation();

    const handleRetry = async () => {
        setIsRetrying(true);
        try {
            await onRetry();
        } catch (error) {
            // Logic for failure is handled by the state in App.tsx
        } finally {
            setIsRetrying(false);
        }
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
        >
            {/* Dark semi-transparent background */}
            <View className="flex-1 bg-black/60 items-center justify-center px-6">
                
                {/* White Popup Card */}
                <View className="bg-white w-full p-8 rounded-[32px] items-center shadow-2xl">
                    
                    {/* Warning Icon */}
                    <View className="w-20 h-20 bg-red-100 rounded-full items-center justify-center mb-6">
                        <Text className="text-red-500 text-4xl font-bold">!</Text>
                    </View>

                    <Text className="text-2xl font-bold text-gray-800 mb-2 text-center">
                        {t('network_error.title')}
                    </Text>

                    <Text className="text-gray-500 text-center mb-8 text-base leading-6">
                        {t('network_error.default_message')}
                    </Text>

                    {/* Retry Button */}
                    <TouchableOpacity
                        onPress={handleRetry}
                        disabled={isRetrying}
                        className={`w-full h-14 rounded-2xl flex-row items-center justify-center ${
                            isRetrying ? 'bg-blue-300' : 'bg-blue-600'
                        }`}
                    >
                        {isRetrying && <ActivityIndicator color="white" className="mr-3" />}
                        <Text className="text-white font-semibold text-lg">
                            {isRetrying ? t('network_error.retrying_button') : t('network_error.retry_button')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};