import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import Header_back from 'components/ui/Header_back';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next'; // Assuming you use i18next

const Section = ({ icon, title, children }: any) => (
  <View className="mb-6">
    <View className="flex-row items-center mb-3">
      {icon}
      <Text className="ml-2 text-subheading font-semibold text-text">{title}</Text>
    </View>
    {children}
  </View>
);

const BulletItem = ({ icon = 'ellipse', color = '#3B82F6', text }: { icon?: string; color?: string; text: string }) => (
  <View className="flex-row items-start mb-2">
    <Ionicons name={icon as any} size={8} color={color} className="mt-1.5" />
    <Text className="ml-2 text-body text-textSecondary flex-1">{text}</Text>
  </View>
);

const SubSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View className="mb-4">
    <Text className="text-body font-semibold text-text mb-2">{title}</Text>
    {children}
  </View>
);

const TableRow = ({ service, fee }: { service: string; fee: string }) => (
  <View className="flex-row justify-between py-2 border-b border-border">
    <Text className="text-body text-text flex-1">{service}</Text>
    <Text className="text-body text-textSecondary">{fee}</Text>
  </View>
);

const CancellationTable = ({ time, refund, color = '#3B82F6' }: { time: string; refund: string; color?: string }) => (
  <View className="flex justify-between py-2 border-b border-border">
    <Text className="text-body text-text mb-2">{time}</Text>
    <Text className="text-body font-medium" style={{ color }}>{refund}</Text>
  </View>
);

const PrivacyPolicyScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();

  return (
    <ScreenWrapper safeEdges={['top']}>
      <Header_back
        text={t('privacyPolicy.title')}
        onPress={() => navigation.goBack()}
        iconColor='#3B82F6'
        backgroundColor='bg-surface'
      />

      {/* <View className="flex-1 bg-surface px-4"> */}
        <ScrollView
          className='flex-1 bg-surface px-4'
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        >
          {/* Intro */}
          <Text className="text-body text-textSecondary mb-6">
            {t('privacyPolicy.intro')}
          </Text>

          {/* Section 1: Security & Privacy Policy */}
          <Section
            icon={<Ionicons name="shield-checkmark-outline" size={20} color="#3B82F6" />}
            title={t('privacyPolicy.section1.title')}
          >
            <Text className="text-body text-textSecondary mb-3">
              {t('privacyPolicy.section1.description')}
            </Text>

            <SubSection title={t('privacyPolicy.section1.dataCollection.title')}>
              {(t('privacyPolicy.section1.dataCollection.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <BulletItem key={index} text={item} />
              ))}
            </SubSection>

            <SubSection title={t('privacyPolicy.section1.dataProtection.title')}>
              {(t('privacyPolicy.section1.dataProtection.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <BulletItem key={index} text={item} />
              ))}
            </SubSection>

            <SubSection title={t('privacyPolicy.section1.userRights.title')}>
              {(t('privacyPolicy.section1.userRights.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <BulletItem key={index} text={item} />
              ))}
            </SubSection>
          </Section>

          {/* Section 2: Platform Usage Policy */}
          <Section
            icon={<Ionicons name="people-outline" size={20} color="#3B82F6" />}
            title={t('privacyPolicy.section2.title')}
          >
            <SubSection title={t('privacyPolicy.section2.customers.title')}>
              <Text className="text-body font-medium text-success mb-2">
                {t('privacyPolicy.section2.customers.requirements.title')}
              </Text>
              {(t('privacyPolicy.section2.customers.requirements.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <BulletItem key={index} color="#10B981" text={item} />
              ))}

              <Text className="text-body font-medium text-warning mt-3 mb-2">
                {t('privacyPolicy.section2.customers.violations.title')}
              </Text>
              {(t('privacyPolicy.section2.customers.violations.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <BulletItem key={index} color="#F59E0B" text={item} />
              ))}
            </SubSection>

            <SubSection title={t('privacyPolicy.section2.providers.title')}>
              <Text className="text-body font-medium text-success mb-2">
                {t('privacyPolicy.section2.providers.requirements.title')}
              </Text>
              {(t('privacyPolicy.section2.providers.requirements.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <BulletItem key={index} color="#10B981" text={item} />
              ))}

              <Text className="text-body font-medium text-warning mt-3 mb-2">
                {t('privacyPolicy.section2.providers.violations.title')}
              </Text>
              {(t('privacyPolicy.section2.providers.violations.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <BulletItem key={index} color="#F59E0B" text={item} />
              ))}
            </SubSection>
          </Section>

          {/* Section 3: Payment & Payout Policy */}
          <Section
            icon={<Ionicons name="card-outline" size={20} color="#3B82F6" />}
            title={t('privacyPolicy.section3.title')}
          >
            <SubSection title={t('privacyPolicy.section3.paymentMethods.title')}>
              {(t('privacyPolicy.section3.paymentMethods.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <BulletItem key={index} text={item} />
              ))}
            </SubSection>

            <SubSection title={t('privacyPolicy.section3.payoutConditions.title')}>
              {(t('privacyPolicy.section3.payoutConditions.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <BulletItem key={index} text={item} />
              ))}
            </SubSection>

            <SubSection title={t('privacyPolicy.section3.platformFees.title')}>
              <View className="bg-background p-3 rounded-lg">
                <TableRow 
                  service={t('privacyPolicy.section3.platformFees.table.freelancer.service')}
                  fee={t('privacyPolicy.section3.platformFees.table.freelancer.fee')}
                />
                <TableRow 
                  service={t('privacyPolicy.section3.platformFees.table.booking.service')}
                  fee={t('privacyPolicy.section3.platformFees.table.booking.fee')}
                />
                <TableRow 
                  service={t('privacyPolicy.section3.platformFees.table.rental.service')}
                  fee={t('privacyPolicy.section3.platformFees.table.rental.fee')}
                />
              </View>
              <Text className="text-caption text-textSecondary mt-2">
                {t('privacyPolicy.section3.platformFees.note')}
              </Text>
            </SubSection>
          </Section>

          {/* Section 4: Quality Assurance & Rating Policy */}
          <Section
            icon={<Ionicons name="star-outline" size={20} color="#3B82F6" />}
            title={t('privacyPolicy.section4.title')}
          >
            <SubSection title={t('privacyPolicy.section4.ratingSystem.title')}>
              {(t('privacyPolicy.section4.ratingSystem.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <BulletItem key={index} text={item} />
              ))}
            </SubSection>

            <SubSection title={t('privacyPolicy.section4.topRated.title')}>
              <Text className="text-body text-textSecondary mb-2">
                {t('privacyPolicy.section4.topRated.description')}
              </Text>
              {(t('privacyPolicy.section4.topRated.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <BulletItem key={index} text={item} />
              ))}
            </SubSection>

            <SubSection title={t('privacyPolicy.section4.qualityMonitoring.title')}>
              {(t('privacyPolicy.section4.qualityMonitoring.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <BulletItem key={index} text={item} />
              ))}
            </SubSection>
          </Section>

          {/* Section 5: Cancellation & Refund Policy */}
          <Section
            icon={<Ionicons name="refresh-outline" size={20} color="#3B82F6" />}
            title={t('privacyPolicy.section5.title')}
          >
            <SubSection title={t('privacyPolicy.section5.customerCancellations.title')}>
              <View className="bg-background p-3 rounded-lg">
                <CancellationTable 
                  time={t('privacyPolicy.section5.customerCancellations.table.beforeStart.time')}
                  refund={t('privacyPolicy.section5.customerCancellations.table.beforeStart.refund')}
                  color="#10B981"
                />
                <CancellationTable 
                  time={t('privacyPolicy.section5.customerCancellations.table.partialCompletion.time')}
                  refund={t('privacyPolicy.section5.customerCancellations.table.partialCompletion.refund')}
                  color="#F59E0B"
                />
                <CancellationTable 
                  time={t('privacyPolicy.section5.customerCancellations.table.fullCompletion.time')}
                  refund={t('privacyPolicy.section5.customerCancellations.table.fullCompletion.refund')}
                  color="#EF4444"
                />
              </View>
              <Text className="text-caption text-textSecondary mt-2">
                {t('privacyPolicy.section5.customerCancellations.note')}
              </Text>
            </SubSection>

            <SubSection title={t('privacyPolicy.section5.providerCancellations.title')}>
              {(t('privacyPolicy.section5.providerCancellations.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <BulletItem key={index} text={item} />
              ))}
            </SubSection>

            <SubSection title={t('privacyPolicy.section5.serviceNotAsAdvertised.title')}>
              {(t('privacyPolicy.section5.serviceNotAsAdvertised.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <BulletItem key={index} text={item} />
              ))}
            </SubSection>
          </Section>

          {/* Section 6: Support & Dispute Resolution */}
          <Section
            icon={<Ionicons name="headset-outline" size={20} color="#3B82F6" />}
            title={t('privacyPolicy.section6.title')}
          >
            <SubSection title={t('privacyPolicy.section6.contactSupport.title')}>
              {(t('privacyPolicy.section6.contactSupport.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <BulletItem key={index} text={item} />
              ))}
            </SubSection>

            <SubSection title={t('privacyPolicy.section6.responseTimes.title')}>
              {(t('privacyPolicy.section6.responseTimes.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <BulletItem key={index} text={item} />
              ))}
            </SubSection>
          </Section>

          {/* Section 7: Growth & Transparency */}
          <Section
            icon={<Ionicons name="trending-up-outline" size={20} color="#3B82F6" />}
            title={t('privacyPolicy.section7.title')}
          >
            <SubSection title={t('privacyPolicy.section7.platformExpansion.title')}>
              {(t('privacyPolicy.section7.platformExpansion.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <BulletItem key={index} text={item} />
              ))}
            </SubSection>

            <SubSection title={t('privacyPolicy.section7.transparencyCommitment.title')}>
              {(t('privacyPolicy.section7.transparencyCommitment.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <BulletItem key={index} text={item} />
              ))}
            </SubSection>
          </Section>

          {/* Section 8: Terms of Use & Legal Disclaimer */}
          <Section
            icon={<Ionicons name="document-text-outline" size={20} color="#3B82F6" />}
            title={t('privacyPolicy.section8.title')}
          >
            <SubSection title={t('privacyPolicy.section8.prohibitedUses.title')}>
              {(t('privacyPolicy.section8.prohibitedUses.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <BulletItem key={index} color="#EF4444" text={item} />
              ))}
            </SubSection>

            <SubSection title={t('privacyPolicy.section8.liabilityLimitation.title')}>
              {(t('privacyPolicy.section8.liabilityLimitation.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <BulletItem 
                  key={index}
                  icon={index === 2 ? "alert-circle" : "ellipse"}
                  color={index === 2 ? "#F59E0B" : "#3B82F6"}
                  text={item}
                />
              ))}
            </SubSection>

            <SubSection title={t('privacyPolicy.section8.policyAmendments.title')}>
              {(t('privacyPolicy.section8.policyAmendments.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <BulletItem key={index} text={item} />
              ))}
            </SubSection>
          </Section>

          {/* Footer */}
          <Text className="text-caption text-textSecondary text-center mt-8 mb-6">
            {t('privacyPolicy.footer')}
          </Text>
        </ScrollView>
      {/* </View> */}
    </ScreenWrapper>
  );
};

export default PrivacyPolicyScreen;