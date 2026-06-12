import { View, StyleSheet, Pressable, Modal, Dimensions, AppState, AppStateStatus } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import VideoSkeleton from 'components/skeletonScreens/VideoSkeleton';
import ScreenWrapper from 'components/ui/ScreenWrapper';

type Props = {
  video?: string | null;
  isReview?: boolean;
  context?: 'home' | 'profile';
  scrollY?: any;
  isScreenFocused?: boolean;
};

const IMAGES_BASE_URL = process.env.EXPO_PUBLIC_IMAGES_URL;
const HOME_PREVIEW_DURATION_MS = 7000;
const VISIBILITY_CHECK_INTERVAL_MS = 100;
const ACTIVATE_VISIBILITY_RATIO = 0.25;
const DEACTIVATE_VISIBILITY_RATIO = 0.1;
const loadedVideoUriCache = new Set<string>();

export default function VDOPromote({
  video,
  isReview,
  context = 'home',
  scrollY,
  isScreenFocused = true,
}: Props) {
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const [isAppActive, setIsAppActive] = useState(appState.current === 'active');

  const videoUri = video
    ? isReview
      ? video
      : `${IMAGES_BASE_URL}${video}`
    : null;
  const videoS = videoUri ? { uri: videoUri, useCaching: true as const } : null;

  const [showFullScreen, setShowFullScreen] = useState(false);
  const [isVisible, setIsVisible] = useState(false); // ← start FALSE, only play when measured visible
  const containerRef = useRef<View>(null);
  const scrollListenerRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);
  const previewLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const measureThrottleRef = useRef(0);
  const isVisibleRef = useRef(false); // ← start false to match state
  const isMountedRef = useRef(false);

  const player = useVideoPlayer(videoS, (p) => {
    p.muted = true;
    p.loop = false;
    p.keepScreenOnWhilePlaying = false;
    p.bufferOptions = {
      preferredForwardBufferDuration: 10,
      waitsToMinimizeStalling: true,
      minBufferForPlayback: 1,
      prioritizeTimeOverSizeThreshold: true,
    };
  });

  const [muted, setMuted] = useState(true);
  const prevMutedRef = useRef<boolean>(muted);
  const [isLoadingInline, setIsLoadingInline] = useState(
    () => !!videoUri && !loadedVideoUriCache.has(videoUri)
  );
  const [isLoadingFullscreen, setIsLoadingFullscreen] = useState(
    () => !!videoUri && !loadedVideoUriCache.has(videoUri)
  );

  useEffect(() => {
    const shouldShowLoading = !!videoUri && !loadedVideoUriCache.has(videoUri);
    setIsLoadingInline(shouldShowLoading);
    setIsLoadingFullscreen(shouldShowLoading);
  }, [videoUri]);

  const markVideoLoaded = () => {
    if (videoUri) loadedVideoUriCache.add(videoUri);
    setIsLoadingInline(false);
    setIsLoadingFullscreen(false);
  };

  // Sync muted state
  useEffect(() => {
    try {
      if (player) (player as any).muted = muted;
    } catch (e) {}
  }, [muted, player]);

  // AppState listener — pause when app goes background
  useEffect(() => {
    const handle = (nextAppState: AppStateStatus) => {
      appState.current = nextAppState;
      const nowActive = nextAppState === 'active';
      setIsAppActive(nowActive);
      if (!nowActive) {
        try { player.pause(); } catch (e) {}
      }
    };
    const sub = AppState.addEventListener('change', handle);
    return () => { sub?.remove(); };
  }, [player]);

  // ─── Visibility helpers ───────────────────────────────────────────────────

  const updateVisibilityState = useCallback((ratio: number) => {
    const previous = isVisibleRef.current;
    const next = previous
      ? ratio >= DEACTIVATE_VISIBILITY_RATIO   // hysteresis: harder to turn off
      : ratio >= ACTIVATE_VISIBILITY_RATIO;    // easier to turn on

    if (previous !== next) {
      isVisibleRef.current = next;
      setIsVisible(next);
    }
  }, []);

  const measureVisibility = useCallback(() => {
    if (!containerRef.current || !isMountedRef.current) return;

    const now = Date.now();
    if (now - measureThrottleRef.current < VISIBILITY_CHECK_INTERVAL_MS) return;
    measureThrottleRef.current = now;

    try {
      containerRef.current.measure(
        (_fx, _fy, _width, height, _pageX, pageY) => {
          if (!isMountedRef.current) return;
          const winH = Dimensions.get('window').height;

          if (pageY + height <= 0 || pageY >= winH) {
            updateVisibilityState(0);
            return;
          }

          const visibleTop = Math.max(0, pageY);
          const visibleBottom = Math.min(winH, pageY + height);
          const visibleHeight = Math.max(0, visibleBottom - visibleTop);
          const ratio = height > 0 ? visibleHeight / height : 0;
          updateVisibilityState(ratio);
        }
      );
    } catch (e) {}
  }, [updateVisibilityState]);

  // ─── scrollY listener — runs whenever scrollY or measureVisibility changes ─
  useEffect(() => {
    if (!scrollY || context !== 'profile') return;

    // Remove previous listener if any
    if (
      scrollListenerRef.current != null &&
      typeof scrollY.removeListener === 'function'
    ) {
      scrollY.removeListener(scrollListenerRef.current);
      scrollListenerRef.current = null;
    }

    if (typeof scrollY.addListener !== 'function') return;

    scrollListenerRef.current = scrollY.addListener(() => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(measureVisibility);
    });

    // Do an immediate measure after listener is attached
    // Delay slightly so containerRef has time to mount
    const initialTimer = setTimeout(measureVisibility, 150);

    return () => {
      clearTimeout(initialTimer);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (
        scrollListenerRef.current != null &&
        typeof scrollY.removeListener === 'function'
      ) {
        scrollY.removeListener(scrollListenerRef.current);
        scrollListenerRef.current = null;
      }
    };
  }, [scrollY, context, measureVisibility]);

  // ─── isFocused / isScreenFocused change → re-measure immediately ──────────
  useEffect(() => {
    if (!isScreenFocused) {
      // Screen lost focus — force invisible immediately
      isVisibleRef.current = false;
      setIsVisible(false);
    } else {
      // Screen regained focus — re-measure after short delay
      const t = setTimeout(measureVisibility, 200);
      return () => clearTimeout(t);
    }
  }, [isScreenFocused, measureVisibility]);

  // ─── Track mount state ────────────────────────────────────────────────────
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ─── Play / pause based on combined visibility state ─────────────────────
  useEffect(() => {
    if (!player || showFullScreen || !videoS) return;

    if (previewLoopRef.current) {
      clearInterval(previewLoopRef.current);
      previewLoopRef.current = null;
    }

    const shouldPlay = isVisible && isScreenFocused && isAppActive;

    if (shouldPlay) {
      if (context === 'home') {
        try { player.replay(); } catch (e) {}
        previewLoopRef.current = setInterval(() => {
          try { player.replay(); } catch (e) {}
        }, HOME_PREVIEW_DURATION_MS);
      } else {
        try { player.play(); } catch (e) {}
      }
    } else {
      try { player.pause(); } catch (e) {}
    }
  }, [isVisible, isScreenFocused, isAppActive, player, showFullScreen, context, videoS]);

  // ─── Cleanup on unmount ───────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (previewLoopRef.current) {
        clearInterval(previewLoopRef.current);
        previewLoopRef.current = null;
      }
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      try { player.pause(); } catch (e) {}
      try { (player as any)?.release?.(); } catch (e) {}
    };
  }, [player]);

  // ─── Fullscreen handlers ──────────────────────────────────────────────────

  const openFullScreen = () => {
    try {
      if (previewLoopRef.current) {
        clearInterval(previewLoopRef.current);
        previewLoopRef.current = null;
      }
      prevMutedRef.current = muted;

      let currentPosition = 0;
      try { currentPosition = (player as any)?.currentTime ?? 0; } catch (e) {}

      try { player.pause(); } catch {}

      setShowFullScreen(true);

      try {
        (player as any).loop = true;
        (player as any).currentTime = currentPosition;
        (player as any).muted = false;
        player.play();
      } catch (e) {
        console.log('Error starting fullscreen video:', e);
      }

      const shouldShowLoading = !!videoUri && !loadedVideoUriCache.has(videoUri);
      setIsLoadingFullscreen(shouldShowLoading);
    } catch (err) {
      console.log('openFullScreen error', err);
      setShowFullScreen(true);
      setIsLoadingFullscreen(false);
    }
  };

  const closeFullScreen = () => {
    try {
      let currentPosition = 0;
      try { currentPosition = (player as any)?.currentTime ?? 0; } catch (e) {}

      try { player.pause(); } catch {}

      setShowFullScreen(false);
      setIsLoadingFullscreen(false);

      try {
        (player as any).loop = false;
        setMuted(prevMutedRef.current);
        (player as any).currentTime = currentPosition;
      } catch (e) {}

      if (isVisible && isScreenFocused && isAppActive) {
        try { player.play(); } catch {}
      }
    } catch (err) {
      console.log('closeFullScreen error', err);
      setShowFullScreen(false);
    }
  };

  if (!videoS) return null;

  const containerStyle = context === 'home' ? styles.homeContainer : styles.profileContainer;
  const videoViewStyle = context === 'home' ? styles.homeVideo : styles.profileVideo;

  return (
    <>
      {context === 'profile' ? (
        <View
          ref={containerRef}
          style={containerStyle}
          // Re-measure when layout changes (e.g. content above shifts)
          onLayout={measureVisibility}
          collapsable={false}
        >
          {!showFullScreen && (
            <>
              <VideoView
                style={videoViewStyle}
                player={player}
                fullscreenOptions={{ enable: false }}
                allowsPictureInPicture={false}
                nativeControls={false}
                contentFit="cover"
                onFirstFrameRender={markVideoLoaded}
              />

              {isLoadingInline && (
                <View style={styles.skeletonOverlay}>
                  <VideoSkeleton />
                </View>
              )}

              <Pressable onPress={openFullScreen} style={styles.tapOverlay} />

              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  setMuted((prev) => !prev);
                }}
                style={styles.muteButton}
              >
                <Ionicons
                  name={muted ? 'volume-mute' : 'volume-high'}
                  size={18}
                  color="white"
                />
              </Pressable>
            </>
          )}
        </View>
      ) : (
        <View ref={containerRef} style={containerStyle} onLayout={measureVisibility} collapsable={false}>
          <VideoView
            style={videoViewStyle}
            player={player}
            fullscreenOptions={{ enable: false }}
            allowsPictureInPicture={false}
            nativeControls={false}
            contentFit="cover"
            onFirstFrameRender={markVideoLoaded}
          />

          {isLoadingInline && (
            <View style={styles.skeletonOverlay}>
              <VideoSkeleton />
            </View>
          )}
        </View>
      )}

      {context === 'profile' && (
        <Modal
          visible={showFullScreen}
          transparent={false}
          animationType="fade"
          statusBarTranslucent
          onRequestClose={closeFullScreen}
        >
          <ScreenWrapper safeEdges={['bottom', 'top']} style={styles.fullScreenContainer}>
            <Pressable
              style={styles.closeButton}
              onPress={closeFullScreen}
              className="mt-6"
            >
              <Ionicons name="close" size={28} color="white" />
            </Pressable>

            {isLoadingFullscreen && (
              <VideoSkeleton height={Dimensions.get('window').height} />
            )}

            <VideoView
              style={styles.fullScreenVideo}
              player={player}
              fullscreenOptions={{ enable: false }}
              allowsPictureInPicture={true}
              nativeControls={true}
              contentFit="contain"
              onFirstFrameRender={markVideoLoaded}
            />
          </ScreenWrapper>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  homeContainer: {
    width: '100%',
    height: 192,
    marginTop: 18,
    marginBottom: 18,
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
  tapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    backgroundColor: 'transparent',
  },
  muteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 20,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
  },
  skeletonOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
});