import { useEffect, useRef, useState } from 'react';
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
import Dropdown from 'components/filter/Dropdown';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import DatePicker from 'components/ui/DatePicker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import BudgetInput from 'components/ui/BudgetInput';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import { formatDate, getCurrentLanguage, Language } from 'utils/dateFormatter';
import SubWorkDetailsInput from 'components/ui/SubTaskInputList';
import { SubWorkDetail } from 'types';
import { usePublicWorkById, useUpdateWorkById } from 'hooks/usePublicWork';
import { useSelectAddress } from 'hooks/useSelectAddress';
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
    const [budget, setBudget] = useState<number | null>(0);
    const [budgetCurrency, setBudgetCurrency] = useState<'LAK' | 'USD'>('LAK');
    const fromInputRef = useRef<TextInput>(null);
    const toInputRef = useRef<TextInput>(null);
    const categoryRef = useRef<{ focus: () => void }>(null);
    const [subcategories, setSubcategories] = useState<string[]>([]);
    const [budgetType, setBudgetType] = useState<'FIXED_PRICE' | 'HOURLY' | 'OFFERING'>('FIXED_PRICE');

    const [fromDate, setFromDate] = useState<Date | null>(null);
    const [toDate, setToDate] = useState<Date | null>(null);
    const [tempFromDate, setTempFromDate] = useState(new Date());
    const [tempToDate, setTempToDate] = useState(new Date());
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);


    // time strings for start/end
    const [fromDateString, setFromDateString] = useState('');
    const [fromTimeString, setFromTimeString] = useState('');
    const [toDateString, setToDateString] = useState('');
    const [toTimeString, setToTimeString] = useState('');

    const initialWorkRef = useRef<{
        budget?: number;
        startDate?: string;
        deadLine?: string;
        subWorkDetails?: SubWorkDetail[];
        jobs?: string[];
        address?: any;
    }>({});



    // (moved above) date/time strings

    const [errors, setErrors] = useState({
        nameOfWork: false,
        workDetail: false,
        // budget: false,
        category: false,
        // dateInvalid: false,
        // subcategories: false
        toDate: false,
    });
    const [toDateErrorMessage, setToDateErrorMessage] = useState('');

    const { data: addressData } = useSelectAddress();
    const [selectedProvince, setSelectedProvince] = useState<any>(undefined);
    const [selectedDistrict, setSelectedDistrict] = useState<any>(undefined);
    const [village, setVillage] = useState('');
    const [place, setPlace] = useState('');

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

    // console.log('workdata', JSON.stringify(workdata, null , 2))
    // Populate form with current data
    useEffect(() => {
        if (data) {
            initialWorkRef.current = {
                budget: typeof data.budget === 'number' ? data.budget : undefined,
                startDate: data.startDate || undefined,
                deadLine: data.deadLine || undefined,
                subWorkDetails: Array.isArray(data.subWorkDetails) ? data.subWorkDetails : undefined,
                jobs: Array.isArray(data.jobs)
                    ? data.jobs
                        .map((job: any) => (typeof job === 'string' ? job : job?._id))
                        .filter(Boolean)
                    : undefined,
                address: data.address || undefined,
            };

            setNameOfWork(data.workTitle);
            setWorkDetail(data.description);
            setBudget(data.budget);
            setBudgetCurrency(data.currency);
            setBudgetType(data.budgetType);
            setWorkType(data.kindOfWork);
            setCategory(data.serviceType._id);

            if (data.startDate) {
                const start = new Date(data.startDate);
                setFromDate(start);
                setFromDateString(formatDate(start.toISOString(), currentLanguage));
                setFromTimeString(formatTimeForDisplay(start));
            }
            if (data.deadLine) {
                const end = new Date(data.deadLine);
                setToDate(end);
                setToDateString(formatDate(end.toISOString(), currentLanguage));
                setToTimeString(formatTimeForDisplay(end));
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

    useEffect(() => {
        if (!data?.address) return;

        const normalise = (value?: string) => (value || '').trim().toLowerCase();
        const provinceName = data.address.province || '';
        const districtName = data.address.district || '';

        const matchedProvince = provinces.find(
            (p: any) =>
                normalise(p.province_la) === normalise(provinceName) ||
                normalise(p.province_en) === normalise(provinceName)
        );

        const nextProvince =
            matchedProvince || (provinceName ? { province_la: provinceName, districts: [] } : undefined);

        const matchedDistrict = (matchedProvince?.districts || []).find(
            (d: any) =>
                normalise(d.district_la) === normalise(districtName) ||
                normalise(d.district_en) === normalise(districtName)
        );

        const nextDistrict = matchedDistrict || (districtName ? { district_la: districtName } : undefined);

        setSelectedProvince(nextProvince);
        setSelectedDistrict(nextDistrict);
        setVillage(data.address.village || '');
    }, [data?.address, provinces]);

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
        subcategories,
        address: {
            country: selectedProvince ? 'Laos' : data?.address?.country || '',
            province: selectedProvince?.province_la || data?.address?.province || '',
            district: selectedDistrict?.district_la || data?.address?.district || '',
            village: village.trim() || data?.address?.village || '',
        }
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
            subcategories,
            address: {
                country: selectedProvince ? 'Laos' : data?.address?.country || '',
                province: selectedProvince?.province_la || data?.address?.province || '',
                district: selectedDistrict?.district_la || data?.address?.district || '',
                village: village.trim() || data?.address?.village || '',
            }
        };
    }, [nameOfWork, workDetail, budget, category, workType, hasDeadline, toDate, fromDate, subWorkDetails, budgetCurrency, budgetType, subcategories, selectedProvince, selectedDistrict, village, data?.address]);


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

    const updateFromDate = (dateStr: string, timeStr: string) => {
        const combined = combineDateAndTime(dateStr, timeStr);
        if (combined) {
            setFromDate(combined);
            return;
        }

        if (dateStr.trim() === '' && timeStr.trim() === '') {
            setFromDate(null);
        }
    };

    const updateToDate = (dateStr: string, timeStr: string) => {
        const combined = combineDateAndTime(dateStr, timeStr);
        if (combined) {
            setToDate(combined);
            return;
        }

        if (dateStr.trim() === '' && timeStr.trim() === '') {
            setToDate(null);
        }
    };

    const formatTimeForDisplay = (date: Date | null): string => {
        if (!date) return '';
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    };
    const handleSubmit = async () => {
        const currentState = formStateRef.current;
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
            nameOfWork: currentState.nameOfWork.trim() === '',
            workDetail: currentState.workDetail.trim() === '',
            budget: currentState.budget === 0,
            category: currentState.category.trim() === '',
            // subcategories: currentState.subcategories.length === 0,
            toDate: dateInvalid,

        };
        setErrors(newErrors);
        setToDateErrorMessage(dateValidationMessage);

        if (currentState.budget === 0 || currentState.budget === null) {
            setBudgetType('OFFERING');
        }

        const cleanedSubWorkDetails = Array.isArray(currentState.subWorkDetails)
            ? currentState.subWorkDetails.map(section => ({
                sectionTitle: section.sectionTitle,
                subTask: (section.subTask || []).map(task => ({
                    title: task.title,
                    subWorkStatus: task.subWorkStatus
                }))
            }))
            : null;



        try {
            const formData: any = {
                workTitle: currentState.nameOfWork,
                description: currentState.workDetail,
                kindOfWork: currentState.workType,
                currency: currentState.budgetCurrency,
                budgetType: currentState.budgetType,
                serviceType: currentState.category,
            };

            // updateWorkById uses PUT, so omitting fields can overwrite them with null on backend.
            // Preserve existing values when current form state is null/undefined.
            if (place) formData.place = place;

            const budgetToSend = currentState.budget ?? initialWorkRef.current.budget;
            if (budgetToSend !== null && budgetToSend !== undefined) {
                formData.budget = budgetToSend;
            }

            const startDateToSend =
                currentState.fromDate?.toISOString() ?? initialWorkRef.current.startDate;
            if (startDateToSend) {
                formData.startDate = startDateToSend;
            }

            const deadLineToSend =
                currentState.toDate?.toISOString() ?? initialWorkRef.current.deadLine;
            if (deadLineToSend) {
                formData.deadLine = deadLineToSend;
            }

            const subWorkDetailsToSend = cleanedSubWorkDetails ?? initialWorkRef.current.subWorkDetails;
            if (subWorkDetailsToSend) {
                formData.subWorkDetails = subWorkDetailsToSend;
            }

            const jobsToSend = currentState.subcategories ?? initialWorkRef.current.jobs;
            if (jobsToSend) {
                formData.jobs = jobsToSend;
            }

            const addressToSend = currentState.address ?? initialWorkRef.current.address;
            if (addressToSend) {
                formData.address = addressToSend;
            }


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
    };

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
                    <View className='px-4 flex-row justify-between items-center '>
                        <TouchableOpacity onPress={() => navigation.goBack()} className='mr-3'>
                            <Ionicons name="chevron-back" size={24} color="#3B82F6" />
                        </TouchableOpacity>

                        <View className="flex-row items-center bg-surface p-3 rounded-2xl flex-1 mr-3">
                            <View className="flex-1">
                                <Text className="font-semibold text-primary text-heading">{t('editWork.title')}</Text>
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
                        className='p-2'
                    >
                        <View className='bg-blue-50 p-2 rounded-2xl mb-2'>

                            <View className='bg-blue-50 rounded-2xl mb-2'>
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


                            <FormInput
                                label={t('editWork.workTitle.label')}
                                placeholder={t('editWork.workTitle.placeholder')}
                                value={nameOfWork}
                                onChangeText={setNameOfWork}
                                inputClassName={errors.nameOfWork ? 'border-error' : 'border-border'}
                                required
                                isValidate={errors.nameOfWork ? t('editWork.workTitle.error') : ''}
                            />

                            <Text className="text-body text-text my-1 font-bold">{t('editWork.workType.label')}</Text>
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

                            {/* <FormInput
                                label={t('editWork.sampleWork.label')}
                                placeholder={t('editWork.sampleWork.placeholder')}
                                inputClassName="border-border"
                            /> */}
                        </View>



                        <View className="bg-blue-50 p-2 rounded-2xl mb-2">
                            <Text className="text-body mb-2 text-text font-bold">{t('editWork.budgetType.label')}</Text>
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
                                <View className='flex-row mb-2'>
                                    <Text className="text-lg text-primary font-bold mr-2">{t('workDetail.offering_price')}</Text>
                                </View>
                            ) : (
                                <BudgetInput
                                    label={t('editWork.budget.label')}
                                    value={budget}
                                    onChange={setBudget}
                                    currency={budgetCurrency}
                                    onCurrencyChange={setBudgetCurrency}
                                // error={errors.budget}
                                // isValidate={errors.budget ? t('editWork.budget.error') : ''}
                                // required
                                />
                            )}


                        </View>

                        <View className='bg-blue-50 p-2 rounded-2xl mb-2'>
                            <Text className="text-body mb-1 text-text font-bold">{t('editWork.deadline.label')}</Text>



                            <View className="">
                                <View className="flex-row items-end gap-2">
                                    <View className="flex-1">
                                        <FormInput
                                            label={t('editWork.deadline.from')}
                                            placeholder={t('editWork.deadline.fromPlaceholder')}
                                            value={fromDateString}
                                            inputClassName={'border-border'}

                                            ref={fromInputRef}
                                            isDate={true}
                                            onChangeText={(text) => {
                                                setFromDateString(text);
                                                updateFromDate(text, fromTimeString);
                                            }}
                                        />
                                    </View>

                                    <View className="w-24">
                                        <FormInput
                                            placeholder={currentLanguage === 'la' ? 'ຊມ:ນທ' : 'HH:MM'}
                                            value={fromTimeString}
                                            inputClassName={'border-border'}
                                            isTime={true}
                                            onChangeText={(text) => {
                                                setFromTimeString(text);
                                                updateFromDate(fromDateString, text);
                                            }}
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

                            <View className="mb-2">
                                <View className="flex-row items-end gap-2">
                                    <View className="flex-1">
                                        <FormInput
                                            label={t('editWork.deadline.to')}
                                            placeholder={t('editWork.deadline.toPlaceholder')}
                                            value={toDateString}
                                            inputClassName={'border-border'}

                                            ref={toInputRef}
                                            isDate={true}
                                            onChangeText={(text) => {
                                                setToDateString(text);
                                                updateToDate(text, toTimeString);
                                            }}

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
                                        className="bg-blue-200 flex justify-center items-center rounded-full p-2 "
                                    >
                                        <MaterialIcons name="calendar-month" size={24} color="#2563EB" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {errors.toDate && (
                                <Text className="text-error text-caption mt-1">
                                    {toDateErrorMessage}
                                </Text>
                            )}



                            {/* Date Picker Modals */}
                            {showFromPicker && (
                                <DatePicker
                                    visible={showFromPicker}
                                    date={fromDate || new Date()}
                                    tempDate={tempFromDate}
                                    setTempDate={setTempFromDate}
                                    mode="datetime"
                                    setDate={(date: Date) => {
                                        setFromDate(date);
                                        setFromDateString(formatDate(date.toISOString(), currentLanguage));
                                        setFromTimeString(formatTimeForDisplay(date));
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
                                    mode="datetime"
                                    setDate={(date: Date) => {
                                        setToDate(date);
                                        setToDateString(formatDate(date.toISOString(), currentLanguage));
                                        setToTimeString(formatTimeForDisplay(date));
                                        console.log('To date selected:', formatDateForDisplay(date));
                                    }}
                                    onClose={() => {
                                        setShowToPicker(false);
                                        setTimeout(() => toInputRef.current?.focus(), 100);
                                    }}
                                />
                            )}
                        </View>

                        {/* Address section */}

                        {workType === "OFFLINE" && (

                            <View className='bg-blue-50 p-2 rounded-2xl mb-2'>
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

                                <View className=''>
                                    <Dropdown
                                        label={t('kyc.step4.location.district.label')}
                                        value={selectedDistrict?.district_la}
                                        placeholder={t('kyc.step4.location.district.placeholder')}
                                        options={districtOptions}
                                        onSelect={handleDistrictSelect}
                                        disabled={!selectedProvince}
                                    />
                                </View>

                                <View className=''>
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
                                        label={t('postWork.address_manually')}
                                        value={place}
                                        onChangeText={setPlace}
                                        placeholder={t('postWork.placeholder_address_manually')}
                                        inputClassName={'border-border'}
                                    />
                                </View>
                            </View>

                        )}

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
