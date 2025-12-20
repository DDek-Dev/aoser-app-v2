import React, { useRef, useState, useMemo, useEffect, use } from 'react';
import { FlatList, StyleProp, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useGetServiceTypes } from 'hooks/useFreelancer';
import * as Icons from 'lucide-react-native';
import { CategoryTabSkeleton } from 'skeletonScreens/CategoryTabSkeleton';
import { get } from 'react-native/Libraries/TurboModule/TurboModuleRegistry';
import { useTranslation } from 'react-i18next';

type Props = {
  singleRow?: boolean;
  selectedCategory?: string;
  selectedIndex?: number;
  onCategoryChange?: (category: string, index: number, categoryId?: string) => void;
};

interface Category {
  icon?: string;
  color?: string;
}

interface IconDisplayProps {
  category: Category;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export const IconDisplay: React.FC<IconDisplayProps> = ({ 
  category, 
  size = 24,
  style 
}) => {
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

  const IconComponent = getIcon(category?.icon);

  return (
    <View style={style}>
      <IconComponent 
        size={size}
        color={category?.color || 'black'}
        strokeWidth={2}
      />
    </View>
  );
};

export default function CategoryTabs({ 
  singleRow = false, 
  selectedCategory: externalSelectedCategory,
  selectedIndex: externalSelectedIndex = 0,
  onCategoryChange 
}: Props) {
  const [internalActive, setInternalActive] = useState('All');
  const flatListRef = useRef<FlatList>(null);
  const {t} = useTranslation();
  const { data, isLoading, isError } = useGetServiceTypes();

  // Use external selectedCategory if provided, otherwise use internal state
  const activeCategory = externalSelectedCategory !== undefined ? externalSelectedCategory : internalActive;
  const activeIndex = externalSelectedIndex !== undefined ? externalSelectedIndex : 0;

  const categories = useMemo(() => {
    if (!data) return [{ name: 'All', icon: 'apps-outline' }];
    
    return [
      { name: 'All', icon: 'apps-outline' },
      ...data
    ];
  }, [data]);

  // Scroll to active index when external selection changes
  useEffect(() => {
    if (externalSelectedIndex !== undefined && externalSelectedIndex >= 0) {
      flatListRef.current?.scrollToIndex({
        index: externalSelectedIndex,
        animated: true,
        viewPosition: 0.5,
      });
    }
  }, [externalSelectedIndex]);

  const onPressCategory = (item: any, index: number) => {
    // Update internal state only if not controlled externally
    if (externalSelectedCategory === undefined) {
      setInternalActive(item.name);
    }

    const categoryId = item.name === 'All' ? undefined : (item._id || item.id);
    onCategoryChange?.(item.name, index, categoryId);

    // Scroll to the selected category
    if (index > 0 && index < categories.length - 1) {
      flatListRef.current?.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5, 
      });
    }
  };

  const renderCategory = ({ item, index }: { item: any; index: number }) => {
    const isActive = activeCategory === item.name;

    return (
      <TouchableOpacity
        onPress={() => onPressCategory(item, index)}
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          width: 70,
          height: 70,
          marginRight: 12,
          marginBottom: 4,
          borderRadius: 16,
          // zIndex: 10,
          backgroundColor: isActive ? '#3b82f6' : '#fff',
        }}
        key={index}
        className="border border-border "
      >
        {item.name === 'All' ? (
          <Ionicons
            name={item.icon as keyof typeof Ionicons.glyphMap}
            size={20}
            color={isActive ? 'white' : '#4B5563'}
          />
        ) : (
          <IconDisplay category={item} size={20} style={{ marginBottom: 4, alignSelf: 'center' }} />
        )}

        <Text
          style={{
            marginTop: item.name === 'All' ? 4 : 0,
            color: isActive ? 'white' : '#374151',
            textAlign: 'center',
          }}
          className="text-caption"
          numberOfLines={2}
        >
          {item.name =='All' ?  t('categoryTabs.all') : item.name } 
        </Text>
      </TouchableOpacity>
    );
  };

  if (isLoading || isError) return (
    <FlatList
      horizontal
      data={[1, 2, 3, 4, 5, 6, 7]}
      renderItem={() => <CategoryTabSkeleton />}
      keyExtractor={(item, index) => index.toString()}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16 }}
    />
  );

  return (
    <FlatList
      ref={flatListRef}
      horizontal
      data={categories}
      renderItem={renderCategory}
      keyExtractor={(item, index) => `${item.name}-${index}`}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16 }}
      keyboardShouldPersistTaps="handled"
      getItemLayout={(_, index) => ({
        length: 92,
        offset: 92 * index,
        index,
      })}
      initialScrollIndex={activeIndex}
      onScrollToIndexFailed={(info) => {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: info.index,
            animated: true,
          });
        }, 100);
      }}
    />
  );
}