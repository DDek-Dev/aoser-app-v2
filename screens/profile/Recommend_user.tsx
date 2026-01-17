import { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  TextInput as TextInputType,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

// Components
import ScreenWrapper from 'components/ui/ScreenWrapper';
import Header_back from 'components/ui/Header_back';
import LoadingScreen from 'screens/Loading/LoadingScreen';

// Hooks
import { useAuth } from 'hooks/useAuth';

// Types
import { FreelancerStackParamList } from 'types/navigation';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface StarPackage {
  id: number;
  stars: number;
  popular: boolean;
}

interface BenefitItem {
  icon: string;
  textKey: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const STAR_PRICE = 5000; // 5,000 LAK per star

const STAR_PACKAGES: StarPackage[] = [
  { id: 1, stars: 1, popular: false },
  { id: 2, stars: 5, popular: false },
  { id: 3, stars: 10, popular: true },
  { id: 4, stars: 20, popular: false },
  { id: 5, stars: 50, popular: false },
];

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Format number as currency with LAK suffix
 * Example: 15000 -> "15,000 LAK"
 */
const formatCurrency = (amount: number): string => {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' LAK';
};

/**
 * Calculate total price based on number of stars
 */
const calculatePrice = (stars: number): number => stars * STAR_PRICE;

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * RecommendUser Component (Buy Star Screen)
 * 
 * Allows freelancers to purchase stars to boost their profile visibility.
 * 
 * Features:
 * - Predefined star packages (1, 5, 10, 20, 50 stars)
 * - Custom star amount input
 * - Real-time price calculation
 * - Order summary
 * - Benefits display
 * - Keyboard-aware UI
 * - Navigation to payment screen
 * 
 * Star Benefits:
 * - Higher ranking in search results
 * - Increased profile visibility
 * - Reach more potential clients
 * - Stand out from competition
 */
const RecommendUser = () => {
  // =================================================================
  // HOOKS
  // =================================================================
  const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
  const { t } = useTranslation();
  const { user } = useAuth();

  // =================================================================
  // STATE
  // =================================================================
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [customStars, setCustomStars] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // =================================================================
  // REFS
  // =================================================================
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInputType>(null);

  // =================================================================
  // MEMOIZED VALUES
  // =================================================================

  /**
   * Get the currently selected number of stars
   * Priority: Package selection > Custom input > 0
   */
  const selectedStars = useMemo(() => {
    if (selectedPackage) {
      const pkg = STAR_PACKAGES.find(p => p.id === selectedPackage);
      return pkg ? pkg.stars : 0;
    }
    if (customStars && parseInt(customStars) > 0) {
      return parseInt(customStars);
    }
    return 0;
  }, [selectedPackage, customStars]);

  /**
   * Calculate total price for selected stars
   */
  const totalPrice = useMemo(() => {
    return calculatePrice(selectedStars);
  }, [selectedStars]);

  /**
   * Check if user can proceed to payment
   */
  const canProceed = useMemo(() => selectedStars > 0, [selectedStars]);

  // =================================================================
  // HANDLERS
  // =================================================================

  /**
   * Handle predefined package selection
   * Clears custom input when package is selected
   */
  const handlePackageSelect = useCallback((id: number) => {
    setSelectedPackage(id);
    setCustomStars('');
    Keyboard.dismiss();
  }, []);

  /**
   * Handle custom star amount input
   * Only allows numeric values, clears package selection
   */
  const handleCustomInput = useCallback((value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setCustomStars(numericValue);
    setSelectedPackage(null);
  }, []);

  /**
   * Handle input focus - scroll to input and show keyboard
   */
  const handleInputFocus = useCallback(() => {
    setIsKeyboardVisible(true);
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 350, animated: true });
    }, 300);
  }, []);

  /**
   * Handle input blur - hide keyboard indicator
   */
  const handleInputBlur = useCallback(() => {
    setIsKeyboardVisible(false);
  }, []);

  /**
   * Navigate to payment screen with order details
   */
  const handleProceedToPayment = useCallback(() => {
    if (!canProceed || !user) return;

    Keyboard.dismiss();

    console.log('[BuyStar] Processing purchase:', {
      stars: selectedStars,
      total: totalPrice,
      userId: user._id,
    });

    navigation.navigate('PaymentScreen', {
      workId: user._id,
      budget: totalPrice,
      currency: 'LAK',
      terminalid: user.userCode,
      invoiceType: 'USER_RECOMMEND_STAR',
    });
  }, [canProceed, user, selectedStars, totalPrice, navigation]);

  /**
   * Go back to previous screen
   */
  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // =================================================================
  // LOADING STATE
  // =================================================================
  if (!user) {
    return <LoadingScreen />;
  }

  // =================================================================
  // BENEFITS DATA
  // =================================================================
  const benefits: BenefitItem[] = [
    { icon: 'trending-up', textKey: 'benefit_ranking' },
    { icon: 'eye-outline', textKey: 'benefit_visibility' },
    { icon: 'people-outline', textKey: 'benefit_reach' },
    { icon: 'shield-checkmark-outline', textKey: 'benefit_standout' },
  ];

  // =================================================================
  // RENDER
  // =================================================================
  return (
    <ScreenWrapper safeEdges={['bottom', 'top']} style={{ flex: 1, backgroundColor: 'white' }}>
      {/* ===== HEADER ===== */}
      <Header_back
        text={t('profile.buyStar.title')}
        onPress={handleGoBack}
        iconColor="#3B82F6"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={{ flex: 1 }}>
          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-4 pt-6"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: isKeyboardVisible ? 120 : 100 }}
          >
            {/* ===== INFO BANNER ===== */}
            <View className="bg-amber-50 border border-warning rounded-2xl p-4 mb-6">
              <View className="flex-row items-center gap-3 mb-2">
                <View className="bg-amber-100 p-2 rounded-full">
                  <Ionicons name="star" size={24} color="#F59E0B" />
                </View>
                <View className="flex-1">
                  <Text className="text-text font-bold text-body">
                    {t('profile.buyStar.banner_title')}
                  </Text>
                  <Text className="text-textSecondary text-caption">
                    {t('profile.buyStar.banner_subtitle')}
                  </Text>
                </View>
              </View>
              <Text className="text-textSecondary text-body leading-5">
                {t('profile.buyStar.banner_description')}
              </Text>
            </View>

            {/* ===== PRICE INFO ===== */}
            <View className="flex-row items-center justify-center gap-2 mb-4">
              <Ionicons name="star" size={18} color="#F59E0B" />
              <Text className="text-text font-medium text-body">
                {t('profile.buyStar.price_per_star', { price: formatCurrency(STAR_PRICE) })}
              </Text>
            </View>

            {/* ===== STAR PACKAGES ===== */}
            <Text className="text-textSecondary text-caption font-medium mb-3">
              {t('profile.buyStar.select_package_label')}
            </Text>

            <View className="flex-row flex-wrap justify-between mb-6">
              {STAR_PACKAGES.map((pkg) => (
                <TouchableOpacity
                  key={pkg.id}
                  onPress={() => handlePackageSelect(pkg.id)}
                  activeOpacity={0.7}
                  className={`w-[48%] mb-3 rounded-xl border-2 p-4 ${
                    selectedPackage === pkg.id
                      ? 'border-primary bg-blue-50'
                      : 'border-border bg-white'
                  }`}
                  style={{ position: 'relative', overflow: 'hidden' }}
                  accessibilityRole="button"
                  accessibilityLabel={t('profile.buyStar.package_accessibility', {
                    stars: pkg.stars,
                    price: formatCurrency(calculatePrice(pkg.stars)),
                  })}
                >
                  {/* Popular Badge */}
                  {pkg.popular && (
                    <View
                      className="bg-warning px-2 py-1"
                      style={{ position: 'absolute', top: 0, right: 0, borderBottomLeftRadius: 8 }}
                    >
                      <Text className="text-white text-caption font-bold">
                        {t('profile.buyStar.popular_badge')}
                      </Text>
                    </View>
                  )}

                  {/* Package Content */}
                  <View className="items-center">
                    <View className="flex-row items-center gap-1 mb-2">
                      <Ionicons name="star" size={20} color="#F59E0B" />
                      <Text className="text-text font-bold text-subheading">{pkg.stars}</Text>
                    </View>
                    <Text className="text-textSecondary text-caption">
                      {pkg.stars > 1
                        ? t('profile.buyStar.stars_plural')
                        : t('profile.buyStar.star_singular')
                      }
                    </Text>
                    <Text className="text-primary font-semibold text-body mt-2">
                      {formatCurrency(calculatePrice(pkg.stars))}
                    </Text>
                  </View>

                  {/* Selected Indicator */}
                  {selectedPackage === pkg.id && (
                    <View style={{ position: 'absolute', top: 8, left: 8 }}>
                      <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* ===== CUSTOM AMOUNT INPUT ===== */}
            <Text className="text-textSecondary text-caption font-medium mb-3">
              {t('profile.buyStar.custom_amount_label')}
            </Text>

            <View className="bg-white border border-border rounded-xl p-4 mb-6">
              <View className="flex-row items-center gap-3">
                <View className="bg-amber-100 p-2 rounded-full">
                  <MaterialCommunityIcons name="calculator" size={20} color="#F59E0B" />
                </View>
                <View className="flex-1">
                  <Text className="text-textSecondary text-body mb-1">
                    {t('profile.buyStar.number_of_stars')}
                  </Text>
                  <TextInput
                    ref={inputRef}
                    className="text-text font-semibold text-[18px] border-b border-border pb-1"
                    placeholder={t('profile.buyStar.enter_amount_placeholder')}
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={customStars}
                    onChangeText={handleCustomInput}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                    accessibilityLabel={t('profile.buyStar.custom_input_accessibility')}
                  />
                </View>
                <View className="items-end">
                  <Text className="text-textSecondary text-caption">
                    {t('profile.buyStar.total_label')}
                  </Text>
                  <Text className="text-primary font-bold text-[16px]">
                    {customStars
                      ? formatCurrency(calculatePrice(parseInt(customStars) || 0))
                      : '0 LAK'
                    }
                  </Text>
                </View>
              </View>
            </View>

            {/* ===== ORDER SUMMARY ===== */}
            {selectedStars > 0 && (
              <View className="bg-blue-50 border border-primary rounded-xl p-4 mb-6">
                <Text className="text-primary text-caption font-medium mb-3">
                  {t('profile.buyStar.order_summary')}
                </Text>

                {/* Stars Row */}
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-text text-body">
                    {t('profile.buyStar.stars_label')}
                  </Text>
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="star" size={16} color="#F59E0B" />
                    <Text className="text-text font-semibold text-body">{selectedStars}</Text>
                  </View>
                </View>

                {/* Price per star Row */}
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-text text-body">
                    {t('profile.buyStar.price_per_star_label')}
                  </Text>
                  <Text className="text-text text-body">{formatCurrency(STAR_PRICE)}</Text>
                </View>

                {/* Divider */}
                <View className="border-t border-primary/30 my-2" />

                {/* Total Row */}
                <View className="flex-row justify-between items-center">
                  <Text className="text-text font-bold text-[16px]">
                    {t('profile.buyStar.total_label')}
                  </Text>
                  <Text className="text-primary font-bold text-[18px]">
                    {formatCurrency(totalPrice)}
                  </Text>
                </View>
              </View>
            )}

            {/* ===== BENEFITS SECTION ===== */}
            <View className="bg-gray-50 border border-border rounded-xl p-4 mb-6">
              <Text className="text-text font-semibold text-body mb-3">
                {t('profile.buyStar.benefits_title')}
              </Text>
              {benefits.map((benefit, index) => (
                <View key={index} className="flex-row items-center gap-3 mb-2">
                  <Ionicons name={benefit.icon as any} size={18} color="#3B82F6" />
                  <Text className="text-textSecondary text-body flex-1">
                    {t(`profile.buyStar.${benefit.textKey}`)}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* ===== BUY BUTTON - FIXED AT BOTTOM ===== */}
          <View
            className={`bg-white border-t border-border px-4 py-3 ${
              isKeyboardVisible ? 'absolute bottom-0 left-0 right-0' : ''
            }`}
            style={{
              paddingBottom: Platform.OS === 'ios' ? (isKeyboardVisible ? 8 : 8) : 16,
              backgroundColor: 'white',
            }}
          >
            <TouchableOpacity
              className={`rounded-xl py-4 flex-row items-center justify-center gap-2 ${
                canProceed ? 'bg-primary' : 'bg-gray-300'
              }`}
              activeOpacity={0.8}
              disabled={!canProceed}
              onPress={handleProceedToPayment}
              accessibilityRole="button"
              accessibilityLabel={
                canProceed
                  ? t('profile.buyStar.buy_button_enabled', {
                      stars: selectedStars,
                      price: formatCurrency(totalPrice),
                    })
                  : t('profile.buyStar.buy_button_disabled')
              }
            >
              <Ionicons name="star" size={20} color="white" />
              <Text className="text-white font-bold text-[16px]">
                {canProceed
                  ? t('profile.buyStar.buy_button_text', {
                      stars: selectedStars,
                      plural: selectedStars > 1 ? 's' : '',
                      price: formatCurrency(totalPrice),
                    })
                  : t('profile.buyStar.buy_button_disabled')
                }
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default RecommendUser;