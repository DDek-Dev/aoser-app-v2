import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Modal, Text, TouchableOpacity, View } from 'react-native';

type NetworkErrorPopupProps = {
  visible: boolean;
  title: string;
  message: string;
  retryLabel: string;
  onRetry: () => void | Promise<void>;
  isRetrying?: boolean;
};

const NetworkErrorPopup = ({
  visible,
  title,
  message,
  retryLabel,
  onRetry,
  isRetrying = false,
}: NetworkErrorPopupProps) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <View className="flex-1 bg-black/50 justify-center px-6">
        <View className="bg-surface rounded-2xl p-5">
          <View className="items-center mb-4">
            <View className="bg-blue-50 rounded-full p-3 mb-2">
              <Ionicons name="cloud-offline-outline" size={28} color="#3B82F6" />
            </View>
            <Text className="text-subheading font-semibold text-text text-center">{title}</Text>
            <Text className="text-body text-textSecondary text-center mt-1">{message}</Text>
          </View>

          <TouchableOpacity
            onPress={onRetry}
            disabled={isRetrying}
            className={`rounded-xl py-3 items-center ${isRetrying ? 'bg-blue-300' : 'bg-primary'}`}
          >
            {isRetrying ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-body">{retryLabel}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default NetworkErrorPopup;
