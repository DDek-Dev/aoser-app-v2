import axios from 'axios';
import { t } from 'i18next';
import { AuthResponse, LoginFormData, OTPVerifyData, Tokens, ForgotPasswordFormData, ResetPasswordFormData, GoogleLoginFormData } from 'types/auth';
import networkCheck from './networkCheck';


const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
// const API_BASE_URL = "http://192.168.0.185:8000"

export const authApi = {


    // Regular login
    login: async (formData: LoginFormData): Promise<AuthResponse> => {
        try {
            if (!API_BASE_URL) {
                throw new Error('API base URL is not configured');
            }

            const response = await fetchWithTimeout(
                `${API_BASE_URL}/auth/login`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData),
                },
                15000 // 15 second timeout
            );

           
            // Handle HTTP errors (404, 500, etc.)
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new errorData
            }

            return await response.json();
        } catch (error: any) {

            // Provide more specific error messages
            if (error.name === 'AbortError') {
                throw new Error(t('errors.networkTimeout'));
            }
            if (error.message.includes('Failed to fetch')) {
                throw new Error(t('errors.networkConnection'));
            }

            throw new Error(error.message || t('errors.loginFailed'));
        }
    },

    // Google login - get URL
     handleGoogleLogin : async (idToken: string) : Promise<any>=> {
        try {
            
            const res = await networkCheck.post(`${API_BASE_URL}/auth/google/login`, { idToken });
            return res.data;
        } catch (err: any) {
            console.log(err.message);

        }

    },
     handleApplelogin : async (data: string) : Promise<any>=> {
        try {
            
            const res = await networkCheck.post(`${API_BASE_URL}/auth/apple/login`,  data );
            return res.data;
        } catch (err: any) {
            console.log(err.message);

        }

    },


    
    
    // Handle Google callback


    // Send OTP for signup
    sendSignupOTP: async (email: string): Promise<{ success: boolean; message: string }> => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/signUp-otp`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to send OTP');
            }

            return data;
        } catch (error: any) {
            console.log("Send OTP error:", {
                message: error.message,
                stack: error.stack
            });
            throw new Error(error.message || t('errors.sendOTPFailed'));
        }
    },
    deleteAccount: async (token: string): Promise<{ success: boolean; message: string }> => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/delete-me`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Aoser ${token}`
                }
                
             
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete account');
            }

            return data;
        } catch (error: any) {
            console.log("Delete account error:", {
                message: error.message,
                stack: error.stack
            });
            throw new Error(error.message );
        }
    },

    // Verify OTP and complete signup
    verifySignupOTP: async (formData: OTPVerifyData): Promise<AuthResponse> => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/signUp-verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'OTP verification failed');
            }

            return data;
        } catch (error: any) {
            console.log('OTP verification error:', {
                message: error.message,
                stack: error.stack
            });
            throw new Error(error.message || t('errors.otpVerificationFailed'));
        }
    },

    // Forgot password - send OTP
    forgotPwOTP: async (email: string): Promise<{ success: boolean; message: string }> => {
        const response = await fetch(`${API_BASE_URL}/auth/forgot-password-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data.success) {
            // ❌ reject → triggers onError
            throw new Error(data.message || 'Failed to send OTP');
        }

        return data; // ✅ only resolves if success
    },


    // Reset password with OTP
    resetPassword: async (formData: ResetPasswordFormData): Promise<{ success: boolean; message: string }> => {
        try {
            console.log('Attempting to reset password with URL:', `${API_BASE_URL}/auth/update-password`);

            const response = await fetch(`${API_BASE_URL}/auth/update-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Password reset failed');
            }
            console.log('Password reset response:', data);

            return data;
        } catch (error: any) {
            console.log('Password reset error:', {
                message: error.message,
                stack: error.stack,
                url: `${API_BASE_URL}/auth/update-password`
            });
            throw new Error(error.message || t('errors.passwordResetFailed'));
        }
    },

    // Refresh token
    refreshToken: async (refreshToken: string): Promise<Tokens> => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Token refresh failed');
            }

            return {
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
            };
        } catch (error: any) {
            console.log('Token refresh error:', {
                message: error.message,
                stack: error.stack
            });
            throw new Error(error.message || t('errors.tokenRefreshFailed'));
        }
    },
};


const fetchWithTimeout = async (url: string, options: RequestInit, timeout = 10000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
};