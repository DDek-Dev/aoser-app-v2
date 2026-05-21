// import { Modal, Platform, Text, TouchableOpacity, View } from 'react-native';
// import DateTimePicker from '@react-native-community/datetimepicker';
// import { getCurrentLanguage } from 'utils/dateFormatter';

// interface DatePickerProps {
//   visible: boolean;
//   date: Date | null; // Allow null
//   tempDate: Date;
//   setTempDate: (date: Date) => void;
//   setDate: (date: Date) => void;
//   onClose: () => void;
// }

// const DatePicker = ({
//   visible,
//   date,
//   tempDate,
//   setTempDate,
//   setDate,
//   onClose,
// }: DatePickerProps) => {
//   if (!visible) return null;

//   // Use tempDate for both iOS and Android, fallback to today only for the picker display
//   const displayDate = Platform.OS === 'ios' ? tempDate : (date || new Date());

//   const currentLanguage = getCurrentLanguage();
//   const locale = currentLanguage === 'la' ? 'lo' : 'en-US';
//   const confirmText = currentLanguage === 'la' ? 'ຢືນຢັນ' : 'Confirm';

//   return (
//     <Modal transparent animationType="fade">
//       <View
//         style={{
//           flex: 1,
//           justifyContent: 'center',
//           alignItems: 'center',
//           // backgroundColor: 'rgba(0,0,0,0.4)',
//         }}
//       >
//         <View
//           style={{
//             backgroundColor: '#fff',
//             borderRadius: 16,
//             padding: 16,
//             alignItems: 'center',
//             width: '80%',
//           }}
//         >
//           <DateTimePicker
//             value={displayDate}
//             mode="date"
//             display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
//             locale={locale}
//             onChange={(event, selectedDate) => {
//               if (Platform.OS === 'ios') {
//                 if (selectedDate) setTempDate(selectedDate);
//               } else {
//                 onClose();
//                 if (selectedDate) setDate(selectedDate);
//               }
//             }}
//           />

//           {Platform.OS === 'ios' && (
//             <TouchableOpacity
//               onPress={() => {
//                 setDate(tempDate);
//                 onClose();
//               }}
//               style={{
//                 marginTop: 16,
//                 paddingHorizontal: 24,
//                 paddingVertical: 12,
//                 backgroundColor: '#2563EB',
//                 borderRadius: 10,
//               }}
//             >
//               <Text style={{ color: 'white' }}>{confirmText}</Text>
//             </TouchableOpacity>
//           )}
//         </View>
//       </View>
//     </Modal>
//   );
// };

// export default DatePicker;



import { Modal, Platform, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getCurrentLanguage } from 'utils/dateFormatter';
import { useState } from 'react';

interface DatePickerProps {
  visible: boolean;
  date: Date | null;
  tempDate: Date;
  setTempDate: (date: Date) => void;
  setDate: (date: Date) => void;
  onClose: () => void;
  mode?: 'date' | 'time' | 'datetime';
}

const DatePicker = ({
  visible,
  date,
  tempDate,
  setTempDate,
  setDate,
  onClose,
  mode = 'date',
}: DatePickerProps) => {
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  if (!visible) return null;

  const displayDate = Platform.OS === 'ios' ? tempDate : (date || tempDate);
  const currentLanguage = getCurrentLanguage();
  const locale = currentLanguage === 'la' ? 'lo' : 'en-US';
  const confirmText = currentLanguage === 'la' ? 'ຢືນຢັນ' : 'Confirm';
  const nextText = currentLanguage === 'la' ? 'ຕໍ່ໄປ' : 'Next';

  // For Android datetime mode
  const handleAndroidDateChange = (event: any, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      onClose();
      return;
    }

    if (selectedDate) {
      if (mode === 'datetime') {
        setTempDate(selectedDate);
        setShowTimePicker(true);
      } else if (mode === 'date') {
        setDate(selectedDate);
        onClose();
      } else if (mode === 'time') {
        setDate(selectedDate);
        onClose();
      }
    }
  };

  const handleAndroidTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    
    if (event.type === 'dismissed') {
      onClose();
      return;
    }

    if (selectedTime) {
      // Combine date from tempDate with time from selectedTime
      const combinedDate = new Date(tempDate);
      combinedDate.setHours(selectedTime.getHours());
      combinedDate.setMinutes(selectedTime.getMinutes());
      combinedDate.setSeconds(0);
      combinedDate.setMilliseconds(0);
      setDate(combinedDate);
    }
    onClose();
  };

  // Android renders native pickers
  if (Platform.OS === 'android') {
    if (showTimePicker) {
      return (
        <DateTimePicker
          value={tempDate}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={handleAndroidTimeChange}
        />
      );
    }

    return (
      <DateTimePicker
        value={displayDate}
        mode={mode === 'datetime' ? 'date' : mode}
        display="default"
        onChange={handleAndroidDateChange}
        is24Hour={mode === 'time'}
      />
    );
  }

  // iOS renders inline pickers
  return (
    <Modal transparent animationType="fade" visible={visible}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.4)',
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 16,
            alignItems: 'center',
            width: '80%',
            maxWidth: 400,
          }}
        >
          {mode === 'datetime' && !showTimePicker && (
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12, color: '#1F2937' }}>
              {currentLanguage === 'la' ? 'ເລືອກວັນທີ' : 'Select Date'}
            </Text>
          )}

          {mode === 'datetime' && showTimePicker && (
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12, color: '#1F2937' }}>
              {currentLanguage === 'la' ? 'ເລືອກເວລາ' : 'Select Time'}
            </Text>
          )}

          <DateTimePicker
            value={tempDate}
            mode={mode === 'datetime' ? (showTimePicker ? 'time' : 'date') : mode}
            display="spinner"
            locale={locale}
            is24Hour={true}
            onChange={(event, selectedDate) => {
              if (selectedDate) {
                setTempDate(selectedDate);
              }
            }}
          />

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
            {mode === 'datetime' && !showTimePicker ? (
              <TouchableOpacity
                onPress={() => setShowTimePicker(true)}
                style={{
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  backgroundColor: '#2563EB',
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: 'white', fontWeight: '600' }}>{nextText}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  setDate(tempDate);
                  setShowTimePicker(false);
                  onClose();
                }}
                style={{
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  backgroundColor: '#2563EB',
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: 'white', fontWeight: '600' }}>{confirmText}</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default DatePicker;