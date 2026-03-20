import React from 'react';
import {  ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';

type ScreenWrapperProps = {
  children: React.ReactNode;
  safeEdges?: Edge[]; 
  style?: ViewStyle;
  isbluetop?: boolean;
};

const ScreenWrapper = ({ children, safeEdges = [], style, isbluetop }: ScreenWrapperProps) => {

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
