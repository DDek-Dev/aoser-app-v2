import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useReportProblem } from 'hooks/useFreelancer';

type ReportModalProps = {
  visible: boolean;
  onClose: () => void;
  reportID: string;
  freelancerName: string;
  reportType: 'FREELANCER' | 'WORK';
};

export default function ReportModal({
  visible,
  onClose,
  reportID,
  freelancerName,
  reportType,
}: ReportModalProps) {
  const { t } = useTranslation();
  const [reportContent, setReportContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textInputRef = useRef<TextInput>(null);
  const { mutateAsync: reportProblem, isPending } = useReportProblem();

  // Auto-focus keyboard when modal opens
  useEffect(() => {
    if (visible && textInputRef.current) {
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 300); // Delay to ensure modal animation completes
    }
  }, [visible]);

  const handleSendReport = async () => {
    if (!reportContent.trim()) {
      setError(t('report.content_required'));
      return;
    }


    try {
      const reportData = {

        description: reportContent.trim(),
        reportType: reportType,
        // reportedUser:
        ...(reportType === 'FREELANCER'
          ? { reportedUser: reportID }
          : { work: reportID }
        ),
      };
      console.log('📤 Sending report with data:', reportData);

      await reportProblem(reportData);  // ← use mutateAsync here

      setReportContent('');
      onClose();
    } catch (err) {
      console.log('❌ Error sending report:', err);
      setError(t('report.error_sending'));
    }
  };

  const handleClose = () => {
    setReportContent('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 bg-black/50 justify-flex-start pt-20">
            {/* Backdrop */}
            <TouchableWithoutFeedback onPress={handleClose}>
              <View className="flex-1" />
            </TouchableWithoutFeedback>

            {/* Modal Card - Top Positioned */}
            <View className="absolute top-16 left-6 right-6 bg-white rounded-3xl shadow-lg overflow-hidden">
              {/* Header with Close Button */}
              <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100">
                <View className="flex-1">
                  <Text className="text-lg font-bold text-text">
                    {t('report.title', 'Report Profile')}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleClose}
                  disabled={isLoading}
                  className="p-2 -mr-2"
                  activeOpacity={0.6}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <View className="px-6 py-6">
                {/* Description */}
                <Text className="text-body text-gray-600 mb-6 leading-6">
                  {t('report.description', `Report this profile to help keep our community safe.`)}
                </Text>

                {/* Issue Details Label */}
                <Text className="text-body text-text mb-2 font-bold">
                  {t('report.content_label', 'Issue Details')}{' '}
                  <Text className="text-error">*</Text>
                </Text>

                {/* TextArea Input */}
                <TextInput
                  ref={textInputRef}
                  className="rounded-xl px-4 py-4 text-body text-text bg-white border border-gray-200 h-[120px]"
                  placeholder={t(
                    'report.content_placeholder',
                    'Please describe why you are reporting this profile...'
                  )}
                  placeholderTextColor="#6B7280"
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  value={reportContent}
                  onChangeText={setReportContent}
                  editable={!isLoading}
                />

                {/* Error Message */}
                {error && (
                  <View className="flex-row items-start px-4 py-3 rounded-xl mb-4 bg-red-50 border border-red-200">
                    <Ionicons
                      name="alert-circle"
                      size={16}
                      color="#EF4444"
                      style={{ marginRight: 12, marginTop: 2 }}
                    />
                    <Text className="text-error text-body flex-1">{error}</Text>
                  </View>
                )}

                {/* Action Buttons */}
                <View className="flex-row gap-3 mt-8">
                  <TouchableOpacity
                    onPress={handleClose}
                    disabled={isLoading}
                    className="flex-1 py-3 rounded-xl border border-gray-300 items-center justify-center active:bg-gray-50"
                  >
                    <Text className="text-body font-semibold text-text">
                      {t('report.cancel', 'Cancel')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSendReport}
                    disabled={isLoading || !reportContent.trim()}
                    className={`flex-1 py-3 rounded-xl items-center justify-center flex-row ${isLoading || !reportContent.trim()
                      ? 'bg-gray-300'
                      : 'bg-red-600 active:bg-red-700'
                      }`}
                  >
                    {isLoading ? (
                      <>
                        <ActivityIndicator
                          color="white"
                          size="small"
                          style={{ marginRight: 8 }}
                        />
                        <Text className="text-body font-semibold text-white">
                          {t('report.sending', 'Sending...')}
                        </Text>
                      </>
                    ) : (
                      <>
                        {/* <Ionicons
                          name="flag"
                          size={16}
                          color="white"
                          style={{ marginRight: 8 }}
                        /> */}
                        <Text className="text-body font-semibold text-white">
                          {t('report.send', 'Submit Report')}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Info Text */}
                <Text className="text-center text-xs text-gray-500 mt-6">
                  {t('report.info', 'Our team will review your report and take action if needed')}
                </Text>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}
