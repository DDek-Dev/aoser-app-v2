import { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Pressable,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { FreelancerStackParamList } from 'types/navigation';
import FormInput from 'components/ui/Input';
import TextArea from 'components/ui/TextArea';
import SelectInput from 'components/ui/SelectInput';
import Dropdown from 'components/filter/Dropdown';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import DatePicker from 'components/ui/DatePicker';
import { useSelectAddress } from 'hooks/useSelectAddress';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import BudgetInput from 'components/ui/BudgetInput';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import { formatDate, getCurrentLanguage, Language } from 'utils/dateFormatter';
import SubWorkDetailsInput from 'components/ui/SubTaskInputList';
import { SubWorkDetail } from 'types';
import { useTranslation } from 'react-i18next';

type BookFreelancerRouteProp = RouteProp<FreelancerStackParamList, 'Bookfreelancer'>;

type Props = {
  route: BookFreelancerRouteProp;
};

export default function PostWorkScreen() {
  type SearchBarNavigationProp = NativeStackNavigationProp<FreelancerStackParamList>;
  const navigation = useNavigation<SearchBarNavigationProp>();
  const insets = useSafeAreaInsets();
  const [workType, setWorkType] = useState<'ONLINE' | 'OFFLINE'>('ONLINE');

  const [subWorkDetails, setSubWorkDetails] = useState<SubWorkDetail[]>([]);
  const [subTasks, setSubTasks] = useState<string[]>([]);
  const [newSubTask, setNewSubTask] = useState('');
  const [category, setCategory] = useState('');
  const [nameOfWork, setNameOfWork] = useState('');
  const [workDetail, setWorkDetail] = useState('');
  const [budget, setBudget] = useState<number | null>(null);
  const [budgetCurrency, setBudgetCurrency] = useState<'LAK' | 'USD'>('LAK');
  const fromInputRef = useRef<TextInput>(null);
  const toInputRef = useRef<TextInput>(null);
  const categoryRef = useRef<{ focus: () => void }>(null);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [budgetType, setBudgetType] = useState<'FIXED_PRICE' | 'HOURLY' | 'OFFERING'>('FIXED_PRICE');

  // Date and time states
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [tempFromDate, setTempFromDate] = useState(new Date());
  const [tempToDate, setTempToDate] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  // Separate date and time string states
  const [fromDateString, setFromDateString] = useState('');
  const [fromTimeString, setFromTimeString] = useState('');
  const [toDateString, setToDateString] = useState('');
  const [toTimeString, setToTimeString] = useState('');

  const { t } = useTranslation();
  const [errors, setErrors] = useState({
    nameOfWork: false,
    workDetail: false,
    // budget: false,
    category: false,
    toDate:false,
  });
  const [toDateErrorMessage, setToDateErrorMessage] = useState('');

  // Address selection (optional)
  const { data: addressData } = useSelectAddress();
  const [selectedProvince, setSelectedProvince] = useState<any>(undefined);
  const [selectedDistrict, setSelectedDistrict] = useState<any>(undefined);
  const [village, setVillage] = useState('');

  const currentLanguage: Language = getCurrentLanguage();



  // ─── Date Auto-Correction ────────────────────────────────────────────────────
  /**
   * Normalises a raw date string typed by the user.
   * - Replaces `-` or `.` separators with `/`
   * - Clamps day to 1-31, month to 1-12
   * - Returns a corrected "DD/MM/YYYY" string (partial strings are left as-is
   *   until they are long enough to validate).
   */
  const normaliseDateInput = (raw: string): string => {
    // Replace common alternative separators
    const normalised = raw.replace(/[-,.]/g, '/');

    const parts = normalised.split('/');
    if (parts.length !== 3) return normalised;

    let [dayStr, monthStr, yearStr] = parts;

    const day = parseInt(dayStr, 10);
    const month = parseInt(monthStr, 10);

    const correctedDay = isNaN(day) ? dayStr : String(Math.min(Math.max(day, 1), 31));
    const correctedMonth = isNaN(month) ? monthStr : String(Math.min(Math.max(month, 1), 12));

    return `${correctedDay}/${correctedMonth}/${yearStr}`;
  };

  // ─── Time Auto-Correction ────────────────────────────────────────────────────
  /**
   * Normalises a raw time string typed by the user.
   * - Replaces `.` or `,` separators with `:`
   * - Clamps hours to 0-23, minutes to 0-59
   * - Falls back to "0:0" for completely unparseable input once the user has
   *   typed at least one `:` separator.
   */
  const normaliseTimeInput = (raw: string): string => {
    // Replace common alternative separators
    const normalised = raw.replace(/[.,]/g, ':');

    // Only attempt correction once the user has typed a separator
    if (!normalised.includes(':')) return normalised;

    const parts = normalised.split(':');
    if (parts.length !== 2) return '0:0';

    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);

    const correctedHours = isNaN(hours) ? 0 : Math.min(Math.max(hours, 0), 23);
    const correctedMinutes = isNaN(minutes) ? 0 : Math.min(Math.max(minutes, 0), 59);

    return `${correctedHours}:${correctedMinutes}`;
  };

  // Parse date string (DD/MM/YYYY or MM/DD/YYYY)
  const parseDate = (dateString: string): Date | null => {
    if (!dateString || dateString.length < 8) return null; // Need at least D/M/YYYY

    const parts = dateString.split('/');
    if (parts.length !== 3) return null;

    const [part1, part2, year] = parts;

    // Parse based on language (adjust if your format differs)
    const day = parseInt(part1);
    const month = parseInt(part2);
    const yearNum = parseInt(year);

    // Basic validation
    if (isNaN(day) || isNaN(month) || isNaN(yearNum)) return null;
    if (day < 1 || day > 31) return null;
    if (month < 1 || month > 12) return null;
    if (yearNum < 1900 || yearNum > 2100) return null;

    const date = new Date(yearNum, month - 1, day);

    // Check if date is valid
    if (isNaN(date.getTime())) return null;

    return date;
  };

  // Parse time string (HH:MM)
  const parseTime = (timeString: string): { hours: number; minutes: number } | null => {
    if (!timeString || timeString.length < 3) return null; // Need at least H:M

    const parts = timeString.split(':');
    if (parts.length !== 2) return null;

    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);

    if (isNaN(hours) || isNaN(minutes)) return null;
    if (hours < 0 || hours > 23) return null;
    if (minutes < 0 || minutes > 59) return null;

    return { hours, minutes };
  };

  // Combine date and time strings into a Date object
  const combineDateAndTime = (dateString: string, timeString: string): Date | null => {
    const parsedDate = parseDate(dateString);
    if (!parsedDate) return null;

    const parsedTime = parseTime(timeString);
    if (!parsedTime) {
      // If no time, use 00:00
      return parsedDate;
    }

    parsedDate.setHours(parsedTime.hours, parsedTime.minutes, 0, 0);
    return parsedDate;
  };

  // Update fromDate whenever date or time string changes
  const updateFromDate = (dateStr: string, timeStr: string) => {
    const combined = combineDateAndTime(dateStr, timeStr);
    setFromDate(combined);
  };

  // Update toDate whenever date or time string changes
  const updateToDate = (dateStr: string, timeStr: string) => {
    const combined = combineDateAndTime(dateStr, timeStr);
    setToDate(combined);
  };

  // Format Date object to display string
  const formatDateForDisplay = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Format Date object to time string
  const formatTimeForDisplay = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };



  // ─── Handlers with auto-correction ──────────────────────────────────────────
  const handleFromDateChange = (text: string) => {
    const corrected = normaliseDateInput(text);
    setFromDateString(corrected);
    updateFromDate(corrected, fromTimeString);
    setErrors(prev => ({ ...prev, toDate: false }));
    setToDateErrorMessage('');
  };

  const handleFromDateBlur = () => {
    // Re-apply correction on blur so partial entries get fixed when user leaves field
    const corrected = normaliseDateInput(fromDateString);
    setFromDateString(corrected);
    updateFromDate(corrected, fromTimeString);
  };

  const handleFromTimeChange = (text: string) => {
    const corrected = normaliseTimeInput(text);
    setFromTimeString(corrected);
    updateFromDate(fromDateString, corrected);
    setErrors(prev => ({ ...prev, toDate: false }));
    setToDateErrorMessage('');
  };

  const handleFromTimeBlur = () => {
    const corrected = normaliseTimeInput(fromTimeString);
    setFromTimeString(corrected);
    updateFromDate(fromDateString, corrected);
  };

  const handleToDateChange = (text: string) => {
    const corrected = normaliseDateInput(text);
    setToDateString(corrected);
    updateToDate(corrected, toTimeString);
    setErrors(prev => ({ ...prev, toDate: false }));
    setToDateErrorMessage('');
  };

  const handleToDateBlur = () => {
    const corrected = normaliseDateInput(toDateString);
    setToDateString(corrected);
    updateToDate(corrected, toTimeString);
  };

  const handleToTimeChange = (text: string) => {
    const corrected = normaliseTimeInput(text);
    setToTimeString(corrected);
    updateToDate(toDateString, corrected);
    setErrors(prev => ({ ...prev, toDate: false }));
    setToDateErrorMessage('');
  };

  const handleToTimeBlur = () => {
    const corrected = normaliseTimeInput(toTimeString);
    setToTimeString(corrected);
    updateToDate(toDateString, corrected);
  };



  // Address helpers
  const provinces = addressData?.[0]?.provinces ?? [];
  const districts = selectedProvince?.districts ?? [];

  const provinceOptions = provinces.map((p: any) => ({ label: p.province_la, value: p }));
  const districtOptions = districts.map((d: any) => ({ label: d.district_la, value: d }));

  const handleProvinceSelect = (province: any) => {
    setSelectedProvince(province);
    setSelectedDistrict(undefined);
    setVillage('');
  };

  const handleDistrictSelect = (district: any) => {
    setSelectedDistrict(district);
    setVillage('');
  };

  // Handle submit
  const handleSubmit = () => {
    const hasToDateInput =
      toDateString.trim() !== '' ||
      toTimeString.trim() !== '' ||
      Boolean(toDate);

    let dateInvalid = false;
    let dateValidationMessage = '';

    if (hasToDateInput) {
      if (!fromDate || !toDate) {
        dateInvalid = true;
        dateValidationMessage = t('postWork.select_both_dates');
      } else if (toDate <= fromDate) {
        dateInvalid = true;
        dateValidationMessage = t('postWork.end_date_after_start');
      }
    }

    const newErrors = {
      nameOfWork: nameOfWork.trim() === '',
      workDetail: workDetail.trim() === '',
      // budget: budget === 0 || budget === null,
      category: category.trim() === '',
      toDate: dateInvalid,
    };
    setErrors(newErrors);
    setToDateErrorMessage(dateValidationMessage);

    // Auto-add pending subtask
    let finalSubTasks = [...subTasks];
    if (newSubTask.trim() && !subTasks.includes(newSubTask.trim())) {
      finalSubTasks = [...subTasks, newSubTask.trim()];
      setSubTasks(finalSubTasks);
      setNewSubTask('');
    }

    if (budget === 0 || budget === null) {
      setBudgetType('OFFERING');
    }

    const hasError = Object.values(newErrors).some(Boolean);

    if (hasError) {
      console.log('Validation Errors:', newErrors, 'Date Invalid:', dateInvalid);
      console.log('From Date:', fromDate?.toISOString());
      console.log('To Date:', toDate?.toISOString());
      return;
    }

    const formData = {
      workTitle: nameOfWork,
      description: workDetail,
      budget,
      category,
      kindOfWork: workType,
      deadLine: toDate?.toISOString() || null,
      startDate: fromDate?.toISOString() || null,
      subWorkDetails,
      currency: budgetCurrency,
      budgetType,
      serviceType: category,
      jobs: subcategories,
      address: {
        country: selectedProvince ? "Laos" : '',
        province: selectedProvince?.province_la || '',
        district: selectedDistrict?.district_la || '',
        village: village.trim() || '',
      }
    };

    // Include address only if user selected any address fields (optional)
    if (selectedProvince) {
      (formData as any).address = {
        province: selectedProvince?.province_la,
        district: selectedDistrict?.district_la ?? null,
        village: village.trim() || null,
        country: "Laos"
      };
    }

    // console.log('Submitting Form Data:', formData);
    navigation.navigate('ConfirmPostjob', { formData });
  };

  return (
    <>
      <ScreenWrapper safeEdges={['top']} style={{ backgroundColor: 'white' }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} className='rounded-lg'>
          <View className='px-4 flex-row justify-between items-center mb-4'>
            <View className="flex-row items-center bg-surface p-3 rounded-2xl flex-1 mr-3">
              <View className="flex-1">
                <Text className="font-semibold text-primary text-heading">{t('postWork.public_work')}</Text>
                <Text className="text-primary text-body">{t('postWork.posting_public_work')}</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              className="bg-primary py-3 px-5 rounded-xl items-center justify-center"
            >
              <Text className="text-white font-semibold text-body">{t('postWork.next')}</Text>
            </TouchableOpacity>
          </View>

          <KeyboardAwareScrollView
            contentContainerStyle={{ paddingBottom: insets.bottom + 10 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            className='p-4'
          >
            <View className='bg-blue-50 p-4 rounded-2xl mb-2'>
              <View className='bg-blue-50 rounded-2xl'>
                <SelectInput
                  label={t('postWork.service_type')}
                  value={category}
                  initialSubcategories={subcategories}
                  onSelect={(serviceTypeId, jobIds) => {
                    setCategory(serviceTypeId);
                    setSubcategories(jobIds);
                  }}
                  inputClassName={errors.category ? 'border-error' : 'border-border'}
                  ref={categoryRef}
                />
              </View>

              <FormInput
                label={t('postWork.work_title')}
                value={nameOfWork}
                onChangeText={setNameOfWork}
                inputClassName={errors.nameOfWork ? 'border-error' : 'border-border'}
                required
                isValidate={`${errors.nameOfWork ? `${t('postWork.work_title_required')}` : ''}`}
              />

              <Text className="text-body text-text my-1 font-bold mt-2">{t('postWork.work_type')}</Text>
              <View className="flex-row mb-4 space-x-4 gap-2">
                {['ONLINE', 'OFFLINE'].map((type) => (
                  <Pressable
                    key={type}
                    onPress={() => setWorkType(type as 'ONLINE' | 'OFFLINE')}
                    className={`flex-1 border py-4 rounded-xl items-center ${workType === type ? 'border-primary bg-primary' : 'border-border'}`}
                  >
                    <View className="flex-row items-center">
                      {workType === type && <Ionicons name="checkmark-circle" size={16} color="#fff" />}
                      <Text className={`${workType === type ? 'text-white' : 'text-text'} text-caption capitalize ml-1`}>
                        {type === "ONLINE" ? `${t('postWork.online')}` : `${t('postWork.offline')}`}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>

              <TextArea
                label={t('postWork.work_description')}
                placeholder={t('postWork.work_description_placeholder')}
                value={workDetail}
                onChangeText={setWorkDetail}
                inputClassName={errors.workDetail ? 'border-error' : 'border-border'}
                required
                isValidate={`${errors.workDetail ? `${t('postWork.work_description_required')}` : ''}`}
              />
            </View>

            <View className="bg-blue-50 p-4 rounded-2xl mb-2">
              <Text className="text-body mb-2 text-text font-bold">{t('postWork.budget_type')}</Text>
              <View className="flex-row space-x-4 gap-2 mb-6">
                {['FIXED_PRICE', 'HOURLY', 'OFFERING'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setBudgetType(type as 'FIXED_PRICE' | 'HOURLY' | 'OFFERING')}
                    className={`flex-1 border py-4 rounded-xl items-center ${budgetType === type ? 'border-primary bg-primary' : 'border-border'}`}
                  >
                    <View className="flex-row items-center gap-2">
                      {budgetType === type && <Ionicons name="checkmark-circle" size={16} color="#fff" />}
                      <Text className={`${budgetType === type ? 'text-surface' : 'text-text'} text-caption`}>
                        {type === 'FIXED_PRICE'
                          ? `${t('postWork.fixed_price')}`
                          : type === 'HOURLY'
                            ? `${t('postWork.hourly')}`
                            : `${t('postWork.offering')}`
                        }
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {budgetType === 'OFFERING' ? (
                <View className='flex-row mb-4'>
                  <Text className="text-lg text-primary font-bold mr-2">{t('workDetail.offering_price')}</Text>
                </View>
              ) : (
                <BudgetInput
                  label={t('postWork.budget')}
                  value={budget}
                  onChange={setBudget}
                  currency={budgetCurrency}
                  onCurrencyChange={setBudgetCurrency}
                  // error={errors.budget}
                  // isValidate={`${errors.budget ? `${t('postWork.budget_required')}` : ''}`}
                  required
                  
                />
              )}
            </View>

            <View className='bg-blue-50 p-4 rounded-2xl mb-2'>
              <Text className="text-body mb-1 text-text font-bold">{t('postWork.deadline_requirement')}</Text>
              {/* <View className="flex-row mb-4 space-x-4 gap-2">
                {[true, false].map((option) => (
                  <Pressable
                    key={option ? 'yes' : 'no'}
                    onPress={() => setHasDeadline(option)}
                    className={`flex-1 border py-4 rounded-xl items-center ${hasDeadline === option ? 'bg-primary border-primary' : 'border-border'}`}
                  >
                    <View className="flex-row items-center">
                      {hasDeadline === option && <Ionicons name="checkmark-circle" size={16} color="#fff" />}
                      <Text className={`${hasDeadline === option ? 'text-surface' : 'text-text'} text-caption ml-1`}>
                        {option ? `${t('postWork.yes')}` : `${t('postWork.no')}`}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View> */}

            
                <View>
                  {/* Start Date & Time */}
                  <View className="mb-2">
                    {/* <Text className="text-body text-text font-bold">
                      {currentLanguage === 'la' ? 'ວັນທີ ແລະ ເວລາເລີ່ມຕົ້ນ' : 'Start Date & Time'}
                    </Text> */}
                    <View className="flex-row items-end gap-2">
                      <View className="flex-1">
                        <FormInput
                          label={t('editWork.deadline.from')}
                          placeholder={t('editWork.deadline.toPlaceholder')}
                          value={fromDateString}
                          inputClassName={'border-border'}
                          ref={fromInputRef}
                          isDate={true}
                          // onChangeText={(text) => {
                          //   setFromDateString(text);
                          //   updateFromDate(text, fromTimeString);
                          // }}
                          onChangeText={handleFromDateChange}
                          onBlur={handleFromDateBlur}
                        />
                      </View>

                      <View className="w-24">
                        <FormInput
                          // label=""
                          placeholder={currentLanguage === 'la' ? 'ຊມ:ນທ' : 'HH:MM'}
                          value={fromTimeString}
                          inputClassName={'border-border'}
                          isTime={true}
                          // onChangeText={(text) => {
                          //   setFromTimeString(text);
                          //   updateFromDate(fromDateString, text);
                          // }}

                          onChangeText={handleFromTimeChange}
                          onBlur={handleFromTimeBlur}
                        />
                      </View>

                      <TouchableOpacity
                        onPress={() => {
                          setTempFromDate(fromDate || new Date());
                          setShowFromPicker(true);
                        }}
                        className="bg-blue-200 flex justify-center items-center rounded-full p-4"
                      >
                        <MaterialIcons name="calendar-month" size={24} color="#2563EB" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* End Date & Time */}
                  <View className="mb-4">

                    <View className="flex-row items-end gap-2">
                      <View className="flex-1">
                        <FormInput
                          label={t('editWork.deadline.to')}
                          placeholder={currentLanguage === 'la' ? 'ວ/ດ/ປປປປ' : 'dd/mm/yyyy'}
                          value={toDateString}
                          inputClassName={'border-border'}
                          ref={toInputRef}
                          isDate={true}
                          // onChangeText={(text) => {
                          //   setToDateString(text);
                          //   updateToDate(text, toTimeString);
                          // }}

                          onChangeText={handleToDateChange}
                          onBlur={handleToDateBlur}

                        />
                      </View>

                      <View className="w-24">
                        <FormInput
                          label=""
                          placeholder={currentLanguage === 'la' ? 'ຊມ:ນທ' : 'HH:MM'}
                          value={toTimeString}
                          inputClassName={'border-border'}
                          isTime={true}
                          // onChangeText={(text) => {
                          //   setToTimeString(text);
                          //   updateToDate(toDateString, text);
                          // }}

                          onChangeText={handleToTimeChange}
                          onBlur={handleToTimeBlur}
                          // isValidate='date is less than start'
                        />
                      </View>
                    

                      <TouchableOpacity
                        onPress={() => {
                          setTempToDate(toDate || new Date());
                          setShowToPicker(true);
                        }}
                        className="bg-blue-200 flex justify-center items-center rounded-full p-4 "
                      >
                        <MaterialIcons name="calendar-month" size={24} color="#2563EB" />
                      </TouchableOpacity>
                    </View>
                    {errors.toDate && 
                    
                      <View>
                        <Text className='text-caption text-error mt-1'>{toDateErrorMessage}</Text>
                      </View>
                    
                    }
                  </View>
                </View>
            

              {/* Date Picker Modals */}
              {showFromPicker && (
                <DatePicker
                  visible={showFromPicker}
                  date={fromDate}
                  tempDate={tempFromDate}
                  setTempDate={setTempFromDate}
                  mode="datetime"
                  setDate={(date: Date) => {
                    setFromDate(date);
                    setFromDateString(formatDateForDisplay(date));
                    setFromTimeString(formatTimeForDisplay(date));
                    setErrors(prev => ({ ...prev, toDate: false }));
                    setToDateErrorMessage('');
                  }}
                  onClose={() => {
                    setShowFromPicker(false);
                  }}
                />
              )}

              {showToPicker && (
                <DatePicker
                  visible={showToPicker}
                  date={toDate}
                  tempDate={tempToDate}
                  setTempDate={setTempToDate}
                  mode="datetime"
                  setDate={(date: Date) => {
                    setToDate(date);
                    setToDateString(formatDateForDisplay(date));
                    setToTimeString(formatTimeForDisplay(date));
                    setErrors(prev => ({ ...prev, toDate: false }));
                    setToDateErrorMessage('');
                  }}
                  onClose={() => {
                    setShowToPicker(false);
                  }}
                />
              )}
            </View>

            {/* Optional Address Selection */}
            <View className='bg-blue-50 p-4 rounded-2xl mb-2'>
              <Text className="text-body text-text font-bold mb-2">{t('customerProfile.locationInfo')}</Text>

              <View className='bg-blue-50 rounded-2xl'>
                <Dropdown
                  label={t('kyc.step4.location.province.label')}
                  value={selectedProvince?.province_la}
                  placeholder={t('kyc.step4.location.province.placeholder')}
                  options={provinceOptions}
                  onSelect={handleProvinceSelect}
                />
              </View>

              <View className='mt-3'>
                <Dropdown
                  label={t('kyc.step4.location.district.label')}
                  value={selectedDistrict?.district_la}
                  placeholder={t('kyc.step4.location.district.placeholder')}
                  options={districtOptions}
                  onSelect={handleDistrictSelect}
                  disabled={!selectedProvince}
                />
              </View>

              <View className='mt-3'>
                <FormInput
                  label={t('kyc.step4.location.village.label')}
                  value={village}
                  onChangeText={setVillage}
                  placeholder={t('kyc.step4.location.village.placeholder')}
                  inputClassName={selectedDistrict ? 'border-border' : 'border-gray-200'}
                />
              </View>
            </View>

            {workType === 'ONLINE' && (
              <SubWorkDetailsInput
                subWorkDetails={subWorkDetails}
                setSubWorkDetails={setSubWorkDetails}
              />
            )}
          </KeyboardAwareScrollView>
        </KeyboardAvoidingView>
      </ScreenWrapper>
    </>
  );
}
