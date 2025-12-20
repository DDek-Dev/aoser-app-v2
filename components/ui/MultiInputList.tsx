import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TextInput as RNTextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

type Props = {
  title: string;
  placeholder?: string;
  values: string[];
  required?: boolean;
  isValidate?: string;
  inputClassName?: string;
  onChange: (text: string, index: number) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
};

const MultiInputList: React.FC<Props> = ({
  title,
  placeholder,
  values,
  required,
  isValidate,
  inputClassName,
  onChange,
  onAdd,
  onRemove,
}) => {
  const inputRefs = useRef<RNTextInput[]>([]);
  const { t } = useTranslation();
  // Ensure at least one input exists
  useEffect(() => {
    if (values.length === 0) {
      onAdd();
    }
  }, []);

  // Auto-focus the last input if it's empty
  useEffect(() => {
    const lastIndex = values.length - 1;
    if (values[lastIndex] === '') {
      setTimeout(() => {
        inputRefs.current[lastIndex]?.focus();
      }, 50);
    }
  }, [values.length]);

  return (
    <View className="mb-4">
      <Text className="text-body font-bold text-text mb-2">
        {title} {required && <Text className="text-error">*</Text>}
      </Text>

      {values.map((value, index) => (
        <View key={index} className="relative ">
          <TextInput
            // ref={(el) => {
            //   if (el) inputRefs.current[index] = el;
            // }}
            value={value}
            onChangeText={(text) => onChange(text, index)}
            placeholder={placeholder}
            className={`bg-white border ${inputClassName} rounded-xl px-4 py-4 text-body text-text pr-10 `}
            placeholderTextColor="#6B7280"
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => {
              if (value.trim() !== '') onAdd();
            }}
          />
          {index > 0 && (
            <TouchableOpacity
              onPress={() => onRemove(index)}
              className="absolute right-4 top-4"
            >
              <Ionicons name="close" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
          <Text className="text-caption text-error mt-1">{isValidate}</Text>
        </View>
      ))}

      {values.length > 0 && values[values.length - 1].trim() !== '' && (
        <TouchableOpacity
          onPress={onAdd}
          className="bg-white border border-primary rounded-xl px-4 py-2 w-1/3 items-center mt-2"
        >
          <Text className="text-primary text-caption font-semibold">+ {t('kyc.step2.add_more')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default MultiInputList;
