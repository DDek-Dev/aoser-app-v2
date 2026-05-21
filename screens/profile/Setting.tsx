import React, { useState, useCallback, use } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Modal,
    TextInput,
    ActivityIndicator,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTranslation } from 'react-i18next';
import { FreelancerStackParamList } from 'types/navigation';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import Header_back from 'components/ui/Header_back';
import { useAuth } from 'hooks/useAuth';

// ─── Types ──────────────────────────────────────────────────────────────────
type DeleteStep = 'confirm';



// ─── Sub-components ──────────────────────────────────────────────────────────

const SectionHeader = ({ title }: { title: string }) => (
    <Text
        style={{
            fontSize: 12,
            fontWeight: '600',
            color: '#8E8E93',
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            marginBottom: 8,
            marginLeft: 4,
            marginTop: 24,
        }}
    >
        {title}
    </Text>
);

const SettingRow = ({
    icon,
    iconBg,
    iconColor,
    label,
    sublabel,
    onPress,
    destructive = false,
    showChevron = true,
    isFirst = false,
    isLast = false,
}: {
    icon: string;
    iconBg: string;
    iconColor: string;
    label: string;
    sublabel?: string;
    onPress: () => void;
    destructive?: boolean;
    showChevron?: boolean;
    isFirst?: boolean;
    isLast?: boolean;
}) => (
    <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.6}
        style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#FFFFFF',
            paddingHorizontal: 16,
            paddingVertical: 13,
            borderTopLeftRadius: isFirst ? 14 : 0,
            borderTopRightRadius: isFirst ? 14 : 0,
            borderBottomLeftRadius: isLast ? 14 : 0,
            borderBottomRightRadius: isLast ? 14 : 0,
            borderBottomWidth: isLast ? 0 : 1,
            borderBottomColor: '#F2F2F7',
        }}
    >
        {/* Icon */}
        <View
            style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: iconBg,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
            }}
        >
            <Ionicons name={icon as any} size={17} color={iconColor} />
        </View>

        {/* Labels */}
        <View style={{ flex: 1 }}>
            <Text
                style={{
                    fontSize: 16,
                    color: destructive ? '#EF4444' : '#1C1C1E',
                    fontWeight: destructive ? '500' : '400',
                }}
            >
                {label}
            </Text>
            {sublabel && (
                <Text style={{ fontSize: 12, color: '#8E8E93', marginTop: 1 }}>
                    {sublabel}
                </Text>
            )}
        </View>

        {showChevron && (
            <Ionicons
                name="chevron-forward"
                size={16}
                color={destructive ? '#EF4444' : '#C7C7CC'}
            />
        )}
    </TouchableOpacity>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────
const Setting: React.FC = () => {
    const { t } = useTranslation();

    const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();

    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [deleteStep, setDeleteStep] = useState<DeleteStep>('confirm');
    const [selectedReason, setSelectedReason] = useState<string>('');
    const [confirmText, setConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const CONFIRM_KEYWORD = 'DELETE';
    const { useDeleteAccount, tokens, deletingAccount , logout } = useAuth();
    const openDeleteModal = useCallback(() => {
        setDeleteStep('confirm');
        setSelectedReason('');
        setConfirmText('');
        setDeleteModalVisible(true);
    }, []);

    const closeDeleteModal = useCallback(() => {
        setDeleteModalVisible(false);
        setTimeout(() => {
            setDeleteStep('confirm');
            setSelectedReason('');
            setConfirmText('');
        }, 300);
    }, []);

    const handleDeleteAccount = useCallback(async () => {
        // if (confirmText !== CONFIRM_KEYWORD) return;

        console.log('Deleting account...');
        setIsDeleting(true);
        try {
            // TODO: call your delete account API here
            await useDeleteAccount.mutateAsync(tokens?.accessToken || '');
            await logout();
            await new Promise((r) => setTimeout(r, 1500)); // simulate API
            closeDeleteModal();

        } catch (e) {
            console.log('Delete account error:', e);
        } finally {
            setIsDeleting(false);
        }
    }, [confirmText, closeDeleteModal]);

    // ── Render delete modal steps ─────────────────────────────────────────
    const renderDeleteModalContent = () => {
        if (deleteStep === 'confirm') {
            return (
                <>
                    {/* Warning icon */}
                    <View style={{ alignItems: 'center', marginBottom: 20 }}>
                        <View
                            style={{
                                width: 64,
                                height: 64,
                                borderRadius: 32,
                                backgroundColor: '#FEF2F2',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 16,
                            }}
                        >
                            <Ionicons name="warning" size={32} color="#EF4444" />
                        </View>
                        <Text style={{ fontSize: 20, fontWeight: '700', color: '#1C1C1E', marginBottom: 8 }}>
                            {t('deleteAccount.title')}
                        </Text>
                        <Text style={{ fontSize: 14, color: '#8E8E93', textAlign: 'center', lineHeight: 20 }}>
                            {t('deleteAccount.subtitle')}
                        </Text>
                    </View>

                    {/* What will be lost */}
                    <View
                        style={{
                            backgroundColor: '#FEF2F2',
                            borderRadius: 12,
                            padding: 14,
                            marginBottom: 20,
                        }}
                    >
                        {[
                            t('deleteAccount.loss1'),
                            t('deleteAccount.loss2'),
                            t('deleteAccount.loss3'),
                            t('deleteAccount.loss4'),
                        ].map((item, i) => (
                            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: i < 3 ? 8 : 0 }}>
                                <Ionicons name="close-circle" size={16} color="#EF4444" style={{ marginRight: 8 }} />
                                <Text style={{ fontSize: 13, color: '#EF4444' }}>{item}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Buttons */}
                    <TouchableOpacity
                        onPress={() => {

                            handleDeleteAccount();
                        }}
                        style={{
                            backgroundColor: '#EF4444',
                            borderRadius: 14,
                            height: 52,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 10,
                        }}
                        activeOpacity={0.8}
                    >
                        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
                            {deletingAccount ? '...' : t('deleteAccount.confirmButton')}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={closeDeleteModal}
                        style={{
                            backgroundColor: '#F2F2F7',
                            borderRadius: 14,
                            height: 52,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        activeOpacity={0.7}
                    >
                        <Text style={{ color: '#1C1C1E', fontSize: 16, fontWeight: '500' }}>
                            {t('deleteAccount.cancelButton')}
                        </Text>
                    </TouchableOpacity>
                </>
            );
        }

    }



    return (
        <ScreenWrapper safeEdges={['top', 'bottom']}>
            <Header_back text={t('protectedRoute.back')} onPress={() => navigation.goBack()} />

            {/* ── Content ─────────────────────────────────── */}
            <ScrollView
                // style={{ flex: 1, backgroundColor: '#F2F2F7' }}
                contentContainerStyle={{
                    paddingHorizontal: 20,
                    paddingTop: 20,
                }}
                showsVerticalScrollIndicator={false}
            >


                {/* Danger zone */}
                {/* <SectionHeader title={t('deleteAccount.dangerZone')} /> */}
                <View
                    style={{
                        borderRadius: 14,
                        overflow: 'hidden',
                        shadowColor: '#EF4444',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.08,
                        shadowRadius: 4,
                        borderWidth: 1,
                        borderColor: '#FEE2E2',
                    }}
                >

                    <SettingRow
                        icon="trash-outline"
                        iconBg="#FEF2F2"
                        iconColor="#EF4444"
                        label={t('deleteAccount.label')}
                        sublabel={t('deleteAccount.sublabel')}
                        onPress={openDeleteModal}
                        destructive
                        isFirst
                        isLast
                    />
                </View>
            </ScrollView>

            {/* ── Delete Account Modal ─────────────────────── */}
            <Modal
                visible={deleteModalVisible}
                transparent
                animationType="fade"        // ← was "slide"
                onRequestClose={closeDeleteModal}
            >
                <TouchableOpacity
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        justifyContent: 'center',   // ← was 'flex-end'
                        paddingHorizontal: 24,      // ← add side padding
                    }}
                    activeOpacity={1}
                    onPressOut={closeDeleteModal}
                >
                    <TouchableWithoutFeedback>
                        <View
                            style={{
                                backgroundColor: '#FFFFFF',
                                borderRadius: 24,           // ← all corners rounded (was only top)
                                padding: 24,
                                paddingBottom: 24,          // ← no need for insets offset
                            }}
                        >
                            {/* Handle — remove it, not needed for popup */}

                            {/* Step indicator */}
                            {/* <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 24, gap: 6 }}>
                                {(['confirm', 'reason', 'final'] as DeleteStep[]).map((step) => (
                                    <View
                                        key={step}
                                        style={{
                                            width: deleteStep === step ? 20 : 6,
                                            height: 6,
                                            borderRadius: 3,
                                            backgroundColor: deleteStep === step ? '#EF4444' : '#E5E5EA',
                                        }}
                                    />
                                ))}
                            </View> */}

                            {renderDeleteModalContent()}
                        </View>
                    </TouchableWithoutFeedback>
                </TouchableOpacity>
            </Modal>
        </ScreenWrapper>
    );
};

export default Setting;