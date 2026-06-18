import React from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface CompletePopupProps {
  visible: boolean;
  onClose: () => void;
  onRegister?: () => void;
  title?: string;
  desc?: string;
  action?: string;
}

export function CompletePopup({ visible, onClose, onRegister , title,desc,action }: CompletePopupProps) {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Backdrop - click outside to close */}
      <Pressable
        className="flex-1 bg-black/50 items-center justify-center px-6"
        onPress={onClose}
      >
        {/* Card - stop propagation so inner taps don't close */}
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="bg-surface rounded-2xl w-full max-w-sm p-6 relative"
        >
          {/* Close icon */}
          <TouchableOpacity
            onPress={onClose}
            className="absolute top-3 right-3 p-1 z-10"
            hitSlop={10}
          >
            <Ionicons name="close" size={22} color="#6B7280" />
          </TouchableOpacity>

          {/* Icon */}
          <View className="items-center mb-4 mt-2">
            <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center">
              <View className="flex-row">
                <Ionicons name="checkmark" size={26} color="#3B82F6" style={{ marginRight: -6, zIndex: 1 }} />
              </View>
            </View>
          </View>

          {/* Title */}
          <Text className="text-heading text-text text-center mb-2">
            {title}
          </Text>

          {/* Description */}
          <Text className="text-body text-textSecondary text-center mb-6">
            {desc}
          </Text>

          {/* Register button */}
          <TouchableOpacity
            onPress={onClose}
            className="bg-primary rounded-xl py-3 items-center"
            activeOpacity={0.8}
          >
            <Text className="text-body text-surface font-semibold">
              {action}
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}