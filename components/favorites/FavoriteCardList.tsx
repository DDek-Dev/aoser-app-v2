import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';
import { GetFavorite } from 'types';
import { useTranslation } from 'react-i18next';

type Props = {
  data: GetFavorite[];
};

const BASE_IMAGE = process.env.EXPO_PUBLIC_IMAGES_URL


const FavoriteCardList = ({ data }: Props) => {
  const navigator = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
  const { t } = useTranslation();
  const workItems = data.filter((items) => items.likedItemType === "UserProfile");


  if (data.length === 0 || !data || workItems.length === 0) {
    return (
      <View className="flex-1 justify-center items-center  px-6">
        <View className="w-48 h-48 bg-background rounded-full justify-center items-center mb-6">
          <Ionicons name="heart-outline" size={64} color="#E5E7EB" />
        </View>
        <Text className="text-xl font-semibold text-textSecondary  mb-2">
          {t('favorites.work.no_favorite')}
        </Text>
        <Text className="text-gray-500 text-center mb-8">
          {t('favorites.work.items_will_appear_here')}
        </Text>

      </View>
    );
  }
  return (
    <View className="space-y-3">
      {data.filter((items) => items.likedItemType === "UserProfile").map((item, index) => (
        <Pressable
          onPress={() => navigator.navigate('FreelancerProfile', { userId: item.likedItem._id })}
          key={index}
          className="flex-row items-start bg-white rounded-2xl pr-2 mb-2 border border-gray-200"
        >
          <Image
            source={{ uri: BASE_IMAGE + item.likedItem.bannerImage }}
            className="w-[40%] h-44 rounded-xl mr-3"
            resizeMode="cover"
          />

          <View className="flex-1 space-y-1 py-4 overflow-hidden">
            <View className="flex-row items-start  w-full">
              {/* <View className="flex-row gap-2">
                <View className="flex-row items-center">
                  <FontAwesome name="star" size={14} color="#facc15" />
                  <Text className="ml-1 text-body font-medium text-yellow-500">
                    {item.likedItem.starRating}
                  </Text>
                </View>
               
              </View> */}

              <View className="bg-blue-100 px-2 py-1 rounded-full ">

                <View className='flex-row'>
                  <Text className='font-bold text-warning '>{item.likedItem.hourlyRateCurrency}</Text>
                  <Text className=' text-primary ml-2'>{new Intl.NumberFormat().format(item.likedItem.hourlyRate)}</Text>
                </View>
              </View>

              <View className="absolute top-2 right-2">
                <FontAwesome name="heart" size={20} color="#EF4444" />
              </View>
            </View>

            <Text className="text-body my-2 font-bold text-text">{item.likedItem.jobTitle}</Text>
            <Text className="text-body text-textSecondary" numberOfLines={2}>
              {item.likedItem.customerExpect}
            </Text>
            {item.likedItem.address.village !== '' && item.likedItem.address.district !== '' && item.likedItem?.address.province !== '' &&

              <View className="flex-row mt-3 items-center">


                <View className="flex-row gap-2 items-center">
                  <Ionicons name="location-outline" size={18} color="#F59E0B" />

                  <Text className="text-sm text-textSecondary" numberOfLines={1}>
                    {/* {formatDate(item.deadLine as string, currentLanguage)} */}

                    {item.likedItem?.address.village}, {item.likedItem?.address.district}, {item.likedItem?.address.province}
                  </Text>
                </View>
              </View>
            }
          </View>

        </Pressable>
      ))}
    </View>
  );
};

export default FavoriteCardList;
