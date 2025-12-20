import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

type Props = {
  label: string;
  placeholder?: string;
  value?: string;
  required?: boolean;
  inputClassName?: string;
  isValidate?: string;
  onChangeText?: (text: string) => void;
};

const TextArea = ({ label, placeholder = '', isValidate, required,inputClassName, value, onChangeText }: Props) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className="mb-4">
      <Text className="text-body text-text mb-1 font-bold">{label} {required && <Text className="text-error">*</Text>}</Text>
      <TextInput
        className={`rounded-xl px-4 py-4 text-body  text-text bg-white h-[120px] border ${
          isFocused ? 'border-primary' : inputClassName
        } `}
        placeholder={placeholder}
        placeholderTextColor="#6B7280"
        multiline
        numberOfLines={6}
        textAlignVertical="top"
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />

              <Text className='text-caption text-error mt-1'>{isValidate}</Text>
      
    </View>
  );
};

export default TextArea;
