import { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    Pressable,
    TouchableWithoutFeedback,
    TouchableOpacity,
    Modal,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import DatePicker from 'components/ui/DatePicker';
import FormInput from 'components/ui/Input';
import dayjs from 'dayjs';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';
import { useMockBusyUntil } from 'hooks/useMockBusyUntil';
import { useTranslation } from 'react-i18next';
// import { getProfileBusyDateFromDB } from 'your-data-fetching-saource'; // TODO: you implement this

const ProfileStatusPopup = () => {
    const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
    const [showPopup, setShowPopup] = useState(false);
    const [fromDate, setFromDate] = useState(new Date());
    const [tempFromDate, setTempFromDate] = useState(new Date());
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showBusyDateInput, setShowBusyDateInput] = useState(false);
    const [dateError, setDateError] = useState('');
    const fromInputRef = useRef(null);
    const [status, setStatus] = useState<'Available' | 'Busy'>('Available');
    const isme = true;
    // const getProfileBusyDateFromDB = 
    const today = dayjs().startOf('day');

    // ✅ Auto switch to "Available" if DB busyUntil is expired
    //   useEffect(() => {
    //     const checkStatus = async () => {
    //       const busyUntil = await getProfileBusyDateFromDB(); // your own Supabase fetch here
    //       if (!busyUntil || dayjs(busyUntil).isBefore(today)) {
    //         setStatus('Available');
    //       } else {
    //         setStatus('Busy');
    //         setFromDate(new Date(busyUntil));
    //       }
    //     };
    //     checkStatus();
    //   }, []);
    const mockBusyUntil = useMockBusyUntil();

    const { t } = useTranslation();
    useEffect(() => {
        if (!mockBusyUntil) return;
        const today = dayjs().startOf('day');

        if (dayjs(mockBusyUntil).isBefore(today)) {
            setStatus('Available');
        } else {
            setStatus('Busy');
            setFromDate(mockBusyUntil);
        }
    }, [mockBusyUntil]);

    const formatDate = (date: Date | null) => {
        return date ? dayjs(date).format('DD/MM/YYYY') : '';
    };

    const handleChangeStatus = (newStatus: 'Available' | 'Busy') => {
        setShowPopup(false);
        if (newStatus === 'Busy') {
            setTempFromDate(fromDate);
            setShowBusyDateInput(true);
        } else {
            setStatus('Available');
            setShowBusyDateInput(false);
        }
    };

    const confirmBusy = () => {
        const selected = dayjs(tempFromDate).startOf('day');
        if (selected.isBefore(today)) {
            setDateError('Cannot select past date');
            return;
        }

        setFromDate(tempFromDate);
        setStatus('Busy');
        setShowBusyDateInput(false);
        setDateError('');
        // Optional: save to database
    };

    const cancelBusy = () => {
        setShowBusyDateInput(false);
        setDateError('');
    };

    return (
        <View className="absolute right-4 top-12 z-50 flex-row items-center gap-4">
            {isme && (

                <Pressable onPress={() => navigation.navigate('FreelancerWorkHistory')} >

                    <View className="bg-border p-3 rounded-full">
                        <Ionicons name="bag-handle-sharp" size={24} color="#3B82F6" />
                    </View>
                </Pressable>
            )}

            <Pressable onPress={() => setShowPopup(true)} className="p-1 bg-blue-50 rounded-full w-[100px]">
                <View className="p-3 bg-gray-200 rounded-full">
                    {status === 'Available' ? <Text className="text-caption text-green-500 text-center">{status === 'Available' ? t('freelancer_profile.active') : t('freelancer_profile.busy')}</Text> :
                        <Text className="text-caption text-warning text-center">{formatDate(fromDate)}</Text>
                    }
                </View>
            </Pressable>

            {showPopup && (
                <View className="absolute right-4 top-12 z-50">
                    <TouchableWithoutFeedback onPress={() => setShowPopup(false)}>
                        <View className="absolute -top-12 -left-0 w-[2000px] h-[2000px] bg-transparent z-0" />
                    </TouchableWithoutFeedback>

                    <View className="bg-blue-400 rounded-2xl px-4 py-4 w-[150px] shadow-lg mt-2 z-10">
                        <Pressable
                            onPress={() => handleChangeStatus('Available')}
                            className="bg-blue-100 px-6 w-full mb-4 py-2 rounded-full"
                        >
                            <Text className="text-secondary text-sm font-semibold text-center">{t('freelancer_profile.active')}</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => handleChangeStatus('Busy')}
                            className="bg-blue-100 px-6 w-full py-2 rounded-full"
                        >
                            <Text className="text-warning text-sm font-semibold text-center">{t('freelancer_profile.busy')}</Text>
                            {/* <Text className="text-warning text-sm font-semibold text-center"> {tempFromDate ? `${formatDate(tempFromDate)}` : 'Busy'}</Text> */}
                        </Pressable>
                    </View>
                </View>
            )}

            {isme && (
                <Pressable onPress={() => navigation.navigate('AuthFreelancerSetting')} className="bg-border p-3 rounded-full">
                    <Ionicons name="settings-outline" size={24} color="#3B82F6" />
                </Pressable>
            )}

            {/* ✅ Centered Modal for Busy Date */}
            <Modal transparent visible={showBusyDateInput} animationType="fade">
                <TouchableWithoutFeedback onPress={cancelBusy}>
                    <View className="flex-1 bg-black/30 justify-center items-center">
                        <TouchableWithoutFeedback onPress={() => { }}>
                            <View className="bg-white p-4 rounded-xl w-[90%] max-w-[340px] shadow-xl">
                                <Text className="text-lg font-semibold mb-2 text-center">{t('freelancer_profile.busyUntil')}</Text>
                                <View className="flex-row justify-between mb-4 items-center">
                                    <View className="flex-1 mr-2">
                                        <FormInput
                                            label={t('kyc.step4.expiryDate.placeholder')}
                                            required
                                            placeholder="Select Date"
                                            value={formatDate(tempFromDate)}
                                            inputClassName={`border-${dateError ? 'error' : 'border'}`}
                                            ref={fromInputRef}
                                            isValidate={dateError}
                                        />
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => {
                                            setTempFromDate(tempFromDate || new Date());
                                            setShowFromPicker(true);
                                        }}
                                        className="w-24 bg-blue-200 mt-1 flex justify-center items-center rounded-xl py-3"
                                    >
                                        <MaterialIcons name="calendar-month" size={24} color="#2563EB" />
                                    </TouchableOpacity>
                                </View>

                                <View className="flex-row justify-end gap-2">
                                    <TouchableOpacity onPress={cancelBusy} className="px-4 py-2 rounded bg-gray-200">
                                        <Text className="text-gray-600 font-medium">{t('profile.cancel')}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={confirmBusy} className="px-4 py-2 rounded bg-blue-500">
                                        <Text className="text-white font-medium">{t('common.ok')}</Text>
                                    </TouchableOpacity>
                                </View>

                                {showFromPicker && (
                                    <DatePicker
                                        visible={showFromPicker}
                                        date={tempFromDate || new Date()}
                                        tempDate={tempFromDate}
                                        setTempDate={setTempFromDate}
                                        setDate={setTempFromDate}
                                        onClose={() => setShowFromPicker(false)}
                                    />
                                )}
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
};

export default ProfileStatusPopup;
