import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image, Pressable, Text, View, Dimensions } from 'react-native';

import { FreelancerStackParamList } from 'types/navigation';

const IMAGES_BASE_URL= process.env.EXPO_PUBLIC_IMAGES_URL

type Props = {
  resumeImage?: string;
};

export default function ResumeImage({ resumeImage }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();

  // const uri = 'https://marketplace.canva.com/EAFzfwx_Qik/4/0/1131w/canva-blue-simple-professional-cv-resume-T9RPR4DPdiw.jpg';

  // Use screen width to maintain aspect ratio
  const screenWidth = Dimensions.get('window').width;
  const imageWidth = screenWidth * 0.9; // 90% width
  const aspectRatio = 0.707; // Approx. A4 paper (1 / √2 ≈ 0.707)
  if (!resumeImage) return null;
  return (
    <View className="px-4">
      <View className="space-y-3">
        <View className='flex-row items-center gap-3 mt-8'>
          <View className='h-[1px] bg-primary flex-1' />

          <Text className="text-body font-bold text-textSecondary ">Resume</Text>
          <View className='h-[1px] bg-primary  flex-1' />
        </View>

        <Pressable
          onPress={() => navigation.navigate('ResumeImageViewer', { uri: resumeImage })}
          className="self-center"
        >
          <Image
            source={{ uri: IMAGES_BASE_URL + resumeImage }}
            style={{
              width: imageWidth,
              height: imageWidth / aspectRatio,
              borderRadius: 12,
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
