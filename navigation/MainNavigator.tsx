import { View, } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator, NativeStackNavigationProp } from '@react-navigation/native-stack';

// Import your existing screens
import HomeScreen from 'screens/freelancer/HomeScreen';
import WorkFeedScreen from 'screens/freelancer/WorkFeedScreen';
import PostWorkScreen from 'screens/freelancer/PostWorkScreen';
import ChatScreen from 'screens/chat/ChatScreen';
import ProfileScreen from 'screens/profile/ProfileScreen';
import SearchView from 'screens/freelancer/SearchView';
import SearchBar from 'components/freelancer/SearchBar';
import FreelancerProfile from 'components/freelancer/FreelancerProfile';
import ResumeImageViewer from 'components/profile/ResumeImageViewer';
import SignUpScreen from 'screens/auth/SignUpScreen';
import OtpRequestScreen from 'screens/auth/OtpRequestScreen';
import SigninScreen from 'screens/auth/SigninScreen';
import { FreelancerStackParamList, TabParamList } from 'types/navigation';
import BookFreelancer from 'components/publicwork/BookFreelancer';
import ConfirmBookingScreen from 'components/publicwork/ConfirmBookingScreen';
import NotificationsScreen from 'screens/notification/NotificationsScreen';
import UpgradeToFreelancer from 'components/freelancerKYC/UpgradeToFreelancer';
import AuthFreelancerProfile from 'screens/profile/AuthFreelancerProfile';
import FreelancerRoleGate from 'screens/profile/FreelancerRoleGate';
import AuthFreelancerSetting from 'screens/profile/AuthFreelancerSetting';
import EditFreelancerJobsection from 'components/profile/EditFreelancerJobsection';
import EditAoserProfile from 'components/profile/EditAoserProfile';
import EditFreelancerAboutMe from 'components/profile/EditFreelancerAboutMe';
import EditFreelancerOffer from 'components/profile/EditFreelancerOffer';
import FreelancerWorkHistory from 'screens/profile/FreelancerWorkHistory';
import FreelancerWorkDetail from 'screens/freelancer/FreelancerWorkDetail';
import LanguageSelectScreen from 'components/profile/LanguageSelectScreen';
import ChangePasswordScreen from 'components/profile/ChangePasswordScreen';
import NotificationSettingsScreen from 'components/profile/NotificationSettingsScreen';
import OnboardingScreen from 'screens/onboarding/OnboardingScreen';
import AskAQuestionScreen from 'components/profile/AskAQuestionScreen';
import PrivacyPolicyScreen from 'components/profile/PrivacyPolicyScreen';
import FavoriteScreen from 'components/favorites/FavoriteScreen';
import HistoryScreen from 'components/history/HistoryScreen';
import UserIdScreen from 'screens/profile/UserIdScreen';
import RoomChat from 'screens/chat/RoomChat';
import FloatingChatButton from 'screens/chat/FloatingChatButton';
import PaymentScreen from 'screens/freelancer/PaymentScreen';
import CustomTabBar from './CustomTabBar';
import EditWorkById from 'components/publicwork/EditworkById';
import ProtectedRoute from './ProtectedRoute';
import { useAuthContext } from 'contexts/AuthContext';
import { usePushNotifications } from 'hooks/useNotifications';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import ForgotPasswordScreen from 'screens/auth/ForgotPassword';
import ProfileSetup from 'screens/auth/Profilesetup';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RecommendUser from 'screens/profile/Recommend_user';
import { useTranslation } from 'react-i18next';
import PaymentDetail_Id from 'screens/freelancer/PaymentDetail_Id';
import CustomerProfile from 'screens/profile/CustomerProfile';
import AppendOwnerWork from 'components/publicwork/AppendOwnerWork';
import TopFreelancerList from 'components/freelancer/TopFreelancerList';
import ConfirmPostjob from 'components/publicwork/ConfirmPostjob';



const Tab = createBottomTabNavigator<TabParamList>();
const RootStack = createNativeStackNavigator<FreelancerStackParamList>();

// Main Tab Navigator Component
function TabNavigator() {
  const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
  const { isAuthenticated } = useAuthContext();
  const { t } = useTranslation();
  return (
    <ScreenWrapper safeEdges={['bottom']} style={{ flex: 1, backgroundColor: '#000' }}>
      <View className="flex-1 relative">
        <Tab.Navigator
          tabBar={(props) => <CustomTabBar {...props} />}
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: '#000',
            },
            tabBarActiveTintColor: 'white',
            tabBarInactiveTintColor: '#888',
          }}
        >
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Works" component={WorkFeedScreen} />

          <Tab.Screen name="New work"
            options={{ title: t('tab.newWork') }}
          >
            {() => (
              <ProtectedRoute
                fallbackMessage={t('protectedRoute.signInToPost')}
                onSignInPress={() => navigation.navigate('SignIn')}
                onSignUpPress={() => navigation.navigate('SignUp')}
              >
                <PostWorkScreen />
              </ProtectedRoute>
            )}
          </Tab.Screen>

          <Tab.Screen name="Notifications">
            {() => (
              <ProtectedRoute
                fallbackMessage={t('protectedRoute.signInToViewNotifications')}
                onSignInPress={() => navigation.navigate('SignIn')}
                onSignUpPress={() => navigation.navigate('SignUp')}
              >
                <NotificationsScreen />
              </ProtectedRoute>
            )}
          </Tab.Screen>

          <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>

        {/* Enhanced Floating Chat Button */}
        {isAuthenticated && (
          <FloatingChatButton
            onPress={() => navigation.navigate('ChatScreen')}
          />
        )}
      </View>
    </ScreenWrapper>
  );
}

export default function MainNavigator() {
  const { expoPushToken, notification } = usePushNotifications();

  const data = JSON.stringify(notification, undefined, 2);

  console.log("TokenL: ", expoPushToken?.data);
  console.log(data);

  const { t } = useTranslation();

  const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1 }}>

      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade'
        }}
      >
        <RootStack.Screen name="MainTabs" component={TabNavigator} />
        <RootStack.Screen name="SearchBar" component={SearchBar} />
        <RootStack.Screen name="Onboarding" component={OnboardingScreen} />

        <RootStack.Screen
          name="SearchView"
          component={SearchView}
          options={{
            headerShown: false,
            autoHideHomeIndicator: true
          }}
        />
        <RootStack.Screen name="FreelancerProfile" component={FreelancerProfile}
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <RootStack.Screen name="TopFreelancerList" component={TopFreelancerList}
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <RootStack.Screen name="ResumeImageViewer" component={ResumeImageViewer}  
 
        />

        <RootStack.Screen name="Bookfreelancer">
          {(props) => (
            <ProtectedRoute
              backicon={true}
              fallbackMessage="Sign in to book a freelancer"
              onSignInPress={() => navigation.navigate('SignIn')}
              onSignUpPress={() => navigation.navigate('SignUp')}
            >
              <BookFreelancer {...props} />
            </ProtectedRoute>
          )}
        </RootStack.Screen>

        <RootStack.Screen
          name="ConfirmBookingScreen"
          component={ConfirmBookingScreen}

        />
        <RootStack.Screen
          name="ConfirmPostjob"
          component={ConfirmPostjob}

        />

        <RootStack.Screen name="UpgradeToFreelancer" component={UpgradeToFreelancer} />

        <RootStack.Screen name="FreelancerRoleGate"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          {() => (
            <ProtectedRoute
              backicon={true}
              fallbackMessage={t('protectedRoute.signInToAccess')}
              onSignInPress={() => navigation.navigate('SignIn')}
              onSignUpPress={() => navigation.navigate('SignUp')}
            >
              <FreelancerRoleGate />
            </ProtectedRoute>
          )}
        </RootStack.Screen>

        <RootStack.Screen name="AuthFreelancerProfile" component={AuthFreelancerProfile} />
        <RootStack.Screen name="CustomerProfile" component={CustomerProfile} options={{
          headerShown: false,
          animation: 'ios_from_right',
        }} />
        <RootStack.Screen name="LanguageSelectScreen" component={LanguageSelectScreen} 
        options={{
          headerShown: false,
          animation: 'ios_from_right',
        }}
        />

        <RootStack.Screen name="ChangePasswordScreen"
         options={{
          headerShown: false,
          animation: 'ios_from_right',
        }}
        >
          {() => (
            <ProtectedRoute
              backicon={true}
              fallbackMessage={t('protectedRoute.signInToAccess')}
              onSignInPress={() => navigation.navigate('SignIn')}
              onSignUpPress={() => navigation.navigate('SignUp')}
            >
              <ChangePasswordScreen />
            </ProtectedRoute>
          )}
        </RootStack.Screen>

        <RootStack.Screen name="NotificationSettingsScreen" component={NotificationSettingsScreen} />

        <RootStack.Screen name="AskAQuestionScreen"
         options={{
          headerShown: false,
          animation: 'ios_from_right',
        }}
        >
          {() => (
            <ProtectedRoute
              backicon={true}
              fallbackMessage={t('protectedRoute.signInToAccess')}
              onSignInPress={() => navigation.navigate('SignIn')}
              onSignUpPress={() => navigation.navigate('SignUp')}
            >
              <AskAQuestionScreen />
            </ProtectedRoute>
          )}
        </RootStack.Screen>

        <RootStack.Screen name="PrivacyPolicyScreen" component={PrivacyPolicyScreen} 
         options={{
          headerShown: false,
          animation: 'ios_from_right',
        }}
        />

        <RootStack.Screen name="AuthFreelancerSetting"
        
        >
          {() => (
            <ProtectedRoute
              fallbackMessage={t('protectedRoute.signInToAccess')}
              onSignInPress={() => navigation.navigate('SignIn')}
              onSignUpPress={() => navigation.navigate('SignUp')}
            >
              <AuthFreelancerSetting />
            </ProtectedRoute>
          )}
        </RootStack.Screen>

        <RootStack.Screen name="EditFreelancerJobsection">
          {() => (
            <ProtectedRoute
              backicon={true}
              fallbackMessage={t('protectedRoute.signInToAccess')}
              onSignInPress={() => navigation.navigate('SignIn')}
              onSignUpPress={() => navigation.navigate('SignUp')}
            >
              <EditFreelancerJobsection />
            </ProtectedRoute>
          )}
        </RootStack.Screen>

        <RootStack.Screen name="EditAoserProfile"
         options={{
          headerShown: false,
          animation: 'ios_from_right',
        }}
        >
          {() => (
            <ProtectedRoute
              backicon={true}
              fallbackMessage={t('protectedRoute.signInToAccess')}
              onSignInPress={() => navigation.navigate('SignIn')}
              onSignUpPress={() => navigation.navigate('SignUp')}
            >
              <EditAoserProfile />
            </ProtectedRoute>
          )}
        </RootStack.Screen>

        <RootStack.Screen name="EditFreelancerAboutMe">
          {() => (
            <ProtectedRoute
              backicon={true}
              fallbackMessage={t('protectedRoute.signInToAccess')}
              onSignInPress={() => navigation.navigate('SignIn')}
              onSignUpPress={() => navigation.navigate('SignUp')}
            >
              <EditFreelancerAboutMe />
            </ProtectedRoute>
          )}
        </RootStack.Screen>

        <RootStack.Screen name="EditFreelancerOffer" component={EditFreelancerOffer} />

        <RootStack.Screen
          name="UserIdScreen"
          component={UserIdScreen}

        />
        <RootStack.Screen
          name="RecommendUser"
          component={RecommendUser}
          options={{
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
        />

        {/* Works */}
        <RootStack.Screen name="FreelancerWorkHistory"
        options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          {() => (
            <ProtectedRoute
              backicon={true}
              fallbackMessage={t('protectedRoute.signInToAccess')}
              onSignInPress={() => navigation.navigate('SignIn')}
              onSignUpPress={() => navigation.navigate('SignUp')}
            >
              <FreelancerWorkHistory />
            </ProtectedRoute>
          )}
        </RootStack.Screen>

        <RootStack.Screen name="FreelancerWorkDetail" component={FreelancerWorkDetail} 
        options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <RootStack.Screen name="EditWorkById" component={EditWorkById} />
        <RootStack.Screen name="AppendOwnerWork" component={AppendOwnerWork} />

        {/* <RootStack.Screen name="EditWorkById">
          {() => (
            <ProtectedRoute
              backicon={true}
              fallbackMessage={t('protectedRoute.signInToAccess')}
              onSignInPress={() => navigation.navigate('SignIn')}
              onSignUpPress={() => navigation.navigate('SignUp')}
            >
              <EditWorkById  />
            </ProtectedRoute>
          )}
        </RootStack.Screen> */}

        {/* Payment */}
        <RootStack.Screen
          name="PaymentScreen"
          component={PaymentScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
        />
        <RootStack.Screen
          name="PaymentDetail_Id"
          component={PaymentDetail_Id}
          options={{
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
        />

        <RootStack.Screen name="FavoriteScreen">
          {() => (
            <ProtectedRoute
              backicon={true}
              fallbackMessage={t('protectedRoute.signInToAccess')}
              onSignInPress={() => navigation.navigate('SignIn')}
              onSignUpPress={() => navigation.navigate('SignUp')}
            >
              <FavoriteScreen />
            </ProtectedRoute>
          )}
        </RootStack.Screen>

        <RootStack.Screen name="HistoryScreen">
          {() => (
            <ProtectedRoute
              backicon={true}
              fallbackMessage={t('protectedRoute.signInToAccess')}
              onSignInPress={() => navigation.navigate('SignIn')}
              onSignUpPress={() => navigation.navigate('SignUp')}
            >
              <HistoryScreen />
            </ProtectedRoute>
          )}
        </RootStack.Screen>
        <RootStack.Screen
          name="ChatScreen"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          {() => (
            <ProtectedRoute
              backicon={true}
              fallbackMessage={t('protectedRoute.signInToAccess')}
              onSignInPress={() => navigation.navigate('SignIn')}
              onSignUpPress={() => navigation.navigate('SignUp')}
            >
              <ChatScreen />
            </ProtectedRoute>
          )}
        </RootStack.Screen>

        {/* <RootStack.Screen
          name="ChatScreen"
          component={ChatScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        /> */}

        {/* <RootStack.Screen
          name="RoomChat"
          component={RoomChat}
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        /> */}
        <RootStack.Screen
          name="RoomChat"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          {() => (
            <ProtectedRoute
              backicon={true}
              fallbackMessage={t('protectedRoute.signInToAccess')}
              onSignInPress={() => navigation.navigate('SignIn')}
              onSignUpPress={() => navigation.navigate('SignUp')}
            >
              <RoomChat />
            </ProtectedRoute>
          )}
        </RootStack.Screen>


        <RootStack.Screen name="SignUp" component={SignUpScreen} />


        <RootStack.Screen name="SignIn" component={SigninScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_bottom',
          }} />
        <RootStack.Screen name="OtpRequest" component={OtpRequestScreen} />
        {/* <Stack.Screen name="OtpRequest" component={OtpRequestScreen} /> */}
        <RootStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{
          headerShown: false,
          animation: 'slide_from_right',
        }} />
        <RootStack.Screen name="ProfileSetup" component={ProfileSetup} />
      </RootStack.Navigator>

      <View
        style={{
          height: insets.bottom,
          backgroundColor: 'black',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        }}
      />
    </View>
  );
}