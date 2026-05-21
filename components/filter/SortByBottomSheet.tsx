import React, { useEffect, useRef, useMemo } from 'react';
import {
    Animated,
    View,
    Text,
    TouchableOpacity,
    Pressable,
    Dimensions,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type Props = {
    visible: boolean;
    onClose: () => void;
    selected: string; // This should be the value, not the label
    onSelect: (value: string) => void; // Pass the value, not the label
};

export default function SortByBottomSheet({ visible, onClose, selected, onSelect }: Props) {
    const { t } = useTranslation();

    // Animation refs
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    // IMPORTANT: Define sort options with value and translation key
    // This ensures consistent behavior across language changes
    const sortOptions = useMemo(() => [
        {
            label: t('sortBy.all'),
            value: 'all', // Use lowercase consistent values
            icon: <Ionicons name="star" size={18} color="#3b82f6" />
        },
        {
            label: t('sortBy.priceLowHigh'),
            value: 'price_low_high',
            icon: <MaterialIcons name="arrow-upward" size={18} color="#666" />
        },
        {
            label: t('sortBy.priceHighLow'),
            value: 'price_high_low',
            icon: <MaterialIcons name="arrow-downward" size={18} color="#666" />
        },
        {
            label: t('sortBy.distanceNearFar'),
            value: 'distance_near_far',
            icon: <Ionicons name="location-outline" size={18} color="#10b981" />
        },
        {
            label: t('sortBy.distanceFarNear'),
            value: 'distance_far_near',
            icon: <Ionicons name="location-outline" size={18} color="#ef4444" />
        },
    ], [t]); // Re-compute when translation changes

    // IMPORTANT: Animation effect for show/hide
    // Runs both fade and slide animations in parallel
    useEffect(() => {
        if (visible) {
            // Show animations
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            // Hide animations
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: SCREEN_HEIGHT,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible, fadeAnim, slideAnim]);

    // IMPORTANT: Get display label for current selection
    // This ensures the selected value shows in current language
    const getDisplayLabel = (value: string): string => {
        const option = sortOptions.find(opt => opt.value === value);
        return option ? option.label : t('sortBy.all');
    };

    if (!visible) return null;

    return (
        <View className="absolute top-0 left-0 right-0 bottom-0 z-50">
            {/* IMPORTANT: Backdrop - closes sheet when tapped */}
            <Pressable onPress={onClose} className="absolute top-0 left-0 right-0 bottom-0">
                <Animated.View
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.4)',
                        opacity: fadeAnim,
                    }}
                />
            </Pressable>

            {/* IMPORTANT: Bottom Sheet Container with slide animation */}
            <Animated.View
                style={{
                    transform: [{ translateY: slideAnim }],
                }}
                className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl px-5 py-5 pb-12"
            >
                {/* Header */}
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-h3 font-bold text-text">
                        {t('sortBy.title')}
                    </Text>
                    <TouchableOpacity
                        onPress={onClose}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="close" size={24} color="#666" />
                    </TouchableOpacity>
                </View>

                {/* IMPORTANT: Sort Options List */}
                {/* Maps through options and highlights selected one */}
                {sortOptions.map((option, index) => {
                    const isSelected = selected === option.value;

                    return (
                        <TouchableOpacity
                            key={option.value} // Use value as key for consistency
                            className={`flex-row items-center justify-between mb-3 px-4 py-3 rounded-xl ${isSelected ? 'bg-blue-50' : 'bg-white'
                                }`}
                            onPress={() => {
                                onSelect(option.value); // Pass value, not label
                                onClose();
                            }}
                            activeOpacity={0.7}
                        >
                            <View className="flex-row items-center flex-1">
                                {option.icon}
                                <Text
                                    className={`ml-3 text-body w-full ${isSelected ? 'text-primary font-semibold' : 'text-text'
                                        }`}
                                >
                                    {option.label}
                                </Text>
                            </View>

                            {/* IMPORTANT: Radio button indicator */}
                            <Ionicons
                                name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                                size={22}
                                color={isSelected ? '#3b82f6' : '#D1D5DB'}
                            />
                        </TouchableOpacity>
                    );
                })}
            </Animated.View>
        </View>
    );
}

// IMPORTANT: Export helper function to get display label
// Use this in parent component to show selected sort option
export const getSortDisplayLabel = (value: string, t: any): string => {
    const sortMap: Record<string, string> = {
        'all': t('sortBy.all'),
        'price_low_high': t('sortBy.priceLowHigh'),
        'price_high_low': t('sortBy.priceHighLow'),
        'distance_near_far': t('sortBy.distanceNearFar'),
        'distance_far_near': t('sortBy.distanceFarNear'),
    };
    return sortMap[value] || t('sortBy.all');
};