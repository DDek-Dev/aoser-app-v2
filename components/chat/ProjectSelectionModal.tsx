import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,

} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WorkApplies } from 'types';
import FormInput from 'components/ui/Input';

import DatePicker from 'components/ui/DatePicker';


import { formatDate, formatRelativeTime, getCurrentLanguage, Language } from 'utils/dateFormatter';
import BudgetInput from 'components/ui/BudgetInput';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import { useTranslation } from 'react-i18next';

interface ProjectSelectionModalProps {
  visible: boolean;
  isLoading: boolean;
  projects: WorkApplies[];
  onClose: () => void;
  onProjectsSelect: (selectedProjects: WorkApplies[], updatedData: ProjectUpdateData[]) => void;
}

interface ProjectUpdateData {
  projectId: string;
  newBudget: number;
  newDeadline: string | null;
}


const ProjectSelectionModal: React.FC<ProjectSelectionModalProps> = ({
  visible,
  isLoading,
  projects,
  onClose,
  onProjectsSelect,
}) => {


  // State declarations
  const [selectedProjects, setSelectedProjects] = useState<WorkApplies[]>([]);
  const [currentStep, setCurrentStep] = useState<'selection' | 'review'>('selection');
  const [projectUpdates, setProjectUpdates] = useState<ProjectUpdateData[]>([]);
  const currentLanguage = getCurrentLanguage();
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Separate date string state for each project
  const [dateStrings, setDateStrings] = useState<Record<string, string>>({});

  // Date picker
  const [activePickerId, setActivePickerId] = useState<string | null>(null);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const toInputRef = useRef<TextInput>(null);

  const { t } = useTranslation();
  // Format date with null check

  const handleProjectToggle = (project: WorkApplies) => {
    setSelectedProjects(prev => {
      const isSelected = prev.some(p => p._id === project._id);
      if (isSelected) {
        return prev.filter(p => p._id !== project._id);
      } else {
        return [...prev, project];
      }
    });
  };


  const handleNext = () => {
    if (selectedProjects.length === 0) {
      Alert.alert('No Selection', 'Please select at least one project to continue.');
      return;
    }

    // Initialize project updates for selected projects
    const initialUpdates = selectedProjects.map(project => ({
      projectId: project._id,
      newBudget: 0,
      newDeadline: '',
    }));
    setProjectUpdates(initialUpdates);
    setCurrentStep('review');
  };


  const handleBack = () => {
    setCurrentStep('selection');
    setProjectUpdates([]);
  };

  // const handleSend = async () => {
  //   try {

  //     if (projectUpdates.length > 0) {
  //       await AsyncStorage.setItem('projectUpdates', JSON.stringify(projectUpdates));
  //     }
  //     onProjectsSelect(selectedProjects, projectUpdates);
  //     // Reset state
  //     setSelectedProjects([]);
  //     setProjectUpdates([]);
  //     setCurrentStep('selection');
  //     onClose();
  //   } catch (error) {
  //     console.log('Failed to handle send:', error);
  //   }
  // };


  // Validation function
  const validateProjectData = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    projectUpdates.forEach(update => {
      const project = selectedProjects.find(p => p._id === update.projectId);
      if (!project) return;

      // Validate Budget (always required)
      if (!update.newBudget || update.newBudget <= 0) {
        newErrors[`${update.projectId}_budget`] = 'Budget is required and must be greater than 0';
        isValid = false;
      }

      // Validate Deadline (required if original work has deadline)
      if (project.work?.deadLine) {
        if (!update.newDeadline || update.newDeadline === '') {
          newErrors[`${update.projectId}_deadline`] = 'Deadline is required for this project';
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  };
  // Prepare data for backend
  const prepareDataForBackend = (): ProjectUpdateData[] => {
    const dataToSend: ProjectUpdateData[] = projectUpdates.map(update => {
      const project = selectedProjects.find(p => p._id === update.projectId);

      return {
        projectId: update.projectId,
        newBudget: Number(update.newBudget) || 0,
        newDeadline: update.newDeadline || null, // null if empty, ISO string if set
      };
    });

    return dataToSend;
  };


  // Updated handleSend with validation
  const handleSend = async () => {
    try {
      // Validate all project data
      const isValid = validateProjectData();

      if (!isValid) {
        Alert.alert(
          'Validation Error',
          'Please fill in all required fields correctly:\n\n' +
          '• Budget must be greater than 0\n' +
          '• Deadline is required for projects with original deadlines',
          [{ text: 'OK' }]
        );
        return;
      }

      // Prepare data for backend
      const dataToSend = prepareDataForBackend();

      // Log the data
      console.log('=== SENDING OFFERING DATA ===');
      console.log('Total projects:', dataToSend.length);
      console.log('Data to send:', JSON.stringify(dataToSend, null, 2));
      console.log('============================');

      // Individual project logs
      dataToSend.forEach((data, index) => {
        const project = selectedProjects[index];
        console.log(`\n--- Project ${index + 1} ---`);
        console.log('Work ID:', data.projectId);
        console.log('Work Title:', project?.work?.workTitle);
        console.log('Original Budget:', project?.work?.budget);
        console.log('New Budget:', data.newBudget);
        console.log('Original Deadline:', project?.work?.deadLine);
        console.log('New Deadline:', data.newDeadline);
        console.log('-------------------\n');
      });

      // Save to AsyncStorage
      if (projectUpdates.length > 0) {
        await AsyncStorage.setItem('projectUpdates', JSON.stringify(dataToSend));
      }

      // Call the parent callback with data
      onProjectsSelect(selectedProjects, dataToSend);

      // Show success message
      Alert.alert(
        'Success',
        `Successfully sent ${dataToSend.length} offering(s)`,
        [{ text: 'OK' }]
      );

      // Reset state
      setSelectedProjects([]);
      setProjectUpdates([]);
      setCurrentStep('selection');
      setErrors({});
      setDateStrings({});
      onClose();

    } catch (error) {
      console.error('Failed to handle send:', error);
      Alert.alert(
        'Error',
        'Failed to send offerings. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };


  // Helper function to parse DD/MM/YYYY to Date
  const parseInputDate = (dateString: string): Date | null => {
    if (!dateString || dateString.length !== 10) return null;

    const [day, month, year] = dateString.split('/').map(Number);

    if (!day || !month || !year || month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }

    const date = new Date(year, month - 1, day);

    // Validate the date is real (e.g., not Feb 31)
    if (date.getDate() !== day || date.getMonth() !== month - 1) {
      return null;
    }

    return date;
  };

  // Update handler for date string
  const handleDateStringChange = (projectId: string, text: string) => {
    // Clear error when user starts typing
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`${projectId}_deadline`];
      return newErrors;
    });

    // Only allow numbers and slashes
    const cleaned = text.replace(/[^\d/]/g, '');
    // Auto-format as user types
    let formatted = cleaned;
    if (cleaned.length >= 2 && !cleaned.includes('/')) {
      formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    }
    if (cleaned.length >= 5 && cleaned.split('/').length === 2) {
      const parts = cleaned.split('/');
      formatted = parts[0] + '/' + parts[1].slice(0, 2) + '/' + parts[1].slice(2);
    }

    // Limit to 10 characters (DD/MM/YYYY)
    formatted = formatted.slice(0, 10);

    // Update the input string
    setDateStrings(prev => ({ ...prev, [projectId]: formatted }));

    // If complete date, validate and update
    if (formatted.length === 10) {
      const parsedDate = parseInputDate(formatted);
      if (parsedDate) {
        updateProjectData(projectId, 'newDeadline', parsedDate.toISOString());
      }
    } else if (formatted === '') {
      // Clear the date if input is empty
      updateProjectData(projectId, 'newDeadline', '');
    }
  };
  // Initialize date string when project update changes
  useEffect(() => {
    const newDateStrings: Record<string, string> = {};
    projectUpdates.forEach(update => {
      if (update.newDeadline) {
        newDateStrings[update.projectId] = formatDateToInput(update.newDeadline);
      }
    });
    setDateStrings(newDateStrings);
  }, [projectUpdates]);


  // Helper function to format date to DD/MM/YYYY
  // Helper function to format date to DD/MM/YYYY
  const formatDateToInput = (date: Date | string | null): string => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
  };


  const handleClose = () => {
    setSelectedProjects([]);
    setProjectUpdates([]);
    setCurrentStep('selection');
    onClose();
  };

  // Update project data with null handling
  const updateProjectData = (projectId: string, field: 'newBudget' | 'newDeadline', value: string | null) => {
    // Clear error when updating
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`${projectId}_${field === 'newBudget' ? 'budget' : 'deadline'}`];
      return newErrors;
    });

    setProjectUpdates(prev =>
      prev.map(update =>
        update.projectId === projectId
          ? { ...update, [field]: value }
          : update
      )
    );
  };

  const isProjectSelected = (projectId: string) => {
    return selectedProjects.some(p => p._id === projectId);
  };


  if (!projects) return null

  const renderProjectItem = ({ item }: { item: WorkApplies }) => {

    const isSelected = isProjectSelected(item._id);
    return (
      <TouchableOpacity
        onPress={() => handleProjectToggle(item)}
        className={`bg-surface rounded-2xl border ${isSelected ? 'border-primary bg-primary/10' : 'border-border'
          } px-4 py-4 mb-3`}
        activeOpacity={0.7}
      >
        {/* Selection indicator and title */}
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1 pr-2">
            <View className="flex-row items-center mb-1">
              <View className={`w-5 h-5 rounded-full border-2 ${isSelected
                ? 'bg-primary border-primary'
                : 'border-gray-300'
                } items-center justify-center mr-3`}>
                {isSelected && (
                  <Ionicons name="checkmark" size={14} color="white" />
                )}
              </View>
              <Text className="text-body font-semibold text-text flex-1">
                {item.work?.workTitle}
              </Text>
            </View>

          </View>
        </View>

        {/* Description */}
        <Text numberOfLines={2} className="text-body mb-2 text-textSecondary ml-8">
          {item.work?.description}
        </Text>



        {/* Budget + Deadline */}
        <View className="">
          <View className='flex-row '>
            <Text className='font-bold text-warning ml-2'>{item.work?.currency} </Text>
            <Text className='font-bold text-primary '>{new Intl.NumberFormat().format(item.work?.budget)}</Text>
          </View>
        </View>
        <View className='flex-row justify-between'>
          <View>
            <Text className='mt-3 mb-1'> {t('works.post_on')}</Text>
            <Text className="text-caption  text-textSecondary">{formatRelativeTime(item.createdAt, currentLanguage)}</Text>
          </View>
          <View className='flex-row gap-2 items-center'>
            <Ionicons name="time-outline" size={18} color="#F59E0B" />
            <Text className="text-sm text-textSecondary">{formatDate(item.work?.deadLine as string, currentLanguage)}</Text>
          </View>

        </View>

      </TouchableOpacity>
    );
  };


  // Updated renderReviewItem with error display
  const renderReviewItem = ({ item }: { item: WorkApplies }) => {
    const updateData = projectUpdates.find(u => u.projectId === item._id);
    const isPickerOpen = activePickerId === item._id;
    const currentDateString = dateStrings[item._id] || '';

    const budgetError = errors[`${item._id}_budget`];
    const deadlineError = errors[`${item._id}_deadline`];
    const hasOriginalDeadline = !!item.work?.deadLine;

    return (
      <View className="bg-surface rounded-2xl border border-border px-4 py-4 mb-4">
        {/* Project Info */}
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 pr-2">
            <Text className="text-body font-semibold text-text mb-1">
              {item.work.workTitle}
            </Text>
          </View>
        </View>

        {/* Budget + Original Deadline */}
        <View className="">
          <View className='flex-row'>
            <Text className='font-bold text-warning ml-2'>{item.work?.currency} </Text>
            <Text className='font-bold text-primary'>
              {new Intl.NumberFormat().format(item.work?.budget)}
            </Text>
          </View>
        </View>

        <View className='flex-row justify-between'>
          <View>
            <Text className='mt-3 mb-1'>{t('works.post_on')}</Text>
            <Text className="text-caption text-textSecondary">
              {formatRelativeTime(item.createdAt, currentLanguage)}
            </Text>
          </View>
          <View className='flex-row gap-2 items-center'>
            <Ionicons name="time-outline" size={18} color="#F59E0B" />
            <Text className="text-sm text-textSecondary">
              {formatDate(item.work?.deadLine as string, currentLanguage)}
            </Text>
          </View>
        </View>

        {/* New Budget & Deadline Inputs */}
        <View className="space-y-3">
          <View className='mt-4'>
            <BudgetInput
              label="Budget *"
              value={updateData?.newBudget || null}
              onChange={(value) => updateProjectData(item._id, 'newBudget', value.toString())}
              currency={item.work?.currency}
              onCurrencyChange={() => { item.work?.currency }}
              required
            />
            {budgetError && (
              <Text className="text-error text-sm mt-1">{budgetError}</Text>
            )}
          </View>

          {/* Deadline Input with Calendar Picker */}
          <View className="flex-row justify-between mb-4 items-end">
            <View className="flex-1 mr-2">
              <FormInput
                label={`${t('kyc.step4.expiryDate.label') || "New Deadline"}${hasOriginalDeadline ? ' *' : ''}`}
                placeholder={currentLanguage === 'la' ? 'ວ/ດ/ປ' : 'DD/MM/YYYY'}
                value={currentDateString}
                ref={toInputRef}
                isDate={true}
                keyboardType="numeric"
                inputClassName={deadlineError ? 'border-error' : 'border-border'}
                maxLength={10}
                onChangeText={(text) => handleDateStringChange(item._id, text)}
              />
              {deadlineError && (
                <Text className="text-error text-sm mt-1">{deadlineError}</Text>
              )}
            </View>

            <TouchableOpacity
              onPress={() => {
                const currentDate = updateData?.newDeadline
                  ? new Date(updateData.newDeadline)
                  : new Date();
                setTempDate(currentDate);
                setActivePickerId(item._id);
              }}
              className="w-24 bg-blue-200 mt-1 flex justify-center items-center rounded-xl py-4"
            >
              <Ionicons name="calendar" size={24} color="#2563EB" />
            </TouchableOpacity>
          </View>

          {/* DatePicker Modal */}
          {isPickerOpen && (
            <DatePicker
              visible={isPickerOpen}
              date={updateData?.newDeadline ? new Date(updateData.newDeadline) : new Date()}
              tempDate={tempDate}
              setTempDate={setTempDate}
              setDate={(date) => {
                if (date) {
                  updateProjectData(item._id, 'newDeadline', date.toISOString());
                  setDateStrings(prev => ({
                    ...prev,
                    [item._id]: formatDateToInput(date)
                  }));
                } else {
                  updateProjectData(item._id, 'newDeadline', '');
                  setDateStrings(prev => ({ ...prev, [item._id]: '' }));
                }
                setActivePickerId(null);
              }}
              onClose={() => setActivePickerId(null)}
            />
          )}
        </View>
      </View>
    );
  };

  const renderSelectionStep = () => (
    <ScreenWrapper safeEdges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-border bg-surface">
        <TouchableOpacity onPress={handleClose}>
          <Ionicons name="close" size={24} color="#6B7280" />
        </TouchableOpacity>

        <Text className="text-lg font-semibold text-text">
          {t('chat.offer.select_project')} ({selectedProjects.length})
        </Text>

        <TouchableOpacity
          onPress={handleNext}
          className={`px-6 py-2 rounded-lg ${selectedProjects.length > 0
            ? 'bg-primary'
            : 'bg-gray-300'
            }`}
          disabled={selectedProjects.length === 0}
        >
          <Text className={`font-medium ${selectedProjects.length > 0
            ? 'text-white'
            : 'text-gray-500'
            }`}>
            {t('chat.offer.offer')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSend}
          className={`px-6 py-2 rounded-lg ${selectedProjects.length > 0
            ? 'bg-primary'
            : 'bg-gray-300'
            }`}
          disabled={selectedProjects.length === 0}
        >
          <Text className={`font-medium ${selectedProjects.length > 0
            ? 'text-white'
            : 'text-gray-500'
            }`}>
            {t('chat.offer.send')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Projects List */}
      <View className="flex-1 px-4 py-4">
        {projects.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="folder-open-outline" size={64} color="#9CA3AF" />
            <Text className="text-textSecondary text-center mt-4">
              No projects available
            </Text>
          </View>
        ) : (
          <FlatList
            data={projects}
            keyExtractor={(item) => item._id}
            renderItem={renderProjectItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>
    </ScreenWrapper>
  );

  const renderReviewStep = () => (

    <ScreenWrapper safeEdges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-border bg-surface">
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color="#3B82F6" />
        </TouchableOpacity>

        {/* <Text className="text-lg font-semibold text-text">
          Review & Send
        </Text> */}

        <TouchableOpacity
          onPress={handleSend}
          className="px-4 py-2 rounded-lg bg-primary"
        >
          <Text className="font-medium text-white">
            {t('chat.offer.send_offer')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Review Content */}
      <View className="flex-1 px-4 py-4">
        <Text className="text-body text-textSecondary mb-4">
          {t('chat.offer.review_select')}
        </Text>


        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <FlatList
            data={selectedProjects}
            keyExtractor={(item) => item._id}
            renderItem={renderReviewItem}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"

            removeClippedSubviews={false}
          />

        </KeyboardAvoidingView>
      </View>
    </ScreenWrapper>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView className="flex-1 bg-background">
        {currentStep === 'selection' ? renderSelectionStep() : renderReviewStep()}
      </SafeAreaView>
    </Modal>
  );
};

export default ProjectSelectionModal;