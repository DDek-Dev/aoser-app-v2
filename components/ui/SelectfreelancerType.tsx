import { forwardRef, useImperativeHandle, useState, useTransition } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';


type FreelancerTypeOptions = {
  value: string;  // Uppercase value (FULLTIME/PARTTIME)
  display: string; // Display text (Full-time/Part-time)
};

type Props = {
  label: string;
  inputClassName?: string;
  options: FreelancerTypeOptions[];
  value: string; // This will be uppercase (FULLTIME/PARTTIME)
  required?: boolean;
  onSelect: (value: string) => void; // Returns uppercase value
};

const SelectFreelancerType = forwardRef<{ focus: () => void }, Props>(
  ({ label, options, required, inputClassName, value, onSelect }, ref) => {
    const [modalVisible, setModalVisible] = useState(false);

    const { t } = useTranslation();
    // Define the display mapping
    const FREELANCER_TYPE_DISPLAY = {
      FULLTIME: t('kyc.step1.freelancerType.fulltime'),
      PART_TIME: t('kyc.step1.freelancerType.parttime')
    
    };

    useImperativeHandle(ref, () => ({
      focus: () => {
        setModalVisible(true);
      },
    }));

    // Get display text for current value
    const displayValue = FREELANCER_TYPE_DISPLAY[value as keyof typeof FREELANCER_TYPE_DISPLAY] || value;

    return (
      <View className="mb-4 mt-6">
        <Text className="text-body text-text mb-1 font-bold">
          {label} {required && <Text className="text-error">*</Text>}
        </Text>

        <TouchableOpacity
          className={`border ${inputClassName} rounded-xl px-4 py-4 bg-white flex-row justify-between items-center`}
          onPress={() => setModalVisible(true)}
        >
          <Text className={`text-caption ${value ? 'text-text' : 'text-gray-400'}`}>
            {displayValue || 'Select an option'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#6B7280" />
        </TouchableOpacity>

        <Modal visible={modalVisible} transparent animationType="fade">
          <Pressable
            onPress={() => setModalVisible(false)}
            className="flex-1 bg-black/50 justify-center items-center"
          >
            <View className="bg-white rounded-2xl border border-border w-[85%] max-h-[50%] py-4 px-4">
              {/* <Text className="text-base font-semibold text-center mb-4">Select Freelancer Type</Text> */}
              <ScrollView showsVerticalScrollIndicator={false}>
                {options.map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    className="py-3 border-b border-border flex-row justify-between items-center"
                    onPress={() => {
                      onSelect(item.value); // Pass the uppercase value
                      setModalVisible(false);
                    }}
                  >
                    <Text className="text-body text-text">{item.display}</Text>
                    {value === item.value && (
                      <Ionicons name="checkmark" size={20} color="#2563EB" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="mt-4 items-center"
              >
                <Text className="text-base text-primary">{t('kyc.buttons.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      </View>
    );
  }
);

export default SelectFreelancerType;