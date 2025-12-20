import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  SafeAreaView,
  View,
  TouchableOpacity,
  Text,
  Image,
  FlatList,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MediaFile } from 'types';
import { VideoView, useVideoPlayer } from 'expo-video';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface MediaPreviewModalProps {
  visible: boolean;
  selectedMedia: MediaFile[];
  message: string;
  onMessageChange: (text: string) => void;
  onClose: () => void;
  onSend: (media: MediaFile[], message: string) => void;
  isSending: boolean;
}

// Separate component for video items to properly use hooks
const VideoPreviewItem: React.FC<{
  item: MediaFile;
  shouldPlay: boolean;
}> = ({ item, shouldPlay }) => {
  const videoPlayer = useVideoPlayer(item.uri, (player) => {
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
        // allowsFullscreen={false}
        showsTimecodes={true}
      />
    </View>
  );
};

const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({
  visible,
  selectedMedia,
  message,
  onMessageChange,
  onClose,
  onSend,
  isSending
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);


  const handleViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      setCurrentIndex(newIndex);
    }
  }).current;

  const renderItem = ({ item, index }: { item: MediaFile; index: number }) => {
    const isVideo = item.type === 'video' || item.mimeType?.startsWith('video/');

    if (isVideo) {
      return (
        <VideoPreviewItem
          item={item}
          shouldPlay={index === currentIndex}
        />
      );
    } else {
      return (
        <View style={{ width: screenWidth, height: screenHeight }}>
          <Image
            source={{ uri: item.uri }}
            style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
          />
        </View>
      );
    }
  };

  const renderSingleMedia = () => {
    const item = selectedMedia[0];
    const isVideo = item.type === 'video' || item.mimeType?.startsWith('video/');

    if (isVideo) {
      return <VideoPreviewItem item={item} shouldPlay={true} />;
    } else {
      return (
        <View style={{ width: screenWidth, height: screenHeight }}>
          <Image
            source={{ uri: item.uri }}
            style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
          />
        </View>
      );
    }
  };

  // Reset current index when modal opens
  useEffect(() => {
    if (visible) {
      setCurrentIndex(0);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 , marginBottom: Platform.OS === 'android' ? 25 : 24}}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
          {/* Header */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 16,
              backgroundColor: 'rgba(0,0,0,0.6)',
            }}
          >
            <TouchableOpacity onPress={onClose} disabled={isSending}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '500' }}>
              {selectedMedia.length} selected
            </Text>
          </View>

          {/* Media Preview */}
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            {selectedMedia.length === 1 ? (
              renderSingleMedia()
            ) : (
              <FlatList
                data={selectedMedia}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                renderItem={renderItem}
                onViewableItemsChanged={handleViewableItemsChanged}
                viewabilityConfig={{
                  itemVisiblePercentThreshold: 50,
                }}
                initialScrollIndex={0}
              />
            )}
          </View>

          {/* Text Input + Send */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
              gap: 8,
              backgroundColor: 'rgba(0,0,0,0.8)',
               paddingBottom: Platform.OS === 'ios' ? 12 : 42,
            }}
          >
            <TextInput
              style={{
                flex: 1,
                backgroundColor: '#333',
                color: 'white',
                padding: 12,
                borderRadius: 20,
                fontSize: 16,
               
              }}
              placeholder="Add a caption..."
              placeholderTextColor="#999"
              value={message}
              onChangeText={onMessageChange}
              multiline
              editable={!isSending}
            />
            {isSending ? (
              <Text className='text-surface'>Sending...</Text>
            ) : (
              <TouchableOpacity
                onPress={() => onSend(selectedMedia, message)}
                disabled={selectedMedia.length === 0}
              >
                <Text
                  style={{
                    color: selectedMedia.length > 0 ? '#25D366' : '#666',
                    fontSize: 16,
                    fontWeight: '600',
                  }}
                >
                  Send
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
        {/* <View style={{ height: Platform.OS === 'ios' ? 20 : 32 }} /> */}
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default MediaPreviewModal;