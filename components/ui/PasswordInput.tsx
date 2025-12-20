import { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { Controller, Control, FieldError } from 'react-hook-form';
import { FontAwesome, Ionicons } from '@expo/vector-icons';


interface PasswordInputProps {
  control: Control<any>;
  name: string;
  placeholder: string;
  rules?: any;
  showPassword: boolean;
  onTogglePassword: () => void;
  error?: string;
  disabled?: boolean;
}

function PasswordInput({
  control,
  name,
  placeholder,
  rules,
  showPassword,
  onTogglePassword,
  error,
  disabled,
}: PasswordInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { onChange, value } }) => (
        <View>
          <View
            className={`flex-row items-center px-4 py-2 rounded-2xl mb-2 ${
              error
                ? 'border border-error'
                : isFocused
                ? 'border border-primary'
                : 'border border-border'
            }`}
          >
            <FontAwesome
              name="lock"
              size={18}
              color="#999"
              style={{ marginRight: 8 }}
            />
            <TextInput
              placeholder={placeholder}
              className="flex-1 text-text text-base"
              secureTextEntry={!showPassword}
              onChangeText={onChange}
              value={value}
              placeholderTextColor="#999"
              editable={!disabled}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
            <TouchableOpacity
              className="absolute right-4"
              onPress={onTogglePassword}
              disabled={disabled}
            >
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color="#999"
              />
            </TouchableOpacity>
          </View>
          {error && (
            <Text className="text-error text-caption mb-3">{error}</Text>
          )}
        </View>
      )}
    />
  );
}

export default PasswordInput;