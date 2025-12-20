import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Animated,
    InteractionManager,
    TouchableWithoutFeedback,
    BackHandler,
    StyleSheet,
    ActivityIndicator,

} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import ProfileOn_Interested from 'components/profile/ProfileOn_Interested';
import { useNavigation } from '@react-navigation/native';
import ProfileInCommand from 'components/publicwork/ProfileInCommand';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';

import { Job } from 'types';
import { formatDate } from 'utils/dateFormatter';
import { useAuth } from 'hooks/useAuth';
import { useMyProfile } from 'hooks/useFreelancer';


interface JobDetailModalProps {
    visible: boolean;
    onClose: () => void;
    job: Job | null;
    user?: any;
    refetch: () => void;
    onUserPress: (userId: string) => void;
}


const FreelancerJobDetail = ({ visible, onClose, job, refetch, onUserPress }: JobDetailModalProps) => {
    const navigator = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
    const insets = useSafeAreaInsets();
    const bottomSheetModalRef = useRef<BottomSheetModal>(null);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [showProfile, setShowProfile] = useState(false);


      const { data, isLoading, isError, error } = useMyProfile();


  
    // Single animation value for both show/hide and position adjustment
    const footerAnim = useRef(new Animated.Value(200)).current;

    const snapPoints = useMemo(() => ['70%', '100%'], []);

    // Calculate base positions
    const basePosition70 = 564
    const basePosition100 = 164

   
    // Reset state when modal closes
    useEffect(() => {
        if (!visible) {
            setShowProfile(false);
        }
    }, [visible]);

    // Show/hide modal with proper timing
    useEffect(() => {
        if (animationTimeoutRef.current) {
            clearTimeout(animationTimeoutRef.current);
        }


        animationTimeoutRef.current = setTimeout(() => {
            InteractionManager.runAfterInteractions(() => {
                if (visible && job) {
                    bottomSheetModalRef.current?.present();
                } else {
                    bottomSheetModalRef.current?.dismiss();
                }
            });
        }, 50);

        return () => {
            if (animationTimeoutRef.current) {
                clearTimeout(animationTimeoutRef.current);
            }
        };
    }, [visible, job]);


    // Handle Android back button
    useEffect(() => {
        const onBackPress = () => {
            if (currentIndex >= 0) {
                bottomSheetModalRef.current?.dismiss();
                return true;
            }
            return false;
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => backHandler.remove();
    }, [currentIndex]);



    const handleSheetChanges = (index: number) => {
        setCurrentIndex(index);

        // Calculate target position based on snap point
        let targetPosition;
        if (index === -1) {
            targetPosition = 100; // Hide completely
        } else if (index === 1) {
            targetPosition = basePosition100; // At bottom-3 for 100%
        } else {
            targetPosition = basePosition70; // At bottom-24 for 70%
        }

        // Animate footer position
        Animated.timing(footerAnim, {
            toValue: targetPosition,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    const handleDismiss = () => {
        setCurrentIndex(-1);
        Animated.timing(footerAnim, {
            toValue: 100,
            duration: 200,
            useNativeDriver: true,
        }).start();
        onClose();
    };






    // Fixed delete favorite handler


    if (!visible || !job) return null;

    // Safe property access with fallbacks
    const jobBudget = job?.budget || 0;
    const jobType = job?.kindOfWork || 'Unknown Type';
    const jobDeadline = job?.deadLine || ' Unknown Deadline';
    const jobDescription = job?.description || 'No description available';
    const subwork = job?.subWorkDetails || [];
    const currentLanguage = 'en';

     if (isLoading) return <ActivityIndicator />;
     if (error) return <Text>Error fetching freelancee </Text>;
   

    return (
        <BottomSheetModal
            ref={bottomSheetModalRef}
            index={0}
            snapPoints={snapPoints}
            onChange={handleSheetChanges}
            onDismiss={handleDismiss}
            enablePanDownToClose={true}
            backgroundStyle={styles.modalBackground}
            handleIndicatorStyle={styles.handleIndicator}
            topInset={insets.top}
            android_keyboardInputMode="adjustResize"
            backdropComponent={({ style }) => (
                <TouchableWithoutFeedback onPress={handleDismiss}>
                    <View style={[style, styles.backdrop]} />
                </TouchableWithoutFeedback>
            )}
        >
            {/* Header */}
         

            {/* Content */}
            <BottomSheetScrollView
                className="flex-1 px-4 bg-surface"
                showsVerticalScrollIndicator={false}
                bounces={true}
                contentContainerStyle={{ paddingBottom: 200 }}
            >
                <Text className="text-body font-bold text-text mb-3">
                    I'm finding for a
                </Text>

                <View className="flex-row items-center mb-4 gap-2">
                    <View>
                        {job?.budgetType === "FIXED_PRICE" ? (
                            <MaterialIcons name="attach-money" size={24} color="gray" />
                        ) : (
                            <Text className='font-bold text-textSecondary text-lg'>₭</Text>
                        )}
                    </View>
                    <Text className="text-subheading font-bold text-primary">
                        {new Intl.NumberFormat().format(jobBudget)}
                    </Text>
                </View>

                <View className="flex-row items-center mb-4 gap-2">
                    <MaterialIcons name="donut-small" size={24} color="gray" />
                    <View className="bg-blue-50 px-3 py-1 rounded-full">
                        <Text className="text-primary text-body">{jobType === "ONLINE" ? "Online" : "Offline"}</Text>
                    </View>
                </View>

                <View className="flex-row items-center mb-4 gap-2">
                    <MaterialIcons name="alarm" size={24} color="gray" />
                    <View className="bg-blue-50 px-3 py-1 rounded-full">
                        <Text className="text-primary text-body">{formatDate(jobDeadline, currentLanguage)}</Text>
                    </View>
                </View>

                <View className="flex-row items-center mb-4 gap-2">
                    <MaterialIcons name="person" size={24} color="gray" />
                    <View className="px-3 py-1 rounded-full">
                        <Text className="text-primary text-body">
                            {job?.likes?.length || 0} Interested
                        </Text>
                    </View>
                </View>

                <View className='flex-row items-center gap-2 mb-4'>
                    <Text className='text-body font-bold text-text'>Detail work</Text>
                    <View className='bg-gray-200 flex-1 h-[1px]' />
                </View>

                <View className='bg-blue-100 p-4 rounded-2xl mb-4'>
                    <View className="bg-background p-4 rounded-2xl mb-6">
                        <Text className="text-textSecondary leading-6">
                            {jobDescription}
                        </Text>
                    </View>

                    {subwork.map((section, sectionIndex) => (
                        <View key={sectionIndex} className="mb-4 p-3 bg-blue-50 rounded-xl border border-border">
                            {/* Section Header */}
                            <Text className="text-body font-semibold text-primary mb-2">
                                {section.sectionTitle}
                            </Text>

                            {/* Subtasks */}
                            {section.subTask.map((task, taskIndex) => (
                                <View key={taskIndex} className="flex-row items-center mb-1 ml-4">
                                    <Text className="text-caption mr-1">•</Text>
                                    <Text className="flex-1 text-body text-text">
                                        {task.title}
                                    </Text>
                                    <View className={`px-2 py-1 rounded-full ${task.subWorkStatus === 'TODO' ? 'bg-gray-200' :
                                        task.subWorkStatus === 'DOING' ? 'bg-blue-200' :
                                            task.subWorkStatus === 'DONE' ? 'bg-green-200' :
                                                task.subWorkStatus === 'DELAY' ? 'bg-yellow-200' :
                                                    'bg-red-200'
                                        }`}>
                                        <Text className="text-caption text-text">
                                            {task.subWorkStatus}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    ))}
                </View>



                <View className='bg-gray-200 w-full h-[1px] mb-4' />
                <Text className='text-body font-bold text-text'>Interested Freelancers</Text>
                {job?.workApplicants?.length > 0 && <ProfileOn_Interested job={job} handleUserProfileNavigation={onUserPress} />}
            </BottomSheetScrollView>

            {job?.workApplicants && !job.workApplicants.some(app => app.applicant === data?._id) && (


                <Animated.View
                    className="absolute bottom-24 left-4 right-4 rounded-2xl items-center "
                // style={{
                //   transform: [{ translateY: footerAnim }],
                //   zIndex: 5,
                // }}
                >
                    {data?.businessType === "FREELANCER" ? (
                        <TouchableOpacity
                            onPress={() => setShowProfile(true)}
                            className="bg-primary p-6 rounded-full shadow-md -rotate-45"
                            style={styles.blueShadow}
                        >
                            <Ionicons name="send" size={24} color="white" />
                        </TouchableOpacity>
                    ) : (
                        <View className="bg-surface p-4 rounded-2xl items-center shadow-lg" style={styles.blueShadow}>
                            <View className="bg-blue-100 p-3 rounded-full mb-3">
                                <Ionicons name="rocket-outline" size={28} color="#2563eb" />
                            </View>
                            <Text className="text-body font-bold text-primary mb-1 text-center">
                                Become a Freelancer on Aoser
                            </Text>
                            <Text className="text-caption text-textSecondary text-center mb-3">
                                Set up your freelancer profile and receive job offers.
                            </Text>
                            <TouchableOpacity
                                onPress={() => navigator.navigate('FreelancerRoleGate')}
                                className="bg-primary px-6 py-3 rounded-xl flex-row items-center space-x-2"
                            >
                                <Text className="text-surface font-bold text-caption">Start Freelancer Role</Text>
                                <Ionicons name="arrow-forward" size={18} color="white" />
                            </TouchableOpacity>
                        </View>
                    )}
                </Animated.View>
            )}


            {showProfile && (
                <ProfileInCommand
                    jobId={job._id}
                    visible={showProfile}
                    onClose={() => setShowProfile(false)}
                    refetch={refetch}
                />
            )}
        </BottomSheetModal>
    );
};

const styles = StyleSheet.create({
    modalBackground: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    handleIndicator: {
        backgroundColor: '#9CA3AF',
        width: 40,
        height: 4,
    },
    backdrop: {
        backgroundColor: '#0000006f',
    },
    blueShadow: {
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 8,
    },
});

export default FreelancerJobDetail;