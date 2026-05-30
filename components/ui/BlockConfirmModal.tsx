import React from 'react';
import { ActivityIndicator, Modal, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

type BlockConfirmModalProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
};

export default function BlockConfirmModal({
  visible,
  onClose,
  onConfirm,
  loading = false,
  title,
  message,
  confirmLabel,
}: BlockConfirmModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      onDismiss={onClose}
    >
      <TouchableWithoutFeedback onPress={loading ? undefined : onClose}>
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <TouchableWithoutFeedback>
            <View className="bg-white rounded-3xl p-6 w-full max-w-sm">
              <View className="items-center mb-4">
                <View className="bg-red-100 rounded-full p-4">
                  <Ionicons name="ban-outline" size={32} color="#EF4444" />
                </View>
              </View>

              <Text className="text-heading font-bold text-center text-text mb-2">
                {title ?? t('report.block_title', 'Block')}
              </Text>

              <Text className="text-body text-center text-textSecondary mb-6">
                {message ?? t('report.block_message', 'If you confirm, this content will be hidden for you.')}
              </Text>

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
                      {confirmLabel ?? t('common.confirm', 'Confirm')}
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
                    {t('report.cancel', 'Cancel')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

