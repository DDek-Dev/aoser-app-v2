
// import { forwardRef, useState } from 'react';
// import { View, Text, TextInput, TextInputProps } from 'react-native';

// type Props = {
//   label?: string;
//   inputClassName?: string;
//   placeholder?: string;
//   value?: string;
//   required?: boolean;
//   isValidate?: string;
//   onChangeText?: (text: string) => void;
//   isDate?: boolean; // Add this prop to enable date formatting
// } & Omit<TextInputProps, 'ref'>;

// const FormInput = forwardRef<TextInput, Props>(
//   ({ label, placeholder = '', required, inputClassName, value, isValidate, onChangeText, isDate = false, ...rest }, ref) => {
//     const [isFocused, setIsFocused] = useState(false);

//     const formatDateInput = (text: string): string => {
//       // Remove all non-numeric characters
//       const cleaned = text.replace(/\D/g, '');
      
//       // Format as DD/MM/YYYY
//       let formatted = '';
//       if (cleaned.length > 0) {
//         formatted = cleaned.substring(0, 2); // DD
//       }
//       if (cleaned.length >= 3) {
//         formatted += '/' + cleaned.substring(2, 4); // /MM
//       }
//       if (cleaned.length >= 5) {
//         formatted += '/' + cleaned.substring(4, 8); // /YYYY
//       }
      
//       return formatted;
//     };

//     const handleDateChange = (text: string) => {
//       if (isDate) {
//         const formatted = formatDateInput(text);
//         onChangeText?.(formatted);
//       } else {
//         onChangeText?.(text);
//       }
//     };

//     return (
//       <View className="mt-2">
//         <Text className="text-body text-text mb-2 font-bold">
//           {label} {required && <Text className="text-error">*</Text>}
//         </Text>
//         <TextInput
//           ref={ref}
//           className={`rounded-2xl px-4 py-4 text-body text-text bg-white border ${
//             isFocused ? 'border-primary' : inputClassName
//           }`}
//           placeholder={placeholder}
//           placeholderTextColor="#6B7280"
//           value={value}
//           onChangeText={isDate ? handleDateChange : onChangeText}
//           onFocus={() => setIsFocused(true)}
//           onBlur={() => setIsFocused(false)}
//           keyboardType={isDate ? 'numeric' : rest.keyboardType}
//           maxLength={isDate ? 10 : rest.maxLength}
//           {...rest}
//         />

//         {isValidate && <Text className='text-caption text-error mt-1'>{isValidate}</Text>}
//       </View>
//     );
//   }
// );

// export default FormInput;





import { forwardRef, useState } from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';

type Props = {
  label?: string;
  inputClassName?: string;
  placeholder?: string;
  value?: string;
  required?: boolean;
  isValidate?: string;
  onChangeText?: (text: string) => void;
  isDate?: boolean;
  isDateTime?: boolean; // New prop for datetime mode
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
    isDateTime = false,
    ...rest 
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    const formatDateInput = (text: string): string => {
      const cleaned = text.replace(/\D/g, '');
      let formatted = '';
      
      if (cleaned.length > 0) {
        formatted = cleaned.substring(0, 2); // DD
      }
      if (cleaned.length >= 3) {
        formatted += '/' + cleaned.substring(2, 4); // /MM
      }
      if (cleaned.length >= 5) {
        formatted += '/' + cleaned.substring(4, 8); // /YYYY
      }
      
      return formatted;
    };

    const formatDateTimeInput = (text: string): string => {
      const cleaned = text.replace(/\D/g, '');
      let formatted = '';
      
      // Date part: DD/MM/YYYY
      if (cleaned.length > 0) {
        formatted = cleaned.substring(0, 2);
      }
      if (cleaned.length >= 3) {
        formatted += '/' + cleaned.substring(2, 4);
      }
      if (cleaned.length >= 5) {
        formatted += '/' + cleaned.substring(4, 8);
      }
      
      // Time part: HH:MM
      if (cleaned.length >= 9) {
        formatted += ' ' + cleaned.substring(8, 10);
      }
      if (cleaned.length >= 11) {
        formatted += ':' + cleaned.substring(10, 12);
      }
      
      return formatted;
    };

    const handleChange = (text: string) => {
      if (isDateTime) {
        const formatted = formatDateTimeInput(text);
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
        <Text className="text-body text-text mb-2 font-bold">
          {label} {required && <Text className="text-error">*</Text>}
        </Text>
        <TextInput
          ref={ref}
          className={`rounded-2xl px-4 py-4 text-body text-text bg-white border ${
            isFocused ? 'border-primary' : inputClassName
          }`}
          placeholder={placeholder}
          placeholderTextColor="#6B7280"
          value={value}
          onChangeText={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          keyboardType={(isDate || isDateTime) ? 'numeric' : rest.keyboardType}
          maxLength={isDateTime ? 17 : (isDate ? 10 : rest.maxLength)} // DD/MM/YYYY HH:MM = 17
          {...rest}
        />

        {isValidate && <Text className='text-caption text-error mt-1'>{isValidate}</Text>}
      </View>
    );
  }
);

export default FormInput;