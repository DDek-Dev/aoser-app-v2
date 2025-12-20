import React, { useState, useEffect, useRef, useCallback, use } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Animated,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
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
import { formatDate, formatRelativeTime, getCurrentLanguage } from 'utils/dateFormatter';
import JobSearchSkeleton from 'skeletonScreens/JobSearchSkeleton';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import { useAuth } from 'hooks/useAuth';
import { useTranslation } from 'react-i18next';


const ITEMS_PER_PAGE = 15;
const ANIMATION_DURATION = 300;
const currentLanguage = getCurrentLanguage();

const WorkFeedScreen = () => {
  // Navigation
  const navigation = useNavigation<NativeStackNavigationProp<TabParamList>>();
  const navigations = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();


  // State management
  const [originalJobs, setOriginalJobs] = useState<Job[]>([]);
  const [displayedJobs, setDisplayedJobs] = useState<Job[]>([]);
  const [jobsToShow, setJobsToShow] = useState(ITEMS_PER_PAGE);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [jobDetailVisible, setJobDetailVisible] = useState(false);
  const [shouldRestorePopup, setShouldRestorePopup] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isSearching, setIsSearching] = useState<boolean>(true);

  // Refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateXAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const { t } = useTranslation();



  const JobItem = React.memo(({ item, onPress }: { item: Job; onPress: (job: Job) => void }) => (
    <View className="space-y-3">
      <TouchableOpacity
        onPress={() => onPress(item)}
        className="bg-white rounded-2xl border border-gray-200 px-4 py-4 mb-2"
      >
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1 mr-3">
            <Text className="text-body font-semibold text-gray-900" numberOfLines={1}>
              {item.workTitle}
            </Text>
          </View>
          <View className="bg-blue-50 px-2 py-1 rounded-full">
            <Text className="text-caption text-gray-500">
              {item.kindOfWork === "ONLINE" ? "Online" : "Offline"}
            </Text>
          </View>
        </View>

        <Text className="text-body text-gray-500 mb-3" numberOfLines={2}>
          {item.description}
        </Text>


        {/* Budget + Deadline */}
        <View >
          <View className='flex-row '>
            <Text className='font-bold text-warning ml-2'>{item.currency} </Text>
            <Text className='font-bold text-primary '>{new Intl.NumberFormat().format(item.budget)}</Text>
          </View>
        </View>
        <View className='flex-row justify-between'>
          <View>
            <Text className='mt-3 mb-1'>{t('works.post_on')}</Text>
            <Text className="text-caption  text-textSecondary">{formatRelativeTime(item.createdAt, currentLanguage)}</Text>
          </View>
          <View className='flex-row gap-2 items-center'>
            <Ionicons name="time-outline" size={18} color="#F59E0B" />
            <Text className="text-sm text-textSecondary">{formatDate(item.deadLine as string, currentLanguage)}</Text>
          </View>

        </View>
      </TouchableOpacity>
    </View>
  ));


  // API hook
  const { data, isLoading, error, refetch } = usePublicWork();
  const { user } = useAuth();
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
    outputRange: [240, 110],
    extrapolate: 'clamp',
  });

  const bannerRadius = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [24, 0],
    extrapolate: 'clamp',
  });

  const searchBarTranslateY = scrollY.interpolate({
    inputRange: [0, 400],
    outputRange: [0, -50],
    extrapolate: 'clamp',
  });

  const startBoxVisibility = scrollY.interpolate({
    inputRange: [0, 500],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Initialize jobs data
  useEffect(() => {
    if (data && Array.isArray(data)) {
      const sortedJobs = [...data];
      setOriginalJobs(sortedJobs);
      setDisplayedJobs(sortedJobs);
    }
  }, [data]);

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
  }, []);

  // Combined filter function that handles both search and category
  const applyFilters = useCallback((searchQuery: string, category: string) => {
    let filtered = [...originalJobs];

    // Apply category filter first
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
        job?.budget?.toString().toLowerCase().includes(lowerQuery)
        // job?.serviceType?.toLowerCase().includes(lowerQuery)
      );
    }

    setDisplayedJobs(filtered);
    setJobsToShow(ITEMS_PER_PAGE); // Reset pagination when filters change
  }, [originalJobs]);

  // Search handler
  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
    applyFilters(text, activeCategory);
  }, [activeCategory, applyFilters]);

  // Category filter handler
  const handleCategoryFilter = useCallback((filteredJobs: Job[], category: string) => {
    setActiveCategory(category);
    applyFilters(searchText, category);
  }, [searchText, applyFilters]);

  // Load more handler
  const handleLoadMore = useCallback(() => {
    if (loadingMore || jobsToShow >= displayedJobs.length) return;

    setLoadingMore(true);
    setTimeout(() => {
      setJobsToShow(prev => Math.min(prev + ITEMS_PER_PAGE, displayedJobs.length));
      setLoadingMore(false);
    }, 500);
  }, [loadingMore, jobsToShow, displayedJobs.length]);

  // Restore popup when returning from profile
  useFocusEffect(
    React.useCallback(() => {
      if (shouldRestorePopup && selectedJob) {
        setJobDetailVisible(true);
        setShouldRestorePopup(false);
      }
    }, [shouldRestorePopup, selectedJob])
  );


  // Job press handler
  const handleJobPress = useCallback((job: Job) => {
    setSelectedJob(job);
    setJobDetailVisible(true);
    setShouldRestorePopup(false);
  }, []);
  const handleWorkPress = ((job: Job) => {
    navigations.navigate('FreelancerWorkDetail', { workId: job._id })

  })
  const handleUserProfileNavigation = useCallback((userId: string) => {
    setJobDetailVisible(false);
    setShouldRestorePopup(true);
    navigations.navigate('FreelancerProfile', { userId });
  }, [navigations]);

  const handleCloseJobDetail = useCallback(() => {
    setJobDetailVisible(false);
    setSelectedJob(null); // Clear the job data
    setShouldRestorePopup(false);
  }, []);


  // Scroll handler
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset } = event.nativeEvent;
    scrollY.setValue(contentOffset.y);
  }, []);

  // Get visible jobs for current page
  const visibleJobs = displayedJobs.slice(0, jobsToShow);

  // Loading state
  if (isLoading) {
    return <JobSearchSkeleton />;
  }



  // Error state

  if (error) {
    return (
      <ScreenWrapper>
        <View className="flex-1 justify-center items-center p-6 bg-background">
          {/* Icon Container */}
          <View className="w-24 h-24 bg-red-50 rounded-full items-center justify-center mb-6">

            <Ionicons name="alert-circle" size={48} color="#EF4444" />
          </View>

          {/* Error Title */}
          <Text className="text-body font-bold text-text mb-2">
            {t('works.error.some_wrong')}
          </Text>

          {/* Error Message */}
          <Text className="text-caption text-textSecondary text-center mb-2 px-4">
            {t('works.error.couldnot_load')}

          </Text>

          {/* Technical Error (Optional) */}
          {/* <Text className="text-cation text-gray-400 text-center mb-8 px-4">
            {error?.message || 'Please try again'}
          </Text> */}

          {/* Retry Button */}
          <Pressable
            onPress={() => refetch()}
            className="bg-primary px-8 py-4 rounded-xl flex-row items-center active:opacity-80"
          >
            <Text className="text-white font-semibold text-body">{t('works.error.try_again')}
            </Text>
          </Pressable>

          {/* Optional: Help Text */}
          <Text className="text-caption text-textSecondary text-center mt-6 px-8">
            {t('works.error.if_the_problem')}
          </Text>
        </View>
      </ScreenWrapper>
    );
  }
  // No data state
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-gray-500 text-center mb-4">{t('works.error.no_job_available')}</Text>

        <Pressable
          onPress={() => refetch()}
          className="bg-blue-500 px-6 py-3 rounded-full"
        >
          <Text className="text-white">{t('works.error.refresh')}</Text>
        </Pressable>
      </View>
    );
  }


  return (
    <>
      <View className="bg-white">
        <Animated.View
          style={[styles.banner, {
            backgroundColor: bannerBgColor,
            height: bannerHeight,
            borderBottomLeftRadius: bannerRadius,
            borderBottomRightRadius: bannerRadius,
          }]}
        >
          <Animated.Text style={[styles.bannerText, {
            marginTop: 50,
            fontSize: 28,
            opacity: bannerTextOpacity
          }]}>
            {t('works.lets_find_work')}{'\n'} {t('works.work')}
          </Animated.Text>

          <Animated.View style={{ transform: [{ translateY: searchBarTranslateY }] }}>
            <View className="flex-row items-center bg-white rounded-full border border-gray-300 px-4 mb-4">
              <Ionicons name="search-outline" size={20} color="#333" />
              <TextInput
                value={searchText}
                onChangeText={handleSearch}
                className="ml-2 text-base text-gray-600 flex-1 py-4"
                placeholder={t('works.search_work')}
                placeholderTextColor="#999"
                returnKeyType="search"
                onFocus={() => setIsSearching(false)}
                onBlur={() => setIsSearching(true)}
              />
              {searchText ? (
                <TouchableOpacity onPress={() => handleSearch('')}>
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              ) : null}
            </View>
          </Animated.View>
        </Animated.View>

        <View className="px-4 py-1">
          <SortByCategory
            data={originalJobs}
            onCategoryFilter={handleCategoryFilter}
          />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: 'white' }}
        contentContainerStyle={{ paddingBottom: 140 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >

        {isSearching && (

          <Animated.View
            style={{
              opacity: startBoxVisibility,
              height: startBoxVisibility.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 144]
              }),
              overflow: 'hidden',
              marginHorizontal: 16,
              marginVertical: startBoxVisibility.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 16]
              }),
              padding: startBoxVisibility.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 16]
              }),
              backgroundColor: 'rgb(59 130 246)',
              borderRadius: 16,
            }}
          >
            <Text className='text-white font-bold text-body'>🚀 {t('works.start_public_work')}</Text>
            <Text className='text-surface mt-2 text-body'>
              {t('works.post_to_apply')}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('New work')}
              style={{
                backgroundColor: 'white',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 9999,
                alignSelf: 'flex-start',
                marginTop: 4,
              }}
            >
              <Text style={{ color: '#2563eb', fontWeight: '500' }}>    {t('works.start_post')} →</Text>
            </TouchableOpacity>
          </Animated.View>

        )}
        <View className='px-3'>
          {/* Results summary */}
          {(searchText || activeCategory !== 'All') && (
            <View className="mb-4">
              <Text className="text-sm text-gray-600">
                {displayedJobs.length} result{displayedJobs.length !== 1 ? 's' : ''} found
                {searchText && ` for "${searchText}"`}
                {activeCategory !== 'All' && ` in ${activeCategory}`}
              </Text>
            </View>
          )}

          {visibleJobs === null ? (
            <NoResults />
          ) : (
            <>

              {visibleJobs.map((job) => (
                <JobItem key={job._id} item={job} onPress={user && user._id === job.createdBy._id ? handleWorkPress : handleJobPress} />
              ))}

              {jobsToShow < displayedJobs.length && (
                <TouchableOpacity
                  onPress={handleLoadMore}
                  disabled={loadingMore}
                  className="mx-4 my-6 py-3 rounded-full bg-blue-500"
                  style={{ opacity: loadingMore ? 0.6 : 1 }}
                >
                  {loadingMore ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white text-center font-medium">
                      {t('works.more')} ({displayedJobs.length - jobsToShow} )
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </ScrollView>



      <JobDetailBottomSheet
        visible={jobDetailVisible}
        // onClose={() => {
        //   setJobDetailVisible(false);
        //   setSelectedJob(null);
        // }}
        onClose={handleCloseJobDetail}
        job={selectedJob}
        refetch={refetch}
        onUserPress={handleUserProfileNavigation}
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
});

export default WorkFeedScreen;