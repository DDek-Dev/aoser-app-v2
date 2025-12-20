import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";


export const FavoriteNoResult = () => {

  const { t } = useTranslation();
  return (

    <View className="flex-1 justify-center items-center px-6">
      <View className="w-48 h-48 bg-background rounded-full justify-center items-center mb-6">
        <Ionicons name="time-outline" size={64} color="#E5E7EB" />
      </View>
      <Text className="text-xl font-semibold text-textSecondary mb-2">
        {t('favorites.favorite_no_result.no_favorite')}
      </Text>
      <Text className="text-gray-500 text-center mb-8">
        {t('favorites.favorite_no_result.items_will_appear_here')}
      </Text>
    </View>

  )
}

