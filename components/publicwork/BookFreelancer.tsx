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

  ScrollView
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { FreelancerStackParamList } from 'types/navigation';
import { getCategories, useFreelancerById } from 'hooks/useFreelancer';
import FormInput from 'components/ui/Input';
import TextArea from 'components/ui/TextArea';
import SelectInput from 'components/ui/SelectInput';
import DatePicker from 'components/ui/DatePicker';
import BudgetInput from 'components/ui/BudgetInput';
import { SubWorkDetail } from 'types';
import SubWorkDetailsInput from 'components/ui/SubTaskInputList';
import { getCurrentLanguage, Language } from 'utils/dateFormatter';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import Header_back from 'components/ui/Header_back';
import { useTranslation } from 'react-i18next';
import { profileImage } from 'assets';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type BookFreelancerRouteProp = RouteProp<FreelancerStackParamList, 'Bookfreelancer'>;

type Props = {
  route: BookFreelancerRouteProp;
};

const IMAGE_BASE = process.env.EXPO_PUBLIC_IMAGES_URL;

const BookFreelancer = ({ route }: Props) => {
  type SearchBarNavigationProp = NativeStackNavigationProp<FreelancerStackParamList>;
  const navigation = useNavigation<SearchBarNavigationProp>();
  const insets = useSafeAreaInsets();
  const [workType, setWorkType] = useState<'ONLINE' | 'OFFLINE'>('ONLINE');
  const [hasDeadline, setHasDeadline] = useState(true);
  const [subWorkDetails, setSubWorkDetails] = useState<SubWorkDetail[]>([]);
  const [subTasks, setSubTasks] = useState<string[]>([]);
  const [newSubTask, setNewSubTask] = useState('');
  const [category, setCategory] = useState('');
  const [nameOfWork, setNameOfWork] = useState('');
  const [workDetail, setWorkDetail] = useState('');
  const [budget, setBudget] = useState<number | 0>(0);
  const [budgetCurrency, setBudgetCurrency] = useState<'LAK' | 'USD'>('LAK');
  const fromInputRef = useRef<TextInput>(null);
  const toInputRef = useRef<TextInput>(null);
  const categoryRef = useRef<{ focus: () => void }>(null);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [budgetType, setBudgetType] = useState<'FIXED_PRICE' | 'HOURLY'>('FIXED_PRICE');

  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [fromDateText, setFromDateText] = useState('');
  const [toDateText, setToDateText] = useState('');
  const [tempFromDate, setTempFromDate] = useState(new Date());
  const [tempToDate, setTempToDate] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const [errors, setErrors] = useState({
    nameOfWork: false,
    workDetail: false,
    budget: false,
    category: false,
    dateInvalid: false,
    subcategories: false
  });

  const userId = route.params.userId;
  const currentLanguage: Language = getCurrentLanguage();

  const { t } = useTranslation();
  const { data: freelancer, isLoading } = useFreelancerById(userId);

  // Parse date from text input (dd/mm/yyyy or ວ/ດ/ປ format)
  const parseDateFromText = (text: string): Date | null => {
    const cleaned = text.replace(/[^\d]/g, '');
    if (cleaned.length !== 8) return null;

    const day = parseInt(cleaned.substring(0, 2), 10);
    const month = parseInt(cleaned.substring(2, 4), 10);
    const year = parseInt(cleaned.substring(4, 8), 10);

    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) return null;

    const date = new Date(year, month - 1, day);

    if (date.getDate() !== day || date.getMonth() !== month - 1) return null;

    return date;
  };

  // Format date for display
  const formatDateForDisplay = (date: Date | null): string => {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear());

    return `${day}/${month}/${year}`;
  };

  // Handle from date text change
  const handleFromDateChange = (text: string) => {
    const cleaned = text.replace(/[^\d]/g, '');
    let formatted = '';

    if (cleaned.length > 0) {
      formatted = cleaned.substring(0, 2);
      if (cleaned.length >= 3) {
        formatted += '/' + cleaned.substring(2, 4);
      }
      if (cleaned.length >= 5) {
        formatted += '/' + cleaned.substring(4, 8);
      }
    }

    setFromDateText(formatted);

    if (cleaned.length === 8) {
      const parsedDate = parseDateFromText(formatted);
      if (parsedDate) {
        setFromDate(parsedDate);
      }
    } else {
      setFromDate(null);
    }
  };

  // Handle to date text change
  const handleToDateChange = (text: string) => {
    const cleaned = text.replace(/[^\d]/g, '');
    let formatted = '';

    if (cleaned.length > 0) {
      formatted = cleaned.substring(0, 2);
      if (cleaned.length >= 3) {
        formatted += '/' + cleaned.substring(2, 4);
      }
      if (cleaned.length >= 5) {
        formatted += '/' + cleaned.substring(4, 8);
      }
    }

    setToDateText(formatted);

    if (cleaned.length === 8) {
      const parsedDate = parseDateFromText(formatted);
      if (parsedDate) {
        setToDate(parsedDate);
      }
    } else {
      setToDate(null);
    }
  };

  // Handle deadline requirement change
  const handleDeadlineChange = (value: boolean) => {
    setHasDeadline(value);
    if (!value) {
      setFromDate(null);
      setToDate(null);
      setFromDateText('');
      setToDateText('');
      setErrors(prev => ({ ...prev, dateInvalid: false }));
    }
  };

  const handleSubmit = () => {
    const dateInvalid = hasDeadline && (
      !fromDate ||
      !toDate ||
      (fromDate && toDate && toDate < fromDate)
    );

    const newErrors = {
      nameOfWork: nameOfWork.trim() === '',
      workDetail: workDetail.trim() === '',
      budget: budget === 0,
      category: category.trim() === '',
      subcategories: subcategories.length === 0,
      dateInvalid,
    };
    setErrors(newErrors);

    let finalSubTasks = [...subTasks];
    if (newSubTask.trim() && !subTasks.includes(newSubTask.trim())) {
      finalSubTasks = [...subTasks, newSubTask.trim()];
      setSubTasks(finalSubTasks);
      setNewSubTask('');
    }

    const hasError = Object.values(newErrors).some(Boolean);
    if (hasError) return;

    const formData = {
      workTitle: nameOfWork,
      description: workDetail,
      budget,
      category,
      kindOfWork: workType,
      deadLine: hasDeadline && toDate ? toDate.toISOString() : null,
      startDate: hasDeadline && fromDate ? fromDate.toISOString() : null,
      subWorkDetails,
      currency: budgetCurrency,
      budgetType,
      serviceType: category,
      jobs: subcategories,
      address:{
        province: '',
        district: '',
        village: '',
        country: '',
      }
    };

    navigation.navigate('ConfirmBookingScreen', { formData });
  };

  const categories = getCategories();

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
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <ScreenWrapper safeEdges={['top']} style={{ backgroundColor: 'white', flex: 1 }}>
        <Header_back
          text={t('postWork.book_freelancer')}
          onPress={handleBack}
          iconColor='#3B82F6'
          backgroundColor='bg-surface'
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'height' : 'padding'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            // contentContainerStyle={{ paddingBottom: 100 }}
      
          >
            <View className='px-4'>
              {freelancer && (
                <View className="flex-row items-center bg-primary p-4 rounded-2xl mb-6">
                  <Image
                    source={freelancer?.userProfileImage ? { uri: IMAGE_BASE + freelancer?.userProfileImage } : profileImage}
                    className="w-14 h-14 rounded-full border-2 border-white mr-4"
                  />
                  <View className='flex-col gap-1'>
                    <Text className="font-semibold text-surface text-body">{freelancer?.firstName}</Text>
                    <Text className="text-surface text-caption">{freelancer?.jobTitle}</Text>
                    <Text className="text-caption text-warning">⭐ {freelancer?.starRating} {t('freelancer_profile.reviews')}</Text>
                  </View>
                </View>
              )}

              <View className='bg-blue-50 p-4 rounded-2xl mb-6'>
                <FormInput
                  label={t('postWork.work_title')}
                  placeholder={t('postWork.work_title_placeholder')}
                  value={nameOfWork}
                  onChangeText={setNameOfWork}
                  inputClassName={errors.nameOfWork ? 'border-error' : 'border-border'}
                  required
                  isValidate={`${errors.nameOfWork ? `${t('postWork.work_title_required')}` : ''}`}
                />

                <Text className="text-caption text-text my-1 font-bold">{t('postWork.work_type')}</Text>
                <View className="flex-row mb-4 space-x-4 gap-2">
                  {['ONLINE', 'OFFLINE'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setWorkType(type as 'ONLINE' | 'OFFLINE')}
                      className={`flex-1 border py-4 rounded-xl items-center ${workType === type ? 'border-primary' : 'border-border'}`}
                    >
                      <View className="flex-row items-center">
                        {workType === type && <Ionicons name="checkmark-circle" size={16} color="#3B82F6" />}
                        <Text className="text-caption text-text capitalize ml-1">{type === "ONLINE" ? `${t('postWork.online')}` : `${t('postWork.offline')}`}</Text>
                      </View>
                    </TouchableOpacity>
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

                <FormInput label={t('postWork.sample_work')} placeholder="Paste link or reference" inputClassName="border-border" />
              </View>

              <View className='bg-blue-50 p-4 rounded-2xl mb-4'>
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
                  isValidate={errors.category ?  `${t('postWork.service_type_required')}` : ''}
                  ref={categoryRef}
                />
              </View>

              <View className="bg-blue-50 p-4 rounded-2xl mb-4">
                <Text className="text-body mb-2 text-text font-bold">{t('postWork.budget_type')}</Text>
                <View className="flex-row space-x-4 gap-2 mb-6">
                  {['FIXED_PRICE', 'HOURLY'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setBudgetType(type as 'FIXED_PRICE' | 'HOURLY')}
                      className={`flex-1 border py-4 rounded-xl items-center ${budgetType === type ? 'border-primary bg-blue-50' : 'border-border'}`}
                    >
                      <View className="flex-row items-center gap-2">
                        {budgetType === type && <Ionicons name="checkmark-circle" size={16} color="#3B82F6" />}
                        <Text className="text-caption text-text">
                          {type === 'FIXED_PRICE' ? `${t('postWork.fixed_price')}` : `${t('postWork.hourly')}`}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                <BudgetInput
                  label={t('postWork.budget')}
                  value={budget}
                  onChange={setBudget}
                  currency={budgetCurrency}
                  onCurrencyChange={setBudgetCurrency}
                  error={errors.budget}
                  isValidate={`${errors.budget ?`${t('postWork.budget_required')}` : ''}`}
                  required
                />
              </View>

              <View className='bg-blue-50 p-4 rounded-2xl mb-4'>
                <Text className="text-body mb-1 text-text font-bold">{t('postWork.deadline_requirement')}</Text>
                <View className="flex-row mb-4 space-x-4 gap-2">
                  {[true, false].map((option) => (
                    <TouchableOpacity
                      key={option ? 'yes' : 'no'}
                      onPress={() => handleDeadlineChange(option)}
                      className={`flex-1 border py-4 rounded-xl items-center ${hasDeadline === option ? 'border-primary' : 'border-gray-300'}`}
                    >
                      <View className="flex-row items-center">
                        {hasDeadline === option && <Ionicons name="checkmark-circle" size={16} color="#2563EB" />}
                        <Text className="text-sm ml-1">{option ? `${t('postWork.yes')}` : `${t('postWork.no')}`}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                {hasDeadline && (
                  <>
                    <View className="flex-row justify-between items-center mb-4">
                      <View className="flex-1 mr-2">
                        <FormInput
                          label={currentLanguage === 'la' ? 'ເລີ່ມ' : 'Start'}
                          placeholder={currentLanguage === 'la' ? 'ວ/ດ/ປ' : 'dd/mm/yy'}
                          value={fromDateText}
                          onChangeText={handleFromDateChange}
                          inputClassName={errors.dateInvalid ? 'border-error' : 'border-border'}
                          ref={fromInputRef}
                          keyboardType="numeric"
                          maxLength={10}
                        />
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          setTempFromDate(fromDate || new Date());
                          setShowFromPicker(true);
                        }}
                        className="bg-blue-200 mt-1 flex justify-center items-center rounded-full p-4"
                      >
                        <MaterialIcons name="calendar-month" size={24} color="#2563EB" />
                      </TouchableOpacity>
                    </View>

                    <View className="flex-row justify-between mb-4 items-center">
                      <View className="flex-1 mr-2">
                        <FormInput
                          label={currentLanguage === 'la' ? 'ຫາ' : 'To'}
                          placeholder={currentLanguage === 'la' ? 'ວ/ດ/ປ' : 'dd/mm/yy'}
                          value={toDateText}
                          onChangeText={handleToDateChange}
                          inputClassName={errors.dateInvalid ? 'border-error' : 'border-border'}
                          ref={toInputRef}
                          keyboardType="numeric"
                          maxLength={10}
                        />
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          setTempToDate(toDate || new Date());
                          setShowToPicker(true);
                        }}
                        className="bg-blue-200 mt-2 flex justify-center items-center rounded-full p-4"
                      >
                        <MaterialIcons name="calendar-month" size={24} color="#2563EB" />
                      </TouchableOpacity>
                    </View>

                    {errors.dateInvalid && (
                      <Text className="text-error text-caption mb-2">
                        {!fromDate || !toDate
                          ? (currentLanguage === 'la' ? 'ກະລຸນາເລືອກວັນທີເລີ່ມຕົ້ນແລະສິ້ນສຸດ' : 'Please select both start and end dates')
                          : (currentLanguage === 'la' ? 'ວັນທີສິ້ນສຸດຕ້ອງຢູ່ຫຼັງວັນທີເລີ່ມຕົ້ນ' : 'End date must be after start date')
                        }
                      </Text>
                    )}
                  </>
                )}

                {showFromPicker && (
                  <DatePicker
                    visible={showFromPicker}
                    date={fromDate || new Date()}
                    tempDate={tempFromDate}
                    setTempDate={setTempFromDate}
                    setDate={(date: Date) => {
                      setFromDate(date);
                      setFromDateText(formatDateForDisplay(date));
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
                    setDate={(date: Date) => {
                      setToDate(date);
                      setToDateText(formatDateForDisplay(date));
                    }}
                    onClose={() => setShowToPicker(false)}
                  />
                )}
              </View>

              {workType === 'ONLINE' && (
                <SubWorkDetailsInput
                  subWorkDetails={subWorkDetails}
                  setSubWorkDetails={setSubWorkDetails}
                />
              )}
            </View>
          </ScrollView>
          <View className="px-5 pb-4 bg-white">
            <TouchableOpacity onPress={handleSubmit} className="bg-blue-600 py-4 rounded-xl items-center">
              <Text className="text-white font-semibold text-base">{t('postWork.next')}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
          <View className="h-20"></View>

      </ScreenWrapper>
    </View>
  );
};

export default BookFreelancer;