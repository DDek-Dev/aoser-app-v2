

import { forwardRef, useState } from 'react';
import { View, Text, TextInput, TextInputProps, Platform } from 'react-native';

type Props = {
  label?: string;
  inputClassName?: string;
  placeholder?: string;
  value?: string;
  required?: boolean;
  isValidate?: string;
  onChangeText?: (text: string) => void;
  isDate?: boolean;
  isTime?: boolean;
} & Omit<TextInputProps, 'ref'>;

const FormInput = forwardRef<TextInput, Props>(
  ({
    label,
    placeholder = '',
    required,
    inputClassName,
    value,
    isValidate,
    onChangeText,
    isDate = false,
    isTime = false,
    ...rest
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    const formatDateInput = (text: string): string => {
      // Only allow numbers and /
      const cleaned = text.replace(/[^\d/]/g, '');

      // Don't format if user is actively typing
      return cleaned.substring(0, 10); // Max length DD/MM/YYYY
    };

    const formatTimeInput = (text: string): string => {
      // Only allow numbers and :
      const cleaned = text.replace(/[^\d:]/g, '');

      // Auto-validate hours and minutes
      const parts = cleaned.split(':');

      if (parts.length === 1) {
        // Just typing hours
        if (parts[0].length > 2) {
          return cleaned.substring(0, 2) + ':' + cleaned.substring(2, 4);
        }
        return cleaned.substring(0, 2);
      } else if (parts.length === 2) {
        // Has both hours and minutes
        let hours = parts[0].substring(0, 2);
        let minutes = parts[1].substring(0, 2);

        // Validate hours (00-23)
        if (parseInt(hours) > 23) {
          hours = '23';
        }

        // Validate minutes (00-59)
        if (parseInt(minutes) > 59) {
          minutes = '59';
        }

        return hours + (parts[1] !== '' || cleaned.endsWith(':') ? ':' + minutes : '');
      }

      return cleaned.substring(0, 5); // Max length HH:MM
    };

    const handleChange = (text: string) => {
      if (isTime) {
        const formatted = formatTimeInput(text);
        onChangeText?.(formatted);
      } else if (isDate) {
        const formatted = formatDateInput(text);
        onChangeText?.(formatted);
      } else {
        onChangeText?.(text);
      }
    };

    return (
      <View className="mt-2">
        {label && (


          <Text className="text-body text-text mb-2 font-bold">
            {label} {required && <Text className="text-error">*</Text>}
          </Text>
        )}
        <TextInput
          ref={ref}
          className={`rounded-2xl px-4 text-body text-text bg-white border  ${isFocused ? 'border-primary' : inputClassName}`}
          style={{
            minHeight: 52,
            paddingVertical: Platform.OS === 'ios' ? 14 : 12,
          }}
          placeholder={placeholder}
          placeholderTextColor="#6B7280"
          value={value}
          onChangeText={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          keyboardType="default"
          // keyboardType={
          //   isDate || isTime ? 'numeric' : (rest.keyboardType ?? 'default')
          // }
          maxLength={isTime ? 5 : (isDate ? 10 : rest.maxLength)}
          {...rest}
        />

        {isValidate && <Text className='text-caption text-error mt-1'>{isValidate}</Text>}
      </View>
    );
  }
);

export default FormInput;
