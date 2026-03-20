import { View, Image, Text, Pressable } from 'react-native';
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
  userfileImage?: string;
  profileImage: string;
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
  userfileImage,
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
const imageUri = isReview ? backgroundImage : `${IMAGES_BASE_URL}${backgroundImage}`;
  const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
  const { t } = useTranslation()
  const getImageSource = () => {
    // Case 1: User selected a new local image (review mode)
    if (userfileImage && isReview) {
      return { uri: profileImage };
    }

    // Case 2: No local selection, but DB has image
    if (profileImage) {
      return { uri: IMAGES_BASE_URL + profileImage };
    }

    // Case 3: No image at all
    return proIMG;
  };

  return (
    <View className="relative">

      <Pressable
        onPress={() => navigation.navigate('ResumeImageViewer', { uri: isReview?backgroundImage:  IMAGES_BASE_URL + backgroundImage })}
        className="self-center w-full h-48"
      >
        <Image source={{ uri: isReview ? backgroundImage : `${IMAGES_BASE_URL}${backgroundImage}` }} className="w-full h-48" />
      </Pressable>

      <View className="items-start px-4 -mt-10 ">
       
        <Pressable
          onPress={() => navigation.navigate('ResumeImageViewer', { uri: IMAGES_BASE_URL + profileImage })}
          disabled={isReview? true : false}
        >
          <Image
            source={getImageSource()}
            className="w-20 h-20 rounded-full border-4 border-white"
            defaultSource={proIMG} // ເພີ່ມ defaultSource ສຳລັບ iOS
            onError={() => console.log("Failed to load profile image")}
          />
        </Pressable>

        {isme ? (
          <ProfileStatusPopup workStatus={status} isme />

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
                  onPress={() => navigation.navigate('Bookfreelancer', { userId })}
                  className="p-3 bg-red-100 rounded-full"
                >
                  <Text className="text-caption text-warning text-center">{t('freelancer_profile.make_a_book')}</Text>
                </Pressable>

                {/* Popup Box Positioned Below the Busy Button */}

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
