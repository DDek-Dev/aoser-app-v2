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
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import DatePicker from 'components/ui/DatePicker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import BudgetInput from 'components/ui/BudgetInput';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import { formatDate, getCurrentLanguage, Language } from 'utils/dateFormatter';
import SubWorkDetailsInput from 'components/ui/SubTaskInputList';
import { SubWorkDetail } from 'types';
import { useAppendOwnerWork, usePublicWorkById } from 'hooks/usePublicWork';
import { useTranslation } from 'react-i18next';

type AuthFreelancerProfileRouteProp = RouteProp<FreelancerStackParamList, 'AppendOwnerWork'>;

type Props = {
    route: AuthFreelancerProfileRouteProp;
};

export default function AppendOwnerWork({ route }: Props) {
    type SearchBarNavigationProp = NativeStackNavigationProp<FreelancerStackParamList>;
    const navigation = useNavigation<SearchBarNavigationProp>();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();

    // Only editable fields for appending work
    const [budget, setBudget] = useState<number | null>(null);
    const [budgetCurrency, setBudgetCurrency] = useState<'LAK' | 'USD'>('LAK');
    const [subWorkDetails, setSubWorkDetails] = useState<SubWorkDetail[]>([]);
    const [additionalDescription, setAdditionalDescription] = useState('');
    // Original work data (read-only reference)
    const [originalWorkType, setOriginalWorkType] = useState<'ONLINE' | 'OFFLINE'>('ONLINE');
    const [originalDescription, setOriginalDescription] = useState('');
    const [originalBudget, setOriginalBudget] = useState<number>(0);
    const [originalBudgetCurrency, setOriginalBudgetCurrency] = useState<'LAK' | 'USD'>('LAK');
    const [originalBudgetType, setOriginalBudgetType] = useState<'FIXED_PRICE' | 'HOURLY' | 'OFFERING'>('FIXED_PRICE');
    const [originalStartDate, setOriginalStartDate] = useState<string>('');
    const [originalDeadline, setOriginalDeadline] = useState<string>('');
    const [originalStartDateTime, setOriginalStartDateTime] = useState<string>('');
    const [originalDeadlineTime, setOriginalDeadlineTime] = useState<string>('');
    const [originalDeadlineDate, setOriginalDeadlineDate] = useState<Date | null>(null);

    const toInputRef = useRef<TextInput>(null);

    const [toDate, setToDate] = useState<Date | null>(null);
    const [tempToDate, setTempToDate] = useState(new Date());
    const [showToPicker, setShowToPicker] = useState(false);

    // time strings for deadline only
    const [toDateString, setToDateString] = useState('');
    const [toTimeString, setToTimeString] = useState('');

    const [errors, setErrors] = useState({
        budget: false,
        dateInvalid: false,
        additionalDescription: false,
    });

    const currentLanguage: Language = getCurrentLanguage();
    const params = route?.params;

    // Ensure params and workId exist, redirect if not
    useEffect(() => {
        if (!params?.workId) {
            navigation.goBack();
        }
    }, [params, navigation]);

    const { data: workdata, isLoading, refetch } = usePublicWorkById(params?.workId || '');
    const appendWork = useAppendOwnerWork();
    const data = workdata?.work;

    // Populate form with current data (read-only display)
    useEffect(() => {
        if (data) {
            setOriginalDescription(data.description);
            setOriginalBudget(data.budget);
            setOriginalBudgetCurrency(data.currency);
            setOriginalBudgetType(data.budgetType);
            setOriginalWorkType(data.kindOfWork);

            // Store original deadline for display
            if (data.deadLine) {
                const end = new Date(data.deadLine);
                setOriginalDeadlineDate(end);
                setOriginalDeadline(formatDate(end.toISOString(), currentLanguage));
                setOriginalDeadlineTime(formatTimeForDisplay(end));
            }

            if (data.startDate) {
                const start = new Date(data.startDate);
                setOriginalStartDate(formatDate(start.toISOString(), currentLanguage));
                setOriginalStartDateTime(formatTimeForDisplay(start));
            }

            // Initialize new deadline input with empty values
            setToDateString('');
            setToTimeString('');
            setToDate(null);

            // Initialize with empty description for appending
            setBudget(null);
            setBudgetCurrency(data.currency);
            setSubWorkDetails([]);
        }
    }, [data]);

 

    // Create refs for your state
    const formStateRef = useRef({
        budget,
        budgetCurrency,
        toDate,
        subWorkDetails,
        additionalDescription,
    });

    // Update the ref whenever state changes
    useEffect(() => {
        formStateRef.current = {
     
            budget,
            budgetCurrency,
         
            toDate,
            subWorkDetails,
            additionalDescription,
        };
    }, [ budget, budgetCurrency,  toDate, subWorkDetails]);


    const parseDate = (dateString: string): Date | null => {
        if (!dateString || dateString.length !== 10) return null;

        const [day, month, year] = dateString.split('/');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

        // Validate the date
        if (isNaN(date.getTime())) return null;
        return date;
    };

    // Parse time string (HH:MM)
    const parseTime = (timeString: string): { hours: number; minutes: number } | null => {
        if (!timeString || timeString.length < 3) return null;

        const parts = timeString.split(':');
        if (parts.length !== 2) return null;

        const hours = parseInt(parts[0]);
        const minutes = parseInt(parts[1]);

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

    const updateToDate = (dateStr: string, timeStr: string) => {
        const combined = combineDateAndTime(dateStr, timeStr);
        setToDate(combined);
    };

    const formatTimeForDisplay = (date: Date | null): string => {
        if (!date) return '';
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    const handleSubmit = useCallback(async () => {
        const currentState = formStateRef.current;

        // Validate new deadline against original deadline
        const dateInvalid = (() => {
            if (!currentState.toDate) return true;
            if (originalDeadlineDate && currentState.toDate < originalDeadlineDate) return true;
            return false;
        })();
        const newErrors = {
            budget: !currentState.budget || currentState.budget === 0,
            dateInvalid,
            additionalDescription: !currentState.additionalDescription,

        };
        setErrors(newErrors);

        const hasError = Object.values(newErrors).some(Boolean);
        if (hasError) return;

        const cleanedSubWorkDetails = currentState.subWorkDetails.map(section => ({
            sectionTitle: section.sectionTitle,
            subTask: section.subTask.map(task => ({
                title: task.title,
                subWorkStatus: task.subWorkStatus
            }))
        }));

        try {
            const formData = {
                // description: currentState.additionalDescription,
                budget: currentState.budget,
                currency: currentState.budgetCurrency,
                // budgetType: currentState.budgetType,
                deadLine: currentState.toDate?.toISOString() || null,
                subWorkDetails: cleanedSubWorkDetails,
            };

            // console.log('Submitting form with data:', JSON.stringify(formData, null, 2));

            if (!params?.workId) {
                console.log('Missing workId parameter');
                return;
            }

            await appendWork.mutateAsync({
                id: params.workId,
                data: formData
            });
            navigation.goBack();

        } catch (error) {
            console.log('Failed to append work:', error);
        }
    }, [originalDeadlineDate]);

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
                        <TouchableOpacity onPress={() => navigation.goBack()} className='mr-3'>
                            <Ionicons name="chevron-back" size={24} color="#3B82F6" />
                        </TouchableOpacity>

                        <View className="flex-row items-center bg-surface p-3 rounded-2xl flex-1 mr-3">
                            <View className="flex-1">
                                <Text className="font-semibold text-primary text-heading">{t('appendownerwork.title')}</Text>
                                <Text className="text-primary text-body">{t('appendownerwork.description')}</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleSubmit}
                            className="bg-primary py-3 px-5 rounded-xl items-center justify-center"
                        >
                            <Text className="text-white font-semibold text-body">{t('appendownerwork.comfirm_task')}</Text>
                        </TouchableOpacity>
                    </View>

                    <KeyboardAwareScrollView
                        contentContainerStyle={{ paddingBottom: insets.bottom + 10 }}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                        className='p-4'
                    >
                        {/* Original Work Reference (Read-only) */}
                        <Text className="text-body font-bold text-text mb-3">{t('editWork.originalWork') || 'Original Work'}</Text>
                        <View className='bg-gray-50 p-4 rounded-2xl mb-6 border border-gray-200'>

                            <View className="mb-3">
                                <Text className="text-caption text-textSecondary mb-1">{t('editWork.workType.label')}</Text>
                                <Text className="text-body text-text font-medium">
                                    {originalWorkType === 'ONLINE' ? t('editWork.workType.online') : t('editWork.workType.offline')}
                                </Text>
                            </View>

                            <View className="mb-3">
                                <Text className="text-caption text-textSecondary mb-1">{t('editWork.workDescription.label')}</Text>
                                <Text className="text-body text-text">{originalDescription}</Text>
                            </View>

                            <View className="flex-row gap-4">
                                <View className="flex-1">
                                    <Text className="text-caption text-textSecondary mb-1">{t('editWork.budget.label')}</Text>
                                    <Text className="text-body text-text font-medium">
                                        {originalBudgetCurrency} {new Intl.NumberFormat().format(originalBudget)}
                                    </Text>
                                </View>
                                <View className="flex-1">
                                    <Text className="text-caption text-textSecondary mb-1">{t('editWork.budgetType.label')}</Text>
                                    <Text className="text-body text-text font-medium">
                                        {originalBudgetType === 'FIXED_PRICE' ? t('postWork.fixed_price')
                                            : originalBudgetType === 'HOURLY' ? t('postWork.hourly')
                                                : t('postWork.offering')}
                                    </Text>
                                </View>
                            </View>

                            <View className="flex-row gap-4 mt-3">
                                <View className="flex-1">
                                    <Text className="text-caption text-textSecondary mb-1">{t('editWork.deadline.from')}</Text>
                                    <Text className="text-body text-text font-medium">
                                        {originalStartDate ? `${originalStartDate} ${originalStartDateTime}` : t('workDetail.no_date') || 'No deadline'}
                                    </Text>
                                </View>
                                <View className="flex-1">
                                    <Text className="text-caption text-textSecondary mb-1">{t('editWork.deadline.to')}</Text>
                                    <Text className="text-body text-text font-medium">
                                        {originalDeadline ? `${originalDeadline} ${originalDeadlineTime}` : t('workDetail.no_date') || 'No deadline'}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Append Work Section */}
                        <Text className="text-body font-bold text-text mb-4">{t('editWork.appendNewWork') || 'Add More Work'}</Text>
                        <View className='bg-blue-50 p-4 rounded-2xl mb-4'>

                            <TextArea
                                label={t('editWork.workDescription.label')}
                                placeholder={t('editWork.workDescription.placeholder')}
                                value={additionalDescription}
                                onChangeText={setAdditionalDescription}
                                inputClassName={errors.additionalDescription ? 'border-error' : 'border-border'}
                                required
                                isValidate={errors.additionalDescription ? t('editWork.workDescription.error') : ''}
                            />
                        </View>

                        <View className="bg-blue-50 p-4 rounded-2xl mb-4">
                            {/* <Text className="text-body mb-2 text-text font-bold">{t('editWork.budgetType.label')}</Text>
                            <View className="flex-row space-x-4 gap-2">
                                {['FIXED_PRICE', 'HOURLY', 'OFFERING'].map((type) => (
                                    <TouchableOpacity
                                        key={type}
                                        onPress={() => setBudgetType(type as 'FIXED_PRICE' | 'HOURLY' | 'OFFERING')}
                                        className={`flex-1 border py-4 rounded-xl items-center ${budgetType === type ? 'border-primary bg-blue-50' : 'border-border'}`}
                                    >
                                        <View className="flex-row items-center gap-2">
                                            {budgetType === type && <Ionicons name="checkmark-circle" size={16} color="#3B82F6" />}
                                            <Text className="text-caption text-text">
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
                            </View> */}

                          
                                <View className="mt-2 ">
                                    <BudgetInput
                                        label={t('editWork.budget.label')}
                                        value={budget}
                                        onChange={setBudget}
                                        currency={budgetCurrency}
                                        onCurrencyChange={setBudgetCurrency}
                                        error={errors.budget}
                                        isValidate={errors.budget ? t('postWork.budget_required') : ''}
                                        required
                                    />
                                </View>
                            
                        </View>

                        <View className='bg-blue-50 p-4 rounded-2xl mb-4'>
                            {/* <Text className="text-body mb-1 text-text font-bold">
                                {t('editWork.deadline.label')}
                                <Text className="text-error"> *</Text>
                            </Text> */}

                            <View className="mb-2">
                                <View className="flex-row items-end gap-2">
                                    <View className="flex-1">
                                        <FormInput
                                            label={t('chat.offer.new_deadline')}
                                            placeholder={t('editWork.deadline.toPlaceholder')}
                                            value={toDateString}
                                            inputClassName={errors.dateInvalid ? 'border-error' : 'border-border'}
                                            ref={toInputRef}
                                            isDate={true}
                                            onChangeText={(text) => {
                                                setToDateString(text);
                                                updateToDate(text, toTimeString);
                                            }}
                                            required
                                        // isValidate={errors.dateInvalid ? t('editWork.deadline.error') : ''}
                                        />
                                    </View>

                                    <View className="w-24">
                                        <FormInput
                                            placeholder={currentLanguage === 'la' ? 'ຊມ:ນທ' : 'HH:MM'}
                                            value={toTimeString}
                                            inputClassName={'border-border'}
                                            isTime={true}
                                            onChangeText={(text) => {
                                                setToTimeString(text);
                                                updateToDate(toDateString, text);
                                            }}
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
                            </View>

                            {errors.dateInvalid && (
                                <Text className="text-error text-caption mb-2">
                                    {!toDate
                                        ? t('chat.offer.deadline_required') || 'New deadline is required'
                                        : t('chat.offer.deadline_future') || 'New deadline must be same or after current deadline'}
                                </Text>
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
                                        setToDateString(formatDate(date.toISOString(), currentLanguage));
                                        setToTimeString(formatTimeForDisplay(date));
                                    }}
                                    onClose={() => {
                                        setShowToPicker(false);
                                        setTimeout(() => toInputRef.current?.focus(), 100);
                                    }}
                                />
                            )}
                        </View>

                        {originalWorkType === 'ONLINE' && (
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