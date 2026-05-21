// SubWorkDetailsInput.tsx
import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Keyboard, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

type SubTask = {
  title: string;
  subWorkStatus: "TODO" | "DOING" | "DONE" | "DELAY" | "FAILED";
};

type SubWorkDetail = {
  sectionTitle: string;
  subTask: SubTask[];
};

type Props = {
  subWorkDetails: SubWorkDetail[];
  setSubWorkDetails: React.Dispatch<React.SetStateAction<SubWorkDetail[]>>;
  isReq?: boolean;
};

const SubWorkDetailsInput = ({ subWorkDetails, setSubWorkDetails, isReq }: Props) => {
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSubTaskTitles, setNewSubTaskTitles] = useState<{ [key: number]: string }>({});
  const sectionInputRef = useRef<TextInput>(null);
  const subTaskInputRefs = useRef<{ [key: string]: TextInput }>({});
  const { t } = useTranslation();
  const handleAddSection = () => {
    if (newSectionTitle.trim()) {
      const newSection: SubWorkDetail = {
        sectionTitle: newSectionTitle.trim(),
        subTask: []
      };
      setSubWorkDetails([...subWorkDetails, newSection]);
      setNewSectionTitle('');
      // Focus on the first subtask input of the new section
      setTimeout(() => {
        const lastIndex = subWorkDetails.length;
        subTaskInputRefs.current[`${lastIndex}-0`]?.focus();
      }, 100);
    }
  };

  const handleAddSubTask = (sectionIndex: number) => {
    const subTaskTitle = newSubTaskTitles[sectionIndex] || '';
    if (subTaskTitle.trim()) {
      const updated = [...subWorkDetails];
      const newSubTask: SubTask = {
        title: subTaskTitle.trim(),
        subWorkStatus: "TODO"
      };
      updated[sectionIndex].subTask.push(newSubTask);
      setSubWorkDetails(updated);

      // Clear the input and focus on it for next entry
      setNewSubTaskTitles({ ...newSubTaskTitles, [sectionIndex]: '' });
      setTimeout(() => {
        subTaskInputRefs.current[`${sectionIndex}-${updated[sectionIndex].subTask.length}`]?.focus();
      }, 100);
    }
  };

  const handleDeleteSection = (index: number) => {
    const updated = [...subWorkDetails];
    updated.splice(index, 1);
    setSubWorkDetails(updated);
  };

  const handleDeleteSubTask = (sectionIndex: number, subTaskIndex: number) => {
    const updated = [...subWorkDetails];
    updated[sectionIndex].subTask.splice(subTaskIndex, 1);
    setSubWorkDetails(updated);
  };

  const handleUpdateSectionTitle = (index: number, text: string) => {
    const updated = [...subWorkDetails];
    updated[index].sectionTitle = text;
    setSubWorkDetails(updated);
  };

  const handleUpdateSubTask = (sectionIndex: number, subTaskIndex: number, text: string) => {
    const updated = [...subWorkDetails];
    updated[sectionIndex].subTask[subTaskIndex].title = text;
    setSubWorkDetails(updated);
  };

  return (
    <View className="bg-blue-50 p-4 rounded-2xl mb-2">
      <Text className="text-body mb-1 text-text font-bold">{isReq ? t('postWork.sub_work_details_req') : t('postWork.sub_work_details')}</Text>
      <Text className="text-caption text-textSecondary ">
        {isReq ? t('postWork.add_sections_req'): t('postWork.add_sections')}
      </Text>

      <View>
        {subWorkDetails.map((section, sectionIndex) => (
          <View key={sectionIndex} className="mb-2 p-2 bg-white rounded-2xl border border-border">
            {/* Section Header */}
            <View className="flex-row items-center mb-3">
              <TextInput

                value={section.sectionTitle}
                onChangeText={(text) => handleUpdateSectionTitle(sectionIndex, text)}
                placeholder={ isReq ? t('workDetail.add_new_section_req') : t('workDetail.add_new_section')}

                placeholderTextColor="#6B7280"
                className="flex-1 text-body font-semibold border-b text-text border-border"
                style={{
                  minHeight: 52,
                  paddingVertical: Platform.OS === 'ios' ? 10 : 8,
                }}
              />
              <TouchableOpacity
                onPress={() => handleDeleteSection(sectionIndex)}
                className="ml-2 p-2"
              >
                <Ionicons name="trash-outline" size={20} color="red" />
              </TouchableOpacity>
            </View>

            {/* Subtasks */}
            {section.subTask.map((task, taskIndex) => (
              <View key={taskIndex} className="flex-row items-center mb-2 ml-4">
                <Text>•</Text>
                <TextInput
                  value={task.title}
                  onChangeText={(text) => handleUpdateSubTask(sectionIndex, taskIndex, text)}
                  placeholder={t('workDetail.add_sub_task')}
                  placeholderTextColor="#6B7280"

                  className="flex-1 text-body rounded-2xl  border-b text-text border-border"
                  style={{
                    minHeight: 52,
                    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
                  }}
                  ref={(ref) => {
                    if (ref) {
                      subTaskInputRefs.current[`${sectionIndex}-${taskIndex}`] = ref;
                    }
                  }}
                />
                <TouchableOpacity
                  onPress={() => handleDeleteSubTask(sectionIndex, taskIndex)}
                  className="ml-2 p-1"
                >
                  <Ionicons name="close-circle" size={20} color="red" />
                </TouchableOpacity>
              </View>
            ))}

            {/* Add Subtask Input */}
            <View className="flex-row items-center ml-4 mt-2">
              <TextInput
                placeholder={t('workDetail.add_sub_task')}
                value={newSubTaskTitles[sectionIndex] || ''}
                onChangeText={(text) => setNewSubTaskTitles({
                  ...newSubTaskTitles,
                  [sectionIndex]: text
                })}
                className="flex-1 border border-border bg-white mb-2 text-text px-3 rounded-2xl text-body"
                style={{
                  minHeight: 52,
                  paddingVertical: Platform.OS === 'ios' ? 12 : 10,
                }}
                onSubmitEditing={() => handleAddSubTask(sectionIndex)}
                ref={(ref) => {
                  if (ref) {
                    subTaskInputRefs.current[`${sectionIndex}-${section.subTask.length}`] = ref;
                  }
                }}
                placeholderTextColor="#6B7280"
              />
              <TouchableOpacity
                onPress={() => handleAddSubTask(sectionIndex)}
                className="ml-2 p-2 bg-blue-100 rounded-full"
              >
                <Ionicons name="add" size={20} color="#3B82F6" />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Add New Section */}
        <View className="flex-row items-center mt-4">
          <TextInput
            placeholder={ isReq ? t('workDetail.add_new_section_req') : t('workDetail.add_new_section') }
            value={newSectionTitle}
            onChangeText={setNewSectionTitle}
            className="flex-1 border border-border bg-white text-text px-3 rounded-2xl"
            style={{
              minHeight: 52,
              paddingVertical: Platform.OS === 'ios' ? 12 : 10,
            }}
            onSubmitEditing={handleAddSection}
            ref={sectionInputRef}
            placeholderTextColor="#6B7280"

          />
          <TouchableOpacity
            onPress={handleAddSection}
            className="ml-2 p-3 bg-primary rounded-full"
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default SubWorkDetailsInput;