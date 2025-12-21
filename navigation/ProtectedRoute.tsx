// components/auth/ProtectedRoute.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import Header_back from 'components/ui/Header_back';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';
import { useAuth } from 'hooks/useAuth'; // Import useAuth instead
import { useTranslation } from 'react-i18next';

interface ProtectedRouteProps {
    children: React.ReactNode;
    fallbackMessage?: string;
    onSignInPress?: () => void;
    onSignUpPress?: () => void;
    backicon?: boolean,
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    fallbackMessage,
    onSignInPress,
    onSignUpPress,
    backicon,
}) => {
    // const { isAuthenticated, isLoadingAuth , googleloading, googleLogin } = useAuthContext();
    const { isAuthenticated, isLoadingAuth, googleloading, googleLogin } = useAuth();
    const { t } = useTranslation();
    const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();

    const onBack = () => {
        navigation.goBack();
    }

    const handleGoogleLoginPresss = async () => {
        try {
            //   await handleGoogleLogin();
            await googleLogin();
            console.log('✅ Google login process completed');
        } catch (err) {
            console.log('❌ Google login failed:', err);
        }
    };
    // Show loading while checking auth status
    if (isLoadingAuth) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#2563EB" />
                <Text className="mt-4 text-gray-600">Loading...</Text>
            </View>
        );
    }

    // If not authenticated, show beautiful fallback UI
    if (!isAuthenticated) {
        return (

            <ScreenWrapper safeEdges={['top']}>
                {/* <View>
                    <MaterialIcons name="chevron-left" size={24} color="black"  />
                </View> */}

                {backicon && <Header_back iconColor='#3B82F6' text={t('protectedRoute.back')} onPress={() => onBack()} />}

                <View className="flex-1 justify-center items-center bg-white px-6 ">

                    <View className="items-center max-w-md">
                        {/* Lock Icon */}
                        <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center mb-6">
                            <Text className="text-5xl">🔒</Text>
                        </View>

                        {/* Title */}
                        <Text className="text-2xl font-bold text-text mb-3 text-center">
                            {t('protectedRoute.authentication_require')}
                        </Text>

                        {/* Message */}
                        <Text className="text-body text-textSecondary text-center mb-8 leading-6">
                            {fallbackMessage || t('protectedRoute.signInToAccess')}

                        </Text>
                        {/* Create Account Button */}

                        <TouchableOpacity
                            onPress={handleGoogleLoginPresss}
                            //   disabled={googleloading}
                            className="flex-row justify-center items-center border border-border p-6 rounded-2xl bg-background mb-4"
                        >
                            {googleloading ? (
                                <ActivityIndicator color="#DB4437" />
                            ) : (
                                <>
                                    <FontAwesome name="google" size={18} color="#DB4437" style={{ marginRight: 10 }} />
                                    <Text className="text-textSecondary font-medium">{t('protectedRoute.googleLogin')}</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {/* Sign In Button */}
                        {onSignInPress && (
                            <TouchableOpacity
                                // onPress={onSignInPress}
                                onPress={
                                    onSignInPress
                                }
                                className="bg-primary px-8 py-4 rounded-lg w-full mb-3"
                                activeOpacity={0.8}
                            >
                                <Text className="text-white font-semibold text-body text-center">
                                    {t('protectedRoute.signIn')}
                                </Text>
                            </TouchableOpacity>
                        )}


                        {/* Help Text */}
                        <View className='flex-row items-center mt-6 gap-2'>
                            <Text className="text-body text-gray-500 text-center ">
                                {t('protectedRoute.newhere')}
                            </Text>
                            {onSignUpPress && (
                                <TouchableOpacity
                                    onPress={onSignUpPress}
                                    activeOpacity={0.8}
                                >
                                    <Text className="text-primary font-semibold text-body">
                                        {t('protectedRoute.singup_to_start')}
                                    </Text>
                                </TouchableOpacity>
                            )}

                        </View>
                    </View>
                </View>
            </ScreenWrapper >
        );
    }

    // User is authenticated, render the protected content
    return <>{children}</>;
};

export default ProtectedRoute;