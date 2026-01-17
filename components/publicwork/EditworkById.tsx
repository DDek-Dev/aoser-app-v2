import { useCallback, useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    TextInput,
    ActivityIndicator,
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
import { usePublicWorkById, useUpdateWorkById } from 'hooks/usePublicWork';
import { useTranslation } from 'react-i18next';

type AuthFreelancerProfileRouteProp = RouteProp<FreelancerStackParamList, 'EditWorkById'>;

type Props = {
    route: AuthFreelancerProfileRouteProp;
};

export default function EditWorkById({ route }: Props) {
    type SearchBarNavigationProp = NativeStackNavigationProp<FreelancerStackParamList>;
    const navigation = useNavigation<SearchBarNavigationProp>();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    
    const [workType, setWorkType] = useState<'ONLINE' | 'OFFLINE'>('ONLINE');
    const [hasDeadline, setHasDeadline] = useState(true);
    const [subWorkDetails, setSubWorkDetails] = useState<SubWorkDetail[]>([]);
    const [subTasks, setSubTasks] = useState<SubWorkDetail[]>([]);
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
        // subcategories: false
    });

    const currentLanguage: Language = getCurrentLanguage();
    const params = route?.params;

    // Ensure params and workId exist, redirect if not
    useEffect(() => {
        if (!params?.workId) {
            console.log('Missing workId parameter11');
            navigation.goBack();
        }
    }, [params, navigation]);

    const { data: workdata, isLoading, refetch } = usePublicWorkById(params?.workId || '');
    const updateWorkById = useUpdateWorkById();
    const data = workdata?.work;

    // Populate form with current data
    useEffect(() => {
        if (data) {
            setNameOfWork(data.workTitle);
            setWorkDetail(data.description);
            setBudget(data.budget);
            setBudgetCurrency(data.currency);
            setBudgetType(data.budgetType);
            setWorkType(data.kindOfWork);
            setCategory(data.serviceType._id);

            if (data.startDate) {
                setFromDate(new Date(data.startDate));
            }
            if (data.deadLine) {
                setToDate(new Date(data.deadLine));
                setHasDeadline(true);
            } else {
                setHasDeadline(false);
            }

            if (data.jobs) {
                setSubcategories(data.jobs.map((job: any) => job._id));
            }
            if (data.subWorkDetails) {
                setSubWorkDetails(data.subWorkDetails);
            }

            if (data.subWorkDetails) {
                setSubTasks(data.subWorkDetails);
            }
        }
    }, [data]);

    const formatDateForDisplay = (date: Date | null): string => {
        if (!date) {
            return t('editWork.deadline.fromPlaceholder');
        }
        return formatDate(date.toISOString(), currentLanguage);
    };

    // Create refs for your state
    const formStateRef = useRef({
        nameOfWork,
        workDetail,
        budget,
        category,
        workType,
        hasDeadline,
        toDate,
        fromDate,
        subWorkDetails,
        budgetCurrency,
        budgetType,
        subcategories
    });

    // Update the ref whenever state changes
    useEffect(() => {
        formStateRef.current = {
            nameOfWork,
            workDetail,
            budget,
            category,
            workType,
            hasDeadline,
            toDate,
            fromDate,
            subWorkDetails,
            budgetCurrency,
            budgetType,
            subcategories
        };
    }, [nameOfWork, workDetail, budget, category, workType, hasDeadline, toDate, fromDate, subWorkDetails, budgetCurrency, budgetType, subcategories]);

    const handleSubmit = useCallback(async () => {
        const currentState = formStateRef.current;
        const dateInvalid = hasDeadline && (
            !fromDate ||
            !toDate ||
            (fromDate && toDate && toDate < fromDate)
        );

        const newErrors = {
            nameOfWork: currentState.nameOfWork.trim() === '',
            workDetail: currentState.workDetail.trim() === '',
            budget: currentState.budget === 0,
            category: currentState.category.trim() === '',
            // subcategories: currentState.subcategories.length === 0,
            dateInvalid,
        };
        setErrors(newErrors);

        const cleanedSubWorkDetails = currentState.subWorkDetails.map(section => ({
            sectionTitle: section.sectionTitle,
            subTask: section.subTask.map(task => ({
                title: task.title,
                subWorkStatus: task.subWorkStatus
            }))
        }));

        try {
            const formData = {
                workTitle: currentState.nameOfWork,
                description: currentState.workDetail,
                budget: currentState.budget,
                kindOfWork: currentState.workType,
                deadLine: currentState.hasDeadline ? currentState.toDate?.toISOString() : null,
                startDate: currentState.fromDate?.toISOString() || null,
                subWorkDetails: cleanedSubWorkDetails,
                currency: currentState.budgetCurrency,
                budgetType: currentState.budgetType,
                serviceType: currentState.category,
                jobs: currentState.subcategories,
            };

            if (!params?.workId) {
                console.log('Missing workId parameter22');
                return;
            }

            await updateWorkById.mutateAsync({
                id: params.workId,
                data: formData
            });
            navigation.goBack();

        } catch (error) {
            console.log('Failed to update work:', error);
        }
    }, []);

    // Show loading state while data is being fetched
    if (isLoading) {
        return (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="mt-4 text-textSecondary">{t('editWork.loadingText')}</Text>
            </View>
        );
    }

 
    // Show error state if no data is available
    if (!data) {
        return (
            <View className="flex-1 justify-center items-center">
                <Text className="text-error">{t('editWork.errorText')}</Text>
                <TouchableOpacity onPress={() => refetch()} className="mt-4 bg-primary px-4 py-2 rounded">
                    <Text className="text-white">{t('editWork.retryButton')}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <>
            <ScreenWrapper safeEdges={['top', 'bottom']} style={{ backgroundColor: 'white' }}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} className='rounded-lg'>
                    <View className='px-4 flex-row justify-between items-center mb-4'>
                        <View className="flex-row items-center bg-surface p-3 rounded-2xl flex-1 mr-3">
                            <TouchableOpacity onPress={() => navigation.goBack()} className='mr-4'>
                                <Ionicons name="chevron-back" size={24} color="#3B82F6" />
                            </TouchableOpacity>
                            <View className="flex-1">
                                <Text className="font-semibold text-primary text-subheading">{t('editWork.title')}</Text>
                                <Text className="text-primary text-body">{t('editWork.subtitle')}</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleSubmit}
                            className="bg-primary py-3 px-5 rounded-xl items-center justify-center"
                        >
                            <Text className="text-white font-semibold text-body">{t('editWork.updateButton')}</Text>
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
                                label={t('editWork.workTitle.label')}
                                placeholder={t('editWork.workTitle.placeholder')}
                                value={nameOfWork}
                                onChangeText={setNameOfWork}
                                inputClassName={errors.nameOfWork ? 'border-error' : 'border-border'}
                                required
                                isValidate={errors.nameOfWork ? t('editWork.workTitle.error') : ''}
                            />

                            <Text className="text-caption text-text my-1 font-bold">{t('editWork.workType.label')}</Text>
                            <View className="flex-row mb-4 space-x-4 gap-2">
                                {['ONLINE', 'OFFLINE'].map((type) => (
                                    <TouchableOpacity
                                        key={type}
                                        onPress={() => setWorkType(type as 'ONLINE' | 'OFFLINE')}
                                        className={`flex-1 border py-4 rounded-xl items-center ${workType === type ? 'border-primary' : 'border-border'}`}
                                    >
                                        <View className="flex-row items-center">
                                            {workType === type && <Ionicons name="checkmark-circle" size={16} color="#3B82F6" />}
                                            <Text className="text-caption text-text capitalize ml-1">
                                                {type === "ONLINE" ? t('editWork.workType.online') : t('editWork.workType.offline')}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TextArea
                                label={t('editWork.workDescription.label')}
                                placeholder={t('editWork.workDescription.placeholder')}
                                value={workDetail}
                                onChangeText={setWorkDetail}
                                inputClassName={errors.workDetail ? 'border-error' : 'border-border'}
                                required
                                isValidate={errors.workDetail ? t('editWork.workDescription.error') : ''}
                            />

                            <FormInput 
                                label={t('editWork.sampleWork.label')} 
                                placeholder={t('editWork.sampleWork.placeholder')} 
                                inputClassName="border-border" 
                            />
                        </View>

                        <View className='bg-blue-50 p-4 rounded-2xl mb-4'>
                            <SelectInput
                                label={t('editWork.serviceType.label')}
                                value={category}
                                initialSubcategories={subcategories}
                                onSelect={(serviceTypeId, jobIds) => {
                                    setCategory(serviceTypeId);
                                    setSubcategories(jobIds);
                                }}
                                required
                                inputClassName={errors.category ? 'border-error' : 'border-border'}
                                isValidate={errors.category ? t('editWork.serviceType.error') : ''}
                                ref={categoryRef}
                            />
                        </View>

                        <View className="bg-blue-50 p-4 rounded-2xl mb-4">
                            <Text className="text-body mb-2 text-text font-bold">{t('editWork.budgetType.label')}</Text>
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
                                                {type === 'FIXED_PRICE' ? t('editWork.budgetType.fixedPrice') : t('editWork.budgetType.hourly')}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <BudgetInput
                                label={t('editWork.budget.label')}
                                value={budget}
                                onChange={setBudget}
                                currency={budgetCurrency}
                                onCurrencyChange={setBudgetCurrency}
                                error={errors.budget}
                                isValidate={errors.budget ? t('editWork.budget.error') : ''}
                                required
                            />
                        </View>

                        <View className='bg-blue-50 p-4 rounded-2xl mb-4'>
                            <Text className="text-body mb-1 text-text font-bold">{t('editWork.deadline.label')}</Text>
                            <View className="flex-row mb-4 space-x-4 gap-2">
                                {[true, false].map((option) => (
                                    <TouchableOpacity
                                        key={option ? 'yes' : 'no'}
                                        onPress={() => setHasDeadline(option)}
                                        className={`flex-1 border py-4 rounded-xl items-center ${hasDeadline === option ? 'border-primary' : 'border-gray-300'}`}
                                    >
                                        <View className="flex-row items-center">
                                            {hasDeadline === option && <Ionicons name="checkmark-circle" size={16} color="#2563EB" />}
                                            <Text className="text-sm ml-1">
                                                {option ? t('editWork.deadline.yes') : t('editWork.deadline.no')}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {hasDeadline && (
                                <>
                                    <View className="flex-row justify-between items-center">
                                        <View className="flex-1 mr-2">
                                            <FormInput
                                                label={t('editWork.deadline.from')}
                                                placeholder={t('editWork.deadline.fromPlaceholder')}
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
                                                label={t('editWork.deadline.to')}
                                                placeholder={t('editWork.deadline.toPlaceholder')}
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

                                    {errors.dateInvalid && (
                                        <Text className="text-error text-caption mb-2">
                                            {!fromDate || !toDate
                                                ? t('editWork.deadline.errorBothDates')
                                                : t('editWork.deadline.errorEndDate')
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
                                        setFromDate(date);
                                        console.log('From date selected:', formatDateForDisplay(date));
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
                                        setToDate(date);
                                        console.log('To date selected:', formatDateForDisplay(date));
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

                        <View style={{ height: insets.bottom }} />
                    </KeyboardAwareScrollView>
                </KeyboardAvoidingView>
            </ScreenWrapper>
        </>
    );
}