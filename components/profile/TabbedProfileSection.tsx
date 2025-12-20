import { MaterialIcons } from '@expo/vector-icons';
import CertificateImageGrid from 'components/ui/CertificateImageGrid';
import { t } from 'i18next';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  PanResponder,
} from 'react-native';
import {  Freelancer } from 'types/profile';

type TabContentProps = {
  profile: Freelancer;
  stylepadd: null | string;
  isReview?: boolean;
};

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function TabbedProfileSection({ profile, stylepadd, isReview }: TabContentProps) {
  const [activeTab, setActiveTab] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  
  // Keep track of current translateX during gesture
  const lastTranslateX = useRef(0);
  const {t} = useTranslation();
  const tabs = [`${t('freelancer_profile.tabbedProfile.experience')}`, `${t('freelancer_profile.tabbedProfile.skill')}`, `${t('freelancer_profile.tabbedProfile.portfolio')}`, `${t('freelancer_profile.tabbedProfile.aboutme')}`];

  const goToTab = (index: number) => {
    const clampedIndex = Math.max(0, Math.min(tabs.length - 1, index));
    setActiveTab(clampedIndex);
    lastTranslateX.current = -SCREEN_WIDTH * clampedIndex;

    Animated.spring(translateX, {
      toValue: -SCREEN_WIDTH * clampedIndex,
      useNativeDriver: true,
      bounciness: 0,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Activate pan responder for horizontal swipe only if movement is big enough
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 20;
      },
      onPanResponderGrant: () => {
        // Stop any animation and prepare for dragging
        translateX.stopAnimation((value) => {
          lastTranslateX.current = value;
        });
      },
      onPanResponderMove: (_, gestureState) => {
        // Calculate new translateX position based on gesture dx + last position
        let newTranslateX = lastTranslateX.current + gestureState.dx;

        // Clamp to left and right bounds so user can't swipe out of range
        const maxTranslateX = 0;
        const minTranslateX = -SCREEN_WIDTH * (tabs.length - 1);
        if (newTranslateX > maxTranslateX) newTranslateX = maxTranslateX;
        if (newTranslateX < minTranslateX) newTranslateX = minTranslateX;

        translateX.setValue(newTranslateX);
      },
      onPanResponderRelease: (_, gestureState) => {
        // Calculate which tab is closest based on where user released finger
        const movedPos = lastTranslateX.current + gestureState.dx;
        const tabIndex = Math.round(-movedPos / SCREEN_WIDTH);

        // Clamp tabIndex
        const clampedIndex = Math.max(0, Math.min(tabs.length - 1, tabIndex));

        goToTab(clampedIndex);
      },
      onPanResponderTerminationRequest: () => true,
      onPanResponderTerminate: () => {
        // If gesture canceled, snap back to current tab
        goToTab(activeTab);
      },
    })
  ).current;

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      {/* Top Tabs */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          borderBottomWidth: 1,
          borderColor: '#ddd',
        }}
      >
        {tabs.map((tab, index) => (
          <TouchableOpacity
            key={tab}
            onPress={() => goToTab(index)}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderBottomWidth: activeTab === index ? 2 : 0,
              borderBottomColor: '#2563eb',
            }}
          >
            <Text
              style={{
                textAlign: 'center',
                color: activeTab === index ? '#2563eb' : 'gray',
                fontWeight: activeTab === index ? '500' : 'normal',
              }}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Swipeable content */}
      <View style={{ flex: 1, overflow: 'hidden' }} {...panResponder.panHandlers}>
        <Animated.View
          style={{
            flexDirection: 'row',
            width: SCREEN_WIDTH * tabs.length,
            transform: [{ translateX }],
          }}
        >
          {/* Experience */}
          <View style={{ width: SCREEN_WIDTH, padding: 16 }}>
            
            {profile.workExperience?.map((item, index) => (
              <View key={index} className="text-body text-gray-600 mb-4 items-center flex-row justify-start">
                <MaterialIcons name='fiber-manual-record' size={14} color="#3b82f6" /> 
                <Text> {item}</Text>
                </View>
            ))}
          </View>

          {/* Skill */}
          <View style={{ width: SCREEN_WIDTH, padding: 16 }}>
            
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {profile.skills?.map(
                (skil) => (
                  <Text
                    key={skil}
                    style={{
                      backgroundColor: '#d0e8ff',
                      color: '#1e40af',
                      paddingHorizontal: 20,
                      paddingVertical: 8,
                      borderRadius: 16,
                      marginRight: 8,
                      marginBottom: 8,
                    }}
                    className='text-body '
                  >
                    {skil}
                  </Text>
                )
              )}
            </View>
          </View>

          {/* Portfolio */}
          <View style={{ width: SCREEN_WIDTH, padding: 16 }}>
           
            <CertificateImageGrid
              isReview={isReview}
              certificateImages={profile.certificates|| []}
              autoSlideInterval={4000} // Optional: 4 seconds, default is 3 seconds
            />

          </View>

          {/* About Me */}
          <View style={{ width: SCREEN_WIDTH, padding: 16 }}>

            <View className='bg-blue-50 p-4 rounded-xl'>

            <Text className={`text-body text-text mt-1 ${stylepadd}`}>
              {profile.about}

            </Text>

            </View>
          
          </View>
        </Animated.View>
      </View>
    </View>
  );
}
