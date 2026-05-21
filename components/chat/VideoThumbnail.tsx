import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { MediaFile } from 'types';

interface VideoThumbnailProps {
  media: MediaFile;
  style: any;
  onPress: () => void;
  showCounter?: number;
}
const VideoThumbnail: React.FC<VideoThumbnailProps> = ({
  media,
  style,
  onPress,
  showCounter
}) => {
  // This hook is properly called at the top level of the component
  const videoPlayer = useVideoPlayer({ uri: media.uri, useCaching: true }, (player) => {
    player.loop = false;
    player.muted = true;
    player.keepScreenOnWhilePlaying = false;
    // Pause the video by default for thumbnails
    player.pause();
  });

  return (
    <TouchableOpacity onPress={onPress} style={style}>
      <VideoView
        player={videoPlayer}
        style={[style, { backgroundColor: '#000' }]}
        contentFit="cover"
        // allowsFullscreen={false}
        showsTimecodes={false}
      />

      {/* Play button overlay */}
      <View
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: [{ translateX: -15 }, { translateY: -15 }],
          backgroundColor: 'rgba(0,0,0,0.7)',
          borderRadius: 15,
          width: 30,
          height: 30,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Ionicons name="play" size={14} color="white" style={{ marginLeft: 1 }} />
      </View>

      {/* Counter overlay for multiple media */}
      {showCounter && (
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
            +{showCounter}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default VideoThumbnail;
