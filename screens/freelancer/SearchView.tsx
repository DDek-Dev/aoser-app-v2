import { useState, useEffect, useRef, useMemo } from 'react';
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
import SortByBottomSheet, { getSortDisplayLabel } from 'components/filter/SortByBottomSheet';
import { useFreeLancers, useGetServiceTypes } from 'hooks/useFreelancer';
import LoadingScreen from 'screens/Loading/LoadingScreen';
import { UserProfile } from 'types/profile';
import { useTranslation } from 'react-i18next';

const BASE_IMAGE = process.env.EXPO_PUBLIC_IMAGES_URL;

// IMPORTANT: Helper function for fuzzy string matching
const normalizeString = (str: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/\s+/g, '') // Remove all spaces
    .replace(/[^a-z0-9]/g, ''); // Remove special characters
};

const hasStrictMatch = (item: EnhancedProfile, searchTerm: string): boolean => {
  if (!searchTerm) return true;

  const s = normalizeString(searchTerm);

  const fields = [
    item.jobTitle,
    item.serviceTypeName,
    item.firstName,
    item.freelancerType,
    item.businessType,
    item.about,
    item.customerExpect,
    item.userCode,
    ...(item.jobTitles || []),
    item.address?.province,
    item.address?.district,
    item.address?.country,
  ];

  return fields.some(field =>
    field && normalizeString(field).includes(s)
  );
};

// IMPORTANT: Enhanced profile type with merged data
interface EnhancedProfile extends UserProfile {
  serviceTypeName?: string;
  jobTitles?: string[];
  relevanceScore?: number;
}

// IMPORTANT: Calculate relevance score
const calculateRelevanceScore = (item: EnhancedProfile, searchTerm: string): number => {
  if (!searchTerm) return 0;
  
  const normalizedSearch = normalizeString(searchTerm);
  let score = 0;

  // Job Title (weight: 10)
  if (item.jobTitle) {
    const normalized = normalizeString(item.jobTitle);
    if (normalized === normalizedSearch) score += 100;
    else if (normalized.includes(normalizedSearch)) score += 50;
    else if (normalizedSearch.includes(normalized)) score += 30;
  }

  // Service Type Name (weight: 9)
  if (item.serviceTypeName) {
    const normalized = normalizeString(item.serviceTypeName);
    if (normalized === normalizedSearch) score += 90;
    else if (normalized.includes(normalizedSearch)) score += 45;
    else if (normalizedSearch.includes(normalized)) score += 25;
  }

  // Job Titles from jobs array (weight: 9)
  if (item.jobTitles && Array.isArray(item.jobTitles)) {
    item.jobTitles.forEach(jobTitle => {
      if (jobTitle) {
        const normalized = normalizeString(jobTitle);
        if (normalized === normalizedSearch) score += 90;
        else if (normalized.includes(normalizedSearch)) score += 45;
        else if (normalizedSearch.includes(normalized)) score += 25;
      }
    });
  }

  // First Name (weight: 8)
  if (item.firstName) {
    const normalized = normalizeString(item.firstName);
    if (normalized === normalizedSearch) score += 80;
    else if (normalized.includes(normalizedSearch)) score += 40;
  }

  // Freelancer Type (weight: 7)
  if (item.freelancerType) {
    const normalized = normalizeString(item.freelancerType);
    if (normalized === normalizedSearch) score += 70;
    else if (normalized.includes(normalizedSearch)) score += 35;
  }

  // Business Type (weight: 6)
  if (item.businessType) {
    const normalized = normalizeString(item.businessType);
    if (normalized === normalizedSearch) score += 60;
    else if (normalized.includes(normalizedSearch)) score += 30;
  }

  // About (weight: 5)
  if (item.about) {
    const normalized = normalizeString(item.about);
    if (normalized.includes(normalizedSearch)) score += 25;
  }

  // Customer Expect (weight: 5)
  if (item.customerExpect) {
    const normalized = normalizeString(item.customerExpect);
    if (normalized.includes(normalizedSearch)) score += 25;
  }

  // Location fields (weight: 4)
  if (item.address) {
    ['province', 'district', 'country'].forEach(field => {
      const value = item.address.country || item.address.province || item.address.district;
      if (value) {
        const normalized = normalizeString(value);
        if (normalized === normalizedSearch) score += 40;
        else if (normalized.includes(normalizedSearch)) score += 20;
      }
    });
  }

  // User Code (weight: 3)
  if (item.userCode) {
    const normalized = normalizeString(item.userCode);
    if (normalized === normalizedSearch) score += 30;
    else if (normalized.includes(normalizedSearch)) score += 15;
  }

  return score;
};

export default function SearchView() {
  const route = useRoute();
  const { query } = route.params as { query: string };
  
  // Fetch all data
  const { data: freelancers, isLoading: freelancersLoading } = useFreeLancers();
  const { data: serviceTypes, isLoading: serviceTypesLoading } = useGetServiceTypes();
  // IMPORTANT: Add hook to fetch all jobs if you have it
  // const { data: jobs, isLoading: jobsLoading } = useGetJobs();
  
  const [searchText, setSearchText] = useState(query);
  const [filteredResults, setFilteredResults] = useState<EnhancedProfile[]>([]);
  const [isSortVisible, setIsSortVisible] = useState(false);
  const [selectedSort, setSelectedSort] = useState('all');

  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList, 'SearchBar'>>();

  // IMPORTANT: Merge freelancer data with service types and jobs
  // This runs whenever data changes
  const enhancedFreelancers = useMemo(() => {
    if (!freelancers || !serviceTypes) return [];

    // Create lookup maps for O(1) access
    const serviceTypeMap = new Map(
      serviceTypes.map(st => [st._id || st._id, st.name])
    );

    // OPTIONAL: If you have jobs data
    // const jobMap = new Map(
    //   jobs?.map(job => [job._id || job.id, job.title]) || []
    // );

    // Enhance each freelancer with related data
    return freelancers.map(freelancer => {
      const enhanced: EnhancedProfile = {
        ...freelancer,
        serviceTypeName: undefined,
        jobTitles: [],
      };

      // Add service type name
      if (freelancer.serviceType) {
        const serviceTypeName = serviceTypeMap.get(freelancer.serviceType);
        if (serviceTypeName) {
          enhanced.serviceTypeName = serviceTypeName;
        }
      }

      // Add job titles
      if (freelancer.jobs && Array.isArray(freelancer.jobs)) {
        // OPTION 1: If you don't have jobs data, skip this
        // enhanced.jobTitles = [];
        
        // OPTION 2: If you have jobs data
        // enhanced.jobTitles = freelancer.jobs
        //   .map(jobId => jobMap.get(jobId))
        //   .filter(Boolean);
        
        // OPTION 3: If jobs are already objects with title
        // enhanced.jobTitles = freelancer.jobs
        //   .map(job => job.title)
        //   .filter(Boolean);
      }

      return enhanced;
    });
  }, [freelancers, serviceTypes]); // Re-run when data changes

  // IMPORTANT: Filter and sort with relevance scoring
  useEffect(() => {
    if (!enhancedFreelancers || enhancedFreelancers.length === 0) return;

    const normalizedSearch = normalizeString(searchText);

    
    if (searchText && !normalizedSearch) {
  setFilteredResults([]); // show NoResults
  return;
}

// ✅ Truly empty search
if (!searchText) {
  setFilteredResults(enhancedFreelancers);
  return;
}
    // If search is empty, show all
    if (!normalizedSearch) {
      setFilteredResults(enhancedFreelancers);
      return;
    }

    // Calculate relevance scores and filter
    const matchedItems = enhancedFreelancers
     .filter(item => hasStrictMatch(item, searchText))
      .map(item => ({
        ...item,
        relevanceScore: calculateRelevanceScore(item, searchText),
      }))
      .filter(item => item.relevanceScore > 0);

    // Apply sorting
    let sortedMatches = [...matchedItems];

    switch (selectedSort) {
      case 'all':
        sortedMatches.sort((a, b) => {
          if (b.relevanceScore !== a.relevanceScore) {
            return b.relevanceScore - a.relevanceScore;
          }
          return b.starRating - a.starRating;
        });
        break;

      case 'distance_near_far':
        sortedMatches.sort((a, b) => {
          const distDiff = a.distanceScore - b.distanceScore;
          if (Math.abs(distDiff) > 0.1) return distDiff;
          return b.relevanceScore - a.relevanceScore;
        });
        break;

      case 'distance_far_near':
        sortedMatches.sort((a, b) => {
          const distDiff = b.distanceScore - a.distanceScore;
          if (Math.abs(distDiff) > 0.1) return distDiff;
          return b.relevanceScore - a.relevanceScore;
        });
        break;

      case 'price_low_high':
        sortedMatches.sort((a, b) => {
          const priceDiff = a.hourlyRate - b.hourlyRate;
          if (Math.abs(priceDiff) > 1) return priceDiff;
          return b.relevanceScore - a.relevanceScore;
        });
        break;

      case 'price_high_low':
        sortedMatches.sort((a, b) => {
          const priceDiff = b.hourlyRate - a.hourlyRate;
          if (Math.abs(priceDiff) > 1) return priceDiff;
          return b.relevanceScore - a.relevanceScore;
        });
        break;

      default:
        sortedMatches.sort((a, b) => {
          if (b.relevanceScore !== a.relevanceScore) {
            return b.relevanceScore - a.relevanceScore;
          }
          return b.starRating - a.starRating;
        });
        break;
    }

    setFilteredResults(sortedMatches);
  }, [searchText, selectedSort, enhancedFreelancers]);

  const scrollY = useRef(new Animated.Value(0)).current;

  // Show loading if any required data is loading
  if (freelancersLoading || serviceTypesLoading || !freelancers || !serviceTypes) {
    return <LoadingScreen />;
  }

  return (
    <>
      <View className="flex-1 bg-white rounded-t-3xl overflow-hidden pb-12">
        {/* App Bar */}
        <View className="bg-blue-600 pt-12 pb-4 z-20 rounded-2xl">
          <View className="flex-row items-center px-4">
            <TouchableOpacity onPress={() => navigation.goBack()} className="p-1">
              <MaterialIcons name="chevron-left" size={32} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('SearchBar', { text: searchText, focus: true })}
              className="w-full flex-1"
            >
              <View className="flex-row items-center bg-white rounded-full px-3 py-4 border border-gray-300">
                <Text className="ml-2 text-black">{searchText}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Service Type Tags */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
            {serviceTypes.map((tag, index) => (
              <TouchableOpacity
                key={tag._id || tag._id || index}
                className="px-4 py-1 rounded-full ml-3"
                style={{ borderColor: '#9ca3af', borderWidth: 1 }}
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
            <Text className="ml-2 text-sm text-gray-600">
              {getSortDisplayLabel(selectedSort, t)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Results */}
        {filteredResults.length === 0 ? (
          <NoResults
            title={t('freelancer_profile.no_freelancer_found')}
            subtitle={t('freelancer_profile.search_another_key')}
          />
        ) : (
          <>
            {/* Results count */}
            {/* <View className="px-4 py-2">
              <Text className="text-sm text-gray-600">
                {filteredResults.length} {t('freelancer_profile.results_found') || 'results found'}
              </Text>
            </View> */}

            <Animated.FlatList
              data={filteredResults}
              showsVerticalScrollIndicator={false}
              keyExtractor={(item, index) => item._id || index.toString()}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: true }
              )}
              scrollEventThrottle={16}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingBottom: 20,
              }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => navigation.navigate('FreelancerProfile', { userId: item._id })}
                >
                  <View className="flex-row items-start mt-4 bg-white rounded-2xl pr-2 mb-2 border border-gray-200">
                    <Image
                      source={{ uri: BASE_IMAGE + item.bannerImage }}
                      className="w-[40%] h-44 rounded-xl mr-3"
                      resizeMode="cover"
                    />
                    <View className="flex-1 space-y-1 py-4">
                      <View className="flex-row items-center justify-between w-full">
                        <View className="flex-row gap-2">
                          <View className="flex-row items-center">
                            <FontAwesome name="star" size={14} color="#facc15" />
                            <Text className="ml-1 text-xs font-medium text-yellow-500">
                              {item.starRating}
                            </Text>
                          </View>
                        </View>
                        <View className="bg-blue-100 px-2 py-1 flex-row items-center gap-1 rounded-full">
                          <Text className="text-xs font-semibold text-warning">
                            {item.hourlyRateCurrency}
                          </Text>
                          <Text className="text-xs font-semibold text-primary">
                            {item.hourlyRate} / {t('freelancer_profile.hour')}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-sm font-semibold text-gray-800">
                        {item.jobTitle}
                      </Text>
                      {/* OPTIONAL: Show service type badge */}
                      {item.serviceTypeName && (
                        <View className="bg-gray-100 px-2 py-1 rounded-md self-start">
                          <Text className="text-xs text-gray-600">
                            {item.serviceTypeName}
                          </Text>
                        </View>
                      )}
                      <Text className="text-xs text-gray-500" numberOfLines={5}>
                        {item.customerExpect}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              )}
            />
          </>
        )}
      </View>

      <SortByBottomSheet
        visible={isSortVisible}
        onClose={() => setIsSortVisible(false)}
        selected={selectedSort}
        onSelect={(value) => setSelectedSort(value)}
      />
    </>
  );
}