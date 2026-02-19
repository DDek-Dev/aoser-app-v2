import { View, StyleSheet, Pressable, Modal, SafeAreaView, Dimensions, AppState, AppStateStatus } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useState, useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import VideoSkeleton from 'components/skeletonScreens/VideoSkeleton';

type Props = {
  video?: string | null;
  context?: 'home' | 'profile'; // 'home' for preview, 'profile' for full view
  scrollY?: any;
}

const IMAGES_BASE_URL = process.env.EXPO_PUBLIC_IMAGES_URL;

export default function VDOPromote_free_profile({ video, context = 'home', scrollY }: Props) {
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const [isAppActive, setIsAppActive] = useState(appState.current === 'active');

  const videoS = video ? { uri: `${IMAGES_BASE_URL}${video}` } : null;
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const loopTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isActive, setIsActive] = useState(false);
  const layoutRef = useRef<{ top: number; height: number } | null>(null);
  const containerRef = useRef<any>(null);
  const scrollListener = useRef<any>(null);

  if (!videoS) return null;

  // Single player for this component
  const player = useVideoPlayer(videoS, (p) => {
    if (context === 'home') {
      p.muted = true;
      if (isActive && isAppActive) p.play();
    } else {
      p.muted = false;
      p.play();
    }
    // Set loading to false after player is ready
    setTimeout(() => setIsLoading(false), 600);
  });

  // 7-second continuous loop when active (home context)
  useEffect(() => {
    if (context !== 'home' || !player) return;

    // clear existing timer
    if (loopTimerRef.current) {
      try { clearInterval(loopTimerRef.current as any); } catch (e) {}
      loopTimerRef.current = null;
    }

    if (isActive && isAppActive) {
      try {
        // seek to start and play
        // @ts-ignore
        player.currentTime = 0;
        player.play();
      } catch (e) {}

      loopTimerRef.current = setInterval(() => {
        try {
          if (!isAppActive) return;
          // @ts-ignore
          player.currentTime = 0;
          player.play();
        } catch (err) {
          console.error('Error resetting home preview video:', err);
        }
      }, 7000) as unknown as NodeJS.Timeout;
    } else {
      try { player.pause(); } catch (e) {}
      if (loopTimerRef.current) {
        try { clearInterval(loopTimerRef.current as any); } catch (e) {}
        loopTimerRef.current = null;
      }
    }

    return () => {
      if (loopTimerRef.current) {
        try { clearInterval(loopTimerRef.current as any); } catch (e) {}
        loopTimerRef.current = null;
      }
    };
  }, [context, player, isActive, isAppActive]);

  // AppState listener to pause/resume playback
  useEffect(() => {
    const handle = (nextAppState: AppStateStatus) => {
      appState.current = nextAppState;
      const nowActive = nextAppState === 'active';
      setIsAppActive(nowActive);

      try {
        if (!nowActive) {
          try { player.pause(); } catch (e) {}
          if (loopTimerRef.current) { try { clearInterval(loopTimerRef.current as any); } catch (e) {} loopTimerRef.current = null; }
        } else {
          if (isActive && context === 'home') {
            try {
              // @ts-ignore
              player.currentTime = 0;
              player.play();
            } catch (e) {}
          }
        }
      } catch (e) {}
    };

    const sub = AppState.addEventListener ? AppState.addEventListener('change', handle) : undefined;
    return () => { if (sub && typeof sub.remove === 'function') sub.remove(); };
  }, [player, isActive, context]);

  // Visibility detection using measure() + scrollY
  useEffect(() => {
    if (!scrollY || !containerRef.current) return;

    const add = (scrollY as any).addListener;
    if (typeof add !== 'function') {
      setIsActive(false);
      return;
    }

    // Use measure(pageY) on each scroll tick (throttled via rAF) so visibility is relative to window
    let rafId: number | null = null;
    scrollListener.current = (scrollY as any).addListener(() => {
      if (rafId !== null) return; // already scheduled
      rafId = requestAnimationFrame(() => {
        rafId = null;
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
            const shouldBeActive = ratio >= 0.3;
            if (shouldBeActive !== isActive) setIsActive(shouldBeActive);
          });
        } catch (e) {
          setIsActive(false);
        }
      });
    });

    // initial measure to set state
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
        setIsActive(ratio >= 0.3);
      });
    } catch (e) {}

    return () => {
      try { if (scrollListener.current && typeof (scrollY as any).removeListener === 'function') (scrollY as any).removeListener(scrollListener.current); } catch (e) {}
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [scrollY, isActive]);

  const containerStyle = context === 'home' ? styles.homeContainer : styles.profileContainer;
  const videoViewStyle = context === 'home' ? styles.homeVideo : styles.profileVideo;

  return (
    <>
      {context === 'profile' ? (
        <Pressable
          onPress={() => setShowFullScreen(true)}
          style={{ flex: 1 }}
        >
          <View ref={containerRef} style={containerStyle} onLayout={(e) => {
            const { y, height } = e.nativeEvent.layout;
            layoutRef.current = { top: y, height };

            // initial visibility check using content-relative y
            try {
              const val = typeof (scrollY as any).__getValue === 'function' ? (scrollY as any).__getValue() : 0;
              const winH = Dimensions.get('window').height;
              const top = y;
              const bottom = top + height;
              const viewportTop = val;
              const viewportBottom = val + winH;
              const visibleTop = Math.max(top, viewportTop);
              const visibleBottom = Math.min(bottom, viewportBottom);
              const visibleHeight = Math.max(0, visibleBottom - visibleTop);
              const ratio = height > 0 ? visibleHeight / height : 0;
              setIsActive(ratio >= 0.3);
            } catch (err) {
              // ignore
            }
          }}>
            {isLoading && <VideoSkeleton />}
            {!isLoading && (
              <VideoView
                style={videoViewStyle}
                player={player}
                fullscreenOptions={{ enable: true }}
                allowsPictureInPicture={true}
                nativeControls={true}
                contentFit="cover"
              />
            )}
          </View>
        </Pressable>
      ) : (
        <View ref={containerRef} style={containerStyle} onLayout={(e) => {
          const { y, height } = e.nativeEvent.layout;
          layoutRef.current = { top: y, height };
          try {
            const val = typeof (scrollY as any).__getValue === 'function' ? (scrollY as any).__getValue() : 0;
            const winH = Dimensions.get('window').height;
            const top = y;
            const bottom = top + height;
            const viewportTop = val;
            const viewportBottom = val + winH;
            const visibleTop = Math.max(top, viewportTop);
            const visibleBottom = Math.min(bottom, viewportBottom);
            const visibleHeight = Math.max(0, visibleBottom - visibleTop);
            const ratio = height > 0 ? visibleHeight / height : 0;
            setIsActive(ratio >= 0.3);
          } catch (err) {
            // ignore
          }
        }}>
          {isLoading && <VideoSkeleton aspectRatio={4 / 5} />}
          {!isLoading && (
            <VideoView
              style={videoViewStyle}
              player={player}
              fullscreenOptions={{ enable: false }}
              allowsPictureInPicture={false}
              nativeControls={false}
              contentFit="cover"
            />
          )}
        </View>
      )}

      {/* Full Screen Modal for Profile */}
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
            
            {isLoading && <VideoSkeleton height={Dimensions.get('window').height} />}
            {!isLoading && (
              <VideoView
                style={styles.fullScreenVideo}
                player={player}
                fullscreenOptions={{ enable: true }}
                allowsPictureInPicture={true}
                nativeControls={true}
                contentFit="contain"
              />
            )}
          </SafeAreaView>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  // Home preview styles - 4:5 aspect ratio
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

  // Profile view styles - 4:5 aspect ratio
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

  // Full screen modal styles
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
});
