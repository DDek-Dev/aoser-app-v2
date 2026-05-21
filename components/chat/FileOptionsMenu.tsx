import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface FileOption {
  label: string;
  icon: string;
  color: string;
  action: () => void;
}

interface FileOptionsMenuProps {
  visible: boolean;
  keyboardHeight: number;
  onPhotoSelection: () => void;
  onFileSelection: () => void;
  onProjectSelection: () => void;
  onLocationSelection: () => void;
  onClose: () => void;
}

const FileOptionsMenu: React.FC<FileOptionsMenuProps> = ({
  visible,
  keyboardHeight,
  onPhotoSelection,
  onFileSelection,
  onProjectSelection,
  onLocationSelection,
  onClose
}) => {

  const {t} = useTranslation();
  const fileOptions: FileOption[] = [
    { label: t('chat.chatroom.project'), icon: 'list', color: '#3B82F6', action: onProjectSelection },
    { label: t('chat.chatroom.media'), icon: 'images', color: '#10B981', action: onPhotoSelection },
    { label: t('chat.chatroom.file'), icon: 'document-text', color: '#F59E0B', action: onFileSelection },
    { label: t('chat.chatroom.location'), icon: 'location', color: '#EF4444', action: onLocationSelection }
  ];

  if (!visible) return null;

  return (
    <View className='m-3'>
      <View
        className="absolute w-full bg-surface rounded-2xl shadow-2xl p-4 z-50 border border-border"
        style={{
          bottom: 80 + (keyboardHeight > 0 ? keyboardHeight : 0),
          zIndex: 50,
          elevation: 50,
        }}
      >
        <View className="flex-row flex-wrap justify-between">
          {fileOptions.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              className="w-16 h-16 rounded-xl items-center justify-center mb-2 border border-gray-200"
              style={{ backgroundColor: `${item.color}15` }}
              onPress={() => {
                try {
                  item.action();
                } catch (e) {
                  console.warn('File option action error', e);
                }
                onClose();
                console.log(`Selected: ${item.label}`);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name={item.icon as any} size={24} color={item.color} />
              <Text className="text-xs mt-1 text-center" style={{ color: item.color }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

export default FileOptionsMenu;
