import { View, StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

type Props = {
  video?: string | null;
}

const IMAGES_BASE_URL = process.env.EXPO_PUBLIC_IMAGES_URL;

export default function VDOPromote_free_profile({ video }: Props) {
  const videoS = video ? { uri: `${IMAGES_BASE_URL}${video}` } : null;

  const he = 192
  if (!videoS) return null;

  const player = useVideoPlayer(videoS, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  return (
    <View style={styles.container}>
      <VideoView
        style={styles.video}
        player={player}
        // allowsFullscreen={false}
        allowsPictureInPicture={false}
        nativeControls={false}
        contentFit="cover"  // Makes video fill the container beautifully like "cover" in Image
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',        // Changed from 90% to fill card width
    height: 112,          // h-28 (7 * 16 = 112) to match Image height
    borderRadius: 0,      // Removed border radius since parent handles it
    overflow: 'hidden',
    marginVertical: 0,    // Removed margin to align with card design
    pointerEvents: 'none',  // Changed to allow parent Pressable to receive touches
  },
  video: {
    width: '100%',
    height: '100%',
  },
});