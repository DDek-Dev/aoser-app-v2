import { View, StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

type Props = {
  video?: string | null,
  isReview?: boolean
}

const IMAGES_BASE_URL = process.env.EXPO_PUBLIC_IMAGES_URL;

export default function VDOPromote({ video, isReview }: Props) {
  // ------------------------------
  // 🧠 Decide which URI to use:
  // - If isReview → local URI
  // - Else → remote server URL
  // ------------------------------
  const videoS = video
    ? { uri: isReview ? video : `${IMAGES_BASE_URL}${video}` }
    : null;

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
        allowsPictureInPicture={false}
        nativeControls={false}
        contentFit="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 192,
    marginTop: 18,
    marginBottom: 18,
    borderRadius: 0,
    overflow: 'hidden',
    marginVertical: 0,
    pointerEvents: 'none',
  },
  video: {
    width: '100%',
    height: '100%',
  },
});
