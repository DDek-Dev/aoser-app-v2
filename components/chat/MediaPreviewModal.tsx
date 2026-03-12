import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  Text,
  Image,
  FlatList,
  TextInput,
  Dimensions,
  Platform,
  StatusBar,
  Keyboard,
  Animated,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MediaFile } from 'types';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');
const COMPOSER_BG = '#4B5563';
const loadedVideoUriCache = new Set<string>();

interface MediaPreviewModalProps {
  visible: boolean;
  selectedMedia: MediaFile[];
  message: string;
  onMessageChange: (text: string) => void;
  onClose: () => void;
  onSend: (media: MediaFile[], message: string) => void;
  isSending: boolean;
}

const VideoPreviewItem: React.FC<{
  item: MediaFile;
  shouldPlay: boolean;
}> = ({ item, shouldPlay }) => {
  const [isLoading, setIsLoading] = useState(() => !loadedVideoUriCache.has(item.uri));
  const videoPlayer = useVideoPlayer({ uri: item.uri, useCaching: true }, (player) => {
    player.loop = true;
    player.muted = false;
    player.keepScreenOnWhilePlaying = false;
  });

  useEffect(() => {
    setIsLoading(!loadedVideoUriCache.has(item.uri));
  }, [item.uri]);

  const markLoaded = () => {
    loadedVideoUriCache.add(item.uri);
    setIsLoading(false);
  };

  useEffect(() => {
    if (shouldPlay) {
      videoPlayer.play();
    } else {
      videoPlayer.pause();
    }
  }, [shouldPlay, videoPlayer]);

  return (
    <View style={{ width: screenWidth, height: '100%' }}>
      <VideoView
        player={videoPlayer}
        style={{ width: '100%', height: '100%' }}
        contentFit="contain"
        showsTimecodes={true}
        onFirstFrameRender={markLoaded}
      />
      {isLoading && (
        <View style={{ ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="small" color="#fff" />
        </View>
      )}
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
  isSending,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const canSend = selectedMedia.length > 0 && !isSending;
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  // Manually track keyboard height with Animated — works reliably on both platforms
  const keyboardHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      Animated.timing(keyboardHeight, {
        toValue: e.endCoordinates.height,
        duration: Platform.OS === 'ios' ? e.duration || 250 : 150,
        useNativeDriver: false,
      }).start();
    });

    const hideSub = Keyboard.addListener(hideEvent, (e) => {
      Animated.timing(keyboardHeight, {
        toValue: 0,
        duration: Platform.OS === 'ios' ? e.duration || 250 : 150,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardHeight]);

  const handleViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const renderItem = ({ item, index }: { item: MediaFile; index: number }) => {
    const isVideo = item.type === 'video' || item.mimeType?.startsWith('video/');
    return isVideo ? (
      <VideoPreviewItem item={item} shouldPlay={index === currentIndex} />
    ) : (
      <View style={{ width: screenWidth, height: '100%' }}>
        <Image
          source={{ uri: item.uri }}
          style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
        />
      </View>
    );
  };

  const renderSingleMedia = () => {
    const item = selectedMedia[0];
    const isVideo = item.type === 'video' || item.mimeType?.startsWith('video/');
    return isVideo ? (
      <VideoPreviewItem item={item} shouldPlay={true} />
    ) : (
      <Image
        source={{ uri: item.uri }}
        style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
      />
    );
  };

  useEffect(() => {
    if (visible) setCurrentIndex(0);
  }, [visible]);

  useEffect(() => {
    if (currentIndex >= selectedMedia.length) setCurrentIndex(0);
  }, [currentIndex, selectedMedia.length]);

  const handleClose = () => {
    if (isSending) return;
    Keyboard.dismiss();
    onMessageChange('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <StatusBar backgroundColor="black" barStyle="light-content" />

      <View style={{ flex: 1, backgroundColor: '#000' }}>

        {/* Header — normal flow, never overlaps media */}
        <View
          style={{
            paddingTop: insets.top + 8,
            paddingBottom: 12,
            paddingHorizontal: 16,
            backgroundColor: 'black',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <TouchableOpacity onPress={handleClose} disabled={isSending}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '500' }}>
            {selectedMedia.length}
          </Text>
        </View>

        {/* Media area — flex:1 fills space between header and composer */}
        <View style={{ flex: 1 }}>
          {selectedMedia.length === 0 ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: 'white' }}>No media selected</Text>
            </View>
          ) : selectedMedia.length === 1 ? (
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
              viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
              initialScrollIndex={0}
              style={{ flex: 1 }}
            />
          )}
        </View>

        {/*
          Animated.View with marginBottom = keyboardHeight.
          This is the most reliable cross-platform approach:
          - On Android: KeyboardAvoidingView with 'height' often fails inside Modals
          - On iOS: KeyboardAvoidingView with 'padding' works but can jump
          - Animated keyboard listener is consistent on BOTH platforms
          The composer slides up exactly with the keyboard, always visible.
        */}
        <Animated.View style={{ marginBottom: keyboardHeight }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingTop: 12,
              // Only apply safe area bottom when keyboard is hidden
              paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
              gap: 8,
              backgroundColor: COMPOSER_BG,
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
                maxHeight: 120,
              }}
              placeholder={t('chat.chatroom.typeMessage')}
              placeholderTextColor="#999"
              value={message}
              onChangeText={onMessageChange}
              multiline
              editable={!isSending}
            />
            {isSending ? (
              <Text style={{ color: 'white' }}>{t('chat.chatroom.sending')}</Text>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  if (!canSend) return;
                  onSend(selectedMedia, message);
                }}
                disabled={!canSend}
                style={{
                  marginLeft: 4,
                  marginBottom: 4,
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: canSend ? '#3B82F6' : '#D1D5DB',
                }}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color={canSend ? '#fff' : '#9CA3AF'}
                />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

      </View>
    </Modal>
  );
};

export default MediaPreviewModal;
