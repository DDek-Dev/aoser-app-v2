import React from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Header_back from 'components/ui/Header_back';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import { useTranslation } from 'react-i18next';

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
    <ScreenWrapper safeEdges={['top']} style={styles.wrapper}>
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
        <Text className="text-body text-textSecondary mt-4 mb-6 font-medium leading-5">
          {t('privacyPolicy.intro')}
        </Text>

        {sections.map((section, index) => {
          const iconName = sectionIcons[index] ?? 'document-text-outline';

          return (
            <View key={`${section.title}-${index}`} className="mb-6">
              {/* Section Header Row */}
              <View className="flex-row items-center mb-3">
                <Ionicons name={iconName} size={20} color="#3B82F6" />
                <Text className="ml-2 text-subheading font-bold text-text flex-1">
                  {section.title}
                </Text>
              </View>

              {/* Parsed Paragraph Lines Block */}
              {(section.paragraphs || []).map((paragraph, pIndex) => (
                <Text 
                  key={`${index}-${pIndex}`} 
                  className="text-body text-textSecondary mb-2 leading-6"
                >
                  {paragraph}
                </Text>
              ))}
            </View>
          );
        })}

        {/* Policy Footer Identifier Info */}
        <Text className="text-caption text-textSecondary text-center mt-4 mb-8 font-semibold">
          {t('privacyPolicy.footer')}
        </Text>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: 'white',
  },
});

export default PrivacyPolicyScreen;