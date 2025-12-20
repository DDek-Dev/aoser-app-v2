// // contexts/AuthContext.tsx
// import React, { createContext, useContext, ReactNode } from 'react';
// import { useAuth } from '../hooks/useAuth';

// interface AuthContextType {
//   user: any;
//   tokens: any;
//   isAuthenticated: boolean;
//   isLoadingAuth: boolean;
//   login: any;
//   logout: any;
//   googleLogin: any;
//   signupOTPRequest: (email: string) => Promise<any>;
//   signupWithOTP: (data: any) => Promise<any>;
//   forgotPWOTP: any;
//   resetPassword: any;
//   refreshToken: any;
//   // Loading states
//   loginLoading: boolean;
//   otpSendLoading: boolean;
//   otpVerifyLoading: boolean;
//   forgotPwIsLoading: boolean;
//   resetPasswordLoading: boolean;
//   logoutLoading: boolean;
//   googleloading: boolean;
//   // Error states
//   loginError: any;
//   otpSendError: any;
//   otpVerifyError: any;
//   resetPasswordError: any;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// interface AuthProviderProps {
//   children: ReactNode;
// }

// export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
//   const auth = useAuth();

//   return (
//     <AuthContext.Provider value={auth}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuthContext = () => {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuthContext must be sused within an AuthProvider');
//   }
//   return context;
// };


// contexts/AuthContext.tsx
import React, { createContext, useContext } from 'react';
import { useAuth } from 'hooks/useAuth';

const AuthContext = createContext<ReturnType<typeof useAuth> | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const auth = useAuth();
    
    return (
        <AuthContext.Provider value={auth}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuthContext must be used within AuthProvider');
    }
    return context;
};