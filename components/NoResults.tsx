
import { MaterialIcons } from '@expo/vector-icons';
import { Text, View } from "react-native";

// No results UI component
type NoResultsProps = {
  title?: string;
  subtitle?: string;
  isShow?: boolean;
};
export function NoResults({subtitle, title, isShow}: NoResultsProps) {
  return (
    <View className="flex-1 justify-start items-center px-8">
      {isShow && <MaterialIcons name="search" size={80} color="#d1d5db" />}
   
      <Text className="mt-6 text-2xl font-semibold text-gray-300 text-center">
       {title || 'No Results Found'}
      </Text>
      <Text className="mt-2 text-base text-gray-300 text-center">
       
        {subtitle && `${subtitle}`}
      </Text>

    </View>
  );
}