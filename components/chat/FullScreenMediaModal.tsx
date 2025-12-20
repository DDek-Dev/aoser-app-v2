import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  Text,
  Image,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Linking,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { MediaFile } from 'types';
import { VideoView, useVideoPlayer } from 'expo-video';
import ScreenWrapper from 'components/ui/ScreenWrapper';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const BASE_IMAGE = process.env.EXPO_PUBLIC_IMAGES_URL;

interface FullScreenMediaModalProps {
  visible: boolean;
  mediaList: MediaFile[];
  initialMedia: MediaFile | null;
  onClose: () => void;
}

// Separate component for video items to properly use hooks
const FullScreenVideoItem: React.FC<{
  item: MediaFile;
  shouldPlay: boolean;
}> = ({ item, shouldPlay }) => {
  const resolveUri = (m: MediaFile) => {
    try {
      const u = String(m.uri || '');
      if (u.startsWith('http://') || u.startsWith('https://')) return u;
      if (BASE_IMAGE) return BASE_IMAGE.endsWith('/') ? BASE_IMAGE + u : `${BASE_IMAGE}${u}`;
      return u;
    } catch (e) {
      return String(m.uri || '');
    }
  };

  const videoUri = resolveUri(item);
  const videoPlayer = useVideoPlayer(videoUri, (player) => {
    player.loop = true;
    player.muted = false;
  });

  useEffect(() => {
    if (shouldPlay) {
      videoPlayer.play();
    } else {
      videoPlayer.pause();
    }
  }, [shouldPlay, videoPlayer]);

  return (
    <View style={{ width: screenWidth, height: screenHeight }}>
      <VideoView
        player={videoPlayer}
        style={{ width: '100%', height: '100%' }}
        contentFit="contain"
        showsTimecodes={true}
      />
    </View>
  );
};

const FullScreenMediaModal: React.FC<FullScreenMediaModalProps> = ({
  visible,
  mediaList,
  initialMedia,
  onClose
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState<{[key: string]: boolean}>({});
  const flatListRef = useRef<FlatList>(null);
  

  // Find initial index based on initialMedia
  useEffect(() => {
    if (visible && initialMedia && mediaList.length > 0) {
      const index = mediaList.findIndex(media => media.id === initialMedia.id);
      console.log("Found initial index:", index, "for media:", initialMedia.id);
      
      if (index !== -1) {
        setCurrentIndex(index);
        // Scroll to initial media with a small delay to ensure the modal is fully rendered
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({ index, animated: false });
        }, 100);
      }
    }
  }, [visible, initialMedia, mediaList]);

  const handleViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      setCurrentIndex(newIndex);
    }
  }).current;

  const renderItem = ({ item, index }: { item: MediaFile; index: number }) => {
    const isVideo = item.type === 'video' || item.mimeType?.startsWith('video/');
    const resolveUri = (m: MediaFile) => {
      try {
        const u = String(m.uri || '');
        if (u.startsWith('http://') || u.startsWith('https://')) return u;
        if (BASE_IMAGE) return BASE_IMAGE.endsWith('/') ? BASE_IMAGE + u : `${BASE_IMAGE}${u}`;
        return u;
      } catch (e) {
        return String(m.uri || '');
      }
    };

    const imageUri = resolveUri(item);
    const isDocument = item.type === 'document' || (item.mimeType && item.mimeType.startsWith('application')) || imageUri.toLowerCase().endsWith('.pdf');
    
    console.log(`Rendering item ${index}:`, {
      id: item.id,
      uri: item.uri,
      fullUri: imageUri,
      isVideo
    });

    if (isVideo) {
      return (
        <FullScreenVideoItem
          item={item}
          shouldPlay={index === currentIndex}
        />
      );
    } else {
      if (isDocument) {
        // Render a simple document viewer with an Open button that uses the system browser
        return (
          <View style={{
            width: screenWidth,
            height: screenHeight,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#000'
          }}>
            <View style={{ alignItems: 'center', padding: 20 }}>
              <Ionicons name="document-text" size={64} color="#fff" />
              <Text style={{ color: '#fff', marginTop: 12, fontSize: 16, fontWeight: '600' }} numberOfLines={2}>{item.name || imageUri.split('/').pop()}</Text>
              {item.size && (
                <Text style={{ color: '#ccc', marginTop: 8 }}>{(item.size / (1024 * 1024)).toFixed(2)} MB</Text>
              )}
              <TouchableOpacity
                onPress={async () => {
                  try {
                    // Prefer open in in-app browser; fallback to Linking
                    const res = await WebBrowser.openBrowserAsync(imageUri);
                    if (!res) {
                      Linking.openURL(imageUri);
                    }
                  } catch (e) {
                    Linking.openURL(imageUri);
                  }
                }}
                style={{ marginTop: 18, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#fff', borderRadius: 8 }}
              >
                <Text style={{ color: '#000', fontWeight: '600' }}>Open Document</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }

      return (
        <View style={{ 
          width: screenWidth, 
          height: screenHeight,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#000'
        }}>
          {imageLoading[item.id] && (
            <ActivityIndicator 
              size="large" 
              color="#fff" 
              style={{ position: 'absolute' }}
            />
          )}
          <Image
            source={{ uri: imageUri }}
            style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
            onLoadStart={() => {
              setImageLoading(prev => ({ ...prev, [item.id]: true }));
            }}
            onLoad={() => {
              setImageLoading(prev => ({ ...prev, [item.id]: false }));
            }}
            onError={(error) => {
              console.error("Image load error for:", imageUri, error.nativeEvent);
              setImageLoading(prev => ({ ...prev, [item.id]: false }));
            }}
          />
        </View>
      );
    }
  };

  const getItemLayout = (data: any, index: number) => ({
    length: screenWidth,
    offset: screenWidth * index,
    index,
  });

  // Only return null if modal should not be visible
  if (!visible) {
    return null;
  }
  
  if (mediaList.length === 0) {
    console.log("Media list is empty!");
    return null;
  }

  console.log("✓ Rendering modal with", mediaList.length, "items");

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      statusBarTranslucent
    >
      {/* <StatusBar hidden /> */}
      <ScreenWrapper style={{ flex: 1, backgroundColor: 'black' }} safeEdges={['top', 'bottom']}>
        {/* Header */}
        <View
          style={{
            position: 'absolute',
            top: 32,
            left: 0,
            right: 0,
            zIndex: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 16,
            paddingTop: 20,
            backgroundColor: 'rgba(0,0,0,0.7)',
          }}

        >
          <TouchableOpacity 
            onPress={onClose}
            style={{
              padding: 8,
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.1)'
            }}
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>

          {mediaList.length > 1 && (
            <View style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
              backgroundColor: 'rgba(255,255,255,0.2)'
            }}>
              <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
                {currentIndex + 1} / {mediaList.length}
              </Text>
            </View>
          )}
        </View>

        {/* Media Display */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          {mediaList.length === 1 ? (
            // Single media item
            renderItem({ item: mediaList[0], index: 0 })
          ) : (
            // Multiple media items with horizontal scrolling
            <FlatList
              ref={flatListRef}
              data={mediaList}
              keyExtractor={(item) => item.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              renderItem={renderItem}
              onViewableItemsChanged={handleViewableItemsChanged}
              viewabilityConfig={{
                itemVisiblePercentThreshold: 50,
              }}
              getItemLayout={getItemLayout}
              initialScrollIndex={currentIndex}
              onScrollToIndexFailed={(info) => {
                console.log("Scroll to index failed:", info);
                const wait = new Promise(resolve => setTimeout(resolve, 500));
                wait.then(() => {
                  flatListRef.current?.scrollToIndex({
                    index: info.index,
                    animated: true
                  });
                });
              }}
              removeClippedSubviews={false}
            />
          )}
        </View>

        {/* Media Info */}
        {mediaList[currentIndex] && (
          <View
            style={{
              position: 'absolute',
              bottom: 32,
              left: 0,
              right: 0,
              padding: 16,
              paddingBottom: 30,
              backgroundColor: 'rgba(0,0,0,0.7)',
            }}
          >
            <Text 
              style={{ 
                color: 'white', 
                fontSize: 14, 
                fontWeight: '500',
                marginBottom: 4
              }}
              numberOfLines={1}
            >
              {mediaList[currentIndex].name}
            </Text>
            {mediaList[currentIndex].size && (
              <Text style={{ color: '#ccc', fontSize: 12 }}>
                {(mediaList[currentIndex].size! / (1024 * 1024)).toFixed(2)} MB
              </Text>
            )}
          </View>
        )}
      </ScreenWrapper>
    </Modal>
  );
};

export default FullScreenMediaModal;