import React from 'react';
import { View, Text, Modal, TouchableOpacity, ActivityIndicator, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface LogoutModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

const LogoutModal: React.FC<LogoutModalProps> = ({ visible, onClose, onConfirm, loading = false }) => {
  const { t } = useTranslation();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      onDismiss={onClose}
    >

        <TouchableWithoutFeedback onPress={onClose}>

      <View className="flex-1 justify-center items-center bg-black/50 px-6" >
        <View className="bg-white rounded-3xl p-6 w-full max-w-sm">
          {/* Icon */}
          <View className="items-center mb-4">
            <View className="bg-red-100 rounded-full p-4">
              <Ionicons name="log-out-outline" size={32} color="#EF4444" />
            </View>
          </View>

          {/* Title */}
          <Text className="text-heading font-bold text-center text-text mb-2">
            {t('profile.logout')}
          </Text>

          {/* Message */}
          <Text className="text-body text-center text-textSecondary mb-6">
            {t('profile.logout_confirmation')}
          </Text>

          {/* Buttons */}
          <View className="space-y-3">
            <TouchableOpacity
              onPress={onConfirm}
              disabled={loading}
              className="bg-error py-4 rounded-xl mb-2 items-center"
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white font-semibold text-body">
                  {t('profile.logout')}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              disabled={loading}
              className="bg-gray-100 py-4 rounded-xl items-center"
              activeOpacity={0.8}
            >
              <Text className="text-text font-semibold text-body">
                {t('profile.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
        </TouchableWithoutFeedback>
    </Modal>
  );
};

export default LogoutModal;