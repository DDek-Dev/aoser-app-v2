import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import DatePicker from 'components/ui/DatePicker';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import InputNumber from 'components/ui/InputNumber';
import FormInput from 'components/ui/Input';
import dayjs from 'dayjs';

import { useUpgradeToFreelancerStep4 } from 'hooks/useFreelancerKYC';
import { District, Province, SelectedAddress } from 'types';
import { useSelectAddress } from 'hooks/useSelectAddress';
import { SkeletonLoader } from 'skeletonScreens/SelectAddressSkeleton';
import Dropdown from 'components/filter/Dropdown';
import { useTranslation } from 'react-i18next';
import { getCurrentLanguage, Language } from 'utils/dateFormatter';


type Props = {
  cardType: 'ID_CARD' | 'PASSPORT' | 'VISA';
  setCardType: React.Dispatch<React.SetStateAction<'ID_CARD' | 'PASSPORT' | 'VISA'>>;
  cardID: string;
  setCardID: React.Dispatch<React.SetStateAction<string>>;
  fromDate: Date | null;
  setFromDate: React.Dispatch<React.SetStateAction<Date | null>>;

  errors?: Record<string, boolean>;
  province: Province | undefined;
  setProvince: React.Dispatch<React.SetStateAction<Province | undefined>>;
  district: District | undefined;
  setDistrict: React.Dispatch<React.SetStateAction<District | undefined>>;
  village: string;
  setVillage: React.Dispatch<React.SetStateAction<string>>;
};

const UpgradeToFreelancerStep4 = ({
  cardType,
  setCardType,
  cardID,
  setCardID,
  fromDate,
  setFromDate,

  errors,
  province: selectedProvince,
  setProvince: setSelectedProvince,
  district: selectedDistrict,
  setDistrict: setSelectedDistrict,
  village,

  setVillage
}: Props) => {
  const inputRef = useRef<TextInput>(null);
  const fromInputRef = useRef<TextInput>(null);
  const [fromDateString, setFromDateString] = useState('');
  const [tempFromDate, setTempFromDate] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [addressInfo, setAddressInfo] = useState<SelectedAddress>({
    province: undefined,
    district: undefined,
    village: '',
    longitude: 0,
    latitude: 0
  });
  const { t } = useTranslation();
  const { data: dataStep4, } = useUpgradeToFreelancerStep4();
  const { data: addressData, isLoading, error } = useSelectAddress();


  useEffect(() => {
    if (dataStep4) {
      setCardType(dataStep4.cardType);
      setCardID(dataStep4.cardID);
      setFromDate(new Date(dataStep4.fromDate));
      
      setAddressInfo({
        province: dataStep4.address?.province,
        district: dataStep4.address?.district,
        village: dataStep4.address?.village,
        longitude: 0,
        latitude: 0,
      });
      setSelectedProvince(dataStep4.address?.province);
      setSelectedDistrict(dataStep4.address?.district);
      setVillage(dataStep4.address?.village || '');
     setFromDateString(formatDate(dataStep4.fromDate));
    }


  }, [dataStep4]);

    const currentLanguage: Language = getCurrentLanguage();
  
  const formatDate = (date: Date | null) => {
    return date ? dayjs(date).format('DD/MM/YYYY') : '';
  };

  const parseDate = (dateString: string): Date | null => {
    if (!dateString || dateString.length !== 10) return null;

    const [day, month, year] = dateString.split('/');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    // Validate the date
    if (isNaN(date.getTime())) return null;
    return date;
  };
  const handleAddressChange = (address: SelectedAddress) => {
    setAddressInfo(address);
    setSelectedProvince(address.province);
    setSelectedDistrict(address.district);
    // setVillage(address.village);
  };

  const handleProvinceSelect = (province: Province) => {
    setSelectedProvince(province);
    setSelectedDistrict(undefined);
    setVillage('');
    handleAddressChange({
      province,
      district: undefined,
      village: '',
      longitude: 0,
      latitude: 0
    });
  };

  const handleDistrictSelect = (district: District) => {
    setSelectedDistrict(district);
    setVillage('');
    handleAddressChange({
      province: selectedProvince,
      district,
      village: '',
      longitude: 0,
      latitude: 0
    });
  };

  const handleVillageChange = (text: string) => {
    setVillage(text);
    handleAddressChange({
      province: selectedProvince,
      district: selectedDistrict,
      village: text,
      longitude: 0,
      latitude: 0
    });
  };

  if (isLoading) {
    return (
      <View>
        {/* <Text className="text-subheading text-text mb-4">{t('kyc.step4.loading.title')}</Text> */}
        <SkeletonLoader />
      </View>
    );
  }



  if (error || !addressData || addressData.length === 0) {
    return (
      <View>
        <Text className="text-subheading text-text mb-4">{t('kyc.step4.loading.title')}</Text>
        <View className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <Text className="text-body text-red-600">
            {t('kyc.step4.error')}
          </Text>
        </View>
      </View>
    );
  }

  const provinces = addressData[0]?.provinces || [];
  const districts = selectedProvince?.districts || [];

  const provinceOptions = provinces.map(province => ({
    label: province.province_la,
    value: province
  }));

  const districtOptions = districts.map(district => ({
    label: district.district_la,
    value: district
  }));

  return (
    <View className="flex-1 px-5 pt-6">
      <View className="flex-1 bg-blue-50 px-4 pt-4 rounded-xl">
        <Text className="text-subheading font-bold text-text mb-1"> {t('kyc.step4.title')}</Text>
        <Text className="text-cation text-textSecondary mb-4">
          {t('kyc.step4.subtitle')}
        </Text>

        <View className="flex-row mb-4 space-x-4 gap-2">
          {['ID_CARD', 'PASSPORT', 'VISA'].map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setCardType(type as 'ID_CARD' | 'PASSPORT' | 'VISA')}
              className={`flex-1 border py-4 rounded-xl items-center ${cardType === type ? 'border-primary' : 'border-border'}`}
            >
              <View className="flex-row items-center">
                {cardType === type && <Ionicons name="checkmark-circle" size={16} color="#3B82F6" />}
                <Text className="text-caption text-text capitalize ml-1">{t(`kyc.step4.documentTypes.${type}`)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View className="mb-4">
          <InputNumber
            ref={inputRef}
            label={t('kyc.step4.cardId.label')}
            placeholder={t('kyc.step4.cardId.placeholder')}
            value={cardID}
            onChangeText={setCardID}
            required
            inputClassName={errors?.cardID ? 'border-error' : 'border-border'}
            isValidate={`${errors?.cardID ? t('kyc.step4.cardId.error') : ''}`}
          />
        </View>

        <View className="flex-row justify-between mb-4 items-end ">
          <View className="flex-1 mr-2">
            <FormInput
              label={t('kyc.step4.expiryDate.label')}
              required
              placeholder={currentLanguage === 'la' ? 'ວ/ດ/ປ' : 'mm/dd/yy'}
              value={fromDateString || ''}
              inputClassName={errors?.fromDate ? 'border-error' : 'border-border'}
              ref={fromInputRef}
              isValidate={`${errors?.fromDate ? t('kyc.step4.expiryDate.error') : ''}`}
              isDate={true} // Enable date formatting
              onChangeText={(text) => {
                setFromDateString(text);
                // Only update the date state when we have a complete date
                if (text.length === 10) {
                  const parsedDate = parseDate(text);
                  if (parsedDate) {
                    setFromDate(parsedDate);
                  }
                }
              }}
            />
          </View>
          <TouchableOpacity
            onPress={() => {
              setTempFromDate(fromDate || new Date());
              setShowFromPicker(true);
            }}
            className="w-24 bg-blue-200 mt-1 flex justify-center items-center rounded-xl py-3.5"
          >
            <MaterialIcons name="calendar-month" size={24} color="#2563EB" />
          </TouchableOpacity>
        </View>

        {showFromPicker && (
          // <DatePicker
          //   visible={showFromPicker}
          //    date={fromDate}
          //   tempDate={tempFromDate}
          //   setTempDate={setTempFromDate}
          //   setDate={(date) => {
          //     setFromDate(date);
          //     setFromDateString(formatDate(date)); // Sync the string when date picker is used
          //   }}
          //   // setFromDateString(formatDate(date))
          //   // setDate={setFromDate}
          //   onClose={() => {
          //     setShowFromPicker(false);
          //     setTimeout(() => fromInputRef.current?.focus(), 100);
          //   }}
          // />


          <DatePicker
            visible={showFromPicker}
            date={null} // Pass null as is
            tempDate={tempFromDate}
            setTempDate={setTempFromDate}
            setDate={(date) => {
              setFromDate(date);
              setFromDateString(formatDate(date)); // Sync the string when date picker is used
            }}
            onClose={() => {
              setShowFromPicker(false);
              setTimeout(() => fromInputRef.current?.focus(), 100);
            }}
          />
        )}
      </View>

      

      <Text className="text-body font-bold text-text mb-2">{t('kyc.step4.location.title')} </Text>

      <View className='bg-blue-50 px-4 py-4 rounded-xl'>
        <Dropdown
          label={t('kyc.step4.location.province.label')}

          value={selectedProvince?.province_la}
          placeholder={t('kyc.step4.location.province.placeholder')}
          options={provinceOptions}
          onSelect={handleProvinceSelect}
        // error={errors?.province}
        // errorMessage="Province is required"
        />

        <Dropdown
          label={t('kyc.step4.location.district.label')}

          value={selectedDistrict?.district_la}
          placeholder={t('kyc.step4.location.district.placeholder')}
          options={districtOptions}
          onSelect={handleDistrictSelect}
          disabled={!selectedProvince}
        // error={errors?.district}
        // errorMessage="District is required"
        />

        <View className="mb-4">
          <Text className="text-body font-medium text-text mb-2">{t('kyc.step4.location.village.label')}</Text>
          <TextInput
            value={village}
            onChangeText={handleVillageChange}
            placeholder={t('kyc.step4.location.village.placeholder')}
            className={`
              px-4 py-4 rounded-lg border text-body
              ${selectedDistrict
                ? 'bg-surface border-border text-text'
                : 'bg-gray-100 border-gray-200 text-gray-400'
              }
              ${errors?.village ? 'border-error' : ''}
            `}
            placeholderTextColor="#9CA3AF"
            editable={!!selectedDistrict}
          />
          {errors?.village && (
            <Text className="text-caption text-error mt-1">  {t('kyc.step4.location.village.error')}</Text>
          )}
          {!selectedDistrict && (
            <Text className="text-caption text-textSecondary mt-1">
              {t('kyc.step4.location.village.hint')}
            </Text>
          )}
        </View>


      </View>
    </View>
  );
};

export default UpgradeToFreelancerStep4;