import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

export const NotificationNoResult = () => (
  <View className="flex-1 justify-center items-center px-6">
    <View className="w-48 h-48 bg-background rounded-full justify-center items-center mb-6">
      <Ionicons name="time-outline" size={64} color="#E5E7EB" />
    </View>
    <Text className="text-xl font-semibold text-textSecondary mb-2">
      No Notification yet
    </Text>
    <Text className="text-gray-500 text-center mb-8">
        Notifications you receive will appear here
    </Text>
  </View>
);
