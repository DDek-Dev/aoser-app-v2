import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import { useCreateReview } from 'hooks/useFreelancer';
import { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Modal,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableWithoutFeedback,
    Keyboard,
    Image,
} from 'react-native';
import { ALERT_TYPE, Toast } from 'react-native-alert-notification';
import { Job } from 'types';
import { useTranslation } from 'react-i18next';


const { height: SCREEN_HEIGHT } = Dimensions.get('window');


const BASE_IMAGE = process.env.EXPO_PUBLIC_IMAGES_URL;
type Props = {
    visible: boolean;
    onClose: () => void;
    freelancer: Job;
    onSubmitReview: () => void;

}
const ReviewModal = ({
    visible,
    onClose,
    freelancer,
    onSubmitReview

}: Props) => {
    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const slideAnim = useRef(new Animated.Value(-SCREEN_HEIGHT)).current;
    const [showThankYou, setShowThankYou] = useState(false);
    const thankYouAnim = useRef(new Animated.Value(0)).current;

    // API
    const createReview = useCreateReview();
    const { t } = useTranslation();

    // Available tags for selection
    const availableTags = [
        'Professional',
        'On Time',
        'Great Communication',
        'High Quality',
        'Creative',
        'Responsive',
        'Reliable',
        'Expert Skills',
        'Problem Solver',
        'Exceeded Expectations'
    ];

    useEffect(() => {
        if (visible) {
            // Slide down animation
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 100,
                friction: 8,
            }).start();
        } else {
            // Slide up animation
            Animated.spring(slideAnim, {
                toValue: -SCREEN_HEIGHT,
                useNativeDriver: true,
                tension: 100,
                friction: 8,
            }).start();
        }
    }, [visible]);

    const handleTagToggle = (tag: string) => {
        setTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    const handleSubmit = async () => {
        if (rating === 0) {
            alert('Please provide a rating');
            return;
        }

        const reviewData = {
            rating: rating,
            comment: reviewText,
            work: freelancer._id,
            reviewTo: freelancer.assignedTo._id,
        };

        console.log('Review Data:', reviewData);

        try {
            const result = await createReview.mutateAsync(reviewData);
            if (result) {
                // Show thank you message

                onSubmitReview()

                setShowThankYou(true);
                // Animate thank you popup
                Animated.sequence([
                    Animated.spring(thankYouAnim, {
                        toValue: 1,
                        useNativeDriver: true,
                        tension: 100,
                        friction: 8,
                    }),
                    Animated.delay(2000),
                    Animated.spring(thankYouAnim, {
                        toValue: 0,
                        useNativeDriver: true,
                        tension: 100,
                        friction: 8,
                    }),
                ]).start(() => {
                    setShowThankYou(false);

                    handleClose();
                });
            }

        } catch (error) {
            console.log('Failed to submit review:', error);
            Toast.show({
                type: ALERT_TYPE.DANGER,
                title: t('kyc.toast.oops.title'),
                textBody: t('kyc.toast.oops.body'),
            })
        }





    };

    const handleClose = () => {
        setRating(0);
        setReviewText('');
        setTags([]);
        setShowThankYou(false);
        thankYouAnim.setValue(0);
        Keyboard.dismiss();
        onClose();
    };

    const renderStars = () => {
        return Array.from({ length: 5 }, (_, index) => (
            <TouchableOpacity
                key={index}
                onPress={() => setRating(index + 1)}
                className="p-1"
            >
                <Ionicons
                    name="star"
                    size={32}
                    color={index < rating ? '#F59E0B' : '#E5E7EB'}
                    fill={index < rating ? '#F59E0B' : 'transparent'}
                />
            </TouchableOpacity>
        ));
    };

    if (!visible) return null;

    return (

        <Modal
            transparent={true}
            visible={visible}
            animationType="none"
            onRequestClose={handleClose}
        >

            <ScreenWrapper safeEdges={['bottom']}>


                <View className="flex-1 bg-black/50 ">
                    <TouchableWithoutFeedback onPress={handleClose}>
                        <View className="flex-1" />
                    </TouchableWithoutFeedback>

                    <Animated.View
                        style={{
                            transform: [{ translateY: slideAnim }],
                        }}
                        className="bg-surface rounded-t-3xl shadow-2xl"
                    >
                        <KeyboardAvoidingView
                            // behavior={Platform.OS === 'ios' ? 'padding' : 'height' }
                            behavior={Platform.OS === 'ios' ? 'height' : 'padding'}
                            className="h-full py-12"
                        >
                            {/* Header */}
                            <View className="flex-row items-center justify-between p-4 border-b border-border">
                                <Text className="text-subheading text-text">{t('reviewModal.title')}</Text>
                                <TouchableOpacity onPress={handleClose} className="p-2">
                                    <Ionicons name="close" size={24} color="#6B7280" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView className="" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                                {/* Freelancer Profile */}
                                <View className="p-6 border-b border-border bg-primary">
                                    <View className="flex-row items-center ">
                                        <View className="w-16 h-16  rounded-full items-center justify-center mr-4">
                                            {freelancer?.assignedTo.userProfileImage ? (
                                                <Image
                                                    source={{ uri: BASE_IMAGE + freelancer.assignedTo.userProfileImage }}
                                                    className="w-16 h-16 rounded-full"
                                                />
                                            ) : (
                                                <Ionicons name="person" size={32} color="white" />
                                            )}
                                        </View>
                                        <View className="flex-1">
                                            <View className='flex-row items-center mb-1 space-x-2 gap-1'>

                                                <Text className="text-body text-surface font-bold">
                                                    {freelancer?.assignedTo.firstName || ''}
                                                </Text>
                                                <Text className="text-body text-surface font-bold">
                                                    {freelancer?.assignedTo.lastName || ''}
                                                </Text>
                                            </View>
                                            <Text className="text-body text-surface">
                                                {freelancer?.assignedTo.jobTitle || ' '}
                                            </Text>

                                        </View>
                                    </View>
                                </View>

                                {/* Rating Section */}
                                <View className="p-6 ">
                                    <Text className="text-body font-semibold text-text mb-4">{t('reviewModal.rateFreelancer')}</Text>
                                    <View className="flex-row items-center justify-center">
                                        {renderStars()}
                                    </View>
                                    {rating > 0 && (
                                        <Text className="text-center text-body text-textSecondary mt-2">
                                            {t('reviewModal.starsOutOf', { rating })}
                                        </Text>
                                    )}
                                </View>

                                {/* Tags Section */}
                                {/* <View className="p-6 border-b border-border">
                                <Text className="text-body font-semibold text-text mb-4">Add Tags</Text>
                                <View className="flex-row flex-wrap">
                                    {availableTags.map((tag) => (
                                        <TouchableOpacity
                                            key={tag}
                                            onPress={() => handleTagToggle(tag)}
                                            className={`px-4 py-2 rounded-full mr-2 mb-2 border ${tags.includes(tag)
                                                ? 'bg-primary border-primary'
                                                : 'bg-surface border-border'
                                                }`}
                                        >
                                            <Text
                                                className={`text-caption ${tags.includes(tag)
                                                    ? 'text-surface font-medium'
                                                    : 'text-textSecondary'
                                                    }`}
                                            >
                                                {tag}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View> */}

                                {/* Review Text */}
                                <View className="p-6">
                                    <Text className="text-body font-semibold text-text mb-4">{t('reviewModal.writeReview')}</Text>
                                    <TextInput
                                        value={reviewText}
                                        onChangeText={setReviewText}
                                        placeholder={t('reviewModal.reviewPlaceholder')}
                                        placeholderTextColor="#9CA3AF"
                                        multiline={true}
                                        numberOfLines={6}
                                        textAlignVertical="top"
                                        className="bg-background border border-border rounded-xl p-4 text-body text-text min-h-[120px]"
                                    />
                                </View>
                            </ScrollView>

                            {/* Action Buttons */}
                            <View className="flex-row p-6 border-t border-border space-x-4 gap-4 ">
                                <TouchableOpacity
                                    onPress={handleClose}
                                    className="flex-1 bg-background border border-border py-3 rounded-xl"
                                >
                                    <Text className="text-center text-body text-textSecondary font-medium">
                                        {t('kyc.buttons.back')}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleSubmit}
                                    className={`flex-1 py-3 rounded-xl ${rating > 0 ? 'bg-success' : 'bg-border'
                                        }`}
                                    disabled={rating === 0}
                                >
                                    <Text className={`text-center text-body font-semibold ${rating > 0 ? 'text-surface' : 'text-textSecondary'
                                        }`}>
                                        {t('reviewModal.submitReview')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </KeyboardAvoidingView>




                        {/* Thank You Popup */}
                        {showThankYou && (
                            <Animated.View
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    transform: [
                                        {
                                            scale: thankYouAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0.9, 1],
                                            }),
                                        },
                                    ],
                                    opacity: thankYouAnim,
                                }}
                            >
                                <View className="bg-surface rounded-2xl p-6 mx-6 items-center shadow-lg" style={{
                                    width: '85%',
                                    maxWidth: 400,
                                    borderWidth: 1,
                                    borderColor: '#E5E7EB',
                                }}>
                                    <View className="w-16 h-16 bg-success rounded-full items-center justify-center mb-4" style={{
                                        backgroundColor: '#10B981',
                                        shadowColor: '#10B981',
                                        shadowOffset: { width: 0, height: 4 },
                                        shadowOpacity: 0.3,
                                        shadowRadius: 6,
                                        elevation: 8,
                                    }}>
                                        <Ionicons name="checkmark" size={32} color="white" />
                                    </View>

                                    <Text style={{
                                        fontSize: 24,
                                        lineHeight: 32,
                                        fontWeight: '700',
                                        color: '#111827',
                                        marginBottom: 8,
                                        textAlign: 'center',
                                    }}>
                                        {t('reviewModal.thankYou')}
                                    </Text>

                                    <Text style={{
                                        fontSize: 14,
                                        lineHeight: 20,
                                        color: '#6B7280',
                                        marginBottom: 16,
                                        textAlign: 'center',
                                    }}>
                                        {t('reviewModal.thankYouMessage')}
                                    </Text>

                                    <View className="flex-row items-center mb-2">
                                        {Array.from({ length: rating }, (_, i) => (
                                            <Ionicons
                                                key={i}
                                                name="star"
                                                size={20}
                                                color="#F59E0B"
                                                style={{ marginHorizontal: 2 }}
                                            />
                                        ))}
                                    </View>

                                    <View className='flex-row gap-2'>

                                        <Text style={{
                                            fontSize: 12,
                                            lineHeight: 16,
                                            color: '#6B7280',
                                            marginTop: 4,
                                        }} >
                                            {t('reviewModal.starRating', { rating })}
                                        </Text>
                                        <Ionicons name='checkmark-outline' size={24} color={'#10B981'} />

                                    </View>
                                </View>
                            </Animated.View>
                        )}
                    </Animated.View>
                </View>
            </ScreenWrapper>
        </Modal>

    );
};

export default ReviewModal;