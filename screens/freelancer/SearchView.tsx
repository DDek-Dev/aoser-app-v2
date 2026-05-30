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
  ActivityIndicator,
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
import VDOPromote_free_profile from 'components/profile/VDOPromote-free-profile';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Constants ────────────────────────────────────────────────────────────────
const BASE_IMAGE = process.env.EXPO_PUBLIC_IMAGES_URL;
const PAGE_SIZE = 10;

// ─── Types ────────────────────────────────────────────────────────────────────
interface EnhancedProfile extends UserProfile {
  serviceTypeName?: string;
  relevanceScore: number;
}

// ─── Search Utilities ─────────────────────────────────────────────────────────

/**
 * Normalize a string for matching while preserving non-Latin scripts
 * (Lao, Thai, Chinese, etc.) — only strips punctuation & collapses whitespace.
 */
const normalizeString = (str: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');         // collapse whitespace only
};

/**
 * Check whether a single field value contains the search term.
 */
const fieldContains = (value: string | undefined, term: string): boolean => {
  if (!value || !term) return false;
  return normalizeString(value).includes(term);
};

/**
 * Compute a weighted relevance score for a profile against a search term.
 * Returns 0 when no match is found.
 */
const calculateRelevanceScore = (
  item: UserProfile,
  searchTerm: string,
  serviceTypeName?: string,
): number => {
  if (!searchTerm) return 0;

  const term = normalizeString(searchTerm);
  let score = 0;

  const score_field = (value: string | undefined, exactWeight: number, partialWeight: number) => {
    if (!value) return;
    const normalized = normalizeString(value);
    if (normalized === term) {
      score += exactWeight;
    } else if (normalized.includes(term)) {
      score += partialWeight;
    } else if (term.includes(normalized) && normalized.length > 1) {
      score += partialWeight * 0.6;
    }
  };

  score_field(item.jobTitle,        100, 50);
  score_field(serviceTypeName,       90, 45);
  score_field(item.firstName,        80, 40);
  score_field(item.freelancerType,   70, 35);
  score_field(item.businessType,     60, 30);
  score_field(item.about,            50, 25);
  score_field(item.customerExpect,   50, 25);
  score_field(item.userCode,         30, 15);
  score_field(item.address?.province, 40, 20);
  score_field(item.address?.district, 40, 20);
  score_field(item.address?.country,  40, 20);

  return score;
};

/**
 * Return true if the profile matches the search term in any searchable field.
 */
const profileMatchesSearch = (
  item: UserProfile,
  searchTerm: string,
  serviceTypeName?: string,
): boolean => {
  if (!searchTerm) return true;

  const term = normalizeString(searchTerm);
  const fields: (string | undefined)[] = [
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
    serviceTypeName,
  ];

  return fields.some(f => fieldContains(f, term));
};

/**
 * Sort enhanced profiles by the chosen sort strategy.
 */
const sortProfiles = (profiles: EnhancedProfile[], sortBy: string): EnhancedProfile[] => {
  const sorted = [...profiles];

  switch (sortBy) {
    case 'all':
      return sorted.sort((a, b) => {
        const scoreDiff = b.relevanceScore - a.relevanceScore;
        return Math.abs(scoreDiff) > 5 ? scoreDiff : b.starRating - a.starRating;
      });

    case 'distance_near_far':
      return sorted.sort((a, b) => {
        const diff = (a.distanceScore ?? 0) - (b.distanceScore ?? 0);
        return Math.abs(diff) > 0.1 ? diff : b.relevanceScore - a.relevanceScore;
      });

    case 'distance_far_near':
      return sorted.sort((a, b) => {
        const diff = (b.distanceScore ?? 0) - (a.distanceScore ?? 0);
        return Math.abs(diff) > 0.1 ? diff : b.relevanceScore - a.relevanceScore;
      });

    case 'price_low_high':
      return sorted.sort((a, b) => {
        const diff = a.hourlyRate - b.hourlyRate;
        return Math.abs(diff) > 1 ? diff : b.relevanceScore - a.relevanceScore;
      });

    case 'price_high_low':
      return sorted.sort((a, b) => {
        const diff = b.hourlyRate - a.hourlyRate;
        return Math.abs(diff) > 1 ? diff : b.relevanceScore - a.relevanceScore;
      });

    default:
      return sorted.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function SearchView() {
  const route     = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
  const { t }    = useTranslation();
  const insets   = useSafeAreaInsets();

  const { query } = route.params as { query: string };

  // ── State ──────────────────────────────────────────────────────────────────
  const [searchText,    setSearchText]    = useState(query);
  const [selectedSort,  setSelectedSort]  = useState('all');
  const [isSortVisible, setIsSortVisible] = useState(false);
  const [visibleCount,  setVisibleCount]  = useState(PAGE_SIZE);

  const scrollY = useRef(new Animated.Value(0)).current;

  // ── Data ───────────────────────────────────────────────────────────────────
  const {
    data: freelancers,
    isLoading: freelancersLoading,
    refetch,
    isRefetching,
  } = useFreeLancers();

  const {
    data: serviceTypes,
    isLoading: serviceTypesLoading,
  } = useGetServiceTypes();

  // ── Reset pagination & re-filter when search text changes ──────────────────
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchText, selectedSort]);

  // ── Optionally trigger a refetch when search changes (remove if not needed) ─
  useEffect(() => {
    if (searchText) {
      refetch();
    }
  }, [searchText]);

  // ── Service-type lookup map ─────────────────────────────────────────────────
  const serviceTypeMap = useMemo<Map<string, string>>(() => {
    if (!serviceTypes) return new Map();
    return new Map(serviceTypes.map(st => [st._id, st.name]));
  }, [serviceTypes]);

  // ── All matched & sorted results ───────────────────────────────────────────
  const allFilteredResults = useMemo<EnhancedProfile[]>(() => {
    if (!freelancers) return [];

    const term = normalizeString(searchText);

    // No search term → show all (unscored)
    if (!searchText.trim()) {
      return freelancers.map(item => ({
        ...item,
        serviceTypeName: serviceTypeMap.get(item.serviceType),
        relevanceScore: 0,
      }));
    }

    // Empty after normalization (e.g. only spaces)
    if (!term) return [];

    const enhanced = freelancers
      .map(item => {
        const serviceTypeName = serviceTypeMap.get(item.serviceType);
        return { item, serviceTypeName };
      })
      .filter(({ item, serviceTypeName }) =>
        profileMatchesSearch(item, searchText, serviceTypeName),
      )
      .map(({ item, serviceTypeName }) => ({
        ...item,
        serviceTypeName,
        relevanceScore: calculateRelevanceScore(item, searchText, serviceTypeName),
      }))
      .filter(p => p.relevanceScore > 0);

    return sortProfiles(enhanced, selectedSort);
  }, [freelancers, searchText, selectedSort, serviceTypeMap]);

  // ── Paginated slice shown to the user ──────────────────────────────────────
  const paginatedResults = useMemo(
    () => allFilteredResults.slice(0, visibleCount),
    [allFilteredResults, visibleCount],
  );

  const hasMore = visibleCount < allFilteredResults.length;

  // ── Infinite-scroll handler ────────────────────────────────────────────────
  const handleLoadMore = useCallback(() => {
    if (hasMore) {
      setVisibleCount(prev => Math.min(prev + PAGE_SIZE, allFilteredResults.length));
    }
  }, [hasMore, allFilteredResults.length]);

  // ── Navigation helpers ─────────────────────────────────────────────────────
  const handleProfilePress = useCallback(
    (userId: string) => navigation.navigate('FreelancerProfile', { userId }),
    [navigation],
  );

  const handleServiceTypePress = useCallback((tagName: string) => {
    setSearchText(tagName);
    setSelectedSort('all');
  }, []);

  // ── Footer: loading indicator for pagination ───────────────────────────────
  const renderFooter = useCallback(() => {
    if (!hasMore) return null;
    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color="#3B82F6" />
      </View>
    );
  }, [hasMore]);

  // ── Freelancer card ────────────────────────────────────────────────────────
  const renderFreelancerCard = useCallback(
    ({ item }: { item: EnhancedProfile }) => (
      <Pressable
        onPress={() => handleProfilePress(item._id)}
        className="w-[49.5%] mt-1 bg-white rounded-lg m-[1px] border border-border overflow-hidden"
      >
        {item.videoPromote != null ? (
          <VDOPromote_free_profile
            video={item.videoPromote}
            context="home"
            scrollY={scrollY}
          />
        ) : (
          <Image
            source={{ uri: BASE_IMAGE + item.bannerImage }}
            className="w-full h-28"
            resizeMode="cover"
          />
        )}

        <View className="p-3 space-y-2">
          {/* Rating & Price */}
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
              <Text className="text-caption text-primary">/ {t('freelancer_profile.hour')}</Text>
            </View>
          </View>

          {/* Job Title */}
          <Text className="text-body font-semibold text-text" numberOfLines={1}>
            {item.jobTitle}
          </Text>

          {/* Location */}
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
    ),
    [handleProfilePress, scrollY, t],
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <View className="flex-1 bg-white">
        {/* ── Header ── */}
        <View
          className="bg-primary pb-4 px-4 rounded-b-2xl shadow-sm"
          style={{ paddingTop: insets.top + 8 }}
        >
          <View className="flex-row items-center px-1 mb-1">
            <TouchableOpacity
              onPress={() => navigation.navigate('SearchBar', { text: '', focus: false })}
              className="p-1"
            >
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

          {/* Service-type tags */}
          {serviceTypesLoading ? (
            <ActivityIndicator size="small" color="#ffffff" className="mt-4" />
          ) : (
            serviceTypes && serviceTypes.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16 }}
              >
                {serviceTypes.map((tag, index) => (
                  <TouchableOpacity
                    key={tag._id ?? index}
                    onPress={() => handleServiceTypePress(tag.name)}
                    className="px-4 py-2 rounded-full mr-2 border mt-2 border-white/30"
                  >
                    <Text className="text-sm text-white">{tag.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )
          )}
        </View>

        {/* ── Sort bar ── */}
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

        {/* ── Results ── */}
        {freelancersLoading ? (
          <ActivityIndicator size="large" color="#3B82F6" className="mt-6" />
        ) : allFilteredResults.length === 0 ? (
          <NoResults
            title={t('freelancer_profile.no_freelancer_found')}
            subtitle={t('freelancer_profile.search_another_key')}
          />
        ) : (
          <FlatList
            data={paginatedResults}
            renderItem={renderFreelancerCard}
            keyExtractor={(item, index) => item._id ?? index.toString()}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 2, paddingBottom: 64 }}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={renderFooter}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false },
            )}
            scrollEventThrottle={16}
            refreshControl={
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