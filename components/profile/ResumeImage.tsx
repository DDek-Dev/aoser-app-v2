import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, Text, View, Dimensions, StyleSheet } from 'react-native';

import { FreelancerStackParamList } from 'types/navigation';

const IMAGES_BASE_URL = process.env.EXPO_PUBLIC_IMAGES_URL


type Props = {
  resumeImage?: string;
  isReview?: boolean;
};

export default function ResumeImage({ resumeImage, isReview }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();

  const {t} = useTranslation();
  // Use screen width to maintain aspect ratio
  const screenWidth = Dimensions.get('window').width;
  const imageWidth = screenWidth; // 90% width
  const aspectRatio = 0.707; // Approx. A4 paper (1 / √2 ≈ 0.707)
  if (!resumeImage) {
    return (
 <View className="space-y-3">
        <View className='flex-row items-center gap-3 mt-4'>
          <View className='h-[1px] bg-primary flex-1' />

          <Text className="text-body font-bold text-textSecondary ">{t("profile.resume_portfolio.resume")}</Text>
          <View className='h-[1px] bg-primary  flex-1' />
        </View>
      <View style={styles.emptyContainer} className='space-y-3  h-[30rem]'>

        <View style={styles.emptyIconWrap}>
          <Ionicons name="document-text-outline" size={22} color="#3b82f6" />
        </View>
        <Text style={styles.emptyTitle}>{t("profile.resume_portfolio.resume")}</Text>
        <Text style={styles.emptyText}>{t("profile.resume_portfolio.no_resume")}</Text>
      </View>
      </View>

    );
  }

  return (
    <View className="">
      <View className="space-y-3">
        <View className='flex-row items-center gap-3 mt-8'>
          <View className='h-[1px] bg-primary flex-1' />

          <Text className="text-body font-bold text-textSecondary ">{t("profile.resume_portfolio.resume")}</Text>
          <View className='h-[1px] bg-primary  flex-1' />
        </View>

        <Pressable
          onPress={() => navigation.navigate('ResumeImageViewer', { uri: isReview ? resumeImage : IMAGES_BASE_URL + resumeImage })}
          className="self-center"
        >
          <Image
            source={{ uri: isReview ? resumeImage : IMAGES_BASE_URL + resumeImage }}
            style={{
              width: imageWidth,
              height: imageWidth / aspectRatio,

              marginTop: 16,
              marginBottom: 16,
            }}
            resizeMode="cover"
          />
        </Pressable>
      </View>
    </View>
  );
}



const styles = StyleSheet.create({


  emptyContainer: {
    // borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#93c5fd',
    backgroundColor: '#eff6ff',
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  emptyText: {
    fontSize: 13,
    color: '#475569',
  },

});