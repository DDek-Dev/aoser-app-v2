import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  View,
  Dimensions,
  ViewToken,
} from 'react-native';

const { width } = Dimensions.get('window');

const images = [
  { id: '1', uri: 'https://www.mtoag.com/wp-content/uploads/2024/05/how-to-implement.png' },
  { id: '2', uri: 'https://media.licdn.com/dms/image/v2/D4D12AQFDEwp8BZ8kbA/article-cover_image-shrink_720_1280/article-cover_image-shrink_720_1280/0/1698754097323?e=2147483647&v=beta&t=4BxQwFqk3SBwQrcshu2IMVS7CShvaiXL1mUOaRNQBSU' },
  { id: '3', uri: 'https://smartyads.com/storage/uploads/2020/september/in-app-advertising-trends.png' },
];

const ITEM_WIDTH = width * 0.85; // smaller than screen
const AUTO_SCROLL_INTERVAL = 10000;

const Advert = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewRef = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  });

  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % images.length;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    }, AUTO_SCROLL_INTERVAL);

    return () => clearInterval(interval);
  }, [currentIndex]);

  return (
    <View style={styles.container}>
      <FlatList
        data={images}
        ref={flatListRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={onViewRef.current}
        viewabilityConfig={viewConfigRef.current}
        renderItem={({ item }) => (
          <View style={styles.imageWrapper}>
            <Image source={{ uri: item.uri }} style={styles.image} />
          </View>
        )}
      />

      <View style={styles.pagination}>
        {images.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentIndex ? styles.activeDot : null,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 180,
    width: '100%',
    alignItems: 'center',
    backgroundColor:'white'
  },
  imageWrapper: {
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: ITEM_WIDTH,
    height: 150,
    borderRadius: 16,
    resizeMode: 'cover',
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 4,
    backgroundColor: '#999',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#2B68F2',
  },
});

export default Advert;
