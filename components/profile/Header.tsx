import { use, useState } from 'react';
import { View, Image, Text, Pressable, TouchableWithoutFeedback } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';
import ProfileStatusPopup from './ProfileStatusPopup';
import { useTranslation } from 'react-i18next';
import { profileImage as proIMG } from 'assets';

const IMAGES_BASE_URL = process.env.EXPO_PUBLIC_IMAGES_URL;

type HeaderProps = {
  userId: string
  backgroundImage?: string;
  profileImage?: string;
  name: string;
  job: string;
  rating: number;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  busyUntil?: string | null;
  ishidden?: boolean
  isme?: boolean,
  isReview?: boolean
};

export default function Header({
  userId,
  backgroundImage,
  profileImage,
  name,
  job,
  rating,
  status,
  busyUntil,
  ishidden
  , isme
  , isReview
}: HeaderProps) {

  const [showPopup, setShowPopup] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
  const { t } = useTranslation()
  return (
    <View className="relative">
      <Image source={{ uri: isReview ? backgroundImage : `${IMAGES_BASE_URL}${backgroundImage}` }} className="w-full h-48" />

      <View className="items-start px-4 -mt-10 relative z-0">
        {/* <Image source={{ uri: isReview? profileImage : IMAGES_BASE_URL + profileImage }} className="w-20 h-20 rounded-full border-4 border-white" /> */}

        <Image
          source={
            isReview
              ? profileImage
              : profileImage
                ? { uri: IMAGES_BASE_URL + profileImage }
                : proIMG
          }
          className="w-20 h-20 rounded-full border-4 border-white"
        />
        {isme ? (
          <ProfileStatusPopup workStatus={status}  isme />
         
        ) : (
          <View className="absolute right-4 top-12  flex-row items-center gap-8">
            {status === 'ACTIVE' ? (
              <View className="p-3 bg-gray-200 rounded-full">
                <Text className="text-caption text-green-500 text-center w-20">{t('freelancer_profile.active')}</Text>
              </View>
            ) : (
              <View className="items-end">
                {/* Busy Button */}
                <Pressable
                  onPress={() => setShowPopup(true)}
                  className="p-3 bg-red-100 rounded-full"
                >
                  <Text className="text-caption text-warning text-center">Make a Book</Text>
                </Pressable>

                {/* Popup Box Positioned Below the Busy Button */}
                {showPopup && (
                  <>
                    {/* Overlay to detect outside touches */}
                    <TouchableWithoutFeedback onPress={() => setShowPopup(false)}>
                      {/* <View className="absolute -top-12 -left-0 w-full h-full bg-black " /> */}

                      {/* Actual popup box */}
                      <View className="bg-primary rounded-2xl px-4 py-4 w-72 shadow-lg mt-2 z-2">
                        <Text className="text-white text-sm font-semibold mb-2">
                          {t('freelancer_profile.busy')}
                        </Text>

                        <View className="bg-blue-300 py-2 px-3 rounded-xl mb-3">
                          <Text className="text-white text-center text-base">{busyUntil}</Text>
                        </View>

                        <Pressable
                          onPress={() => {
                            setShowPopup(false);
                            navigation.navigate('Bookfreelancer', { userId });
                            // Alert.alert('Booking', 'You have successfully booked this freelancer.');
                          }}
                          className="bg-blue-100 px-6 py-2 rounded-full self-end"
                        >
                          <Text className="text-blue-600 text-sm font-semibold">Book</Text>
                        </Pressable>
                      </View>
                    </TouchableWithoutFeedback>


                  </>
                )}
              </View>

            )}

          </View>
        )}



        {/* </View> */}
        <View style={{ width: 164 }}>

          <Text className="font-bold text-subheading mb-2 text-gray-800 ">{name}</Text>
        </View>

        <Text className="text-body text-textSecondary mb-2">{job}</Text>
        <View className="flex-row space-x-2 mt-1">
          <MaterialIcons name="star" size={16} color="#facc15" />
          <Text className="text-blue-600 font-medium text-body">{rating} (0 {t('freelancer_profile.reviews')})</Text>
        </View>
      </View>
    </View>
  );
}
