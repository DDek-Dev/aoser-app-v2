import React, { useEffect, useRef } from 'react';
import {
    View,
    Animated,
    ScrollView,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import Header_back from 'components/ui/Header_back';
import { useTranslation } from 'react-i18next';

// ─── Shimmer Bone ──────────────────────────────────────────────────────────────
interface BoneProps {
    animatedValue: Animated.Value;
    className?: string;
    style?: object;
    rounded?: boolean;
    circle?: boolean;
}

const Bone: React.FC<BoneProps> = ({ animatedValue, className = '', style, circle }) => {
    const opacity = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.8],
    });

    return (
        <Animated.View
            style={[
                {
                    opacity,
                    backgroundColor: '#E5E7EB',
                    borderRadius: circle ? 9999 : 12,
                },
                style,
            ]}
        />
    );
};

// ─── Field Skeleton ────────────────────────────────────────────────────────────
const FieldSkeleton: React.FC<{ anim: Animated.Value; labelWidth?: number }> = ({
    anim,
    labelWidth = 80,
}) => (
    <View style={{ marginBottom: 16 }}>
        <Bone animatedValue={anim} style={{ width: labelWidth, height: 14, marginBottom: 8, borderRadius: 6 }} />
        <Bone animatedValue={anim} style={{ width: '100%', height: 52, borderRadius: 16 }} />
    </View>
);

// ─── Main Skeleton ─────────────────────────────────────────────────────────────
const EditAoserProfileSkeleton: React.FC = () => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();

    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(anim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(anim, {
                    toValue: 0,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ]),
        );
        loop.start();
        return () => loop.stop();
    }, [anim]);

    return (
        <ScreenWrapper safeEdges={['top', 'bottom']}>
            {/* Header — real component so back button works during load */}
            <Header_back
                text={t('editProfile.edit_profile')}
                onPress={() => navigation.goBack()}
                iconColor="#3B82F6"
                backgroundColor="bg-surface"
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                bounces={false}
                scrollEnabled={false}
                contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 0 : 20 }}
            >
                <View style={{ paddingHorizontal: 24, paddingVertical: 24 }}>

                    {/* ── Profile Image ──────────────────────────────────────── */}
                    <View style={{ alignItems: 'center', marginBottom: 24 }}>
                        {/* Circle avatar */}
                        <Bone
                            animatedValue={anim}
                            circle
                            style={{ width: 128, height: 128 }}
                        />
                        {/* Camera badge placeholder */}
                        <Bone
                            animatedValue={anim}
                            style={{
                                width: 100,
                                height: 12,
                                borderRadius: 6,
                                marginTop: 10,
                            }}
                        />
                    </View>

                    {/* ── Gender ─────────────────────────────────────────────── */}
                    <FieldSkeleton anim={anim} labelWidth={60} />

                    {/* ── Full Name label ─────────────────────────────────────── */}
                    <Bone animatedValue={anim} style={{ width: 90, height: 14, borderRadius: 6, marginBottom: 8 }} />

                    {/* First name */}
                    <View style={{ marginBottom: 8 }}>
                        <Bone animatedValue={anim} style={{ width: '100%', height: 52, borderRadius: 16 }} />
                    </View>

                    {/* Last name */}
                    <View style={{ marginBottom: 16 }}>
                        <Bone animatedValue={anim} style={{ width: '100%', height: 52, borderRadius: 16 }} />
                    </View>

                    {/* ── Email ──────────────────────────────────────────────── */}
                    <FieldSkeleton anim={anim} labelWidth={50} />

                    {/* ── Phone ──────────────────────────────────────────────── */}
                    <View style={{ marginBottom: 16 }}>
                        <Bone animatedValue={anim} style={{ width: 110, height: 14, borderRadius: 6, marginBottom: 8 }} />
                        {/* Phone input with country code prefix area */}
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <Bone animatedValue={anim} style={{ width: 72, height: 52, borderRadius: 16 }} />
                            <Bone animatedValue={anim} style={{ flex: 1, height: 52, borderRadius: 16 }} />
                        </View>
                    </View>

                    {/* ── Address Section (shown for FREELANCER / APPROVED) ─── */}
                    <Bone
                        animatedValue={anim}
                        style={{ width: 80, height: 14, borderRadius: 6, marginBottom: 12 }}
                    />

                    <View
                        style={{
                            backgroundColor: '#EFF6FF',
                            borderRadius: 12,
                            padding: 16,
                            gap: 16,
                        }}
                    >
                        {/* Province */}
                        <View>
                            <Bone animatedValue={anim} style={{ width: 70, height: 13, borderRadius: 6, marginBottom: 8 }} />
                            <Bone animatedValue={anim} style={{ width: '100%', height: 48, borderRadius: 10 }} />
                        </View>

                        {/* District */}
                        <View>
                            <Bone animatedValue={anim} style={{ width: 60, height: 13, borderRadius: 6, marginBottom: 8 }} />
                            <Bone animatedValue={anim} style={{ width: '100%', height: 48, borderRadius: 10 }} />
                        </View>

                        {/* Village */}
                        <View>
                            <Bone animatedValue={anim} style={{ width: 55, height: 13, borderRadius: 6, marginBottom: 8 }} />
                            <Bone animatedValue={anim} style={{ width: '100%', height: 48, borderRadius: 10 }} />
                        </View>
                    </View>

                </View>
            </ScrollView>

            {/* ── Fixed Bottom Buttons ───────────────────────────────────────── */}
            <View
                style={{
                    paddingHorizontal: 24,
                    paddingTop: 16,
                    backgroundColor: '#fff',
                    paddingBottom: Platform.OS === 'ios' ? insets.bottom : 20,
                    flexDirection: 'row',
                    gap: 16,
                }}
            >
                <Bone animatedValue={anim} style={{ flex: 1, height: 52, borderRadius: 16 }} />
                <Bone animatedValue={anim} style={{ flex: 1, height: 52, borderRadius: 16 }} />
            </View>
        </ScreenWrapper>
    );
};

export default EditAoserProfileSkeleton;