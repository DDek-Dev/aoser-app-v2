import { View, StyleSheet, Pressable, Modal, SafeAreaView, Dimensions, AppState, AppStateStatus } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useState, useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import VideoSkeleton from 'components/skeletonScreens/VideoSkeleton';

type Props = {
  video?: string | null;
  context?: 'home' | 'profile';
  scrollY?: any;
};

const IMAGES_BASE_URL = process.env.EXPO_PUBLIC_IMAGES_URL;
const HOME_PREVIEW_DURATION_MS = 7000;
const VISIBILITY_CHECK_INTERVAL_MS = 120;
const ACTIVATE_VISIBILITY_RATIO = 0.55;
const DEACTIVATE_VISIBILITY_RATIO = 0.2;
const loadedVideoUriCache = new Set<string>();

export default function VDOPromote_free_profile({ video, context = 'home', scrollY }: Props) {
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const [isAppActive, setIsAppActive] = useState(appState.current === 'active');
  const videoUri = video ? `${IMAGES_BASE_URL}${video}` : null;
  const [isLoading, setIsLoading] = useState(() => !!videoUri && !loadedVideoUriCache.has(videoUri));
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const layoutRef = useRef<{ top: number; height: number } | null>(null);
  const containerRef = useRef<any>(null);
  const scrollListener = useRef<any>(null);
  const previewLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const measureThrottleRef = useRef(0);
  const isActiveRef = useRef(false);

  const videoS = videoUri ? { uri: videoUri, useCaching: true as const } : null;

  const player = useVideoPlayer(videoS, (p) => {
    if (context === 'home') {
      p.muted = true;
      p.loop = false;
    } else {
      p.muted = false;
      p.loop = false;
    }
    p.keepScreenOnWhilePlaying = false;
    p.bufferOptions = {
      preferredForwardBufferDuration: 10,
      waitsToMinimizeStalling: true,
      minBufferForPlayback: 1,
      prioritizeTimeOverSizeThreshold: true,
    };
  });

  useEffect(() => {
    const shouldShowLoading = !!videoUri && !loadedVideoUriCache.has(videoUri);
    setIsLoading(shouldShowLoading);
  }, [videoUri]);

  const markVideoLoaded = () => {
    if (videoUri) loadedVideoUriCache.add(videoUri);
    setIsLoading(false);
  };

  useEffect(() => {
    const handle = (nextAppState: AppStateStatus) => {
      appState.current = nextAppState;
      setIsAppActive(nextAppState === 'active');
    };

    const sub = AppState.addEventListener ? AppState.addEventListener('change', handle) : undefined;
    return () => {
      if (sub && typeof sub.remove === 'function') sub.remove();
    };
  }, []);

  useEffect(() => {
    if (!player) return;

    if (context === 'home') {
      if (isActive && isAppActive && !isLoading && !showFullScreen) {
        try { player.play(); } catch (e) {}
      } else {
        try { player.pause(); } catch (e) {}
      }
      return;
    }

    if (isAppActive) {
      try { player.play(); } catch (e) {}
    } else {
      try { player.pause(); } catch (e) {}
    }
  }, [player, context, isActive, isAppActive, isLoading, showFullScreen]);

  useEffect(() => {
    if (previewLoopRef.current) {
      clearInterval(previewLoopRef.current);
      previewLoopRef.current = null;
    }

    if (!videoS || context !== 'home' || !isActive || !isAppActive || isLoading || showFullScreen) return;

    try { player.replay(); } catch (e) {}

    previewLoopRef.current = setInterval(() => {
      try { player.replay(); } catch (e) {}
    }, HOME_PREVIEW_DURATION_MS);

    return () => {
      if (previewLoopRef.current) {
        clearInterval(previewLoopRef.current);
        previewLoopRef.current = null;
      }
    };
  }, [player, context, isActive, isAppActive, isLoading, showFullScreen, videoS]);

  const updateActiveState = (ratio: number) => {
    const previous = isActiveRef.current;
    const next = previous
      ? ratio >= DEACTIVATE_VISIBILITY_RATIO
      : ratio >= ACTIVATE_VISIBILITY_RATIO;

    if (previous !== next) {
      isActiveRef.current = next;
      setIsActive(next);
    }
  };

  useEffect(() => {
    if (!scrollY || !containerRef.current) return;
    const add = (scrollY as any).addListener;
    if (typeof add !== 'function') {
      isActiveRef.current = false;
      setIsActive(false);
      return;
    }

    let rafId: number | null = null;
    scrollListener.current = (scrollY as any).addListener(() => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;

        const now = Date.now();
        if (now - measureThrottleRef.current < VISIBILITY_CHECK_INTERVAL_MS) return;
        measureThrottleRef.current = now;

        try {
          containerRef.current?.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
            const winH = Dimensions.get('window').height;
            const top = pageY || 0;
            const h = height || (layoutRef.current?.height ?? 0);
            const bottom = top + h;
            const visibleTop = Math.max(top, 0);
            const visibleBottom = Math.min(bottom, winH);
            const visibleHeight = Math.max(0, visibleBottom - visibleTop);
            const ratio = h > 0 ? visibleHeight / h : 0;
            updateActiveState(ratio);
          });
        } catch (e) {
          isActiveRef.current = false;
          setIsActive(false);
        }
      });
    });

    try {
      containerRef.current?.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
        const winH = Dimensions.get('window').height;
        const top = pageY || 0;
        const h = height || (layoutRef.current?.height ?? 0);
        const bottom = top + h;
        const visibleTop = Math.max(top, 0);
        const visibleBottom = Math.min(bottom, winH);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);
        const ratio = h > 0 ? visibleHeight / h : 0;
        updateActiveState(ratio);
      });
    } catch (e) {}

    return () => {
      try {
        if (scrollListener.current && typeof (scrollY as any).removeListener === 'function') {
          (scrollY as any).removeListener(scrollListener.current);
        }
      } catch (e) {}
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [scrollY]);

  useEffect(() => {
    return () => {
      if (previewLoopRef.current) {
        clearInterval(previewLoopRef.current);
        previewLoopRef.current = null;
      }
      try { player.pause(); } catch (e) {}
    };
  }, [player]);

  const containerStyle = context === 'home' ? styles.homeContainer : styles.profileContainer;
  const videoViewStyle = context === 'home' ? styles.homeVideo : styles.profileVideo;

  if (!videoS) return null;

  return (
    <>
      {context === 'profile' ? (
        <Pressable onPress={() => setShowFullScreen(true)} style={{ flex: 1 }}>
          <View
            ref={containerRef}
            style={containerStyle}
            onLayout={(e) => {
              const { y, height } = e.nativeEvent.layout;
              layoutRef.current = { top: y, height };
            }}
          >
            <VideoView
              style={videoViewStyle}
              player={player}
              surfaceType="textureView"
              fullscreenOptions={{ enable: true }}
              allowsPictureInPicture={true}
              nativeControls={true}
              contentFit="cover"
              onFirstFrameRender={markVideoLoaded}
            />

            {isLoading && (
              <View style={styles.skeletonOverlay}>
                <VideoSkeleton />
              </View>
            )}
          </View>
        </Pressable>
      ) : (
        <View
          ref={containerRef}
          style={containerStyle}
          onLayout={(e) => {
            const { y, height } = e.nativeEvent.layout;
            layoutRef.current = { top: y, height };
          }}
        >
          <VideoView
            style={videoViewStyle}
            player={player}
            surfaceType="textureView"
            fullscreenOptions={{ enable: false }}
            allowsPictureInPicture={false}
            nativeControls={false}
            contentFit="cover"
            onFirstFrameRender={markVideoLoaded}
          />

          {isLoading && (
            <View style={styles.skeletonOverlay}>
              <VideoSkeleton aspectRatio={4 / 5} />
            </View>
          )}
        </View>
      )}

      {context === 'profile' && (
        <Modal
          visible={showFullScreen}
          transparent
          animationType="fade"
          statusBarTranslucent
        >
          <SafeAreaView style={styles.fullScreenContainer}>
            <Pressable
              style={styles.closeButton}
              onPress={() => setShowFullScreen(false)}
            >
              <Ionicons name="close" size={28} color="white" />
            </Pressable>

            <VideoView
              style={styles.fullScreenVideo}
              player={player}
              surfaceType="textureView"
              fullscreenOptions={{ enable: true }}
              allowsPictureInPicture={true}
              nativeControls={true}
              contentFit="contain"
              onFirstFrameRender={markVideoLoaded}
            />

            {isLoading && (
              <View style={styles.skeletonOverlay}>
                <VideoSkeleton height={Dimensions.get('window').height} />
              </View>
            )}
          </SafeAreaView>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  homeContainer: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: 0,
    overflow: 'hidden',
    marginVertical: 0,
    pointerEvents: 'none',
  },
  homeVideo: {
    width: '100%',
    height: '100%',
  },
  profileContainer: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: 0,
    overflow: 'hidden',
    marginVertical: 0,
  },
  profileVideo: {
    width: '100%',
    height: '100%',
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenVideo: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  skeletonOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
});
