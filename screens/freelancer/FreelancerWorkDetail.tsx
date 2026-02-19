import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert, TextInput as RNTextInput, Pressable, Modal, Linking, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';
import ReviewModal from 'components/freelancer/ReviewModal';
import { ScrollView } from 'react-native-gesture-handler';
import { useAcceptWork, useCompleteWork, usePublicWorkById, useSubmitWork, useUpdateSubworkStatus, useUpdateWorkById } from 'hooks/usePublicWork';
import LoadingScreen from 'screens/Loading/LoadingScreen';
import { SubWorkDetail, SubTask, ExampleWork, CreateReview } from 'types';
import { ALERT_TYPE, Toast } from 'react-native-alert-notification';
import { formatRelativeTime, getCurrentLanguage } from 'utils/dateFormatter';
import { useAuth } from 'hooks/useAuth';
import InterestedFreelancer from './InterestedFreelancer';
import { useTranslation } from 'react-i18next';
import { profileImage } from 'assets';
import BudgetInput from 'components/ui/BudgetInput';

type AuthFreelancerProfileRouteProp = RouteProp<FreelancerStackParamList, 'FreelancerWorkDetail'>;

type Props = {
  route: AuthFreelancerProfileRouteProp;
};

type SubWorkStatus = 'TODO' | 'DOING' | 'DONE' | 'DELAY' | 'FAILED';

export default function FreelancerWorkDetail({ route }: Props) {
  // ============= ALL HOOKS MUST BE AT THE TOP =============
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
  const params = route.params;
  const language = getCurrentLanguage();
  const { user } = useAuth();
  const { t } = useTranslation();
  const IMAGE_BASE_URL = process.env.EXPO_PUBLIC_IMAGES_URL;

  // State hooks
  const [activeTab, setActiveTab] = useState<'overview' | 'subwork'>('overview');
  const [expandedItems, setExpandedItems] = useState<{ [key: string]: boolean }>({});
  const [showStatusDropdown, setShowStatusDropdown] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'submitted' | 'error'>('idle');
  const [jobDetailVisible, setJobDetailVisible] = useState(false);
  const [isReview, setIsReview] = useState<boolean>(false);
  const [acceptState, setAcceptState] = useState<'idle' | 'accepting' | 'accepted'>('idle');
  const [completeState, setCompleteState] = useState<'notyet' | 'completing' | 'completed'>('notyet');
  const [budget, setBudget] = useState<number | null>(null);
  const [ispriceEdit, setIspriceEdit] = useState(false);
  const [budgetType, setBudgetType] = useState<'FIXED_PRICE' | 'HOURLY' | 'OFFERING'>();
  const [budgetCurrency, setBudgetCurrency] = useState<'LAK' | 'USD'>('LAK');
  const [errors, setErrors] = useState({ budget: false });
  const [refreshing, setRefreshing] = useState(false);
  const [subWorkItems, setSubWorkItems] = useState<SubWorkDetail[]>([]);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSubTitles, setNewSubTitles] = useState<{ [key: string]: string }>({});
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
  const [editingSubTaskKey, setEditingSubTaskKey] = useState<string | null>(null);
  const [editedSectionTitle, setEditedSectionTitle] = useState('');
  const [editedSubTaskTitle, setEditedSubTaskTitle] = useState('');

  // API hooks
  const { data: workData, isLoading, refetch } = usePublicWorkById(params.workId);
  const updateStatusMutation = useUpdateSubworkStatus();
  const submitWork = useSubmitWork();
  const acceptWork = useAcceptWork();
  const completetWork = useCompleteWork();
  const updateWorkById = useUpdateWorkById();

  // Constants
  const statusOptions: SubWorkStatus[] = ['TODO', 'DOING', 'DONE', 'DELAY', 'FAILED'];
  const data = workData?.work;

  console.log("Data", JSON.stringify(data?.appendWorks, null, 2));
  // ============= EFFECTS =============
  // Refetch work data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  // Update local state when data changes
  useEffect(() => {
    if (data?.subWorkDetails) {
      setSubWorkItems(data.subWorkDetails);
    }
    if (data?.budget !== undefined) {
      setBudget(data.budget);
    }
    if (data?.budgetType) {
      setBudgetType(data.budgetType);
    }
    // Reset accept state when work status changes from ASSIGNED_WORKER
    if (data?.workStatus !== 'ASSIGNED_WORKER') {
      setAcceptState('idle');
    }
  }, [data]);

  // ============= CALLBACKS =============
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.log('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleJobPress = useCallback(() => {
    setJobDetailVisible(true);
  }, []);

  const handleCloseJobDetail = useCallback(() => {
    setJobDetailVisible(false);
  }, []);

  const handleUserProfileNavigation = useCallback((userId: string) => {
    setJobDetailVisible(false);
    navigation.navigate('FreelancerProfile', { userId });
  }, [navigation]);

  // ============= HELPER FUNCTIONS =============
  const toggleExpand = (sectionId: number) => {
    setExpandedItems(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const stripIds = (data: SubWorkDetail[]) => {
    return data.map(section => ({
      sectionTitle: section.sectionTitle,
      subTask: section.subTask.map(task => ({
        title: task.title,
        subWorkStatus: task.subWorkStatus
      }))
    }));
  };

  const getStatusBadgeColor = (status: SubWorkStatus) => {
    switch (status) {
      case 'TODO': return { bg: '#E5E7EB', text: '#6B7280' };
      case 'DOING': return { bg: '#3B82F6', text: '#FFFFFF' };
      case 'DONE': return { bg: '#10B981', text: '#FFFFFF' };
      case 'DELAY': return { bg: '#F59E0B', text: '#FFFFFF' };
      case 'FAILED': return { bg: '#EF4444', text: '#FFFFFF' };
      default: return { bg: '#E5E7EB', text: '#6B7280' };
    }
  };

  const shouldShowAddButton = () => {
    if (!data || !user) return false;

    const isCustomer = data?.createdBy?._id === user?._id;
    const isFreelancer = data?.assignedTo?._id === user?._id;

    const hiddenStatuses = ['AWAITING_COMPLETED', 'COMPLETED', 'DELAY'];
    if (hiddenStatuses.includes(data?.workStatus as string)) {
      return false;
    }

    if (isCustomer) {
      const customerVisibleStatuses = ['PUBLISHED', 'PRIVATE', 'ASSIGNED_WORKER', 'ASSIGNED_AWAIT_PAYMENT', 'DOING'];
      return customerVisibleStatuses.includes(data?.workStatus as string);
    }
    if (isFreelancer) {
      return data?.workStatus === 'DOING'
    }

    return false;
  }

  // ============= ACTION HANDLERS =============
  const handleStatusChange = async (sectionId: number, subTaskIndex: number, newStatus: SubWorkStatus) => {
    try {
      const updatedSubWorkItems = subWorkItems.map((section, idx) =>
        idx === sectionId
          ? {
            ...section,
            subTask: section.subTask.map((task, index) =>
              index === subTaskIndex
                ? { ...task, subWorkStatus: newStatus }
                : task
            )
          }
          : section
      );

      setSubWorkItems(updatedSubWorkItems);

      await updateStatusMutation.mutateAsync({
        id: params.workId,
        data: stripIds(updatedSubWorkItems)
      });
      await refetch();

    } catch (error) {
      console.log('Failed to update status:', error);
      await refetch();
    } finally {
      setShowStatusDropdown(null);
    }
  };

  const addNewSection = async () => {
    if (!newSectionTitle.trim()) return;

    const newSection: SubWorkDetail = {
      sectionTitle: newSectionTitle.trim(),
      subTask: []
    };

    const updatedSubWorkItems = [...subWorkItems, newSection];

    setSubWorkItems(updatedSubWorkItems);
    setNewSectionTitle('');

    try {
      await updateStatusMutation.mutateAsync({
        id: params.workId,
        data: stripIds(updatedSubWorkItems)
      });
      await refetch();
    } catch (error) {
      console.log('Failed to add section:', error);
    }
  };

  const addSubTask = async (sectionId: number) => {
    const title = newSubTitles[sectionId];
    if (!title?.trim()) return;

    const newSubTask: SubTask = {
      title: title.trim(),
      subWorkStatus: 'TODO',
    };

    const updatedSubWorkItems = subWorkItems.map((section, idx) =>
      idx === sectionId
        ? {
          ...section,
          subTask: [...section.subTask, newSubTask]
        }
        : section
    );

    setSubWorkItems(updatedSubWorkItems);
    setNewSubTitles(prev => ({ ...prev, [sectionId]: '' }));

    try {
      await updateStatusMutation.mutateAsync({
        id: params.workId,
        data: stripIds(updatedSubWorkItems)
      });
      await refetch();
    } catch (error) {
      console.log('Failed to add subtask:', error);
    }
  };

  const handleSectionTitleLongPress = (sectionId: number, currentTitle: string) => {
    setEditingSectionId(sectionId);
    setEditedSectionTitle(currentTitle);
  };

  const handleSubTaskTitleLongPress = (sectionId: number, subTaskIndex: number, currentTitle: string) => {
    const key = `${sectionId}-${subTaskIndex}`;
    setEditingSubTaskKey(key);
    setEditedSubTaskTitle(currentTitle);
  };

  const handleSectionEditBlur = async (sectionId: number) => {
    if (!editedSectionTitle.trim()) {
      Alert.alert(`${t('workDetail.delete_section')}`, `${t('workDetail.delete_section_confirm')}`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `${t('workDetail.delete')}`,
          style: 'destructive',
          onPress: () => {
            setSubWorkItems(prev => prev.filter((section, idx) => idx !== sectionId));
          }
        }
      ]);
    } else {
      const updatedSubWorkItems = subWorkItems.map((section, idx) =>
        idx === sectionId
          ? { ...section, sectionTitle: editedSectionTitle.trim() }
          : section
      );

      setSubWorkItems(updatedSubWorkItems);

      try {
        await updateStatusMutation.mutateAsync({
          id: params.workId,
          data: stripIds(updatedSubWorkItems)
        });
      } catch (error) {
        console.log('Failed to update section title:', error);
      }
    }
    setEditingSectionId(null);
    setEditedSectionTitle('');
  };

  const handleSubTaskEditBlur = async (sectionId: number, subTaskIndex: number) => {
    const updatedSubWorkItems = subWorkItems.map((section, idx) =>
      idx === sectionId
        ? {
          ...section,
          subTask: !editedSubTaskTitle.trim()
            ? section.subTask.filter((_, index) => index !== subTaskIndex)
            : section.subTask.map((task, index) =>
              index === subTaskIndex
                ? { ...task, title: editedSubTaskTitle.trim() }
                : task
            )
        }
        : section
    );

    setSubWorkItems(updatedSubWorkItems);

    try {
      await updateStatusMutation.mutateAsync({
        id: params.workId,
        data: stripIds(updatedSubWorkItems)
      });
    } catch (error) {
      console.log('Failed to update subtask:', error);
    }

    setEditingSubTaskKey(null);
    setEditedSubTaskTitle('');
  };

  const handleAcceptWork = async () => {
    setAcceptState('accepting');
    try {
      await acceptWork.mutateAsync({
        id: params.workId,
        data: { workStatus: 'EXCEPTED' }
      });

      setAcceptState('accepted');

      Toast.show({
        type: ALERT_TYPE.SUCCESS,
        title: `${t('workDetail.success')}`,
        textBody: `${t('workDetail.textBody_of_accept_success')}`,
      });

      await refetch();

    } catch (error) {
      console.log('Failed to accept work:', error);
      setAcceptState('idle');

      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: 'OOP!',
        textBody: `${t('workDetail.textBody_of_error')}`,
      });
    }
  }

  const handleConfirmWork = async () => {
    try {
      await completetWork.mutateAsync({
        id: params.workId,
        data: { workStatus: 'CONFIRM' }
      });

      setCompleteState('completed');

      Toast.show({
        type: ALERT_TYPE.SUCCESS,
        title: `${t('workDetail.success')}`,
        textBody: `${t('workDetail.textBody_of_accept_success')}`,
      });

      await refetch();

    } catch (error) {
      console.log('Failed to accept work:', error);
      setCompleteState('notyet');

      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: 'OOP!',
        textBody: `${t('workDetail.textBody_of_error')}`,
      });
    }
  }

  const priceUpdate = async () => {
    const newErrors = {
      budget: budget === 0,
    };
    setErrors(newErrors);

    try {
      const formData = {
        budget: budget,
        budgetType: budgetType,
      };

      if (!params?.workId) {
        console.log('Missing workId parameter');
        return;
      }

      await updateWorkById.mutateAsync({
        id: params.workId,
        data: formData
      });
      await refetch();
      setIspriceEdit(false);
    } catch (error) {
      console.log('Failed to update work:', error);
    }
  }

  const handleSubmitWork = async () => {
    setSubmitState('submitting');
    try {
      await submitWork.mutateAsync({ id: params.workId });
      setSubmitState('submitted');

      Toast.show({
        type: ALERT_TYPE.SUCCESS,
        title: `${t('workDetail.success')}`,
        textBody: `${t('workDetail.textBody_of_sucess')}`,
      });

    } catch (error) {
      console.log('Failed to submit work:', error);

      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error!',
        textBody: 'Failed to submit work. Please try again.',
      });
      setSubmitState('error');
      setTimeout(() => {
        setSubmitState('idle');
      }, 3000);
    }
  };

  // ============= EARLY RETURN AFTER ALL HOOKS =============
  if (!data || isLoading || !user || !workData?.work) {
    return <LoadingScreen />;
  }

  // ============= RENDER COMPONENTS =============
  type FileViewerModalProps = {
    visible: boolean;
    type: ExampleWork['exampleType'];
    url: string;
    onClose: () => void;
  };

  const FileViewerModal: React.FC<FileViewerModalProps> = ({ visible, type, url, onClose }) => {
    if (!visible) return null;

    return (
      <Modal visible={visible} transparent animationType="fade">
        <View className="flex-1 bg-black/90 justify-center items-center p-4">
          <TouchableOpacity
            onPress={onClose}
            className="absolute top-10 right-4 z-10 bg-surface/20 p-2 rounded-full"
          >
            <Ionicons name="close" size={24} color="surface" />
          </TouchableOpacity>

          {type === 'IMAGE' && (
            <Image
              source={{ uri: url }}
              className="w-full h-80 rounded-lg"
              resizeMode="contain"
            />
          )}

          {type === 'VIDEO' && (
            <View className="w-full h-80 bg-black/50 rounded-lg justify-center items-center">
              <Ionicons name="play-circle" size={64} color="surface" />
              <Text className="text-surface mt-2">{t('workDetail.video_preview_not_available')}</Text>
              <Text className="text-surface text-sm">{t('workDetail.tap_to_open')}</Text>
            </View>
          )}

          {(type === 'TEXT' || type === 'FILE') && (
            <View className="w-full h-80 bg-surface rounded-lg justify-center items-center p-4">
              <Ionicons name="document" size={64} color="#3B82F6" />
              <Text className="text-text mt-2 text-center">
                {t('workDetail.file_cannot_preview')}
              </Text>
            </View>
          )}

          {type === 'LINK' && (
            <View className="w-full h-80 bg-surface rounded-lg justify-center items-center p-4">
              <Ionicons name="link" size={64} color="#3B82F6" />
              <Text className="text-text mt-2 text-center">
                {t('workDetail.external_link')} {url}
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={() => Linking.openURL(url)}
            className="bg-primary mt-4 px-6 py-3 rounded-full"
          >
            <Text className="text-white font-semibold">{t('workDetail.open_in_browser')}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  };

  const ExampleWorkDisplay: React.FC<{ exampleWork: ExampleWork[] }> = ({ exampleWork }) => {
    const [selectedFile, setSelectedFile] = useState<{ type: ExampleWork['exampleType']; url: string } | null>(null);

    const getIconProps = (type: ExampleWork['exampleType']) => {
      switch (type) {
        case 'IMAGE':
          return { name: 'image', color: '#3B82F6', bg: 'bg-blue-100' };
        case 'VIDEO':
          return { name: 'videocam', color: '#EF4444', bg: 'bg-red-100' };
        case 'TEXT':
          return { name: 'document-text', color: '#10B981', bg: 'bg-green-100' };
        case 'FILE':
          return { name: 'document', color: '#8B5CF6', bg: 'bg-purple-100' };
        case 'LINK':
          return { name: 'link', color: '#F59E0B', bg: 'bg-amber-100' };
        default:
          return { name: 'document', color: '#6B7280', bg: 'bg-gray-100' };
      }
    };

    const handleFilePress = async (type: ExampleWork['exampleType'], url: string) => {
      try {
        if (type === 'IMAGE' || type === 'VIDEO') {
          setSelectedFile({ type, url });
        } else {
          const supported = await Linking.canOpenURL(url);
          if (supported) {
            await Linking.openURL(url);
          } else {
            Alert.alert('OOP! ', `${t('workDetail.cannot_open_file')}`);
          }
        }
      } catch (error) {
        Alert.alert('Sorry! ', `${t('workDetail.failed_to_open')}`);
      }
    };

    if (!exampleWork || exampleWork.length === 0) {
      return null;
    }

    return (
      <>
        <Text className="text-caption text-textSecondary font-bold my-1">{t('workDetail.example_work')}</Text>
        <View className="flex-row flex-wrap gap-3 mb-3">
          {exampleWork.map((item) => {
            const iconProps = getIconProps(item.exampleType);

            return (
              <TouchableOpacity
                key={item._id}
                onPress={() => handleFilePress(item.exampleType, item.detail)}
                className={`w-14 h-14 rounded-lg justify-center items-center ${iconProps.bg}`}
              >
                <Ionicons name={iconProps.name as any} size={24} color={iconProps.color} />
              </TouchableOpacity>
            );
          })}
        </View>

        <FileViewerModal
          visible={!!selectedFile}
          type={selectedFile?.type || 'LINK'}
          url={selectedFile?.url || ''}
          onClose={() => setSelectedFile(null)}
        />
      </>
    );
  };

  const renderWorkOverview = () => (

    <>
      <View className="bg-surface rounded-2xl p-4 shadow-sm">
        <View className='flex-row items-center justify-end mb-4'>
          <View className="ml-2 bg-blue-100 w-32 px-3 py-2 rounded-full">
            <Text className="text-secondary text-caption text-center font-medium">{data?.kindOfWork}</Text>
          </View>
        </View>
        <View className="flex-row items-center mb-2">
          <Text className="text-subheading text-text font-semibold">{data?.workTitle}</Text>
        </View>
        <Text className="text-body text-textSecondary mb-1 font-bold ">{t('workDetail.description')}</Text>
        <Text className="text-body text-textSecondary mb-2 p-4 bg-background rounded-2xl">{data?.description}</Text>

        <ExampleWorkDisplay exampleWork={data?.exampleWork || []} />

        <Text className="text-body text-textSecondary font-bold mt-3 mb-2">{t('workDetail.categories')}</Text>
        <View className="bg-gray-100 w-[100px] px-3 py-1 rounded-full mb-4">
          <Text className="text-primary text-caption  text-center">{data?.serviceType?.name}</Text>
        </View>

        {ispriceEdit ? (
          <View className='flex-row items-center gap-4'>
            <View className="bg-blue-50 flex-1 p-4 rounded-2xl mb-4">
              <Text className="text-body mb-2 text-text font-bold">{t('postWork.budget_type')}</Text>
              <View className="flex-row space-x-4 gap-2 mb-6">
                {['FIXED_PRICE', 'HOURLY', 'OFFERING'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setBudgetType(type as 'FIXED_PRICE' | 'HOURLY' | 'OFFERING')}
                    className={`flex-1 border py-4 rounded-xl items-center ${budgetType === type ? 'border-primary bg-blue-50' : 'border-border'}`}
                  >
                    <View className="flex-row items-center gap-2">
                      {budgetType === type && <Ionicons name="checkmark-circle" size={16} color="#3B82F6" />}
                      <Text className="text-caption text-text">
                        {type === 'FIXED_PRICE'
                          ? `${t('postWork.fixed_price')}`
                          : type === 'HOURLY'
                            ? `${t('postWork.hourly')}`
                            : `${t('postWork.offering')}`
                        }
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {budgetType === 'OFFERING' ? (
                <View className='flex-row mb-4'>
                  <Text className="text-lg text-primary font-bold mr-2">{t('workDetail.offering_price')}</Text>
                </View>
              ) : (
                <BudgetInput
                  label={t('postWork.budget')}
                  value={budget}
                  onChange={setBudget}
                  currency={budgetCurrency}
                  onCurrencyChange={setBudgetCurrency}
                  error={errors.budget}
                  classNamebuget="flex-1"
                />
              )}

              <View className='flex-col gap-2 mt-3'>
                <Pressable onPress={() => priceUpdate()} className='bg-primary rounded-2xl p-4'>
                  <Text className='text-surface text-center'>
                    {t('editWork.updateButton')}
                  </Text>
                </Pressable>
                <Pressable onPress={() => {
                  setIspriceEdit(false)
                  setBudget(data?.budget)
                }} className='bg-background rounded-2xl p-4'>
                  <Text className='text-error text-center'>
                    {t('workDetail.cancel')}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        ) : (
          <View className="flex-row items-center mb-2 gap-2">
            {data?.budgetType === 'OFFERING' ? (
              <View className='flex-row '>
                <Text className="text-lg text-primary font-bold mr-2">{t('workDetail.offering_price')}</Text>
              </View>
            ) : (
              <View className='flex-row '>
                <Text className="text-lg text-warning font-bold mr-2">{data?.currency}</Text>
                <Text className="text-lg text-success font-bold mr-2">{new Intl.NumberFormat().format(data?.budget)}</Text>
              </View>
            )}

            {data?.workStatus === 'PUBLISHED' && user?._id === data?.createdBy?._id && (
              <Pressable onPress={() => setIspriceEdit(true)} className='bg-background rounded-full p-2'>
                <Ionicons name="create-outline" size={24} color="#3B82F6" />
              </Pressable>
            )}
          </View>
        )}

        <View className="flex-row items-center gap-2 mt-2">
          <Ionicons name="time-outline" size={16} color="#6B7280" />
          <Text className="text-caption text-textSecondary">{t('postWork.from')}: {formatRelativeTime(data?.startDate as string, language)}</Text>
        </View>
        <View className="flex-row items-center gap-2 mt-2">
          <Ionicons name="time-outline" size={16} color="#6B7280" />
          <Text className="text-caption text-textSecondary">{t('postWork.to')}: {formatRelativeTime(data?.deadLine as string, language)}</Text>
        </View>
      </View>

      {/* appendWorks */}

      {data?.appendWorks.map((appendWork, index) => {

        <View className="mt-4" key={index}>
          <Text className="text-subheading text-primary font-semibold mb-2">{t('workDetail.appendWorks')}</Text>

          <View className='bg-blue-50 p-4'>
            <View className="flex-row items-center mb-2 gap-2">
              
                <View className='flex-row '>
                  <Text className="text-lg text-warning font-bold mr-2">{appendWork?.currency}</Text>
                  <Text className="text-lg text-success font-bold mr-2">{new Intl.NumberFormat().format(appendWork?.budget)}</Text>
                </View>
            </View>
            <View className="flex-row items-center gap-2 mt-2">
              <Ionicons name="time-outline" size={16} color="#6B7280" />
              <Text className="text-caption text-textSecondary">{t('postWork.to')}: {formatRelativeTime(appendWork?.deadLine as string, language)}</Text>
            </View>
          </View>


        </View>
      }


      )}

    </>
  );

  const renderSubWorkList = () => (
    <View className="rounded-2xl">
      <View className="mb-4 bg-primary p-2 rounded-xl">
        <Text className="text-subheading text-surface font-semibold mb-2">{t('workDetail.progress')}</Text>
        <Text className="text-4xl font-bold text-success mb-1">{Number(data?.totalDonePercent).toFixed(0)}%</Text>
        <Text className="text-caption text-surface">{t('workDetail.step_by_step')}</Text>
      </View>

      <View>
        {subWorkItems.map((section, idx) => {
          const isExpanded = expandedItems[idx];
          const allSubTasksDone = section.subTask.length > 0 &&
            section.subTask.every(task => task.subWorkStatus === 'DONE');

          return (
            <View key={idx} className="mb-3 bg-surface border border-border px-2 py-3 rounded-xl">
              <View className="flex-row items-center py-3">
                <View className="w-8 h-8 rounded-full justify-center items-center mr-3"
                  style={{ backgroundColor: allSubTasksDone ? '#10B981' : '#E5E7EB' }}>
                  <Text className="text-white text-caption font-bold">{subWorkItems.indexOf(section) + 1}</Text>
                </View>

                {editingSectionId === idx ? (
                  <RNTextInput
                    value={editedSectionTitle}
                    onChangeText={setEditedSectionTitle}
                    onBlur={() => handleSectionEditBlur(idx)}
                    autoFocus
                    className="flex-1 text-body text-text border-b border-primary"
                  />
                ) : (
                  data?.workStatus === 'DOING' && data?.createdBy?._id !== user?._id ? (
                    <TouchableOpacity
                      onPress={() => toggleExpand(idx)}
                      onLongPress={() => handleSectionTitleLongPress(idx, section.sectionTitle)}
                      className="flex-1"
                    >
                      <Text className="text-body text-text font-medium">{section.sectionTitle}</Text>
                    </TouchableOpacity>
                  ) : (
                    <View className="flex-1">
                      <Text className="text-body text-text font-medium">{section.sectionTitle}</Text>
                    </View>
                  )
                )}

                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#6B7280"
                  onPress={() => toggleExpand(idx)}
                />
              </View>

              {isExpanded && (
                <View className="ml-1 mt-2">
                  {section.subTask.map((subTask, subTaskIndex) => {
                    const statusKey = `${idx}-${subTaskIndex}`;
                    const currentStatus = subTask.subWorkStatus;
                    const statusColors = getStatusBadgeColor(currentStatus);
                    const dropdownKey = statusKey;

                    return (
                      <View key={subTaskIndex} className="mb-2 relative">
                        {editingSubTaskKey === statusKey ? (
                          <RNTextInput
                            value={editedSubTaskTitle}
                            onChangeText={setEditedSubTaskTitle}
                            onBlur={() => handleSubTaskEditBlur(idx, subTaskIndex)}
                            autoFocus
                            className="ml-2 flex-1 border-b border-primary text-body text-text"
                          />
                        ) : (
                          <View className="flex-row items-center justify-between py-3 px-3 bg-gray-50 rounded-lg">
                            {data?.workStatus === 'DOING' && data?.createdBy?._id !== user?._id ? (
                              <>
                                <TouchableOpacity
                                  onLongPress={() => handleSubTaskTitleLongPress(idx, subTaskIndex, subTask.title)}
                                  className="flex-row items-center flex-1"
                                >
                                  <Ionicons name="arrow-forward" size={16} color="#3B82F6" />
                                  <Text className="text-body text-text ml-2">{subTask.title}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  className="px-3 py-1 rounded-full flex-row items-center"
                                  style={{ backgroundColor: statusColors.bg }}
                                  onPress={() => setShowStatusDropdown(showStatusDropdown === dropdownKey ? null : dropdownKey)}
                                >
                                  <Text className="text-caption font-medium mr-1" style={{ color: statusColors.text }}>
                                    {currentStatus}
                                  </Text>
                                  <Ionicons name="chevron-down" size={12} color={statusColors.text} />
                                </TouchableOpacity>
                              </>
                            ) : (
                              <>
                                <View className="flex-row items-center flex-1">
                                  <Ionicons name="arrow-forward" size={16} color="#3B82F6" />
                                  <Text className="text-body text-text ml-2">{subTask.title}</Text>
                                </View>
                                <View
                                  className="px-3 py-1 rounded-full flex-row items-center"
                                  style={{ backgroundColor: statusColors.bg }}
                                >
                                  <Text className="text-caption font-medium mr-1" style={{ color: statusColors.text }}>
                                    {currentStatus}
                                  </Text>
                                  <Ionicons name="chevron-down" size={12} color={statusColors.text} />
                                </View>
                              </>
                            )}
                          </View>
                        )}

                        {showStatusDropdown === dropdownKey && (
                          <View className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-border z-10 min-w-[100px]">
                            {statusOptions.map((status) => {
                              const optionColors = getStatusBadgeColor(status);
                              return (
                                <TouchableOpacity
                                  key={status}
                                  className="px-3 py-2 border-b border-border"
                                  onPress={() => handleStatusChange(idx, subTaskIndex, status)}
                                >
                                  <View className="flex-row items-center">
                                    <View className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: optionColors.bg }} />
                                    <Text className="text-body text-text">{status}</Text>
                                  </View>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        )}
                      </View>
                    );
                  })}

                  {data?.workStatus === "DOING" && data?.createdBy?._id !== user?._id && (
                    <View className="flex-row mt-2 items-center justify-between border border-border px-3 py-1 rounded-full bg-gray-50">
                      <View className="flex-row items-center flex-1">
                        <Ionicons name="arrow-forward" size={16} color="#3B7280" />
                        <TextInput
                          placeholder="Add sub task..."
                          value={newSubTitles[idx] || ''}
                          onChangeText={(text) => setNewSubTitles(prev => ({ ...prev, [idx]: text }))}
                          className="ml-2 flex-1 text-body text-text"
                        />
                      </View>
                      <TouchableOpacity onPress={() => addSubTask(idx)}>
                        <Text className="text-primary font-medium">Add +</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </View>

      {shouldShowAddButton() && (
        <View className="mt-4 px-3 py-2 bg-gray-50 border border-border rounded-full flex-row items-center justify-between">
          <TextInput
            placeholder="Add new section..."
            value={newSectionTitle}
            onChangeText={setNewSectionTitle}
            className="flex-1 text-body text-text"
          />
          <TouchableOpacity onPress={addNewSection}>
            <Text className="text-primary font-medium">Add +</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // ============= MAIN RENDER =============
  return (
    <ScreenWrapper>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {/* Header */}
        <View className='bg-primary px-4 pt-12 pb-4 flex-row items-center justify-between'>
          {data?.workStatus === "PUBLISHED" || data?.workStatus === "PRIVATE" ? (
            <View className="flex-row items-center">
              <TouchableOpacity onPress={() => navigation.goBack()} className='mr-4'>
                <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <View>
                <Text className="text-white font-semibold text-subheading">{t('workDetail.work_detail')}</Text>
                <Text className="text-white text-caption opacity-80">{t('workDetail.look_all_details')}</Text>
              </View>
            </View>
          ) : (
            <>
              {data?.createdBy?._id === user?._id ? (
                <View className="flex-row items-center">
                  <TouchableOpacity onPress={() => navigation.goBack()} className='mr-4'>
                    <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                  <Image
                    source={{ uri: data?.assignedTo?.userProfileImage ? IMAGE_BASE_URL + data?.assignedTo?.userProfileImage : profileImage }}
                    className="w-10 h-10 rounded-full mr-3"
                  />
                  <View>
                    <Text className="text-white font-semibold text-base">{data?.assignedTo?.firstName}</Text>
                    <Text className="text-white text-caption opacity-80">{data?.assignedTo?.lastName}</Text>
                  </View>
                </View>
              ) : (
                <View className="flex-row items-center">
                  <TouchableOpacity onPress={() => navigation.goBack()} className='mr-4'>
                    <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                  <Image
                    source={{ uri: data?.createdBy?.userProfileImage ? IMAGE_BASE_URL + data?.createdBy?.userProfileImage : profileImage }}
                    className="w-10 h-10 rounded-full mr-3"
                  />
                  <View>
                    <Text className="text-white font-semibold text-base">{data?.createdBy?.firstName}</Text>
                    <Text className="text-white text-caption opacity-80">{data?.createdBy?.lastName}</Text>
                  </View>
                </View>
              )}
            </>
          )}

          {data?.createdBy?._id === user?._id &&
            (data?.workStatus === "PUBLISHED" ||
              data?.workStatus === "PRIVATE" ||
              data?.workStatus === "ASSIGNED_WORKER") && (
              <Pressable onPress={() => navigation.navigate('EditWorkById', { workId: data?._id })} className='p-3'>
                <Text className="text-surface font-semibold text-base">{t('workDetail.edit')}</Text>
              </Pressable>
            )}

          {/* {data?.createdBy?._id !== user?._id && data?.budgetType === "FIXED_PRICE" && data?.workStatus === "ASSIGNED_WORKER" && (
            <Pressable onPress={() => navigation.navigate('EditWorkById', { workId: data?._id })} className='p-3'>
              <Text className="text-surface font-semibold text-base">{t('workDetail.offer')}</Text>
            </Pressable>
          )} */}

          {data?.workStatus === "DOING" && data?.kindOfWork === "ONLINE" && (
            <Pressable onPress={() => navigation.navigate('AppendOwnerWork', { workId: data?._id })} className='p-3'>
              <Text className="text-surface font-semibold text-base">{t('workDetail.add_work')}</Text>
            </Pressable>
          )}
        </View>

        {/* Status Banners */}
        {data?.workStatus === 'ASSIGNED_WORKER' && data?.createdBy?._id !== user?._id && (
          <View className="bg-warning/10 px-4 py-2 flex-row items-center justify-between h-12">
            <Text className="text-warning text-caption font-medium">{t('workDetail.accept_unlock_payment')}</Text>
            <TouchableOpacity onPress={() => handleAcceptWork()}>
              <Text className="text-primary font-semibold text-caption">{t('workDetail.accept_question')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {data?.workStatus === 'DOING' && data?.createdBy?._id !== user?._id && (
          <View className="bg-border px-4 py-2 flex-row items-center justify-between h-auto">
            <Text className="text-success text-caption font-medium">{t('workDetail.project_paid_successfully')}</Text>
          </View>
        )}

        {data?.workStatus === 'COMPLETED' && (
          <View className="bg-success px-4 py-2 flex-row items-center justify-between h-12">
            <Text className="text-surface text-caption font-medium">{t('workDetail.project_did_successfully')}</Text>
            {data?.createdBy?._id === user?._id && (
              <TouchableOpacity onPress={() => navigation.replace('Bookfreelancer', { userId: data?.assignedTo?._id })}>
                <Text className="text-surface font-bold text-body">{t('workDetail.rehire')}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Tabs - Memoize to prevent re-renders */}
        <View className="flex-row justify-evenly px-4 mt-4 border-b border-border">
          <TouchableOpacity className={`pb-2 p-4 ${activeTab === 'overview' ? 'border-b-2 border-primary' : ''}`} onPress={() => setActiveTab('overview')}>
            <Text className={`text-body ${activeTab === 'overview' ? 'text-primary font-semibold' : 'text-textSecondary'}`}>{t('workDetail.work_overview')}</Text>
          </TouchableOpacity>
          <TouchableOpacity className={`pb-2 p-4 ${activeTab === 'subwork' ? 'border-b-2 border-primary' : ''}`} onPress={() => setActiveTab('subwork')}>
            <Text className={`text-body ${activeTab === 'subwork' ? 'text-primary font-semibold' : 'text-textSecondary'}`}>{t('workDetail.sub_work_list')}</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.select({ ios: 0, android: 20 })}
          style={{ flex: 1 }}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#3B82F6"
                colors={['#3B82F6']}
              />
            }
          >
            <View className="px-4 py-4">
              {activeTab === 'overview' ? renderWorkOverview() : renderSubWorkList()}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Bottom Action Bar */}
        <View className="flex-row justify-evenly items-center px-6 py-4 border-t border-border bg-white">
          {data?.createdBy?._id === user?._id && data?.workStatus !== 'PUBLISHED' && data?.assignedTo && (
            <TouchableOpacity className="bg-blue-100 p-3 rounded-full" onPress={() => navigation.navigate('RoomChat', { userId: data?.assignedTo?._id })}>
              <Ionicons name="chatbubble-ellipses-outline" size={24} color="#3B82F6" />
            </TouchableOpacity>
          )}

          {data?.createdBy?._id === user?._id && (

            <TouchableOpacity
              onPress={() => navigation.navigate('PaymentDetail_Id', { workId: data?._id })}
              className="bg-border p-4 rounded-full flex-row items-center justify-center">
              <Ionicons name="newspaper-outline" size={16} color="#6B7280" />
            </TouchableOpacity>
          )}

          {data?.createdBy?._id !== user?._id && (
            <TouchableOpacity className="bg-blue-100 p-3 rounded-full" onPress={() => navigation.navigate('RoomChat', { userId: data?.createdBy?._id })}>
              <Ionicons name="chatbubble-ellipses-outline" size={24} color="#3B82F6" />
            </TouchableOpacity>
          )}

          {/* Action Buttons Based on Work Status */}
          {data?.workStatus === 'PUBLISHED' && data?.createdBy?._id === user?._id && (
            <TouchableOpacity onPress={() => handleJobPress()} className="bg-primary py-4 px-16 rounded-full flex-row items-center justify-center">
              <Text className="text-surface text-base font-semibold items-center">{t('workDetail.interested_freelancers')}</Text>
            </TouchableOpacity>
          )}

          {data?.workStatus === 'PRIVATE' && data?.createdBy?._id === user?._id && (
            <TouchableOpacity className="bg-border py-4 px-16 rounded-full flex-row items-center justify-center">
              <Text className="text-primary text-base font-semibold items-center">{t('workDetail.private')}</Text>
            </TouchableOpacity>
          )}

          {data?.workStatus === 'ASSIGNED_WORKER' && data?.createdBy?._id !== user?._id && (
            <TouchableOpacity
              className={`py-4 px-16 rounded-full flex-row items-center justify-center ${acceptState === 'accepted' ? 'bg-green-600' : 'bg-primary'}`}
              onPress={handleAcceptWork}
              disabled={acceptState !== 'idle'}
            >
              <Text className="text-surface text-base font-semibold items-center">
                {acceptState === 'accepting' ? `${t('workDetail.accepting')}` : acceptState === 'accepted' ? `${t('workDetail.accepted')}` : `${t('workDetail.accept')}`}
              </Text>
            </TouchableOpacity>
          )}

          {data?.workStatus === 'ASSIGNED_WORKER' && data?.createdBy?._id === user?._id && (
            <View className="bg-border py-4 px-16 rounded-full flex-row items-center justify-center">
              <Text className="text-primary text-base font-semibold items-center">{t('workDetail.pending_for_accept')}</Text>
            </View>
          )}

          {data?.workStatus === 'ASSIGNED_AWAIT_PAYMENT' && data?.createdBy?._id === user?._id && (
            <TouchableOpacity
              className="py-4 px-16 rounded-full flex-row items-center justify-center bg-primary"
              onPress={() => {
                navigation.replace('PaymentScreen', {
                  workId: data?._id,
                  budget: data?.budget,
                  currency: data?.currency,
                  terminalid: data?.workCode,
                  workCode: data?.workCode,
                  invoiceType: "WORK"
                });
              }}
            >
              <Text className="text-surface text-base font-semibold items-center">{t('workDetail.make_payment')}</Text>
            </TouchableOpacity>
          )}

          {data?.workStatus === 'ASSIGNED_AWAIT_PAYMENT' && data?.createdBy?._id !== user?._id && (
            <View className="bg-border py-4 px-16 rounded-full flex-row items-center justify-center">
              <Text className="text-primary text-base font-semibold items-center">{t('workDetail.waiting_for_start')}</Text>
            </View>
          )}

          {data?.workStatus === 'DOING' && data?.createdBy?._id === user?._id && (
            <View className="bg-primary/50 py-4 px-16 rounded-full flex-row items-center justify-center">
              <Text className="text-surface text-base font-semibold items-center">{t('workDetail.doing')}</Text>
            </View>
          )}

          {data?.workStatus === 'DOING' && data?.createdBy?._id !== user?._id && (
            <TouchableOpacity
              className={`py-3 px-16 rounded-full z-10 ${submitState === 'submitted' ? 'bg-green-600' : submitState === 'submitting' ? 'bg-primary/50' : 'bg-primary'}`}
              onPress={handleSubmitWork}
              disabled={submitState === 'submitted' || submitState === 'submitting'}
            >
              <Text className="text-surface text-base font-semibold">
                {submitState === 'submitted' ? `${t('workDetail.submitted')}` : submitState === 'submitting' ? `${t('workDetail.submitting')}` : submitState === 'error' ? `${t('workDetail.error')}` : `${t('workDetail.submit_work')}`}
              </Text>
            </TouchableOpacity>
          )}

          {data?.workStatus === 'AWAITING_COMPLETED' && data?.createdBy?._id === user?._id && (
            <TouchableOpacity className="bg-primary py-3 px-16 rounded-full" onPress={handleConfirmWork}>
              <Text className="text-surface text-base font-semibold">{t('workDetail.confirm')}</Text>
            </TouchableOpacity>
          )}

          {data?.workStatus === 'AWAITING_COMPLETED' && data?.createdBy?._id !== user?._id && (
            <View className="bg-warning/50 py-3 px-16 rounded-full">
              <Text className="text-surface text-base font-semibold">{t('workDetail.pending_for_confirm')}</Text>
            </View>
          )}

          {data?.workStatus === 'COMPLETED' && data?.createdBy?._id !== user?._id && (
            <View className="bg-primary/50 py-4 px-16 rounded-full flex-row items-center justify-center">
              <Ionicons name='checkmark-circle' size={24} color='white' />
            </View>
          )}

          {data?.workStatus === 'COMPLETED' && data?.createdBy?._id === user?._id && !isReview && (
            <TouchableOpacity className="bg-success py-3 px-16 rounded-full z-10" onPress={() => setShowReviewModal(true)}>
              <Text className="text-surface text-base font-semibold">{t('workDetail.make_review')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Modals */}
      <ReviewModal
        visible={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        freelancer={data}
        onSubmitReview={() => setIsReview(true)}
      />

      <InterestedFreelancer
        visible={jobDetailVisible}
        onClose={handleCloseJobDetail}
        jobs={workData}
        refetch={refetch}
        onUserPress={handleUserProfileNavigation}
      />

      <View style={{ height: insets.bottom + 20 }} />
    </ScreenWrapper>
  );
}