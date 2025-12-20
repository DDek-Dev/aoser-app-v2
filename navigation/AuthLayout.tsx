import React, { ReactNode } from 'react';
import {
    View,
    TouchableWithoutFeedback,
    Keyboard,
    Platform,
    ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

interface AuthLayoutProps {
    children: ReactNode;
    scrollable?: boolean;
}

export default function AuthLayout({ children, scrollable = false }: AuthLayoutProps) {
    const insets = useSafeAreaInsets();

    const content = scrollable ? (
        <ScrollView 
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
        >
            {children}
        </ScrollView>
    ) : (
        <View style={{ flex: 1 }}>
            {children}
        </View>
    );

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1, backgroundColor: 'white' }}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={0}
                >
                    <View style={{ flex: 1 }}>
                        {content}
                        
                        {/* Bottom inset with black background */}
                        <View 
                            style={{ 
                                height: insets.bottom, 
                                backgroundColor: 'black' 
                            }} 
                        />
                    </View>
                </KeyboardAvoidingView>
            </View>
        </TouchableWithoutFeedback>
    );
}