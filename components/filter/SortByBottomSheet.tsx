import React, { useEffect, useRef } from 'react';
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
    selected: string;
    onSelect: (option: string) => void;
};

export default function SortByBottomSheet({ visible, onClose, selected, onSelect }: Props) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;


    const { t } = useTranslation();
    const sortOptions = [
        { label: `${t('sortBy.all')}`, value: 'All', icon: <Ionicons name="star" size={18} color="#3b82f6" /> },
        { label: `${t('sortBy.high_low')}`, value: 'Price: Low to High', icon: <MaterialIcons name="sort" size={18} color="#666" /> },
        { label: `${t('sortBy.low_high')}`, value: 'Price: High to Low', icon: <MaterialIcons name="sort" size={18} color="#666" /> },
        { label: `${t('sortBy.near_far')}`, value: 'Distance: Near to Far', icon: <Ionicons name="location-outline" size={18} color="#666" /> },
        { label: `${t('sortBy.far_near')}`, value: 'Distance: Far to Near', icon: <Ionicons name="location-outline" size={18} color="#666" /> },
    ];
    useEffect(() => {
        if (visible) {
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
    }, [visible]);

    if (!visible) return null;

    return (
        <View className="absolute top-0 left-0 right-0 bottom-0 z-50">
            {/* Fade Black Background */}
            <Pressable onPress={onClose} className="absolute top-0 left-0 right-0 bottom-0">
                <Animated.View
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.4)',
                        opacity: fadeAnim,
                    }}
                />
            </Pressable>

            {/* White Bottom Sheet */}
            {/* <Animated.View
        style={{
          transform: [{ translateY: slideAnim }],
        }}
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-5"
      > */}
            <Animated.View
                style={{
                    transform: [{ translateY: slideAnim }],
                }}
                className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl px-5 p-5 pb-12"
            >
                {/* Header */}
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-base font-semibold text-gray-800">Sort by</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={22} color="#666" />
                    </TouchableOpacity>
                </View>

                {/* Sort Options */}
                {sortOptions.map((option, index) => (
                    <TouchableOpacity
                        key={index}
                        className="flex-row items-center justify-between mb-4 px-6 py-1"
                        onPress={() => {
                            onSelect(option.label);
                            onClose();
                        }}
                    >
                        <View className="flex-row items-center">
                            {option.icon}
                            <Text className="ml-3 text-gray-700">{option.label}</Text>
                        </View>
                        <Ionicons
                            name={selected === option.value ? 'radio-button-on' : 'radio-button-off'}
                            size={20}
                            color="#3b82f6"
                        />
                    </TouchableOpacity>
                ))}
            </Animated.View>
        </View>
    );
}
