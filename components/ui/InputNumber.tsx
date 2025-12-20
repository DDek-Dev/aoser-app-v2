import  { forwardRef, useState } from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';

type Props = {
  label: string;
  inputClassName?: string;
  placeholder?: string;
  value?: string;
  required?: boolean;
  isValidate?: string;
  onChangeText?: (text: string) => void;
} & Omit<TextInputProps, 'ref'>;

const InputNumber = forwardRef<TextInput, Props>(
  ({ label, placeholder = '', required, inputClassName, value, isValidate, onChangeText, ...rest }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleTextChange = (text: string) => {
      const onlyNumbers = text.replace(/[^0-9]/g, '');
      onChangeText?.(onlyNumbers);
    };

    return (
      <View>
        <Text className="text-body text-text mb-2 font-bold">
          {label} {required && <Text className="text-error">*</Text>}
        </Text>
        <TextInput
          ref={ref}
          className={`rounded-xl px-4 py-4 text-body text-text bg-white border  ${
            isFocused ? 'border-primary' : inputClassName
          }`}
          placeholder={placeholder}
          placeholderTextColor={'#6B7280'}

          value={value}
          keyboardType="number-pad"
          onChangeText={handleTextChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...rest}
        />

        <Text className="text-caption text-error mt-1">{isValidate}</Text>
      </View>
    );
  }
);

export default InputNumber;
