import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Message, NewOfferData } from 'types';
import { FreelancerStackParamList } from 'types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { formatDisplayDateTime } from 'utils/dateFormatter';
import { useTranslation } from 'react-i18next';
import SocketService from 'service/soctketService';
import { useAuth } from 'hooks/useAuth';

interface ProjectOfferingMessageProps {
    projects: Message;
}


const ProjectOfferingMessage: React.FC<ProjectOfferingMessageProps> = ({ projects }) => {
    const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
    const { t } = useTranslation();

    const [showAcceptModal, setShowAcceptModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [isAccepted, setIsAccepted] = useState(false);
    const [isRejected, setIsRejected] = useState(false);
    // console.log('Projects:', projects);

    const { user } = useAuth();
    if (!projects.offeringWorkId) {
        return <ActivityIndicator />;
    }
    if (!user) {
        return <ActivityIndicator />
    }

    const workData = typeof projects.offeringWorkId === 'string'
        ? null
        : projects.offeringWorkId;


    if (!workData?.workId || !workData?.updateData) {
        return (
            <View className="my-2">
                <View className="bg-white rounded-2xl w-[18rem] shadow-sm border border-gray-100 px-4 py-3">
                    <Text className="text-primary font-semibold text-body">
                        {t('chat.offer.new_offering') || 'New Work Offering'}
                    </Text>
                    <Text className="text-gray-500 text-caption mt-1">
                        {t('chat.offer.syncing') || 'Offering sent. Details are syncing...'}
                    </Text>
                </View>
            </View>
        );
    }


    const socketCall = (data: NewOfferData) => {
        SocketService.updateOfferingWork(
            data
        )

    }
    const handleAccept = () => {
        setShowAcceptModal(false);

        // acceptOfferingMutation.mutate(workData._id);


        socketCall({
            conversationId: projects.conversation, // Use conversation field, not message _id
            offeringWorkId: workData._id,
            requestStatus: "CONFIRM"
        });

        setIsAccepted(true);
        console.log('Offering accepted');
    };

    const handleReject = () => {
        setShowRejectModal(false);

        socketCall({
            conversationId: projects.conversation, // Mismatch fixed here
            offeringWorkId: workData._id,
            requestStatus: "REJECTED"
        });
        setIsRejected(true);
        console.log('Offering rejected send');
        // rejectOfferingMutation.mutate(workData._id);
    };

    return (
        <View className="my-2">
            {/* Main Offering Card */}
            <View className="bg-white rounded-2xl w-[18rem] shadow-sm border border-gray-100 overflow-hidden">
                {/* Header Badge */}
                <View className="bg-primary px-4 py-2.5">
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                            <View className="bg-blue-400 rounded-full p-1.5 mr-2">
                                <Ionicons name="document-text" size={16} color="white" />
                            </View>
                            <Text className="text-white font-bold text-sm">
                                {t('chat.offer.new_offering') || 'New Work Offering'}
                            </Text>
                        </View>
                        {/* <View className="bg-blue-500 rounded-full px-2.5 py-1">
                            <Text className="text-white text-xs font-medium">
                                {workData.workId.kindOfWork === "ONLINE" ? "Online" : "Offline"}
                            </Text>
                        </View> */}
                    </View>
                </View>

                {/* Work Details - Clickable */}
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('FreelancerWorkDetail', { workId: workData.workId?._id as string })}
                    className="px-4 py-3 bg-gray-50"
                >
                    <Text className="text-gray-900 font-semibold text-body mb-1" numberOfLines={2}>
                        {workData.workId?.workTitle}
                    </Text>
                    <Text className="text-gray-500 text-caption" numberOfLines={2}>
                        {workData.workId?.description}
                    </Text>
                </TouchableOpacity>

                {/* Comparison Section */}
                <View className="px-4 py-4">
                    {/* Original Terms */}
                    <View className="mb-3">
                        <Text className="text-caption font-semibold text-gray-400 uppercase mb-2 tracking-wide">
                            {t('chat.offer.original_terms') || 'Original Terms'}
                        </Text>
                        <View className="flex-row items-center justify-between bg-gray-50 rounded-xl p-3">
                            <View className="flex-row items-center flex-1">
                                <View className="bg-gray-200 rounded-lg p-2 mr-3">
                                    <Ionicons name="wallet-outline" size={18} color="#6B7280" />
                                </View>
                                <View>
                                    <Text className="text-gray-500 text-xs mb-0.5">{t('postWork.budget')}</Text>
                                    <Text className="text-gray-700 font-bold text-base">
                                        {new Intl.NumberFormat().format(workData.workId.budget)} {workData.workId.currency}
                                    </Text>
                                </View>
                            </View>
                            <View className="flex-row items-center flex-1">
                                <View className="bg-gray-200 rounded-lg p-2 mr-3">
                                    <Ionicons name="calendar-outline" size={18} color="#6B7280" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-500 text-xs mb-0.5">{t('chat.offer.deadline')}</Text>
                                    <Text className="text-gray-700 font-medium text-xs" numberOfLines={1}>
                                        {formatDisplayDateTime(workData.workId.deadLine as string)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Arrow Indicator */}
                    <View className="items-center my-2">
                        <View className="bg-blue-100 rounded-full p-2">
                            <Ionicons name="arrow-down" size={16} color="#3B82F6" />
                        </View>
                    </View>

                    {/* New Offering */}
                    <View className="mb-4">
                        <Text className="text-caption font-semibold text-primary uppercase mb-2 tracking-wide">
                            {t('chat.offer.new_terms') || ' Proposed Terms'}
                        </Text>
                        <View className="flex-row gap-3 items-center justify-between bg-blue-50 rounded-xl p-3 border-2 border-blue-200">
                            <View className="flex-row items-center flex-1">
                                <View className="bg-blue-500 rounded-lg p-2 mr-3">
                                    <Ionicons name="wallet" size={18} color="white" />
                                </View>
                                <View>
                                    <Text className="text-primary text-xs mb-0.5">{t('chat.offer.new_budget')}</Text>
                                    <Text className="text-primary font-bold text-base">
                                        {new Intl.NumberFormat().format(workData.updateData.budget)} {workData.updateData.currency}
                                    </Text>
                                </View>
                            </View>
                            <View className="flex-row items-center flex-1">
                                <View className="bg-blue-500 rounded-lg p-2 mr-3">
                                    <Ionicons name="calendar" size={18} color="white" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-primary text-xs mb-0.5">{t('chat.offer.new_deadline')}</Text>
                                    <Text className="text-primary font-medium text-xs" numberOfLines={1}>
                                        {formatDisplayDateTime(workData.updateData.deadLine as string)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Action Buttons */}
                    {workData.workId?.createdBy?._id === user._id && (
                        <>
                            {/* Show buttons only when PENDING and not yet locally accepted/rejected */}
                            {workData.requestStatus === "PENDING" && !isAccepted && !isRejected && (
                                <View className="flex-row gap-2">
                                    <TouchableOpacity
                                        onPress={() => setShowRejectModal(true)}
                                        className="flex-1 bg-white border-2 border-red-200 rounded-xl py-3 flex-row items-center justify-center"
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="close-circle-outline" size={20} color="#DC2626" />
                                        <Text className="text-red-600 font-bold text-caption ml-1.5">
                                            {t('chat.offer.reject') || 'Decline'}
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => setShowAcceptModal(true)}
                                        className="flex-1 bg-green-500 rounded-xl py-3 flex-row items-center justify-center shadow-md"
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="checkmark-circle" size={20} color="white" />
                                        <Text className="text-white font-bold text-caption ml-1.5">
                                            {t('chat.offer.accept') || 'Accept'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Show rejected message */}
                            {(workData.requestStatus === "REJECTED" || isRejected) && (
                                <View className="flex-row gap-2">
                                    <Text className='text-warning'>{t('chat.offer.reject_offering')}</Text>
                                </View>
                            )}

                            {/* Show confirmed message */}
                            {(workData.requestStatus === "CONFIRM" || isAccepted) && (
                                <View className="flex-row gap-2">
                                    <Text className='text-secondary'>{t('chat.offer.comfirm_offering')}</Text>
                                </View>
                            )}
                        </>
                    )}
                </View>
            </View>

            {/* Accept Modal */}
            <Modal
                visible={showAcceptModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowAcceptModal(false)}
            >
                <View className="flex-1 bg-black/60 justify-center items-center px-4">
                    <View className="bg-white rounded-3xl overflow-hidden w-full max-w-md">
                        {/* Modal Header */}
                        <View className="bg-green-600 px-6 py-5">
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center flex-1">
                                    <View className="bg-green-400 rounded-full p-2 mr-3">
                                        <Ionicons name="checkmark-circle" size={24} color="white" />
                                    </View>
                                    <Text className="text-white text-lg font-bold flex-1">
                                        {t('chat.offer.accept_confirmation') || 'Accept Offering'}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => setShowAcceptModal(false)}
                                    className="bg-green-500 rounded-full p-1.5 ml-2"
                                >
                                    <Ionicons name="close" size={18} color="white" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Modal Content */}
                        <View className="px-5 py-5">
                            <Text className="text-gray-700 text-sm leading-6 mb-4">
                                {t('chat.offer.accept_message') ||
                                    'By accepting, the following changes will take effect immediately:'}
                            </Text>

                            {/* Changes List */}
                            <View className="bg-green-50 rounded-2xl p-4 mb-4 border border-green-200">
                                <View className="flex-row items-start mb-3">
                                    <View className="bg-green-500 rounded-full p-1.5 mr-3 mt-0.5">
                                        <Ionicons name="cash" size={14} color="white" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-800 font-medium mb-1 text-sm">{t('chat.offer.budget_update_label')}</Text>
                                        <View className="flex-row items-center flex-wrap">
                                            <Text className="text-gray-500 line-through text-xs">
                                                {new Intl.NumberFormat().format(workData.workId.budget)} {workData.workId.currency}
                                            </Text>
                                            <Ionicons name="arrow-forward" size={12} color="#10B981" className="mx-2" />
                                            <Text className="text-green-600 font-bold text-xs">
                                                {new Intl.NumberFormat().format(workData.updateData.budget)} {workData.updateData.currency}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <View className="flex-row items-start mb-3">
                                    <View className="bg-green-500 rounded-full p-1.5 mr-3 mt-0.5">
                                        <Ionicons name="calendar" size={14} color="white" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-800 font-medium mb-1 text-sm">{t('chat.offer.deadline_extended')}</Text>
                                        <Text className="text-green-600 font-semibold text-xs">
                                            {formatDisplayDateTime(workData.updateData.deadLine as string)}
                                        </Text>
                                    </View>
                                </View>

                                <View className="flex-row items-start">
                                    <View className="bg-green-500 rounded-full p-1.5 mr-3 mt-0.5">
                                        <Ionicons name="rocket" size={14} color="white" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-800 font-medium mb-1 text-sm">{t('chat.offer.auto_hire')}</Text>
                                        <Text className="text-gray-600 text-xs">
                                            {t('chat.offer.auto_hire_description')}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <View className="bg-amber-50 rounded-xl p-3 border border-amber-200 mb-5">
                                <View className="flex-row items-start">
                                    <Ionicons name="warning" size={16} color="#F59E0B" />
                                    <Text className="text-amber-800 text-xs ml-2 flex-1">
                                        {t('chat.offer.accept_warning') ||
                                            'This action is permanent and cannot be undone'}
                                    </Text>
                                </View>
                            </View>

                            {/* Action Buttons */}
                            <View className="flex-row gap-3">
                                <TouchableOpacity
                                    onPress={() => setShowAcceptModal(false)}
                                    className="flex-1 bg-gray-100 rounded-xl py-3.5 items-center"
                                    activeOpacity={0.7}
                                >
                                    <Text className="text-gray-700 font-semibold text-sm">
                                        {t('common.cancel') || 'Cancel'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleAccept}
                                    className="flex-1 bg-green-600 rounded-xl py-3.5 items-center"
                                    activeOpacity={0.8}
                                >
                                    <Text className="text-white font-bold text-sm">
                                        {t('common.confirm') || 'Confirm Accept'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Reject Modal */}
            <Modal
                visible={showRejectModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowRejectModal(false)}
            >
                <View className="flex-1 bg-black/60 justify-center items-center px-4">
                    <View className="bg-white rounded-3xl overflow-hidden w-full max-w-md">
                        {/* Modal Header */}
                        <View className="bg-red-600 px-6 py-5">
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center flex-1">
                                    <View className="bg-red-400 rounded-full p-2 mr-3">
                                        <Ionicons name="close-circle" size={24} color="white" />
                                    </View>
                                    <Text className="text-white text-lg font-bold flex-1">
                                        {t('chat.offer.reject_confirmation') || 'Decline Offering'}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => setShowRejectModal(false)}
                                    className="bg-red-500 rounded-full p-1.5 ml-2"
                                >
                                    <Ionicons name="close" size={18} color="white" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Modal Content */}
                        <View className="px-5 py-5">
                            <Text className="text-gray-700 text-sm leading-6 mb-4">
                                {t('chat.offer.reject_message') ||
                                    'Are you sure you want to decline this offering?'}
                            </Text>

                            {/* Info List */}
                            <View className="bg-red-50 rounded-2xl p-4 mb-4 border border-red-200">
                                <View className="flex-row items-start mb-3">
                                    <View className="bg-red-500 rounded-full p-1.5 mr-3 mt-0.5">
                                        <Ionicons name="notifications" size={14} color="white" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-800 font-medium mb-1 text-sm">{t('chat.offer.freelancer_notified')}</Text>
                                        <Text className="text-gray-600 text-xs">
                                            {t('chat.offer.freelancer_notified_description')}
                                        </Text>
                                    </View>
                                </View>

                                <View className="flex-row items-start mb-3">
                                    <View className="bg-red-500 rounded-full p-1.5 mr-3 mt-0.5">
                                        <Ionicons name="document-text" size={14} color="white" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-800 font-medium mb-1 text-sm">{t('chat.offer.original_terms_kept')}</Text>
                                        <Text className="text-gray-600 text-xs">
                                            {t('chat.offer.original_terms_kept_description')}
                                        </Text>
                                    </View>
                                </View>

                                <View className="flex-row items-start">
                                    <View className="bg-red-500 rounded-full p-1.5 mr-3 mt-0.5">
                                        <Ionicons name="refresh" size={14} color="white" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-800 font-medium mb-1 text-sm">{t('chat.offer.can_negotiate')}</Text>
                                        <Text className="text-gray-600 text-xs">
                                            {t('chat.offer.can_negotiate_description')}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <View className="bg-blue-50 rounded-xl p-3 border border-blue-200 mb-5">
                                <View className="flex-row items-start">
                                    <Ionicons name="information-circle" size={16} color="#3B82F6" />
                                    <Text className="text-primary text-xs ml-2 flex-1">
                                        {t('chat.offer.reject_warning') ||
                                            'The freelancer may submit a revised offering later'}
                                    </Text>
                                </View>
                            </View>

                            {/* Action Buttons */}
                            <View className="flex-row gap-3">
                                <TouchableOpacity
                                    onPress={() => setShowRejectModal(false)}
                                    className="flex-1 bg-gray-100 rounded-xl py-3.5 items-center"
                                    activeOpacity={0.7}
                                >
                                    <Text className="text-gray-700 font-semibold text-sm">
                                        {t('common.cancel') || 'Cancel'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleReject}
                                    className="flex-1 bg-red-600 rounded-xl py-3.5 items-center"
                                    activeOpacity={0.8}
                                >
                                    <Text className="text-white font-bold text-sm">
                                        {t('common.confirm') || 'Confirm Decline'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default ProjectOfferingMessage;
