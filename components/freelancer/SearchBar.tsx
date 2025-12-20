import React, { useState, useRef, useEffect } from 'react';
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
import LoadingScreen from 'screens/Loading/LoadingScreen';

export default function SearchBar() {
  const route = useRoute<RouteProp<FreelancerStackParamList, 'SearchBar'>>();
  const initialText = route.params?.text || '';
  const [searchText, setSearchText] = useState(initialText);
  const inputRef = useRef<TextInput>(null);
  const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();


  const [historySearchTags, setHistorySearchTags] = useState<string[]>([]);
  const { data: serviceTypes, isLoading: serviceTypesLoading, isError } = useGetServiceTypes();

  const shouldFocus = route.params?.focus || false; // New line added for focus parameter
  const { t } = useTranslation();
  useEffect(() => {
    if (shouldFocus) {
      const timeout = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [shouldFocus]);
  // Load history from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('searchHistory');
        if (stored) {
          setHistorySearchTags(JSON.parse(stored));
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  // Save history to AsyncStorage whenever it changes
  useEffect(() => {
    AsyncStorage.setItem('searchHistory', JSON.stringify(historySearchTags));
  }, [historySearchTags]);

  const handleRemoveTag = (tagToRemove: string) => {
    setHistorySearchTags(tags => tags.filter(tag => tag !== tagToRemove));
  };

  // Clear all tags
  const handleClearAll = () => {
    setHistorySearchTags([]);
  };

  const handleSearch = () => {
    if (searchText.trim()) {
      navigation.navigate('SearchView', { query: searchText.trim() });
      setSearchText('');
      Keyboard.dismiss();
      // Add to history if not already present
      setHistorySearchTags(tags => {
        const newTag = searchText.trim();
        if (!tags.includes(newTag)) {
          return [newTag, ...tags];
        }
        return tags;
      });
    }
  };
  if (serviceTypesLoading || !serviceTypes) return <LoadingScreen />

  return (
    <View className="flex-1 bg-white pt-12 px-4 ">
      <View className="flex-row items-center mb-4 ">
        <TouchableOpacity onPress={() => navigation.popToTop()} className="p-1">
          <MaterialIcons name="chevron-left" size={32} color="#3B82F6" />
        </TouchableOpacity>
        <View style={{ flex: 1, position: 'relative' }}>
          <TextInput
            ref={inputRef}
            className={`border bg-white border-gray-300 rounded-full px-4 py-4 pr-10 `}
            placeholder={t('home.search_freelancer')}
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              style={{ position: 'absolute', right: 16, top: '50%', transform: [{ translateY: -12 }] }}
              onPress={() => setSearchText('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text className="text-gray-600 mb-3 text-base ">{t('home.fast_search')}</Text>
      <View className="flex-row flex-wrap">
        {serviceTypes.map((tag, index) => (
          <Pressable
            key={index}
            className="border border-border rounded-full px-4 py-1 mr-2 mb-2"
            onPress={() => {
              navigation.navigate('SearchView', { query: tag.name.trim() });
              setSearchText('');
              Keyboard.dismiss();
              // Add to history if not already present
              setHistorySearchTags(tags => {
                if (!tags.includes(tag.name.trim())) {
                  return [tag.name.trim(), ...tags];
                }
                return tags;
              });
            }}
          >
            <Text className="text-sm text-gray-700">{tag.name}</Text>
          </Pressable>
        ))}
      </View>

      <View className='flex-row justify-between px-2 mb-2 mt-6'>
        <Text className="text-text mb-3 text-body font-bold">{t('home.history_search')}</Text>
        <Text
          className="text-textSecondary mb-3 text-body"
          onPress={handleClearAll}
          style={{ textDecorationLine: historySearchTags.length ? 'underline' : 'none', color: historySearchTags.length ? '#007AFF' : '#999' }}
        >
          {t('home.clear_all')}
        </Text>
      </View>

      <View className="flex-col ">
        {(historySearchTags || []).slice(0, 6).map((tag, index) => (
          <Pressable
            key={index}
            className="brounded-full flex-row justify-between px-4 py-1 mr-2 mb-2"
            onPress={() => {
              navigation.navigate('SearchView', { query: tag.trim() });
              setSearchText('');
              Keyboard.dismiss();
            }}
          >
            <Text className="text-sm text-gray-700">{tag}</Text>
            <Text
              className="text-body text-textSecondary"
              onPress={e => {
                e.stopPropagation();
                handleRemoveTag(tag);
              }}
            >
              <Ionicons name="close" size={16} color="#999" />
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}