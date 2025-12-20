import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Animated, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function CustomTabBar({ state, descriptors, navigation }: any) {
  const scaleAnims = useRef(state.routes.map(() => new Animated.Value(1))).current;
  const insets = useSafeAreaInsets();
 const { t } = useTranslation();

  useEffect(() => {
    // Animate tab icons
    scaleAnims.forEach((anim:any, index:any) => {
      Animated.spring(anim, {
        toValue: state.index === index ? 1.1 : 1,
        useNativeDriver: true,
        tension: 150,
        friction: 8,
      }).start();
    });
  }, [state.index]);

  const getIconName = (routeName: string, focused: boolean) => {
    let iconName: keyof typeof Ionicons.glyphMap;
    
    if (routeName === 'Home') iconName = focused ? 'home' : 'home-outline';
    else if (routeName === 'Works') iconName = focused ? 'briefcase' : 'briefcase-outline';
    else if (routeName === 'New work') iconName = focused ? 'add-circle' : 'add-circle-outline';
    else if (routeName === 'Notifications') iconName = focused ? 'notifications' : 'notifications-outline';
    else if (routeName === 'Profile') iconName = focused ? 'person' : 'person-outline';
    else iconName = 'help-outline';
    
    return iconName;
  };

  const getIconSize = (routeName: string) => {
    return routeName === 'New work' ? 28 : 24;
  };

  return (
    <View 
      // className="absolute left-0 right-0"
      style={{ 
        // bottom: insets.bottom,
       
        zIndex: 1000 // Higher than ScreenWrapper's black overlay
      }}
    >
      {/* Clean White Background */}
      <View 
        className="bg-white"
        
      >
        {/* Tab Content */}
        <View className="flex-row border-t border-border px-1 py-2">
          {state.routes.map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;
            const isPostWork = route.name === 'New work';

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                // Use the navigation prop passed from tab navigator instead of useNavigation hook
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                onLongPress={onLongPress}
                className={`flex-1 items-center justify-center`}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
              >
                {/* Tab Icon Container with Animation */}
                <Animated.View
                  className={`bg-slate-400 ${
                    isPostWork? 'p-1 bg-slate-400' : 'p-1 '
                  } rounded-full ${
                    isFocused 
                      ? 'bg-primary/10'
                      : 'bg-transparent'
                  }`}
                  style={{
                    transform: [{ scale: scaleAnims[index] }],
                    ...(isPostWork&& isFocused && {
                      shadowColor: '#3B82F6',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                      elevation: 6,
                    }),
                  }}
                  
                >
                  <Ionicons
                    name={getIconName(route.name, isFocused)}
                    size={getIconSize(route.name)}
                    color={
                      isFocused 
                        ? 
                        '#3B82F6'
                        : '#6B7280'
                    }
                  />
                </Animated.View>

                {/* Tab Label */}
                <Text
                  className={`text-caption mt-1 text-center font-bold ${
                    isFocused ? 'text-primary font-semibold' : 'text-textSecondary'
                  }`}
                >
                  {/* the text show in the tab */}
                  { route.name ==="Home" && t('tab.home')}
                  { route.name ==="Works" && t('tab.works')}
                  { route.name ==="New work" && t('tab.newWork')}
                  { route.name ==="Notifications" && t('tab.notifications')}
                  { route.name ==="Profile" && t('tab.profile')}
                </Text>

                {/* Active Indicator for non-PostWork tabs */}
                {/* {isFocused  && (
                  <View className="w-1 h-1 bg-primary rounded-full mt-1" />
                )} */}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Bottom Safe Area Spacing */}
    </View>
  );
}

export default CustomTabBar;