import  { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TextInput,
    ActivityIndicator,
    Keyboard,
    TouchableWithoutFeedback,
    Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FormInput from 'components/ui/Input';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import { useAuth } from 'hooks/useAuth'; // Adjust import path
import { ResetPasswordFormData } from 'types/auth';
import Header_back from 'components/ui/Header_back';
import { useNavigation } from '@react-navigation/native';
import { ALERT_TYPE, Toast } from 'react-native-alert-notification';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';
import { useTranslation } from 'react-i18next';

const ForgotPasswordScreen = () => {
   
    const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
    const { forgotPWOTP, forgotPwIsLoading, resetPassword, resetPasswordLoading } = useAuth();

    // Step management
    const [currentStep, setCurrentStep] = useState<1 | 2>(1);

    // Form state
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Timer for resend OTP
    // const [resendTimer, setResendTimer] = useState(0);
    const countdownRef = useRef<NodeJS.Timeout | null>(null);
    const [countdown, setCountdown] = useState(60);


    const otpRefs = Array.from({ length: 6 }, () => useRef<TextInput>(null));
    const otpValues = useRef(Array(6).fill(''));
    const { t } = useTranslation();
    // Validation errors
    const [errors, setErrors] = useState({
        email: '',
        otp: '',
        newPassword: '',
        confirmPassword: '',
    });


    // Start countdown timer on component mount
    useEffect(() => {
        startCountdown();
        return () => {
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, []);

    const startCountdown = () => {
        setCountdown(60);
        if (countdownRef.current) clearInterval(countdownRef.current);

        countdownRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    if (countdownRef.current) clearInterval(countdownRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    // Validation functions
    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim()) return `${t('signUpScreen.email_required')}`;
        if (!emailRegex.test(email)) return `${t('changePassword.errors.invalidEmail')}`;
        return '';
    };

    const validateOTP = (otp: string) => {
        if (!otp.trim()) return `${t('forgotPassword.opt_requird')}`;
        if (otp.length !== 6) return `${t('otpScreen.otp_length')}`;
        if (!/^\d+$/.test(otp)) return `${t('forgotPassword.opt_must_number')}`;
        return '';
    };

    const validatePassword = (password: string) => {
        if (!password) return `${t('signUpScreen.password_required')}`;
        // if (password.length < 8) return 'Password must be at least 8 characters';
        // if (!/(?=.*[a-z])/.test(password)) return 'Password must contain at least one lowercase letter';
        // if (!/(?=.*[A-Z])/.test(password)) return 'Password must contain at least one uppercase letter';
        // if (!/(?=.*\d)/.test(password)) return 'Password must contain at least one number';
        return '';
    };

    const validateConfirmPassword = (confirmPassword: string, password: string) => {
        if (!confirmPassword) return  `${t('signUpScreen.rePassword_required')}`;
        if (confirmPassword !== password) return `${t('changePassword.errors.passwordsNotMatch')}`;
        return '';
    };

    // Clear specific error
    const clearError = (field: keyof typeof errors) => {
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    // Step 1: Send OTP to email
    const handleSendOTP = async () => {
        const emailError = validateEmail(email);

        if (emailError) {
            setErrors(prev => ({ ...prev, email: emailError }));
            return;
        }

        forgotPWOTP(email, {

            onSuccess: (data) => {
                data.success
                setCurrentStep(2);
                // startResendTimer();

                Toast.show({
                    type: ALERT_TYPE.SUCCESS,
                    title: `${t('forgotPassword.otpSentTitle')}`,
                    textBody: `${t('forgotPassword.otpSentMessage')}`,

                });
            },
            onError: (error: any) => {

                setCurrentStep(1);

                Toast.show({
                    type: ALERT_TYPE.DANGER,
                    title: `${t('forgotPassword.errorTitle')}`,
                    textBody: `${t('forgotPassword.userNotFound')}`,
                    // button: 'close',

                })
            },
        });
    };

    // Resend OTP
    const handleResendOTP = async () => {
        if (countdown > 0 || forgotPwIsLoading) return;
        startCountdown();
        forgotPWOTP(email, {
            onSuccess: (data) => {
                // startResendTimer();
                // Alert.alert('OTP Sent', data.message || 'A new verification code has been sent to your email.');
                Toast.show({
                    type: ALERT_TYPE.SUCCESS,
                    title: `${t('forgotPassword.otpSentTitle')}`,
                    textBody: `${t('forgotPassword.otpResendMessage')}`
                    // button: 'close',
                })
            },
            onError: (error: any) => {
                // Alert.alert('Error', error.message || 'Failed to resend OTP. Please try again.');
                Toast.show({
                    type: ALERT_TYPE.DANGER,
                    title: `${t('forgotPassword.errorTitle')}`,
                    textBody: `${t('forgotPassword.resendFailed')}`,
                    // button: 'close',
                })
            },
        });
    };

    // Step 2: Reset password with OTP
    const handleResetPassword = async () => {
        const otpError = validateOTP(otp);
        const passwordError = validatePassword(newPassword);
        const confirmPasswordError = validateConfirmPassword(confirmPassword, newPassword);

        const newErrors = {
            ...errors,
            otp: otpError,
            newPassword: passwordError,
            confirmPassword: confirmPasswordError,
        };

        setErrors(newErrors);

        if (otpError || passwordError || confirmPasswordError) {
            return;
        }

        const formData: ResetPasswordFormData = {
            email,
            newPassword,
            otp,
        };

        resetPassword(formData, {
            onSuccess: (data) => {
                
                Toast.show({
                    type: ALERT_TYPE.SUCCESS,
                    title: `${t('forgotPassword.successTitle')}`,
                    textBody: `${t('forgotPassword.password_reset_success')}`,
                })

                setTimeout(() => {

                    navigation.popTo('SignIn'); // navigate manually
                }, 500);

            },
            onError: (error: any) => {
                Toast.show({
                    type: ALERT_TYPE.DANGER,
                    title: `${t('forgotPassword.successTitle')}`,
                    textBody:  `${t('forgotPassword.otpIncorrect')}`,
                    // button: 'close',
                })

            },
        });
    };

    // Handle OTP input change
    const handleOtpChange = (text: string, index: number) => {
        if (/^\d$/.test(text)) {
            otpValues.current[index] = text;
            const otpString = otpValues.current.join('');
            setOtp(otpString);
            clearError('otp');

            // Move to next input
            if (index < 5) {
                otpRefs[index + 1].current?.focus();
            }
        } else if (text === '') {
            otpValues.current[index] = '';
            const otpString = otpValues.current.join('');
            setOtp(otpString);
            clearError('otp');

            // Auto-focus to previous input
            if (index > 0) {
                otpRefs[index - 1].current?.focus();
                otpValues.current[index - 1] = '';
                setOtp(otpValues.current.join(''));
            }
        }
    };

    // Get loading states from mutations
    const isSendingOTP = forgotPwIsLoading;
    const isResettingPassword = resetPasswordLoading;

    const renderStep1 = () => (
        <View className="flex-1">

            <View>


                {/* Header */}
                <View className="items-center mb-8">
                    <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center mb-4">
                        <Ionicons name="mail-outline" size={32} color="#3B82F6" />
                    </View>
                    <Text className="text-heading text-text text-center mb-2">
                       {t('forgotPassword.send_otp_request')}
                    </Text>
                    <Text className="text-body text-textSecondary text-center px-4">
                       {t('forgotPassword.subtitle')}
                        
                    </Text>
                </View>

                {/* Email Input */}
                <FormInput
                    label={t('forgotPassword.emailLabel')}
                    placeholder="Aoser@example.com"
                    value={email}
                    onChangeText={(text) => {
                        setEmail(text);
                        clearError('email');
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    required
                    inputClassName={errors.email ? 'border-error' : 'border-border'}
                    isValidate={errors.email}
                    editable={!isSendingOTP}
                />


            </View>


        </View>
    );

    const renderStep2 = () => (
        <View className="flex-1">
            {/* Header */}
            <View className="items-center">
                <View className="w-20 h-20 bg-secondary/10 rounded-full items-center justify-center mb-4">
                    <Ionicons name="shield-checkmark-outline" size={32} color="#10B981" />
                </View>
                <Text className="text-heading text-text text-center mb-2">
                    {t('forgotPassword.verificationTitle')}
                </Text>
                <Text className="text-body text-textSecondary text-center px-4 mb-6">
                    {t('forgotPassword.verificationSubtitle')}    
                 </Text>
            </View>



            {/* OTP Input */}
            <View className="mb-6">
                <Text className="text-body text-text mb-4 font-bold">
                    {t('forgotPassword.verificationCodeLabel')}  <Text className="text-error">*</Text>
                </Text>

                <View className="flex-row justify-between mb-2 items-center">
                    {otpRefs.map((ref, i) => (
                        <TextInput
                            key={i}
                            ref={ref}
                            maxLength={1}
                            keyboardType="numeric"
                            className={`text-lg text-center w-12 text-text h-12 rounded-full border ${errors.otp ? 'border-error' : 'border-border'
                                }`}
                            style={{ textAlignVertical: 'center', lineHeight: 20 }}
                            value={otpValues.current[i]}
                            onChangeText={(text) => handleOtpChange(text, i)}
                            onKeyPress={({ nativeEvent }) => {
                                if (nativeEvent.key === 'Backspace') {
                                    if (otpValues.current[i]) {
                                        otpValues.current[i] = '';
                                    } else if (i > 0) {
                                        otpRefs[i - 1].current?.focus();
                                        otpValues.current[i - 1] = '';
                                    }
                                    const otpString = otpValues.current.join('');
                                    setOtp(otpString);
                                    clearError('otp');
                                }
                            }}
                            editable={!isResettingPassword}
                        />
                    ))}
                </View>

                {errors.otp && (
                    <Text className="text-caption text-error mt-1">{errors.otp}</Text>
                )}
            </View>

            {/* Resend OTP */}
            <View className="flex-row justify-end mb-6">
                <Text className="text-body text-textSecondary">
                    {t('forgotPassword.didntReceive')}{' '}
                </Text>
                <TouchableOpacity
                    onPress={handleResendOTP}
                    disabled={countdown > 0 || isSendingOTP}
                >
                    {isSendingOTP ? (
                        <ActivityIndicator size="small" color="#3B82F6" />
                    ) : countdown > 0 ? (
                        <Text className="text-body font-semibold text-textSecondary">
                            {t('forgotPassword.resendTimer')}  {countdown} s
                        </Text>
                    ) : (
                        <Text className="text-body font-semibold text-primary">
                           {t('forgotPassword.sendAgain')}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>



            {/* New Password Input */}
            <View className="mt-6 relative">
                <FormInput
                    label={t('forgotPassword.newPasswordLabel')}
                    placeholder={t('forgotPassword.newPasswordPlaceholder')}
                    value={newPassword}
                    onChangeText={(text) => {
                        setNewPassword(text);
                        clearError('newPassword');
                        // Clear confirm password error if passwords now match
                        if (confirmPassword && text === confirmPassword) {
                            clearError('confirmPassword');
                        }
                    }}
                    secureTextEntry={!showPassword}
                    required
                    inputClassName={errors.newPassword ? 'border-error' : 'border-border'}
                    isValidate={errors.newPassword}
                    editable={!isResettingPassword}
                />
                <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-12"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#6B7280"
                    />
                </TouchableOpacity>
            </View>

            {/* Confirm Password Input */}
            <View className="mt-4 relative">
                <FormInput
                    label={t('forgotPassword.confirmPasswordLabel')}
                    placeholder={t('forgotPassword.confirmPasswordPlaceholder')}
                    value={confirmPassword}
                    onChangeText={(text) => {
                        setConfirmPassword(text);
                        clearError('confirmPassword');
                    }}
                    secureTextEntry={!showConfirmPassword}
                    required
                    inputClassName={errors.confirmPassword ? 'border-error' : 'border-border'}
                    isValidate={errors.confirmPassword}
                    editable={!isResettingPassword}
                />
                <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-12"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons
                        name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#6B7280"
                    />
                </TouchableOpacity>
            </View>



            {/* Change Email */}
            <TouchableOpacity
                onPress={() => {
                    setCurrentStep(1);
                    setOtp('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setErrors({
                        email: '',
                        otp: '',
                        newPassword: '',
                        confirmPassword: '',
                    });

                }}
                className="mt-4"
                disabled={isResettingPassword}
            >
                <Text className="text-body text-primary text-center font-semibold">
                   {t('forgotPassword.changeEmail')}
                </Text>
            </TouchableOpacity>
        </View>
    );

    const handleBack = () => {
        navigation.goBack();
    };

    return (
        <ScreenWrapper safeEdges={['top', 'bottom']}>

            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>


                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
                    style={{ flex: 1, backgroundColor: 'white' }}
                >
                    <Header_back
                        text={currentStep === 1 ? `${t('forgotPassword.title')}` : `${t('forgotPassword.resetButton')}`}
                        onPress={handleBack}
                        iconColor='#3B82F6'
                        backgroundColor='bg-surface'
                    />

                    <ScrollView >
                        <View className="flex-1 px-5 pt-8">
                            {currentStep === 1 ? renderStep1() : renderStep2()}
                        </View>
                    </ScrollView>
                    <View className='px-4 mb-4'>

                        {currentStep === 1 ?

                            <Pressable
                                onPress={handleSendOTP}
                                className={`${isSendingOTP ? 'bg-primary/50' : 'bg-primary'} py-4 rounded-xl items-center mt-6`}
                                disabled={isSendingOTP}
                            >
                                <Text className="text-body text-white font-semibold">
                                    {isSendingOTP ? <ActivityIndicator color="white" /> : `${t('forgotPassword.sendButton')}`}
                                </Text>
                            </Pressable>

                            :

                            <Pressable
                                onPress={handleResetPassword}
                                className={`${isResettingPassword ? 'bg-primary/50' : 'bg-primary'} py-4 rounded-xl items-center mt-8`}
                                disabled={isResettingPassword}
                            >
                                <Text className="text-body text-white font-semibold">
                                    {isResettingPassword ? <ActivityIndicator color="white" /> : `${t('forgotPassword.resetButton')}`}
                                </Text>
                            </Pressable>
                        }
                    </View>

                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
        </ScreenWrapper>
    );
};

export default ForgotPasswordScreen;



// Submit Button Component
type SubmitButtonProps = {
    onPress: () => void;
    loading: boolean;
    disabled: boolean;
};

function SubmitButton({ onPress, loading, disabled }: SubmitButtonProps) {
    const { t } = useTranslation();
    return (
        <Pressable
            onPress={onPress}
            className={`py-4 rounded-2xl items-center justify-center ${disabled ? 'bg-gray-400' : 'bg-blue-600'
                }`}
            disabled={disabled}
        >
            {loading ? (
                <View className="flex-row items-center">
                    <ActivityIndicator color="white" size="small" />
                    <Text className="text-surface font-semibold ml-2">
                       {t('forgotPassword.sending')}
                    </Text>
                </View>
            ) : (
                <Text className="text-surface font-semibold text-center">
                    {t('forgotPassword.send_otp_request')}
                </Text>
            )}
        </Pressable>
    );
}