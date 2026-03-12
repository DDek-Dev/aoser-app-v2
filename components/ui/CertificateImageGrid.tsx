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
import { useTranslation } from 'react-i18next';

type Props = {
  certificateImages: string[];
  autoSlideInterval?: number; // in milliseconds, default 3000
  isReview?: boolean;
};

const IMAGES_BASE_URL = process.env.EXPO_PUBLIC_IMAGES_URL || '';

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);

const resolveImageUri = (value: string, isReview?: boolean) => {
  if (!value) return '';
  if (isReview || isAbsoluteUrl(value)) return value;
  return `${IMAGES_BASE_URL}${value}`;
};

export default function CertificateImageGrid({ 
  certificateImages, 
  autoSlideInterval = 3000,
  isReview

}: Props) {

  const [activeIndex, setActiveIndex] = useState(0);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const hasImages = !!certificateImages?.length;
   const {t} = useTranslation();
 
  
  // Auto slide functionality
  useEffect(() => {
    if (!hasImages || certificateImages.length <= 1 || viewerVisible) return;
    
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => 
        prevIndex === certificateImages.length - 1 ? 0 : prevIndex + 1
      );
    }, autoSlideInterval);

    return () => clearInterval(interval);
  }, [hasImages, certificateImages.length, autoSlideInterval, viewerVisible]);

  useEffect(() => {
    if (!hasImages) {
      setActiveIndex(0);
      setViewerIndex(0);
      return;
    }

    if (activeIndex > certificateImages.length - 1) {
      setActiveIndex(0);
    }
    if (viewerIndex > certificateImages.length - 1) {
      setViewerIndex(0);
    }
  }, [hasImages, certificateImages.length, activeIndex, viewerIndex]);

  const handleImagePress = (index: number) => {
    setActiveIndex(index);
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
    setViewerIndex((prev) => {
      const next = prev === certificateImages.length - 1 ? 0 : prev + 1;
      setActiveIndex(next);
      return next;
    });
  };

  const goToPrevImage = () => {
    setViewerIndex((prev) => {
      const next = prev === 0 ? certificateImages.length - 1 : prev - 1;
      setActiveIndex(next);
      return next;
    });
  };

  if (!hasImages) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="document-text-outline" size={22} color="#3b82f6" />
        </View>
        <Text style={styles.emptyTitle}>{t("freelancer_profile.tabbedProfile.portfolio")}</Text>
        <Text style={styles.emptyText}>{t("profile.resume_portfolio.no_portfolio")}</Text>
      </View>
    );
  }

  // Prepare images for the zoom viewer
  const imageUrls = certificateImages.map((uri) => ({
    url: resolveImageUri(uri, isReview),
  }));

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Ionicons name="ribbon-outline" size={18} color="#1d4ed8" />
          <Text style={styles.title}>{t("freelancer_profile.tabbedProfile.portfolio")}</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{certificateImages.length}</Text>
        </View>
      </View>

      {/* Main Image Display */}
      <View style={styles.previewWrap}>
        <Pressable
          onPress={() => handleImagePress(activeIndex)}
          style={styles.previewPressable}
        >
          <Image
            source={{ uri: resolveImageUri(certificateImages[activeIndex], isReview) }}
            style={styles.mainImage}
            resizeMode="contain"
          />

          {/* <View style={styles.previewHint}>
            <Ionicons name="expand-outline" size={14} color="#ffffff" />
            <Text style={styles.previewHintText}>Tap to view full size</Text>
          </View> */}
          
          {/* Image counter overlay */}
          {certificateImages.length > 1 && (
            <View style={styles.counterBadge}>
              <Text style={styles.counterBadgeText}>
                {activeIndex + 1} / {certificateImages.length}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Thumbnail Grid */}
      {certificateImages.length > 1 && (
        <>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbnailRow}
          >
            {certificateImages.map((imageUri, index) => (
              <Pressable
                key={index}
                onPress={() => handleThumbnailPress(index)}
                style={[
                  styles.thumbnailPressable,
                  index === activeIndex ? styles.thumbnailPressableActive : styles.thumbnailPressableIdle,
                ]}
              >
                <Image
                  source={{ uri: resolveImageUri(imageUri, isReview) }}
                  style={styles.thumbnailImage}
                  resizeMode="cover"
                />
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.dotsRow}>
            {certificateImages.map((_, index) => (
              <Pressable
                key={index}
                onPress={() => handleThumbnailPress(index)}
                style={[
                  styles.dot,
                  index === activeIndex ? styles.dotActive : styles.dotIdle,
                ]}
              />
            ))}
          </View>
        </>
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
            onChange={(index) => {
              const nextIndex = index || 0;
              setViewerIndex(nextIndex);
              setActiveIndex(nextIndex);
            }}
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
  container: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  countBadge: {
    backgroundColor: '#dbeafe',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countText: {
    color: '#1d4ed8',
    fontSize: 12,
    fontWeight: '700',
  },
  previewWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    borderColor: '#dbeafe',
    borderWidth: 1,
  },
  previewPressable: {
    width: '100%',
    height: 210,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  previewHint: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  previewHintText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  counterBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  counterBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  thumbnailRow: {
    paddingHorizontal: 2,
    gap: 8,
  },
  thumbnailPressable: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  thumbnailPressableActive: {
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  thumbnailPressableIdle: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  thumbnailImage: {
    width: 68,
    height: 68,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingTop: 2,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 99,
  },
  dotActive: {
    backgroundColor: '#2563eb',
    width: 18,
  },
  dotIdle: {
    backgroundColor: '#cbd5e1',
  },
  emptyContainer: {
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#93c5fd',
    backgroundColor: '#eff6ff',
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  emptyText: {
    fontSize: 13,
    color: '#475569',
  },
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
