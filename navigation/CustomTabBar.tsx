import { Ionicons } from "@expo/vector-icons";
import { useMarkNotificationsAsRead, useUnreadNotification } from "hooks/useNotifications";
import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Animated, Text, TouchableOpacity, View } from "react-native";

// import {Grid2x2}  from 'lucide-react-native';


interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}
interface NotificationBadgeProps {
  count: number;
  isVisible: boolean;
}

const formatBadgeCount = (count: number): string => {
  if (count > 99) {
    return '99+';
  }
  return count.toString();
};
const NotificationBadge: React.FC<NotificationBadgeProps> = ({ count, isVisible }) => {
  // Don't render if not visible or count is 0
  if (!isVisible || count === 0) {
    return null;
  }

  const badgeText = formatBadgeCount(count);
  const isLongText = badgeText.length > 2; // "99+" is 3 characters

  return (
    <View
      style={{
        position: 'absolute',
        top: -4,
        right: -6,
        backgroundColor: '#EF4444', // red-500
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        paddingHorizontal: isLongText ? 4 : 0,
        justifyContent: 'center',
        alignItems: 'center',
        // borderWidth: 2,
        // borderColor: 'white',
        // Shadow for iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        // Elevation for Android
        elevation: 6,
      }}
    >
      <Text
        style={{
          color: 'white',
          fontSize: 10,
          fontWeight: 'bold',
          lineHeight: 12,
        }}
      >
        {badgeText}
      </Text>
    </View>
  );
};
function CustomTabBar({ state, descriptors, navigation }: CustomTabBarProps) {
  // =================================================================
  // HOOKS
  // =================================================================
  const { t } = useTranslation();
  // const insets = useSafeAreaInsets();
  const unreadData = useUnreadNotification();
  const markAsReadMutation = useMarkNotificationsAsRead();

  // ANIMATION REFS
  // =================================================================
  const scaleAnims = useRef(
    state.routes.map(() => new Animated.Value(1))
  ).current;

  // =================================================================
  // DERIVED STATE
  // =================================================================

  /**
   * Extract notification badge data
   * - isViewed: false = show badge
   * - isViewed: true = hide badge
   * - notificationUnreadCount: number to display
   */
  const shouldShowBadge = unreadData?.data?.isViewed === false;
  // const shouldShowBadge = true;
  const unreadCount = unreadData?.data?.notificationUnreadCount || 0;



  // =================================================================
  // EFFECTS
  // =================================================================

  /**
   * Animate tab icons on selection change
   * Selected tab scales up slightly, others scale back to normal
   */
  useEffect(() => {
    scaleAnims.forEach((anim: any, index: any) => {
      Animated.spring(anim, {
        toValue: state.index === index ? 1.1 : 1,
        useNativeDriver: true,
        tension: 150,
        friction: 8,
      }).start();
    });
  }, [state.index]);


  const handleMarkNotificationsAsRead = useCallback(() => {
    markAsReadMutation.mutate(undefined, {
      onSuccess: () => {
        console.log('✅ Successfully marked notifications as read');
      },
      onError: (error) => {
        console.log('❌ Failed to mark notifications as read:', error);
      }
    });
  }, [markAsReadMutation]);
  // =================================================================
  // HELPER FUNCTIONS
  // =================================================================

  /**
   * Get appropriate icon name based on route and focus state
   * Uses filled icons when focused, outline when not focused
   */
  const getIconName = (routeName: string, focused: boolean): keyof typeof Ionicons.glyphMap => {
    switch (routeName) {
      case 'Home':
        return focused ? 'home' : 'home-outline';
      case 'Works':
        return focused ? 'grid' : 'grid-outline';
      case 'New work':
        return focused ? 'add-circle' : 'add-circle-outline';
      case 'Notifications':
        return focused ? 'notifications' : 'notifications-outline';
      case 'Profile':
        return focused ? 'person' : 'person-outline';
      default:
        return 'help-outline';
    }
  };

  /**
   * Get icon size based on route
   * "New work" is larger to emphasize primary action
   */
  const getIconSize = (routeName: string): number => {
    return routeName === 'New work' ? 28 : 24;
  };

  /**
   * Get translated label for each tab
   */
  const getTabLabel = (routeName: string): string => {
    switch (routeName) {
      case 'Home':
        return t('tab.home');
      case 'Works':
        return t('tab.works');
      case 'New work':
        return t('tab.newWork');
      case 'Notifications':
        return t('tab.notifications');
      case 'Profile':
        return t('tab.profile');
      default:
        return routeName;
    }
  };


  return (
    <View
      style={{
        zIndex: 1000,
      }}
    >

      <View className="bg-white">
        <View className="flex-row border-t border-border px-1 py-2">
          {state.routes.map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;
            const isPostWork = route.name === 'New work';
            const isNotifications = route.name === 'Notifications';

            // =================================================================
            // EVENT HANDLERS
            // =================================================================

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);

                if (isNotifications) {
                  setTimeout(() => {
                    handleMarkNotificationsAsRead();
                  }, 100);
                }
              }


            };



            // =================================================================
            // RENDER TAB ITEM
            // =================================================================

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}

                className="flex-1 items-center justify-center"
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
              >
                {/* ===== TAB ICON CONTAINER WITH ANIMATION ===== */}
                <Animated.View
                  style={{
                    transform: [{ scale: scaleAnims[index] }],
                    position: 'relative',
                  }}
                >
                  {isPostWork ? (
                    // Custom [+] button for New Work
                    <View
                      style={{
                        width: 42,
                        height: 32,
                        borderRadius: 5,
                        backgroundColor: isFocused ? '#3B82F6' : '#fff',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1.3,
                        borderColor: isFocused ? '#93C5FD' : '#6B7280',
                        // ...(isFocused && {
                        //   shadowColor: '#3B82F6',
                        //   shadowOffset: { width: 0, height: 2 },
                        //   shadowOpacity: 0.4,
                        //   shadowRadius: 6,
                        //   elevation: 8,
                        // }),
                        marginTop: -14,
                      }}
                    >
                      {/* <Text
                        style={{
                          // color: isFocused ? '#3B82F6' : '#6B7280',
                          fontSize: 23,
                          fontWeight: isFocused ? '400' : '300',
                          lineHeight: 30,
                          marginTop: -10,
                        }}
                        className={`border px-5 py-1 ${isFocused ? 'border-border' : 'border-primary'} `}
                      >
                        + 
                      </Text> */}

                      <Ionicons name="add-outline" size={24} color={isFocused ? '#ffff' : '#6B7280'} />
                    </View>
                  ) : (
                    // Normal icon for other tabs
                    <View
                      className={`p-1 rounded-full ${isFocused ? 'bg-primary/10' : 'bg-transparent'}`}
                    >
                      <Ionicons
                        name={getIconName(route.name, isFocused)}
                        size={getIconSize(route.name)}
                        color={isFocused ? '#3B82F6' : '#6B7280'}
                      />
                      {/* ===== NOTIFICATION BADGE ===== */}
                      {isNotifications && (
                        <NotificationBadge
                          count={unreadCount}
                          isVisible={shouldShowBadge}
                        />
                      )}
                    </View>
                  )}
                </Animated.View>

                {/* ===== TAB LABEL ===== */}
                {!isPostWork && (
                  <Text
                    className={`text-caption mt-1 text-center font-bold ${isFocused ? 'text-primary font-semibold' : 'text-textSecondary'
                      }`}
                    numberOfLines={1}
                  >
                    {getTabLabel(route.name)}
                  </Text>
                )}


              </TouchableOpacity>
            );
          })}
        </View>
      </View>


    </View>
  );
}

export default CustomTabBar;