// BudgetInput.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react'; // Add useEffect
import { useTranslation } from 'react-i18next';
import { View, TextInput, Text, TouchableOpacity, Pressable } from 'react-native';

type Currency = 'LAK' | 'USD';


type Props = {
    label?: string;
    value: number | null; // Allow null
    onChange: (value: number) => void;
    currency: Currency;
    onCurrencyChange: (currency: Currency) => void;
    error?: boolean;
    required?: boolean;
    isValidate?: string;
    classNamebuget?: string,
    isChange?: boolean,
    rateType?: 'PER_HOUR' | 'PER_JOB' | 'PER_DAY';
    setRateType?: (rateType: 'PER_HOUR' | 'PER_JOB' | 'PER_DAY') => void;
    isRateTypeShow?: boolean;
};


const formatNumber = (input: string): string => {
    const numeric = input.replace(/[^\d]/g, '');
    return numeric.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const parseNumber = (formatted: string): number | null => {
    const cleaned = formatted.replace(/,/g, '');
    if (cleaned === '' || cleaned === '0') return null; // Return null for empty or zero
    return parseInt(cleaned, 10);
};

const BudgetInput: React.FC<Props> = ({
    label,
    value,
    onChange,
    currency = 'LAK',
    onCurrencyChange,
    error,
    required,
    isValidate,
    classNamebuget,
    isChange
}) => {
    const [displayValue, setDisplayValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const { t } = useTranslation();
    const handleBlur = () => {
        setIsFocused(false);
        // Clear display if value is null or empty
        if (value !== null && value !== undefined && value !== 0) {
            setDisplayValue(formatNumber(value.toString()));
        } else {
            setDisplayValue(''); // Clear if no value
        }
    };
    // Sync with external value changes
    useEffect(() => {
        if (!isFocused) {
            if (value !== null && value !== undefined && value !== 0) {
                setDisplayValue(formatNumber(value.toString()));
            } else {
                setDisplayValue('');
            }
        }
    }, [value, isFocused]);

    const handleTextChange = (text: string) => {
        const formatted = formatNumber(text);
        setDisplayValue(formatted);

        const numericValue = parseNumber(formatted);

        onChange(numericValue || 0);
    };


    return (
        <View className={` ${classNamebuget}`}>
            <View className='flex-row gap-4'>
                <Text className="text-body text-text font-bold mb-1 flex">
                    {label} {required && <Text className="text-error">*</Text>}
                </Text>

                {isChange ? (

                    <Text className='text-caption text-textSecondary '>{t('kyc.step3.click_change_currency')}</Text>
                ) : null}
            </View>
            

            <View className={`flex-row border rounded-xl items-center overflow-hidden ${error ? 'border-error' : 'border-border'
                } ${isFocused && 'border-primary'}`}>
                <TouchableOpacity
                    onPress={() => onCurrencyChange(currency === 'LAK' ? 'USD' : 'LAK')}
                    className='h-full w-20 flex-row items-center justify-center py-4'
                >
                    {/* <Text className="mr-2 text-warning font-bold">{currency}</Text> */}
                    <Text className="mr-2 text-warning font-bold">LAK</Text>
                </TouchableOpacity>
                <TextInput
                    keyboardType="numeric"
                    value={displayValue}
                    onChangeText={handleTextChange}
                    placeholder={t('postWork.budget_placeholder')}
                    className="flex-1 text-text text-base px-4 py-3"
                    onFocus={() => setIsFocused(true)}
                    onBlur={handleBlur}
                    placeholderTextColor={'#6B7280'}

                />
            </View>
            {error && (
                <Text className='text-caption text-error mt-1'>{isValidate}</Text>
            )}
        </View>
    );
};

export default BudgetInput;