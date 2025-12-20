// SelectInput.tsx
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGetServiceTypes, useGetJobsByServiceType } from 'hooks/useFreelancer';
import React from 'react';
import LoadingScreen from 'screens/Loading/LoadingScreen';
import { useTranslation } from 'react-i18next';

type Props = {
  label: string;
  inputClassName?: string;
  value: string;
  required?: boolean;
  isValidate?: string;
  initialSubcategories?: string[];
  onSelect: (category: string, subcategories: string[]) => void;
};

const SelectInput = forwardRef<{ focus: () => void }, Props>(
  ({ label, required, inputClassName, isValidate, initialSubcategories = [], value, onSelect }, ref) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(initialSubcategories);
    const [selectedCategory, setSelectedCategory] = useState(value);

    // Fetch service types
    const { data: serviceTypes, isLoading } = useGetServiceTypes();
    // Fetch jobs when service type is selected
    const { data: jobs } = useGetJobsByServiceType(selectedCategory);
    const {t} = useTranslation();
    useImperativeHandle(ref, () => ({
      focus: () => setModalVisible(true),
    }));

    // Update internal state when props change
    // useEffect(() => {
    //   setSelectedCategory(value);
    //   setSelectedSubcategories(initialSubcategories || []);
    // }, [value, initialSubcategories]);

    // Notify parent when selection changes
    useEffect(() => {
      if (selectedCategory) {
        onSelect(selectedCategory, selectedSubcategories);
      }
    }, [selectedCategory, selectedSubcategories]);

    const handleCategoryChange = (id: string) => {
      setSelectedCategory(id);
      onSelect(id, []);
      setSelectedSubcategories([]); // Clear old subcategories when category changes
      setModalVisible(false);
    };

    const handleToggleSubcategory = (jobId: string) => {
      // setSelectedSubcategories(prev =>
      //   prev.includes(jobId)
      //     ? prev.filter(c => c !== jobId)
      //     : [...prev, jobId]
      // );

      setSelectedSubcategories(prev => {
    const newSubcategories = prev.includes(jobId)
      ? prev.filter(c => c !== jobId)
      : [...prev, jobId];
    
    // Don't call onSelect here - it causes the render error
    return newSubcategories;
      });


    };

    const selectedServiceType = serviceTypes?.find(st => st._id === selectedCategory);
    const displayValue = selectedServiceType?.name || 'Select a service type';

    return (
      <View className="mb-4">
        <Text className="text-body text-text mb-1 font-bold">
          {label} {required && <Text className="text-error">*</Text>}
        </Text>

        {/* Display selected category */}
        <TouchableOpacity
          className={`border ${inputClassName} rounded-xl px-4 py-4 bg-white flex-row justify-between items-center border border-border`}
          onPress={() => setModalVisible(true)}
        >
          <View className="flex-row items-center">
            <Text className={`text-body ${selectedCategory ? 'text-text' : 'text-gray-400'}`}>
              {displayValue}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={20} color="#6B7280" />
        </TouchableOpacity>

        <Text className='text-caption text-error mt-1 '>{isValidate}</Text>

        {/* Service Type Modal */}
        <Modal visible={modalVisible} transparent animationType="fade">
          <Pressable
            onPress={() => setModalVisible(false)}
            className="flex-1 bg-black/50 justify-center items-center"
          >
            <View className="bg-white rounded-2xl border border-border w-[85%] max-h-[60%]">
              {isLoading ? (
                <View className="p-4 items-center">
                  <LoadingScreen/>
                 
                </View>
              ) : (
                <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                  {serviceTypes?.map((serviceType) => (
                    <TouchableOpacity
                      key={serviceType._id}
                      className="px-4 py-3 border-b border-border flex-row items-center gap-2 justify-between"
                      onPress={() => handleCategoryChange(serviceType._id)}
                    >
                      <View className='flex-row items-center gap-2'>
                        <Text className="text-caption text-text">{serviceType.name}</Text>
                      </View>
                      {selectedCategory === serviceType._id && (
                        <Ionicons name="checkmark" size={20} color="#2563EB" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </Pressable>
        </Modal>

        {/* Jobs Selector (Subcategories) - Only show if category is selected */}
        {selectedCategory && jobs && jobs.length > 0 && (
          <>
            <Text className="text-body text-text font-semibold mb-2 mt-4">{t('postWork.select_jobs')}</Text>
            <View className="bg-blue-50 rounded-xl p-4 space-y-2">
              {jobs.map((job) => {
                const isSelected = selectedSubcategories.includes(job._id);
                return (
                  <Pressable
                    key={job._id}
                    onPress={() => handleToggleSubcategory(job._id)}
                    className="flex-row items-center justify-between mb-2 px-4 py-3 bg-white rounded-xl"
                  >
                    <Text className="text-text text-caption">{job.title}</Text>
                    <View className={`w-5 h-5 rounded-full border-2 ${isSelected ? 'bg-primary border-primary' : 'border-border'
                      }`}>
                      {isSelected && (
                        <Ionicons name="checkmark" size={14} color="white" />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
      </View>
    );
  }
);

export default SelectInput;