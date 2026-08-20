import {
  View,
  StyleSheet,
  Pressable,
  Modal,
  SafeAreaView,
  AppState,
  AppStateStatus,
  Image,
  Animated,
} from 'react-native';
import { createVideoPlayer, VideoView, VideoPlayer } from 'expo-video';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayback } from 'contexts/VideoPlaybackProvider';
import { useIsFocused } from '@react-navigation/native';

type Props = {
  video?: string | null;
  /** thumbnail image shown while video loads — ideally same frame as video start */
  poster?: string | null;
  context?: 'home' | 'profile';
  /** Maximum active card videos permitted by the containing screen. */
  maxActive?: 2 | 4;
  /**
   * Optional FlatList-driven visibility. When supplied, this avoids native
   * measureInWindow work on every scroll frame.
   */
  isVisible?: boolean;
  onPress?: () => void;
};

const IMAGES_BASE_URL = process.env.EXPO_PUBLIC_IMAGES_URL;
const HOME_PREVIEW_DURATION_MS = 3000;

// Module-level cache — persists across component mount/unmount cycles
const loadedVideoUriCache = new Set<string>();

// Gives every mounted card a stable unique id so the VideoPlaybackProvider can
// tell cards apart even when they share the same video URL.
let uidCounter = 0;

export default function VDOPromote_free_profile({
  video,
  poster,
  context = 'home',
  maxActive = 4,
  isVisible,
  onPress,
}: Props) {
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const [isAppActive, setIsAppActive] = useState(appState.current === 'active');

  // ── VideoPlaybackProvider integration (home feed only) ────────────────────
  const isHome = context === 'home';
  const containerRef = useRef<View>(null);
  const instanceId = useMemo(() => `vdo-instance-${++uidCounter}`, []);
  const { isActive: isActiveInFeed, register: registerVideo } = useVideoPlayback();
  const isFocused = useIsFocused();
  const usesListVisibility = typeof isVisible === 'boolean';
  const activeInFeed = usesListVisibility
    ? isVisible
    : isHome
      ? isActiveInFeed(instanceId)
      : false;

  const videoUri = video ? `${IMAGES_BASE_URL}${video}` : null;
  const posterUri = poster ? `${IMAGES_BASE_URL}${poster}` : null;

  // hasLoaded = video first frame has rendered (not just buffered)
  // const [hasLoaded, setHasLoaded] = useState(
  //   () => !!videoUri && loadedVideoUriCache.has(videoUri)
  // );
  // const videoOpacity = useRef(new Animated.Value(hasLoaded ? 1 : 0)).current;
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const videoOpacity = useRef(new Animated.Value(0)).current;
  // Fade-in animation for the VideoView — goes from 0→1 when first frame renders

  const previewLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const videoS = useMemo(
    () => (videoUri ? { uri: videoUri, useCaching: true as const } : null),
    [videoUri]
  );

  // Home cards register a "measure" callback so the provider can decide which
  // ≤2 cards (closest to the vertical screen center) should actually play.
  useEffect(() => {
    if (!isHome || !videoS || !isFocused || usesListVisibility) return;
        const measure: (cb: (rect: { top: number; bottom: number } | null) => void) => void = (
      cb
    ) => {
      const node = containerRef.current;
      if (!node) {
        cb(null);
        return;
      }
      // measureInWindow can report 0x0 on the very first pass because the
      // native layout isn't committed yet (mount / after navigation). Retry
      // exactly once on the next frame, after layout has flushed. This is what
      // makes the top card play reliably on initial render instead of only
      // after the user scrolls.
      let retried = false;
      const run = () => {
        node.measureInWindow((x, y, width, height) => {
          if (!width && !height) {
            if (!retried) {
              retried = true;
              requestAnimationFrame(run);
              return;
            }
            cb(null); // still not laid out — re-evaluate on next scroll
            return;
          }
          cb({ top: y, bottom: y + height });
        });
      };
      run();
    };
    return registerVideo(instanceId, measure, { maxActive });
    }, [isHome, videoS, registerVideo, instanceId, isFocused, maxActive, usesListVisibility]);

  // A native video decoder is expensive on both Android and iOS. Inactive
  // cards render their poster only; the native player exists solely while the
  // provider has selected this visible card for playback.
  const shouldCreatePlayer =
    !!videoS &&
    (context === 'profile' || (activeInFeed && isFocused) || showFullScreen);

  const [player, setPlayer] = useState<VideoPlayer | null>(null);

  useEffect(() => {
    if (!shouldCreatePlayer || !videoS) {
      setPlayer(null);
      return;
    }

    setHasLoaded(false);
    videoOpacity.setValue(0);
    const p = createVideoPlayer(videoS);
    p.muted = true; // always muted in home cards — unmute only in fullscreen
    p.loop = false;
    p.keepScreenOnWhilePlaying = false;
    p.bufferOptions = {
      // Short previews do not need a long decoded forward buffer.
      preferredForwardBufferDuration: 3,
      waitsToMinimizeStalling: true,
      minBufferForPlayback: 1,
      prioritizeTimeOverSizeThreshold: true,
    };

    setPlayer(p);

    return () => {
      try { p.pause(); } catch(e) {}
      // Delay release to allow React to unmount/update the native TextureVideoView first.
      // This bypasses the expo-video crash where SharedObjects are released during render.
      setTimeout(() => {
        try { p.release(); } catch(e) {}
      }, 0);
    };
  }, [shouldCreatePlayer, videoS]);

  // AppState — pause when app goes to background
  useEffect(() => {
    const handle = (next: AppStateStatus) => {
      appState.current = next;
      setIsAppActive(next === 'active');
    };
    const sub = AppState.addEventListener('change', handle);
    return () => sub?.remove();
  }, []);

  // Play/pause driven by activeInFeed (provider center selection) + app state
  useEffect(() => {
    if (!player) return;
    if (context === 'home') {
            if (activeInFeed && isAppActive && !showFullScreen && isFocused) {
        try { player.play(); } catch (e) { }
      } else {
        try { player.pause(); } catch (e) { }
      }
      return;
    }
    if (isAppActive) {
      try { player.play(); } catch (e) { }
    } else {
      try { player.pause(); } catch (e) { }
    }
    }, [player, context, activeInFeed, isAppActive, showFullScreen, isFocused]);

  // Preview loop — replay every N seconds while visible (home only)
  useEffect(() => {
    if (previewLoopRef.current) {
      clearInterval(previewLoopRef.current);
      previewLoopRef.current = null;
    }
        if (!videoS || !player || context !== 'home' || !activeInFeed || !isAppActive || showFullScreen || !isFocused) return;

    // Seek to beginning smoothly instead of hard replay
    const loop = () => {
      try {
        player.currentTime = 0;
        player.play();
      } catch (e) { }
    };

    previewLoopRef.current = setInterval(loop, HOME_PREVIEW_DURATION_MS);
    return () => {
      if (previewLoopRef.current) {
        clearInterval(previewLoopRef.current);
        previewLoopRef.current = null;
      }
    };
    }, [player, context, activeInFeed, isAppActive, showFullScreen, videoS, isFocused]);

  // Cleanup on unmount — pause only, never release()
  // NOTE: Do NOT call player.release() here — useVideoPlayer already handles
  // releasing the player when the component unmounts. Calling release()
  // manually causes "Cannot use shared object that was already released"
  // because the VideoView may still be mounted and referencing the player.
  useEffect(() => {
    return () => {
      if (previewLoopRef.current) clearInterval(previewLoopRef.current);
      if (player) {
        try {
          player.pause();
        } catch (e) { }
      }
    };
  }, [player]);

  const handleFirstFrame = () => {
    const seenBefore = videoUri ? loadedVideoUriCache.has(videoUri) : false;
    if (videoUri) loadedVideoUriCache.add(videoUri);
    setHasLoaded(true);
    Animated.timing(videoOpacity, {
      toValue: 1,
      duration: seenBefore ? 120 : 300, // fast fade if we've shown it before, but still wait for the real frame
      useNativeDriver: true,
    }).start();
  };

  if (!videoS) return null;

  // ─── Home context (grid card) ─────────────────────────────────────────────
  if (context === 'home') {
    return (
      <View ref={containerRef} collapsable={false} style={styles.homeContainer}>
        {/*
          Layer 1 (bottom): Poster / thumbnail image.
          Always rendered so there's never a black frame — the poster shows
          instantly while the video buffers. Once the video fades in (opacity=1)
          this poster is hidden behind it but still mounted (no layout shift).
        */}
        {posterUri ? (
          <Image
            source={{ uri: posterUri }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          // Placeholder gradient background while no poster is available
          <View style={[StyleSheet.absoluteFill, styles.posterFallback]} className='text-gray-100' />
        )}

        {/*
          Layer 2: VideoView fades in over the poster when first frame is ready.
          Using Animated.View wrapper because VideoView itself can't be animated directly.
        */}
        {player ? (
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: videoOpacity }]}>
            <VideoView
              key={`home-${player}`}
              style={StyleSheet.absoluteFill}
              player={player}
              surfaceType="textureView"
              fullscreenOptions={{ enable: false }}
              allowsPictureInPicture={false}
              nativeControls={false}
              contentFit="cover"
              onFirstFrameRender={handleFirstFrame}
            />
          </Animated.View>
        ) : null}

        {/*
          Layer 3: Muted indicator — small icon bottom-left so user knows
          the video is playing silently. Only show after video has loaded.
        */}
        {/* {hasLoaded && isVisible && (
          <View style={styles.mutedBadge}>
            <Ionicons name="volume-mute" size={12} color="white" />
          </View>
        )} */}

        {/*
          Layer 4 (top): Transparent Pressable overlay.
          Must be the LAST child so it sits above TextureView in Z-order.
          TextureView on Android intercepts touches at the native layer before
          RN's responder system — a parent Pressable never fires.
          This overlay catches the touch first and calls onPress (navigation).
        */}
        <Pressable
          onPress={onPress}
          style={StyleSheet.absoluteFill}
          android_ripple={null}
        />
      </View>
    );
  }

  // ─── Profile context (full-width with fullscreen modal) ──────────────────
  return (
    <>
      <Pressable onPress={() => setShowFullScreen(true)} style={{ flex: 1 }}>
        <View style={styles.profileContainer}>
          {posterUri && !hasLoaded && (
            <Image
              source={{ uri: posterUri }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          )}
          {player ? (
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: videoOpacity }]}>
              <VideoView
                key={`profile-${player}`}
                style={StyleSheet.absoluteFill}
                player={player}
                surfaceType="textureView"
                fullscreenOptions={{ enable: true }}
                allowsPictureInPicture={true}
                nativeControls={true}
                contentFit="cover"
                onFirstFrameRender={handleFirstFrame}
              />
            </Animated.View>
          ) : null}
        </View>
      </Pressable>

      <Modal visible={showFullScreen} transparent animationType="fade" statusBarTranslucent>
        <SafeAreaView style={styles.fullScreenContainer}>
          <Pressable style={styles.closeButton} onPress={() => setShowFullScreen(false)}>
            <Ionicons name="close" size={28} color="white" />
          </Pressable>
          {player ? (
            <VideoView
              key={`fullscreen-${player}`}
              style={styles.fullScreenVideo}
              player={player}
              surfaceType="surfaceView"
              fullscreenOptions={{ enable: true }}
              allowsPictureInPicture={true}
              nativeControls={true}
              contentFit="contain"
              onFirstFrameRender={handleFirstFrame}
            />
          ) : null}
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  homeContainer: {
    width: '100%',
    aspectRatio: 4 / 5,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  profileContainer: {
    width: '100%',
    aspectRatio: 4 / 5,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  posterFallback: {
    backgroundColor: '#f3f4f6',
  },
  mutedBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenVideo: { width: '100%', height: '100%' },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
});
