import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,

  TouchableOpacity,
  ScrollView,
  Image,
  Animated,
  Pressable,
} from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';
import { NoResults } from 'components/NoResults';
import SortByBottomSheet from 'components/filter/SortByBottomSheet';
import { useFreeLancers, useGetServiceTypes } from 'hooks/useFreelancer';
import LoadingScreen from 'screens/Loading/LoadingScreen';
import { UserProfile } from 'types/profile';


const searchTags = ['Shopping web', 'Company website', 'Portfolio', 'Home page'];

const BASE_IMAGE = process.env.EXPO_PUBLIC_IMAGES_URL

export default function SearchView() {
  // const navigation = useNavigation();
  const route = useRoute();
  const { query } = route.params as { query: string };
  const { data, isLoading, refetch } = useFreeLancers();
  const { data: serviceTypes, isLoading: serviceTypesLoading, isError } = useGetServiceTypes();
  console.log("serviceTypes", serviceTypes);
  const [searchText, setSearchText] = useState(query);
  const [filteredResults, setFilteredResults] = useState<UserProfile[]>(data || []);
  type SearchBarNavigationProp = NativeStackNavigationProp<FreelancerStackParamList, 'SearchBar'>;

  // make sortby component
  const [isSortVisible, setIsSortVisible] = useState(false);
  const [selectedSort, setSelectedSort] = useState('All');





  const navigation = useNavigation<SearchBarNavigationProp>();

  useEffect(() => {
    const lower = searchText.toLowerCase();
    if (!data) return;
    const matches = data?.filter(item =>
      // item.jobTitle.toLowerCase().includes(lower)
      item.jobTitle && item.jobTitle.toLowerCase().includes(lower)
    );

    let sortedMatches = [...matches];

    switch (selectedSort) {
      case 'All':
        sortedMatches.sort((a, b) => b.starRating - a.starRating);
        break;
      case 'Distance: Near to Far':
        sortedMatches.sort((a, b) => a.distanceScore - b.distanceScore);
        break;
      case 'Distance: Far to Near':
        sortedMatches.sort((a, b) => b.distanceScore - a.distanceScore);
        break;
      case 'Price: Low to High':
        sortedMatches.sort((a, b) => a.hourlyRate - b.hourlyRate);
        break;
      case 'Price: High to Low':
        sortedMatches.sort((a, b) => b.hourlyRate - a.hourlyRate);
        break;
      default:
        break;
    }

    setFilteredResults(sortedMatches);
  }, [searchText, selectedSort]);


  // Create animated value
  const scrollY = useRef(new Animated.Value(0)).current;



  if (isLoading || !data || serviceTypesLoading || !serviceTypes) return <LoadingScreen />
  return (

    <>

      {/* <SafeAreaView className="flex-1 bg-black"> */}
      <View className="flex-1 bg-white rounded-t-3xl overflow-hidden pb-12">
        {/* App Bar */}
        <View className="bg-blue-600 pt-12 pb-4  z-20 rounded-2xl">
          <View className="flex-row items-center px-4">
            <TouchableOpacity onPress={() => navigation.goBack()} className="p-1">
              <MaterialIcons name="chevron-left" size={32} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('SearchBar', { text: searchText, focus: true })}
              className="w-full flex-1"
            >
              <View className="flex-row items-center bg-white rounded-full px-3 py-4 border border-gray-300 ">
                <Text className="ml-2 text-black">{searchText}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Tags */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
            {serviceTypes.map((tag, index) => (
              <TouchableOpacity
                key={index}
                className=" px-4 py-1 rounded-full ml-3" style={{ borderColor: '#9ca3af', borderWidth: 1 }}
                onPress={() => setSearchText(tag.name)}
              >
                <Text className="text-sm text-white">{tag.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Sticky Sort Bar */}
        <View
          className="bg-white px-4 py-2 z-10"
          style={{
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 1,
            shadowRadius: 1,
          }}
        >


          <TouchableOpacity

            onPress={() => setIsSortVisible(true)}
            className="flex-row items-center border w-full border-gray-200 rounded-full px-4 py-2"
          >
            <MaterialIcons name="sort" size={18} color="#666" />
            <Text className="ml-2 text-sm text-gray-600">{selectedSort}</Text>
          </TouchableOpacity>
        </View>

        {/* Results */}
        {filteredResults.length === 0 ? (
          <NoResults title={'No freelancers found'} subtitle={'Try searching with different keywords or check your spelling.'} />

        ) : (
          <Animated.FlatList
            data={filteredResults}
            showsVerticalScrollIndicator={false}
            keyExtractor={(item, index) => index.toString()}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true }
            )}
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20, paddingTop: 20 }}

            renderItem={({ item }) => (

              <Pressable
                key={item._id}
                onPress={() => navigation.navigate('FreelancerProfile', { userId: item._id })}
              >

                <View className="flex-row items-start bg-white rounded-2xl pr-2 mb-2 border border-gray-200">
                  <Image
                    source={{ uri: BASE_IMAGE + item.bannerImage }}
                    className="w-[40%] h-44 rounded-xl mr-3"
                    resizeMode="cover"
                  />
                  <View className="flex-1 space-y-1 py-4">
                    <View className="flex-row items-center justify-between w-full">
                      <View className='flex-row gap-2'>
                        <View className="flex-row items-center">
                          <FontAwesome name="star" size={14} color="#facc15" />
                          <Text className="ml-1 text-xs font-medium text-yellow-500">{item.starRating}</Text>
                        </View>

                      </View>
                      <View className="bg-blue-100 px-2 py-1 rounded-full">
                        <Text className="text-xs font-semibold text-blue-600">${item.hourlyRate} / hour</Text>
                      </View>
                    </View>
                    <Text className="text-sm font-semibold text-gray-800">{item.jobTitle}</Text>
                    <Text className="text-xs text-gray-500" numberOfLines={5}>
                      {item.customerExpect}
                    </Text>
                  </View>
                </View>

              </Pressable>
            )}
          />
        )}
      </View>

      <SortByBottomSheet
        visible={isSortVisible}
        onClose={() => setIsSortVisible(false)}
        selected={selectedSort}
        onSelect={(option) => setSelectedSort(option)}
      />
      {/* </SafeAreaView> */}

    </>
  );
}
