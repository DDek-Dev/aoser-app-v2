
import { UserProfile } from "./profile";

export type AuthResponse = {
  success: boolean;
  message: string;
  data: {
    userData?: UserProfile;
    user?: UserProfile;
    accessToken: string;
    refreshToken: string;
  };
};

export type LoginFormData = {
  email: string;
  password: string;
};
export type GoogleLoginFormData = {
  idToken: string;
}
export type OTPRequestData = {
  email: string;
};

export type OTPVerifyData = {
  email: string;
  otp: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  firstName: string;
  lastName: string;
  password: string;
};

export type ForgotPasswordFormData = {
  email: string;
};

export type ResetPasswordFormData = {
  email: string;
  otp: string;
  newPassword: string;
};

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}


