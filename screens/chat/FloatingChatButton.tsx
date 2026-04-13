// components/ui/FloatingChatButton.tsx
import React, { useRef, useEffect, useState } from 'react';
import { 
  TouchableOpacity, 
  View, 
  Text,
  StyleSheet, 
  Animated, 
  Dimensions,
  StatusBar,
  Platform 
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useChats, useUnreadChatCount } from 'hooks/useChat';
import { useAuth } from 'hooks/useAuth';
import SocketService from 'service/soctketService';
import { useQueryClient } from '@tanstack/react-query';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BUTTON_SIZE = 60;
const EDGE_MARGIN = 8;
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 104 : StatusBar.currentHeight || 24;
const BOTTOM_SAFE_AREA = Platform.OS === 'ios' ? 104 : 120;

const FloatingChatButton = ({ onPress }: { onPress: () => void }) => {
  // Start at bottom right with 164px margin from bottom
  const initialY = SCREEN_HEIGHT - BUTTON_SIZE - BOTTOM_SAFE_AREA;
  const initialX = SCREEN_WIDTH - BUTTON_SIZE - EDGE_MARGIN;
  
  const [edgePosition, setEdgePosition] = useState<'left' | 'right'>('right');
  const [yPosition, setYPosition] = useState(initialY);
  
  const translateX = useRef(new Animated.Value(initialX)).current;
  const translateY = useRef(new Animated.Value(initialY)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;
  
  const [isDragging, setIsDragging] = useState(false);
  const fadeTimeoutRef = useRef<any>(null);
  const pressLockRef = useRef(false);
  
  // Keep track of gesture
  const gestureStart = useRef({ x: 0, y: 0 });
  const currentPosition = useRef({ x: initialX, y: initialY });

  const { user } = useAuth();
  const userId = user?._id || '';
  const hasUser = !!userId;
  const queryClient = useQueryClient();
  const unreadCountQuery = useUnreadChatCount(userId);
  const { data: chats = [] } = useChats({ enabled: hasUser });
  const unreadTotal = Number(unreadCountQuery.data?.totalChatUnread || 0);
  // Auto-fade functionality
  const resetFadeTimer = () => {
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
    }
    
    Animated.timing(opacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    fadeTimeoutRef.current = setTimeout(() => {
      if (!isDragging) {
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }
    }, 3000);
  };

  const cancelFadeTimer = () => {
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
    }
    
    Animated.timing(opacity, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    if (!hasUser) return;
    resetFadeTimer();
    return () => {
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, [hasUser]);

  // Calculate edge positions
  const getEdgePosition = (side: 'left' | 'right', y: number) => {
    const x = side === 'left' ? EDGE_MARGIN : SCREEN_WIDTH - BUTTON_SIZE - EDGE_MARGIN;
    
    // Constrain Y within safe bounds
    const minY = STATUS_BAR_HEIGHT + 20;
    const maxY = SCREEN_HEIGHT - BUTTON_SIZE - BOTTOM_SAFE_AREA - 20;
    const constrainedY = Math.max(minY, Math.min(maxY, y));
    
    return { x, y: constrainedY };
  };

  const snapToNearestEdge = (currentX: number, currentY: number) => {
    // Determine which edge is closer
    const screenCenter = SCREEN_WIDTH / 2;
    const targetEdge: 'left' | 'right' = currentX < screenCenter ? 'left' : 'right';
    const targetPosition = getEdgePosition(targetEdge, currentY);
    
    // Update state
    setEdgePosition(targetEdge);
    setYPosition(targetPosition.y);
    currentPosition.current = targetPosition;

    // Animate to edge with spring effect
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: targetPosition.x,
        useNativeDriver: true,
        tension: 120,
        friction: 8,
        velocity: 0,
      }),
      Animated.spring(translateY, {
        toValue: targetPosition.y,
        useNativeDriver: true,
        tension: 120,
        friction: 8,
        velocity: 0,
      }),
    ]).start();
  };

  const handleMainPress = () => {
    if (!hasUser) return;
    if (pressLockRef.current) return;
    pressLockRef.current = true;
    setTimeout(() => {
      pressLockRef.current = false;
    }, 250);

    const unreadConversations = chats.filter((chat: any) => (chat?.unreadCount || 0) > 0);
    if (SocketService.isConnected() && unreadConversations.length > 0) {
      unreadConversations.forEach((chat: any) => {
        if (chat?._id) {
          SocketService.markMessagesAsRead(chat._id);
        }
      });
    }

    // Optimistic badge clear, then backend/query sync follows in chat screens/socket events.
    queryClient.setQueryData(['unreadchatCount', userId], { totalChatUnread: 0 });
    queryClient.invalidateQueries({ queryKey: ['chats'] });
    onPress();
  };

  if (!hasUser) return null;

  const onGestureEvent = (event: any) => {
    const { translationX, translationY, state } = event.nativeEvent;
    
    if (state === State.ACTIVE && isDragging) {
      // Calculate new position during drag
      const newX = gestureStart.current.x + translationX;
      const newY = gestureStart.current.y + translationY;
      
      // Allow movement anywhere on screen during drag
      const boundedX = Math.max(-BUTTON_SIZE/2, Math.min(SCREEN_WIDTH - BUTTON_SIZE/2, newX));
      const boundedY = Math.max(STATUS_BAR_HEIGHT, Math.min(SCREEN_HEIGHT - BUTTON_SIZE - BOTTOM_SAFE_AREA, newY));
      
      // Update position smoothly
      Animated.timing(translateX, {
        toValue: boundedX,
        duration: 0,
        useNativeDriver: true,
      }).start();
      
      Animated.timing(translateY, {
        toValue: boundedY,
        duration: 0,
        useNativeDriver: true,
      }).start();
    }
  };

  const onHandlerStateChange = (event: any) => {
    const { state, translationX, translationY } = event.nativeEvent;
    
    if (state === State.BEGAN) {
      setIsDragging(true);
      gestureStart.current = { ...currentPosition.current };
      cancelFadeTimer();
      
      // Subtle scale feedback
      Animated.spring(scale, {
        toValue: 1.1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();
      
    } else if (state === State.ACTIVE) {
      cancelFadeTimer();
      
    } else if (state === State.END || state === State.CANCELLED) {
      setIsDragging(false);
      
      // Scale back to normal
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();
      
      // Calculate final position
      const finalX = gestureStart.current.x + translationX;
      const finalY = gestureStart.current.y + translationY;
      const dragDistance = Math.sqrt(translationX * translationX + translationY * translationY);
      
      if (dragDistance < 10) {
        // It was a tap - trigger onPress and stay in place
        handleMainPress();
        resetFadeTimer();
      } else {
        // It was a drag - snap to nearest edge
        snapToNearestEdge(finalX, finalY);
        resetFadeTimer();
      }
    }
  };

  return (
    <PanGestureHandler
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
      activeOffsetX={[-10, 10]} // Increased threshold for better tap detection
      activeOffsetY={[-10, 10]}
    >
      <Animated.View
        style={[
          styles.container,
          {
            transform: [
              { translateX },
              { translateY },
              { scale },
            ],
            opacity,
          },
        ]}
      >
        {/* Enhanced shadow with multiple layers for depth */}
        <View style={styles.shadowContainer}>
          <View style={[styles.shadowLayer, styles.shadowLayer1]} />
          <View style={[styles.shadowLayer, styles.shadowLayer2]} />
          <View style={[styles.shadowLayer, styles.shadowLayer3]} />
        </View>
        
        {/* Main button with premium styling */}
        <TouchableOpacity 
          style={styles.button}
          activeOpacity={0.9}
          onPress={handleMainPress}
        >
          {/* Glossy overlay effect */}
          <View style={styles.glossyOverlay} />
          
          {/* Facebook-style gradient background */}
          <View style={styles.gradientBg} />
          
          {/* Icon with better positioning */}
          <View style={styles.iconContainer}>
            <Ionicons 
              name="chatbubble-ellipses" 
              size={26} 
              color="#ffffff" 
              style={styles.icon}
            />
          </View>
          
          {/* Subtle inner highlight */}
          <View style={styles.innerHighlight} />

          {unreadTotal > 0 ? (
            <View style={styles.unreadBadge} >
              <Text style={styles.unreadBadgeText}>
                {unreadTotal > 99 ? '99+' : unreadTotal}
              </Text>
            </View>
          ) : (
            <View style={styles.statusDot} />
          )}
        </TouchableOpacity>
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    zIndex: 9999,
  },
  shadowContainer: {
    position: 'absolute',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
  },
  shadowLayer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: '#000000',
  },
  shadowLayer1: {
    opacity: 0.15,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  shadowLayer2: {
    opacity: 0.1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  shadowLayer3: {
    opacity: 0.05,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    // overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: '#ffffff',
    position: 'relative',
  },
  gradientBg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#0084FF', // Facebook Messenger blue
    borderRadius: BUTTON_SIZE / 2,
  },
  glossyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderTopLeftRadius: BUTTON_SIZE / 2,
    borderTopRightRadius: BUTTON_SIZE / 2,
  },
  iconContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  icon: {
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  innerHighlight: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 3,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: BUTTON_SIZE / 2,
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 24,
    height: 24,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 6,
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 12,
  },
  statusDot: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    borderWidth: 1.5,
    borderColor: '#ffffff',
    zIndex: 20,
  },
});

export default FloatingChatButton;
