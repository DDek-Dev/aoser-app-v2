import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert, TextInput as RNTextInput, ScrollView, Pressable, Modal, Linking, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';
import ReviewModal from 'components/freelancer/ReviewModal';

import { useAcceptAppendWork, useAcceptWork, useCompleteWork, usePublicWorkById, useSubmitWork, useUpdateAppendWorkById, useUpdateSubworkStatus, useUpdateWorkById } from 'hooks/usePublicWork';
import { SubWorkDetail, SubTask, ExampleWork, } from 'types';
import { ALERT_TYPE, Toast } from 'react-native-alert-notification';
import { formatDisplayDateTime } from 'utils/dateFormatter';
import { useAuth } from 'hooks/useAuth';
import InterestedFreelancer from './InterestedFreelancer';
import { useTranslation } from 'react-i18next';
import BudgetInput from 'components/ui/BudgetInput';
import WorkDetailSkenleton from 'skeletonScreens/WorkDetailSkenleton';

type AuthFreelancerProfileRouteProp = RouteProp<FreelancerStackParamList, 'FreelancerWorkDetail'>;

type Props = {
  route: AuthFreelancerProfileRouteProp;
};
type ApplicantLike = {
  applicant?: { _id?: string } | string;
};
type SubWorkStatus = 'TODO' | 'DOING' | 'DONE' | 'DELAY' | 'FAILED';

export default function FreelancerWorkDetail({ route }: Props) {
  // ============= ALL HOOKS MUST BE AT THE TOP =============
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
  const params = route.params;
  const { user } = useAuth();
  const { t } = useTranslation();

  // State hooks
  const [activeTab, setActiveTab] = useState<'overview' | 'subwork'>('overview');
  const [expandedItems, setExpandedItems] = useState<{ [key: string]: boolean }>({});
  const [showStatusDropdown, setShowStatusDropdown] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'submitted' | 'error'>('idle');
  const [jobDetailVisible, setJobDetailVisible] = useState(false);
  const [isReview, setIsReview] = useState<boolean>(false);
  const [acceptState, setAcceptState] = useState<'idle' | 'accepting' | 'accepted'>('idle');
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
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deleteConfirmTitle, setDeleteConfirmTitle] = useState('');
  const [deleteConfirmMessage, setDeleteConfirmMessage] = useState('');
  const [confirmModalVariant, setConfirmModalVariant] = useState<'danger' | 'primary' | 'warning'>('danger');
  const [confirmModalActionText, setConfirmModalActionText] = useState('');
  const pendingDeleteActionRef = useRef<null | (() => Promise<void> | void)>(null);

  // AppendWork editing state - maps appendWorkId to local edits
  const [appendWorkEdits, setAppendWorkEdits] = useState<{
    [appendWorkId: string]: {
      subWorkItems: SubWorkDetail[];
      newSectionTitle: string;
      newSubTitles: { [key: string]: string };
      editingSectionId: number | null;
      editingSubTaskKey: string | null;
      editedSectionTitle: string;
      editedSubTaskTitle: string;
    }
  }>({});
  const [expandedAppendItems, setExpandedAppendItems] = useState<{ [key: string]: boolean }>({});

  // API hooks
  const { data: workData, isLoading, refetch } = usePublicWorkById(params.workId);
  const updateStatusMutation = useUpdateSubworkStatus();
  const submitWork = useSubmitWork();
  const acceptWork = useAcceptWork();
  const completetWork = useCompleteWork();
  const updateWorkById = useUpdateWorkById();
  const updateAppendWorkById = useUpdateAppendWorkById();
  const acceptAppendWork = useAcceptAppendWork()

  const [isFreelancer, setIsFreelancer] = useState(false);
  // Constants
  const statusOptions: SubWorkStatus[] = ['TODO', 'DOING', 'DONE', 'DELAY', 'FAILED'];
  const data = workData?.work;

  const isCompleted = data?.workStatus === 'COMPLETED';

  // ============= EFFECTS =============
  // Refetch work data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  console.log('Work data in FreelancerWorkDetail:', JSON.stringify(data, null, 2));
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
  const handleApplicantPress = useCallback(() => {
    setJobDetailVisible(true);
    setIsFreelancer(true)
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

  // Helper: Initialize appendWork edit state on first edit
  const initializeAppendWorkEdit = (appendWorkId: string, initialData: SubWorkDetail[]) => {
    if (!appendWorkEdits[appendWorkId]) {
      setAppendWorkEdits(prev => ({
        ...prev,
        [appendWorkId]: {
          subWorkItems: initialData,
          newSectionTitle: '',
          newSubTitles: {} as { [key: string]: string },
          editingSectionId: null,
          editingSubTaskKey: null,
          editedSectionTitle: '',
          editedSubTaskTitle: ''
        }
      }));
    }
  };

  // Helper: Get edit state for an appendWork with safe fallback
  const getAppendWorkEdit = (appendWorkId: string, initialData: SubWorkDetail[]) => {
    // If not initialized yet, initialize synchronously to avoid undefined
    if (!appendWorkEdits[appendWorkId]) {
      const defaultEdit: {
        subWorkItems: SubWorkDetail[];
        newSectionTitle: string;
        newSubTitles: { [key: string]: string };
        editingSectionId: number | null;
        editingSubTaskKey: string | null;
        editedSectionTitle: string;
        editedSubTaskTitle: string;
      } = {
        subWorkItems: initialData,
        newSectionTitle: '',
        newSubTitles: {},
        editingSectionId: null,
        editingSubTaskKey: null,
        editedSectionTitle: '',
        editedSubTaskTitle: ''
      };
      // Queue initialization but return default immediately
      initializeAppendWorkEdit(appendWorkId, initialData);
      return defaultEdit;
    }
    return appendWorkEdits[appendWorkId];
  };

  // Helper: Update appendWork edit state with safe initialization
  const updateAppendWorkEdit = (appendWorkId: string, updates: any) => {
    setAppendWorkEdits(prev => {
      // Ensure the appendWorkId exists before updating
      if (!prev[appendWorkId]) {
        return {
          ...prev,
          [appendWorkId]: {
            subWorkItems: [],
            newSectionTitle: '',
            newSubTitles: {},
            editingSectionId: null,
            editingSubTaskKey: null,
            editedSectionTitle: '',
            editedSubTaskTitle: '',
            ...updates
          }
        };
      }
      return {
        ...prev,
        [appendWorkId]: {
          ...prev[appendWorkId],
          ...updates
        }
      };
    });
  };

  const toggleExpandAppendItem = (key: string) => {
    setExpandedAppendItems(prev => ({ ...prev, [key]: !prev[key] }));
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

  const buildAppendSubWorkPayload = (items: SubWorkDetail[]) => {
    return stripIds(items).map(section => ({
      sectionTitle: section.sectionTitle.trim(),
      subTask: section.subTask
        .map(task => ({
          title: task.title.trim(),
          subWorkStatus: task.subWorkStatus,
        }))
        .filter(task => task.title.length > 0),
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
      const customerVisibleStatuses = ['PUBLISHED', 'PRIVATE', 'ASSIGNED_WORKER', 'ASSIGNED_AWAIT_PAYMENT'];
      return customerVisibleStatuses.includes(data?.workStatus as string);
    }
    if (isFreelancer) {
      return data?.workStatus === 'DOING'
    }

    return false;
  }

  const openActionConfirm = ({
    title,
    message,
    actionText,
    variant = 'danger',
    onConfirm,
  }: {
    title: string;
    message: string;
    actionText: string;
    variant?: 'danger' | 'primary' | 'warning';
    onConfirm: () => Promise<void> | void;
  }) => {
    pendingDeleteActionRef.current = onConfirm;
    setDeleteConfirmTitle(title);
    setDeleteConfirmMessage(message);
    setConfirmModalActionText(actionText);
    setConfirmModalVariant(variant);
    setShowDeleteConfirmModal(true);
  };

  const openDeleteConfirm = (onConfirm: () => Promise<void> | void) => {
    openActionConfirm({
      title: t('workDetail.delete_section'),
      message: t('workDetail.delete_section_confirm'),
      actionText: t('workDetail.delete'),
      variant: 'danger',
      onConfirm,
    });
  };

  const closeDeleteConfirm = () => {
    setShowDeleteConfirmModal(false);
    pendingDeleteActionRef.current = null;
    setConfirmModalActionText('');
  };

  const confirmDelete = async () => {
    const action = pendingDeleteActionRef.current;
    setShowDeleteConfirmModal(false);
    pendingDeleteActionRef.current = null;
    if (!action) return;
    await action();
  };

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
    console.log(`Updated subWorkItems after ${params.workId} adding section:`, JSON.stringify(updatedSubWorkItems, null, 2));

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
    const title = newSubTitles[String(sectionId)];
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
    setNewSubTitles(prev => ({ ...prev, [String(sectionId)]: '' }));

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
      openDeleteConfirm(async () => {
        const updated = subWorkItems.filter((_, idx) => idx !== sectionId);
        setSubWorkItems(updated);
        try {
          await updateStatusMutation.mutateAsync({
            id: params.workId,
            data: stripIds(updated)
          });
          await refetch();
        } catch (error) {
          console.log('Failed to delete section:', error);
        }
      });
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


      Toast.show({
        type: ALERT_TYPE.SUCCESS,
        title: `${t('workDetail.success')}`,
        textBody: `${t('workDetail.textBody_of_accept_success')}`,
      });

      await refetch();

    } catch (error) {
      console.log('Failed to accept work:', error);

      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: 'OOP!',
        textBody: `${t('workDetail.textBody_of_error')}`,
      });
    }
  }

  const handleCancelWork = async () => {
    try {
      await updateWorkById.mutateAsync({
        id: params.workId,
        data: { workStatus: 'DOING' }
      });
      await refetch();
    } catch (error) {
      console.log('Failed to cancel completion confirmation:', error);
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: 'OOP!',
        textBody: `${t('workDetail.textBody_of_error')}`,
      });
    }
  }
  const handleCancel = async () => {
    try {
      await completetWork.mutateAsync({
        id: params.workId,
        data: { workStatus: 'CANCEL' }
      });


      // Toast.show({
      //   type: ALERT_TYPE.SUCCESS,
      //   title: `${t('workDetail.success')}`,
      //   textBody: `${t('workDetail.textBody_of_accept_success')}`,
      // });

      await refetch();

    } catch (error) {
      console.log('Failed to accept work:', error);

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
  const handleAcceptAppendWork = async (workId: string, status: string) => {
    try {
      const formData = {
        status: status,
        workId: params.workId
      };


      if (!workId) {
        console.log('Missing workId parameter');
        return;
      }

      await acceptAppendWork.mutateAsync({
        id: workId,
        data: formData
      });
      await refetch();

    } catch (error) {
      console.log('Failed to update work:', error);
    }
  }

  // ==================== APPENDWORK SECTION EDITING ====================

  const handleAppendWorkAddSection = async (appendWorkId: string) => {
    console.log('Adding section to append work:', appendWorkId);
    const edit = getAppendWorkEdit(appendWorkId, []);
    if (!edit.newSectionTitle.trim()) return;

    const newSection: SubWorkDetail = {
      sectionTitle: edit.newSectionTitle.trim(),
      subTask: []
    };

    const updatedSubWorkItems = [...edit.subWorkItems, newSection];
    updateAppendWorkEdit(appendWorkId, {
      subWorkItems: updatedSubWorkItems,
      newSectionTitle: ''
    });

    console.log('Updated subWorkItems for append work:', updatedSubWorkItems);

    try {
      await updateAppendWorkById.mutateAsync({
        id: appendWorkId,
        data: buildAppendSubWorkPayload(updatedSubWorkItems)
      });
      await refetch();
    } catch (error) {
      console.log('Failed to add section to append work:', error);
    }
  };

  const handleAppendWorkAddSubTask = async (appendWorkId: string, sectionId: number) => {
    const edit = getAppendWorkEdit(appendWorkId, []);
    const title = edit.newSubTitles[String(sectionId)] as string;
    if (!title?.trim()) return;

    const newSubTask: SubTask = {
      title: title.trim(),
      subWorkStatus: 'TODO',
    };

    const updatedSubWorkItems = edit.subWorkItems.map((section, idx) =>
      idx === sectionId
        ? {
          ...section,
          subTask: [...section.subTask, newSubTask]
        }
        : section
    );

    updateAppendWorkEdit(appendWorkId, {
      subWorkItems: updatedSubWorkItems,
      newSubTitles: { ...edit.newSubTitles, [String(sectionId)]: '' }
    });

    try {
      await updateAppendWorkById.mutateAsync({
        id: appendWorkId,
        data: buildAppendSubWorkPayload(updatedSubWorkItems)
      });
      await refetch();
    } catch (error) {
      console.log('Failed to add subtask to append work:', error);
    }
  };

  const handleAppendWorkStatusChange = async (
    appendWorkId: string,
    sectionId: number,
    subTaskIndex: number,
    newStatus: SubWorkStatus,
    initialData: SubWorkDetail[]
  ) => {
    const edit = getAppendWorkEdit(appendWorkId, initialData);

    const updatedSubWorkItems = edit.subWorkItems.map((section, idx) =>
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

    updateAppendWorkEdit(appendWorkId, { subWorkItems: updatedSubWorkItems });
    setShowStatusDropdown(null);

    try {
      await updateAppendWorkById.mutateAsync({
        id: appendWorkId,
        data: buildAppendSubWorkPayload(updatedSubWorkItems)
      });
      await refetch();
    } catch (error) {
      console.log('Failed to update append work status:', error);
      await refetch();
    }
  };

  const handleAppendWorkSectionTitleLongPress = (appendWorkId: string, sectionId: number, currentTitle: string) => {
    const edit = getAppendWorkEdit(appendWorkId, []);
    updateAppendWorkEdit(appendWorkId, {
      editingSectionId: sectionId,
      editedSectionTitle: currentTitle
    });
  };

  const handleAppendWorkSubTaskTitleLongPress = (appendWorkId: string, sectionId: number, subTaskIndex: number, currentTitle: string) => {
    const key = `${sectionId}-${subTaskIndex}`;
    const edit = getAppendWorkEdit(appendWorkId, []);
    updateAppendWorkEdit(appendWorkId, {
      editingSubTaskKey: key,
      editedSubTaskTitle: currentTitle
    });
  };

  const handleAppendWorkSectionEditBlur = async (appendWorkId: string, sectionId: number) => {
    const edit = getAppendWorkEdit(appendWorkId, []);

    if (!edit.editedSectionTitle.trim()) {
      openDeleteConfirm(async () => {
        const latestEdit = getAppendWorkEdit(appendWorkId, []);
        const updated = latestEdit.subWorkItems.filter((_, idx) => idx !== sectionId);
        updateAppendWorkEdit(appendWorkId, { subWorkItems: updated });

        try {
          await updateAppendWorkById.mutateAsync({
            id: appendWorkId,
            data: buildAppendSubWorkPayload(updated)
          });
          await refetch();
        } catch (error) {
          console.log('Failed to delete append work section:', error);
        }
      });
    } else {
      const updatedSubWorkItems = edit.subWorkItems.map((section, idx) =>
        idx === sectionId
          ? { ...section, sectionTitle: edit.editedSectionTitle.trim() }
          : section
      );

      updateAppendWorkEdit(appendWorkId, { subWorkItems: updatedSubWorkItems });

      try {
        await updateAppendWorkById.mutateAsync({
          id: appendWorkId,
          data: buildAppendSubWorkPayload(updatedSubWorkItems)
        });
        await refetch();
      } catch (error) {
        console.log('Failed to update append work section title:', error);
      }
    }
    updateAppendWorkEdit(appendWorkId, {
      editingSectionId: null,
      editedSectionTitle: ''
    });
  };

  const handleAppendWorkSubTaskEditBlur = async (appendWorkId: string, sectionId: number, subTaskIndex: number) => {
    const edit = getAppendWorkEdit(appendWorkId, []);

    const updatedSubWorkItems = edit.subWorkItems.map((section, idx) =>
      idx === sectionId
        ? {
          ...section,
          subTask: !edit.editedSubTaskTitle.trim()
            ? section.subTask.filter((_, index) => index !== subTaskIndex)
            : section.subTask.map((task, index) =>
              index === subTaskIndex
                ? { ...task, title: edit.editedSubTaskTitle.trim() }
                : task
            )
        }
        : section
    );

    updateAppendWorkEdit(appendWorkId, { subWorkItems: updatedSubWorkItems });

    try {
      await updateAppendWorkById.mutateAsync({
        id: appendWorkId,
        data: buildAppendSubWorkPayload(updatedSubWorkItems)
      });
      await refetch();
    } catch (error) {
      console.log('Failed to update append work subtask:', error);
    }

    updateAppendWorkEdit(appendWorkId, {
      editingSubTaskKey: null,
      editedSubTaskTitle: ''
    });
  };
  const handleSubmitWork = async () => {
    setSubmitState('submitting');
    try {
      await submitWork.mutateAsync({ id: params.workId });
      setSubmitState('submitted');

      Toast.show({
        type: ALERT_TYPE.SUCCESS,
        title: `${t('workDetail.success')}`,
        textBody: `${t('workDetail.textBody_of_success')}`,
      });

    } catch (error) {
      console.log('Failed to submit work:', error);

      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error!',
        textBody: t('workDetail.fail_submit_work'),
      });
      setSubmitState('error');
      setTimeout(() => {
        setSubmitState('idle');
      }, 3000);
    }
  };

  const getApplicantId = (applicant: ApplicantLike) => {
    const value = applicant?.applicant;
    if (!value) return undefined;
    return typeof value === "string" ? value : value._id;
  };

  const hasApplied = useMemo(() => {
    const userId = user?._id;
    const list = workData?.applicant;
    if (!userId || !Array.isArray(list)) return false;
    return list.some((a: any) => getApplicantId(a) === userId);
  }, [workData?.applicant, user?._id]);


  // ============= EARLY RETURN AFTER ALL HOOKS =============
  if (!data || isLoading || !user || !workData?.work) {
    return (
      <ScreenWrapper safeEdges={['bottom']} style={{ flex: 1, backgroundColor: 'white' }}>
        <WorkDetailSkenleton />
      </ScreenWrapper>
    )

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


      <View className="bg-surface rounded-3xl overflow-hidden shadow-sm border border-border">
        {/* Header Section with gradient accent */}
        <View className="bg-gradient-to-r from-primary  px-3 py-4">
          <View className="">
            <View className="flex-row items-center justify-between border-b border-primary/20 pb-3 mb-3">
              <View className="flex-row items-center gap-2">
                <View className="w-2 h-2 rounded-full bg-primary" />
                <Text className="text-warning text-body">
                  {data?.serviceType?.name}
                </Text>
              </View>

              <View className="bg-primary backdrop-blur px-4 py-2 rounded-full">
                <Text className="text-white text-caption font-semibold">
                  {data?.kindOfWork === 'ONLINE' ? t('editWork.workType.online') : t('editWork.workType.offline')}
                </Text>
              </View>
            </View>
            <Text className="text-textSecondary font-bold text-body px-3 mb-1">
              {data?.workTitle}
            </Text>
          </View>
        </View>

        {/* Content Section */}
        <View className="p-2">

          {/* Description Card */}
          <View className="mb-4">
            <View className="flex-row items-center gap-2 mb-2">
              <View className="w-1 h-5 bg-primary rounded-full" />
              <Text className="text-body text-text font-bold">
                {t('workDetail.description')}
              </Text>
            </View>
            <View className="bg-background rounded-2xl p-4 ">
              <Text className="text-body text-text leading-6">
                {data?.description}
              </Text>
            </View>
          </View>

          {/* Example Work */}
          <ExampleWorkDisplay exampleWork={data?.exampleWork || []} />

          {/* Budget Section */}
          {ispriceEdit ? (
            <View className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-5 mb-4 border border-blue-200">
              <View className="flex-row items-center gap-2 mb-4">
                <View className="w-8 h-8 bg-primary rounded-2xl items-center justify-center">
                  <Ionicons name="cash-outline" size={20} color="#fff" />
                </View>
                <Text className="text-body text-text font-bold">
                  {t('postWork.budget_type')}
                </Text>
              </View>

              {/* Budget Type Selector */}
              <View className="flex-row gap-2 mb-4">
                {['FIXED_PRICE', 'HOURLY', 'OFFERING'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setBudgetType(type as 'FIXED_PRICE' | 'HOURLY' | 'OFFERING')}
                    className={`flex-1 rounded-2xl py-3 items-center border ${budgetType === type
                      ? 'bg-primary border-primary'
                      : 'bg-white border-border'
                      }`}
                  >
                    <View className="flex-row items-center gap-2">
                      {budgetType === type && (
                        <Ionicons name="checkmark-circle" size={16} color="#fff" />
                      )}
                      <Text className={`text-caption font-semibold ${budgetType === type ? 'text-white' : 'text-textSecondary'
                        }`}>
                        {type === 'FIXED_PRICE'
                          ? t('postWork.fixed_price')
                          : type === 'HOURLY'
                            ? t('postWork.hourly')
                            : t('postWork.offering')}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {budgetType === 'OFFERING' ? (
                <View className="bg-white rounded-2xl p-5 mb-4">
                  <Text className="text-primary font-bold text-body text-center">
                    {t('workDetail.offering_price')}
                  </Text>
                </View>

              ) : (
                <View className="mb-4">
                  <BudgetInput
                    label={t('postWork.budget')}
                    value={budget}
                    onChange={setBudget}
                    currency={budgetCurrency}
                    onCurrencyChange={setBudgetCurrency}
                    error={errors.budget}
                    classNamebuget="flex-1"
                  />
                </View>
              )}

              {/* Action Buttons */}
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => {
                    setIspriceEdit(false);
                    setBudget(data?.budget);
                  }}
                  className="flex-1 bg-white border border-error rounded-2xl py-3 items-center active:bg-error/5"
                >
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
                    <Text className="text-error font-bold text-body">
                      {t('workDetail.cancel')}
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={priceUpdate}
                  className="flex-1 bg-primary rounded-2xl py-3 items-center active:bg-primary/90 shadow-sm"
                >
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                    <Text className="text-white font-bold text-body">
                      {t('editWork.updateButton')}
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>
          ) : (
            <View className="bg-gradient-to-r from-yellow-50 to-green-50 rounded-3xl p-5 mb-4 border border-yellow-200">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-2">
                  <View className="w-10 h-10 bg-white rounded-2xl items-center justify-center shadow-sm">
                    <Ionicons name="cash" size={20} color="#F59E0B" />
                  </View>
                  <View>

                    <View className='flex-row'>

                      <Text className="text-caption text-text font-medium mb-0.5">
                        {t('postWork.budget')}
                      </Text>
                      {/* Budget type badge */}
                      <View className="bg-white/60 backdrop-blur px-3 py-1.5 rounded-full self-start">
                        {/* <Text className="text-primary text-caption font-semibold">
                          {data?.budgetType === 'FIXED_PRICE'
                            ? t('postWork.fixed_price')
                            : data?.budgetType === 'HOURLY'
                              ? t('postWork.hourly')
                              : t('postWork.offering')}
                        </Text> */}
                      </View>
                    </View>
                    {data?.budgetType === 'OFFERING' ? (

                      <View>


                        <Text className="text-primary font-bold text-body">
                          {t('workDetail.offering_price')}
                        </Text>

                        <View className="flex-row items-baseline gap-1">
                          <Text className="text-warning font-bold text-xl">
                            {data?.currency}
                          </Text>
                          <Text className="text-success font-bold text-2xl">
                            {new Intl.NumberFormat().format(data?.budget)}
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <View className="flex-row items-baseline gap-1">
                        <Text className="text-warning font-bold text-xl">
                          {data?.currency}
                        </Text>
                        <Text className="text-success font-bold text-2xl">
                          {new Intl.NumberFormat().format(data?.budget)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {data?.workStatus === 'PUBLISHED' && user?._id === data?.createdBy?._id && (
                  <Pressable
                    onPress={() => setIspriceEdit(true)}
                    className="bg-white rounded-full p-3 shadow-sm active:bg-blue-50"
                  >
                    <Ionicons name="create-outline" size={20} color="#3B82F6" />
                  </Pressable>
                )}
              </View>


            </View>
          )}

          {/* Timeline Section */}
          <View className="bg-background rounded-3xl p-4">
            <View className="flex-row items-center gap-2 mb-4">

              <Text className="text-body text-text font-bold">
                {t('postWork.deadline_requirement')}
              </Text>
            </View>

            {/* Start Date */}
            <View className="flex-row items-center mb-3">
              <View className="w-8 h-8 rounded-full bg-success/10 items-center justify-center mr-3">
                <Ionicons name="play-circle" size={16} color="#10B981" />
              </View>
              <View className="flex-1">
                <Text className="text-caption text-textSecondary mb-0.5">
                  {t('postWork.from')}
                </Text>
                <Text className="text-body text-text ">
                  {formatDisplayDateTime(data?.startDate as string)}
                </Text>
              </View>
            </View>

            {/* End Date */}
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-error/10 items-center justify-center mr-3">
                <Ionicons name="flag" size={16} color="#EF4444" />
              </View>
              <View className="flex-1">
                <Text className="text-caption text-textSecondary mb-0.5">
                  {t('postWork.to')}
                </Text>
                <Text className="text-body text-text">
                  {formatDisplayDateTime(data?.deadLine as string)}
                </Text>
              </View>
            </View>
            {/* Divider */}
            <View className="h-px bg-border my-2 ml-4" />


            <View className="" >
              {data.address &&
                <View className="flex-row items-start">
                  <View className="w-8 h-8 rounded-full bg-error/10 items-center justify-center mr-3">
                    <Ionicons name="location-outline" size={16} color="#F59E0B" />
                  </View>

                  <View>
                    {data.address?.village !== '' && data.address?.district !== '' && data.address?.province !== '' && (
                      <Text className="text-body text-text ">
                        {data?.address.village}, {data?.address.district}, {data?.address.province}.
                      </Text>
                    )}
                    {data?.place && (

                      <Text className="text-body text-text ">
                        {data?.place}
                      </Text>

                    )}
                  </View>


                </View>

              }




            </View>
          </View>

        </View>
      </View>

      {/*---------------------------- appendWorks --------------------- */}

      {data.appendWorks.length > 0 && (

        <>

          <Text className="px-2 text-subheading text-text font-semibold mt-4">
            {t('workDetail.newAppendWork')}
          </Text>
          <View className='border border-border mt-4 w-full' />
        </>
      )}

      {data.appendWorks.map((appendWork, index) => (
        <View className="mt-4" key={index}>

          <View className="bg-gradient-to-br bg-surface rounded-3xl overflow-hidden border border-border shadow-sm">
            {/* Header with status badge */}
            <View className=" px-4 py-3 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Text className='text-textSecondary'>|</Text>
                {/* <Text className="text-warning text-body">
                  {appendWork._id}
                </Text> */}

                {appendWork.status === 'PENDING' && user?._id !== appendWork?.createdBy && (
                  <Text className="text-primary text-body">
                    {t('workDetail.newAppendWork')}
                  </Text>
                )}
                {appendWork.status === 'CONFIRMED' && user?._id !== appendWork?.createdBy && (
                  <Text className="text-primary  text-body">
                    {t('postWork.status.awaiting_payment')}
                  </Text>
                )}

                {/* for cusromer */}
                {appendWork.status === 'PENDING' && user?._id === appendWork?.createdBy && (
                  <Text className="text-primary  text-body">
                    {t('workDetail.pending_for_accept')}
                  </Text>
                )}
                {appendWork.status === 'CONFIRMED' && user?._id === appendWork?.createdBy && (
                  <Text className="text-success text-body">
                    {t('workDetail.please_payment')}
                  </Text>
                )}
                {appendWork.status === 'PAYMENT_COMPLETED' && user?._id === appendWork?.createdBy && (

                  <View className='flex-row gap-2 items-center'>

                    <Text className="text-success text-body">
                      {t('payment_success.title')}
                    </Text>

                    <Pressable onPress={() => navigation.navigate('PaymentDetail_Id', { workId: appendWork?._id })}

                      className='bg-border py-2 px-4 rounded-full flex-row items-center gap-2'>
                      <Text>{t('payment_success.bill')}: </Text>
                      <Ionicons name="newspaper-outline" size={16} color="#6B7280" />

                    </Pressable>
                  </View>
                )}
                {appendWork.status === 'PAYMENT_COMPLETED' && user?._id !== appendWork?.createdBy && (
                  <Text className="text-success text-body">
                    {t('payment_success.title')}
                  </Text>
                )}
                {appendWork.status === 'REJECTED' && user?._id !== appendWork?.createdBy && (
                  <Text className="text-error text-body">
                    {t('chat.offer.reject_offering')}
                  </Text>
                )}
              </View>
              <View className="bg-primary px-3 py-1 rounded-full">
                <Text className="text-white text-caption font-medium">
                  #{index + 1}
                </Text>
              </View>
            </View>

            {/* Content */}
            <View className="p-4">

              {/* Description Card */}
              <View className="mb-4">
                <View className="flex-row items-center gap-2 mb-2">
                  <View className="w-1 h-5 bg-primary rounded-full" />
                  <Text className="text-body text-text font-bold">
                    {t('workDetail.description')}
                  </Text>
                </View>
                <View className="bg-background rounded-2xl p-4 ">
                  <Text className="text-body text-text leading-6">
                    {appendWork?.description}
                  </Text>
                </View>
              </View>


              {/* Budget Section */}
              <View className="bg-white rounded-2xl p-4 mb-2 border border-blue-100">
                <Text className="text-caption text-textSecondary mb-2 tracking-wider font-bold">
                  {t('postWork.budget_type')}
                </Text>
                <View className="flex-row items-center gap-2">
                  <View className="bg-warning/10 px-2 py-1 rounded-lg">
                    <Text className="text-warning font-bold text-body">
                      {appendWork?.currency}
                    </Text>
                  </View>
                  <Text className="text-success font-bold text-xl">
                    {new Intl.NumberFormat().format(appendWork?.budget)}
                  </Text>
                </View>
              </View>

              {/* Deadline Section */}
              <View className="bg-white rounded-2xl p-4 mb-3 border border-border ">
                <Text className="text-body text-text mb-2  tracking-wider font-bold">
                  {t('postWork.to')}
                </Text>
                <View className="flex-row items-center gap-2">
                  <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center">
                    <Ionicons name="time-outline" size={16} color="#3B82F6" />
                  </View>
                  <Text className="text-text  text-body">
                    {formatDisplayDateTime(appendWork?.deadLine as string)}
                  </Text>
                </View>
              </View>
              <View className='flex-row justify-between'>
                <Text className='text-text  text-body font-bold mb-2'>{t('workDetail.sub_work_list')}</Text>
                <View className="flex-row items-center gap-2">
                  <Text className="text-body text-textSecondary font-semibold mb-2">{t('workDetail.progress')}</Text>
                  <Text className="text-xl font-bold text-textSecondary mb-1">{Number(appendWork.totalDonePercent).toFixed(0)}% </Text>
                </View>
              </View>
              <View >

                {(() => {
                  // Initialize edit state for this appendWork if needed
                  const edit = getAppendWorkEdit(appendWork._id, appendWork.subWorkDetails);
                  const isFreelancer = data?.createdBy?._id !== user?._id;
                  const isCustomer = data?.createdBy?._id === user?._id;

                  // Role-based editing permissions:
                  // Customer (createdBy) can edit when status is PENDING
                  // Freelancer (assignedTo) can edit when status is PAYMENT_COMPLETED
                  const canEdit = (isCustomer && appendWork.status === 'PENDING') ||
                    (isFreelancer && appendWork.status === 'PAYMENT_COMPLETED');

                  return edit.subWorkItems.map((section, idx) => {
                    const expandKey = `${appendWork._id}-${idx}`;
                    const isExpanded = expandedAppendItems[expandKey];
                    const allSubTasksDone = section.subTask.length > 0 &&
                      section.subTask.every(task => task.subWorkStatus === 'DONE');

                    return (
                      <View key={idx} className="mb-3 bg-surface border border-border px-2 py-2 rounded-2xl">
                        <View className="flex-row items-center py-3">
                          <View className="w-8 h-8 rounded-full justify-center items-center mr-3"
                            style={{ backgroundColor: allSubTasksDone ? '#10B981' : '#E5E7EB' }}>
                            <Text className="text-white text-caption ">{idx + 1}</Text>
                          </View>

                          {edit.editingSectionId === idx ? (
                            <RNTextInput
                              value={edit.editedSectionTitle}
                              onChangeText={(text) => updateAppendWorkEdit(appendWork._id, { editedSectionTitle: text })}
                              onBlur={() => handleAppendWorkSectionEditBlur(appendWork._id, idx)}
                              autoFocus
                              className="flex-1 text-body text-text border-b border-primary"
                            />
                          ) : (
                            canEdit ? (
                              <TouchableOpacity
                                onPress={() => toggleExpandAppendItem(expandKey)}
                                onLongPress={() => handleAppendWorkSectionTitleLongPress(appendWork._id, idx, section.sectionTitle)}
                                className="flex-1"
                                disabled={isCompleted ? true : false}

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
                            onPress={() => toggleExpandAppendItem(expandKey)}
                            disabled={isCompleted ? true : false}
                          />
                        </View>

                        {isExpanded && (
                          <View className="ml-1 mt-2">
                            {section.subTask.map((subTask, subTaskIndex) => {
                              const statusKey = `${idx}-${subTaskIndex}`;
                              const currentStatus = subTask.subWorkStatus;
                              const statusColors = getStatusBadgeColor(currentStatus);
                              const dropdownKey = `append-${appendWork._id}-${statusKey}`;
                              const canUpdateAppendStatus = isFreelancer && appendWork.status === 'PAYMENT_COMPLETED';
                              return (
                                <View key={statusKey} className="flex-row items-center justify-between mb-3 p-2 bg-gray-50 rounded-lg relative">
                                  {edit.editingSubTaskKey === statusKey ? (
                                    <RNTextInput
                                      value={edit.editedSubTaskTitle}
                                      onChangeText={(text) => updateAppendWorkEdit(appendWork._id, { editedSubTaskTitle: text })}
                                      onBlur={() => handleAppendWorkSubTaskEditBlur(appendWork._id, idx, subTaskIndex)}
                                      autoFocus
                                      className="flex-1 text-body text-text border-b border-primary"
                                    />
                                  ) : (
                                    <TouchableOpacity
                                      onLongPress={() => canEdit && handleAppendWorkSubTaskTitleLongPress(appendWork._id, idx, subTaskIndex, subTask.title)}
                                      className="flex-1"
                                      disabled={isCompleted ? true : false}

                                    >
                                      <Text className="text-body text-text">{subTask.title}</Text>
                                    </TouchableOpacity>
                                  )}
                                  {/* <View style={{ backgroundColor: statusColors.bg }} className="px-2 py-1 rounded ml-2">
                                    <Text style={{ color: statusColors.text }} className="text-caption font-bold">
                                      {currentStatus}
                                    </Text>
                                  </View> */}

                                  {canUpdateAppendStatus && !isCompleted ? (
                                    <TouchableOpacity
                                      className="px-3 py-1 rounded-full flex-row items-center"
                                      style={{ backgroundColor: statusColors.bg }}
                                      onPress={() => setShowStatusDropdown(showStatusDropdown === dropdownKey ? null : dropdownKey)}
                                      disabled={isCompleted ? true : false}
                                    >
                                      <Text className="text-caption font-medium mr-1" style={{ color: statusColors.text }}>
                                        {currentStatus}
                                      </Text>
                                      <Ionicons name="chevron-down" size={12} color={statusColors.text} />
                                    </TouchableOpacity>
                                  ) : (
                                    <View
                                      className="px-3 py-1 rounded-full flex-row items-center"
                                      style={{ backgroundColor: statusColors.bg }}
                                    >
                                      <Text className="text-caption font-medium mr-1" style={{ color: statusColors.text }}>
                                        {currentStatus}
                                      </Text>
                                      <Ionicons name="chevron-down" size={12} color={statusColors.text} />
                                    </View>
                                  )}

                                  {canUpdateAppendStatus && showStatusDropdown === dropdownKey && (
                                    <View className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-border z-30 min-w-[100px]">
                                      {statusOptions.map((status) => {
                                        const optionColors = getStatusBadgeColor(status);
                                        return (
                                          <TouchableOpacity
                                            key={status}
                                            className="px-3 py-2 border-b border-border"
                                            onPress={() =>
                                              handleAppendWorkStatusChange(
                                                appendWork._id,
                                                idx,
                                                subTaskIndex,
                                                status,
                                                appendWork.subWorkDetails
                                              )
                                            }
                                            disabled={isCompleted ? true : false}
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

                            {canEdit && !isCompleted && (
                              <View className="flex-row mt-2 items-center justify-between border border-border px-3 py-1 rounded-full bg-gray-50">
                                <TextInput
                                  placeholder={t('workDetail.add_sub_task')}
                                  value={edit.newSubTitles[String(idx)] || ''}
                                  onChangeText={(text) => updateAppendWorkEdit(appendWork._id, {
                                    newSubTitles: { ...edit.newSubTitles, [String(idx)]: text }
                                  })}
                                  className="flex-1 text-body text-text"
                                  placeholderTextColor="#6B7280"

                                />
                                <TouchableOpacity onPress={() => handleAppendWorkAddSubTask(appendWork._id, idx)} disabled={isCompleted ? true : false}>
                                  <Text className="text-primary font-medium">{t('workDetail.add_plus')}</Text>
                                </TouchableOpacity>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    );
                  });
                })()}
              </View>

              {(() => {
                const edit = getAppendWorkEdit(appendWork._id, appendWork.subWorkDetails);
                const isCustomer = data?.createdBy?._id === user?._id;
                const canAddSection = isCustomer && appendWork.status === 'PENDING';


                return canAddSection ? (
                  <View className="mt-4 px-3 py-2 bg-gray-50 border border-border rounded-full flex-row items-center justify-between">
                    <TextInput
                      placeholder={t('workDetail.add_new_section')}
                      value={edit.newSectionTitle}
                      onChangeText={(text) => updateAppendWorkEdit(appendWork._id, { newSectionTitle: text })}
                      className="flex-1 text-body text-text"
                      placeholderTextColor="#6B7280"
                    />
                    <TouchableOpacity onPress={() => handleAppendWorkAddSection(appendWork._id)}>
                      <Text className="text-primary font-medium">{t('workDetail.add_plus')}</Text>
                    </TouchableOpacity>
                  </View>
                ) : null;
              })()}
              {(() => {
                const edit = getAppendWorkEdit(appendWork._id, appendWork.subWorkDetails);
                const isFreelancer = data?.assignedTo?._id === user?._id;
                const canAddSection = isFreelancer && appendWork.status === 'PAYMENT_COMPLETED';

                return canAddSection && !isCompleted ? (
                  <View className="mt-4 px-3 py-2 bg-gray-50 border border-border rounded-full flex-row items-center justify-between">
                    <TextInput
                      placeholder={t('workDetail.add_new_section')}
                      value={edit.newSectionTitle}
                      onChangeText={(text) => updateAppendWorkEdit(appendWork._id, { newSectionTitle: text })}
                      className="flex-1 text-body text-text"
                      placeholderTextColor="#6B7280"
                    />
                    <TouchableOpacity onPress={() => handleAppendWorkAddSection(appendWork._id)}>
                      <Text className="text-primary font-medium">{t('workDetail.add_plus')}</Text>
                    </TouchableOpacity>
                  </View>
                ) : null;
              })()}


              {appendWork.status === 'PENDING' && user?._id !== appendWork?.createdBy && (

                <View className="flex-row gap-3 mt-3">
                  {/* Action Buttons */}
                  {/* Reject Button */}
                  <Pressable
                    className="w-32 bg-white border border-error rounded-2xl py-3 items-center justify-center active:bg-error/5"
                    onPress={() => {
                      // Handle reject
                      handleAcceptAppendWork(appendWork?._id, 'REJECTED');
                      console.log('Reject appendWork:', appendWork);
                    }}
                  >
                    <View className="flex-row items-center gap-2">
                      <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
                      <Text className="text-error font-bold text-body">
                        {t('chat.offer.reject')}
                      </Text>
                    </View>
                  </Pressable>

                  {/* Confirm Button */}
                  <Pressable
                    className="flex-1 bg-primary rounded-2xl py-3 items-center justify-center  shadow-sm"
                    onPress={() => {
                      // Handle confirm
                      handleAcceptAppendWork(appendWork?._id, "CONFIRMED");

                    }}
                  >
                    <View className="flex-row items-center gap-2">
                      <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                      <Text className="text-white font-bold text-body">
                        {t('chat.offer.accept')}

                      </Text>
                    </View>
                  </Pressable>
                </View>
              )
              }


              {appendWork.status === 'CONFIRMED' && user?._id === appendWork?.createdBy && (

                <View className="flex-row gap-3 mt-3">

                  {/* <Pressable
                    className="flex-1  bg-warning rounded-2xl py-3 items-center justify-center "
                    onPress={() => {
                      // Handle reject
                      console.log('Reject appendWork:', appendWork);
                    }}
                  >
                    <View className="flex-row items-center gap-2">
                      <Ionicons name="close-circle-outline" size={20} color="#FFF" />
                      <Text className="text-surface font-bold text-body">
                        {t('workDetail.cancel')}
                      </Text>
                    </View>
                  </Pressable> */}


                  <Pressable
                    className="flex-1 bg-primary rounded-2xl mt-2 py-3 items-center justify-center shadow-sm"
                    onPress={() => {
                      navigation.navigate('PaymentScreen', {
                        workId: appendWork?._id,
                        budget: appendWork?.budget,
                        currency: appendWork?.currency,
                        terminalid: data?.workCode,
                        workCode: data?.workCode,
                        invoiceType: "APPEND_WORK",
                      });
                    }}
                  >
                    <View className="flex-row items-center gap-2">
                      {/* <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" /> */}
                      <Text className="text-white font-bold text-body">
                        {t('workDetail.make_payment')}
                      </Text>
                    </View>
                  </Pressable>
                </View>
              )}

            </View>

          </View>
        </View>
      ))}
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
                      disabled={isCompleted ? true : false}
                    >
                      <Text className="text-body text-text font-medium">{section.sectionTitle}</Text>
                    </TouchableOpacity>
                  ) : (
                    <>
                      {/* <View className="flex-1">
                      <Text className="text-body text-text font-medium">{section.sectionTitle}</Text>
                    </View> */}
                      <TouchableOpacity
                        onPress={() => toggleExpand(idx)}
                        onLongPress={() => handleSectionTitleLongPress(idx, section.sectionTitle)}
                        className="flex-1"
                        disabled={isCompleted ? true : false}

                      >
                        <Text className="text-body text-text font-medium">{section.sectionTitle}</Text>
                      </TouchableOpacity>
                    </>
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
                    const dropdownKey = `main-${statusKey}`;

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
                                  disabled={isCompleted ? true : false}

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
                                {/* <View className="flex-row items-center flex-1">
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
                                </View> */}

                                <TouchableOpacity
                                  onLongPress={() => handleSubTaskTitleLongPress(idx, subTaskIndex, subTask.title)}
                                  className="flex-row items-center flex-1"
                                  disabled={isCompleted ? true : false}

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
                            )}
                          </View>
                        )}

                        {showStatusDropdown === dropdownKey && (
                          <View className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-border z-30 min-w-[100px]">
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
                          placeholder={t('workDetail.add_sub_task')}
                          value={newSubTitles[String(idx)] || ''}
                          onChangeText={(text) => setNewSubTitles(prev => ({ ...prev, [String(idx)]: text }))}
                          className="ml-2 flex-1 text-body text-text"
                          placeholderTextColor="#6B7280"
                        />
                      </View>
                      <TouchableOpacity onPress={() => addSubTask(idx)}>
                        <Text className="text-primary font-medium">{t('workDetail.add_plus')}</Text>
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
            placeholder={t('workDetail.add_new_section')}
            value={newSectionTitle}
            onChangeText={setNewSectionTitle}
            className="flex-1 text-body text-text"
            placeholderTextColor="#6B7280"
          />
          <TouchableOpacity onPress={addNewSection}>
            <Text className="text-primary font-medium">{t('workDetail.add_plus')}</Text>
          </TouchableOpacity>
        </View>
      )}
      {subWorkItems.length == 0 && (
        <View className="flex-1 justify-center items-center px-6 mt-2">
          <View className="w-48 h-48 bg-background rounded-full justify-center items-center mb-6">
            <Ionicons name="time-outline" size={64} color="#E5E7EB" />
          </View>
          <Text className="text-xl font-semibold text-textSecondary mb-2">
            {t('workDetail.none_subWork.title')}
          </Text>
          <Text className="text-gray-500 text-center mb-8">
            {t('workDetail.none_subWork.description')}
          </Text>
        </View>
      )}

    </View>
  );

  // ============= MAIN RENDER =============
  return (
    <ScreenWrapper>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <View className='bg-primary px-4 pt-12 pb-4 flex-row items-center justify-between' >
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => navigation.goBack()} className='mr-4'>
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View>
              <Text className="text-white font-semibold text-subheading">{t('workDetail.work_detail')}</Text>
              <Text className="text-white text-caption opacity-80">{t('workDetail.look_all_details')}</Text>
            </View>
          </View>


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

          {data?.createdBy?._id === user?._id && data?.workStatus === "DOING" && (
            <Pressable onPress={() => navigation.navigate('AppendOwnerWork', { workId: data?._id })} className='p-3 border border-border rounded-2xl'>
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
            <Text className="text-success text-caption font-bold">{t('workDetail.project_paid_successfully')}</Text>
          </View>
        )}

        {data?.workStatus === 'COMPLETED' && data?.createdBy?._id === user?._id && (
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
          <Pressable
            className="px-2 py-4 relative"
            onPress={() => {
              if (showStatusDropdown) setShowStatusDropdown(null);
            }}
          >
            {activeTab === 'overview' ? renderWorkOverview() : renderSubWorkList()}
          </Pressable>
        </ScrollView>


        {/* Bottom Action Bar */}
        <View className="flex-row justify-evenly items-center px-6 py-4 border-t border-border bg-white">
          {data?.createdBy?._id === user?._id && data?.workStatus !== 'PUBLISHED' && data?.assignedTo && (
            <TouchableOpacity className="bg-primary p-3 rounded-full" onPress={() => navigation.navigate('RoomChat', { userId: data?.assignedTo?._id })}>
              <Ionicons name="chatbubble-ellipses-outline" size={24} color="#fff" />
            </TouchableOpacity>
          )}

          

            <TouchableOpacity
              onPress={() => navigation.navigate('PaymentDetail_Id', { workId: data?._id })}
              className="bg-border p-3 rounded-full flex-row items-center justify-center">
              <Ionicons name="newspaper-outline" size={24} color="#6B7280" />
            </TouchableOpacity>
          

          {data?.createdBy?._id !== user?._id && (
            <TouchableOpacity className="bg-primary p-3 rounded-full" onPress={() => navigation.navigate('RoomChat', { userId: data?.createdBy?._id })}>
              <Ionicons name="chatbubble-ellipses-outline" size={24} color="#fff" />
            </TouchableOpacity>
          )}

          {/* Action Buttons Based on Work Status */}
          {data?.workStatus === 'PUBLISHED' && data?.createdBy?._id === user?._id && (
            <TouchableOpacity onPress={() => handleJobPress()} className="bg-primary py-4 px-16 rounded-full flex-row items-center justify-center">
              <Text className="text-surface text-base font-semibold items-center">{t('workDetail.interested_freelancers')}</Text>
            </TouchableOpacity>
          )}
          {data?.workStatus === 'PUBLISHED' && data?.createdBy?._id !== user?._id && !hasApplied && (
            <TouchableOpacity onPress={() => handleApplicantPress()} className="bg-primary py-4 px-16 rounded-full flex-row items-center justify-center">
              <Text className="text-surface text-base font-semibold items-center">{t('workDetail.make_an_apply')}</Text>
            </TouchableOpacity>
          )}
          {data?.workStatus === 'PUBLISHED' && data?.createdBy?._id !== user?._id && hasApplied && (
            <View className="bg-blue-50 border border-border rounded-xl p-4 mb-2 mx-4">
              <Text className="text-body text-text">
                {t("workDetail.already_applied") || "You already applied for this job."}
              </Text>
            </View>
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
              // onPress={handleSubmitWork}
              onPress={() =>
                openActionConfirm({
                  title: t('workDetail.confirm'),
                  message: t('workDetail.confirm_work.message_send'),
                  actionText: t('chat.chatroom.send'),
                  variant: 'primary',
                  onConfirm: handleSubmitWork,
                })
              }
              disabled={submitState === 'submitted' || submitState === 'submitting'}
            >
              <Text className="text-surface text-base font-semibold">
                {submitState === 'submitted' ? `${t('workDetail.submitted')}` : submitState === 'submitting' ? `${t('workDetail.submitting')}` : submitState === 'error' ? `${t('workDetail.error')}` : `${t('workDetail.submit_work')}`}
              </Text>
            </TouchableOpacity>
          )}

          {data?.workStatus === 'AWAITING_COMPLETED' && data?.createdBy?._id === user?._id && (
            <View className=''>
              <TouchableOpacity
                className="bg-primary py-3 px-20 rounded-full"
                onPress={() =>
                  openActionConfirm({
                    title: t('workDetail.confirm_submit'),
                    message: t('workDetail.confirm_work.message_comfirm'),
                    actionText: t('workDetail.confirm'),
                    variant: 'primary',
                    onConfirm: handleConfirmWork,
                  })
                }
              >
                <Text className="text-surface text-base font-semibold">{t('workDetail.confirm_submit')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="border mt-3 border-error py-2  rounded-full"
                onPress={() =>
                  openActionConfirm({
                    title: t('workDetail.request_revision'),
                    message: t('workDetail.confirm_work.message_cancel'),
                    actionText: t('workDetail.request'),
                    variant: 'warning',
                    onConfirm: handleCancel,
                  })
                }
              >
                <Text className="text-error text-base self-center font-semibold">{t('workDetail.request_revision')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {data?.workStatus === 'AWAITING_COMPLETED' && data?.createdBy?._id !== user?._id && (
            <View className="bg-warning/50 py-3 px-16 rounded-full">
              <Text className="text-surface text-base font-semibold">{t('workDetail.pending_for_confirm')}</Text>
            </View>
          )}

          {data?.workStatus === 'COMPLETED' && data?.createdBy?._id !== user?._id && (
            <View className=" h-12 w-12 bg-success rounded-xl flex-row items-center justify-center">
              <Ionicons name='checkmark-outline' size={32} color='#fff' />
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
        // visible={showReviewModal}
        visible={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        freelancer={data}
        onSubmitReview={() => setIsReview(true)}
      />

      <Modal
        visible={showDeleteConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={closeDeleteConfirm}
      >
        <View className="flex-1 bg-black/40 justify-center items-center px-6">
          <View className="w-full bg-white rounded-2xl p-5 border border-border">
            <View className="flex-row items-center mb-3">
              {confirmModalVariant === 'primary' ?

                <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center mr-3">
                  <Ionicons name="checkbox" size={20} color="#F59E0B" />
                </View>
                :

                <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center mr-3">
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </View>

              }
              <Text className="text-base font-semibold text-text flex-1">{deleteConfirmTitle}</Text>
            </View>

            <Text className="text-body text-textSecondary mb-5">
              {deleteConfirmMessage}
            </Text>

            <View className="flex-row justify-end gap-2">
              <TouchableOpacity
                onPress={closeDeleteConfirm}
                className="px-4 py-2 rounded-full border border-border"
              >
                <Text className="text-textSecondary font-medium">{t('kyc.buttons.back') || 'back'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmDelete}
                className={`px-5 py-2 rounded-full ${confirmModalVariant === 'primary' ? "bg-primary" : "bg-error"}`}
              >
                <Text className="text-white font-semibold">
                  {confirmModalActionText || t('workDetail.delete')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <InterestedFreelancer
        visible={jobDetailVisible}
        onClose={handleCloseJobDetail}
        jobs={workData}
        refetch={refetch}
        onUserPress={handleUserProfileNavigation}
        isFreelancer={isFreelancer}
        user={user}
      />

      <View style={{ height: insets.bottom + 20 }} />
    </ScreenWrapper>
  );
}
