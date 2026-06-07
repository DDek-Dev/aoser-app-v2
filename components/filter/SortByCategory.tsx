import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  FlatList,
  Text,
  TouchableOpacity,
  View,
  ListRenderItem,
  StyleProp,
  ViewStyle,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Job } from 'types';
import { useGetServiceTypes } from 'hooks/useFreelancer';
import { CategoryTabSkeleton } from 'skeletonScreens/CategoryTabSkeleton';
import * as Icons from 'lucide-react-native';
import { useTranslation } from 'react-i18next';




interface Category {
  icon?: string; // Backend sends string, not keyof typeof Icons
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
  // Convert backend icon name to PascalCase
  const convertToPascalCase = (str: string): string => {
    return str
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  };

  // Get the icon component with fallback
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

interface SortByCategoryProps {
  data: Job[];
  onCategoryFilter: (filteredJobs: Job[], activeCategory: string) => void;
}

const SortByCategory: React.FC<SortByCategoryProps> = ({
  data,
  onCategoryFilter,
}) => {
  const [active, setActive] = useState('All');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    handleFilter(active);
  }, [active]);


  const { data: serviceTypes, isLoading, isError } = useGetServiceTypes();

  const categories = useMemo(() => {
    if (!serviceTypes) return [{ name: 'All', icon: 'apps-outline' }];

    return [
      { name: 'All', icon: 'apps-outline' }, // Static 'All' tab
      ...serviceTypes // Database categories
    ];
  }, [serviceTypes]);
  const handleFilter = (category: string) => {
    if (category === 'All') {
      const sorted = [...data].reverse(); // Show latest first
      onCategoryFilter(sorted, 'All');
    } else {
      const filtered = data.filter((job) => job.serviceType.name === category);
      onCategoryFilter(filtered, category);
    }
  };

  const onPressCategory = (item: any, index: number) => {
    setActive(item.name);
    // Scroll only if not first or last tab
    if (index > 0 && index < categories.length - 1) {
      flatListRef.current?.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5,
      });
    }
  };

  const { t } = useTranslation();

  const renderCategory = ({ item, index }: { item: any; index: number }) => {
    const isActive = active === item.name;
    return (
      <Pressable
        onPress={() => onPressCategory(item, index)}
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          width: 70,
          height: 70,
          marginRight: 6,
          // marginBottom: 4,
          marginTop: 4,
          borderRadius: 16,
          zIndex: 10,
          backgroundColor: isActive ? '#3b82f6' : '#fff',
        }}
        key={index}
        className="border border-border"
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
          {item.name == 'All' ? t('categoryTabs.all') : item.name}

        </Text>
        
      </Pressable>
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
  )
  return (
    <View >
      <FlatList
        ref={flatListRef}
        horizontal
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.name}
        showsHorizontalScrollIndicator={false}
        // contentContainerStyle={{ paddingHorizontal: 16 }}
        keyboardShouldPersistTaps="handled"
        getItemLayout={(_, index) => ({
          length: 92,
          offset: 92 * index,
          index,
        })}
        initialScrollIndex={0}
      />
    </View>
  );
};

export default SortByCategory;
