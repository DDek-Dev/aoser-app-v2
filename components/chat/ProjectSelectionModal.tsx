import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,

  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,

} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Job, TabType } from 'types';
import FormInput from 'components/ui/Input';
import DatePicker from 'components/ui/DatePicker';
import { formatDisplayDateTime, formatRelativeTime, getCurrentLanguage, Language } from 'utils/dateFormatter';
import BudgetInput from 'components/ui/BudgetInput';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import { useTranslation } from 'react-i18next';
import { ALERT_TYPE, Toast } from 'react-native-alert-notification';
import * as Icons from 'lucide-react-native';
import JobListItem from 'skeletonScreens/JobListItem';
import { useFreeLRequestUpdateW, usegetAllMyWork, useGetAllsingleCustomerWork } from 'hooks/usePublicWork';
import { UserProfile } from 'types/profile';

interface ProjectSelectionModalProps {
  visible: boolean;
  userProfileId: string;
  onClose: () => void;
  onProjectsSelect: (selectedProjects: Job[], updatedData: ProjectUpdateData[]) => void;
  user: UserProfile
}
interface ProjectUpdateData {
  projectId: string;
  newBudget: number;
  newDeadline: string;
  currency: string; // Add currency field
  offeringWorkId?: string;
}

const ProjectSelectionModal: React.FC<ProjectSelectionModalProps> = ({
  visible,
  userProfileId,
  onClose,
  onProjectsSelect,
  user
}) => {
  // State declarations
  const [selectedProjects, setSelectedProjects] = useState<Job[]>([]);
  const [currentStep, setCurrentStep] = useState<'selection' | 'review'>('selection');
  const [projectUpdates, setProjectUpdates] = useState<ProjectUpdateData[]>([]);
  const currentLanguage: Language = getCurrentLanguage();
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Separate date string state for each project
  const [dateStrings, setDateStrings] = useState<Record<string, string>>({});
  // Separate time string state for each project
  const [timeStrings, setTimeStrings] = useState<Record<string, string>>({});

  // Date picker
  const [activePickerId, setActivePickerId] = useState<string | null>(null);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const { t } = useTranslation();

  const [displayedData, setDisplayedData] = useState<any>([]);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [workData, setWorkData] = useState<any>([]);
  const [workIsloading, setWorkIsloading] = useState(true);

  const [isCustomer, setIsCustomer] = useState(false);


  const [selectedTab, setSelectedTab] = useState<TabType>('customerwork');
  const { data: customerWorkData, isLoading: customerLoading, refetch: customerRefetch } = useGetAllsingleCustomerWork(userProfileId || '', 'PUBLISHED,ASSIGNED_WORKER');

  const { data: myWorks, isLoading: isLoadingMy, refetch } = usegetAllMyWork();
  const freeLRequestUpdateWMutation = useFreeLRequestUpdateW();
  // Helper function to format datetime for display
  // Replace the formatDateTimeForDisplay function with this corrected version
  const formatDateTimeForDisplay = (date: Date | string | null): string => {
    if (!date) {
      return currentLanguage === 'la' ? 'ວ/ດ/ປ 00:00' : 'dd/mm/yy 00:00';
    }

    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) {
      return currentLanguage === 'la' ? 'ວ/ດ/ປ 00:00' : 'dd/mm/yy 00:00';
    }

    // Format date part
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();

    // Format time part
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  // Helper function to parse datetime string - MORE FLEXIBLE VERSION
  const parseDateTime = (dateTimeString: string): Date | null => {
    if (!dateTimeString) return null;

    const cleaned = dateTimeString.trim();

    // Allow date-only (DD/MM/YYYY) or datetime (DD/MM/YYYY HH:MM)
    const parts = cleaned.split(' ');
    const dateStr = parts[0] || '';
    const timeStr = parts[1] || '';

    const dateParts = dateStr.split('/');
    if (dateParts.length !== 3) return null;

    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10);
    let year = parseInt(dateParts[2], 10);

    if (year < 100) {
      year += 2000;
    }

    if (!day || !month || !year || isNaN(day) || isNaN(month) || isNaN(year)) {
      return null;
    }

    let hours = 0;
    let minutes = 0;

    if (timeStr) {
      const timeParts = timeStr.split(':');
      if (timeParts.length > 2) return null;

      hours = parseInt(timeParts[0], 10);
      if (isNaN(hours)) return null;

      if (timeParts.length === 2) {
        minutes = timeParts[1] === '' ? 0 : parseInt(timeParts[1], 10);
        if (isNaN(minutes)) return null;
      } else {
        minutes = 0;
      }

      // Clamp invalid time to 23:39 as requested
      if (hours > 23 || minutes > 59 || hours < 0 || minutes < 0) {
        hours = 23;
        minutes = 39;
      }
    }

    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }

    const date = new Date(year, month - 1, day, hours, minutes, 0, 0);

    if (isNaN(date.getTime())) return null;

    if (date.getDate() !== day || date.getMonth() !== month - 1) {
      return null;
    }

    console.log('✓ Parsed date successfully:', date.toISOString());
    return date;
  };



  useEffect(() => {
    if (user.businessType === 'FREELANCER') {
      if (selectedTab === 'customerwork') {

        setWorkData(customerWorkData || []);
        setWorkIsloading(customerLoading);

      } else {
        setWorkData(myWorks || []);
        setWorkIsloading(isLoadingMy);

      }
      setIsCustomer(false);

    } else if (user.businessType === 'CUSTOMER') {
      setWorkData(myWorks || []);
      setWorkIsloading(isLoadingMy);
      setIsCustomer(true);
    }
    setPage(1);
  }, [user.businessType, customerWorkData, selectedTab, customerLoading, myWorks, isLoadingMy]);

  // Reset selected tab when modal opens
  useEffect(() => {
    if (visible) {

      setSelectedProjects([]);
    }

  }, [visible]);

  // Update displayed data when workData or page changes
  useEffect(() => {
    if (workData) {
      setDisplayedData(workData.slice(0, page * ITEMS_PER_PAGE));
    }
  }, [workData, page]);
  const handleLoadMore = () => {
    if (!workIsloading && displayedData.length < workData.length) {
      setPage(prev => prev + 1);
    }
  }
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    try {
      if (selectedTab === 'customerwork') {
        await customerRefetch();
      } else {

        await refetch();
      }
    } catch (err) {
      console.log('Refresh work error:', err);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);


  const handleProjectToggle = (project: Job) => {
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
      console.log('No Selection', 'Please select at least one project to continue.');
      return;
    }

    // Initialize project updates for selected projects
    // const initialUpdates = selectedProjects.map(project => ({
    //   projectId: project._id,
    //   newBudget: 0,
    //   newDeadline: '',
    //   currecy: project.currency
    // }));
    // setProjectUpdates(initialUpdates);
    setCurrentStep('review');
  };


  const handleBack = () => {
    setCurrentStep('selection');
    setProjectUpdates([]);
  };



  const convertToPascalCase = (str: string): string => {
    return str
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  };


  const getIcon = (iconName?: string) => {
    if (!iconName) return Icons.Code;

    const pascalName = convertToPascalCase(iconName);
    const IconComponent = (Icons as any)[pascalName];

    return IconComponent || Icons.Code;
  };


  // Validation function
  // Updated validation function - BOTH budget AND deadline are now REQUIRED
  const validateProjectData = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    selectedProjects.forEach(project => {
      const update = projectUpdates.find(u => u.projectId === project._id);

      // Validate Budget (REQUIRED - must be greater than 0)
      if (!update || !update.newBudget || update.newBudget <= 0) {
        newErrors[`${project._id}_budget`] = t('postWork.budget_required') || 'Budget is required and must be greater than 0';
        isValid = false;
      }

      // Validate Deadline (REQUIRED - cannot be null or empty)
      if (!update || !update.newDeadline || update.newDeadline === '') {
        newErrors[`${project._id}_deadline`] = t('chat.offer.deadline_required') || 'Deadline is required';
        isValid = false;
      } else {
        // Additional check: ensure deadline is a valid date
        const deadlineDate = new Date(update.newDeadline);
        if (isNaN(deadlineDate.getTime())) {
          newErrors[`${project._id}_deadline`] = t('chat.offer.invalid_deadline') || 'Invalid deadline format';
          isValid = false;
        }
        // Optional: Check if deadline is in the future
        else if (deadlineDate <= new Date()) {
          newErrors[`${project._id}_deadline`] = t('chat.offer.deadline_future') || 'Deadline must be in the future';
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  };
  // Prepare data for backend
  // Updated prepareDataForBackend - deadline is now always required (never null)
  const prepareDataForBackend = (): ProjectUpdateData[] => {
    const dataToSend: ProjectUpdateData[] = projectUpdates.map(update => {
      const project = selectedProjects.find(p => p._id === update.projectId);

      return {
        projectId: update.projectId,
        newBudget: Number(update.newBudget) || 0,
        newDeadline: update.newDeadline || '', // Changed from || null to || ''
        currency: project?.currency || 'LAK',
      };
    });

    return dataToSend;
  };


  // Updated handleSend with validation
  // Updated handleSend with enhanced validation
  const handleSend = async () => {
    try {
      // Prepare data for backend
      const dataToSend = prepareDataForBackend();
      // Call the parent callback with data
      onProjectsSelect(selectedProjects, dataToSend);
      // Reset state
      setSelectedProjects([]);
      setProjectUpdates([]);
      setCurrentStep('selection');
      setErrors({});
      setDateStrings({});
      setTimeStrings({});
      onClose();

    } catch (error) {
      console.log('Failed to handle send:', error);

      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: 'Opps!',
        textBody: 'Failed to send offerings. Please try again.',
      })
    }
  };

  const handleSendOffer = async () => {
    try {
      // Validate all project data
      const isValid = validateProjectData();

      if (!isValid) {

        return;
      }

      // Prepare data for backend
      const dataToSend = prepareDataForBackend();

      // Additional check: ensure all required data is present
      const hasInvalidData = dataToSend.some(
        data => !data.newBudget || data.newBudget <= 0 || !data.newDeadline || data.newDeadline === ''
      );

      if (hasInvalidData) {
        return;
      }
      let successCount = 0;
      let failedProjects: string[] = [];

      // Send each project update ONE BY ONE (sequentially)
      for (let index = 0; index < dataToSend.length; index++) {
        const projectData = dataToSend[index];
        const project = selectedProjects[index];

        try {
          // Format deadline to ISO string (backend will handle conversion)
          const formattedDeadline = projectData.newDeadline
            ? new Date(projectData.newDeadline).toISOString()
            : null;

          // Double-check that deadline is not null before sending
          if (!formattedDeadline) {
            console.log(`✗ Deadline is null for project ${index + 1}`);
            failedProjects.push(project.workTitle);
            continue;
          }

          // Prepare the updateData object
          const updateData = {
            deadLine: formattedDeadline,
            currency: projectData.currency,
            budget: projectData.newBudget
          };


          // Call the API for this project (one at a time)
          const result: any = await freeLRequestUpdateWMutation.mutateAsync({
            id: projectData.projectId,
            data: updateData
          });

          // Try to capture offeringWorkId from API response (backend may return different shapes)
          const offeringWorkId =
            result?.offeringWorkId ||
            result?.offeringWork?._id ||
            result?._id ||
            result?.data?.offeringWorkId ||
            result?.data?.offeringWork?._id;

          if (offeringWorkId) {
            dataToSend[index] = { ...projectData, offeringWorkId };
          }

          successCount++;
          console.log(`✓ Successfully updated project ${index + 1}`);

        } catch (error: any) {
          console.log(`✗ Failed to update project ${index + 1}:`, error);
          failedProjects.push(project.workTitle);

        }
      }

      if (failedProjects.length > 0) {
        console.log('Failed projects:', failedProjects);
      }

      // Call the parent callback with data
      onProjectsSelect(selectedProjects, dataToSend);

      // Show appropriate success/error message
      if (successCount === dataToSend.length) {
        Toast.show({
          type: ALERT_TYPE.SUCCESS,
          title: t('common.success') || 'Success!',
          // textBody: `${t('toast.sent_success') || 'Successfully sent'} ${successCount} ${t('toast.offerings') || 'offering(s)'}`,
        });
      } else {
        Toast.show({
          type: ALERT_TYPE.DANGER,
          title: t('common.failed') || 'Failed',
          textBody: t('chat.offer.failed_message') || 'Failed to send offerings. Please try again.',
        });
      }

      // Reset state only if at least one succeeded
      if (successCount > 0) {
        setSelectedProjects([]);
        setProjectUpdates([]);
        setCurrentStep('selection');
        setErrors({});
        setDateStrings({});
        setTimeStrings({});
        onClose();
      }

    } catch (error: any) {
      console.log('Failed to handle send:', error);

      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: t('toast.error') || 'Oops!',
        textBody: error.message || t('toast.failed_message') || 'Failed to send offerings. Please try again.',
      });
    }
  };

  // Initialize date string when project update changes
  useEffect(() => {
    const newDateStrings: Record<string, string> = {};
    projectUpdates.forEach(update => {
      if (update.newDeadline) {
        newDateStrings[update.projectId] = formatDateTimeForDisplay(update.newDeadline);
      }
    });
    setDateStrings(newDateStrings);
  }, [projectUpdates]);

  const handleClose = () => {
    setSelectedProjects([]);
    setProjectUpdates([]);
    setCurrentStep('selection');
    setDateStrings({});
    setTimeStrings({});
    onClose();
  };


  const isProjectSelected = (projectId: string) => {
    return selectedProjects.some(p => p._id === projectId);
  };



  const renderProjectItem = ({ item }: { item: Job }) => {


    const IconComponent = getIcon(item?.serviceType?.icon);


    const isSelected = isProjectSelected(item._id);
    return (
      <Pressable
        onPress={() => handleProjectToggle(item)}
        className={`bg-surface rounded-2xl border ${isSelected ? 'border-primary bg-primary/10' : 'border-border'
          } px-4 py-4 mb-3`}

      >
        {/* Selection indicator and title */}
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1 pr-2">
            <View className="flex-row items-center mb-1 justify-between">
              <View className={`w-5 h-5 rounded-full border-2 ${isSelected
                ? 'bg-primary border-primary'
                : 'border-gray-300'
                } items-center justify-center mr-3`}>
                {isSelected && (
                  <Ionicons name="checkmark" size={14} color="white" />
                )}
              </View>

              <View>
                {/* <Text className="mb-1">{t('works.post_on')}</Text> */}
                <Text className="text-caption text-textSecondary">
                  {formatRelativeTime(item.createdAt, currentLanguage)}
                </Text>
              </View>
            </View>

          </View>
        </View>

        <View className=''>

          {/* <View className='flex-row justify-between px-1'>

            <View className="flex-row gap-2 items-center">
              <Image
                source={item.createdBy.userProfileImage ? { uri: BASE_URL + item.createdBy.userProfileImage } : profileImage}
                className="w-10 h-10 rounded-full"
              />
              <Text>{item.createdBy.firstName} {item.createdBy.lastName}</Text>
            </View>
            <View>
              <Text className="text-caption text-textSecondary">
                {formatRelativeTime(item.createdAt, currentLanguage)}
              </Text>
            </View>
          </View> */}

          <View className='h-[1px] bg-border my-2' />
        </View>
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1 mr-3 ">
            <Text className="text-body font-semibold text-gray-900" numberOfLines={2}>
              {item.workTitle}
            </Text>

          </View>
          <View className="w-6 mr-3 ">
            {/* <Text className="text-body font-semibold text-gray-900" numberOfLines={2}>
                    ICON
                  </Text> */}

            <IconComponent
              size={24}
              color={item.serviceType.color || 'black'}
              strokeWidth={2}
            />

          </View>

        </View>

        <Text className="text-body text-gray-500 mb-3" numberOfLines={3}>
          {item.description}
        </Text>



        <View className='bg-background px-2 rounded-2xl p-2'>


          <View className=" flex-row items-center  ">

            <Text >{t('postWork.work_type')} : </Text>
            <Text className="text-caption text-text bg-surface p-2 rounded-full  ">
              {item.kindOfWork === "ONLINE" ? "Online" : "Offline"}
            </Text>
          </View>
          {item.budgetType === 'OFFERING' ? (
            <View className=''>
              <Text className="text-lg text-primary font-bold mr-2">{t('workDetail.offering_price')}</Text>
            </View>
          ) : (

            <View className="flex-row items-center">
              <Text>{t('postWork.budget')} : </Text>
              <Text className="font-bold text-body text-primary">
                {new Intl.NumberFormat().format(item.budget)}
              </Text>
              <Text className="font-bold text-body text-warning ml-2">{item.currency} </Text>
            </View>

          )}



          <View className="flex-row mt-3 items-center">
            <Text>{currentLanguage === 'la' ? 'ເລີ່ມ' : 'Start'} : </Text>

            <View className="flex-row gap-2 items-center">
              <Ionicons name="time-outline" size={18} color="#F59E0B" />
              <Text className="text-sm text-textSecondary">
                {/* {formatDate(item.deadLine as string, currentLanguage)} */}
                {formatDisplayDateTime(item.startDate as string)}
              </Text>
            </View>
          </View>
          <View className="flex-row mt-3 items-center">
            {/* <Text>{t('workDetail.deadline')} : </Text> */}
            <Text>{currentLanguage === 'la' ? 'ຫາ' : 'To'} : </Text>

            <View className="flex-row gap-2 items-center">
              <Ionicons name="time-outline" size={18} color="#F59E0B" />

              <Text className="text-sm text-textSecondary">
                {/* {formatDate(item.deadLine as string, currentLanguage)} */}

                {formatDisplayDateTime(item.deadLine as string)}
              </Text>
            </View>
          </View>

          {item?.createdBy?.address &&


            <View className="flex-row mt-3 items-center">
              {/* <Text>{t('workDetail.deadline')} : </Text> */}
              <Text>{t('payment_success.address')}:  </Text>

              <View className="flex-row gap-2 items-center">
                <Ionicons name="location-outline" size={18} color="#F59E0B" />

                <Text className="text-sm text-textSecondary">
                  {/* {formatDate(item.deadLine as string, currentLanguage)} */}

                  {item.createdBy.address.village}, {item.createdBy.address.district}, {item.createdBy.address.province}
                </Text>
              </View>
            </View>
          }

        </View>

      </Pressable>
    );
  };

  const renderReviewItem = ({ item }: { item: Job }) => {
    const IconComponent = getIcon(item?.serviceType?.icon);
    const updateData = projectUpdates.find(u => u.projectId === item._id);
    const currentToDateString = dateStrings[item._id] || '';
    const budgetError = errors[`${item._id}_budget`];
    const deadlineError = errors[`${item._id}_deadline`];

    // Individual picker state for this project
    const isPickerOpen = activePickerId === item._id;

    return (
      <View className="bg-surface rounded-2xl border border-border px-4 py-4 mb-4">
        {/* Header - Post Time */}
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1 pr-2">
            <View className="flex-row items-center mb-1 justify-end">
              <Text className="text-caption text-textSecondary">
                {formatRelativeTime(item.createdAt, currentLanguage)}
              </Text>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View className='h-[1px] bg-border my-2' />

        {/* Title and Icon */}
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1 mr-3">
            <Text className="text-body font-semibold text-gray-900" numberOfLines={2}>
              {item.workTitle}
            </Text>
          </View>
          <View className="w-6 mr-3">
            <IconComponent
              size={24}
              color={item.serviceType.color || 'black'}
              strokeWidth={2}
            />
          </View>
        </View>

        {/* Description */}
        <Text className="text-body text-gray-500 mb-3" numberOfLines={3}>
          {item.description}
        </Text>

        {/* Original Work Details */}
        <View className='bg-background px-2 rounded-2xl p-2'>
          {/* Work Type */}
          <View className="flex-row items-center">
            <Text>{t('postWork.work_type')} : </Text>
            <Text className="text-caption text-text bg-surface p-2 rounded-full">
              {item.kindOfWork === "ONLINE" ? "Online" : "Offline"}
            </Text>
          </View>

          {/* Budget */}
          {item.budgetType === 'OFFERING' ? (
            <View className='mt-2'>
              <Text className="text-lg text-primary font-bold mr-2">
                {t('workDetail.offering_price')}
              </Text>
            </View>
          ) : (
            <View className="flex-row items-center mt-2">
              <Text>{t('postWork.budget')} : </Text>
              <Text className="font-bold text-body text-primary">
                {new Intl.NumberFormat().format(item.budget)}
              </Text>
              <Text className="font-bold text-body text-warning ml-2">
                {item.currency}
              </Text>
            </View>
          )}

          {/* Start Date */}
          <View className="flex-row mt-3 items-center">
            <Text>{currentLanguage === 'la' ? 'ເລີ່ມ' : 'Start'} : </Text>
            <View className="flex-row gap-2 items-center ml-2">
              <Ionicons name="time-outline" size={18} color="#F59E0B" />
              <Text className="text-sm text-textSecondary">
                {formatDisplayDateTime(item.startDate as string)}
              </Text>
            </View>
          </View>

          {/* End Date */}
          <View className="flex-row mt-3 items-center">
            <Text>{currentLanguage === 'la' ? 'ຫາ' : 'To'} : </Text>
            <View className="flex-row gap-2 items-center ml-2">
              <Ionicons name="time-outline" size={18} color="#F59E0B" />
              <Text className="text-sm text-textSecondary">
                {formatDisplayDateTime(item.deadLine as string)}
              </Text>
            </View>
          </View>

          {/* Address */}
          {item?.createdBy?.address && (
            <View className="flex-row mt-3 items-center">
              <Text>{t('payment_success.address')}: </Text>
              <View className="flex-row gap-2 items-center ml-2">
                <Ionicons name="location-outline" size={18} color="#F59E0B" />
                <Text className="text-sm text-textSecondary">
                  {item.createdBy.address.village}, {item.createdBy.address.district}, {item.createdBy.address.province}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Offering Input Section */}
        <View className="mt-4">
          <Text className="text-lg font-bold text-primary mb-3">
            {t('chat.offer.your_offering') || 'Your Offering'}
          </Text>

          {/* Budget Input - REQUIRED */}
          <View className='mb-2'>
            <BudgetInput
              label={`${t('postWork.budget')}`}
              isChange={false}
              value={updateData?.newBudget || null}
              onChange={(value) => {
                const numValue = Number(value);

                // Update or create project update data
                setProjectUpdates(prev => {
                  const existing = prev.find(u => u.projectId === item._id);
                  if (existing) {
                    return prev.map(u =>
                      u.projectId === item._id
                        ? { ...u, newBudget: numValue }
                        : u
                    );
                  } else {
                    return [...prev, {
                      projectId: item._id,
                      newBudget: numValue,
                      newDeadline: '',
                      currency: item.currency
                    }];
                  }
                });

                // Clear budget error
                setErrors(prev => {
                  const newErrors = { ...prev };
                  delete newErrors[`${item._id}_budget`];
                  return newErrors;
                });
              }}
              currency={item?.currency}
              onCurrencyChange={() => { }}
              required
              error={budgetError ? true : false}
              isValidate={budgetError}
            />

          </View>



          {/* Deadline Input - NOW REQUIRED */}
          <View className="flex-row gap-2 items-end">
          

              <View className='flex-1'>

                <FormInput
                  label={`${currentLanguage === 'la' ? 'ຫາ' : 'Deadline'}`}
                  placeholder={currentLanguage === 'la' ? 'ວ/ດ/ປ' : 'dd/mm/yy'}
                  value={currentToDateString}
                  inputClassName={deadlineError ? 'border-error' : 'border-border'}
                  // isDateTime={true}

                  onChangeText={(text) => {
                    // Update date string
                    setDateStrings(prev => ({
                      ...prev,
                      [item._id]: text
                    }));

                    // Clear deadline error
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors[`${item._id}_deadline`];
                      return newErrors;
                    });

                    if (text.trim().length === 0) {
                      setProjectUpdates(prev => {
                        const existing = prev.find(u => u.projectId === item._id);
                        if (existing) {
                          return prev.map(u =>
                            u.projectId === item._id
                              ? { ...u, newDeadline: '' }
                              : u
                          );
                        }
                        return prev;
                      });
                      return;
                    }



                    // Try to parse the datetime
                    const parsedDate = parseDateTime(text);

                    if (!parsedDate) {
                      return;
                    }

                    // If user typed a full time and it was clamped, normalize display
                    if (text.length >= 16) {
                      setDateStrings(prev => ({
                        ...prev,
                        [item._id]: formatDateTimeForDisplay(parsedDate)
                      }));
                    }

                    // Update project updates with parsed date (keep time)
                    setProjectUpdates(prev => {
                      const existing = prev.find(u => u.projectId === item._id);
                      if (existing) {
                        return prev.map(u =>
                          u.projectId === item._id
                            ? { ...u, newDeadline: parsedDate.toISOString() }
                            : u
                        );
                      }
                      return [...prev, {
                        projectId: item._id,
                        newBudget: 0,
                        newDeadline: parsedDate.toISOString(),
                        currency: item.currency
                      }];
                    });
                  }}
                />
              </View>

              <View className="w-24">
                <FormInput
                  // label=""
                  placeholder={currentLanguage === 'la' ? 'ຊມ:ນທ' : 'HH:MM'}
                  value={timeStrings[item._id] || ''}
                  inputClassName={'border-border'}
                  isTime={true}
                  onChangeText={(text) => {
                    // Update time string
                    setTimeStrings(prev => ({
                      ...prev,
                      [item._id]: text
                    }));

                    // Parse and validate time format (HH:MM)
                    const timeRegex = /^([0-1]?[0-9]|2[0-3]):?([0-5][0-9])?$/;
                    if (text && timeRegex.test(text)) {
                      const timeParts = text.split(':');
                      let hours = parseInt(timeParts[0], 10);
                      let minutes = timeParts[1] ? parseInt(timeParts[1], 10) : 0;

                      // Validate time bounds
                      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
                        return;
                      }

                      // Get the current date from projectUpdates or use today
                      const updateData = projectUpdates.find(u => u.projectId === item._id);
                      let dateToUse = updateData?.newDeadline ? new Date(updateData.newDeadline) : new Date();

                      // Create new date with updated time
                      dateToUse.setHours(hours, minutes, 0, 0);

                      // Update project updates with new date+time
                      setProjectUpdates(prev => {
                        const existing = prev.find(u => u.projectId === item._id);
                        if (existing) {
                          return prev.map(u =>
                            u.projectId === item._id
                              ? { ...u, newDeadline: dateToUse.toISOString() }
                              : u
                          );
                        } else {
                          return [...prev, {
                            projectId: item._id,
                            newBudget: 0,
                            newDeadline: dateToUse.toISOString(),
                            currency: item.currency
                          }];
                        }
                      });
                    }
                  }}
                />
              </View>
        


            {/* Calendar Button */}
            <TouchableOpacity
              onPress={() => {
                // Set the temp date to current value or new Date
                const currentDate = updateData?.newDeadline && updateData.newDeadline !== ''
                  ? new Date(updateData.newDeadline)
                  : new Date();
                setTempDate(currentDate);
                setActivePickerId(item._id);
              }}
              className="bg-blue-200 flex justify-center items-center rounded-full p-4"
            >
              <MaterialIcons name="calendar-month" size={24} color="#2563EB" />
            </TouchableOpacity>
          </View>
          {deadlineError && (
            <Text className="text-error text-sm mt-1">{deadlineError}</Text>
          )}
          {/* DatePicker Modal - Show only for active project */}
          {isPickerOpen && (
            <DatePicker
              visible={isPickerOpen}
              date={updateData?.newDeadline && updateData.newDeadline !== '' ? new Date(updateData.newDeadline) : null}
              tempDate={tempDate}
              setTempDate={setTempDate}
              mode="datetime"
              setDate={(date: any) => {
                // Update or create project update data
                setProjectUpdates(prev => {
                  const existing = prev.find(u => u.projectId === item._id);
                  if (existing) {
                    return prev.map(u =>
                      u.projectId === item._id
                        ? { ...u, newDeadline: date.toISOString() }
                        : u
                    );
                  } else {
                    return [...prev, {
                      projectId: item._id,
                      newBudget: 0,
                      newDeadline: date.toISOString(),
                      currency: item.currency
                    }];
                  }
                });

                // Update date string for display with time
                const formattedDateTime = formatDateTimeForDisplay(date);

                setDateStrings(prev => ({
                  ...prev,
                  [item._id]: formattedDateTime
                }));

                // Extract and update time string (HH:MM format)
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                const timeString = `${hours}:${minutes}`;

                setTimeStrings(prev => ({
                  ...prev,
                  [item._id]: timeString
                }));

                // Clear deadline error
                setErrors(prev => {
                  const newErrors = { ...prev };
                  delete newErrors[`${item._id}_deadline`];
                  return newErrors;
                });

                // Close picker
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
    <ScreenWrapper safeEdges={['bottom', 'top']}>
      {/* Header */}

      <View className='border-b border-border '>

        <View className="flex-row items-center justify-between px-4 py-4  bg-surface">
          <View className='flex-row gap-2'>


            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>

            <Text className="text-lg font-semibold text-text">
              {t('chat.offer.select_project')} ({selectedProjects.length})
            </Text>
          </View>

          <View className='flex-row gap-2'>

            {selectedTab === 'customerwork' && user.businessType === 'FREELANCER' && (

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
            )}

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
        </View>

        {!isCustomer && (
          <View className="px-4 mb-4">
            {/* Main Container: Provides a subtle track for the tabs */}
            <View className="flex-row p-1 bg-gray-100 rounded-2xl border border-gray-200">

              {/* Customer Work Tab */}
              <Pressable
                // activeOpacity={0.7}
                onPress={() => {

                  setSelectedTab('customerwork');
                  setSelectedProjects([]);

                }}
                className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl  ${selectedTab === 'customerwork' ? 'bg-primary text-surface' : '#6b7280'}
                 `}
              >
                <Ionicons
                  name="briefcase"
                  size={18}
                  color={selectedTab === 'customerwork' ? '#fff' : '#9CA3AF'}
                />
                <Text
                  className={`ml-2 font-bold text-sm ${selectedTab === 'customerwork' ? 'text-surface' : 'text-gray-500'
                    }`}
                >
                  {t('chat.offer.customerWork')}
                </Text>
              </Pressable>

              {/* My Work Tab */}
              <Pressable
                // activeOpacity={0.7}
                onPress={() => {
                  setSelectedTab('mywork');
                  setSelectedProjects([]);

                }}
                className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl ${selectedTab === 'mywork' ? 'bg-primary text-surface' : '#6b7280'} `}
              >
                <Ionicons
                  name="person"
                  size={18}
                  color={selectedTab === 'mywork' ? '#fff' : '#9CA3AF'}
                />
                <Text
                  className={`ml-2 font-bold text-sm ${selectedTab === 'mywork' ? 'text-surface' : 'text-gray-500'
                    }`}
                >
                  {t('chat.offer.mywork')}
                </Text>
              </Pressable>

            </View>
          </View>
        )}
      </View>

      {/* Projects List */}
      <View className="flex-1 px-4 py-4">
        {workIsloading ? (
          <JobListItem />
        ) : workData.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="folder-open-outline" size={64} color="#9CA3AF" />
            <Text className="text-textSecondary text-center mt-4">
              {t('workDetail.nowork_available')}
            </Text>
          </View>
        ) : (
          <FlatList
            data={displayedData}
            keyExtractor={(item) => item._id}
            renderItem={renderProjectItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            // onScroll={}
            onEndReached={handleLoadMore}
            ListFooterComponent={
              displayedData.length < workData.length && !workIsloading ? (
                <View className="py-4">
                  <Text className="text-center text-textSecondary">{t('home.loading_more')}</Text>
                </View>
              ) : null
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#2B68F2']}
                tintColor="#2B68F2"
                title={t('works.error.refresh')}
              />}

          />
        )}
      </View>

    </ScreenWrapper>
  );

  const renderReviewStep = () => (

    <ScreenWrapper safeEdges={['bottom', 'top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-border bg-surface">
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color="#3B82F6" />
        </TouchableOpacity>

        {/* <Text className="text-lg font-semibold text-text">
          Review & Send
        </Text> */}

        <TouchableOpacity
          onPress={handleSendOffer}
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
      {currentStep === 'selection' ? renderSelectionStep() : renderReviewStep()}

    </Modal>
  );
};

export default ProjectSelectionModal;
