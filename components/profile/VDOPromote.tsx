import { View, StyleSheet, Pressable, Modal, Dimensions, AppState, AppStateStatus } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useState, useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import VideoSkeleton from 'components/skeletonScreens/VideoSkeleton';
import ScreenWrapper from 'components/ui/ScreenWrapper';

type Props = {
  video?: string | null,
  isReview?: boolean,
  context?: 'home' | 'profile';
  scrollY?: any;
  isScreenFocused?: boolean;
}

const IMAGES_BASE_URL = process.env.EXPO_PUBLIC_IMAGES_URL;
const HOME_PREVIEW_DURATION_MS = 7000;
const VISIBILITY_CHECK_INTERVAL_MS = 120;
const ACTIVATE_VISIBILITY_RATIO = 0.25;
const DEACTIVATE_VISIBILITY_RATIO = 0.1;
const loadedVideoUriCache = new Set<string>();

export default function VDOPromote({ video, isReview, context = 'home', scrollY, isScreenFocused = true }: Props) {
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const [isAppActive, setIsAppActive] = useState(appState.current === 'active');
  
  const videoUri = video ? (isReview ? video : `${IMAGES_BASE_URL}${video}`) : null;
  const videoS = videoUri ? { uri: videoUri, useCaching: true as const } : null;
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const containerRef = useRef<any>(null);
  const scrollListener = useRef<any>(null);
  const rafRef = useRef<number | null>(null);
  const previewLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const measureThrottleRef = useRef(0);
  const isVisibleRef = useRef(true);

  // Single shared player (inline + fullscreen) to avoid double decoder allocation.
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
  const [isLoadingInline, setIsLoadingInline] = useState(() => !!videoUri && !loadedVideoUriCache.has(videoUri));
  const [isLoadingFullscreen, setIsLoadingFullscreen] = useState(() => !!videoUri && !loadedVideoUriCache.has(videoUri));

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

  // Sync muted state only.
  useEffect(() => {
    try {
      // @ts-ignore
      if (player) player.muted = muted;
    } catch (e) {}
  }, [muted, player]);

  // AppState listener
  useEffect(() => {
    const handle = (nextAppState: AppStateStatus) => {
      appState.current = nextAppState;
      const nowActive = nextAppState === 'active';
      setIsAppActive(nowActive);
      if (!nowActive) {
        try { player.pause(); } catch (e) {}
      }
    };

    const sub = AppState.addEventListener ? AppState.addEventListener('change', handle) : undefined;
    return () => { if (sub && typeof sub.remove === 'function') sub.remove(); };
  }, [player]);
  
  const updateVisibilityState = (ratio: number) => {
    const previous = isVisibleRef.current;
    const next = previous
      ? ratio >= DEACTIVATE_VISIBILITY_RATIO
      : ratio >= ACTIVATE_VISIBILITY_RATIO;

    if (previous !== next) {
      isVisibleRef.current = next;
      setIsVisible(next);
    }
  };

  // Visibility detection for profile context using measure() with throttling and hysteresis.
  useEffect(() => {
    if (!scrollY || !containerRef.current) return;

    const add = (scrollY as any).addListener;
    if (typeof add !== 'function') return;

    scrollListener.current = (scrollY as any).addListener(() => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      rafRef.current = requestAnimationFrame(() => {
        if (!containerRef.current) return;

        const now = Date.now();
        if (now - measureThrottleRef.current < VISIBILITY_CHECK_INTERVAL_MS) return;
        measureThrottleRef.current = now;

        try {
          containerRef.current.measure((fx: number, fy: number, width: number, height: number, pageX: number, pageY: number) => {
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
          });
        } catch (e) {}
      });
    });

    try {
      const winH = Dimensions.get('window').height;
      if (containerRef.current) {
        containerRef.current.measure((fx: number, fy: number, width: number, height: number, pageX: number, pageY: number) => {
          const visibleTop = Math.max(0, pageY);
          const visibleBottom = Math.min(winH, pageY + height);
          const visibleHeight = Math.max(0, visibleBottom - visibleTop);
          const ratio = height > 0 ? visibleHeight / height : 0;
          updateVisibilityState(ratio);
        });
      }
    } catch (e) {}

    return () => {
      try {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        if (scrollListener.current && typeof (scrollY as any).removeListener === 'function')
          (scrollY as any).removeListener(scrollListener.current);
      } catch (e) {}
    };
  }, [scrollY]);

  // Play/pause based on visibility. Home context restarts every 7 seconds.
  useEffect(() => {
    if (!player || showFullScreen || !videoS) return;

    if (previewLoopRef.current) {
      clearInterval(previewLoopRef.current);
      previewLoopRef.current = null;
    }
    
    if (isVisible && isScreenFocused && isAppActive) {
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

  // Ensure native decoder resources are released when component unmounts.
  useEffect(() => {
    return () => {
      if (previewLoopRef.current) {
        clearInterval(previewLoopRef.current);
        previewLoopRef.current = null;
      }
      try { player.pause(); } catch (e) {}
      try { (player as any)?.release?.(); } catch (e) {}
    };
  }, [player]);

  const containerStyle = context === 'home' ? styles.homeContainer : styles.profileContainer;
  const videoViewStyle = context === 'home' ? styles.homeVideo : styles.profileVideo;

  // Optimized fullscreen opening - instant transition
  const openFullScreen = () => {
    try {
      if (previewLoopRef.current) {
        clearInterval(previewLoopRef.current);
        previewLoopRef.current = null;
      }

      // Save current state
      prevMutedRef.current = muted;
      
      // Pause player immediately
      try { player.pause(); } catch {}
      
      // Get current playback position
      let currentPosition = 0;
      try { 
        // @ts-ignore
        currentPosition = player?.currentTime ?? 0; 
      } catch (e) {}
      
      // Open modal instantly
      setShowFullScreen(true);
      
      // Start fullscreen immediately
      try {
        // @ts-ignore
        player.loop = true;
        // @ts-ignore
        player.currentTime = currentPosition;
        // @ts-ignore
        player.muted = false;
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
      // Get current position before closing
      let currentPosition = 0;
      try {
        // @ts-ignore
        currentPosition = player?.currentTime ?? 0;
      } catch (e) {}
      
      // Pause player
      try { player.pause(); } catch {}
      
      // Close modal
      setShowFullScreen(false);
      setIsLoadingFullscreen(false);
      
      // Restore inline player state
      try { 
        // @ts-ignore
        player.loop = false;
        setMuted(prevMutedRef.current);
        // @ts-ignore
        player.currentTime = currentPosition;
      } catch (e) {}
      
      // Resume inline playback if visible
      if (isVisible && isScreenFocused && isAppActive) {
        try { player.play(); } catch {}
      }

      setIsLoadingFullscreen(false);
    } catch (err) {
      console.log('closeFullScreen error', err);
      setShowFullScreen(false);
    }
  };

  if (!videoS) return null;

  return (
    <>
      {context === 'profile' ? (
        <View 
          ref={containerRef} 
          style={containerStyle}
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

              {/* Transparent overlay to capture taps for fullscreen */}
              <Pressable
                onPress={openFullScreen}
                style={styles.tapOverlay}
              />

              {/* Mute toggle overlay */}
              <Pressable
                onPress={(e) => { 
                  e.stopPropagation(); 
                  setMuted(prev => !prev); 
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
        <View 
          ref={containerRef} 
          style={containerStyle}
        >
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

      {/* Full Screen Modal */}
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
              className='mt-6'
            >
              <Ionicons name="close" size={28} color="white" />
            </Pressable>
            
            {isLoadingFullscreen && <VideoSkeleton height={Dimensions.get('window').height} />}
            
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
