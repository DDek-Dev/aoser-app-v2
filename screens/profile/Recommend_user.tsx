import { useState, useRef } from 'react';
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
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import Header_back from 'components/ui/Header_back';
import { useAuth } from 'hooks/useAuth';
import LoadingScreen from 'screens/Loading/LoadingScreen';

const STAR_PRICE = 5000; // 5,000 LAK per star

const starPackages = [
  { id: 1, stars: 1, popular: false },
  { id: 2, stars: 5, popular: false },
  { id: 3, stars: 10, popular: true },
  { id: 4, stars: 20, popular: false },
  { id: 5, stars: 50, popular: false },
];

const RecommendUser = () => {
  const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [customStars, setCustomStars] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInputType>(null);

  const {user} = useAuth();
  const formatCurrency = (amount: number) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' LAK';
  };

  const calculatePrice = (stars: number) => stars * STAR_PRICE;

  const getSelectedTotal = () => {
    if (selectedPackage) {
      const pkg = starPackages.find(p => p.id === selectedPackage);
      return pkg ? calculatePrice(pkg.stars) : 0;
    }
    if (customStars && parseInt(customStars) > 0) {
      return calculatePrice(parseInt(customStars));
    }
    return 0;
  };

  const getSelectedStars = () => {
    if (selectedPackage) {
      const pkg = starPackages.find(p => p.id === selectedPackage);
      return pkg ? pkg.stars : 0;
    }
    if (customStars && parseInt(customStars) > 0) {
      return parseInt(customStars);
    }
    return 0;
  };

  const handlePackageSelect = (id: number) => {
    setSelectedPackage(id);
    setCustomStars('');
    Keyboard.dismiss();
  };

  const handleCustomInput = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setCustomStars(numericValue);
    setSelectedPackage(null);
  };

  const handleInputFocus = () => {
    setIsKeyboardVisible(true);
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 350, animated: true });
    }, 300);
  };

  const handleInputBlur = () => {
    setIsKeyboardVisible(false);
  };

  if (!user) {
    return <LoadingScreen/>;
  }
  return (
    <ScreenWrapper safeEdges={['bottom', 'top']} style={{ flex: 1, backgroundColor: 'white' }}>
      <Header_back text="Buy star" onPress={() => navigation.goBack()} iconColor="#3B82F6" />
 
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
            {/* Info Banner */}
            <View className="bg-amber-50 border border-warning rounded-2xl p-4 mb-6">
              <View className="flex-row items-center gap-3 mb-2">
                <View className="bg-amber-100 p-2 rounded-full">
                  <Ionicons name="star" size={24} color="#F59E0B" />
                </View>
                <View className="flex-1">
                  <Text className="text-text font-bold text-body">Boost Your Profile</Text>
                  <Text className="text-textSecondary text-caption">Get recommended to more clients</Text>
                </View>
              </View>
              <Text className="text-textSecondary text-body leading-5">
                Stars help your profile appear higher in search results and recommendations. More stars = more visibility!
              </Text>
            </View>

            {/* Price Info */}
            <View className="flex-row items-center justify-center gap-2 mb-4">
              <Ionicons name="star" size={18} color="#F59E0B" />
              <Text className="text-text font-medium text-body">1 Star = {formatCurrency(STAR_PRICE)}</Text>
            </View>

            {/* Star Packages */}
            <Text className="text-textSecondary text-caption font-medium mb-3">Select a package</Text>

            <View className="flex-row flex-wrap justify-between mb-6">
              {starPackages.map((pkg) => (
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
                >
                  {pkg.popular && (
                    <View 
                      className="bg-warning px-2 py-1"
                      style={{ position: 'absolute', top: 0, right: 0, borderBottomLeftRadius: 8 }}
                    >
                      <Text className="text-white text-caption font-bold">POPULAR</Text>
                    </View>
                  )}
                  <View className="items-center">
                    <View className="flex-row items-center gap-1 mb-2">
                      <Ionicons name="star" size={20} color="#F59E0B" />
                      <Text className="text-text font-bold text-subheading">{pkg.stars}</Text>
                    </View>
                    <Text className="text-textSecondary text-caption">
                      {pkg.stars > 1 ? 'Stars' : 'Star'}
                    </Text>
                    <Text className="text-primary font-semibold text-body mt-2">
                      {formatCurrency(calculatePrice(pkg.stars))}
                    </Text>
                  </View>
                  {selectedPackage === pkg.id && (
                    <View style={{ position: 'absolute', top: 8, left: 8 }}>
                      <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Amount */}
            <Text className="text-textSecondary text-caption font-medium mb-3">Or enter custom amount</Text>

            <View className="bg-white border border-border rounded-xl p-4 mb-6">
              <View className="flex-row items-center gap-3">
                <View className="bg-amber-100 p-2 rounded-full">
                  <MaterialCommunityIcons name="calculator" size={20} color="#F59E0B" />
                </View>
                <View className="flex-1">
                  <Text className="text-textSecondary text-body mb-1">Number of stars</Text>
                  <TextInput
                    ref={inputRef}
                    className="text-text font-semibold text-[18px] border-b border-border pb-1"
                    placeholder="Enter amount"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={customStars}
                    onChangeText={handleCustomInput}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                  />
                </View>
                <View className="items-end">
                  <Text className="text-textSecondary text-caption">Total</Text>
                  <Text className="text-primary font-bold text-[16px]">
                    {customStars ? formatCurrency(calculatePrice(parseInt(customStars) || 0)) : '0 LAK'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Calculator Preview */}
            {getSelectedStars() > 0 && (
              <View className="bg-blue-50 border border-primary rounded-xl p-4 mb-6">
                <Text className="text-primary text-caption font-medium mb-3">Order Summary</Text>
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-text text-body">Stars</Text>
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="star" size={16} color="#F59E0B" />
                    <Text className="text-text font-semibold text-body">{getSelectedStars()}</Text>
                  </View>
                </View>
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-text text-body">Price per star</Text>
                  <Text className="text-text text-body">{formatCurrency(STAR_PRICE)}</Text>
                </View>
                <View className="border-t border-primary/30 my-2" />
                <View className="flex-row justify-between items-center">
                  <Text className="text-text font-bold text-[16px]">Total</Text>
                  <Text className="text-primary font-bold text-[18px]">{formatCurrency(getSelectedTotal())}</Text>
                </View>
              </View>
            )}

            {/* Benefits */}
            <View className="bg-gray-50 border border-border rounded-xl p-4 mb-6">
              <Text className="text-text font-semibold text-body mb-3">Benefits of Stars</Text>
              {[
                { icon: 'trending-up', text: 'Higher ranking in search results' },
                { icon: 'eye-outline', text: 'More profile visibility' },
                { icon: 'people-outline', text: 'Reach more potential clients' },
                { icon: 'shield-checkmark-outline', text: 'Stand out from competition' },
              ].map((benefit, index) => (
                <View key={index} className="flex-row items-center gap-3 mb-2">
                  <Ionicons name={benefit.icon as any} size={18} color="#3B82F6" />
                  <Text className="text-textSecondary text-body">{benefit.text}</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Buy Button - Fixed at bottom, stays on keyboard when visible */}
          <View 
            className={`bg-white border-t border-border px-4 py-3 ${
              isKeyboardVisible ? 'absolute bottom-0 left-0 right-0' : ''
            }`}
            style={{ 
              paddingBottom: Platform.OS === 'ios' ? (isKeyboardVisible ? 8 : 8) : 16,
              backgroundColor: 'white'
            }}
          >
            <TouchableOpacity
              className={`rounded-xl py-4 flex-row items-center justify-center gap-2 ${
                getSelectedStars() > 0 ? 'bg-primary' : 'bg-gray-300'
              }`}
              activeOpacity={0.8}
              disabled={getSelectedStars() === 0}
              onPress={() => {
                Keyboard.dismiss();
                // navigation.navigate('Payment', { stars: getSelectedStars(), total: getSelectedTotal() });
                navigation.navigate('PaymentScreen', { workId: user._id, budget: getSelectedTotal(), currency: "LAK" , terminalid: user.userCode , invoiceType: "USER_RECOMMEND_STAR" });

                // console.log('Purchasing', getSelectedStars(), 'stars for', getSelectedTotal(), 'LAK');
              }}
            >
              <Ionicons name="star" size={20} color="white" />
              <Text className="text-white font-bold text-[16px]">
                {getSelectedStars() > 0
                  ? `Buy ${getSelectedStars()} Star${getSelectedStars() > 1 ? 's' : ''} - ${formatCurrency(getSelectedTotal())}`
                  : 'Select Stars to Continue'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default RecommendUser;