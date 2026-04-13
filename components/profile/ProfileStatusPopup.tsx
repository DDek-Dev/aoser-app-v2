import { useState, useRef } from 'react';
import {
    View,
    Text,
    Pressable,
    TouchableWithoutFeedback,
    TouchableOpacity,
    Modal,
    useWindowDimensions,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import DatePicker from 'components/ui/DatePicker';
import FormInput from 'components/ui/Input';
import dayjs from 'dayjs';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';
// import { useMockBusyUntil } from 'hooks/useMockBusyUntil';
import { useTranslation } from 'react-i18next';
// import { getProfileBusyDateFromDB } from 'your-data-fetching-saource'; // TODO: you implement this
import { useUpdateFreelancerProfile } from 'hooks/useFreelancer';
import { UserProfile } from 'types/profile';

type Props = {
    workStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    isme: boolean;
    userId: string;
}

type PopupAnchor = { x: number; y: number; width: number; height: number };

const ProfileStatusPopup = ({ workStatus, isme, userId }: Props) => {
    const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
    const [showPopup, setShowPopup] = useState(false);
    const [popupAnchor, setPopupAnchor] = useState<PopupAnchor | null>(null);
    const [tempFromDate, setTempFromDate] = useState(new Date());
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showBusyDateInput, setShowBusyDateInput] = useState(false);
    const [dateError, setDateError] = useState('');
    const fromInputRef = useRef(null);
    const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE' | 'SUSPENDED'>(workStatus);
    const statusButtonWrapperRef = useRef<View>(null);
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();

    const today = dayjs().startOf('day');
    const updateProfileMutation = useUpdateFreelancerProfile();

    const { t } = useTranslation();


    const formatDate = (date: Date | null) => {
        return date ? dayjs(date).format('DD/MM/YYYY') : '';
    };

    const closePopup = () => {
        setShowPopup(false);
        setPopupAnchor(null);
    };

    const openPopup = () => {
        const node = statusButtonWrapperRef.current;
        if (!node?.measureInWindow) {
            setShowPopup(true);
            return;
        }

        node.measureInWindow((x, y, width, height) => {
            setPopupAnchor({ x, y, width, height });
            setShowPopup(true);
        });
    };

    const handleChangeStatus = async (newStatus: 'ACTIVE' | 'INACTIVE') => {




        const updateData = {
            workerStatus: newStatus
        };

        console.log('updateData', updateData);

        // Update profile
        await updateProfileMutation.mutateAsync(updateData as UserProfile);
        closePopup();
        if (newStatus === 'INACTIVE') {
            // setTempFromDate(fromDate);
            setStatus('INACTIVE');

            // setShowBusyDateInput(true);
        } else {
            setStatus('ACTIVE');
            setShowBusyDateInput(false);
        }





    };

    const confirmBusy = () => {
        const selected = dayjs(tempFromDate).startOf('day');
        if (selected.isBefore(today)) {
            setDateError('Cannot select past date');
            return;
        }

        setStatus('INACTIVE');
        setShowBusyDateInput(false);
        setDateError('');
        // Optional: save to database
    };

    const cancelBusy = () => {
        setShowBusyDateInput(false);
        setDateError('');
    };

    const POPUP_WIDTH = 150;
    const POPUP_MARGIN = 8;
    const popupLeft = popupAnchor
        ? Math.min(
            windowWidth - POPUP_WIDTH - POPUP_MARGIN,
            Math.max(POPUP_MARGIN, popupAnchor.x + popupAnchor.width - POPUP_WIDTH)
        )
        : windowWidth - POPUP_WIDTH - 16;
    const popupTop = popupAnchor
        ? Math.min(windowHeight - POPUP_MARGIN, popupAnchor.y + popupAnchor.height + 8)
        : 60;

    return (
        <View className="absolute right-4 top-12 z-50 flex-row items-center gap-4">



            {isme && (

                <Pressable onPress={() => navigation.navigate('FreelancerWorkHistory')} >

                    <View className="bg-border p-3 rounded-full">
                        <Ionicons name="bag-handle-sharp" size={24} color="#3B82F6" />
                    </View>
                </Pressable>
            )}
            {isme && (
                <Pressable onPress={() => navigation.navigate('WalletScreen', {userId: userId})} className="bg-border p-3 rounded-full">
                    <Ionicons name="wallet-outline" size={24} color="#3B82F6" />
                </Pressable>
            )}
            <View ref={statusButtonWrapperRef}>
                <Pressable onPress={openPopup} className="p-1 bg-blue-50 rounded-full w-[100px]">
                    <View className="p-3 bg-gray-200 rounded-full">

                        {status === 'ACTIVE' ?
                            <Text className="text-caption text-green-500 text-center">{t('freelancer_profile.active')}</Text>

                            :
                            <Text className="text-caption text-warning text-center">{t('freelancer_profile.busy')}</Text>


                        }
                    </View>
                </Pressable>
            </View>

            <Modal transparent visible={showPopup} animationType="fade" onRequestClose={closePopup}>
                <Pressable className="flex-1 mt-8" onPress={closePopup} >
                    <Pressable
                        onPress={() => { }}
                        style={{ position: 'absolute', left: popupLeft, top: popupTop, width: POPUP_WIDTH }}
                        className="bg-primary rounded-2xl px-4 py-4 shadow-lg"
                    >
                        <Pressable
                            onPress={() => handleChangeStatus('ACTIVE')}
                            className="bg-blue-100 px-6 w-full mb-4 py-2 rounded-full"
                        >
                            <Text className="text-secondary text-sm font-semibold text-center">{t('freelancer_profile.active')}</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => handleChangeStatus('INACTIVE')}
                            className="bg-blue-100 px-6 w-full py-2 rounded-full"
                        >
                            <Text className="text-warning text-sm font-semibold text-center">{t('freelancer_profile.busy')}</Text>
                            {/* <Text className="text-warning text-sm font-semibold text-center"> {tempFromDate ? `${formatDate(tempFromDate)}` : 'Busy'}</Text> */}
                        </Pressable>
                    </Pressable>
                </Pressable>
            </Modal>



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
