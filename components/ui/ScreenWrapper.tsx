import React from 'react';
import { View, ViewStyle } from 'react-native';
import { SafeAreaView, Edge, useSafeAreaInsets } from 'react-native-safe-area-context';
import FloatingChatButton from 'screens/chat/FloatingChatButton';

type ScreenWrapperProps = {
  children: React.ReactNode;
  safeEdges?: Edge[]; // e.g. ['top', 'bottom']
  style?: ViewStyle;
  isbluetop?: boolean;
};

const ScreenWrapper = ({ children, safeEdges = [], style, isbluetop }: ScreenWrapperProps) => {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      edges={safeEdges}
      style={[
        { flex: 1, backgroundColor: 'white', position: 'relative' }, // position is required for zIndex to work
        style
      ]}
    >

      

      {children}
      

    </SafeAreaView>
  );
};

export default ScreenWrapper;
