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
  const [budgetType, setBudgetType] = useState<'FIXED_PRICE' | 'HOURLY' | 'OFFERING'>('FIXED_PRICE');

  // 🔄 UPDATED: Change date state to allow null values initially
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [tempFromDate, setTempFromDate] = useState(new Date());
  const [tempToDate, setTempToDate] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  // date 
  const [fromDateString, setFromDateString] = useState('');
  const [toDateString, setToDateString] = useState('');

  const { t } = useTranslation();
  const [errors, setErrors] = useState({
    nameOfWork: false,
    workDetail: false,
    budget: false,
    category: false,
    // dateInvalid: false,
    // subcategories: false
  });


  const currentLanguage: Language = getCurrentLanguage();


  const formatDateForDisplay = (date: Date | null) => {
    if (!date) {
      return currentLanguage === 'la' ? 'ວ/ດ/ປ' : 'mm/dd/yy';
    }
    return formatDate(date.toISOString(), currentLanguage);
  };

  // Add time formatting function
  const formatDateTimeForDisplay = (date: Date | null) => {
    if (!date) {
      return currentLanguage === 'la' ? 'ວ/ດ/ປ 00:00' : 'dd/mm/yy 00:00';
    }
    const dateStr = formatDate(date.toISOString(), currentLanguage);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${dateStr} ${hours}:${minutes}`;
  };

  // Update parseDateTime function
  const parseDateTime = (dateTimeString: string): Date | null => {
    if (!dateTimeString) return null;

    // Split into date and time parts
    const parts = dateTimeString.split(' ');
    if (parts.length !== 2) return null;

    const [dateStr, timeStr] = parts;

    // Parse date (DD/MM/YYYY)
    if (dateStr.length !== 10) return null;
    const [day, month, year] = dateStr.split('/');

    // Parse time (HH:MM)
    if (timeStr.length !== 5) return null;
    const [hours, minutes] = timeStr.split(':');

    const date = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours),
      parseInt(minutes)
    );

    if (isNaN(date.getTime())) return null;
    return date;
  };

  const parseDate = (dateString: string): Date | null => {
    if (!dateString || dateString.length !== 10) return null;

    const [day, month, year] = dateString.split('/');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    // Validate the date
    if (isNaN(date.getTime())) return null;
    return date;
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
      // subcategories: subcategories.length === 0,
      // dateInvalid,
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
            <View className='bg-blue-50 p-4 rounded-2xl mb-2'>


              <View className='bg-blue-50 rounded-2xl '>

                <SelectInput
                  label={t('postWork.service_type')}
                  value={category}
                  initialSubcategories={subcategories}
                  onSelect={(serviceTypeId, jobIds) => {
                    setCategory(serviceTypeId);
                    setSubcategories(jobIds);
                  }}
                  // required
                  inputClassName={errors.category ? 'border-error' : 'border-border'}
                  // isValidate={errors.category ? `${t('postWork.service_type_required')}` : ''}
                  ref={categoryRef}
                />

              </View>
              <FormInput
                label={t('postWork.work_title')}
                placeholder={t('postWork.work_title_placeholder')}
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
                      <Text className={`${workType === type ? 'text-white' : 'text-text'} text-caption  capitalize ml-1`}>{type === "ONLINE" ? `${t('postWork.online')}` : `${t('postWork.offline')}`}</Text>
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

              {/* <FormInput label={t('postWork.sample_work')} placeholder={t('postWork.sample_work_placeholder')} inputClassName="border-border" /> */}
            </View>





            <View className="bg-blue-50 p-4 rounded-2xl mb-2">
              <Text className="text-body mb-2 text-text font-bold">{t('postWork.budget_type')}</Text>
              <View className="flex-row space-x-4 gap-2 mb-6">
                {['FIXED_PRICE', 'HOURLY', 'OFFERING'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setBudgetType(type as 'FIXED_PRICE' | 'HOURLY' | 'OFFERING')}
                    className={`flex-1 border py-4 rounded-xl items-center ${budgetType === type ? 'border-primary bg-primary' : 'border-border'
                      }`}
                  >
                    <View className="flex-row items-center gap-2">

                      {budgetType === type && <Ionicons name="checkmark-circle" size={16} color="#fff" />}

                      <Text className={`${budgetType === type ? 'text-surface' : 'text-text '} text-caption`}>
                        {/* {type === 'FIXED_PRICE' ? `${t('postWork.fixed_price')}` : `${t('postWork.hourly')} `}
                        
                        */}


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
                  error={errors.budget}
                  isValidate={`${errors.budget ? `${t('postWork.budget_required')}` : ''}`}
                  required

                />
              )}

            </View>
            <View className='bg-blue-50 p-4 rounded-2xl mb-2'>
              <Text className="text-body mb-1 text-text font-bold">{t('postWork.deadline_requirement')}</Text>
              <View className="flex-row mb-4 space-x-4 gap-2">
                {[true, false].map((option) => (
                  <Pressable
                    key={option ? 'yes' : 'no'}
                    onPress={() => setHasDeadline(option)}
                    className={`flex-1 border py-4 rounded-xl items-center ${hasDeadline === option ? 'bg-primary border-primary' : 'border-border'}`}
                  >
                    <View className="flex-row items-center">
                      {hasDeadline === option && <Ionicons name="checkmark-circle" size={16} color="#fff" />}
                      <Text className={`${hasDeadline === option ? 'text-surface' : 'text-text'} text-caption ml-1`}>{option ? `${t('postWork.yes')}` : `${t('postWork.no')}`}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>


              {/* 🔄 UPDATED: Date section with proper formatting */}
              {hasDeadline && (
                <>
                  <View className="flex-row justify-between items-end">
                    <View className="flex-1 mr-2">
                      

                      <FormInput
                        label={currentLanguage === 'la' ? 'ເລີ່ມ' : 'Start'}
                        placeholder={currentLanguage === 'la' ? 'ວ/ດ/ປ 00:00' : 'dd/mm/yy 00:00'}
                        value={fromDateString || ''}
                        // inputClassName={errors.dateInvalid ? 'border-error' : 'border-border'}
                        inputClassName={'border-border'}
                        ref={fromInputRef}
                        isDateTime={true}
                        onChangeText={(text) => {
                          setFromDateString(text);
                          if (text.length === 17) { // DD/MM/YYYY HH:MM
                            const parsedDate = parseDateTime(text);
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
                      className="bg-blue-200  flex justify-center items-center rounded-full p-4"
                    >
                      <MaterialIcons name="calendar-month" size={24} color="#2563EB" />
                    </TouchableOpacity>
                  </View>

                  <View className="flex-row justify-between mb-2 items-end">
                    <View className="flex-1 mr-2">
                      

                      <FormInput
                        label={currentLanguage === 'la' ? 'ຫາ' : 'To'}
                        placeholder={currentLanguage === 'la' ? 'ວ/ດ/ປ 00:00' : 'dd/mm/yy 00:00'}
                        value={toDateString || ''}
                        // inputClassName={errors.dateInvalid ? 'border-error' : 'border-border'}
                        inputClassName={'border-border'}
                        ref={toInputRef}
                        isDateTime={true}
                        onChangeText={(text) => {
                          setToDateString(text);
                          if (text.length === 17) {
                            const parsedDate = parseDateTime(text);
                            if (parsedDate) {
                              setToDate(parsedDate);
                            }
                          }
                        }}
                      />
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setTempToDate(toDate || new Date());
                        setShowToPicker(true);
                      }}
                      className="bg-blue-200  flex justify-center items-center rounded-full p-4"
                    >
                      <MaterialIcons name="calendar-month" size={24} color="#2563EB" />
                    </TouchableOpacity>
                  </View>

                
                </>
              )}

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
                    setFromDateString(formatDateTimeForDisplay(date));
                  }}
                  onClose={() => {
                    setShowFromPicker(false);
                    setTimeout(() => fromInputRef.current?.focus(), 100);
                  }}
                />
              )}

              {showToPicker && (
                // <DatePicker
                //   visible={showToPicker}
                //   date={null}
                //   tempDate={tempToDate}
                //   setTempDate={setTempToDate}
                //   setDate={(date: Date) => {
                //     setToDate(date); // This will trigger re-render with new formatted date
                //     setToDateString(formatDateForDisplay(date));
                //   }}
                //   onClose={() => {
                //     setShowToPicker(false);
                //     setTimeout(() => toInputRef.current?.focus(), 100);
                //   }}

                // />


                <DatePicker
                  visible={showToPicker}
                  date={toDate}
                  tempDate={tempToDate}
                  setTempDate={setTempToDate}
                  mode="datetime"
                  setDate={(date: Date) => {
                    setToDate(date);
                    setToDateString(formatDateTimeForDisplay(date));
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