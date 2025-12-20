import { Modal, Platform, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getCurrentLanguage } from 'utils/dateFormatter';

interface DatePickerProps {
  visible: boolean;
  date: Date | null; // Allow null
  tempDate: Date;
  setTempDate: (date: Date) => void;
  setDate: (date: Date) => void;
  onClose: () => void;
}

const DatePicker = ({
  visible,
  date,
  tempDate,
  setTempDate,
  setDate,
  onClose,
}: DatePickerProps) => {
  if (!visible) return null;

  // Use tempDate for both iOS and Android, fallback to today only for the picker display
  const displayDate = Platform.OS === 'ios' ? tempDate : (date || new Date());

  const currentLanguage = getCurrentLanguage();
  const locale = currentLanguage === 'la' ? 'lo' : 'en-US';
  const confirmText = currentLanguage === 'la' ? 'ຢືນຢັນ' : 'Confirm';

  return (
    <Modal transparent animationType="fade">
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          // backgroundColor: 'rgba(0,0,0,0.4)',
        }}
      >
        <View
          style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 16,
            alignItems: 'center',
            width: '80%',
          }}
        >
          <DateTimePicker
            value={displayDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
            locale={locale}
            onChange={(event, selectedDate) => {
              if (Platform.OS === 'ios') {
                if (selectedDate) setTempDate(selectedDate);
              } else {
                onClose();
                if (selectedDate) setDate(selectedDate);
              }
            }}
          />

          {Platform.OS === 'ios' && (
            <TouchableOpacity
              onPress={() => {
                setDate(tempDate);
                onClose();
              }}
              style={{
                marginTop: 16,
                paddingHorizontal: 24,
                paddingVertical: 12,
                backgroundColor: '#2563EB',
                borderRadius: 10,
              }}
            >
              <Text style={{ color: 'white' }}>{confirmText}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default DatePicker;