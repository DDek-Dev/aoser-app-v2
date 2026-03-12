import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { View, Text } from 'react-native';

type StatusDisplayProps = {
  status: string;
};

const StatusDisplay = ({ status }: StatusDisplayProps) => {

  const {t} = useTranslation();
  const statusConfig = {
    PUBLISHED: {
      text: t('postWork.status.published'),
      color: 'text-primary',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      icon: 'document-text-outline',
      iconColor: '#2563eb',
      description: 'Job is publicly available'
    },
    PRIVATE: {
      text: t('postWork.status.private'),
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      icon: 'lock-closed-outline',
      iconColor: '#4b5563',
      description: 'Visible only to you'
    },
    ASSIGNED_WORKER: {
      text: t('postWork.status.assigned'),
      color: 'text-primary',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      icon: 'person-outline',
      iconColor: '#9333ea',
      description: 'Freelancer assigned'
    },
    ASSIGNED_AWAIT_PAYMENT: {
      text: t('postWork.status.awaiting_payment'),
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      icon: 'time-outline',
      iconColor: '#d97706',
      description: 'Waiting for payment confirmation'
    },
    DOING: {
      text: t('postWork.status.in_progress'),
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: 'play-circle-outline',
      iconColor: '#16a34a',
      description: 'Work in progress'
    },
    AWAITING_COMPLETED: {
      text: t('postWork.status.pending_review'),
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      icon: 'time-outline',
      iconColor: '#4f46e5',
      description: 'Waiting for completion confirmation'
    },
    COMPLETED: {
      text: t('postWork.status.completed'),
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      icon: 'checkmark-circle-outline',
      iconColor: '#059669',
      description: 'Job successfully completed'
    },
    DELAY: {
      text: t('postWork.status.delayed'),
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: 'alert-circle-outline',
      iconColor: '#dc2626',
      description: 'Job is behind schedule'
    }
  };

  const config = statusConfig[status as keyof typeof statusConfig];

  if (!config) return null;

  return (
    <View className={`px-3 py-1.5 rounded-full border ${config.bgColor} ${config.borderColor} flex-row items-center space-x-2`}>
      <Ionicons name={config.icon as any} size={14} color={config.iconColor} />
      <Text className={`text-sm font-medium ${config.color}`}>
        {config.text}
      </Text>
    </View>
  );
};


export default StatusDisplay;
