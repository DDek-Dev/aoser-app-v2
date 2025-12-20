import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  onPress?: () => void;
  style?: any;
};

export default function VideoPlaceholder({ onPress, style }: Props) {
  return (
    <View className="px-4 py-3">
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        className="rounded-lg overflow-hidden"
        style={[{ aspectRatio: 16 / 9 }, style]}
      >
        {/* Frame background */}
        <View className="flex-1 bg-gray-200 border border-gray-300 rounded-lg justify-center items-center">
          {/* inner frame border (slightly inset) */}
          <View className="absolute inset-2 border-2 border-dashed border-gray-300 rounded-lg" />

          {/* Play icon */}
          <View className="justify-center items-center">
            <View className="bg-white rounded-full p-3 shadow">
              <Ionicons name="play" size={28} color="#374151" />
            </View>

            <Text className="text-sm text-gray-500 mt-3">No video</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}
