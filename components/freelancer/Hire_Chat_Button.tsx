
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';
import { use } from 'react';
import { useTranslation } from 'react-i18next';


export default function Hire_Chat_Button({
  userId,

}: {
  userId: string;

}) {
  const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
  const { t } = useTranslation()
  return (
    <>
      <View className="flex-row justify-center  items-center px-4 gap-2 w-full selection:mt-4" style={styles.blueShadow}>
        <Pressable
          onPress={() => {
            // onHire();
            navigation.navigate('Bookfreelancer', { userId: userId });
          }}
          className="bg-primary w-[80%] px-6 py-4 rounded-full">
          <Text className="text-white font-semibold text-center">{t('freelancer_profile.hire')}</Text>
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate('RoomChat', { userId: userId })}
          className=" px-4 py-4 rounded-full bg-border">
          <Ionicons name="chatbubble-ellipses" size={28} color="#3b82f6" />
        </Pressable>

      </View>
    </>
  );
}
const styles = StyleSheet.create({
  blueShadow: {
    shadowColor: '#3b82f6', // Tailwind's blue-500
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8, // for Android
  },
});


