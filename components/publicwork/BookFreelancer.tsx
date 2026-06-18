import { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  TextInput,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { FreelancerStackParamList, TabParamList } from 'types/navigation';
import { useFreelancerById } from 'hooks/useFreelancer';
import FormInput from 'components/ui/Input';
import TextArea from 'components/ui/TextArea';
import SelectInput from 'components/ui/SelectInput';
import DatePicker from 'components/ui/DatePicker';
import BudgetInput from 'components/ui/BudgetInput';
import { BookingFormData, SubWorkDetail } from 'types';
import SubWorkDetailsInput from 'components/ui/SubTaskInputList';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import Header_back from 'components/ui/Header_back';
import { useTranslation } from 'react-i18next';
import { profileImage } from 'assets';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Dropdown from 'components/filter/Dropdown';
import { useSelectAddress } from 'hooks/useSelectAddress';
import { getCurrentLanguage, Language } from 'utils/dateFormatter';
import { useCreatePublicWork } from 'hooks/usePublicWork';
import { ALERT_TYPE, Toast } from 'react-native-alert-notification';

type BookFreelancerRouteProp = RouteProp<FreelancerStackParamList, 'Bookfreelancer'>;

type Props = {
  route: BookFreelancerRouteProp;
};

const IMAGE_BASE = process.env.EXPO_PUBLIC_IMAGES_URL;

const BookFreelancer = ({ route }: Props) => {

  const navigate = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();

  const [workType, setWorkType] = useState<'ONLINE' | 'OFFLINE'>('ONLINE');

  const [subWorkDetails, setSubWorkDetails] = useState<SubWorkDetail[]>([]);
  
  // const [category, setCategory] = useState('');
  const [nameOfWork, setNameOfWork] = useState('');
  const [workDetail, setWorkDetail] = useState('');
  const [budget, setBudget] = useState<number>(0);
  const [budgetCurrency, setBudgetCurrency] = useState<'LAK' | 'USD'>('LAK');
  const fromInputRef = useRef<TextInput>(null);
  const toInputRef = useRef<TextInput>(null);
  // const categoryRef = useRef<{ focus: () => void }>(null);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [budgetType, setBudgetType] = useState<'FIXED_PRICE' | 'HOURLY' | 'OFFERING'>('FIXED_PRICE');

  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [tempFromDate, setTempFromDate] = useState(new Date());
  const [tempToDate, setTempToDate] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [fromDateString, setFromDateString] = useState('');
  const [fromTimeString, setFromTimeString] = useState('');
  const [toDateString, setToDateString] = useState('');
  const [toTimeString, setToTimeString] = useState('');

  const { data: addressData } = useSelectAddress();
  const [selectedProvince, setSelectedProvince] = useState<any>(undefined);
  const [selectedDistrict, setSelectedDistrict] = useState<any>(undefined);
  const [village, setVillage] = useState('');
  const [place, setPlace] = useState('');

  const [errors, setErrors] = useState({
    nameOfWork: false,

    // category: false,
    toDate: false,
  });
  const [toDateErrorMessage, setToDateErrorMessage] = useState('');
  const currentLanguage: Language = getCurrentLanguage();

  const userId = route.params.userId;
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { data: freelancer, isLoading } = useFreelancerById(userId);
  const createPublicWorkMutation = useCreatePublicWork();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setNameOfWork('');
    setWorkDetail('');
    setBudget(0);
    setWorkType('ONLINE');
    setSubWorkDetails([]);
    // setCategory('');
    setSubcategories([]);
    setBudgetType('FIXED_PRICE');
    setFromDate(null);
    setToDate(null);
    setFromDateString('');
    setFromTimeString('');
    setToDateString('');
    setToTimeString('');
    setSelectedProvince(undefined);
    setSelectedDistrict(undefined);
    setVillage('');
    setPlace('');
    setErrors({
      nameOfWork: false,
      // category: false,
      toDate: false,
    });
    setToDateErrorMessage('');
  };

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

  // ─── Existing parse helpers (unchanged) ─────────────────────────────────────
  const parseDate = (dateString: string): Date | null => {
    if (!dateString || dateString.length < 8) return null;

    const parts = dateString.split('/');
    if (parts.length !== 3) return null;

    const [part1, part2, year] = parts;
    const day = parseInt(part1, 10);
    const month = parseInt(part2, 10);
    const yearNum = parseInt(year, 10);

    if (isNaN(day) || isNaN(month) || isNaN(yearNum)) return null;
    if (day < 1 || day > 31) return null;
    if (month < 1 || month > 12) return null;
    if (yearNum < 1900 || yearNum > 2100) return null;

    const date = new Date(yearNum, month - 1, day);
    if (isNaN(date.getTime())) return null;
    return date;
  };

  const parseTime = (timeString: string): { hours: number; minutes: number } | null => {
    if (!timeString || timeString.length < 3) return null;

    const parts = timeString.split(':');
    if (parts.length !== 2) return null;

    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);

    if (isNaN(hours) || isNaN(minutes)) return null;
    if (hours < 0 || hours > 23) return null;
    if (minutes < 0 || minutes > 59) return null;

    return { hours, minutes };
  };

  const combineDateAndTime = (dateString: string, timeString: string): Date | null => {
    const parsedDate = parseDate(dateString);
    if (!parsedDate) return null;

    const parsedTime = parseTime(timeString);
    if (!parsedTime) return parsedDate;

    parsedDate.setHours(parsedTime.hours, parsedTime.minutes, 0, 0);
    return parsedDate;
  };

  const updateFromDate = (dateStr: string, timeStr: string) => {
    setFromDate(combineDateAndTime(dateStr, timeStr));
  };

  const updateToDate = (dateStr: string, timeStr: string) => {
    setToDate(combineDateAndTime(dateStr, timeStr));
  };

  const formatDateForDisplay = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

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

  // ─── Address helpers ─────────────────────────────────────────────────────────
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


  // ─── Submit ──────────────────────────────────────────────────────────────────
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

      // budget: budget === 0 || budget === null,
      // category: category.trim() === '',
      toDate: dateInvalid,
    };
    setErrors(newErrors);
    setToDateErrorMessage(dateValidationMessage);

    const hasError = Object.values(newErrors).some(Boolean);
    if (hasError) return;

    submitData();
  };

  const submitData = async () => {
    // Determine the actual budget type locally to avoid using stale state
    const effectiveBudgetType = (budget === 0 || budget === null) ? 'OFFERING' : budgetType;

    const payload: BookingFormData = {
      workTitle: nameOfWork.trim(),
      description: workDetail,
      budget: budget > 0 ? budget : 0,
      kindOfWork: workType,
      currency: budgetCurrency,
      budgetType: effectiveBudgetType,
      // serviceType: category,
      assignedTo: userId,
    };

    if (place) payload.place = place;
    if (toDate) payload.deadLine = toDate.toISOString();
    if (fromDate) payload.startDate = fromDate.toISOString();
    if (subcategories.length > 0) payload.jobs = subcategories;
    if (subWorkDetails.length > 0) payload.subWorkDetails = subWorkDetails;

    if (selectedProvince) {
      payload.address = {
        country: 'Laos',
        province: selectedProvince.province_la,
        ...(selectedDistrict && { district: selectedDistrict.district_la }),
        ...(village.trim() && { village: village.trim() }),
      };
    }

    setIsSubmitting(true);
    try {
      const result = await createPublicWorkMutation.mutateAsync(payload);

      if (result?.error) {
        Toast.show({
          type: ALERT_TYPE.DANGER,
          title: t('postWork.confirm.error'),
          textBody: result.error,
        });
        return;
      }

      resetForm();

      Toast.show({
        type: ALERT_TYPE.SUCCESS,
        title: t('postWork.confirm.success'),
        textBody: t('postWork.confirm.work_created_successfully'),
      });

      navigate.replace('HistoryScreen');
    } catch (error) {
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: t('postWork.confirm.error'),
        textBody: t('postWork.confirm.network_error'),
      });
      console.log('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Guards ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#2563EB" />
      </SafeAreaView>
    );
  }

  if (!freelancer) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <Text className="text-red-500">{t('postWork.freelancer_no_found')}</Text>
      </SafeAreaView>
    );
  }

  const handleBack = () => {
    navigate.goBack();
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <ScreenWrapper safeEdges={['top', 'bottom']} style={{ backgroundColor: 'white', flex: 1 }}>
        <Header_back
          text={t('postWork.book_freelancer')}
          onPress={handleBack}
          iconColor="#3B82F6"
          backgroundColor="bg-surface"
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        // keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 110}

        >
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View className="px-2">
              {freelancer && (
                <View className="flex-row items-center bg-primary p-6 rounded-2xl mb-2">
                  <Image
                    source={
                      freelancer?.userProfileImage
                        ? { uri: IMAGE_BASE + freelancer?.userProfileImage }
                        : profileImage
                    }
                    className="w-14 h-14 rounded-full border-2 border-white mr-4"
                  />
                  <View className="flex-col gap-1">
                    <Text className="font-semibold text-surface text-body">{freelancer?.firstName} {freelancer?.lastName}</Text>
                    <Text className="text-surface text-caption" numberOfLines={1}>{freelancer?.jobTitle}</Text>

                  </View>
                </View>
              )}

              {/* <View className="bg-blue-50 p-2 rounded-2xl mb-2">
                <SelectInput
                  label={t('postWork.service_type')}
                  value={category}
                  initialSubcategories={subcategories}
                  onSelect={(serviceTypeId, jobIds) => {
                    setCategory(serviceTypeId);
                    setSubcategories(jobIds);
                  }}
                  required
                  inputClassName={errors.category ? 'border-error' : 'border-border'}
                  isValidate={errors.category ? `${t('postWork.service_type_required')}` : ''}
                  ref={categoryRef}
                />
              </View> */}

              <View className="bg-blue-50 px-2 rounded-2xl mb-2">
                <FormInput
                  label={t('postWork.work_title')}
                  placeholder={t('postWork.work_title_placeholder')}
                  value={nameOfWork}
                  onChangeText={setNameOfWork}
                  inputClassName={errors.nameOfWork ? 'border-error' : 'border-border'}
                  required
                  isValidate={`${errors.nameOfWork ? `${t('postWork.work_title_required')}` : ''}`}
                />

                <Text className="text-body mt-2 text-text my-1 font-bold">{t('postWork.work_type')}</Text>
                <View className="flex-row mb-2 space-x-4 gap-2">
                  {['ONLINE', 'OFFLINE'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setWorkType(type as 'ONLINE' | 'OFFLINE')}
                      className={`flex-1 border py-4 rounded-xl items-center ${workType === type ? 'border-primary bg-primary' : 'border-border'}`}
                    >
                      <View className="flex-row items-center">
                        {workType === type && <Ionicons name="checkmark-circle" size={16} color="#fff" />}
                        <Text className={`${workType === type ? 'text-white' : 'text-text'} text-caption capitalize ml-1`}>
                          {type === 'ONLINE' ? `${t('postWork.online')}` : `${t('postWork.offline')}`}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                <TextArea
                  label={t('postWork.work_description_req')}
                  placeholder={t('postWork.work_description_placeholder_req')}
                  value={workDetail}
                  onChangeText={setWorkDetail}
                  inputClassName={'border-border'}

                />
              </View>

              <View className="bg-blue-50 p-2 rounded-2xl mb-2">
                <Text className="text-body mb-2 text-text font-bold">{t('postWork.budget_type')}</Text>
                <View className="flex-row space-x-4 gap-2 mb-2">
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
                    <Text className="text-body text-primary font-bold mr-2">{t('workDetail.offering_price')}</Text>
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

              <View className="bg-blue-50 p-2 rounded-2xl mb-2">
                <Text className="text-body mb-1 text-text font-bold">{t('postWork.deadline_requirement')}</Text>



                <View>
                  {/* ── FROM ── */}
                  <View className="">
                    <View className="flex-row items-end gap-2">
                      <View className="flex-1">
                        <FormInput
                          label={t('editWork.deadline.from')}
                          placeholder={t('editWork.deadline.toPlaceholder')}
                          value={fromDateString}
                          inputClassName={'border-border'}

                          // inputClassName={errors.dateInvalid ? 'border-error' : 'border-border'}
                          ref={fromInputRef}
                          isDate={true}
                          onChangeText={handleFromDateChange}
                          onBlur={handleFromDateBlur}
                        />
                      </View>

                      <View className="w-24">
                        <FormInput
                          placeholder={currentLanguage === 'la' ? 'ຊມ:ນທ' : 'HH:MM'}
                          value={fromTimeString}
                          inputClassName={'border-border'}

                          // inputClassName={errors.dateInvalid ? 'border-error' : 'border-border'}
                          isTime={true}
                          onChangeText={handleFromTimeChange}
                          onBlur={handleFromTimeBlur}
                        />
                      </View>

                      <TouchableOpacity
                        onPress={() => {
                          setTempFromDate(fromDate || new Date());
                          setShowFromPicker(true);
                        }}
                        className="bg-blue-200 flex justify-center items-center rounded-full p-2"
                      >
                        <MaterialIcons name="calendar-month" size={24} color="#2563EB" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* ── TO ── */}
                  <View className="">
                    <View className="flex-row items-end gap-2">
                      <View className="flex-1">
                        <FormInput
                          label={t('editWork.deadline.to')}
                          placeholder={t('editWork.deadline.toPlaceholder')}
                          value={toDateString}
                          inputClassName={'border-border'}

                          // inputClassName={errors.dateInvalid ? 'border-error' : 'border-border'}
                          ref={toInputRef}
                          isDate={true}
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

                          // inputClassName={errors.dateInvalid ? 'border-error' : 'border-border'}
                          isTime={true}
                          onChangeText={handleToTimeChange}
                          onBlur={handleToTimeBlur}
                        />
                      </View>

                      <TouchableOpacity
                        onPress={() => {
                          setTempToDate(toDate || new Date());
                          setShowToPicker(true);
                        }}
                        className="bg-blue-200 flex justify-center items-center rounded-full p-2"
                      >
                        <MaterialIcons name="calendar-month" size={24} color="#2563EB" />
                      </TouchableOpacity>
                    </View>
                    {errors.toDate && (
                      <Text className="text-error text-caption mt-1">
                        {toDateErrorMessage}
                      </Text>
                    )}
                  </View>
                </View>


                {showFromPicker && (
                  <DatePicker
                    visible={showFromPicker}
                    date={fromDate || new Date()}
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
                    onClose={() => setShowFromPicker(false)}
                  />
                )}

                {showToPicker && (
                  <DatePicker
                    visible={showToPicker}
                    date={toDate || new Date()}
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
                    onClose={() => setShowToPicker(false)}
                  />
                )}
              </View>
              {workType === "OFFLINE" && (


                <View className="bg-blue-50 p-2 rounded-2xl mb-2">
                  <Text className="text-body text-text font-bold mb-2">{t('customerProfile.locationInfo')}</Text>

                  <View className="bg-blue-50 rounded-2xl">
                    <Dropdown
                      label={t('kyc.step4.location.province.label')}
                      value={selectedProvince?.province_la}
                      placeholder={t('kyc.step4.location.province.placeholder')}
                      options={provinceOptions}
                      onSelect={handleProvinceSelect}
                    />
                  </View>

                  <View className="">
                    <Dropdown
                      label={t('kyc.step4.location.district.label')}
                      value={selectedDistrict?.district_la}
                      placeholder={t('kyc.step4.location.district.placeholder')}
                      options={districtOptions}
                      onSelect={handleDistrictSelect}
                      disabled={!selectedProvince}
                    />
                  </View>

                  <View className="">
                    <FormInput
                      label={t('kyc.step4.location.village.label')}
                      value={village}
                      onChangeText={setVillage}
                      placeholder={t('kyc.step4.location.village.placeholder')}
                      inputClassName={selectedDistrict ? 'border-border' : 'border-gray-200'}
                    />
                  </View>

                  <View className=''>
                    <FormInput
                      label={t('postWork.address_manually_req')}
                      value={place}
                      onChangeText={setPlace}
                      placeholder={t('postWork.placeholder_address_manually')}
                      inputClassName={'border-border'}
                    />
                  </View>
                </View>
              )}

              {workType === 'ONLINE' && (
                <SubWorkDetailsInput subWorkDetails={subWorkDetails} setSubWorkDetails={setSubWorkDetails} isReq={true} />
              )}
            </View>
          </ScrollView>

          <View className="px-5  bg-white" style={{ paddingBottom: insets.bottom - 24 }}>
            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting}
              className={`bg-primary py-4 rounded-2xl items-center flex-row justify-center gap-2 ${isSubmitting ? 'opacity-70' : ''}`}
            >
              {isSubmitting && <ActivityIndicator color="white" size="small" />}
              <Text className="text-white font-semibold text-base">
                {isSubmitting ? t('postWork.sending') : t('postWork.send')}
              </Text>
            </Pressable>
          </View>

        </KeyboardAvoidingView>
      </ScreenWrapper>
    </View>
  );
};

export default BookFreelancer;
