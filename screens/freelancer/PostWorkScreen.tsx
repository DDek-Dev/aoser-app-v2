import { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,

  KeyboardAvoidingView,
  Platform,

  TextInput,

} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import {  useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { FreelancerStackParamList } from 'types/navigation';

import FormInput from 'components/ui/Input';

import TextArea from 'components/ui/TextArea';
import SelectInput from 'components/ui/SelectInput';

import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import DatePicker from 'components/ui/DatePicker';

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
  const [hasDeadline, setHasDeadline] = useState(true);
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
  const [budgetType, setBudgetType] = useState<'FIXED_PRICE' | 'HOURLY'>('FIXED_PRICE');

  // 🔄 UPDATED: Change date state to allow null values initially
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [tempFromDate, setTempFromDate] = useState(new Date());
  const [tempToDate, setTempToDate] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);


const {t} = useTranslation();
  const [errors, setErrors] = useState({
    nameOfWork: false,
    workDetail: false,
    budget: false,
    category: false,
    dateInvalid: false,
    subcategories: false
  });


  const currentLanguage: Language = getCurrentLanguage();


  const formatDateForDisplay = (date: Date | null): string => {
    if (!date) {
      return currentLanguage === 'la' ? 'ວ/ດ/ປ' : 'mm/dd/yy';
    }
    return formatDate(date.toISOString(), currentLanguage);
  };


  // handle submit
  const handleSubmit = () => {
    const dateInvalid = hasDeadline && (
      !fromDate ||
      !toDate ||
      (fromDate && toDate && toDate < fromDate)
    );

    const newErrors = {
      nameOfWork: nameOfWork.trim() === '',
      workDetail: workDetail.trim() === '',
      budget: budget === 0 && budget === null,
      category: category.trim() === '',
      subcategories: subcategories.length === 0,
      dateInvalid,
    };
    setErrors(newErrors);

    // Auto-add pending subtask
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
      deadLine: toDate?.toISOString() || null,
      startDate: fromDate?.toISOString() || null,
      subWorkDetails,
      currency: budgetCurrency,
      budgetType,
      serviceType: category,
      jobs: subcategories,
    };

    navigation.navigate('ConfirmBookingScreen', { formData });
  };




  return (
    <>
      <ScreenWrapper safeEdges={['top']} style={{ backgroundColor: 'white' }} >

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} className=' rounded-lg'>
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

              <FormInput label={t('postWork.sample_work')} placeholder={t('postWork.sample_work_placeholder')} inputClassName="border-border" />
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
                isValidate={errors.category ? `${t('postWork.service_type_required')}` : ''}
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
                    className={`flex-1 border py-4 rounded-xl items-center ${budgetType === type ? 'border-primary bg-blue-50' : 'border-border'
                      }`}
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
                isValidate={`${errors.budget ? `${t('postWork.budget_required')}` : ''}`}
                required

              />
            </View>



            <View className='bg-blue-50 p-4 rounded-2xl mb-4'>
              <Text className="text-body mb-1 text-text font-bold">{t('postWork.deadline_requirement')}</Text>
              <View className="flex-row mb-4 space-x-4 gap-2">
                {[true, false].map((option) => (
                  <TouchableOpacity
                    key={option ? 'yes' : 'no'}
                    onPress={() => setHasDeadline(option)}
                    className={`flex-1 border py-4 rounded-xl items-center ${hasDeadline === option ? 'border-primary' : 'border-gray-300'}`}
                  >
                    <View className="flex-row items-center">
                      {hasDeadline === option && <Ionicons name="checkmark-circle" size={16} color="#2563EB" />}
                      <Text className="text-sm ml-1">{option ? `${t('postWork.yes')}` : `${t('postWork.no')}`}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>


              {/* 🔄 UPDATED: Date section with proper formatting */}
              {hasDeadline && (
                <>
                  <View className="flex-row justify-between items-center">
                    <View className="flex-1 mr-2">
                      <FormInput
                        label={currentLanguage === 'la' ? 'ຈາກວັນທີ' : 'From'}
                        placeholder={currentLanguage === 'la' ? 'ວ/ດ/ປ' : 'mm/dd/yy'}
                        value={formatDateForDisplay(fromDate)}
                        inputClassName={errors.dateInvalid ? 'border-error' : 'border-border'}
                        ref={fromInputRef}
                        editable={false}
                        pointerEvents="none"
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
                        label={currentLanguage === 'la' ? 'ຫາວັນທີ' : 'To'}
                        placeholder={currentLanguage === 'la' ? 'ວ/ດ/ປ' : 'mm/dd/yy'}
                        value={formatDateForDisplay(toDate)}
                        inputClassName={errors.dateInvalid ? 'border-error' : 'border-border'}
                        ref={toInputRef}
                        editable={false}
                        pointerEvents="none"
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

                  {/* 🔄 UPDATED: Error message with language support */}
                  {errors.dateInvalid && (
                    <Text className="text-error text-caption mb-2">
                      {!fromDate || !toDate
                        ? (currentLanguage === 'la' ? 'ກະລຸນາເລືອກວັນທີເລີ່ມຕົ້ນແລະສິ້ນສຸດ' : 'Please select both start and end dates')
                        : (currentLanguage === 'la' ? 'ວັນທີສິ້ນສຸດຕ້ອງຫຼັງຈາກວັນທີເລີ່ມຕົ້ນ' : 'End date must be after start date')
                      }
                    </Text>
                  )}
                </>
              )}

              {/* Date Picker Modals */}
              {showFromPicker && (
                <DatePicker
                  visible={showFromPicker}
                  date={fromDate || new Date()}
                  tempDate={tempFromDate}
                  setTempDate={setTempFromDate}
                  setDate={(date: Date) => {
                    setFromDate(date); // This will trigger re-render with new formatted date
                  }}
                  onClose={() => {
                    setShowFromPicker(false);
                    setTimeout(() => fromInputRef.current?.focus(), 100);
                  }}
                />
              )}

              {showToPicker && (
                <DatePicker
                  visible={showToPicker}
                  date={toDate || new Date()}
                  tempDate={tempToDate}
                  setTempDate={setTempToDate}
                  setDate={(date: Date) => {
                    setToDate(date); // This will trigger re-render with new formatted date
                  }}
                  onClose={() => {
                    setShowToPicker(false);
                    setTimeout(() => toInputRef.current?.focus(), 100);
                  }}
                />
              )}
            </View>





            {workType === 'ONLINE' && (
              <SubWorkDetailsInput
                subWorkDetails={subWorkDetails}
                setSubWorkDetails={setSubWorkDetails}
              />
            )}






          </KeyboardAwareScrollView>


          {/* </KeyboardAwareScrollView> */}
        </KeyboardAvoidingView>

      </ScreenWrapper>
    </>
  );
}