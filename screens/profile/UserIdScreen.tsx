import { View, Text, Image } from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';
import { UserProfile } from 'types/profile';
import { useEffect } from 'react';
import Header_back from 'components/ui/Header_back';
import ScreenWrapper from 'components/ui/ScreenWrapper';

type UserIdScreenRouteProp = RouteProp<FreelancerStackParamList, 'UserIdScreen'>;

type Props = {
  route: UserIdScreenRouteProp;
};

const UserIdScreen = ({ route }: Props) => {
  const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
  const params = route?.params;
  const userData = params?.userId as UserProfile | undefined;

  const BASE_IMAGE = process.env.EXPO_PUBLIC_IMAGES_URL || '';

  // Log the received data
  useEffect(() => {


    if (!userData) {
      console.warn('⚠️ No user data received in UserIdScreen');
      navigation.goBack();
    }
  }, [userData, navigation]);

  // Fallback data if none is provided
  const displayUser = userData || {
    _id: 'unknown',
    firstName: 'Guest',
    lastName: 'User',
    user: { _id: '', email: 'guest@example.com' },
    userProfileImage: '',
  };

  // Generate a user ID from _id or create a placeholder
  const userId = userData?._id?.substring(0, 4).toUpperCase() || 'XXXX';

  return (
    <ScreenWrapper safeEdges={['top']} style={{ flex: 1 }}>

      <Header_back text="User ID" iconColor='#3B82F6' onPress={() => navigation.goBack()} />
      <View className='px-4'>

        {/* Profile */}
        <View className="items-center mt-4">
          {displayUser.userProfileImage && (
            <Image
              source={{ uri: BASE_IMAGE + displayUser.userProfileImage }}
              className="w-20 h-20 rounded-full mb-3"
            />
          )}
          <Text className="text-heading font-bold text-text">
            {displayUser.firstName} {displayUser.lastName}
          </Text>
          <Text className="text-caption text-textSecondary">
            {displayUser?.user?.email || 'No email available'}
          </Text>
        </View>

        {/* ID Card */}
        <View className="bg-blue-100 mt-10 rounded-3xl px-6 py-10 mx-2 border border-border">
          <View className="bg-white rounded-xl py-8 px-6 mx-6 items-center justify-center">
            <Text className="text-3xl font-semibold tracking-widest text-yellow-400">
              {userId}
            </Text>
          </View>
          <Text className="text-xs text-center text-textSecondary mt-6">
            This is your unique user ID. Please show it when required.
          </Text>
        </View>

      </View>
    </ScreenWrapper>
  );
};

export default UserIdScreen;
