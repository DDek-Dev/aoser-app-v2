import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Animated,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
  RefreshControl,
  Image,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { usePublicWork } from 'hooks/usePublicWork';
import SortByCategory from 'components/filter/SortByCategory';
import { NoResults } from 'components/NoResults';
import JobDetailBottomSheet from 'components/publicwork/JobDetailModal';
import { FreelancerStackParamList, TabParamList } from 'types/navigation';
import { Job } from 'types';
import { formatDisplayDateTime, formatRelativeTime, getCurrentLanguage } from 'utils/dateFormatter';
import JobSearchSkeleton from 'skeletonScreens/JobSearchSkeleton';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import { useAuth } from 'hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { profileImage } from 'assets';
import * as Icons from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


const ITEMS_PER_PAGE = 15;
const ANIMATION_DURATION = 300;
const SCROLL_THRESHOLD = 0.8; // Load more when 80% scrolled
const currentLanguage = getCurrentLanguage();
const BASE_URL = process.env.EXPO_PUBLIC_IMAGES_URL;
const WorkFeedScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<TabParamList>>();
  const navigations = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
  const { t } = useTranslation();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  // State management
  const [originalJobs, setOriginalJobs] = useState<Job[]>([]);
  const [displayedJobs, setDisplayedJobs] = useState<Job[]>([]);
  const [visibleJobsCount, setVisibleJobsCount] = useState(ITEMS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  // const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const [jobDetailVisible, setJobDetailVisible] = useState(false);
  const [shouldRestorePopup, setShouldRestorePopup] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateXAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<any>(null);




  // API hook with optimized cache settings
  const { data: jobs, isLoading, error, refetch, isFetching } = usePublicWork({
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
  const selectedJob = jobs?.find(j => j._id === selectedJobId) ?? null;

  const convertToPascalCase = (str: string): string => {
    return str
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  };

  const getIcon = (iconName?: string) => {
    if (!iconName) return Icons.Code;

    const pascalName = convertToPascalCase(iconName);
    const IconComponent = (Icons as any)[pascalName];

    return IconComponent || Icons.Code;
  };


  // console.log ("data", JSON.stringify(dat, null, 2));

  // Memoized JobItem component
  const JobItem = React.memo(({ item, onPress }: { item: Job; onPress: (job: Job) => void }) => {


    const IconComponent = getIcon(item?.serviceType?.icon);


    return (


      <Pressable
        onPress={() => onPress(item)}
        className="bg-white rounded-2xl border border-gray-200 px-4 py-4 mb-1"
      // activeOpacity={0.7}
      >

        {/* profile of create by1 */}
        <View className=''>

          <View className='flex-row justify-between px-1'>

            <View className="flex-row gap-2 items-center">
              <Image
                source={item.createdBy.userProfileImage ? { uri: BASE_URL + item.createdBy.userProfileImage } : profileImage}
                className="w-10 h-10 rounded-full"
              />
              <Text>{item.createdBy.firstName} {item.createdBy.lastName}</Text>
            </View>
            <View>
              {/* <Text className="mb-1">{t('works.post_on')}</Text> */}
              <Text className="text-caption text-textSecondary">
                {formatRelativeTime(item.createdAt, currentLanguage)}
              </Text>
            </View>
          </View>

          <View className='h-[1px] bg-border my-2' />
        </View>
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1 mr-3 ">
            <Text className="text-body font-semibold text-gray-900" numberOfLines={2}>
              {item.workTitle}
            </Text>

          </View>
          <View className="w-6 mr-3 ">
            {/* <Text className="text-body font-semibold text-gray-900" numberOfLines={2}>
            ICON
          </Text> */}

            <IconComponent
              size={24}
              color={item.serviceType.color || 'black'}
              strokeWidth={2}
            />

          </View>

        </View>

        <Text className="text-body text-gray-500 mb-3" numberOfLines={3}>
          {item.description}
        </Text>



        <View className='bg-background px-2 rounded-2xl p-2'>


          <View className=" flex-row items-center  ">

            <Text >{t('postWork.work_type')} : </Text>
            <Text className="text-caption text-text bg-surface p-2 rounded-full  ">
              {item.kindOfWork === "ONLINE" ? "Online" : "Offline"}
            </Text>
          </View>
          {item.budgetType === 'OFFERING' ? (
            <View className=''>
              <Text className="text-lg text-primary font-bold mr-2">{t('workDetail.offering_price')}</Text>
            </View>
          ) : (

            <View className="flex-row items-center">
              <Text>{t('postWork.budget')} : </Text>
              <Text className="font-bold text-body text-warning ml-2">{item.currency} </Text>
              <Text className="font-bold text-body text-primary">
                {new Intl.NumberFormat().format(item.budget)}
              </Text>
            </View>

          )}


          {item.startDate !== undefined && 

            <View className="flex-row mt-3 items-center">
              <Text>{currentLanguage === 'la' ? 'ເລີ່ມ' : 'Start'} : </Text>

              <View className="flex-row gap-2 items-center">
                <Ionicons name="time-outline" size={18} color="#F59E0B" />
                <Text className="text-sm text-textSecondary">
                  {/* {formatDate(item.deadLine as string, currentLanguage)} */}
                  {formatDisplayDateTime(item.startDate as string)}
                </Text>
              </View>
            </View>
          }

          {item.deadLine !== undefined &&
            <View className="flex-row mt-3 items-center">
              {/* <Text>{t('workDetail.deadline')} : </Text> */}
              <Text>{currentLanguage === 'la' ? 'ຫາ' : 'To'} : </Text>

              <View className="flex-row gap-2 items-center">
                <Ionicons name="time-outline" size={18} color="#F59E0B" />

                <Text className="text-sm text-textSecondary">
                  {/* {formatDate(item.deadLine as string, currentLanguage)} */}

                  {formatDisplayDateTime(item.deadLine as string)}
                </Text>
              </View>
            </View>

          }

          {item.address && item.address.village !== '' && item.address.district !== '' && item.address.province !== '' &&

            <View className="flex-row mt-3 items-center">
              {/* <Text>{t('workDetail.deadline')} : </Text> */}
              <Text>{t('payment_success.address')}:  </Text>

              <View className="flex-row gap-2 items-center">
                <Ionicons name="location-outline" size={18} color="#F59E0B" />

                <Text className="text-sm text-textSecondary">
                  {/* {formatDate(item.deadLine as string, currentLanguage)} */}

                  {item.address.village}, {item.address.district}, {item.address.province}
                </Text>
              </View>
            </View>
          }

        </View>



      </Pressable>

    )
  });

  // Animation interpolations
  const bannerTextOpacity = scrollY.interpolate({
    inputRange: [0, 180],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const bannerBgColor = scrollY.interpolate({
    inputRange: [0, 400],
    outputRange: ['#2B68F2', '#FFFFFF'],
    extrapolate: 'clamp',
  });

  const bannerHeight = scrollY.interpolate({
    inputRange: [0, 380],
    // outputRange: [150, 110],
    outputRange: [140 + insets.top, 90 + insets.top],
    extrapolate: 'clamp',
  });

  const bannerRadius = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [24, 0],
    extrapolate: 'clamp',
  });

  const searchBarTranslateY = scrollY.interpolate({
    inputRange: [0, 400],
    outputRange: [0, -60],
    extrapolate: 'clamp',
  });
  const categoryTranslateY = scrollY.interpolate({
    inputRange: [0, 400],
    outputRange: [0, -15],
    extrapolate: 'clamp',
  });

  const startBoxVisibility = scrollY.interpolate({
    inputRange: [0, 500],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Initialize jobs data
  useEffect(() => {
    if (jobs && Array.isArray(jobs)) {
      setOriginalJobs(jobs);
      setDisplayedJobs(jobs);
      setVisibleJobsCount(ITEMS_PER_PAGE);
    }
  }, [jobs]);

  // Entry animation
  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(translateXAnim, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, translateXAnim]);

  // Combined filter function
  const applyFilters = useCallback((searchQuery: string, category: string) => {
    let filtered = [...originalJobs];

    // Apply category filter
    if (category !== 'All') {
      filtered = filtered.filter((job) => job.serviceType.name === category);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((job) =>
        job?.workTitle?.toLowerCase().includes(lowerQuery) ||
        job?.description?.toLowerCase().includes(lowerQuery) ||
        job?.kindOfWork?.toLowerCase().includes(lowerQuery) ||
        job?.budget?.toString().includes(lowerQuery)
      );
    }

    setDisplayedJobs(filtered);
    setVisibleJobsCount(ITEMS_PER_PAGE);
  }, [originalJobs]);

  // Search handler
  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
    applyFilters(text, activeCategory);
  }, [activeCategory, applyFilters]);

  // Category filter handler
  const handleCategoryFilter = useCallback((_filteredJobs: Job[], category: string) => {
    setActiveCategory(category);
    applyFilters(searchText, category);
  }, [searchText, applyFilters]);

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (err) {
      console.log('Refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // Infinite scroll handler
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;

    // Update scroll animation
    scrollY.setValue(contentOffset.y);

    // Check if user has scrolled to threshold
    const scrollPercentage = (contentOffset.y + layoutMeasurement.height) / contentSize.height;

    if (scrollPercentage >= SCROLL_THRESHOLD && !isLoadingMore && visibleJobsCount < displayedJobs.length) {
      setIsLoadingMore(true);

      // Simulate smooth loading with setTimeout
      setTimeout(() => {
        setVisibleJobsCount(prev => Math.min(prev + ITEMS_PER_PAGE, displayedJobs.length));
        setIsLoadingMore(false);
      }, 300);
    }
  }, [scrollY, isLoadingMore, visibleJobsCount, displayedJobs.length]);

  // Restore popup when returning from profile
  useFocusEffect(
    useCallback(() => {
      if (shouldRestorePopup && selectedJob) {
        setJobDetailVisible(true);
        setShouldRestorePopup(false);
      }
    }, [shouldRestorePopup, selectedJob])
  );

  // Job press handlers
  const handleJobPress = useCallback((job: Job) => {
    // setSelectedJob(job);
    setSelectedJobId(job._id);
    setJobDetailVisible(true);

  }, []);

  const handleWorkPress = useCallback((job: Job) => {
    navigations.navigate('FreelancerWorkDetail', { workId: job._id });
  }, [navigations]);

  const handleUserProfileNavigation = useCallback((userId: string) => {
    setJobDetailVisible(false);

    navigations.navigate('FreelancerProfile', { userId });
  }, [navigations]);

  const handleCloseJobDetail = useCallback(() => {
    setJobDetailVisible(false);
    setSelectedJobId(null);
    ;
  }, []);

  // Get visible jobs
  const visibleJobs = displayedJobs.slice(0, visibleJobsCount);
  const hasMoreJobs = visibleJobsCount < displayedJobs.length;

  // Loading state
  if (isLoading) {
    return <JobSearchSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <ScreenWrapper>
        <View className="flex-1 justify-center items-center p-6 bg-background">
          <View className="w-24 h-24 bg-red-50 rounded-full items-center justify-center mb-6">
            <Ionicons name="alert-circle" size={48} color="#EF4444" />
          </View>
          <Text className="text-body font-bold text-text mb-2">
            {t('works.error.some_wrong')}
          </Text>
          <Text className="text-caption text-textSecondary text-center mb-2 px-4">
            {t('works.error.couldnot_load')}
          </Text>
          <Pressable
            onPress={() => refetch()}
            className="bg-primary px-8 py-4 rounded-xl flex-row items-center active:opacity-80"
          >
            <Text className="text-white font-semibold text-body">
              {t('works.error.try_again')}
            </Text>
          </Pressable>
          <Text className="text-caption text-textSecondary text-center mt-6 px-8">
            {t('works.error.if_the_problem')}
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  // Empty state
  if (!Array.isArray(jobs) || jobs.length === 0) {
    return (
      <ScreenWrapper>
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-gray-500 text-center mb-4">
            {t('works.error.no_job_available')}
          </Text>
          <Pressable
            onPress={() => refetch()}
            className="bg-blue-500 px-6 py-3 rounded-full"
          >
            <Text className="text-white">{t('works.error.refresh')}</Text>
          </Pressable>
        </View>
      </ScreenWrapper>
    );
  }


  return (
    <>
      <View className="bg-white">
        <Animated.View
          style={[
            styles.banner,
            {
              paddingHorizontal: 16,
              paddingBottom: 12,
              // ✅ ใช้ insets.top แทน paddingTop: 30
              paddingTop: insets.top + 12,
            },
            {
              backgroundColor: bannerBgColor,
              height: bannerHeight,
              borderBottomLeftRadius: bannerRadius,
              borderBottomRightRadius: bannerRadius,

            },
          ]}
        >
          <Animated.Text
            style={[
              styles.bannerText,
              {
                marginTop: 10,
                fontSize: 28,
                opacity: bannerTextOpacity,
                lineHeight: 40,

              },
            ]}
          >
            {t('works.lets_find_work')}
          </Animated.Text>

          <Animated.View style={{ transform: [{ translateY: searchBarTranslateY }] }}>
            <View className="flex-row items-center bg-white rounded-full border border-gray-300 px-4 mb-4">
              <Ionicons name="search-outline" size={20} color="#3B82F6" />
              <TextInput
                value={searchText}
                onChangeText={handleSearch}
                className="ml-2 text-base text-gray-600 flex-1 py-4"
                placeholder={t('works.search_work')}
                placeholderTextColor="#999"
                returnKeyType="search"
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              />
              {searchText ? (
                <TouchableOpacity onPress={() => handleSearch('')}>
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              ) : null}
            </View>
          </Animated.View>
        </Animated.View>

        <Animated.View className="px-4 py-1 bg-surface" style={{ transform: [{ translateY: categoryTranslateY }] }} >
          <SortByCategory data={originalJobs} onCategoryFilter={handleCategoryFilter} />
        </Animated.View>
      </View>

      <Animated.ScrollView
        ref={scrollViewRef}
        style={[styles.scrollView, { opacity: fadeAnim }]}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#2B68F2']}
            tintColor="#2B68F2"
            title={t('works.error.refresh')}
          />
        }
      >
        {!isSearchFocused && (
          <Animated.View
            style={{
              opacity: startBoxVisibility,
              height: startBoxVisibility.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 144],
              }),
              overflow: 'hidden',
              marginHorizontal: 16,
              marginVertical: startBoxVisibility.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 16],
              }),
              padding: startBoxVisibility.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 16],
              }),
              backgroundColor: 'rgb(59 130 246)',
              borderRadius: 16,
            }}
          >
            <Text className="text-white font-bold text-body">
              🚀 {t('works.start_public_work')}
            </Text>
            <Text className="text-surface mt-2 text-body">
              {t('works.post_to_apply')}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('New work')}
              style={styles.startButton}
            >
              <Text style={styles.startButtonText}>
                {t('works.start_post')}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        <View className="px-1">
          {/* {(searchText || activeCategory !== 'All') && (
            <View className="mb-4">
              <Text className="text-sm text-gray-600">
                {displayedJobs.length} {displayedJobs.length !== 1 ? 'results' : 'result'} found
                {searchText && ` for "${searchText}"`}
                {activeCategory !== 'All' && ` in ${activeCategory}`}
              </Text>
            </View>
          )} */}

          {displayedJobs.length !== 0 ? (
            <>
              {visibleJobs.map((job) => (
                <JobItem
                  key={job._id}
                  item={job}
                  onPress={
                    user && user._id === job.createdBy._id
                      ? handleWorkPress
                      : handleJobPress
                  }
                />
              ))}

              {/* Loading indicator for infinite scroll */}
              {(isLoadingMore || hasMoreJobs) && (
                <View className="py-6 items-center">
                  {isLoadingMore ? (
                    <ActivityIndicator size="small" color="#2B68F2" />
                  ) : (
                    <Text className="text-sm text-gray-400">
                      {t('works.more')}
                    </Text>
                  )}
                </View>
              )}

              {/* End of list indicator */}
              {!hasMoreJobs && displayedJobs.length > ITEMS_PER_PAGE && (
                <View className="py-6 items-center">
                  {/* <Text className="text-sm text-gray-400">
                    {t('works.all_jobs_loaded')}
                  </Text> */}

                  {/* show loading component */}
                  {/* <ActivityIndicator size="small" color="#2B68F2" /> */}

                </View>
              )}
            </>
          ) : (
            activeCategory === 'All' ? <ActivityIndicator /> : <NoResults />

          )}
        </View>
      </Animated.ScrollView>

      <JobDetailBottomSheet
        visible={jobDetailVisible}
        onClose={handleCloseJobDetail}
        job={selectedJob}
        refetch={refetch}

      />
    </>
  );
};

const styles = StyleSheet.create({
  banner: {
    paddingHorizontal: 16,
    paddingTop: 30,
    paddingBottom: 12,
  },
  bannerText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContent: {
    paddingBottom: 140,
  },
  startButton: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  startButtonText: {
    color: '#2563eb',
    fontWeight: '500',
  },
});

export default WorkFeedScreen;