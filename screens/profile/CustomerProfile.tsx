import { View, Text, ScrollView, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import { profileImage } from 'assets';
import { useFreelancerById } from 'hooks/useFreelancer';
import Header_back from 'components/ui/Header_back';
import CustomerProfileSkelenton from 'skeletonScreens/CustomerProfileSkelenton';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';

const IMAGES_BASE_URL = process.env.EXPO_PUBLIC_IMAGES_URL;

type RouteParams = { CustomerProfile: { userId: string } };

type Address = {
    country?: string;
    province?: string;
    district?: string;
    village?: string;
};

const formatAddress = (address?: Address) =>
    address
        ? [address.village, address.district, address.province, address.country]
            .filter(Boolean)
            .join(', ')
        : '—';

// ── Info Card ────────────────────────────────────────────────────────────────
const InfoCard = ({
    icon,
    label,
    value,
    isLast = false,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
    isLast?: boolean;
}) => (
    <View className={`flex-row items-center gap-4 px-5 py-4 ${!isLast ? 'border-b border-border' : ''}`}>
        <View className="w-10 h-10 rounded-2xl bg-primary items-center justify-center">
            <Ionicons name={icon} size={18} color="#fff" />
        </View>
        <View className="flex-1">
            <Text className="text-caption text-textSecondary font-medium mb-0.5">{label}</Text>
            <Text className="text-body text-text font-semibold" numberOfLines={2}>
                {value || '—'}
            </Text>
        </View>
    </View>
);

// ── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = ({ label }: { label: string }) => (
    <Text className="text-body text-textSecondary font-bold  px-2 mb-2 mt-5">
        {label}
    </Text>
);

// ── Main ─────────────────────────────────────────────────────────────────────
function CustomerProfile() {
    const { t } = useTranslation();
    const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();


    const routeParams = useRoute<RouteProp<RouteParams, 'CustomerProfile'>>().params;

    const { data: profile, isLoading } = useFreelancerById(routeParams.userId);




    if (isLoading) return (
        <ScreenWrapper safeEdges={['top', 'bottom']}>
            <CustomerProfileSkelenton />
        </ScreenWrapper>

    );



    if (!profile) {
        return (
            <ScreenWrapper safeEdges={['top', 'bottom']}>
                {/* ── Header ── */}
                <View
                    className="flex-row items-center justify-between bg-surface border-b border-border"
                >
                    <Header_back text={t('customerProfile.title')} onPress={() => navigation.goBack()} />

                </View>
                <View className="flex-1 items-center justify-center gap-3">
                    <View className="w-20 h-20 rounded-full bg-border items-center justify-center">
                        <Ionicons name="person-outline" size={36} color="#6B7280" />
                    </View>
                    <Text className="text-body text-textSecondary">{t('customerProfile.notFound')}</Text>
                </View>
            </ScreenWrapper>
        );
    }


    const getImageSource = () => {
        // Case 1: User selected a new local image (review mode)
        if (profile.userProfileImage) {
            return { uri: profile.userProfileImage };
        } else {
            return profileImage
        }


    };
    const avatarUri = profile.userProfileImage
        ? { uri: `${IMAGES_BASE_URL}${profile.userProfileImage}` }
        : profileImage;

    const fullName = `${profile.firstName} ${profile.lastName}`.trim();
    const userId = profile?.userCode;

    return (
        <ScreenWrapper safeEdges={['top']} style={{ flex: 1 }}>

            {/* ── Header ── */}
            <View
                className="flex-row items-center justify-between bg-surface border-b border-border"

            >
                <Header_back text={t('customerProfile.title')} iconColor='#3B82F6' onPress={() => navigation.goBack()} />

            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
            >


                <View className='flex-row justify-start gap-2 items-center bg-primary px-6 pt-8 pb-16'>
                    {/* ── Hero Banner ── */}
                    <View className="text-center">
                        {/* Decorative circles */}
                        <View className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white opacity-5" />
                        <View className="absolute top-6 right-10 w-16 h-16 rounded-full bg-white opacity-5" />
                        <View className="absolute bottom-4 left-4 w-20 h-20 rounded-full bg-white opacity-5" />

                        <View className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden">
                            <Pressable
                                onPress={() => profile.userProfileImage && navigation.navigate('ResumeImageViewer', { uri: IMAGES_BASE_URL + profile.userProfileImage })}

                            >
                                <Image
                                    source={avatarUri}
                                    defaultSource={profileImage}
                                    className="w-full h-full"
                                    resizeMode="cover"
                                />
                            </Pressable>
                        </View>
                        {/* 
                        <Text className="text-white font-bold text-xl text-center mt-3 tracking-tight">
                            {fullName}
                        </Text> */}
                    </View>

                    <View className=" flex-row gap-2 items-center rounded-xl py-2 px-8  border border-border">
                        <Text className='text-surface text-sm'>ID:</Text>
                        <View className=" rounded-xl  items-center justify-center">
                            <Text className="text-3xl font-semibold tracking-widest text-surface">
                                {userId}
                            </Text>
                        </View>

                    </View>
                </View>

                {/* ── Card overlapping hero ── */}
                <View className="mx-4 -mt-8 bg-surface rounded-3xl shadow-sm overflow-hidden border border-border">

                    {/* Contact section */}
                    <SectionHeader label={t('customerProfile.contactInfo')} />
                    <InfoCard
                        icon="person"
                        label={t('customerProfile.fullName')}
                        value={fullName}
                    />
                    <InfoCard
                        icon="call"
                        label={t('customerProfile.phone')}
                        value={profile.phone ?? '—'}
                        isLast
                    />
                </View>

                {/* ── Location card ── */}
                <View className="mx-4 mt-3 bg-surface rounded-3xl shadow-sm overflow-hidden border border-border">
                    <SectionHeader label={t('customerProfile.locationInfo')} />
                    <InfoCard
                        icon="location"
                        label={t('customerProfile.address')}
                        value={formatAddress(profile.address)}
                        isLast
                    />
                </View>

            </ScrollView>
        </ScreenWrapper>
    );
}

export default CustomerProfile;