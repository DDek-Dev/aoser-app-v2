import React from 'react';
import { View, Text, Switch } from 'react-native';

interface ToggleButtonProps {
  label: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
  description?: string;
}

const ToggleButton: React.FC<ToggleButtonProps> = ({ label, value, onValueChange, description }) => {
  return (
    <View className="flex-row justify-between items-center py-4  px-4 bg-surface">
      <View className="flex-1 pr-2">
        <Text className="text-text text-body font-semibold">{label}</Text>
        {description ? (
          <Text className="text-textSecondary text-body mt-1">{description}</Text>
        ) : null}
      </View>
      <Switch
        trackColor={{ false: '#d1d5db', true: '#3B82F6' }}
        thumbColor={value ? '#FFFFFF' : '#f4f3f4'}
        onValueChange={onValueChange}
        value={value}
      />
    </View>
  );
};

export default ToggleButton;
