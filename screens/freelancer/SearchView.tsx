import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Pressable,
  FlatList,
  RefreshControl,
  Animated,
} from 'react-native';
import { MaterialIcons, FontAwesome, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';
import { NoResults } from 'components/NoResults';
import SortByBottomSheet, { getSortDisplayLabel } from 'components/filter/SortByBottomSheet';
import { useFreeLancers, useGetServiceTypes } from 'hooks/useFreelancer';
import { UserProfile } from 'types/profile';
import { useTranslation } from 'react-i18next';
import { SearchViewSkeleton } from 'skeletonScreens/ShimmerView';
import VDOPromote_free_profile from 'components/profile/VDOPromote-free-profile';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BASE_IMAGE = process.env.EXPO_PUBLIC_IMAGES_URL;

// Enhanced profile type with search metadata
interface EnhancedProfile extends UserProfile {
  serviceTypeName?: string;
  jobTitles?: string[];
  relevanceScore: number;

}

// Normalize string for fuzzy matching
const normalizeString = (str: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '') // Remove spaces
    .replace(/[^a-z0-9]/g, ''); // Remove special chars
};

// Calculate relevance score with weighted fields
const calculateRelevanceScore = (
  item: UserProfile,
  searchTerm: string,
  serviceTypeName?: string
): number => {
  if (!searchTerm) return 0;

  const normalizedSearch = normalizeString(searchTerm);
  let score = 0;

  const checkField = (value: string | undefined, exactWeight: number, partialWeight: number) => {
    if (!value) return;
    const normalized = normalizeString(value);
    if (normalized === normalizedSearch) {
      score += exactWeight;
    } else if (normalized.includes(normalizedSearch)) {
      score += partialWeight;
    } else if (normalizedSearch.includes(normalized) && normalized.length > 2) {
      score += partialWeight * 0.6;
    }
  };

  // Field weights (higher = more important)
  checkField(item.jobTitle, 100, 50);
  checkField(serviceTypeName, 90, 45); // Add serviceTypeName to scoring
  checkField(item.firstName, 80, 40);
  checkField(item.freelancerType, 70, 35);
  checkField(item.businessType, 60, 30);
  checkField(item.about, 50, 25);
  checkField(item.customerExpect, 50, 25);
  checkField(item.userCode, 30, 15);

  // Location fields
  if (item.address) {
    checkField(item.address.province, 40, 20);
    checkField(item.address.district, 40, 20);
    checkField(item.address.country, 40, 20);
  }

  return score;
};

// Check if item matches search term
const hasMatch = (
  item: UserProfile,
  searchTerm: string,
  serviceTypeName?: string
): boolean => {
  if (!searchTerm) return true;

  const normalized = normalizeString(searchTerm);
  const fields = [
    item.jobTitle,
    item.firstName,
    item.freelancerType,
    item.businessType,
    item.about,
    item.customerExpect,
    item.userCode,
    item.address?.province,
    item.address?.district,
    item.address?.country,
    serviceTypeName, // Add serviceTypeName to search fields
  ];

  return fields.some(field => field && normalizeString(field).includes(normalized));
};

// Sort filtered results
const sortResults = (
  results: EnhancedProfile[],
  sortBy: string
): EnhancedProfile[] => {
  const sorted = [...results];

  switch (sortBy) {
    case 'all':
      return sorted.sort((a, b) => {
        if (Math.abs(b.relevanceScore - a.relevanceScore) > 5) {
          return b.relevanceScore - a.relevanceScore;
        }
        return b.starRating - a.starRating;
      });

    case 'distance_near_far':
      return sorted.sort((a, b) => {
        const distDiff = (a.distanceScore || 0) - (b.distanceScore || 0);
        if (Math.abs(distDiff) > 0.1) return distDiff;
        return b.relevanceScore - a.relevanceScore;
      });

    case 'distance_far_near':
      return sorted.sort((a, b) => {
        const distDiff = (b.distanceScore || 0) - (a.distanceScore || 0);
        if (Math.abs(distDiff) > 0.1) return distDiff;
        return b.relevanceScore - a.relevanceScore;
      });

    case 'price_low_high':
      return sorted.sort((a, b) => {
        const priceDiff = a.hourlyRate - b.hourlyRate;
        if (Math.abs(priceDiff) > 1) return priceDiff;
        return b.relevanceScore - a.relevanceScore;
      });

    case 'price_high_low':
      return sorted.sort((a, b) => {
        const priceDiff = b.hourlyRate - a.hourlyRate;
        if (Math.abs(priceDiff) > 1) return priceDiff;
        return b.relevanceScore - a.relevanceScore;
      });

    default:
      return sorted.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }
};

export default function SearchView() {
  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
  const { t } = useTranslation();

  const { query } = route.params as { query: string };

  const [searchText, setSearchText] = useState(query);
  const [isSortVisible, setIsSortVisible] = useState(false);
  const [selectedSort, setSelectedSort] = useState('all');

  const { data: freelancers, isLoading: freelancersLoading, refetch, isRefetching } = useFreeLancers();
  const { data: serviceTypes, isLoading: serviceTypesLoading } = useGetServiceTypes();
 const insets = useSafeAreaInsets(); 
  // Create service type lookup map
  const serviceTypeMap = useMemo(() => {
    if (!serviceTypes) return new Map();
    return new Map(serviceTypes.map(st => [st._id || st._id, st.name]));
  }, [serviceTypes]);

  const scrollY = useRef(new Animated.Value(0)).current;
  // Filter and score results
  const filteredResults = useMemo(() => {
    if (!freelancers) return [];

    const normalizedSearch = normalizeString(searchText);

    // Empty search with only whitespace
    if (searchText && !normalizedSearch) {
      return [];
    }

    // Show all if truly empty
    if (!searchText) {
      return freelancers.map(item => ({
        ...item,
        serviceTypeName: serviceTypeMap.get(item.serviceType),
        relevanceScore: 0,
      }));
    }

    // Filter, score, and enhance
    const matched = freelancers
      .map(item => {
        // Get serviceTypeName BEFORE filtering
        const serviceTypeName = serviceTypeMap.get(item.serviceType);
        return {
          item,
          serviceTypeName,
        };
      })
      .filter(({ item, serviceTypeName }) => hasMatch(item, searchText, serviceTypeName))
      .map(({ item, serviceTypeName }) => ({
        ...item,
        serviceTypeName,
        relevanceScore: calculateRelevanceScore(item, searchText, serviceTypeName),
      }))
      .filter(item => item.relevanceScore > 0);


    return sortResults(matched, selectedSort);
  }, [freelancers, searchText, selectedSort, serviceTypeMap]);



  // Handle navigation to profile
  const handleProfilePress = useCallback((userId: string) => {
    navigation.navigate('FreelancerProfile', { userId });
  }, [navigation]);

  // Handle service type tag press
  const handleServiceTypePress = useCallback((tagName: string) => {
    setSearchText(tagName);
    setSelectedSort('all');
  }, []);

  // Loading state
  if (freelancersLoading || serviceTypesLoading) {
    return <SearchViewSkeleton />;
  }

  // Render freelancer card
  const renderFreelancerCard = ({ item }: { item: EnhancedProfile }) => (
    <Pressable
      onPress={() => handleProfilePress(item._id)}
      className=" w-[49.5%] mt-1 bg-white rounded-lg m-[1px] border border-border overflow-hidden"
    >
      {item.videoPromote !== null ? (
        <View className=''>
          <VDOPromote_free_profile video={item.videoPromote} context="home" scrollY={scrollY} />
        </View>
      ) : (
        <Image
          source={{ uri: BASE_IMAGE + item.bannerImage }}
          className="w-full h-28"
          resizeMode="cover"
        />
      )}

      <View className="p-3 space-y-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <FontAwesome name="star" size={12} color="#facc15" />
            <Text className="ml-1 text-caption font-medium text-yellow-500">
              {item.starRating}
            </Text>
          </View>
          <View className="p-1 bg-blue-50 rounded-full flex-row">
            <Text className="text-caption text-warning">{item.hourlyRateCurrency}</Text>
            <Text className="text-caption font-semibold text-primary ml-2">{item.hourlyRate}</Text>
            <Text className="text-caption text-primary">/ {t('freelancer_profile.hour') || 'hour'}</Text>
          </View>
        </View>

        <Text className="text-body font-semibold text-text" numberOfLines={1}>
          {item.jobTitle}
        </Text>

        {item.address && (
          <View className="flex-row items-center">
            <Ionicons name="location-outline" size={14} color="#6B7280" />
            <Text className="text-sm text-textSecondary flex-1 ml-1" numberOfLines={1}>
              {item.address.district}, {item.address.province}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );

  return (
    <>
      <View className="flex-1 bg-white" >
        {/* Header */}
        <View className="bg-primary pb-4 px-4 rounded-b-2xl shadow-sm" style={{ paddingTop: insets.top + 8 }}>
          <View className="flex-row items-center px-1 mb-1">
            <TouchableOpacity onPress={() => navigation.navigate('SearchBar', { text: '', focus: false })} className="p-1">
              <MaterialIcons name="chevron-left" size={32} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('SearchBar', { text: searchText, focus: true })}
              className="flex-1 ml-2"
            >
              <View className="flex-row items-center bg-white rounded-full px-4 py-4">
                <MaterialIcons name="search" size={20} color="#666" />
                <Text className="ml-2 text-gray-800 flex-1" numberOfLines={1}>
                  {searchText}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Service Type Tags */}
          {serviceTypes && serviceTypes.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
            >
              {serviceTypes.map((tag, index) => (
                <TouchableOpacity
                  key={tag._id || tag._id || index}
                  className="px-4 py-2 rounded-full mr-2 border mt-2 border-white/30"
                  onPress={() => handleServiceTypePress(tag.name)}
                >
                  <Text className="text-sm text-white">{tag.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Sort Bar */}
        <View
          className="bg-white px-4 py-3 border-b border-gray-100"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 2,
          }}
        >
          <TouchableOpacity
            onPress={() => setIsSortVisible(true)}
            className="flex-row items-center justify-between border border-gray-200 rounded-full px-4 py-2"
          >
            <View className="flex-row items-center">
              <MaterialIcons name="sort" size={18} color="#666" />
              <Text className="ml-2 text-sm text-gray-700">
                {getSortDisplayLabel(selectedSort, t)}
              </Text>
            </View>
            <MaterialIcons name="keyboard-arrow-down" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Results */}
        {filteredResults.length === 0 ? (
          <NoResults
            title={t('freelancer_profile.no_freelancer_found')}
            subtitle={t('freelancer_profile.search_another_key')}
          />
        ) : (
          <FlatList
            data={filteredResults}
            renderItem={renderFreelancerCard}
            keyExtractor={(item, index) => item._id || index.toString()}
            numColumns={2}                          // ← 2-column grid
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 2,
              paddingBottom: 64,
            }}
            onScroll={Animated.event(          // ← add this
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
            refreshControl={                        // ← pull to refresh
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                colors={['#3B82F6']}
                tintColor="#3B82F6"
              />
            }
          />
        )}
      </View>

      <SortByBottomSheet
        visible={isSortVisible}
        onClose={() => setIsSortVisible(false)}
        selected={selectedSort}
        onSelect={setSelectedSort}
      />
    </>
  );
}