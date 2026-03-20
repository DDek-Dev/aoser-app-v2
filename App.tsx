// // App.tsx
// import React, { useEffect, useState } from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { StatusBar } from 'expo-status-bar';
// import './global.css';
// import MainNavigator from 'navigation/MainNavigator';
// import { navigationRef } from 'navigation/RootNavigation';
// import './i18n';
// import { GestureHandlerRootView } from 'react-native-gesture-handler';
// import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { AlertNotificationRoot } from 'react-native-alert-notification';
// import { KeyboardProvider } from 'react-native-keyboard-controller';
// import { AuthProvider } from 'contexts/AuthContext';
// import { deactivateKeepAwake } from 'expo-keep-awake';
// import i18n from './i18n';
// import { I18nextProvider } from 'react-i18next';
// import { initLanguage } from 'utils/authStorage';
// import NetInfo from '@react-native-community/netinfo';
// import { NetworkErrorOverlay } from 'components/ui/NetworkErrorOverlay';
// import { apiEvents } from 'api/networkCheck'; // ນຳເຂົ້າ apiEvents ທີ່ເຮົາສ້າງໄວ້
// import * as SplashScreen from 'expo-splash-screen';
// import { useFonts } from 'expo-font';
// import { Text, TextInput, StyleSheet, View, Platform } from 'react-native';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';

// const queryClient = new QueryClient();

// // 1. ทำ Font Patching (อยู่นอก Component เพื่อให้รันทันที)
// // @ts-ignore
// const oldTextRender = Text.render;
// // @ts-ignore
// Text.render = function (...args) {
//   const origin = oldTextRender.call(this, ...args);
//   return React.cloneElement(origin, {
//     style: [styles.defaultFont, origin.props.style],
//   });
// };

// // @ts-ignore
// const oldTextInputRender = TextInput.render;
// // @ts-ignore
// TextInput.render = function (...args) {
//   const origin = oldTextInputRender.call(this, ...args);
//   return React.cloneElement(origin, {
//     style: [styles.defaultFont, origin.props.style],
//   });
// };

// // ป้องกัน SplashScreen หายก่อนโหลดฟอนต์เสร็จ
// SplashScreen.preventAutoHideAsync();


// export default function App() {
//   const [isConnected, setIsConnected] = useState<boolean | null>(true);
//   const [hasApiError, setHasApiError] = useState(false);



//   // 2. โหลดฟอนต์ (สมมติว่าใช้ Noto Sans Lao)
//   const [fontsLoaded] = useFonts({
//     'LaoFont': require('./assets/fonts/Noto_Sans_Lao/NotoSansLao-VariableFont_wdth,wght.ttf'), // แก้ path ให้ตรงกับไฟล์ของคุณ
//     'LaoFontBold': require('./assets/fonts/Noto_Sans_Lao/NotoSansLao-VariableFont_wdth,wght.ttf'),
//   });


//   useEffect(() => {
//     // 1. ຕິດຕາມສະຖານະເນັດ (Real-time NetInfo)
//     const unsubscribeNet = NetInfo.addEventListener(state => {
//       setIsConnected(state.isConnected);
//       if (state.isConnected) setHasApiError(false); // ຖ້າເນັດມາໃຫ້ລ້າງ Error
//     });

//     // 2. ຕິດຕາມ Error ຈາກ Axios Interceptor
//     const onApiNetworkError = () => setHasApiError(true);
//     apiEvents.on('network_error', onApiNetworkError);

//     // 3. Initialize App Data
//     const initializeApp = async () => {
//       try {
//         await initLanguage(i18n);
//         deactivateKeepAwake();

//         if (fontsLoaded) {
//           await SplashScreen.hideAsync();
//         }

//       } catch (error) {
//         console.log('Error initializing app:', error);
//       }
//     };
//     initializeApp();

//     return () => {
//       unsubscribeNet();
//       apiEvents.off('network_error', onApiNetworkError);
//     };
//   }, [fontsLoaded]);

//   const handleRetry = async () => {
//     const state = await NetInfo.fetch();
//     setIsConnected(state.isConnected);
//     setHasApiError(false);
//   };

//   const isOverlayVisible = isConnected === false || hasApiError;
//   const insets = useSafeAreaInsets();

//   return (
//     <QueryClientProvider client={queryClient}>
//       <I18nextProvider i18n={i18n}>
//         <NavigationContainer ref={navigationRef}>
//           <AuthProvider>
//             <GestureHandlerRootView style={{ flex: 1 }}>
//               <KeyboardProvider>
//                 <AlertNotificationRoot theme='light'>
//                   <BottomSheetModalProvider>
//                     <StatusBar style="auto" />
//                     <MainNavigator />

//                     <NetworkErrorOverlay
//                       visible={isOverlayVisible}
//                       onRetry={handleRetry}
//                     />
//                     <View
//                       pointerEvents="none"
//                       style={{
//                         height: insets.bottom,
//                         backgroundColor: Platform.OS === 'ios' ? '#fff' : '#000',
//                         position: 'absolute',
//                         bottom: 0,
//                         left: 0,
//                         right: 0,
//                         zIndex: 9999,
//                       }}
//                     />
//                   </BottomSheetModalProvider>
//                 </AlertNotificationRoot>
//               </KeyboardProvider>
//             </GestureHandlerRootView>
//           </AuthProvider>
//         </NavigationContainer>
//       </I18nextProvider>
//     </QueryClientProvider>
//   );
// }


// // 3. สร้าง Style สำหรับฟอนต์หลัก
// const styles = StyleSheet.create({
//   defaultFont: {
//     fontFamily: 'LaoFont', // ชื่อเดียวกับที่ตั้งไว้ใน useFonts
//   },
// });



import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import './global.css';
import MainNavigator from 'navigation/MainNavigator';
import { navigationRef } from 'navigation/RootNavigation';
import './i18n';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AlertNotificationRoot } from 'react-native-alert-notification';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { AuthProvider } from 'contexts/AuthContext';
import { deactivateKeepAwake } from 'expo-keep-awake';
import i18n from './i18n';
import { I18nextProvider } from 'react-i18next';
import { initLanguage } from 'utils/authStorage';
import NetInfo from '@react-native-community/netinfo';
import { NetworkErrorOverlay } from 'components/ui/NetworkErrorOverlay';
import { apiEvents } from 'api/networkCheck';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { StyleSheet, View, Platform } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'; // ✅ เพิ่ม SafeAreaProvider

const queryClient = new QueryClient();

SplashScreen.preventAutoHideAsync();

// ✅ แยก Inner Component เพื่อใช้ useSafeAreaInsets ได้
function AppContent() {
  const insets = useSafeAreaInsets();
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [hasApiError, setHasApiError] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    'LaoFont': require('./assets/fonts/Noto_Sans_Lao/NotoSansLao-VariableFont_wdth,wght.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    const unsubscribeNet = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      if (state.isConnected) setHasApiError(false);
    });

    const onApiNetworkError = () => setHasApiError(true);
    apiEvents.on('network_error', onApiNetworkError);

    const initializeApp = async () => {
      try {
        await initLanguage(i18n);
        deactivateKeepAwake();
      } catch (error) {
        console.log('Error initializing app:', error);
      }
    };
    initializeApp();

    return () => {
      unsubscribeNet();
      apiEvents.off('network_error', onApiNetworkError);
    };
  }, []);

  const handleRetry = async () => {
    const state = await NetInfo.fetch();
    setIsConnected(state.isConnected);
    setHasApiError(false);
  };

  const isOverlayVisible = isConnected === false || hasApiError;

  if (!fontsLoaded && !fontError) return null;

  return (
    <NavigationContainer ref={navigationRef}>
      <AuthProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <KeyboardProvider>
            <AlertNotificationRoot theme='light'>
              <BottomSheetModalProvider>
                <StatusBar style="auto" />
                <MainNavigator />
                <NetworkErrorOverlay
                  visible={isOverlayVisible}
                  onRetry={handleRetry}
                />
                {/* ✅ ใช้ insets ได้แล้วเพราะอยู่ใน SafeAreaProvider */}
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
              </BottomSheetModalProvider>
            </AlertNotificationRoot>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </AuthProvider>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    // ✅ SafeAreaProvider ต้องอยู่ด้านนอกสุด
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <AppContent />
        </I18nextProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  defaultFont: {
    fontFamily: 'LaoFont',
  },
});