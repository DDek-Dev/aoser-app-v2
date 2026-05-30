import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Header_back from 'components/ui/Header_back';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';

type PolicySection = {
  title: string;
  paragraphs: string[];
};

const sectionIcons = [
  'shield-checkmark-outline',
  'people-outline',
  'card-outline',
  'star-outline',
  'refresh-outline',
  'headset-outline',
  'document-text-outline',
] as const;

const PrivacyPolicyScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const translatedSections = t('privacyPolicy.sections', { returnObjects: true });
  const sections: PolicySection[] = Array.isArray(translatedSections)
    ? (translatedSections as PolicySection[])
    : [];

  return (
    <ScreenWrapper safeEdges={['top']}>
      <Header_back
        text={t('privacyPolicy.title')}
        onPress={() => navigation.goBack()}
        iconColor="#3B82F6"
        backgroundColor="bg-surface"
      />

      <ScrollView
        className="flex-1 bg-surface px-4"
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-body text-textSecondary mb-6">
          {t('privacyPolicy.intro')}
        </Text>

        {sections.map((section, index) => {
          const iconName = sectionIcons[index] ?? 'document-text-outline';

          return (
            <View key={`${section.title}-${index}`} className="mb-6">
              <View className="flex-row items-center mb-3">
                <Ionicons name={iconName} size={20} color="#3B82F6" />
                <Text className="ml-2 text-subheading font-semibold text-text flex-1">
                  {section.title}
                </Text>
              </View>

              {(section.paragraphs || []).map((paragraph, pIndex) => (
                <Text key={`${index}-${pIndex}`} className="text-body text-textSecondary mb-2 leading-6">
                  {paragraph}
                </Text>
              ))}
            </View>
          );
        })}

        {/* <Text className="text-caption text-textSecondary text-center mt-6 mb-6">
          {t('privacyPolicy.footer')}
        </Text> */}

        <View className="mb-8"/>
      </ScrollView>
    </ScreenWrapper>
  );
};

export default PrivacyPolicyScreen;
