import { useState, useEffect } from 'react';
import { 
  Image, 
  Pressable, 
  Text, 
  View, 
  ScrollView, 

  Modal,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ImageViewer from 'react-native-image-zoom-viewer';

type Props = {
  certificateImages: string[];
  autoSlideInterval?: number; // in milliseconds, default 3000
  isReview?: boolean;
};

const IMAGES_BASE_URL = process.env.EXPO_PUBLIC_IMAGES_URL;
export default function CertificateImageGrid({ 
  certificateImages, 
  autoSlideInterval = 3000,
  isReview

}: Props) {

  const [activeIndex, setActiveIndex] = useState(0);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
 
  
  // Auto slide functionality
  useEffect(() => {
    if (certificateImages.length <= 1) return;
    
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => 
        prevIndex === certificateImages.length - 1 ? 0 : prevIndex + 1
      );
    }, autoSlideInterval);

    return () => clearInterval(interval);
  }, [certificateImages.length, autoSlideInterval]);

  const handleImagePress = (index: number) => {
    setViewerIndex(index);
    setViewerVisible(true);
  };

  const handleThumbnailPress = (index: number) => {
    setActiveIndex(index);
  };

  const closeImageViewer = () => {
    setViewerVisible(false);
  };

  const goToNextImage = () => {
    setViewerIndex(prev => 
      prev === certificateImages.length - 1 ? 0 : prev + 1
    );
  };

  const goToPrevImage = () => {
    setViewerIndex(prev => 
      prev === 0 ? certificateImages.length - 1 : prev - 1
    );
  };

  if (!certificateImages || certificateImages.length === 0) {
    return null;
  }

  // Prepare images for the zoom viewer
  const imageUrls = certificateImages.map(uri => ({ url: IMAGES_BASE_URL+ uri }));

  return (
    <View className="space-y-3">
      {/* Main Image Display */}
      <View className="relative">
        <Pressable
          onPress={() => handleImagePress(activeIndex)}
          className="rounded-xl overflow-hidden"
        >
          <Image
            source={{ uri: isReview ? certificateImages[activeIndex] : `${IMAGES_BASE_URL}${certificateImages[activeIndex]}` }}
            className="w-full h-48 rounded-xl"
            resizeMode="contain"
          />
          
          {/* Image counter overlay */}
          {certificateImages.length > 1 && (
            <View className="absolute top-2 right-2 bg-black/50 px-2 py-1 rounded-full">
              <Text className="text-white text-xs font-medium">
                {activeIndex + 1} / {certificateImages.length}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Thumbnail Grid */}
      {certificateImages.length > 1 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="space-x-2"
          contentContainerStyle={{ paddingHorizontal: 4 }}
        >
          {certificateImages.map((imageUri, index) => (
            <Pressable
              key={index}
              onPress={() => handleThumbnailPress(index)}
              className={`rounded-lg overflow-hidden border-2 ${
                index === activeIndex 
                  ? 'border-blue-500' 
                  : 'border-gray-200'
              }`}
            >
              <Image
                source={{ uri: isReview ? imageUri : `${IMAGES_BASE_URL}${imageUri}` }}
                className="w-16 h-16"
                resizeMode="cover"
              />
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Dots Indicator */}
      {certificateImages.length > 1 && certificateImages.length <= 5 && (
        <View className="flex-row justify-center space-x-2 mt-3">
          {certificateImages.map((_, index) => (
            <Pressable
              key={index}
              onPress={() => handleThumbnailPress(index)}
              className={`w-2 h-2 rounded-full ${
                index === activeIndex ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </View>
      )}

      {/* Full Screen Image Viewer Modal */}
      <Modal
        visible={viewerVisible}
        transparent={true}
        onRequestClose={closeImageViewer}
      >
        <View style={styles.modalContainer}>
          {/* Header with close button and counter */}
          <View style={styles.header}>
            <TouchableOpacity onPress={closeImageViewer} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.counterText}>
              {viewerIndex + 1} / {certificateImages.length}
            </Text>
          </View>

          {/* Image Zoom Viewer */}
          <ImageViewer
            imageUrls={imageUrls}
            index={viewerIndex}
            enableSwipeDown={true}
            onSwipeDown={closeImageViewer}
            onChange={(index) => setViewerIndex(index || 0)}
            enablePreload={true}
            // renderHeader={() => null} // We use our custom header
            // renderIndicator={() => null} // We use our custom indicator
          />

          {/* Navigation Arrows */}
          {certificateImages.length > 1 && (
            <>
              <TouchableOpacity
                style={[styles.navButton, styles.prevButton]}
                onPress={goToPrevImage}
              >
                <Ionicons name="chevron-back" size={30} color="white" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.navButton, styles.nextButton]}
                onPress={goToNextImage}
              >
                <Ionicons name="chevron-forward" size={30} color="white" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 1000,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  counterText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    padding: 15,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  prevButton: {
    left: 20,
  },
  nextButton: {
    right: 20,
  },
});