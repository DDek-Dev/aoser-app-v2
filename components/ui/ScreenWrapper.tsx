import React from 'react';
import { Platform, View, ViewStyle } from 'react-native';
import { SafeAreaView, Edge, useSafeAreaInsets } from 'react-native-safe-area-context';

type ScreenWrapperProps = {
  children: React.ReactNode;
  safeEdges?: Edge[]; 
  style?: ViewStyle;
  isbluetop?: boolean;
};

const ScreenWrapper = ({ children, safeEdges = [], style, isbluetop }: ScreenWrapperProps) => {
  const insets = useSafeAreaInsets();
  const showBottomInsetOverlay = safeEdges.includes('bottom') && insets.bottom > 0;

  return (
    <SafeAreaView
      edges={safeEdges}
      style={[
        { flex: 1, backgroundColor: 'white', position: 'relative' }, // position is required for zIndex to work
        style
      ]}
    >

      

      {children}

      {showBottomInsetOverlay && (
        <View
          pointerEvents="none"
          style={{
            height: insets.bottom,
            backgroundColor: Platform.OS === 'ios' ? '#fff' : '#000',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
          }}
        />
      )}
      

    </SafeAreaView>
  );
};

export default ScreenWrapper;
