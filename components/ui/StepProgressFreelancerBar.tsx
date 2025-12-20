import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';

type Props = {
  currentStep: number;
  steps: string[];
};

const StepProgressFreelancerBar: React.FC<Props> = ({ currentStep, steps }) => {
  const progress = useRef(new Animated.Value(0)).current;

  const targetPercent = (currentStep / (steps.length - 1)) * 100;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: targetPercent,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [targetPercent]);

  return (
    <View className="px-4 pt-2 pb-4 bg-white">

      {/* --- Progress Line Background --- */}
      <View className="relative w-full my-2">
        <View className="absolute top-[12px] left-0 right-0 h-2 bg-gray-300 opacity-30 rounded-lg" />

        {/* --- Animated Progress Foreground --- */}
        <Animated.View
          className="absolute top-[12px] left-0 h-2 bg-secondary rounded-lg"
          style={{
            width: progress.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
          }}
        />
      </View>

      {/* --- CURRENT STEP LABEL ONLY --- */}
      <Text className="text-primary font-semibold text-base mt-4">
        {steps[currentStep]}
      </Text>
    </View>
  );
};

export default StepProgressFreelancerBar;
