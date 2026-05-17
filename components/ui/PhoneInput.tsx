// ================================================================================
// Phone Input Component (Fixed - No forwardRef issues)
// ================================================================================

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView,
  Dimensions,
  Pressable
} from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;

// Comprehensive country list
const COUNTRIES = [
  { code: 'LA', name: 'Laos', callingCode: '856', flag: '🇱🇦' },
  // { code: 'TH', name: 'Thailand', callingCode: '66', flag: '🇹🇭' },
  // { code: 'VN', name: 'Vietnam', callingCode: '84', flag: '🇻🇳' },
  // { code: 'KH', name: 'Cambodia', callingCode: '855', flag: '🇰🇭' },
  // { code: 'MM', name: 'Myanmar', callingCode: '95', flag: '🇲🇲' },
  // { code: 'SG', name: 'Singapore', callingCode: '65', flag: '🇸🇬' },
  // { code: 'MY', name: 'Malaysia', callingCode: '60', flag: '🇲🇾' },
  // { code: 'ID', name: 'Indonesia', callingCode: '62', flag: '🇮🇩' },
  // { code: 'PH', name: 'Philippines', callingCode: '63', flag: '🇵🇭' },
  // { code: 'CN', name: 'China', callingCode: '86', flag: '🇨🇳' },
  // { code: 'JP', name: 'Japan', callingCode: '81', flag: '🇯🇵' },
  // { code: 'KR', name: 'South Korea', callingCode: '82', flag: '🇰🇷' },
  // { code: 'IN', name: 'India', callingCode: '91', flag: '🇮🇳' },
  // { code: 'US', name: 'United States', callingCode: '1', flag: '🇺🇸' },
  // { code: 'GB', name: 'United Kingdom', callingCode: '44', flag: '🇬🇧' },
  // { code: 'AU', name: 'Australia', callingCode: '61', flag: '🇦🇺' },
  // { code: 'NZ', name: 'New Zealand', callingCode: '64', flag: '🇳🇿' },
  // { code: 'CA', name: 'Canada', callingCode: '1', flag: '🇨🇦' },
  // { code: 'FR', name: 'France', callingCode: '33', flag: '🇫🇷' },
  // { code: 'DE', name: 'Germany', callingCode: '49', flag: '🇩🇪' },
  // { code: 'IT', name: 'Italy', callingCode: '39', flag: '🇮🇹' },
  // { code: 'ES', name: 'Spain', callingCode: '34', flag: '🇪🇸' },
  // { code: 'RU', name: 'Russia', callingCode: '7', flag: '🇷🇺' },
  // { code: 'BR', name: 'Brazil', callingCode: '55', flag: '🇧🇷' },
  // { code: 'MX', name: 'Mexico', callingCode: '52', flag: '🇲🇽' },
  // { code: 'AE', name: 'United Arab Emirates', callingCode: '971', flag: '🇦🇪' },
  // { code: 'SA', name: 'Saudi Arabia', callingCode: '966', flag: '🇸🇦' },
  // { code: 'ZA', name: 'South Africa', callingCode: '27', flag: '🇿🇦' },
  // { code: 'EG', name: 'Egypt', callingCode: '20', flag: '🇪🇬' },
  // { code: 'NG', name: 'Nigeria', callingCode: '234', flag: '🇳🇬' },
];

type Country = {
  code: string;
  name: string;
  callingCode: string;
  flag: string;
};

interface PhoneInputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  label: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onCountryChange?: (country: Country) => void;
  required?: boolean;
  inputClassName?: string;
  isValidate?: string;
}

function PhoneInput({
  label,
  value,
  onChangeText,
  onCountryChange,
  required,
  inputClassName,
  isValidate,
  ...rest
}: PhoneInputProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [isFocused, setIsFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { t } = useTranslation();
  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    onCountryChange?.(country);
    setModalVisible(false);
    setSearchQuery('');
  };

  const handleChange = (text: string) => {
    const onlyNums = text.replace(/[^0-9]/g, '');
    onChangeText?.(onlyNums);
  };

  const filteredCountries = COUNTRIES.filter(
    (country) =>
      country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.callingCode.includes(searchQuery) ||
      country.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View>
      <Text className="text-body text-text mb-2 font-bold">
        {label} {required && <Text className="text-error">*</Text>}
      </Text>

      <View
        className={`flex-row items-center border ${inputClassName} rounded-xl bg-white px-3 ${isFocused ? 'border-primary border' : ''
          }`}
        style={{ minHeight: 52 }}
      >
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          className="flex-row items-center mr-2 pr-2 border-r border-gray-300"
        >
          <Text style={{ fontSize: 24, lineHeight: 28 }}>{selectedCountry.flag}</Text>
          <Text className="text-text text-sm">▼</Text>
        </TouchableOpacity>

        <Text className="text-text mr-2 text-body">+{selectedCountry.callingCode}</Text>

        <TextInput
          keyboardType="number-pad"
          placeholder="20 1234 5678"
          value={value}
          onChangeText={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="flex-1 text-body text-text  mb-1 items-center"
          // placeholderClassName='#111827'
            placeholderTextColor="#9CA3AF"
          style={{ paddingVertical: Platform.OS === 'ios' ? 14 : 10 }}
          maxLength={10}
          {...rest}
        />
      </View>

      {isValidate && (
        <Text className="text-caption text-error mt-1">{isValidate}</Text>
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setModalVisible(false);
          setSearchQuery('');
        }}
      >
        <View className="flex-1 justify-end">

        <Pressable className="flex-1 justify-end bg-black/50" onPress={() => setModalVisible(false)}>
          <View
            className="bg-white rounded-t-3xl"
            style={{ height: SCREEN_HEIGHT * 0.7 }}
          >
            <SafeAreaView className="flex-1">
              <View className="p-4 border-b border-gray-200">
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-lg font-bold text-text">{t('editProfile.select_contry')}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setModalVisible(false);
                      setSearchQuery('');
                    }}
                  >
                    <Text className="text-primary text-lg font-semibold">✕</Text>
                  </TouchableOpacity>
                </View>

                <TextInput
                  placeholder="Search country or code..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  className="border border-gray-300 rounded-lg px-3  text-body"
                  autoCapitalize="none"
                  style={{
                    minHeight: 44,
                    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
                  }}
                />
              </View>

              <FlatList
                data={filteredCountries}
                keyExtractor={(item) => item.code}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ flexGrow: 1 }}
                ListEmptyComponent={
                  <View className="flex-1 items-center justify-center p-8">
                    <Text className="text-gray-500 text-body">{t('editProfile.country_no_found')}</Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleCountrySelect(item)}
                    className={`flex-row items-center p-4 border-b border-gray-100 ${item.code === selectedCountry.code ? 'bg-primary/10' : ''
                      }`}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 28, lineHeight: 34 }}>{item.flag}</Text>
                    <View className="flex-1">
                      <Text className="text-body font-medium text-text">{item.name}</Text>
                      <Text className="text-caption text-textSecondary mt-0.5">
                        +{item.callingCode}
                      </Text>
                    </View>
                    {item.code === selectedCountry.code && (
                      <Text className="text-primary text-xl">✓</Text>
                    )}
                  </TouchableOpacity>
                )}
              />
            </SafeAreaView>
          </View>
        </Pressable>
        </View>
      </Modal>
    </View>
  );
}

export default PhoneInput;