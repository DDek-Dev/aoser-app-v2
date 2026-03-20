import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  Pressable,
  Keyboard,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { useGetServiceTypes } from 'hooks/useFreelancer';
import { SearchBarSkeleton } from 'skeletonScreens/ShimmerView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SEARCH_HISTORY_KEY = 'searchHistory';
const MAX_HISTORY_ITEMS = 10;

export default function SearchBar() {
  const route = useRoute<RouteProp<FreelancerStackParamList, 'SearchBar'>>();
  const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
  const { t } = useTranslation();

  const initialText = route.params?.text || '';
  const shouldFocus = route.params?.focus || false;

  const [searchText, setSearchText] = useState(initialText);
  const [historySearchTags, setHistorySearchTags] = useState<string[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const insets = useSafeAreaInsets(); 
  
  const inputRef = useRef<TextInput>(null);

  const { data: serviceTypes, isLoading: serviceTypesLoading, isError } = useGetServiceTypes();

  // Auto-focus input if needed
  useEffect(() => {
    if (shouldFocus) {
      const timeout = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [shouldFocus]);

  // Load search history from AsyncStorage
  useEffect(() => {
    loadSearchHistory();
  }, []);

  const loadSearchHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const stored = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setHistorySearchTags(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.log('Error loading search history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Save search history to AsyncStorage
  const saveSearchHistory = useCallback(async (history: string[]) => {
    try {
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.log('Error saving search history:', error);
    }
  }, []);

  // Add search term to history
  const addToHistory = useCallback((term: string) => {
    const trimmedTerm = term.trim();
    if (!trimmedTerm) return;

    setHistorySearchTags(prevTags => {
      // Remove if already exists (to move it to top)
      const filtered = prevTags.filter(tag => tag !== trimmedTerm);
      // Add to beginning and limit to MAX_HISTORY_ITEMS
      const newHistory = [trimmedTerm, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      saveSearchHistory(newHistory);
      return newHistory;
    });
  }, [saveSearchHistory]);

  // Remove single tag from history
  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setHistorySearchTags(prevTags => {
      const newHistory = prevTags.filter(tag => tag !== tagToRemove);
      saveSearchHistory(newHistory);
      return newHistory;
    });
  }, [saveSearchHistory]);

  // Clear all history
  const handleClearAll = useCallback(() => {
    setHistorySearchTags([]);
    saveSearchHistory([]);
  }, [saveSearchHistory]);

  // Handle search submission
  const handleSearch = useCallback(() => {
    const trimmedText = searchText.trim();
    if (trimmedText) {
      addToHistory(trimmedText);
      navigation.navigate('SearchView', { query: trimmedText });
      setSearchText('');
      Keyboard.dismiss();
    }
  }, [searchText, addToHistory, navigation]);

  // Handle tag click (from service types or history)
  const handleTagPress = useCallback((tagName: string) => {
    const trimmedTag = tagName.trim();
    addToHistory(trimmedTag);
    navigation.navigate('SearchView', { query: trimmedTag });
    Keyboard.dismiss();
  }, [addToHistory, navigation]);

  // Show skeleton while loading
  if (serviceTypesLoading || isLoadingHistory) {
    return <SearchBarSkeleton />;
  }

  // Error state
  if (isError) {
    return (
      <View className="flex-1 bg-white pt-12 px-4 justify-center items-center">
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text className="text-body text-gray-600 mt-4">
          {t('common.error_loading') || 'Error loading data'}
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mt-4 bg-primary px-6 py-3 rounded-full"
        >
          <Text className="text-white font-semibold">{t('common.go_back') || 'Go Back'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white  px-4" style={{ paddingTop: insets.top + 8 }}>
      {/* Search Header */}
      <View className="flex-row items-center mb-4">
        <TouchableOpacity onPress={() => navigation.popToTop()} className="p-1">
          <MaterialIcons name="chevron-left" size={32} color="#3B82F6" />
        </TouchableOpacity>
        
        <View style={{ flex: 1, position: 'relative' }}>
          <TextInput
            ref={inputRef}
            className="border bg-white border-gray-300 rounded-full px-4 py-4 pr-10"
            placeholder={t('home.search_freelancer')}
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              style={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: [{ translateY: -12 }],
              }}
              onPress={() => setSearchText('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Fast Search Section */}
      <Text className="text-gray-600 mb-3 text-base font-medium">
        {t('home.fast_search')}
      </Text>
      <View className="flex-row flex-wrap mb-6">
        {serviceTypes && serviceTypes.length > 0 ? (
          serviceTypes.map((tag, index) => (
            <Pressable
              key={tag._id || tag._id || index}
              className="border border-border rounded-full px-4 py-2 mr-2 mb-2"
              onPress={() => handleTagPress(tag.name)}
            >
              <Text className="text-sm text-gray-700">{tag.name}</Text>
            </Pressable>
          ))
        ) : (
          <Text className="text-caption text-gray-400">
            {t('common.no_categories') || 'No categories available'}
          </Text>
        )}
      </View>

      {/* Search History Section */}
      <View className="flex-row justify-between items-center px-2 mb-3 mt-2">
        <Text className="text-text text-body font-bold">
          {t('home.history_search')}
        </Text>
        {historySearchTags.length > 0 && (
          <TouchableOpacity onPress={handleClearAll}>
            <Text className="text-primary text-body underline">
              {t('home.clear_all')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {historySearchTags.length > 0 ? (
        <View className="flex-col">
          {historySearchTags.slice(0, 8).map((tag, index) => (
            <Pressable
              key={`${tag}-${index}`}
              className="flex-row justify-between items-center px-4 py-3 mr-2 mb-1 border-b border-gray-100"
              onPress={() => handleTagPress(tag)}
            >
              <View className="flex-row items-center flex-1">
                <Ionicons name="time-outline" size={18} color="#999" />
                <Text className="text-sm text-gray-700 ml-3" numberOfLines={1}>
                  {tag}
                </Text>
              </View>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleRemoveTag(tag);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={18} color="#999" />
              </TouchableOpacity>
            </Pressable>
          ))}
        </View>
      ) : (
        <View className="items-center justify-center py-12">
          {/* <Ionicons name="search-outline" size={48} color="#D1D5DB" /> */}
          {/* <Text className="text-caption text-gray-400 mt-4">
            {t('home.no_search_history') || 'No search history yet'}
          </Text> */}
        </View>
      )}
    </View>
  );
}