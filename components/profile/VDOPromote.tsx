import { View, StyleSheet, Pressable, Modal, SafeAreaView, Dimensions, Animated, AppState, AppStateStatus } from 'react-native';
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

export default function VDOPromote({ video, isReview, context = 'home', scrollY, isScreenFocused = true }: Props) {
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const [isAppActive, setIsAppActive] = useState(appState.current === 'active');
  
  const videoS = video
    ? { uri: isReview ? video : `${IMAGES_BASE_URL}${video}` }
    : null;

  const [showFullScreen, setShowFullScreen] = useState(false);
  const videoRefHome = useRef<VideoView>(null);
  const [isVisible, setIsVisible] = useState(true);
  const layoutRef = useRef<{ top: number; height: number } | null>(null);
  const containerRef = useRef<any>(null);
  const scrollListener = useRef<any>(null);
  const rafRef = useRef<number | null>(null);

  if (!videoS) return null;

  // Inline player with looping enabled
  const inlinePlayer = useVideoPlayer(videoS, (p) => {
    p.muted = true;
    p.loop = true;
    try { p.play(); } catch (e) {}
  });

  // Fullscreen player with looping enabled
  const fullPlayer = useVideoPlayer(videoS, (p) => {
    p.muted = false;
    p.loop = true;
  });

  const [muted, setMuted] = useState(true);
  const prevMutedRef = useRef<boolean>(muted);
  const [isLoadingInline, setIsLoadingInline] = useState(true);
  const [isLoadingFullscreen, setIsLoadingFullscreen] = useState(false);

  // Sync muted state and track loading
  useEffect(() => {
    try {
      // @ts-ignore
      if (inlinePlayer) inlinePlayer.muted = muted;
      // Set loading to false after a short delay (video should be buffered by then)
      const timer = setTimeout(() => setIsLoadingInline(false), 500);
      return () => clearTimeout(timer);
    } catch (e) {}
  }, [muted, inlinePlayer]);

  // AppState listener
  useEffect(() => {
    const handle = (nextAppState: AppStateStatus) => {
      appState.current = nextAppState;
      const nowActive = nextAppState === 'active';
      setIsAppActive(nowActive);

      try {
        if (!nowActive) {
          try { inlinePlayer.pause(); } catch (e) {}
        } else {
          if (isVisible && isScreenFocused) {
            try { inlinePlayer.play(); } catch (e) {}
          }
        }
      } catch (e) {}
    };

    const sub = AppState.addEventListener ? AppState.addEventListener('change', handle) : undefined;
    return () => { if (sub && typeof sub.remove === 'function') sub.remove(); };
  }, [inlinePlayer, isVisible, isScreenFocused]);
  
  // Visibility detection for profile context using measure() for accuracy
  useEffect(() => {
    if (!scrollY || !containerRef.current) return;

    const add = (scrollY as any).addListener;
    if (typeof add !== 'function') return;

    scrollListener.current = (scrollY as any).addListener(({ value }: { value: number }) => {
      // Use requestAnimationFrame throttling to check visibility
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      
      rafRef.current = requestAnimationFrame(() => {
        if (!containerRef.current) return;
        
        try {
          // Measure in window coordinates for accuracy
          containerRef.current.measure((fx: number, fy: number, width: number, height: number, pageX: number, pageY: number) => {
            const winH = Dimensions.get('window').height;
            
            // Check if video container intersects viewport
            const isInViewport = pageY + height > 0 && pageY < winH;
            
            if (!isInViewport) {
              if (isVisible) setIsVisible(false);
              return;
            }
            
            // Calculate visible ratio (threshold lowered to 15% for quicker response)
            const visibleTop = Math.max(0, pageY);
            const visibleBottom = Math.min(winH, pageY + height);
            const visibleHeight = Math.max(0, visibleBottom - visibleTop);
            const ratio = height > 0 ? visibleHeight / height : 0;
            
            const shouldBeVisible = ratio >= 0.15; // Lower threshold = responds quicker
            if (shouldBeVisible !== isVisible) setIsVisible(shouldBeVisible);
          });
        } catch (e) {}
      });
    });

    // Initial check using measure()
    try {
      const winH = Dimensions.get('window').height;
      if (containerRef.current) {
        containerRef.current.measure((fx: number, fy: number, width: number, height: number, pageX: number, pageY: number) => {
          const visibleTop = Math.max(0, pageY);
          const visibleBottom = Math.min(winH, pageY + height);
          const visibleHeight = Math.max(0, visibleBottom - visibleTop);
          const ratio = height > 0 ? visibleHeight / height : 0;
          setIsVisible(ratio >= 0.15);
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
  }, [scrollY, isVisible]);

  // Play/pause based on visibility - immediate stop when not visible
  useEffect(() => {
    if (!inlinePlayer || showFullScreen) return;
    
    if (isVisible && isScreenFocused && isAppActive) {
      try { inlinePlayer.play(); } catch (e) {}
    } else {
      // Stop immediately when not visible, not focused, or app backgrounded
      try { inlinePlayer.pause(); } catch (e) {}
    }
  }, [isVisible, isScreenFocused, isAppActive, inlinePlayer, showFullScreen]);

  const containerStyle = context === 'home' ? styles.homeContainer : styles.profileContainer;
  const videoViewStyle = context === 'home' ? styles.homeVideo : styles.profileVideo;

  // ✅ Optimized fullscreen opening - instant transition
  const openFullScreen = () => {
    try {
      // Save current state
      prevMutedRef.current = muted;
      
      // Pause inline immediately
      try { inlinePlayer.pause(); } catch {}
      
      // Get current playback position
      let currentPosition = 0;
      try { 
        // @ts-ignore
        currentPosition = inlinePlayer?.currentTime ?? 0; 
      } catch (e) {}
      
      // Open modal instantly
      setShowFullScreen(true);
      
      // Start fullscreen player immediately
      try {
        // @ts-ignore
        fullPlayer.currentTime = currentPosition;
        // @ts-ignore
        fullPlayer.muted = false;
        fullPlayer.play();
      } catch (e) {
        console.error('Error starting fullscreen video:', e);
      }
      
      // Show brief loading indicator only if needed
      setIsLoadingFullscreen(true);
      setTimeout(() => setIsLoadingFullscreen(false), 300);
      
    } catch (err) {
      console.error('openFullScreen error', err);
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
        currentPosition = fullPlayer?.currentTime ?? 0;
      } catch (e) {}
      
      // Pause fullscreen player
      try { fullPlayer.pause(); } catch {}
      
      // Close modal
      setShowFullScreen(false);
      setIsLoadingFullscreen(false);
      
      // Restore inline player state
      try { 
        setMuted(prevMutedRef.current);
        // @ts-ignore
        inlinePlayer.currentTime = currentPosition;
      } catch (e) {}
      
      // Resume inline playback if visible
      if (isVisible && isScreenFocused && isAppActive) {
        try { inlinePlayer.play(); } catch {}
      }
    } catch (err) {
      console.error('closeFullScreen error', err);
      setShowFullScreen(false);
    }
  };

  return (
    <>
      {context === 'profile' ? (
        <View 
          ref={containerRef} 
          style={containerStyle} 
          onLayout={(e) => {
            const { y, height } = e.nativeEvent.layout;
            layoutRef.current = { top: y, height };
          }}
        >
          {!showFullScreen && (
            <>
              {isLoadingInline && <VideoSkeleton />}
              {!isLoadingInline && (
                <VideoView
                  style={videoViewStyle}
                  player={inlinePlayer}
                  fullscreenOptions={{ enable: false }}
                  allowsPictureInPicture={false}
                  nativeControls={false}
                  contentFit="cover"
                />
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
          onLayout={(e) => {
            const { y, height } = e.nativeEvent.layout;
            layoutRef.current = { top: y, height };
          }}
        >
          <VideoView
            style={videoViewStyle}
            player={inlinePlayer}
            fullscreenOptions={{ enable: false }}
            allowsPictureInPicture={false}
            nativeControls={false}
            contentFit="cover"
          />
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
              player={fullPlayer}
              fullscreenOptions={{ enable: false }}
              allowsPictureInPicture={true}
              nativeControls={true}
              contentFit="contain"
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
});