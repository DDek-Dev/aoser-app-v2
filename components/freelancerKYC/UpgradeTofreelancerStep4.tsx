import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import DatePicker from 'components/ui/DatePicker';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import InputNumber from 'components/ui/InputNumber';
import FormInput from 'components/ui/Input';
import dayjs from 'dayjs';

import { useUpgradeToFreelancerStep4 } from 'hooks/useFreelancerKYC';
import { District, Province } from 'types';
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
  province?: Province;
  setProvince?: React.Dispatch<React.SetStateAction<Province | undefined>>;
  district?: District;
  setDistrict?: React.Dispatch<React.SetStateAction<District | undefined>>;
  village?: string;
  setVillage?: React.Dispatch<React.SetStateAction<string>>;
};

const UpgradeToFreelancerStep4 = ({
  cardType,
  setCardType,
  cardID,
  setCardID,
  fromDate,
  setFromDate,
  errors,
}: Props) => {
  const inputRef = useRef<TextInput>(null);
  const fromInputRef = useRef<TextInput>(null);
  const [fromDateString, setFromDateString] = useState('');
  const [tempFromDate, setTempFromDate] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const { t } = useTranslation();
  const { data: dataStep4, } = useUpgradeToFreelancerStep4();


  useEffect(() => {
    if (dataStep4) {
      setCardType(dataStep4.cardType);
      setCardID(dataStep4.cardID);
      const parsed = dataStep4.fromDate ? new Date(dataStep4.fromDate) : null;
      setFromDate(parsed);
      setFromDateString(formatDate(parsed));
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
          {cardType === 'ID_CARD' &&

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
          }
          {cardType === 'PASSPORT' &&

            <InputNumber
              ref={inputRef}

              label={t('kyc.step4.passport.label')}
              placeholder={t('kyc.step4.passport.placeholder')}
              value={cardID}
              onChangeText={setCardID}
              required
              inputClassName={errors?.cardID ? 'border-error' : 'border-border'}
              isValidate={`${errors?.cardID ? t('kyc.step4.passport.error') : ''}`}
            />
          }
          {cardType === 'VISA' &&

            <InputNumber
              ref={inputRef}

              label={t('kyc.step4.visa.label')}
              placeholder={t('kyc.step4.visa.placeholder')}
              value={cardID}
              onChangeText={setCardID}
              required
              inputClassName={errors?.cardID ? 'border-error' : 'border-border'}
              isValidate={`${errors?.cardID ? t('kyc.step4.visa.error') : ''}`}
            />
          }
        </View>

        <View className="flex-row items-center justify-between mb-4 ">
          <View className="flex-1 mr-2">
            <FormInput
              label={t('kyc.step4.expiryDate.label')}
              required
              placeholder={currentLanguage === 'la' ? 'ວ/ດ/ປ' : 'dd/mm/yy'}
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
            className="seft-end mt-1 flex justify-center items-center rounded-2xl "
          >
            <View className="bg-blue-100 p-4 rounded-full">

              <MaterialIcons name="calendar-month" size={24} color="#2563EB" />
            </View>
          </TouchableOpacity>
        </View>

        {showFromPicker && (


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

    </View>
  );
};

export default UpgradeToFreelancerStep4;
