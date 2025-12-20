import React from 'react';
import { View, TouchableOpacity, Image, Text, Dimensions, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import VideoThumbnail from './VideoThumbnail';
import { MediaFile } from 'types';

const { width: screenWidth } = Dimensions.get('window');
const BASE_IMAGE = process.env.EXPO_PUBLIC_IMAGES_URL;
interface MediaRendererProps {
  media: MediaFile;
  index: number;
  allMedia: MediaFile[];
  onMediaPress: (media: MediaFile) => void;
}

interface MediaDimensions {
  width: number;
  height: number;
  showCounter?: boolean;
}

const MediaRenderer: React.FC<MediaRendererProps> = ({
  media,
  index,
  allMedia,
  onMediaPress
}) => {
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // console.log("media : ", media);
  const getMediaDimensions = (mediaCount: number, index: number): MediaDimensions | null => {
    // Reduced max width for better chat appearance - 70% instead of 80%
    const maxWidth = screenWidth * 0.7; 
    const spacing = 4;

    if (mediaCount === 1) {
      // Single media: larger but not too big for chat
      return { width: maxWidth, height: 180 }; // Reduced from 200
    } else if (mediaCount === 2) {
      return {
        width: (maxWidth - spacing) / 2,
        height: 150, // Reduced from 200 for better proportion
      };
    } else if (mediaCount === 3) {
      // For 3 items: first one larger, other two smaller on the right
      if (index === 0) {
        return {
          width: (maxWidth - spacing) / 2,
          height: 150,
        };
      } else {
        return {
          width: (maxWidth - spacing) / 2,
          height: 72, // Half height for stacked items
        };
      }
    } else if (mediaCount === 4) {
      return {
        width: (maxWidth - spacing) / 2,
        height: 110, // Slightly smaller for 2x2 grid
      };
    } else {
      // For more than 4 media items
      if (index === 0) {
        return {
          width: (maxWidth - spacing) / 2,
          height: 150,
        };
      } else if (index === 1) {
        return {
          width: (maxWidth - spacing) / 2,
          height: 150,
          showCounter: true,
        };
      } else {
        return null; 
      }
    }
  };

  const dimensions = getMediaDimensions(allMedia.length, index);
  if (!dimensions) return null;

  // Improved spacing logic for better grid layout
  const getMarginStyle = (mediaCount: number, index: number) => {
    const baseSpacing = 4;
    
    if (mediaCount === 1) {
      return { marginBottom: 0 };
    } else if (mediaCount === 2) {
      return {
        marginRight: index === 0 ? baseSpacing : 0,
        marginBottom: 0,
      };
    } else if (mediaCount === 3) {
      if (index === 0) {
        return { marginRight: baseSpacing, marginBottom: 0 };
      } else if (index === 1) {
        return { marginBottom: baseSpacing };
      } else {
        return { marginBottom: 0 };
      }
    } else if (mediaCount === 4) {
      return {
        marginRight: index % 2 === 0 ? baseSpacing : 0,
        marginBottom: index < 2 ? baseSpacing : 0,
      };
    } else {
      // More than 4 items
      return {
        marginRight: index === 0 ? baseSpacing : 0,
        marginBottom: 0,
      };
    }
  };

  const baseStyle = {
    width: dimensions.width,
    height: dimensions.height,
    borderRadius: 12,
    ...getMarginStyle(allMedia.length, index),
  };

  // Determine if this is a video file
  const isVideo = media.type === 'video' || media.mimeType?.startsWith('video/');

  // Resolve absolute URI: if media.uri is already a full URL, use it; otherwise prefix with BASE_IMAGE if available
  const resolveUri = (m: MediaFile) => {
    try {
      if (!m || !m.uri) return '';
      const u = String(m.uri);
      if (u.startsWith('http://') || u.startsWith('https://')) return u;
      if (BASE_IMAGE) return BASE_IMAGE.endsWith('/') ? BASE_IMAGE + u : `${BASE_IMAGE}${u}`;
      return u;
    } catch (e) {
      return String(m.uri || '');
    }
  };
  const resolvedUri = resolveUri(media);

  const renderMediaContainer = (children: React.ReactNode) => (
    <View 
      style={{ 
        marginTop: index === 0 ? 8 : 0, 
        borderRadius: 12, 
        overflow: 'hidden' 
      }} 
      key={media.id}
    >
      {children}
    </View>
  );

  switch (media.type) {
    case 'image':
      return renderMediaContainer(
        <Pressable
          onPress={() => onMediaPress(media)}
          style={baseStyle}
        >
          <Image
            source={{ uri: resolvedUri }}
            style={[baseStyle, { position: 'relative', margin: 0 }]}
            resizeMode="cover"
          />
          {dimensions.showCounter && allMedia.length > 4 && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.6)',
                borderRadius: 12,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
                +{allMedia.length }
              </Text>
            </View>
          )}
        </Pressable>
      );

    case 'video':
      return renderMediaContainer(
        <VideoThumbnail
          media={{ ...media, uri: resolvedUri }}
          style={baseStyle}
          onPress={() => onMediaPress({ ...media, uri: resolvedUri })}
          showCounter={dimensions.showCounter && allMedia.length > 4 ? allMedia.length - 4 : undefined}
        />
      );

    case 'document':
      return (
        <TouchableOpacity
          key={media.id}
          onPress={() => onMediaPress({ ...media, uri: resolvedUri })}
          style={{
            backgroundColor: '#f3f4f6',
            padding: 12,
            borderRadius: 8,
            marginBottom: 4,
            marginTop: index === 0 ? 8 : 4,
            marginRight: index < allMedia.length - 1 ? 8 : 0,
            borderWidth: 1,
            borderColor: '#e5e7eb',
            minWidth: 180, // Reduced from 200
            maxWidth: screenWidth * 0.65, // Responsive max width
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="document-text" size={24} color="#6b7280" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text
                numberOfLines={2}
                style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}
              >
                {media.name || resolvedUri.split('/').pop()}
              </Text>
              <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                {formatFileSize(media.size)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      );

    default:
      // Handle any media type that might be identified as video by mimeType
      if (isVideo) {
        return renderMediaContainer(
          <VideoThumbnail
            media={media}
            style={baseStyle}
            onPress={() => onMediaPress(media)}
            showCounter={dimensions.showCounter && allMedia.length > 4 ? allMedia.length - 4 : undefined}
          />
        );
      }
      return null;
  }
};

export default MediaRenderer;