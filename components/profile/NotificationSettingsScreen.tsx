import { useNavigation } from '@react-navigation/native';
import Header_back from 'components/ui/Header_back';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import ToggleButton from 'components/ui/ToggleButton';
import { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';


const NotificationSettingsScreen = () => {
  const [jobNoti, setJobNoti] = useState(true);
  const [chatNoti, setChatNoti] = useState(true);
  const [announcementNoti, setAnnouncementNoti] = useState(false);
  const [reminderNoti, setReminderNoti] = useState(true);

  const navigation = useNavigation();
  return (

    <ScreenWrapper safeEdges={['top']}>
      <Header_back text="Notification" onPress={() => navigation.goBack()} iconColor='#3B82F6' backgroundColor='bg-surface' />

      <View className="flex-1 bg-surface pt-8">

        <ScrollView>
          <ToggleButton
            label="Job Notifications"
            value={jobNoti}
            onValueChange={setJobNoti}
            description="Get alerts when new freelance jobs are posted."
          />
          <ToggleButton
            label="Chat Messages"
            value={chatNoti}
            onValueChange={setChatNoti}
            description="Receive push notifications for new chat messages."
          />
          <ToggleButton
            label="General Announcements"
            value={announcementNoti}
            onValueChange={setAnnouncementNoti}
            description="Receive updates, platform news and announcements."
          />
          <ToggleButton
            label="Task Reminders"
            value={reminderNoti}
            onValueChange={setReminderNoti}
            description="Stay reminded about deadlines and project updates."
          />
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
};

export default NotificationSettingsScreen;
