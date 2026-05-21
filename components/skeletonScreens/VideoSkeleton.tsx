import { View, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef } from 'react';

type VideoSkeletonProps = {
  aspectRatio?: number;
  height?: number;
};

export default function VideoSkeleton({ aspectRatio = 4 / 5, height }: VideoSkeletonProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Loop the shimmer animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.7, 0.3],
  });

  const containerStyle = height 
    ? [styles.container, { height }]
    : [styles.container, { aspectRatio }];

  return (
    <Animated.View style={[containerStyle, { opacity }]}>
      <View style={styles.innerShimmer} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#e5e5e5',
    borderRadius: 0,
    overflow: 'hidden',
  },
  innerShimmer: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
});
