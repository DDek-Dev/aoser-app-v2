import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { 
  ScrollView, 
  Text, 
  TouchableOpacity, 
  View, 
  Modal, 
  Dimensions,
  Pressable
} from "react-native";

interface DropdownProps {
  
  label: string;
  value?: string;
  placeholder: string;
  options: { label: string; value: any }[];
  onSelect: (option: any) => void;
  disabled?: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({
  label,
  value,
  placeholder,
  options,
  onSelect,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { width, height } = Dimensions.get('window');
  const {t} = useTranslation();

  // Modal dimensions - 80% of screen width, 60% of screen height
  const modalWidth = width * 0.8;
  const modalHeight = height * 0.6;

  const handleSelect = (option: any) => {
    onSelect(option);
    setIsOpen(false);
  };

  return (
    <View className="mb-4">
      <Text className="text-body font-medium text-text mb-2">{label}</Text>
      
      {/* Dropdown Trigger Button */}
      <TouchableOpacity
        onPress={() => !disabled && setIsOpen(true)}
        className={`
          flex-row items-center justify-between 
          px-4 py-3 rounded-2xl border
          ${disabled
            ? 'bg-gray-100 border-gray-200'
            : 'bg-surface border-border'
          }
        `}
        disabled={disabled}
      >
        <Text className={`
          text-body flex-1 mr-2
          ${value
            ? 'text-text'
            : 'text-textSecondary'
          }
          ${disabled ? 'text-gray-400' : ''}
        `}
        numberOfLines={1}
        ellipsizeMode="tail"
        >
          {value || placeholder}
        </Text>

        <Ionicons
          name="chevron-down"
          size={24}
          color={disabled ? '#9CA3AF' : '#6B7280'}
        />
      </TouchableOpacity>

      {/* Modal Popup */}
      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        {/* Background Overlay */}
        <Pressable 
          className="flex-1 bg-black bg-opacity-50 justify-center items-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onPress={() => setIsOpen(false)}
        >
          {/* Modal Content */}
          <Pressable
            style={{
              width: modalWidth,
              height: modalHeight,
            }}
            onPress={() => {}} // Prevent closing when clicking inside modal
          >
            <View 
              className="bg-white rounded-xl shadow-2xl flex-1"
              style={{
                elevation: 10,
              }}
            >
              {/* Header */}
              <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-800">
                    {t('customerProfile.select')} {label}
                  </Text>
                  <Text className="text-sm text-gray-500 mt-1">
                    {options.length} {t('customerProfile.option_avaiblable')}
                  </Text>
                </View>
                
                {/* Close Button */}
                <TouchableOpacity
                  onPress={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center ml-3"
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Options List */}
              <View className="flex-1">
                {options.length > 0 ? (
                  <ScrollView 
                    showsVerticalScrollIndicator={true}
                    contentContainerStyle={{ 
                      paddingVertical: 8,
                      flexGrow: 1 
                    }}
                    style={{ flex: 1 }}
                  >
                    {options.map((option, index) => (
                      <TouchableOpacity
                        key={`${option.value?._id || option.value?.id || index}`}
                        onPress={() => handleSelect(option.value)}
                        className={`
                          flex-row items-center px-4 py-3 mx-2 rounded-2xl
                          ${value === option.label ? 'bg-blue-50' : 'active:bg-gray-50'}
                        `}
                        activeOpacity={0.7}
                      >
                        <Text 
                          className={`
                            text-base flex-1 mr-3
                            ${value === option.label ? 'text-blue-600 font-medium' : 'text-gray-800'}
                          `}
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >
                          {option.label}
                        </Text>
                        
                        {/* Selected Indicator */}
                        {value === option.label && (
                          <View className="w-6 h-6 bg-blue-500 rounded-full items-center justify-center">
                            <Ionicons 
                              name="checkmark" 
                              size={16} 
                              color="white" 
                            />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : (
                  /* No Options Available */
                  <View className="flex-1 items-center justify-center">
                    <Ionicons name="list-outline" size={48} color="#D1D5DB" />
                    <Text className="text-lg text-gray-500 mt-2">
                      No options available
                    </Text>
                    <Text className="text-sm text-gray-400 mt-1 text-center px-8">
                      There are no {label.toLowerCase()} options to choose from
                    </Text>
                  </View>
                )}
              </View>

              {/* Footer (Optional - shows current selection) */}
              {value && (
                <View className="border-t border-gray-200 px-4 py-3">
                  <Text className="text-sm text-gray-600">
                    Currently selected:
                  </Text>
                  <Text className="text-base font-medium text-gray-800 mt-1">
                    {value}
                  </Text>
                </View>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

export default Dropdown;