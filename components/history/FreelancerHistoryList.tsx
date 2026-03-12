import {
  View,
  Text,
  Image,
  TouchableOpacity,
} from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';
import { Freelancer } from 'types/profile';
import { useTranslation } from 'react-i18next';



const BASE_IMAGE = process.env.EXPO_PUBLIC_IMAGES_URL

type Props = {
  data: Freelancer[];
  onRehire?: (freelancer: Freelancer) => void;
};

const FreelancerHistoryList = ({ data, onRehire }: Props) => {
  // log first item for debugging; guard against empty array


  const { t } = useTranslation();
  const navigator = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
  return (
    <View className="space-y-3">
      {data.map((item, idx) => (
        <View
          key={idx}
          className="flex-row items-start bg-white rounded-2xl pr-2 mb-2 border border-gray-200"
        >
          {/* Image */}
          <Image
            source={{ uri: BASE_IMAGE + item?.bannerImage }}
            className="w-[40%] h-44 rounded-xl mr-3"
            resizeMode="cover"
          />

          {/* Content */}
          <View className="flex-1 space-y-1 py-4">
            {/* Rating + Price */}
            {/* <View className="flex-row items-center w-full justify-between">
              <View className="flex-row items-center gap-2">
                <FontAwesome name="star" size={14} color="#facc15" />
                <Text className="ml-1 text-xs font-medium text-yellow-500">
                  {item?.starRating}
                </Text>
              </View>

              <View className="bg-blue-100 px-2 py-1 rounded-full">
                <Text className="text-xs font-semibold text-blue-600">
                  ${item.hourlyRateCurrency} / hour
                </Text>
              </View>
            </View> */}
            <View className="flex-row items-start justify-between  w-full">
              <View className="flex-row gap-2">
                <View className="flex-row items-center">
                  <FontAwesome name="star" size={14} color="#facc15" />
                  <Text className="ml-1 text-body font-medium text-yellow-500">
                    {item.starRating}
                  </Text>
                </View>

              </View>

              <View className="bg-blue-100 px-2 py-1 rounded-full ">

                <View className='flex-row'>
                  <Text className='font-bold text-warning '>{item.hourlyRateCurrency}</Text>
                  <Text className=' text-primary ml-2'>{new Intl.NumberFormat().format(item.hourlyRate)}</Text>
                </View>
              </View>


            </View>

            {/* Job Title */}
            <Text className="text-body font-semibold text-text" numberOfLines={1}>{item.jobTitle}</Text>

            {/* Description */}
            <Text className="text-body text-textSecondary" numberOfLines={1}>
              {item.customerExpect}
            </Text>

            {item?.address?.village !== '' && item?.address?.district !== '' && item.address?.province !== '' &&

              <View className="flex-row mt-3 items-center">

                <View className="flex-row gap-2 items-center">
                  <Ionicons name="location-outline" size={18} color="#F59E0B" />

                  <Text className="text-sm text-textSecondary">
                    {/* {formatDate(item.deadLine as string, currentLanguage)} */}

                    {item.address?.village}, {item.address?.district}, {item.address?.province}
                  </Text>
                </View>
              </View>
            }
            {/* Rehire Button */}
            <TouchableOpacity
              onPress={() => {
                navigator.navigate('Bookfreelancer', { userId: item._id });

                // console.log(item._id);
              }}
              className="mt-2 bg-primary rounded-2xl w-full px-4 py-2 self-start"
              activeOpacity={0.9}
            >
              <Text className="text-white text-body font-bold text-center">{t('workDetail.rehire_button')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
};

export default FreelancerHistoryList;
