import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Platform,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Keyboard,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FormInput from 'components/ui/Input';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SelectInput from 'components/ui/SelectInput';
import { getCategories } from 'hooks/useFreelancer';
import TextArea from 'components/ui/TextArea';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import Header_back from 'components/ui/Header_back';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

const AskAQuestionScreen = () => {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [question, setQuestion] = useState('');
    const [errors, setErrors] = useState({ 
        name: false, 
        email: false, 
        category: false, 
        question: false 
    });
    const [subcategories, setSubcategories] = useState<string[]>([]);
    const [category, setCategory] = useState('');
    const categories = getCategories();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();

    const handleFileAttach = () => {
        // File picker logic here
        console.log('File attach clicked');
    };

    const handleSubmit = () => {
        // Validate form
        const newErrors = {
            name: !name.trim(),
            email: !email.trim(),
            category: !category,
            question: !question.trim(),
        };
        
        setErrors(newErrors);
        
        if (Object.values(newErrors).some(error => error)) {
            return;
        }
        
        // Submit logic
        console.log('Form submitted:', { name, email, category, question });
        // Add your API call here
    };

    const handleQuickAnswerPress = (item: string) => {
        // Handle quick answer selection
        console.log('Quick answer selected:', item);
        // You can navigate to FAQ or show answer modal
    };

    return (
        <ScreenWrapper safeEdges={['top']}>
            <Header_back 
                text={t('askQuestion.title')} 
                onPress={() => navigation.goBack()} 
                iconColor='#3B82F6' 
                backgroundColor='bg-surface' 
            />

            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
                    style={{ flex: 1, backgroundColor: 'white' }}
                >
                    <ScrollView 
                        className="flex-1 bg-surface"
                        contentContainerStyle={{ 
                            paddingHorizontal: 16,
                            paddingBottom: insets.bottom + 100,
                            paddingTop: 20,
                        }}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Description */}
                        <Text className="text-body text-textSecondary mb-6">
                            {t('askQuestion.description')}
                        </Text>

                        {/* Name */}
                        <FormInput
                            label={t('askQuestion.nameLabel')}
                            placeholder={t('askQuestion.namePlaceholder')}
                            value={name}
                            onChangeText={setName}
                            inputClassName={` ${errors.name ? 'border-error' : 'border-border'}`}
                            // error={errors.name ? t('askQuestion.errors.nameRequired') : ''}
                            required
                        />

                        {/* Email */}
                        <View className="mt-4">
                            <FormInput
                                label={t('askQuestion.emailLabel')}
                                placeholder={t('askQuestion.emailPlaceholder')}
                                value={email}
                                onChangeText={setEmail}
                                inputClassName={` ${errors.email ? 'border-error' : 'border-border'}`}
                                // error={errors.email ? t('askQuestion.errors.emailRequired') : ''}
                                required
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                               
                            />
                        </View>

                        {/* Category */}
                        <View className='mt-4'>
                            <SelectInput
                                label={t('askQuestion.categoryLabel')}
                                value={category}
                                inputClassName={`rounded-3xl ${errors.category ? 'border-error' : 'border-border'}`}
                                onSelect={(serviceTypeId, jobIds) => {
                                    setCategory(serviceTypeId);
                                    setSubcategories(jobIds);
                                    if (errors.category) {
                                        setErrors(prev => ({ ...prev, category: false }));
                                    }
                                }}
                                required
                                // error={errors.category ? t('askQuestion.errors.categoryRequired') : ''}
                                // options={categories.map((category) => ({ 
                                //     name: category.name, 
                                //     icon: category.icon 
                                // }))}
                            />
                        </View>

                        {/* Question Box */}
                        <View className="mt-4">
                            <TextArea
                                label={t('askQuestion.questionLabel')}
                                placeholder={t('askQuestion.questionPlaceholder')}
                                value={question}
                                onChangeText={(text) => {
                                    setQuestion(text);
                                    if (errors.question) {
                                        setErrors(prev => ({ ...prev, question: false }));
                                    }
                                }}
                                inputClassName={`rounded-3xl ${errors.question ? 'border-error' : 'border-border'}`}
                                required
                                // error={errors.question ? t('askQuestion.errors.questionRequired') : ''}
                                // numberOfLines={4}
                            />
                        </View>

                        {/* File Upload */}
                        <TouchableOpacity
                            onPress={handleFileAttach}
                            className="mt-6 border border-primary border-dashed bg-[#E8F0FE] p-4 rounded-xl flex-row items-center"
                        >
                            <Ionicons name="attach" size={20} color="#3B82F6" />
                            <Text className="ml-2 text-primary font-medium text-base">
                                {t('askQuestion.attachFile')}
                            </Text>
                        </TouchableOpacity>

                        {/* Submit Button */}
                        <TouchableOpacity
                            onPress={handleSubmit}
                            className="bg-primary py-4 mt-8 rounded-full items-center"
                            activeOpacity={0.8}
                        >
                            <Text className="text-white font-semibold text-base">
                                {t('askQuestion.submitButton')}
                            </Text>
                        </TouchableOpacity>

                        {/* Quick Answers */}
                        <View className="mt-10 bg-[#E8F0FE] p-5 rounded-2xl">
                            <Text className="text-warning text-base font-semibold mb-4">
                                {t('askQuestion.quickAnswersTitle')}
                            </Text>
                            {[
                                t('askQuestion.quickAnswers.howItWorks'),
                                t('askQuestion.quickAnswers.howToBook'),
                                t('askQuestion.quickAnswers.howToTopUp'),
                                t('askQuestion.quickAnswers.accountIssues'),
                                t('askQuestion.quickAnswers.paymentIssues'),
                            ].map((item, index) => (
                                <TouchableOpacity 
                                    key={index} 
                                    className="flex-row justify-between items-center py-3 border-b border-border last:border-b-0"
                                    onPress={() => handleQuickAnswerPress(item)}
                                    activeOpacity={0.7}
                                >
                                    <Text className="text-text text-base flex-1">{item}</Text>
                                    <Ionicons name="chevron-forward" size={20} color="#3B82F6" />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
        </ScreenWrapper>
    );
};

export default AskAQuestionScreen;